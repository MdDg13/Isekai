export type GenerationLogType = 'info' | 'warning' | 'error' | 'debug' | 'diagnostic';

export interface ProcessLogEntry {
  step: string;
  logType: GenerationLogType;
  message: string;
  timestamp: string;
  data?: Record<string, unknown> | null;
  durationMs?: number | null;
}

