export interface WorkersAIEnv {
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  WORKERS_AI_MODEL?: string; // e.g., "@cf/meta/llama-3.1-8b-instruct"
}

export interface TextGenOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Run a Workers AI text model with a chat-style payload.
 * Falls back to simple prompt if chat is not supported by the model.
 */
export async function runWorkersAIText(env: WorkersAIEnv, prompt: string, options: TextGenOptions = {}): Promise<string> {
  const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = env;
  const model = env.WORKERS_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Workers AI credentials not configured');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${encodeURIComponent(model)}`;
  const body = {
    messages: [
      options.system ? { role: 'system', content: options.system } : null,
      { role: 'user', content: prompt },
    ].filter(Boolean),
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 600,
  } as Record<string, unknown>;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workers AI request failed: ${res.status} ${text}`);
  }
  const json = await res.json() as { result?: { response?: string; output_text?: string } };
  // Common Workers AI response shape: { result: { response: string } } or { result: { output_text: string } }
  const content = json?.result?.response ?? json?.result?.output_text ?? '';
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Workers AI returned empty response');
  }
  return content;
}

/**
 * Convenience helper to request STRICT JSON output.
 * Adds a strong system instruction and trims to the outermost JSON object/array.
 */
export async function runWorkersAIJSON<T = unknown>(
  env: WorkersAIEnv,
  prompt: string,
  options: TextGenOptions = {}
): Promise<T> {
  const strictSystem =
    (options.system ? options.system + '\n' : '') +
    'You must output ONLY valid JSON. No prose. No code fences. Do not explain.';

  const text = await runWorkersAIText(env, prompt, {
    ...options,
    system: strictSystem,
    temperature: options.temperature ?? 0.4,
  });

  // Extract JSON (robust to stray characters)
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let start = -1;
  if (firstBrace >= 0 && firstBracket >= 0) {
    start = Math.min(firstBrace, firstBracket);
  } else {
    start = Math.max(firstBrace, firstBracket);
  }
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    return JSON.parse(slice) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from Workers AI response: ${detail}`);
  }
}

/** Future hooks for image/voice generation (not implemented yet). */
export type NotImplemented = never;

