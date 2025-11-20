import { createClient } from '@supabase/supabase-js';
import { generateNPCPortrait, uploadPortraitToStorage } from '../_lib/npc-portrait';
import type { GeneratedNPC } from '../_lib/npc-procedural';

interface RegeneratePortraitBody {
  npcId: string;
  worldId: string;
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

  let body: RegeneratePortraitBody;
  try {
    body = (await request.json()) as RegeneratePortraitBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!body.npcId || !body.worldId) {
    return new Response(JSON.stringify({ error: 'npcId and worldId required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Fetch NPC data
  const { data: npc, error: fetchError } = await supabase
    .from('world_npc')
    .select('*')
    .eq('id', body.npcId)
    .eq('world_id', body.worldId)
    .single();

  if (fetchError || !npc) {
    return new Response(JSON.stringify({ error: fetchError?.message || 'NPC not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Convert NPC to GeneratedNPC format for portrait generation
  const npcDraft: GeneratedNPC = {
    name: npc.name,
    bio: npc.bio || undefined,
    backstory: npc.backstory || undefined,
    traits: (npc.traits as GeneratedNPC['traits']) || {},
    stats: (npc.stats as GeneratedNPC['stats']) || {},
  };

  // Generate new portrait
  const portraitEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  if (!portraitEnabled) {
    return new Response(JSON.stringify({ error: 'Portrait generation is disabled' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const portraitBuffer = await generateNPCPortrait(npcDraft, {
      CF_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
      CF_WORKERS_AI_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
    });

    if (!portraitBuffer) {
      return new Response(JSON.stringify({ error: 'Failed to generate portrait' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Delete old portrait if it exists
    if (npc.image_url) {
      try {
        const urlParts = npc.image_url.split('/npc-portraits/');
        if (urlParts.length > 1) {
          const fileName = `npc-portraits/${urlParts[1]}`;
          await supabase.storage.from('npc-assets').remove([fileName]);
        }
      } catch (storageError) {
        console.warn('Failed to delete old portrait:', storageError);
        // Continue with upload
      }
    }

    // Upload new portrait
    const portraitUrl = await uploadPortraitToStorage(supabase, npc.id, portraitBuffer);

    if (!portraitUrl) {
      return new Response(JSON.stringify({ error: 'Failed to upload portrait' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Update NPC with new portrait URL
    const { error: updateError } = await supabase
      .from('world_npc')
      .update({ image_url: portraitUrl })
      .eq('id', npc.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, image_url: portraitUrl }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Portrait regeneration error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};

