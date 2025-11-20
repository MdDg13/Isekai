/**
 * Generation Logger
 * 
 * Logs detailed information about the NPC generation process for debugging and analysis.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenerationLogEntry {
  generationRequestId: string;
  worldId: string;
  step: 'procedural' | 'context_fetch' | 'ai_enhance' | 'critique' | 'style_fix' | 'grammar_fix' | 'programmatic_fix' | 'portrait_generation' | 'portrait_upload' | 'config_check' | 'storage_check' | 'api_check' | 'final';
  logType: 'info' | 'warning' | 'error' | 'debug' | 'diagnostic';
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export class GenerationLogger {
  private logs: GenerationLogEntry[] = [];
  private supabase: SupabaseClient | null;
  private generationRequestId: string;
  private worldId: string;
  private stepStartTimes: Map<string, number> = new Map();

  constructor(supabase: SupabaseClient | null, generationRequestId: string, worldId: string) {
    this.supabase = supabase;
    this.generationRequestId = generationRequestId;
    this.worldId = worldId;
  }

  startStep(step: GenerationLogEntry['step']): void {
    this.stepStartTimes.set(step, Date.now());
  }

  endStep(step: GenerationLogEntry['step']): void {
    const startTime = this.stepStartTimes.get(step);
    if (startTime) {
      const durationMs = Date.now() - startTime;
      this.stepStartTimes.delete(step);
      // Update last log entry for this step with duration
      const lastLog = this.logs[this.logs.length - 1];
      if (lastLog && lastLog.step === step) {
        lastLog.durationMs = durationMs;
      }
    }
  }

  log(entry: Omit<GenerationLogEntry, 'generationRequestId' | 'worldId'>): void {
    const logEntry: GenerationLogEntry = {
      ...entry,
      generationRequestId: this.generationRequestId,
      worldId: this.worldId,
    };
    this.logs.push(logEntry);
    
    // Also log to console with prefix
    const prefix = `[Generation ${entry.step}]`;
    const message = `${prefix} ${entry.message}`;
    if (entry.logType === 'error') {
      console.error(message, entry.data || '');
    } else if (entry.logType === 'warning') {
      console.warn(message, entry.data || '');
    } else if (entry.logType === 'debug' || entry.logType === 'diagnostic') {
      console.log(message, entry.data || '');
    } else {
      console.log(message, entry.data || '');
    }
  }

  async flush(): Promise<void> {
    if (!this.supabase || this.logs.length === 0) {
      return;
    }

    try {
      const logRows = this.logs.map(log => ({
        generation_request_id: log.generationRequestId,
        world_id: log.worldId,
        step: log.step,
        log_type: log.logType,
        message: log.message,
        data: log.data || null,
        duration_ms: log.durationMs || null,
      }));

      const { error } = await this.supabase
        .from('generation_log')
        .insert(logRows);

      if (error) {
        console.error('[GenerationLogger] Failed to save logs:', error);
      } else {
        console.log(`[GenerationLogger] Saved ${this.logs.length} log entries`);
      }
    } catch (err) {
      console.error('[GenerationLogger] Error flushing logs:', err);
    }
  }

  getLogs(): GenerationLogEntry[] {
    return [...this.logs];
  }

  getLogsByStep(step: GenerationLogEntry['step']): GenerationLogEntry[] {
    return this.logs.filter(log => log.step === step);
  }
}

