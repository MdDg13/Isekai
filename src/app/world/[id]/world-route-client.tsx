"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import WorldClient from './world-client';

interface Props {
  placeholderId: string;
}

export default function WorldRouteClient({ placeholderId }: Props) {
  const pathname = usePathname();

  const worldId = useMemo(() => {
    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }
    return placeholderId !== 'world' ? placeholderId : '';
  }, [pathname, placeholderId]);

  if (!worldId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">World not found</p>
        </div>
      </div>
    );
  }

  return <WorldClient worldId={worldId} />;
}


