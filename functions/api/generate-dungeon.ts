/**
 * Cloudflare Pages Function: Generate Dungeon
 * POST /api/generate-dungeon
 */

import { createClient } from '@supabase/supabase-js';
import { generateDungeonProcedural } from '../_lib/dungeon-generator/procedural';
import { GenerationLogger } from '../_lib/generation-logger';
import type { DungeonGenerationParams } from '../_lib/dungeon-generator/types';
import type { PagesFunction } from '@cloudflare/workers-types';

interface GenerateDungeonBody {
  world_id: string;
  name?: string;
  params: DungeonGenerationParams;
  use_ai?: boolean;
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: GenerateDungeonBody;
  try {
    body = (await request.json()) as GenerateDungeonBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!body.world_id) {
    return new Response(JSON.stringify({ error: 'world_id required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Create a generation_request row
  const { data: reqRow, error: reqErr } = await supabase
    .from('generation_request')
    .insert({
      kind: 'dungeon',
      prompt: {
        worldId: body.world_id,
        name: body.name ?? null,
        params: body.params,
      },
      model: 'procedural',
    })
    .select()
    .single();

  if (reqErr || !reqRow) {
    return new Response(JSON.stringify({ error: reqErr?.message || 'insert request failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Initialize generation logger
  const logger = new GenerationLogger(supabase, reqRow.id, body.world_id);

  try {
    await logger.startStep('procedural_generation');

    // Generate dungeon procedurally
    const dungeon = generateDungeonProcedural({
      ...body.params,
      world_id: body.world_id,
    });

    // Update dungeon name if provided
    if (body.name) {
      dungeon.identity.name = body.name;
    }

    await logger.endStep('procedural_generation', {
      total_rooms: dungeon.structure.levels.reduce((sum, level) => sum + level.rooms.length, 0),
      total_corridors: dungeon.structure.levels.reduce((sum, level) => sum + level.corridors.length, 0),
      total_doors: dungeon.structure.levels.reduce(
        (sum, level) => sum + level.rooms.reduce((roomSum, room) => roomSum + room.doors.length, 0),
        0
      ),
      num_levels: dungeon.structure.levels.length,
    });

    // TODO: AI Enhancement (Phase 4)
    // if (body.use_ai !== false && body.params.use_ai !== false) {
    //   await logger.startStep('ai_enhancement');
    //   // Enhance dungeon with AI
    //   await logger.endStep('ai_enhancement');
    // }

    // Save to world_element
    await logger.startStep('save_dungeon');

    const { data: elementData, error: elementError } = await supabase
      .from('world_element')
      .insert({
        world_id: body.world_id,
        type: 'dungeon',
        name: dungeon.identity.name,
        summary: `${dungeon.identity.type} - ${dungeon.identity.theme}`,
        detail: dungeon,
      })
      .select()
      .single();

    if (elementError || !elementData) {
      await logger.log({
        step: 'save_dungeon',
        logType: 'error',
        message: elementError?.message || 'Failed to save dungeon',
      });
      throw new Error(elementError?.message || 'Failed to save dungeon');
    }

    await logger.endStep('save_dungeon', { dungeon_id: elementData.id });

    // Flush logs
    await logger.flush();

    return new Response(
      JSON.stringify({
        dungeon_id: elementData.id,
        dungeon,
        generation_log: {
          request_id: reqRow.id,
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    await logger.log({
      step: 'generation',
      logType: 'error',
      message: error instanceof Error ? error.message : String(error),
      data: { error: String(error) },
    });
    await logger.flush();

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Generation failed',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};

