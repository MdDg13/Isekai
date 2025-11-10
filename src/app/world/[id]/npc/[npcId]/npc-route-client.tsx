"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import NPCDetailPage from "./npc-detail-page";

interface NPCRouteClientProps {
  placeholderWorldId: string;
  placeholderNpcId: string;
}

export default function NPCRouteClient({ placeholderWorldId, placeholderNpcId }: NPCRouteClientProps) {
  const pathname = usePathname();
  
  const worldId = useMemo(() => {
    if (pathname) {
      const match = pathname.match(/\/world\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'world') return match[1];
    }
    return placeholderWorldId !== 'world' ? placeholderWorldId : '';
  }, [pathname, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    if (pathname) {
      const match = pathname.match(/\/npc\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'npc') return match[1];
    }
    return placeholderNpcId !== 'npc' ? placeholderNpcId : '';
  }, [pathname, placeholderNpcId]);

  if (!worldId || !npcId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">NPC not found</p>
        </div>
      </div>
    );
  }

  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}

