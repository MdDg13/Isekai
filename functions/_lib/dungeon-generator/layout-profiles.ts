import type { DungeonDetail } from './types';

export type BaseDungeonType = DungeonDetail['identity']['type'] | 'temple' | 'lair';

export interface LayoutProfile {
  minRoomSize: number;
  maxRoomSize: number;
  minSplitSize: number;
  roomPadding: number;
  roomDensity: number;
  splitRatio: number;
  extraConnections: number;
  trapWeight: number;
  treasureWeight: number;
  featureBias: 'religious' | 'military' | 'organic' | 'arcane' | 'wild';
  defaultTileSpan: number;
}

export const LAYOUT_PROFILES: Record<BaseDungeonType, LayoutProfile> = {
  dungeon: {
    minRoomSize: 2,
    maxRoomSize: 10,
    minSplitSize: 6,
    roomPadding: 1,
    roomDensity: 0.3,
    splitRatio: 0.5,
    extraConnections: 0.25,
    trapWeight: 0.2,
    treasureWeight: 0.15,
    featureBias: 'arcane',
    defaultTileSpan: 2,
  },
  cave: {
    minRoomSize: 2,
    maxRoomSize: 8,
    minSplitSize: 5,
    roomPadding: 2,
    roomDensity: 0.4,
    splitRatio: 0.45,
    extraConnections: 0.35,
    trapWeight: 0.1,
    treasureWeight: 0.05,
    featureBias: 'organic',
    defaultTileSpan: 2,
  },
  ruin: {
    minRoomSize: 3,
    maxRoomSize: 9,
    minSplitSize: 6,
    roomPadding: 1,
    roomDensity: 0.32,
    splitRatio: 0.48,
    extraConnections: 0.2,
    trapWeight: 0.25,
    treasureWeight: 0.2,
    featureBias: 'arcane',
    defaultTileSpan: 2,
  },
  fortress: {
    minRoomSize: 4,
    maxRoomSize: 11,
    minSplitSize: 7,
    roomPadding: 1,
    roomDensity: 0.28,
    splitRatio: 0.52,
    extraConnections: 0.18,
    trapWeight: 0.35,
    treasureWeight: 0.1,
    featureBias: 'military',
    defaultTileSpan: 2,
  },
  tower: {
    minRoomSize: 3,
    maxRoomSize: 8,
    minSplitSize: 5,
    roomPadding: 1,
    roomDensity: 0.25,
    splitRatio: 0.55,
    extraConnections: 0.2,
    trapWeight: 0.2,
    treasureWeight: 0.25,
    featureBias: 'arcane',
    defaultTileSpan: 2,
  },
  temple: {
    minRoomSize: 4,
    maxRoomSize: 12,
    minSplitSize: 7,
    roomPadding: 1,
    roomDensity: 0.27,
    splitRatio: 0.5,
    extraConnections: 0.22,
    trapWeight: 0.15,
    treasureWeight: 0.3,
    featureBias: 'religious',
    defaultTileSpan: 2,
  },
  lair: {
    minRoomSize: 3,
    maxRoomSize: 9,
    minSplitSize: 5,
    roomPadding: 2,
    roomDensity: 0.35,
    splitRatio: 0.47,
    extraConnections: 0.3,
    trapWeight: 0.18,
    treasureWeight: 0.22,
    featureBias: 'wild',
    defaultTileSpan: 2,
  },
};

export function resolveDungeonType(theme?: string): BaseDungeonType {
  if (!theme) return 'dungeon';
  const norm = theme.toLowerCase();
  if (norm.includes('cave') || norm.includes('grotto')) return 'cave';
  if (norm.includes('ruin') || norm.includes('crypt')) return 'ruin';
  if (norm.includes('fort') || norm.includes('keep') || norm.includes('citadel')) return 'fortress';
  if (norm.includes('tower') || norm.includes('spire')) return 'tower';
  if (norm.includes('temple') || norm.includes('cathedral')) return 'temple';
  if (norm.includes('lair') || norm.includes('den')) return 'lair';
  return 'dungeon';
}

export function getLayoutProfile(theme?: string): { type: BaseDungeonType; profile: LayoutProfile } {
  const type = resolveDungeonType(theme);
  return { type, profile: LAYOUT_PROFILES[type] };
}

