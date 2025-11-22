/**
 * NPC Detail API Client
 * 
 * Type-safe API calls for NPC detail operations
 * All errors converted to AppError for consistent handling
 */

import { createClient } from '@supabase/supabase-js';
import { AppError, DataFetchError, StorageError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';

export interface WorldNPC {
  id: string;
  name: string;
  bio?: string | null;
  backstory?: string | null;
  traits?: unknown;
  stats?: unknown;
  image_url?: string | null;
  voice_id?: string | null;
  created_at: string;
  world_id: string;
}

export interface RegeneratePortraitResult {
  image_url: string;
}

/**
 * Type-safe API result
 */
export interface ApiResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * NPC Detail API Client
 * 
 * Responsibilities:
 * - Type-safe API calls
 * - Error handling
 * - Structured logging
 */
class NPCDetailApi {
  private getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new DataFetchError(
        'Supabase credentials not configured',
        {
          source: 'NPCDetailApi',
          operation: 'getSupabase',
          userMessage: 'Application configuration error. Please contact support.',
          technical: {
            hasUrl: !!url,
            hasKey: !!key,
          },
        }
      );
    }

    return createClient(url, key);
  }

  async getNPC(worldId: string, npcId: string): Promise<ApiResult<WorldNPC>> {
    try {
      logOperation('NPCDetailApi', 'getNPC', 'Fetching NPC detail', { worldId, npcId }, { worldId, npcId });

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('world_npc')
        .select('*')
        .eq('id', npcId)
        .eq('world_id', worldId)
        .single();

      if (error) {
        throw new DataFetchError(
          `Failed to fetch NPC: ${error.message}`,
          {
            source: 'NPCDetailApi',
            operation: 'getNPC',
            userMessage: 'Unable to load NPC details. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId, npcId },
          }
        );
      }

      if (!data) {
        throw new DataFetchError(
          'NPC not found',
          {
            source: 'NPCDetailApi',
            operation: 'getNPC',
            userMessage: 'NPC not found. It may have been deleted.',
            technical: {
              worldId,
              npcId,
            },
            entityIds: { worldId, npcId },
          }
        );
      }

      return {
        data: data as WorldNPC,
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error fetching NPC',
            {
              source: 'NPCDetailApi',
              operation: 'getNPC',
              userMessage: 'Unable to load NPC details. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            }
          );

      logError(appError);
      return { data: null, error: appError };
    }
  }

  async deleteNPC(worldId: string, npcId: string): Promise<ApiResult<void>> {
    try {
      logOperation('NPCDetailApi', 'deleteNPC', 'Deleting NPC', { worldId, npcId }, { worldId, npcId });

      const supabase = this.getSupabase();
      const { error } = await supabase
        .from('world_npc')
        .delete()
        .eq('id', npcId)
        .eq('world_id', worldId);

      if (error) {
        throw new DataFetchError(
          `Failed to delete NPC: ${error.message}`,
          {
            source: 'NPCDetailApi',
            operation: 'deleteNPC',
            userMessage: 'Failed to delete NPC. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId, npcId },
          }
        );
      }

      return { data: undefined, error: null };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error deleting NPC',
            {
              source: 'NPCDetailApi',
              operation: 'deleteNPC',
              userMessage: 'Failed to delete NPC. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            }
          );

      logError(appError);
      return { data: undefined, error: appError };
    }
  }

  async regeneratePortrait(worldId: string, npcId: string): Promise<ApiResult<RegeneratePortraitResult>> {
    try {
      logOperation('NPCDetailApi', 'regeneratePortrait', 'Regenerating NPC portrait', { worldId, npcId }, { worldId, npcId });

      const response = await fetch('/api/regenerate-npc-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldId, npcId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new StorageError(
          errorData.error || `Portrait regeneration failed: ${response.statusText}`,
          {
            source: 'NPCDetailApi',
            operation: 'regeneratePortrait',
            userMessage: 'Failed to regenerate portrait. Please try again.',
            technical: {
              status: response.status,
              statusText: response.statusText,
              errorData,
            },
            entityIds: { worldId, npcId },
          }
        );
      }

      const data = await response.json();
      return {
        data: data as RegeneratePortraitResult,
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new StorageError(
            'Unexpected error regenerating portrait',
            {
              source: 'NPCDetailApi',
              operation: 'regeneratePortrait',
              userMessage: 'Failed to regenerate portrait. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId },
            }
          );

      logError(appError);
      return { data: null, error: appError };
    }
  }
}

export const npcDetailApi = new NPCDetailApi();

