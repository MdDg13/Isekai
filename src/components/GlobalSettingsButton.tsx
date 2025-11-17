'use client';

import { usePathname } from 'next/navigation';
import SettingsIcon from './SettingsIcon';

const HIDDEN_PATHS = ['/settings', '/login'];
const MAX_WIDTH = 1152;

export default function GlobalSettingsButton() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  const shouldHide = HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (shouldHide) {
    return null;
  }

  const horizontalOffset = `max(0.75rem, calc((100vw - ${MAX_WIDTH}px) / 2 + 0.75rem))`;

  return (
    <div style={{ position: 'fixed', top: '1rem', right: horizontalOffset, zIndex: 50 }}>
      <SettingsIcon />
    </div>
  );
}

