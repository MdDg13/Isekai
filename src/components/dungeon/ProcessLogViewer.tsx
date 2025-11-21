"use client";

import { useState } from "react";
import type { ProcessLogEntry } from "../../types/generation";

interface ProcessLogViewerProps {
  logs: ProcessLogEntry[];
  title?: string;
}

export default function ProcessLogViewer({ logs, title = "Generation Process Log" }: ProcessLogViewerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-200"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span>{title}</span>
        <span className="text-xs text-gray-400">{expanded ? "Hide" : "Show"}</span>
      </button>
      {expanded && (
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
          {logs.map((log, idx) => (
            <div key={`${log.timestamp}-${idx}`} className="px-4 py-3 text-xs text-gray-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-100">{log.step}</span>
                <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className={`text-sm ${log.logType === 'error' ? 'text-red-400' : log.logType === 'warning' ? 'text-yellow-300' : 'text-gray-200'}`}>
                {log.message}
              </p>
              {log.data && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-400">Details</summary>
                  <pre className="mt-1 rounded bg-gray-950/70 p-2 text-[10px] leading-tight text-gray-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

