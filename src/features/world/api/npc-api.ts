/**
 * World NPC API Client
 * 
 * Type-safe API calls for world NPC operations
 */

import { createClient } from '@supabase/supabase-js';
import { AppError, DataFetchError, GenerationError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';

export interface WorldNPC {
  id: string;
  name: string;
  created_at: string;
  bio?: string | null;
  backstory?: string | null;
  traits?: unknown;
  stats?: unknown;
  location_id?: string | null;
  image_url?: string | null;
  affiliations?: unknown[];
  relationships?: Record<string, unknown>;
}

export interface GenerateNPCParams {
  keywords?: string;
  level?: string;
  temperament?: string;
  locationId?: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * World NPC API Client
 */
class WorldNPCApi {
  private getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new DataFetchError(
        'Supabase credentials not configured',
        {
          source: 'WorldNPCApi',
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

  async list(worldId: string): Promise<ApiResult<WorldNPC[]>> {
    try {
      logOperation('WorldNPCApi', 'list', 'Fetching world NPCs', { worldId }, { worldId });

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('world_npc')
        .select('id,name,created_at,bio,backstory,traits,stats,location_id,image_url,affiliations,relationships')
        .eq('world_id', worldId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DataFetchError(
          `Failed to fetch NPCs: ${error.message}`,
          {
            source: 'WorldNPCApi',
            operation: 'list',
            userMessage: 'Unable to load NPCs. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId },
          }
        );
      }

      return {
        data: (data as WorldNPC[]) || [],
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error fetching NPCs',
            {
              source: 'WorldNPCApi',
              operation: 'list',
              userMessage: 'Unable to load NPCs. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId },
            }
          );

      logError(appError);
      return { data: null, error: appError };
    }
  }

  async generate(worldId: string, params: GenerateNPCParams): Promise<ApiResult<WorldNPC>> {
    try {
      logOperation('WorldNPCApi', 'generate', 'Generating NPC', { worldId, params }, { worldId });

      const response = await fetch('/api/generate-world-npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          ...params,
          tags: params.keywords ? params.keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
          level: params.level ? parseInt(params.level, 10) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GenerationError(
          errorData.error || `Generation failed: ${response.statusText}`,
          {
            source: 'WorldNPCApi',
            operation: 'generate',
            userMessage: 'NPC generation failed. Please try again.',
            technical: {
              status: response.status,
              statusText: response.statusText,
              errorData,
            },
            entityIds: { worldId },
          }
        );
      }

      const data = await response.json();
      return {
        data: data as WorldNPC,
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new GenerationError(
            'Unexpected error generating NPC',
            {
              source: 'WorldNPCApi',
              operation: 'generate',
              userMessage: 'NPC generation failed. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId },
            }
          );

      logError(appError);
      return { data: null, error: appError };
    }
  }

  async delete(worldId: string, npcId: string): Promise<ApiResult<void>> {
    try {
      logOperation('WorldNPCApi', 'delete', 'Deleting NPC', { worldId, npcId }, { worldId, npcId });

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
            source: 'WorldNPCApi',
            operation: 'delete',
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
              source: 'WorldNPCApi',
              operation: 'delete',
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

  async deleteBulk(worldId: string, npcIds: string[]): Promise<ApiResult<void>> {
    try {
      logOperation('WorldNPCApi', 'deleteBulk', 'Bulk deleting NPCs', { worldId, count: npcIds.length }, { worldId });

      const supabase = this.getSupabase();
      const { error } = await supabase
        .from('world_npc')
        .delete()
        .eq('world_id', worldId)
        .in('id', npcIds);

      if (error) {
        throw new DataFetchError(
          `Failed to delete NPCs: ${error.message}`,
          {
            source: 'WorldNPCApi',
            operation: 'deleteBulk',
            userMessage: 'Failed to delete NPCs. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId },
          }
        );
      }

      return { data: undefined, error: null };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error deleting NPCs',
            {
              source: 'WorldNPCApi',
              operation: 'deleteBulk',
              userMessage: 'Failed to delete NPCs. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId },
            }
          );

      logError(appError);
      return { data: undefined, error: appError };
    }
  }
}

export const worldNPCApi = new WorldNPCApi();

