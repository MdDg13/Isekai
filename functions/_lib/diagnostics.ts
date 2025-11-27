/**
 * Diagnostic Utilities
 * 
 * Comprehensive diagnostic checks for generative operations.
 * Used during development to identify configuration and connectivity issues.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GenerationLogger } from './generation-logger';
import { resolveCloudflareAIEnv } from './cloudflare-env';

export interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

export interface SystemDiagnostics {
  timestamp: string;
  checks: DiagnosticResult[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Check environment variables for generative operations
 */
export function checkEnvironmentVariables(env: Record<string, unknown>): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const optional = [
    'WORKERS_AI_ENABLE',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
  ];

  // Check required variables
  for (const key of required) {
    const value = env[key];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      results.push({
        check: `env.${key}`,
        status: 'fail',
        message: `Required environment variable ${key} is missing or empty`,
      });
    } else {
      results.push({
        check: `env.${key}`,
        status: 'pass',
        message: `${key} is set`,
        details: { 
          hasValue: true,
          length: typeof value === 'string' ? value.length : undefined,
        },
      });
    }
  }

  // Check optional variables
  for (const key of optional) {
    const value = env[key];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      results.push({
        check: `env.${key}`,
        status: 'warning',
        message: `Optional environment variable ${key} is not set (some features may be disabled)`,
      });
    } else {
      const isEnabled = key === 'WORKERS_AI_ENABLE' 
        ? (value as string).toLowerCase() !== 'false'
        : true;
      
      results.push({
        check: `env.${key}`,
        status: isEnabled ? 'pass' : 'warning',
        message: `${key} is set${!isEnabled ? ' but not enabled' : ''}`,
        details: { 
          hasValue: true,
          enabled: isEnabled,
        },
      });
    }
  }

  return results;
}

/**
 * Check Supabase Storage bucket exists and is accessible
 */
export async function checkStorageBucket(
  supabase: SupabaseClient,
  bucketName: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    // Try to list files in the bucket (this will fail if bucket doesn't exist)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        results.push({
          check: `storage.${bucketName}`,
          status: 'fail',
          message: `Storage bucket "${bucketName}" does not exist`,
          details: { error: error.message },
        });
      } else {
        results.push({
          check: `storage.${bucketName}`,
          status: 'warning',
          message: `Storage bucket "${bucketName}" access check failed`,
          details: { error: error.message },
        });
      }
    } else {
      results.push({
        check: `storage.${bucketName}`,
        status: 'pass',
        message: `Storage bucket "${bucketName}" exists and is accessible`,
        details: { 
          fileCount: data?.length || 0,
          canList: true,
        },
      });
    }
  } catch (err) {
    results.push({
      check: `storage.${bucketName}`,
      status: 'fail',
      message: `Failed to check storage bucket "${bucketName}"`,
      details: { 
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }

  return results;
}

/**
 * Check Cloudflare Workers AI connectivity
 */
export async function checkWorkersAI(
  accountId?: string,
  token?: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  if (!accountId || !token) {
    results.push({
      check: 'api.workers_ai',
      status: 'warning',
      message: 'Workers AI credentials not configured',
      details: { 
        hasAccountId: !!accountId,
        hasToken: !!token,
      },
    });
    return results;
  }

  try {
    // Try a simple health check or model list request
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      results.push({
        check: 'api.workers_ai',
        status: 'pass',
        message: 'Workers AI API is accessible',
        details: { 
          statusCode: response.status,
          accountId: accountId.substring(0, 8) + '...', // Partial ID for security
        },
      });
    } else {
      const errorText = await response.text();
      results.push({
        check: 'api.workers_ai',
        status: 'fail',
        message: `Workers AI API returned error: ${response.status}`,
        details: { 
          statusCode: response.status,
          error: errorText.substring(0, 200), // Limit error text length
        },
      });
    }
  } catch (err) {
    results.push({
      check: 'api.workers_ai',
      status: 'fail',
      message: 'Failed to connect to Workers AI API',
      details: { 
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }

  return results;
}

/**
 * Run comprehensive system diagnostics
 */
export async function runSystemDiagnostics(
  supabase: SupabaseClient | null,
  env: Record<string, unknown>
): Promise<SystemDiagnostics> {
  const checks: DiagnosticResult[] = [];
  const timestamp = new Date().toISOString();

  // 1. Check environment variables
  checks.push(...checkEnvironmentVariables(env));

  // 2. Check Supabase Storage buckets
  if (supabase) {
    checks.push(...await checkStorageBucket(supabase, 'npc-assets'));
  } else {
    checks.push({
      check: 'supabase.client',
      status: 'fail',
      message: 'Supabase client is not available',
    });
  }

  // 3. Check Workers AI connectivity
  const { accountId, apiToken, warnings: cfEnvWarnings } = resolveCloudflareAIEnv(env);
  cfEnvWarnings.forEach((warning) => {
    checks.push({
      check: 'env.cloudflare',
      status: 'warning',
      message: warning,
    });
  });
  checks.push(...await checkWorkersAI(accountId, apiToken));

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length,
  };

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (summary.failed === 0 && summary.warnings === 0) {
    overallStatus = 'healthy';
  } else if (summary.failed === 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  return {
    timestamp,
    checks,
    overallStatus,
    summary,
  };
}

/**
 * Log diagnostics to generation logger
 */
export function logDiagnostics(
  logger: GenerationLogger,
  diagnostics: SystemDiagnostics
): void {
  logger.startStep('config_check');
  
  logger.log({
    step: 'config_check',
    logType: 'diagnostic',
    message: `System diagnostics: ${diagnostics.overallStatus}`,
    data: {
      summary: diagnostics.summary,
      timestamp: diagnostics.timestamp,
    },
  });

  for (const check of diagnostics.checks) {
    logger.log({
      step: 'config_check',
      logType: check.status === 'fail' ? 'error' : check.status === 'warning' ? 'warning' : 'debug',
      message: `${check.check}: ${check.message}`,
      data: check.details,
    });
  }

  logger.endStep('config_check');
}

