'use client';

import { usePathname } from 'next/navigation';
import SettingsIcon from './SettingsIcon';

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
    <div className="fixed top-4 right-4 z-50">
      <SettingsIcon />
    </div>
  );
}

