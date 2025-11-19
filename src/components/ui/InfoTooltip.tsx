"use client";

import { ReactNode, useState } from "react";

interface InfoTooltipProps {
  content: ReactNode;
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function InfoTooltip({ content, label = "More info", side = "top" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-[10px] text-gray-300 hover:text-white"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute z-10 min-w-[12rem] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-2xl ${
            side === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : side === "bottom"
                ? "top-full mt-2 left-1/2 -translate-x-1/2"
                : side === "left"
                  ? "right-full mr-2 top-1/2 -translate-y-1/2"
                  : "left-full ml-2 top-1/2 -translate-y-1/2"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

