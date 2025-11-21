export interface CloudflareAIConfig {
  accountId?: string;
  apiToken?: string;
  warnings: string[];
}

/**
 * Resolve Cloudflare Workers AI environment variables.
 * Primary naming convention (preferred):
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_API_TOKEN
 *
 * Legacy fallbacks are still supported temporarily, but a warning is emitted.
 */
export function resolveCloudflareAIEnv(env: Record<string, unknown>): CloudflareAIConfig {
  const warnings: string[] = [];

  let accountId: string | undefined;
  if (typeof env.CLOUDFLARE_ACCOUNT_ID === 'string' && env.CLOUDFLARE_ACCOUNT_ID.trim().length > 0) {
    accountId = env.CLOUDFLARE_ACCOUNT_ID.trim();
  } else if (typeof env.CF_ACCOUNT_ID === 'string' && env.CF_ACCOUNT_ID.trim().length > 0) {
    accountId = env.CF_ACCOUNT_ID.trim();
    warnings.push(
      'CF_ACCOUNT_ID is deprecated. Please rename it to CLOUDFLARE_ACCOUNT_ID for consistency.'
    );
  }

  let apiToken: string | undefined;
  if (typeof env.CLOUDFLARE_API_TOKEN === 'string' && env.CLOUDFLARE_API_TOKEN.trim().length > 0) {
    apiToken = env.CLOUDFLARE_API_TOKEN.trim();
  } else if (
    typeof env.CF_WORKERS_AI_TOKEN === 'string' &&
    env.CF_WORKERS_AI_TOKEN.trim().length > 0
  ) {
    apiToken = env.CF_WORKERS_AI_TOKEN.trim();
    warnings.push(
      'CF_WORKERS_AI_TOKEN is deprecated. Please rename it to CLOUDFLARE_API_TOKEN for consistency.'
    );
  }

  return { accountId, apiToken, warnings };
}

