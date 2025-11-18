/**
 * Cloudflare Pages Function: Get Random Snippets
 * 
 * Returns random source snippets with diversity checking.
 * Useful for weighted selection in generation pipelines.
 * 
 * GET /api/get-random-snippets?tags=npc&count=5&ensure_diversity=true
 */

import { createClient } from '@supabase/supabase-js';
import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Parse query parameters
  const tagsParam = url.searchParams.get('tags');
  const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : null;
  
  const excludeTagsParam = url.searchParams.get('exclude_tags');
  const excludeTags = excludeTagsParam ? excludeTagsParam.split(',').map(t => t.trim()) : null;
  
  const count = parseInt(url.searchParams.get('count') || '5', 10);
  const minQuality = parseFloat(url.searchParams.get('min_quality') || '80');
  const ensureDiversity = url.searchParams.get('ensure_diversity') !== 'false';

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

    const { data, error } = await supabase.rpc('get_random_snippets', {
      p_tags: tags,
      p_exclude_tags: excludeTags,
      p_count: count,
      p_min_quality: minQuality,
      p_ensure_diversity: ensureDiversity
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
          'cache-control': 'public, max-age=60' // Cache for 1 minute (random results)
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

