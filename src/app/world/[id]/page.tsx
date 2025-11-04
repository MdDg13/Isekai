"use client";

import WorldClient from './world-client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// For static export, we need to generate at least one path
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'world' }];
}

interface PageProps {
  params: { id: string };
}

export default function WorldPage({ params }: PageProps) {
  const pathname = usePathname();
  
  // Extract world ID from URL path
  const worldId = useMemo(() => {
    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') {
        return match[1];
      }
    }
    return params.id && params.id !== 'world' ? params.id : null;
  }, [pathname, params.id]);
  
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

