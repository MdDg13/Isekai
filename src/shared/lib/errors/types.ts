/**
 * Error Type System
 * 
 * All application errors extend AppError base class
 * Ensures consistent structure for Cursor visibility
 */

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
  entityIds?: Record<string, string | undefined>;
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
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
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

/**
 * Navigation errors - route parameter extraction, routing failures
 */
export class NavigationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'NAVIGATION_ERROR', context, 'high');
    this.name = 'NavigationError';
  }
}

/**
 * Data fetch errors - Supabase queries, API calls
 */
export class DataFetchError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'DATA_FETCH_ERROR', context, 'medium');
    this.name = 'DataFetchError';
  }
}

/**
 * Validation errors - form validation, input validation
 */
export class ValidationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'VALIDATION_ERROR', context, 'low');
    this.name = 'ValidationError';
  }
}

/**
 * Generation errors - NPC/dungeon generation failures
 */
export class GenerationError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'GENERATION_ERROR', context, 'high');
    this.name = 'GenerationError';
  }
}

/**
 * Storage errors - Supabase Storage operations
 */
export class StorageError extends AppError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'STORAGE_ERROR', context, 'medium');
    this.name = 'StorageError';
  }
}

