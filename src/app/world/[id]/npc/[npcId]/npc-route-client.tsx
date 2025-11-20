"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import NPCDetailPage from "./npc-detail-page";

interface NPCRouteClientProps {
  placeholderWorldId: string;
  placeholderNpcId: string;
}

export default function NPCRouteClient({ placeholderWorldId, placeholderNpcId }: NPCRouteClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [windowPath, setWindowPath] = useState<string | null>(null);
  
  // Get the actual browser URL (not the rewritten one)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the full URL including query params
      const fullUrl = window.location.href;
      setWindowPath(window.location.pathname);
      
      // Also try to extract from full URL if pathname doesn't work
      const urlMatch = fullUrl.match(/\/world\/([^\/]+)\/npc\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'world' && urlMatch[2] && urlMatch[2] !== 'npc') {
        // IDs found in URL, will be used by useMemo below
      }
    }
  }, [pathname]);
  
  const worldId = useMemo(() => {
    // Try sessionStorage first (set by View button)
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('npcView_worldId');
      if (stored) {
        sessionStorage.removeItem('npcView_worldId'); // Clear after use
        return stored;
      }
    }
    
    // Try search params (if passed via query)
    const worldIdParam = searchParams?.get('worldId');
    if (worldIdParam) return worldIdParam;
    
    // Try actual browser URL (before redirect) - check both pathname and full href
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/world\/([^\/]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'world') return urlMatch[1];
      
      if (windowPath) {
        const match = windowPath.match(/\/world\/([^\/]+)/);
        if (match && match[1] && match[1] !== 'world') return match[1];
      }
    }
    
    // Try Next.js pathname
    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }
    
    return placeholderWorldId !== 'world' ? placeholderWorldId : '';
  }, [pathname, windowPath, searchParams, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    // Try sessionStorage first (set by View button)
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('npcView_npcId');
      if (stored) {
        sessionStorage.removeItem('npcView_npcId'); // Clear after use
        return stored;
      }
    }
    
    // Try search params (if passed via query)
    const npcIdParam = searchParams?.get('npcId');
    if (npcIdParam) return npcIdParam;
    
    // Try actual browser URL (before redirect) - check both pathname and full href
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/npc\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'npc') return urlMatch[1];
      
      if (windowPath) {
        const match = windowPath.match(/\/npc\/([^\/]+)/);
        if (match && match[1] && match[1] !== 'npc') return match[1];
      }
    }
    
    // Try Next.js pathname
    if (pathname) {
      const match = pathname.match(/\/npc\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'npc') return match[1];
    }
    
    return placeholderNpcId !== 'npc' ? placeholderNpcId : '';
  }, [pathname, windowPath, searchParams, placeholderNpcId]);

  if (!worldId || !npcId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">NPC not found</p>
          <p className="text-xs text-gray-500">Pathname: {pathname}</p>
          <p className="text-xs text-gray-500">Window: {windowPath || 'loading...'}</p>
          <p className="text-xs text-gray-500">Query: worldId={searchParams?.get('worldId') || 'none'}, npcId={searchParams?.get('npcId') || 'none'}</p>
          <p className="text-xs text-gray-500">Placeholder: worldId={placeholderWorldId}, npcId={placeholderNpcId}</p>
          {typeof window !== 'undefined' && (
            <p className="text-xs text-gray-500">Full URL: {window.location.href}</p>
          )}
        </div>
      </div>
    );
  }

  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}

