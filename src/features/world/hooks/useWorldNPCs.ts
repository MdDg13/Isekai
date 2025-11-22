/**
 * Hook for managing world NPCs
 * 
 * Responsibilities:
 * - Fetch NPC list
 * - Handle generation
 * - Handle deletion (single and bulk)
 * - Error handling with structured logging
 */

import { useState, useEffect, useCallback } from 'react';
import { AppError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';
import { worldNPCApi, type WorldNPC, type GenerateNPCParams } from '../api/npc-api';

interface UseWorldNPCsResult {
  npcs: WorldNPC[];
  loading: boolean;
  error: AppError | null;
  generating: boolean;
  generateNPC: (params: GenerateNPCParams) => Promise<void>;
  deleteNPC: (id: string) => Promise<void>;
  deleteBulk: (ids: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing world NPCs
 */
export function useWorldNPCs(worldId: string): UseWorldNPCsResult {
  // Ensure worldId is always a string (defensive check for type safety)
  const safeWorldId: string = worldId || '';
  const [npcs, setNpcs] = useState<WorldNPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchNPCs = useCallback(async () => {
    logOperation('useWorldNPCs', 'fetchNPCs', 'Fetching world NPCs', { worldId: safeWorldId }, { worldId: String(safeWorldId) });

    try {
      setLoading(true);
      setError(null);

      const result = await worldNPCApi.list(safeWorldId);

      if (result.error) {
        throw result.error;
      }

      setNpcs(result.data || []);
      logOperation('useWorldNPCs', 'fetchNPCs', 'NPCs fetched successfully', {
        count: result.data?.length || 0,
      }, { worldId: String(safeWorldId) });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to fetch NPCs',
            'FETCH_NPCS_ERROR',
            {
              source: 'useWorldNPCs',
              operation: 'fetchNPCs',
              userMessage: 'Unable to load NPCs. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'medium'
          );

      logError(appError);
      setError(appError);
      setNpcs([]);
    } finally {
      setLoading(false);
    }
  }, [safeWorldId]);

  useEffect(() => {
    fetchNPCs();
  }, [fetchNPCs]);

  const generateNPC = useCallback(async (params: GenerateNPCParams) => {
    logOperation('useWorldNPCs', 'generateNPC', 'Starting NPC generation', { worldId: safeWorldId, params }, { worldId: String(safeWorldId) });

    try {
      setGenerating(true);
      setError(null);

      const result = await worldNPCApi.generate(safeWorldId, params);

      if (result.error) {
        throw result.error;
      }

      // Refresh list
      await fetchNPCs();

      logOperation('useWorldNPCs', 'generateNPC', 'NPC generated successfully', {
        npcId: result.data?.id,
      }, { worldId: String(safeWorldId), npcId: result.data?.id || '' });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to generate NPC',
            'GENERATE_NPC_ERROR',
            {
              source: 'useWorldNPCs',
              operation: 'generateNPC',
              userMessage: 'NPC generation failed. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
                params,
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      throw appError; // Re-throw for component to handle
    } finally {
      setGenerating(false);
    }
  }, [safeWorldId, fetchNPCs]);

  const deleteNPC = useCallback(async (id: string) => {
    logOperation('useWorldNPCs', 'deleteNPC', 'Deleting NPC', { worldId: safeWorldId, npcId: id }, { worldId: String(safeWorldId), npcId: id });

    try {
      const result = await worldNPCApi.delete(safeWorldId, id);

      if (result.error) {
        throw result.error;
      }

      // Remove from list
      setNpcs(prev => prev.filter(npc => npc.id !== id));

      logOperation('useWorldNPCs', 'deleteNPC', 'NPC deleted successfully', {
        npcId: id,
      }, { worldId: String(safeWorldId), npcId: id });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to delete NPC',
            'DELETE_NPC_ERROR',
            {
              source: 'useWorldNPCs',
              operation: 'deleteNPC',
              userMessage: 'Failed to delete NPC. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId: String(safeWorldId), npcId: id },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      throw appError;
    }
  }, [safeWorldId]);

  const deleteBulk = useCallback(async (ids: string[]) => {
    logOperation('useWorldNPCs', 'deleteBulk', 'Bulk deleting NPCs', { worldId: safeWorldId, count: ids.length }, { worldId: String(safeWorldId) });

    try {
      const result = await worldNPCApi.deleteBulk(safeWorldId, ids);

      if (result.error) {
        throw result.error;
      }

      // Remove from list
      setNpcs(prev => prev.filter(npc => !ids.includes(npc.id)));

      logOperation('useWorldNPCs', 'deleteBulk', 'NPCs deleted successfully', {
        count: ids.length,
      }, { worldId: String(safeWorldId) });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to delete NPCs',
            'DELETE_BULK_NPCS_ERROR',
            {
              source: 'useWorldNPCs',
              operation: 'deleteBulk',
              userMessage: 'Failed to delete NPCs. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      throw appError;
    }
  }, [safeWorldId]);

  return {
    npcs,
    loading,
    error,
    generating,
    generateNPC,
    deleteNPC,
    deleteBulk,
    refetch: fetchNPCs,
  };
}

