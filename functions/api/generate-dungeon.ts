/**
 * Cloudflare Pages Function: Generate Dungeon
 * POST /api/generate-dungeon
 */

import { createClient } from '@supabase/supabase-js';
import { generateDungeonProcedural } from '../_lib/dungeon-generator/procedural';
import { GenerationLogger } from '../_lib/generation-logger';
import { runSystemDiagnostics, logDiagnostics } from '../_lib/diagnostics';
import { generateDungeonMapImage, uploadMapToStorage } from '../_lib/dungeon-ai-generator';
import type { DungeonGenerationParams, DungeonDetail } from '../_lib/dungeon-generator/types';
import type { PagesFunction } from '@cloudflare/workers-types';

interface GenerateDungeonBody {
  world_id: string;
  name?: string;
  params: DungeonGenerationParams;
  use_ai?: boolean;
  preview?: boolean;
  detail?: DungeonDetail;
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
  const cfToken = env.CF_WORKERS_AI_TOKEN as string | undefined;
  const cfAccountId = env.CF_ACCOUNT_ID as string | undefined;
  const aiPreference = body.use_ai ?? body.params?.use_ai ?? true;
  const aiEnvReady = Boolean(cfToken && cfAccountId);
  const aiEnabled = aiPreference && aiEnvReady;
  const storageBaseId = body.preview ? `preview-${reqRow.id}` : reqRow.id;

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

  // Run system diagnostics (development/debugging)
  logger.startStep('config_check');
  logger.log({
    step: 'config_check',
    logType: 'diagnostic',
    message: 'Running system diagnostics before dungeon generation',
  });
  
  const diagnostics = await runSystemDiagnostics(supabase, env);
  logDiagnostics(logger, diagnostics);
  
  // Log diagnostic summary
  logger.log({
    step: 'config_check',
    logType: diagnostics.overallStatus === 'unhealthy' ? 'error' : diagnostics.overallStatus === 'degraded' ? 'warning' : 'info',
    message: `Diagnostics complete: ${diagnostics.overallStatus} (${diagnostics.summary.passed}/${diagnostics.summary.total} checks passed)`,
    data: {
      summary: diagnostics.summary,
      failedChecks: diagnostics.checks.filter(c => c.status === 'fail').map(c => c.check),
      warnings: diagnostics.checks.filter(c => c.status === 'warning').map(c => c.check),
    },
  });
  logger.endStep('config_check');

