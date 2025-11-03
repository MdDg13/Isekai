export const onRequest: PagesFunction = async (context) => {
  const url = context.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anon = context.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anon) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const health = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon },
    });
    const ok = health.ok;
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 502,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};


