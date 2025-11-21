"use client";

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import WorldClient from './world-client';

interface Props {
  placeholderId: string;
}

export default function WorldRouteClient({ placeholderId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Don't render if we're on an NPC route (should be handled by NPC page)
  const isNpcRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.includes('/npc/');
  }, [pathname]);

  const worldId = useMemo(() => {
    const queryWorldId = searchParams?.get('worldId');
    if (queryWorldId) {
      return queryWorldId;
    }

    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }

    return placeholderId !== 'world' ? placeholderId : '';
  }, [pathname, placeholderId, searchParams]);

  // If on NPC route, don't render (let NPC page handle it)
  // Return empty fragment instead of null to avoid React rendering issues
  if (isNpcRoute) {
    console.log('[WorldRouteClient] Detected NPC route, not rendering world client');
    return <></>;
  }

  if (!worldId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">World not found</p>
          {typeof window !== 'undefined' && (
            <p className="text-xs text-gray-600 mt-2">URL: {window.location.href}</p>
          )}
        </div>
      </div>
    );
  }

  return <WorldClient worldId={worldId} />;
}