  try {
    let dungeon: DungeonDetail;
    const usingProvidedDetail = Boolean(body.detail);

    if (!usingProvidedDetail) {
      logger.startStep('procedural');
      logger.log({
        step: 'procedural',
        logType: 'info',
        message: 'Starting procedural dungeon generation',
        data: { params: body.params },
      });
      
      dungeon = generateDungeonProcedural({
        ...body.params,
        world_id: body.world_id,
      });
      
      logger.log({
        step: 'procedural',
        logType: 'info',
        message: 'Procedural generation complete',
        data: {
          total_rooms: dungeon.structure.levels.reduce((sum, level) => sum + level.rooms.length, 0),
          total_corridors: dungeon.structure.levels.reduce((sum, level) => sum + level.corridors.length, 0),
          total_doors: dungeon.structure.levels.reduce(
            (sum, level) => sum + level.rooms.reduce((roomSum, room) => roomSum + room.doors.length, 0),
            0
          ),
          num_levels: dungeon.structure.levels.length,
        },
      });
      logger.endStep('procedural');
    } else {
      dungeon = body.detail!;
    }

    // Update dungeon name if provided
    if (body.name) {
      dungeon.identity.name = body.name;
    }

    if (!aiPreference) {
      logger.log({
        step: 'ai_map_generation',
        logType: 'info',
        message: 'AI map generation disabled via request payload',
      });
    } else if (!aiEnvReady) {
      logger.log({
        step: 'ai_map_generation',
        logType: 'warning',
        message: 'AI map generation skipped: Missing CF_WORKERS_AI_TOKEN or CF_ACCOUNT_ID',
      });
    }

    // Generate AI map images if enabled
    const aiAlreadyProvided = usingProvidedDetail && dungeon.structure.levels.every((level) => Boolean(level.map_image_url));
    const shouldGenerateAI = aiEnabled && !aiAlreadyProvided;

    if (aiAlreadyProvided) {
      logger.log({
        step: 'ai_map_generation',
        logType: 'info',
        message: 'AI map generation skipped: map_image_url already provided in detail payload',
      });
    }

    if (shouldGenerateAI) {
      logger.startStep('ai_map_generation');
      logger.log({
        step: 'ai_map_generation',
        logType: 'info',
        message: 'Starting AI map generation for dungeon levels',
        data: { num_levels: dungeon.structure.levels.length },
      });

      try {
        // Generate maps for each level
        for (const level of dungeon.structure.levels) {
          const seed = Math.floor(Math.random() * 1_000_000_000);
          const startedAt = Date.now();
          logger.log({
            step: 'ai_map_generation',
            logType: 'info',
            message: `Generating AI map for level ${level.level_index}: ${level.name}`,
            data: {
              level_index: level.level_index,
              level_name: level.name,
              seed,
            },
          });

          try {
            // Generate map image
            const imageData = await generateDungeonMapImage(
              level,
              {
                dungeonType: dungeon.identity.type,
                width: level.grid.width,
                height: level.grid.height,
                seed,
              },
              cfToken!,
              cfAccountId!
            );

            logger.log({
              step: 'ai_map_generation',
              logType: 'info',
              message: `AI map generated for level ${level.level_index}, uploading to storage`,
              data: {
                level_index: level.level_index,
                seed,
              },
            });

            const mapUrl = await uploadMapToStorage(
              imageData,
              storageBaseId,
              level.level_index,
              supabaseUrl,
              serviceKey
            );

            // Store URL in level (will be updated with real dungeon ID after save)
            level.map_image_url = mapUrl;

            logger.log({
              step: 'ai_map_generation',
              logType: 'info',
              message: `Map uploaded successfully for level ${level.level_index}`,
              data: {
                level_index: level.level_index,
                seed,
                map_url: mapUrl,
                storage_path: `${storageBaseId}/${level.level_index}.png`,
                duration_ms: Date.now() - startedAt,
              },
            });
          } catch (levelError) {
            logger.log({
              step: 'ai_map_generation',
              logType: 'warning',
              message: `Failed to generate AI map for level ${level.level_index}: ${levelError instanceof Error ? levelError.message : String(levelError)}`,
            });
            // Continue with other levels even if one fails
          }
        }

        logger.endStep('ai_map_generation');
      } catch (aiError) {
        logger.log({
          step: 'ai_map_generation',
          logType: 'warning',
          message: `AI map generation failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`,
        });
        logger.endStep('ai_map_generation');
        // Continue without AI maps - fallback to procedural rendering
      }
    }

    const processLog = logger.getLogs();

    if (body.preview) {
      await logger.flush();
      return new Response(
        JSON.stringify({
          preview: true,
          dungeon,
          generation_log: { request_id: reqRow.id, entries: processLog },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Save to world_element
    logger.startStep('final');
    logger.log({
      step: 'final',
      logType: 'info',
      message: 'Saving dungeon to database',
    });

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
      logger.log({
        step: 'final',
        logType: 'error',
        message: elementError?.message || 'Failed to save dungeon',
      });
      throw new Error(elementError?.message || 'Failed to save dungeon');
    }

    logger.log({
      step: 'final',
      logType: 'info',
      message: 'Dungeon saved successfully',
      data: { dungeon_id: elementData.id },
    });
    logger.endStep('final');

    // Flush logs
    await logger.flush();

    return new Response(
      JSON.stringify({
        dungeon_id: elementData.id,
        dungeon,
        generation_log: {
          request_id: reqRow.id,
          entries: processLog,
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    logger.log({
      step: 'final',
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

