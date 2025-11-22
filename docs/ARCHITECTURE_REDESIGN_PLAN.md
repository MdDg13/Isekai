# Architecture Redesign Plan - Guaranteed Consistency & Error Visibility

## Executive Summary

This document defines a comprehensive redesign of the Isekai application architecture to guarantee:
1. **Consistency** - Standardized patterns across all code
2. **Error Visibility** - All errors logged in a Cursor-visible, structured format
3. **Code Quality** - Type-safe, maintainable, aligned with cursor.rules
4. **Maintainability** - Clear separation of concerns, testable components

**Status:** Design Phase - Implementation pending approval

---

## 1. Core Design Principles

### 1.1 Type Safety First
- **Zero `any` types** - Use `unknown` with type guards
- **Explicit return types** - All functions declare return types
- **Strict null checks** - Use optional chaining, nullish coalescing
- **Discriminated unions** - For state machines and error states

### 1.2 Error Handling Strategy
- **Structured Error Types** - All errors extend base error class
- **Error Context** - Every error includes: source, operation, user message, technical details
- **Logging Standard** - Consistent format for Cursor to parse
- **User Feedback** - All errors surface to users via toast system

### 1.3 Component Architecture
- **Single Responsibility** - Each component has one clear purpose
- **Composition over Inheritance** - Build complex UIs from simple pieces
- **Server/Client Separation** - Clear boundaries, no mixing
- **Feature-Based Organization** - Group by domain, not by type

### 1.4 Data Flow
- **Unidirectional** - Data flows down, events flow up
- **Type-Safe APIs** - All API calls have typed contracts
- **Error Boundaries** - React error boundaries at feature boundaries
- **Loading States** - Explicit loading/error/success states

---

## 2. Error Logging Architecture

### 2.1 Error Type System

```typescript
// src/lib/errors/types.ts

/**
 * Base error class for all application errors
 * Ensures consistent structure for Cursor visibility
 */
export class AppError extends Error {
  readonly code: string;
  readonly context: ErrorContext;
  readonly timestamp: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    severity: AppError['severity'] = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.severity = severity;
    
    // Ensure stack trace is preserved
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Serialize error for logging
   * Cursor can parse this structured format
   */
  toLogEntry(): ErrorLogEntry {
    return {
      type: 'error',
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export interface ErrorContext {
  /** Component/function where error occurred */
  source: string;
  /** Operation being performed */
  operation: string;
  /** User-facing message */
  userMessage: string;
  /** Technical details for debugging */
  technical?: Record<string, unknown>;
  /** Related entity IDs (worldId, npcId, etc.) */
  entityIds?: Record<string, string>;
}

export interface ErrorLogEntry {
  type: 'error';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  timestamp: string;
  stack?: string;
}

/**
 * Specific error types for different domains
 */
export class NavigationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'NAVIGATION_ERROR', context, 'high');
    this.name = 'NavigationError';
  }
}

export class DataFetchError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'DATA_FETCH_ERROR', context, 'medium');
    this.name = 'DataFetchError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'VALIDATION_ERROR', context, 'low');
    this.name = 'ValidationError';
  }
}

export class GenerationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'GENERATION_ERROR', context, 'high');
    this.name = 'GenerationError';
  }
}
```

### 2.2 Structured Logger

```typescript
// src/lib/logging/logger.ts

/**
 * Centralized logging system
 * All logs follow structured format for Cursor visibility
 */
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp: string;
  source: string;
  message: string;
  data?: Record<string, unknown>;
  error?: ErrorLogEntry;
  operation?: string;
  entityIds?: Record<string, string>;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log with structured format
   * Cursor can search/parse these logs
   */
  log(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      level: entry.level || 'info',
    };

    // Add to in-memory buffer
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with structured format
    const prefix = `[${fullEntry.timestamp}] [${fullEntry.level.toUpperCase()}] [${fullEntry.source}]`;
    const message = `${prefix} ${fullEntry.message}`;
    
    // Include structured data for Cursor parsing
    const consoleData = {
      ...fullEntry.data,
      ...(fullEntry.error && { error: fullEntry.error }),
      ...(fullEntry.operation && { operation: fullEntry.operation }),
      ...(fullEntry.entityIds && { entityIds: fullEntry.entityIds }),
    };

    switch (fullEntry.level) {
      case 'error':
        console.error(message, consoleData);
        break;
      case 'warn':
        console.warn(message, consoleData);
        break;
      case 'debug':
        console.debug(message, consoleData);
        break;
      default:
        console.log(message, consoleData);
    }
  }

  /**
   * Get recent logs for debugging
   * Cursor can call this to see recent activity
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filter: {
    level?: LogEntry['level'];
    source?: string;
    operation?: string;
    entityId?: string;
  }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.source && log.source !== filter.source) return false;
      if (filter.operation && log.operation !== filter.operation) return false;
      if (filter.entityId) {
        const entityIds = log.entityIds || {};
        return Object.values(entityIds).includes(filter.entityId);
      }
      return true;
    });
  }
}

export const logger = Logger.getInstance();

/**
 * Convenience functions for common log patterns
 */
export function logError(error: AppError, additionalContext?: Record<string, unknown>): void {
  logger.log({
    level: 'error',
    source: error.context.source,
    message: error.message,
    error: error.toLogEntry(),
    operation: error.context.operation,
    entityIds: error.context.entityIds,
    data: {
      ...error.context.technical,
      ...additionalContext,
    },
  });
}

export function logOperation(
  source: string,
  operation: string,
  message: string,
  data?: Record<string, unknown>,
  entityIds?: Record<string, string>
): void {
  logger.log({
    level: 'info',
    source,
    operation,
    message,
    data,
    entityIds,
  });
}
```

