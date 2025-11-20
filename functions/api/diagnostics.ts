/**
 * Cloudflare Pages Function: System Diagnostics
 * GET /api/diagnostics
 * 
 * Returns comprehensive system health diagnostics for generative operations.
 * Used during development to identify configuration and connectivity issues.
 */

import { createClient } from '@supabase/supabase-js';
import { runSystemDiagnostics } from '../_lib/diagnostics';
import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  // Allow GET and POST
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  
  let supabase = null;
  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
  }

  try {
    const diagnostics = await runSystemDiagnostics(supabase, env);
    
    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to run diagnostics',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};

