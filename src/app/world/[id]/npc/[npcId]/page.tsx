// Server component wrapper for static export
import { Suspense } from 'react';
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
  // Suspense boundary required for useSearchParams() in static export
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NPC...</p>
        </div>
      </div>
    }>
      <NPCRouteClient placeholderWorldId={params.id} placeholderNpcId={params.npcId} />
    </Suspense>
  );
}