### 2.3 Error Boundary Integration

```typescript
// src/components/ErrorBoundary.tsx

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../lib/logging/logger';
import { AppError, ErrorContext } from '../lib/errors/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary with structured logging
 * Catches component errors and logs them in Cursor-visible format
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Convert to structured error
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error.message,
          'REACT_ERROR_BOUNDARY',
          {
            source: errorInfo.componentStack || 'Unknown',
            operation: 'render',
            userMessage: 'An unexpected error occurred. Please refresh the page.',
            technical: {
              componentStack: errorInfo.componentStack,
              errorName: error.name,
            },
          },
          'high'
        );

    logError(appError, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              {this.state.error instanceof AppError
                ? this.state.error.context.userMessage
                : 'An unexpected error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 3. Component Architecture Patterns

### 3.1 Feature-Based Structure

```
src/
  features/
    world/
      components/
        WorldDashboard.tsx          # Main feature component
        WorldNPCTab.tsx            # Sub-feature
        WorldDungeonTab.tsx        # Sub-feature
      hooks/
        useWorldData.ts            # Data fetching
        useWorldNPCs.ts            # NPC operations
        useWorldDungeons.ts         # Dungeon operations
      api/
        world-api.ts               # Type-safe API calls
        npc-api.ts                 # NPC API
        dungeon-api.ts             # Dungeon API
      types/
        world.types.ts             # Feature-specific types
      utils/
        world-utils.ts             # Feature utilities
    npc/
      components/
        NPCDetailPage.tsx
        NPCPortrait.tsx
      hooks/
        useNPCDetail.ts
        useNPCPortrait.ts
      api/
        npc-detail-api.ts
      types/
        npc-detail.types.ts
    dungeon/
      components/
        DungeonGenerator.tsx
        DungeonDetailView.tsx
      hooks/
        useDungeonGeneration.ts
        useDungeonDetail.ts
      api/
        dungeon-api.ts
      types/
        dungeon.types.ts
  shared/
    components/                    # Reusable UI components
    hooks/                         # Shared hooks
    lib/                           # Core libraries
      errors/                      # Error system
      logging/                     # Logging system
      api/                         # API client
    types/                         # Shared types
```

### 3.2 Component Pattern Template

```typescript
// src/features/world/components/WorldNPCTab.tsx

'use client';

import { useWorldNPCs } from '../hooks/useWorldNPCs';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { NPCSkeleton } from './NPCSkeleton';
import { NPCList } from './NPCList';
import { NPCGenerator } from './NPCGenerator';

/**
 * World NPC Tab Component
 * 
 * Responsibilities:
 * - Orchestrate NPC list and generator
 * - Handle tab-level state
 * - Provide error boundary
 * 
 * Pattern: Container component with feature hooks
 */
export function WorldNPCTab({ worldId }: { worldId: string }) {
  const {
    npcs,
    loading,
    error,
    generateNPC,
    deleteNPC,
    isGenerating,
  } = useWorldNPCs(worldId);

  if (loading) {
    return <NPCSkeleton />;
  }

  if (error) {
    // Error is already logged by hook
    return (
      <div className="text-red-400">
        {error.context.userMessage}
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400">
          An error occurred in the NPC tab. Please refresh.
        </div>
      }
    >
      <div className="space-y-6">
        <NPCGenerator
          worldId={worldId}
          onGenerate={generateNPC}
          isGenerating={isGenerating}
        />
        <NPCList
          npcs={npcs}
          onDelete={deleteNPC}
        />
      </div>
    </ErrorBoundary>
  );
}
```

### 3.3 Hook Pattern Template

```typescript
// src/features/world/hooks/useWorldNPCs.ts

