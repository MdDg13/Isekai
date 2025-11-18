/**
 * Cloudflare Pages Function: Get Context Pack
 * 
 * Fetches curated source snippets for world generation.
 * Wraps Supabase RPC function with Cloudflare edge caching.
 * 
 * GET /api/get-context-pack?tags=npc,wizard&culture=urban&limit=10
 */

import { createClient } from '@supabase/supabase-js';
import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Parse query parameters
  const tagsParam = url.searchParams.get('tags');
  const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : null;
  const culture = url.searchParams.get('culture') || null;
  const biome = url.searchParams.get('biome') || null;
  const tone = url.searchParams.get('tone') || null;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const minQuality = parseFloat(url.searchParams.get('min_quality') || '80');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase configuration' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase.rpc('get_context_pack', {
      p_world_id: null,
      p_tags: tags,
      p_culture: culture,
      p_biome: biome,
      p_tone: tone,
      p_limit: limit,
      p_min_quality: minQuality
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ snippets: data || [] }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};

