// Server component wrapper for static export
import NPCRouteClient from './npc-route-client';

// For static export, we need to generate at least one path for both segments
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string; npcId: string }> {
  return [{ id: 'world', npcId: 'npc' }];
}

interface PageProps {
  params: { id: string; npcId: string };
}

export default function NPCDetailPageWrapper({ params }: PageProps) {
  // Server component wrapper; client-side route parsing happens in NPCRouteClient
  return <NPCRouteClient placeholderWorldId={params.id} placeholderNpcId={params.npcId} />;
}