import { useState, useEffect, useCallback } from 'react';
import { AppError, DataFetchError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';
import { npcApi } from '../api/npc-api';
import type { WorldNPC } from '../types/world.types';

interface UseWorldNPCsResult {
  npcs: WorldNPC[];
  loading: boolean;
  error: AppError | null;
  generateNPC: (params: GenerateNPCParams) => Promise<void>;
  deleteNPC: (id: string) => Promise<void>;
  isGenerating: boolean;
}

/**
 * Hook for managing world NPCs
 * 
 * Responsibilities:
 * - Fetch NPC list
 * - Handle generation
 * - Handle deletion
 * - Error handling with structured logging
 * 
 * Pattern: Feature hook with typed API calls
 */
export function useWorldNPCs(worldId: string): UseWorldNPCsResult {
  const [npcs, setNpcs] = useState<WorldNPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch NPCs
  useEffect(() => {
    let cancelled = false;

    async function fetchNPCs() {
      logOperation('useWorldNPCs', 'fetch_npcs', 'Fetching world NPCs', {
        worldId,
      }, { worldId });

      try {
        setLoading(true);
        setError(null);

        const result = await npcApi.list(worldId);

        if (cancelled) return;

        if (result.error) {
          throw result.error;
        }

        setNpcs(result.data || []);
        logOperation('useWorldNPCs', 'fetch_npcs', 'NPCs fetched successfully', {
          count: result.data?.length || 0,
        }, { worldId });
      } catch (err) {
        if (cancelled) return;

        const appError = err instanceof AppError
          ? err
          : new DataFetchError(
              'Failed to fetch NPCs',
              {
                source: 'useWorldNPCs',
                operation: 'fetch_npcs',
                userMessage: 'Unable to load NPCs. Please try again.',
                technical: {
                  originalError: err instanceof Error ? err.message : String(err),
                },
                entityIds: { worldId },
              }
            );

        logError(appError);
        setError(appError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNPCs();

    return () => {
      cancelled = true;
    };
  }, [worldId]);

  // Generate NPC
  const generateNPC = useCallback(async (params: GenerateNPCParams) => {
    logOperation('useWorldNPCs', 'generate_npc', 'Starting NPC generation', {
      worldId,
      params,
    }, { worldId });

    try {
      setIsGenerating(true);
      setError(null);

      const result = await npcApi.generate(worldId, params);

      if (result.error) {
        throw result.error;
      }

      // Refresh list
      const listResult = await npcApi.list(worldId);
      if (listResult.data) {
        setNpcs(listResult.data);
      }

      logOperation('useWorldNPCs', 'generate_npc', 'NPC generated successfully', {
        npcId: result.data?.id,
      }, { worldId, npcId: result.data?.id });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new GenerationError(
            'Failed to generate NPC',
            {
              source: 'useWorldNPCs',
              operation: 'generate_npc',
              userMessage: 'NPC generation failed. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
                params,
              },
              entityIds: { worldId },
            }
          );

      logError(appError);
      setError(appError);
      throw appError; // Re-throw for component to handle
    } finally {
      setIsGenerating(false);
    }
  }, [worldId]);

  // Delete NPC
  const deleteNPC = useCallback(async (id: string) => {
    logOperation('useWorldNPCs', 'delete_npc', 'Deleting NPC', {
      worldId,
      npcId: id,
    }, { worldId, npcId: id });

    try {
      const result = await npcApi.delete(worldId, id);

      if (result.error) {
        throw result.error;
      }

      // Remove from list
      setNpcs(prev => prev.filter(npc => npc.id !== id));

      logOperation('useWorldNPCs', 'delete_npc', 'NPC deleted successfully', {
        npcId: id,
      }, { worldId, npcId: id });
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Failed to delete NPC',
            {
              source: 'useWorldNPCs',
              operation: 'delete_npc',
              userMessage: 'Failed to delete NPC. Please try again.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
              entityIds: { worldId, npcId: id },
            }
          );

      logError(appError);
      setError(appError);
      throw appError;
    }
  }, [worldId]);

  return {
    npcs,
    loading,
    error,
    generateNPC,
    deleteNPC,
    isGenerating,
  };
}
```

### 3.4 API Client Pattern

```typescript
// src/features/world/api/npc-api.ts

import { createClient } from '@supabase/supabase-js';
import { AppError, DataFetchError, GenerationError } from '@/shared/lib/errors/types';
import { logOperation, logError } from '@/shared/lib/logging/logger';
import type { WorldNPC, GenerateNPCParams } from '../types/world.types';

/**
 * Type-safe API result
 */
export interface ApiResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * NPC API Client
 * 
 * Responsibilities:
 * - Type-safe API calls
 * - Error handling
 * - Structured logging
 * 
 * Pattern: Thin wrapper around Supabase with error handling
 */
class NPCApi {
  private getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new DataFetchError(
        'Supabase credentials not configured',
        {
          source: 'NPCApi',
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
      logOperation('NPCApi', 'list', 'Fetching NPC list', { worldId }, { worldId });

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('world_npc')
        .select('*')
        .eq('world_id', worldId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DataFetchError(
          `Failed to fetch NPCs: ${error.message}`,
          {
            source: 'NPCApi',
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
        data: data as WorldNPC[],
        error: null,
      };
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new DataFetchError(
            'Unexpected error fetching NPCs',
            {
              source: 'NPCApi',
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
      logOperation('NPCApi', 'generate', 'Generating NPC', { worldId, params }, { worldId });

      const response = await fetch('/api/generate-world-npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          ...params,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GenerationError(
          errorData.error || `Generation failed: ${response.statusText}`,
          {
            source: 'NPCApi',
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
              source: 'NPCApi',
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
      logOperation('NPCApi', 'delete', 'Deleting NPC', { worldId, npcId }, { worldId, npcId });

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
            source: 'NPCApi',
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
              source: 'NPCApi',
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
}

export const npcApi = new NPCApi();
```

---

## 4. Navigation Architecture

### 4.1 Route Parameter Extraction

```typescript
// src/shared/lib/navigation/route-params.ts

import { NavigationError } from '@/shared/lib/errors/types';
import { logOperation } from '@/shared/lib/logging/logger';

/**
 * Extract route parameters consistently
 * Handles Cloudflare Pages static export redirects
 */
export interface RouteParams {
  worldId: string;
  npcId?: string;
  dungeonId?: string;
}

/**
 * Extract worldId and npcId from URL
 * Priority: query params > pathname > sessionStorage
 */
export function extractRouteParams(
  searchParams: URLSearchParams | null,
  pathname: string | null
): RouteParams {
  logOperation('route-params', 'extract', 'Extracting route parameters', {
    hasSearchParams: !!searchParams,
    pathname,
  });

  // Priority 1: Query parameters (most reliable with static export)
  const worldId = searchParams?.get('worldId');
  const npcId = searchParams?.get('npcId');
  const dungeonId = searchParams?.get('dungeonId');

  if (worldId) {
    return {
      worldId,
      ...(npcId && { npcId }),
      ...(dungeonId && { dungeonId }),
    };
  }

  // Priority 2: Extract from pathname
  if (pathname) {
    const worldMatch = pathname.match(/\/world\/([^/]+)/);
    const npcMatch = pathname.match(/\/npc\/([^/]+)/);
    const dungeonMatch = pathname.match(/\/dungeon\/([^/]+)/);

    if (worldMatch && worldMatch[1] !== 'world') {
      return {
        worldId: worldMatch[1],
        ...(npcMatch && npcMatch[1] !== 'npc' && { npcId: npcMatch[1] }),
        ...(dungeonMatch && dungeonMatch[1] !== 'dungeon' && { dungeonId: dungeonMatch[1] }),
      };
    }
  }

  // Priority 3: SessionStorage (fallback)
  if (typeof window !== 'undefined') {
    const storedWorldId = sessionStorage.getItem('route_worldId');
    const storedNpcId = sessionStorage.getItem('route_npcId');
    const storedDungeonId = sessionStorage.getItem('route_dungeonId');

    if (storedWorldId) {
      return {
        worldId: storedWorldId,
        ...(storedNpcId && { npcId: storedNpcId }),
        ...(storedDungeonId && { dungeonId: storedDungeonId }),
      };
    }
  }

  // No valid params found
  throw new NavigationError(
    'Unable to extract route parameters',
    {
      source: 'route-params',
      operation: 'extract',
      userMessage: 'Invalid page URL. Please navigate from the world dashboard.',
      technical: {
        searchParams: searchParams ? Object.fromEntries(searchParams) : null,
        pathname,
      },
    }
  );
}

/**
 * Build navigation URL with query parameters
 * Ensures compatibility with static export
 */
export function buildRouteUrl(
  basePath: string,
  params: RouteParams
): string {
  const url = new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('worldId', params.worldId);
  if (params.npcId) {
    url.searchParams.set('npcId', params.npcId);
  }
  if (params.dungeonId) {
    url.searchParams.set('dungeonId', params.dungeonId);
  }
  return url.pathname + url.search;
}
```

### 4.2 Navigation Hook

```typescript
// src/shared/hooks/useRouteParams.ts

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { extractRouteParams, type RouteParams } from '@/shared/lib/navigation/route-params';
import { NavigationError } from '@/shared/lib/errors/types';
import { logError } from '@/shared/lib/logging/logger';

/**
 * Hook for extracting route parameters
 * Handles client-side mounting and error states
 */
export function useRouteParams(): {
  params: RouteParams | null;
  error: NavigationError | null;
  loading: boolean;
} {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [params, setParams] = useState<RouteParams | null>(null);
  const [error, setError] = useState<NavigationError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const extracted = extractRouteParams(searchParams, pathname);
      setParams(extracted);
      setError(null);
    } catch (err) {
      const navError = err instanceof NavigationError
        ? err
        : new NavigationError(
            'Failed to extract route parameters',
            {
              source: 'useRouteParams',
              operation: 'extract',
              userMessage: 'Invalid page URL. Please navigate from the world dashboard.',
              technical: {
                originalError: err instanceof Error ? err.message : String(err),
              },
            }
          );

      logError(navError);
      setError(navError);
      setParams(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams, pathname]);

  return { params, error, loading };
}
```

---

## 5. Toast Notification System

### 5.1 Toast Context

```typescript
// src/shared/contexts/ToastContext.tsx

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppError } from '@/shared/lib/errors/types';
import { Toast, type ToastVariant } from '@/shared/components/ui/Toast';

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  showError: (error: AppError) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    duration = 3500
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, variant, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const showError = useCallback((error: AppError) => {
    showToast(error.context.userMessage, 'error', 5000);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, toasts, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => removeToast(toast.id)}
            autoHideMs={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

---

## 6. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create error type system (`src/shared/lib/errors/`)
- [ ] Create structured logger (`src/shared/lib/logging/`)
- [ ] Create ErrorBoundary component
- [ ] Create Toast context and provider
- [ ] Create route parameter extraction utilities
- [ ] Update root layout to include providers

### Phase 2: Refactor Core Features (Week 2)
- [ ] Refactor world feature to new architecture
- [ ] Refactor NPC feature to new architecture
- [ ] Refactor dungeon feature to new architecture
- [ ] Replace all `console.log/error` with structured logger
- [ ] Replace all `alert()` with toast system
- [ ] Add error boundaries to all feature components

### Phase 3: Testing & Validation (Week 3)
- [ ] Test error logging visibility (Cursor can see logs)
- [ ] Test error handling flows
- [ ] Test navigation reliability
- [ ] Validate type safety (zero `any` types)
- [ ] Performance audit

---

## 7. Success Criteria

### Code Quality
- ✅ Zero `any` types (use `unknown` with type guards)
- ✅ All functions have explicit return types
- ✅ All errors extend `AppError` base class
- ✅ All API calls use typed `ApiResult<T>` pattern
- ✅ All components wrapped in ErrorBoundary

### Error Visibility
- ✅ All errors logged with structured format
- ✅ Cursor can search logs by: source, operation, entityId
- ✅ Errors include user message and technical details
- ✅ Error boundaries catch and log React errors

### Consistency
- ✅ All features follow same architecture pattern
- ✅ All hooks follow same error handling pattern
- ✅ All API clients follow same structure
- ✅ All navigation uses same parameter extraction

### User Experience
- ✅ All errors show user-friendly messages via toast
- ✅ Loading states for all async operations
- ✅ No blank screens or silent failures
- ✅ Clear error recovery paths

---

## 8. Migration Strategy

### Step 1: Add Foundation (Non-Breaking)
1. Create error types and logger (new files)
2. Create Toast context (new files)
3. Add to root layout (wraps existing code)

### Step 2: Refactor Incrementally
1. Start with one feature (e.g., NPC detail page)
2. Refactor to new patterns
3. Test thoroughly
4. Move to next feature

### Step 3: Remove Old Patterns
1. Remove all `console.log/error` calls
2. Remove all `alert()` calls
3. Remove old error handling patterns
4. Update documentation

---

**Document Version:** 1.0  
**Status:** Design Complete - Ready for Implementation  
**Next Step:** Review and approval before Phase 1 implementation

