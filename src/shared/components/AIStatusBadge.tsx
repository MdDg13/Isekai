"use client";

import { useMemo } from 'react';
import type { AIHealth } from '../hooks/useAIHealth';

type Tone = 'success' | 'warning' | 'error' | 'info';

interface AIStatusBadgeProps {
  status: AIHealth | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function AIStatusBadge({ status, loading, error, onRetry, compact = false }: AIStatusBadgeProps) {
  const derived = useMemo<{
    label: string;
    tone: Tone;
    description: string;
  }>(() => {
    if (loading) {
      return {
        label: 'Checking AI status…',
        tone: 'info',
        description: 'Running Workers AI diagnostics',
      };
    }

    if (error) {
      return {
        label: 'AI health check failed',
        tone: 'error',
        description: error,
      };
    }

    if (!status) {
      return {
        label: 'AI status unavailable',
        tone: 'warning',
        description: 'Unable to load Workers AI health.',
      };
    }

    if (!status.enabled) {
      return {
        label: 'Workers AI disabled',
        tone: 'warning',
        description: status.message || 'Enable CLOUDLFARE credentials to turn on AI features.',
      };
    }

    if (!status.ok) {
      return {
        label: 'Workers AI unreachable',
        tone: 'warning',
        description: status.message || 'Cloudflare AI responded with an error.',
      };
    }

    return {
      label: 'Workers AI online',
      tone: 'success',
      description: `Model ${status.model} responded in ${status.ms}ms`,
    };
  }, [status, loading, error]);

  const toneStyles: Record<Tone, string> = {
    success: 'border-emerald-700/70 bg-emerald-950/40 text-emerald-200',
    warning: 'border-amber-700/70 bg-amber-950/30 text-amber-200',
    error: 'border-red-700/70 bg-red-950/40 text-red-200',
    info: 'border-blue-700/70 bg-blue-950/30 text-blue-200',
  };

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${toneStyles[derived.tone]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{derived.label}</span>
        {!compact && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-current/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide hover:bg-current/20"
          >
            Retry
          </button>
        )}
      </div>
      {!compact && (
        <p className="mt-1 text-[11px] sm:text-xs opacity-80">
          {derived.description}
        </p>
      )}
    </div>
  );
}


