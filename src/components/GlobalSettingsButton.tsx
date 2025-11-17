'use client';

import { usePathname } from 'next/navigation';
import SettingsIcon from './SettingsIcon';
import BuildBadge from './BuildBadge';

const HIDDEN_PATHS = ['/settings', '/login'];

export default function GlobalSettingsButton() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  const shouldHide = HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto">
        <SettingsIcon />
      </div>
      <div className="bg-black/70 rounded-md px-2 py-1 pointer-events-auto shadow-lg">
        <BuildBadge />
      </div>
    </div>
  );
}

