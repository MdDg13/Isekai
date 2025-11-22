'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../lib/logging/logger';
import { AppError } from '../lib/errors/types';

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

