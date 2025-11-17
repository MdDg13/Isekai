"use client";

import { useMemo } from "react";

export default function BuildBadge() {
  const version = useMemo(() => process.env.NEXT_PUBLIC_BUILD_VERSION || "dev", []);
  const time = useMemo(() => process.env.NEXT_PUBLIC_BUILD_TIME || "", []);
  return (
    <span className="text-[11px] font-mono text-gray-200 tracking-tight">
      v{version}{time ? ` • ${time}` : ""}
    </span>
  );
}


