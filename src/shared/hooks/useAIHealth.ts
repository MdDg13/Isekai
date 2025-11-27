import { useCallback, useEffect, useState } from 'react';

export interface AIHealth {
  enabled: boolean;
  ok: boolean;
  model: string;
  ms: number;
  message: string;
  warnings?: string[];
  credentialsReady?: boolean;
  toggle?: string;
}

interface UseAIHealthResult {
  data: AIHealth | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAIHealth(pollMs = 60000): UseAIHealthResult {
  const [data, setData] = useState<AIHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-health');
      const json = (await res.json()) as AIHealth;
      if (!res.ok) {
        setError(json.message || 'AI health check failed');
        setData(json);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runCheck();

    if (!pollMs) return undefined;
    const id = window.setInterval(() => {
      void runCheck();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [runCheck, pollMs]);

  return {
    data,
    loading,
    error,
    refresh: runCheck,
  };
}


