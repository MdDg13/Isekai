'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { extractRouteParams, type RouteParams } from '../lib/navigation/route-params';
import { NavigationError } from '../lib/errors/types';
import { logError } from '../lib/logging/logger';

/**
 * Hook for extracting route parameters
 * Handles client-side mounting and error states
 */
export function useRouteParams(): {
  params: RouteParams | null;
  error: NavigationError | null;
  loading: boolean;
} {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [params, setParams] = useState<RouteParams | null>(null);
  const [error, setError] = useState<NavigationError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const extracted = extractRouteParams(searchParams, pathname);
      setParams(extracted);
      setError(null);
    } catch (err) {
      const navError = err instanceof NavigationError
        ? err
        : new NavigationError(
            'Failed to extract route parameters',
            {
              source: 'useRouteParams',
              operation: 'extract',
              userMessage: 'Invalid page URL. Please navigate from the world dashboard.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
            }
          );

      logError(navError);
      setError(navError);
      setParams(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams, pathname]);

  return { params, error, loading };
}

