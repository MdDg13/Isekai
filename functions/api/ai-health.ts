import { runWorkersAIText } from '../_lib/ai';

export const onRequest: PagesFunction = async (context) => {
  const { env } = context;
  const enabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  const model = (env.WORKERS_AI_MODEL as string | undefined) || '@cf/meta/llama-3.1-8b-instruct';

  const started = Date.now();
  let ok = false;
  let message = 'disabled';
  try {
    if (enabled) {
      const res = await runWorkersAIText(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: model,
        },
        'Respond with ok',
        { system: 'Return just the word ok', maxTokens: 3 }
      );
      ok = typeof res === 'string' && res.toLowerCase().includes('ok');
      message = ok ? 'ok' : res;
    }
  } catch (err) {
    message = err instanceof Error ? err.message : String(err);
  }
  const ms = Date.now() - started;
  return new Response(
    JSON.stringify({ enabled, model, ok, ms, message }),
    { status: ok || !enabled ? 200 : 500, headers: { 'content-type': 'application/json' } }
  );
};


