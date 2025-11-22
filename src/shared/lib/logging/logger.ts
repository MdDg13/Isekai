/**
 * Structured Logger
 * 
 * Centralized logging system with consistent format
 * All logs follow structured format for Cursor visibility
 */

import type { AppError, ErrorLogEntry } from '../errors/types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  source: string;
  message: string;
  data?: Record<string, unknown>;
  error?: ErrorLogEntry;
  operation?: string;
  entityIds?: Record<string, string | undefined>;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000; // Keep last 1000 logs in memory

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
  log(entry: Omit<LogEntry, 'timestamp' | 'level'> & { level?: LogLevel }): void {
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
    const consoleData: Record<string, unknown> = {
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
    level?: LogLevel;
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

  /**
   * Clear all logs (useful for testing)
   */
  clear(): void {
    this.logs = [];
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

export function logWarning(
  source: string,
  operation: string,
  message: string,
  data?: Record<string, unknown>,
  entityIds?: Record<string, string>
): void {
  logger.log({
    level: 'warn',
    source,
    operation,
    message,
    data,
    entityIds,
  });
}

export function logDebug(
  source: string,
  operation: string,
  message: string,
  data?: Record<string, unknown>,
  entityIds?: Record<string, string>
): void {
  logger.log({
    level: 'debug',
    source,
    operation,
    message,
    data,
    entityIds,
  });
}

