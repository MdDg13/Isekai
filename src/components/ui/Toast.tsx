"use client";

import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
  autoHideMs?: number;
}

export function Toast({ message, variant = "info", onDismiss, autoHideMs = 3500 }: ToastProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const timer = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onDismiss]);

  if (!message) return null;

  const variantClasses: Record<ToastVariant, string> = {
    success: "bg-emerald-600/90 border-emerald-400 text-white",
    error: "bg-red-700/90 border-red-400 text-white",
    info: "bg-slate-800/90 border-slate-600 text-white",
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[999] flex justify-center px-4">
      <div
        role="status"
        className={`pointer-events-auto relative flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${variantClasses[variant]}`}
      >
        <span className="text-sm">{message}</span>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss notification"
            className="ml-auto rounded-full bg-black/20 px-2 py-0.5 text-xs uppercase tracking-wide text-white/70 transition hover:bg-black/40"
            onClick={onDismiss}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

