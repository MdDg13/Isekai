"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import NPCDetailPage from "./npc-detail-page";

interface NPCRouteClientProps {
  placeholderWorldId: string;
  placeholderNpcId: string;
}

export default function NPCRouteClient({ placeholderWorldId, placeholderNpcId }: NPCRouteClientProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Wait for client-side mount to access sessionStorage
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const worldId = useMemo(() => {
    if (!mounted) return '';
    
    // Priority 1: URL hash (preserved through redirects)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashWorldId = hashParams.get('w');
      if (hashWorldId) {
        return decodeURIComponent(hashWorldId);
      }
    }
    
    // Priority 2: sessionStorage (set by View button before navigation)
    const storedWorldId = sessionStorage.getItem('npcView_worldId');
    if (storedWorldId) {
      return storedWorldId;
    }
    
    // Priority 3: search params (if passed via query)
    const worldIdParam = searchParams?.get('worldId');
    if (worldIdParam) return worldIdParam;
    
    // Priority 4: Try to extract from browser URL (before redirect)
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/world\/([^\/]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'world') {
        return urlMatch[1];
      }
    }
    
    // Priority 5: placeholder (fallback)
    return placeholderWorldId !== 'world' ? placeholderWorldId : '';
  }, [mounted, searchParams, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    if (!mounted) return '';
    
    // Priority 1: URL hash (preserved through redirects)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashNpcId = hashParams.get('n');
      if (hashNpcId) {
        return decodeURIComponent(hashNpcId);
      }
    }
    
    // Priority 2: sessionStorage (set by View button before navigation)
    const storedNpcId = sessionStorage.getItem('npcView_npcId');
    if (storedNpcId) {
      return storedNpcId;
    }
    
    // Priority 3: search params (if passed via query)
    const npcIdParam = searchParams?.get('npcId');
    if (npcIdParam) return npcIdParam;
    
    // Priority 4: Try to extract from browser URL (before redirect)
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/npc\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'npc') {
        return urlMatch[1];
      }
    }
    
    // Priority 5: placeholder (fallback)
    return placeholderNpcId !== 'npc' ? placeholderNpcId : '';
  }, [mounted, searchParams, placeholderNpcId]);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NPC...</p>
        </div>
      </div>
    );
  }

  // Show error if IDs not found
  if (!worldId || !npcId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">NPC not found</p>
          <p className="text-xs text-gray-500 mb-2">Unable to extract worldId or npcId from URL</p>
          <p className="text-xs text-gray-500">SessionStorage: worldId={sessionStorage.getItem('npcView_worldId') || 'none'}, npcId={sessionStorage.getItem('npcView_npcId') || 'none'}</p>
          <p className="text-xs text-gray-500 mt-2">Query: worldId={searchParams?.get('worldId') || 'none'}, npcId={searchParams?.get('npcId') || 'none'}</p>
          {typeof window !== 'undefined' && (
            <p className="text-xs text-gray-500 mt-2">URL: {window.location.href}</p>
          )}
        </div>
      </div>
    );
  }

  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}


