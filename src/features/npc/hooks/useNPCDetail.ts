/**
 * Hook for managing NPC detail
 * 
 * Responsibilities:
 * - Fetch NPC data
 * - Handle portrait regeneration
 * - Handle deletion
 * - Error handling with structured logging
 */

import { useState, useEffect, useCallback } from 'react';
import { AppError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';
import { npcDetailApi, type WorldNPC } from '../api/npc-detail-api';

interface UseNPCDetailResult {
  npc: WorldNPC | null;
  loading: boolean;
  error: AppError | null;
  regenerating: boolean;
  deleting: boolean;
  regeneratePortrait: () => Promise<void>;
  deleteNPC: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing NPC detail
 */
export function useNPCDetail(worldId: string, npcId: string): UseNPCDetailResult {
  const [npc, setNpc] = useState<WorldNPC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchNPC = useCallback(async () => {
    logOperation('useNPCDetail', 'fetchNPC', 'Fetching NPC detail', { worldId, npcId }, { worldId, npcId });

    try {
      setLoading(true);
      setError(null);

      const result = await npcDetailApi.getNPC(worldId, npcId);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new AppError(
          'NPC not found',
          'NPC_NOT_FOUND',
          {
            source: 'useNPCDetail',
            operation: 'fetchNPC',
            userMessage: 'NPC not found. It may have been deleted.',
            technical: {
              worldId,
              npcId,
            },
            entityIds: { worldId, npcId },
          },
          'high'
        );
      }

      setNpc(result.data);
      logOperation('useNPCDetail', 'fetchNPC', 'NPC fetched successfully', {
        npcId: result.data.id,
        npcName: result.data.name,
      }, { worldId, npcId });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to fetch NPC',
            'FETCH_NPC_ERROR',
            {
              source: 'useNPCDetail',
              operation: 'fetchNPC',
              userMessage: 'Unable to load NPC details. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      setNpc(null);
    } finally {
      setLoading(false);
    }
  }, [worldId, npcId]);

  useEffect(() => {
    fetchNPC();
  }, [fetchNPC]);

  const regeneratePortrait = useCallback(async () => {
    logOperation('useNPCDetail', 'regeneratePortrait', 'Starting portrait regeneration', { worldId, npcId }, { worldId, npcId });

    try {
      setRegenerating(true);
      setError(null);

      const result = await npcDetailApi.regeneratePortrait(worldId, npcId);

      if (result.error) {
        throw result.error;
      }

      // Update NPC with new image URL
      if (result.data && npc) {
        setNpc({
          ...npc,
          image_url: result.data.image_url,
        });
      }

      logOperation('useNPCDetail', 'regeneratePortrait', 'Portrait regenerated successfully', {
        imageUrl: result.data?.image_url,
      }, { worldId, npcId });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to regenerate portrait',
            'REGENERATE_PORTRAIT_ERROR',
            {
              source: 'useNPCDetail',
              operation: 'regeneratePortrait',
              userMessage: 'Failed to regenerate portrait. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            },
            'medium'
          );

      logError(appError);
      setError(appError);
      throw appError; // Re-throw for component to handle
    } finally {
      setRegenerating(false);
    }
  }, [worldId, npcId, npc]);

  const deleteNPC = useCallback(async () => {
    logOperation('useNPCDetail', 'deleteNPC', 'Deleting NPC', { worldId, npcId }, { worldId, npcId });

    try {
      setDeleting(true);
      setError(null);

      const result = await npcDetailApi.deleteNPC(worldId, npcId);

      if (result.error) {
        throw result.error;
      }

      logOperation('useNPCDetail', 'deleteNPC', 'NPC deleted successfully', {
        npcId,
      }, { worldId, npcId });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to delete NPC',
            'DELETE_NPC_ERROR',
            {
              source: 'useNPCDetail',
              operation: 'deleteNPC',
              userMessage: 'Failed to delete NPC. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      throw appError;
    } finally {
      setDeleting(false);
    }
  }, [worldId, npcId]);

  return {
    npc,
    loading,
    error,
    regenerating,
    deleting,
    regeneratePortrait,
    deleteNPC,
    refetch: fetchNPC,
  };
}

