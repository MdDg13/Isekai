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
      setWindowPath(window.location.pathname);
    }
  }, [pathname]);
  
  const worldId = useMemo(() => {
    // Try search params first (if passed via query)
    const worldIdParam = searchParams?.get('worldId');
    if (worldIdParam) return worldIdParam;
    
    // Try actual browser pathname (before redirect)
    if (windowPath) {
      const match = windowPath.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }
    
    // Try Next.js pathname
    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }
    
    return placeholderWorldId !== 'world' ? placeholderWorldId : '';
  }, [pathname, windowPath, searchParams, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    // Try search params first (if passed via query)
    const npcIdParam = searchParams?.get('npcId');
    if (npcIdParam) return npcIdParam;
    
    // Try actual browser pathname (before redirect)
    if (windowPath) {
      const match = windowPath.match(/\/npc\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'npc') return match[1];
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
        </div>
      </div>
    );
  }

  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}

