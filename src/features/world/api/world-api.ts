/**
 * World API Client
 * 
 * Type-safe API calls for world operations
 * All errors converted to AppError for consistent handling
 */

import { createClient } from '@supabase/supabase-js';
import { AppError, DataFetchError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';

export interface WorldRecord {
  id: string;
  name: string;
  slug?: string | null;
  ruleset?: string | null;
  created_at: string;
}

/**
 * Type-safe API result
 */
export interface ApiResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * World API Client
 */
class WorldApi {
  private getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new DataFetchError(
        'Supabase credentials not configured',
        {
          source: 'WorldApi',
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

  async getWorld(worldId: string): Promise<ApiResult<WorldRecord>> {
    try {
      logOperation('WorldApi', 'getWorld', 'Fetching world', { worldId }, { worldId });

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('world')
        .select('id,name,slug,ruleset,created_at')
        .eq('id', worldId)
        .single();

      if (error) {
        throw new DataFetchError(
          `Failed to fetch world: ${error.message}`,
          {
            source: 'WorldApi',
            operation: 'getWorld',
            userMessage: 'Unable to load world. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId },
          }
        );
      }

      if (!data) {
        throw new DataFetchError(
          'World not found',
          {
            source: 'WorldApi',
            operation: 'getWorld',
            userMessage: 'World not found. It may have been deleted.',
            technical: {
              worldId,
            },
            entityIds: { worldId },
          }
        );
      }

      return {
        data: data as WorldRecord,
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error fetching world',
            {
              source: 'WorldApi',
              operation: 'getWorld',
              userMessage: 'Unable to load world. Please try again.',
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

  async updateWorldName(worldId: string, newName: string): Promise<ApiResult<WorldRecord>> {
    try {
      logOperation('WorldApi', 'updateWorldName', 'Updating world name', { worldId, newName }, { worldId });

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('world')
        .update({ name: newName })
        .eq('id', worldId)
        .select()
        .single();

      if (error) {
        throw new DataFetchError(
          `Failed to update world name: ${error.message}`,
          {
            source: 'WorldApi',
            operation: 'updateWorldName',
            userMessage: 'Failed to update world name. Please try again.',
            technical: {
              supabaseError: error.message,
              supabaseCode: error.code,
            },
            entityIds: { worldId },
          }
        );
      }

      return {
        data: data as WorldRecord,
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error updating world name',
            {
              source: 'WorldApi',
              operation: 'updateWorldName',
              userMessage: 'Failed to update world name. Please try again.',
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
}

export const worldApi = new WorldApi();

