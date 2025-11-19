export type FeatureIconKey = 'trap' | 'treasure' | 'altar' | 'lair' | 'encounter';

export const FEATURE_ICON_DEFS: Record<FeatureIconKey, { fill: string; stroke: string; path: string; viewBox?: string }> = {
  trap: {
    fill: '#f87171',
    stroke: '#7f1d1d',
    path: 'M8 0 L16 16 L0 16 Z',
    viewBox: '0 0 16 16',
  },
  treasure: {
    fill: '#fcd34d',
    stroke: '#92400e',
    path: 'M1 6 H15 V15 H1 Z M1 6 L8 2 L15 6',
    viewBox: '0 0 16 16',
  },
  altar: {
    fill: '#c4b5fd',
    stroke: '#4c1d95',
    path: 'M8 1 L15 8 L8 15 L1 8 Z',
    viewBox: '0 0 16 16',
  },
  lair: {
    fill: '#f97316',
    stroke: '#7c2d12',
    path: 'M8 2 C5 2 2 5 2 8 C2 11 5 14 8 14 C11 14 14 11 14 8 C14 5 11 2 8 2 Z M5 9 C7 10 9 10 11 9',
    viewBox: '0 0 16 16',
  },
  encounter: {
    fill: '#60a5fa',
    stroke: '#1e3a8a',
    path: 'M2 14 L14 2 M14 14 L2 2',
    viewBox: '0 0 16 16',
  },
};

export const FEATURE_ICON_LABELS: Record<FeatureIconKey, string> = {
  trap: 'Trap',
  treasure: 'Treasure',
  altar: 'Altar/Ritual',
  lair: 'Nest/Lair',
  encounter: 'Encounter',
};

export function FeatureLegendIcon({ icon }: { icon: FeatureIconKey }) {
  const def = FEATURE_ICON_DEFS[icon];
  if (!def) return null;
  return (
    <svg width={20} height={20} viewBox={def.viewBox || '0 0 16 16'}>
      <path d={def.path} fill={def.fill} stroke={def.stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

