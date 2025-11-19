export type MapTheme = 'light' | 'dark';

export interface MapThemePalette {
  background: string;
  gridLine: string;
  roomFloor: string;
  roomBorder: string;
  corridor: string;
  corridorBorder: string;
  door: string;
  doorSecret: string;
  text: string;
  textMuted: string;
  entryMarker: string;
  exitMarker: string;
}

const mapThemePalettes: Record<MapTheme, MapThemePalette> = {
  light: {
    background: '#f8fafc',
    gridLine: 'rgba(15, 23, 42, 0.1)',
    roomFloor: '#e2e8f0',
    roomBorder: '#94a3b8',
    corridor: '#cbd5e1',
    corridorBorder: '#94a3b8',
    door: '#8b4513',
    doorSecret: '#f59e0b',
    text: '#0f172a',
    textMuted: '#475569',
    entryMarker: '#22c55e',
    exitMarker: '#ef4444',
  },
  dark: {
    background: '#0b0b10',
    gridLine: 'rgba(255, 255, 255, 0.05)',
    roomFloor: '#1e293b',
    roomBorder: '#475569',
    corridor: '#334155',
    corridorBorder: '#475569',
    door: '#8b4513',
    doorSecret: '#fbbf24',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    entryMarker: '#22c55e',
    exitMarker: '#ef4444',
  },
};

/**
 * Returns the map palette for the current UI theme.
 * Centralizes dungeon-map colors so other map-based views can inherit the same look.
 */
export function getMapThemePalette(theme: MapTheme): MapThemePalette {
  return mapThemePalettes[theme];
}

