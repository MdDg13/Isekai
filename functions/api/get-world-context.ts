/**
 * Cloudflare Pages Function: Get World Context
 * 
 * Combines existing world elements with relevant source snippets.
 * Used when generating new elements for an existing world.
 * 
 * GET /api/get-world-context?world_id=<uuid>&element_type=npc&snippet_count=10
 */

import { createClient } from '@supabase/supabase-js';
import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const worldId = url.searchParams.get('world_id');
  if (!worldId) {
    return new Response(
      JSON.stringify({ error: 'world_id parameter is required' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const elementType = url.searchParams.get('element_type') || null;
  const includeSnippets = url.searchParams.get('include_snippets') !== 'false';
  const snippetCount = parseInt(url.searchParams.get('snippet_count') || '10', 10);

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

    const { data, error } = await supabase.rpc('get_world_context', {
      p_world_id: worldId,
      p_element_type: elementType,
      p_include_snippets: includeSnippets,
      p_snippet_count: snippetCount
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data || {}),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=60' // Cache for 1 minute
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

