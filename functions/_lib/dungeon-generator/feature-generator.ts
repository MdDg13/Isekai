import type { Room, RoomFeature } from './types';
import type { LayoutProfile } from './layout-profiles';

interface FeatureWeights {
  trap: number;
  treasure: number;
  encounter: number;
  altar: number;
  lair: number;
}

const FEATURE_WEIGHTS: Record<LayoutProfile['featureBias'], FeatureWeights> = {
  religious: { trap: 0.15, treasure: 0.25, encounter: 0.2, altar: 0.35, lair: 0.05 },
  military: { trap: 0.3, treasure: 0.1, encounter: 0.25, altar: 0.05, lair: 0.3 },
  organic: { trap: 0.1, treasure: 0.05, encounter: 0.35, altar: 0.05, lair: 0.45 },
  arcane: { trap: 0.25, treasure: 0.25, encounter: 0.2, altar: 0.2, lair: 0.1 },
  wild: { trap: 0.15, treasure: 0.15, encounter: 0.3, altar: 0.05, lair: 0.35 },
};

export function addRoomFeatures(
  rooms: Room[],
  profile: LayoutProfile,
  difficulty: "easy" | "medium" | "hard" | "deadly"
): Room[] {
  const weights = FEATURE_WEIGHTS[profile.featureBias];
  const difficultyScalar = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 1 : difficulty === 'hard' ? 1.2 : 1.4;

  return rooms.map((room) => {
    if (room.type === 'entry' || room.type === 'exit') {
      return room;
    }

    const features: RoomFeature[] = [...room.features];
    const rarityRoll = Math.random();

    if (rarityRoll < weights.trap * difficultyScalar) {
      features.push({
        type: 'trap',
        description: 'Hidden pressure plate trap',
        metadata: { severity: difficulty },
        icon: 'trap',
      });
    } else if (rarityRoll < weights.trap * difficultyScalar + weights.treasure) {
      features.push({
        type: 'treasure',
        description: 'Stashed valuables',
        metadata: { guarded: rarityRoll < 0.4 },
        icon: 'treasure',
      });
    } else if (rarityRoll < weights.trap * difficultyScalar + weights.treasure + weights.encounter) {
      features.push({
        type: 'encounter',
        description: 'Active inhabitants',
        metadata: { intensity: difficulty },
        icon: 'encounter',
      });
    } else if (rarityRoll < weights.trap * difficultyScalar + weights.treasure + weights.encounter + weights.altar) {
      features.push({
        type: 'altar',
        description: 'Ritual focal point',
        metadata: { blessed: profile.featureBias === 'religious' },
        icon: 'altar',
      });
    } else if (rarityRoll < 1) {
      features.push({
        type: 'decoration',
        description: 'Nest or lair markings',
        metadata: { feral: true },
        icon: 'lair',
      });
    }

    // Add secondary feature for large rooms
    if (room.width * room.height > 80 && Math.random() < 0.3) {
      features.push({
        type: 'chest',
        description: 'Side chamber cache',
        metadata: { locked: Math.random() < 0.5 },
        icon: 'treasure',
      });
    }

    return { ...room, features };
  });
}

