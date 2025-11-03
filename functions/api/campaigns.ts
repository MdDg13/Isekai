export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  // For now, return static manifest ids; later fetch from Supabase
  try {
    const manifest = await context.env.ASSETS.fetch(new URL('/src/app/data/campaigns.json', url.origin).toString());
    if (!manifest.ok) throw new Error('manifest fetch failed');
    const ids: string[] = await manifest.json();
    return new Response(JSON.stringify({ ids }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ids: ['example'] }), {
      headers: { 'content-type': 'application/json' },
    });
  }
};


