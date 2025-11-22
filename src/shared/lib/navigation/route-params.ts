/**
 * Route Parameter Extraction
 * 
 * Handles Cloudflare Pages static export redirects
 * Provides consistent parameter extraction across the app
 */

import { NavigationError } from '../errors/types';
import { logOperation } from '../logging/logger';

export interface RouteParams {
  worldId: string;
  npcId?: string;
  dungeonId?: string;
}

/**
 * Extract worldId and npcId from URL
 * Priority: query params > pathname > sessionStorage
 */
export function extractRouteParams(
  searchParams: URLSearchParams | null,
  pathname: string | null
): RouteParams {
  logOperation('route-params', 'extract', 'Extracting route parameters', {
    hasSearchParams: !!searchParams,
    pathname,
  });

  // Priority 1: Query parameters (most reliable with static export)
  const worldId = searchParams?.get('worldId');
  const npcId = searchParams?.get('npcId');
  const dungeonId = searchParams?.get('dungeonId');

  if (worldId) {
    return {
      worldId,
      ...(npcId && { npcId }),
      ...(dungeonId && { dungeonId }),
    };
  }

  // Priority 2: Extract from pathname
  if (pathname) {
    const worldMatch = pathname.match(/\/world\/([^/]+)/);
    const npcMatch = pathname.match(/\/npc\/([^/]+)/);
    const dungeonMatch = pathname.match(/\/dungeon\/([^/]+)/);

    if (worldMatch && worldMatch[1] !== 'world') {
      return {
        worldId: worldMatch[1],
        ...(npcMatch && npcMatch[1] !== 'npc' && { npcId: npcMatch[1] }),
        ...(dungeonMatch && dungeonMatch[1] !== 'dungeon' && { dungeonId: dungeonMatch[1] }),
      };
    }
  }

  // Priority 3: SessionStorage (fallback)
  if (typeof window !== 'undefined') {
    const storedWorldId = sessionStorage.getItem('route_worldId');
    const storedNpcId = sessionStorage.getItem('route_npcId');
    const storedDungeonId = sessionStorage.getItem('route_dungeonId');

    if (storedWorldId) {
      return {
        worldId: storedWorldId,
        ...(storedNpcId && { npcId: storedNpcId }),
        ...(storedDungeonId && { dungeonId: storedDungeonId }),
      };
    }
  }

  // No valid params found
  throw new NavigationError(
    'Unable to extract route parameters',
    {
      source: 'route-params',
      operation: 'extract',
      userMessage: 'Invalid page URL. Please navigate from the world dashboard.',
      technical: {
        searchParams: searchParams ? Object.fromEntries(searchParams) : null,
        pathname,
      },
    }
  );
}

/**
 * Build navigation URL with query parameters
 * Ensures compatibility with static export
 */
export function buildRouteUrl(
  basePath: string,
  params: RouteParams
): string {
  const url = new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('worldId', params.worldId);
  if (params.npcId) {
    url.searchParams.set('npcId', params.npcId);
  }
  if (params.dungeonId) {
    url.searchParams.set('dungeonId', params.dungeonId);
  }
  return url.pathname + url.search;
}

