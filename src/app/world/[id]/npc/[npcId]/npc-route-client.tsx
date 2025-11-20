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
    console.log('[NPCRouteClient] Component mounting');
    setMounted(true);
  }, []);
  
  const worldId = useMemo(() => {
    if (!mounted) {
      console.log('[NPCRouteClient] Not mounted yet, returning empty worldId');
      return '';
    }
    
    console.log('[NPCRouteClient] Extracting worldId...');
    console.log('[NPCRouteClient] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('[NPCRouteClient] Hash:', typeof window !== 'undefined' ? window.location.hash : 'N/A');
    console.log('[NPCRouteClient] Placeholder worldId:', placeholderWorldId);
    
    // Priority 1: URL hash (preserved through redirects)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashWorldId = hashParams.get('w');
      console.log('[NPCRouteClient] Hash worldId:', hashWorldId);
      if (hashWorldId) {
        const decoded = decodeURIComponent(hashWorldId);
        console.log('[NPCRouteClient] Using hash worldId:', decoded);
        return decoded;
      }
    }
    
    // Priority 2: sessionStorage (set by View button before navigation)
    const storedWorldId = sessionStorage.getItem('npcView_worldId');
    console.log('[NPCRouteClient] SessionStorage worldId:', storedWorldId);
    if (storedWorldId) {
      console.log('[NPCRouteClient] Using sessionStorage worldId:', storedWorldId);
      return storedWorldId;
    }
    
    // Priority 3: search params (if passed via query)
    const worldIdParam = searchParams?.get('worldId');
    console.log('[NPCRouteClient] Search param worldId:', worldIdParam);
    if (worldIdParam) {
      console.log('[NPCRouteClient] Using search param worldId:', worldIdParam);
      return worldIdParam;
    }
    
    // Priority 4: Try to extract from browser URL (before redirect)
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/world\/([^\/]+)/);
      console.log('[NPCRouteClient] URL match:', urlMatch);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'world') {
        console.log('[NPCRouteClient] Using URL-extracted worldId:', urlMatch[1]);
        return urlMatch[1];
      }
    }
    
    // Priority 5: placeholder (fallback)
    const fallback = placeholderWorldId !== 'world' ? placeholderWorldId : '';
    console.log('[NPCRouteClient] Using placeholder worldId:', fallback);
    return fallback;
  }, [mounted, searchParams, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    if (!mounted) {
      console.log('[NPCRouteClient] Not mounted yet, returning empty npcId');
      return '';
    }
    
    console.log('[NPCRouteClient] Extracting npcId...');
    
    // Priority 1: URL hash (preserved through redirects)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashNpcId = hashParams.get('n');
      console.log('[NPCRouteClient] Hash npcId:', hashNpcId);
      if (hashNpcId) {
        const decoded = decodeURIComponent(hashNpcId);
        console.log('[NPCRouteClient] Using hash npcId:', decoded);
        return decoded;
      }
    }
    
    // Priority 2: sessionStorage (set by View button before navigation)
    const storedNpcId = sessionStorage.getItem('npcView_npcId');
    console.log('[NPCRouteClient] SessionStorage npcId:', storedNpcId);
    if (storedNpcId) {
      console.log('[NPCRouteClient] Using sessionStorage npcId:', storedNpcId);
      return storedNpcId;
    }
    
    // Priority 3: search params (if passed via query)
    const npcIdParam = searchParams?.get('npcId');
    console.log('[NPCRouteClient] Search param npcId:', npcIdParam);
    if (npcIdParam) {
      console.log('[NPCRouteClient] Using search param npcId:', npcIdParam);
      return npcIdParam;
    }
    
    // Priority 4: Try to extract from browser URL (before redirect)
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      const urlMatch = fullUrl.match(/\/npc\/([^\/\?]+)/);
      console.log('[NPCRouteClient] URL match for npcId:', urlMatch);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'npc') {
        console.log('[NPCRouteClient] Using URL-extracted npcId:', urlMatch[1]);
        return urlMatch[1];
      }
    }
    
    // Priority 5: placeholder (fallback)
    const fallback = placeholderNpcId !== 'npc' ? placeholderNpcId : '';
    console.log('[NPCRouteClient] Using placeholder npcId:', fallback);
    return fallback;
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
    console.error('[NPCRouteClient] Missing IDs:', { worldId, npcId, mounted });
    console.error('[NPCRouteClient] Debug info:', {
      hash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
      sessionStorage: {
        worldId: typeof window !== 'undefined' ? sessionStorage.getItem('npcView_worldId') : 'N/A',
        npcId: typeof window !== 'undefined' ? sessionStorage.getItem('npcView_npcId') : 'N/A',
      },
      searchParams: {
        worldId: searchParams?.get('worldId'),
        npcId: searchParams?.get('npcId'),
      },
      placeholder: { placeholderWorldId, placeholderNpcId },
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    });
    
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">NPC not found</p>
          <p className="text-xs text-gray-500 mb-2">Unable to extract worldId or npcId from URL</p>
          <p className="text-xs text-gray-500">worldId: {worldId || 'MISSING'}</p>
          <p className="text-xs text-gray-500">npcId: {npcId || 'MISSING'}</p>
          <p className="text-xs text-gray-500 mt-2">SessionStorage: worldId={typeof window !== 'undefined' ? (sessionStorage.getItem('npcView_worldId') || 'none') : 'N/A'}, npcId={typeof window !== 'undefined' ? (sessionStorage.getItem('npcView_npcId') || 'none') : 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-2">Query: worldId={searchParams?.get('worldId') || 'none'}, npcId={searchParams?.get('npcId') || 'none'}</p>
          {typeof window !== 'undefined' && (
            <>
              <p className="text-xs text-gray-500 mt-2">URL: {window.location.href}</p>
              <p className="text-xs text-gray-500 mt-2">Hash: {window.location.hash || 'none'}</p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-2">Placeholder: worldId={placeholderWorldId}, npcId={placeholderNpcId}</p>
          <p className="text-xs text-gray-500 mt-2">Check browser console for detailed logs</p>
        </div>
      </div>
    );
  }

  console.log('[NPCRouteClient] IDs extracted successfully:', { worldId, npcId });
  console.log('[NPCRouteClient] Rendering NPCDetailPage');
  
  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}


