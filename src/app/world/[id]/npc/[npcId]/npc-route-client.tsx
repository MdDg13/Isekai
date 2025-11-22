'use client';

import { Suspense } from 'react';
import { useRouteParams } from '@/shared/hooks/useRouteParams';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { NavigationError } from '@/shared/lib/errors/types';
import { useToast } from '@/shared/contexts/ToastContext';
import NPCDetailPage from './npc-detail-page';

interface NPCRouteClientProps {
  placeholderWorldId: string;
  placeholderNpcId: string;
}

/**
 * NPC Route Client Component
 * 
 * Responsibilities:
 * - Extract route parameters using standardized utility
 * - Handle loading and error states
 * - Pass validated IDs to detail page
 * 
 * Pattern: Route wrapper with parameter extraction
 */
function NPCRouteClientInner({ placeholderWorldId, placeholderNpcId }: NPCRouteClientProps) {
  const { params, error, loading } = useRouteParams();
  const { showError } = useToast();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NPC...</p>
        </div>
      </div>
    );
  }

  // Show error if route params extraction failed
  if (error || !params || !params.worldId || !params.npcId) {
    if (error) {
      showError(error);
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">NPC not found</p>
          <p className="text-xs text-gray-500 mb-2">
            {error?.context.userMessage || 'Unable to extract worldId or npcId from URL'}
          </p>
          <p className="text-xs text-gray-500">worldId: {params?.worldId || 'MISSING'}</p>
          <p className="text-xs text-gray-500">npcId: {params?.npcId || 'MISSING'}</p>
          <a
            href={`/world/world/?worldId=${params?.worldId || placeholderWorldId}`}
            className="text-blue-400 hover:text-blue-300 underline mt-4 inline-block"
          >
            Back to World
          </a>
        </div>
      </div>
    );
  }

  // Ensure we have valid IDs (not placeholders)
  if (params.worldId === 'world' || params.npcId === 'npc') {
    const navError = new NavigationError(
      'Invalid route parameters - placeholders detected',
      {
        source: 'NPCRouteClient',
        operation: 'validate_params',
        userMessage: 'Invalid page URL. Please navigate from the world dashboard.',
        technical: {
          worldId: params.worldId,
          npcId: params.npcId,
          placeholderWorldId,
          placeholderNpcId,
        },
      }
    );
    showError(navError);

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Navigation Error</p>
          <p className="text-xs text-gray-500">Invalid route parameters detected</p>
          <a
            href={`/world/world/?worldId=${placeholderWorldId}`}
            className="text-blue-400 hover:text-blue-300 underline mt-4 inline-block"
          >
            Back to World
          </a>
        </div>
      </div>
    );
  }

  return <NPCDetailPage worldId={params.worldId} npcId={params.npcId} />;
}

export default function NPCRouteClient(props: NPCRouteClientProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">An error occurred</p>
            <p className="text-xs text-gray-500">Please refresh the page</p>
          </div>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        }
      >
        <NPCRouteClientInner {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
