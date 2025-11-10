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
    const match = pathname?.match(/\/world\/([^/]+)/);
    return match ? match[1] : placeholderWorldId;
  }, [pathname, placeholderWorldId]);
  
  const npcId = useMemo(() => {
    const match = pathname?.match(/\/npc\/([^/]+)/);
    return match ? match[1] : placeholderNpcId;
  }, [pathname, placeholderNpcId]);

  return <NPCDetailPage worldId={worldId} npcId={npcId} />;
}

