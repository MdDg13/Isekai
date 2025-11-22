/**
 * Hook for managing world data
 * 
 * Responsibilities:
 * - Fetch world data
 * - Update world name
 * - Error handling with structured logging
 */

import { useState, useEffect, useCallback } from 'react';
import { AppError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';
import { worldApi, type WorldRecord } from '../api/world-api';

interface UseWorldDataResult {
  world: WorldRecord | null;
  loading: boolean;
  error: AppError | null;
  updating: boolean;
  updateName: (newName: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing world data
 */
export function useWorldData(worldId: string): UseWorldDataResult {
  // Ensure worldId is always a string (defensive check)
  const safeWorldId = worldId || '';
  const [world, setWorld] = useState<WorldRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchWorld = useCallback(async () => {
    logOperation('useWorldData', 'fetchWorld', 'Fetching world', { worldId: safeWorldId }, { worldId: safeWorldId });

    try {
      setLoading(true);
      setError(null);

      const result = await worldApi.getWorld(safeWorldId);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new AppError(
          'World not found',
          'WORLD_NOT_FOUND',
          {
            source: 'useWorldData',
            operation: 'fetchWorld',
            userMessage: 'World not found. It may have been deleted.',
              technical: {
                worldId: safeWorldId,
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'high'
          );
      }

      setWorld(result.data);
      logOperation('useWorldData', 'fetchWorld', 'World fetched successfully', {
        worldId: result.data.id,
        worldName: result.data.name,
      }, { worldId: safeWorldId });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to fetch world',
            'FETCH_WORLD_ERROR',
            {
              source: 'useWorldData',
              operation: 'fetchWorld',
              userMessage: 'Unable to load world. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'high'
          );

      logError(appError);
      setError(appError);
      setWorld(null);
    } finally {
      setLoading(false);
    }
  }, [safeWorldId]);

  useEffect(() => {
    fetchWorld();
  }, [fetchWorld]);

  const updateName = useCallback(async (newName: string) => {
    logOperation('useWorldData', 'updateName', 'Updating world name', { worldId: safeWorldId, newName }, { worldId: safeWorldId });

    try {
      setUpdating(true);
      setError(null);

      const result = await worldApi.updateWorldName(safeWorldId, newName.trim());

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setWorld(result.data);
      }

      logOperation('useWorldData', 'updateName', 'World name updated successfully', {
        newName,
      }, { worldId: String(safeWorldId) });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(
            'Failed to update world name',
            'UPDATE_WORLD_NAME_ERROR',
            {
              source: 'useWorldData',
              operation: 'updateName',
              userMessage: 'Failed to update world name. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
                newName: newName || '',
              },
              entityIds: { worldId: String(safeWorldId) },
            },
            'medium'
          );

      logError(appError);
      setError(appError);
      throw appError; // Re-throw for component to handle
    } finally {
      setUpdating(false);
    }
  }, [safeWorldId]);

  return {
    world,
    loading,
    error,
    updating,
    updateName,
    refetch: fetchWorld,
  };
}

