// Dungeon type definitions and tooltips

export type DungeonType = 'dungeon' | 'cave' | 'ruin' | 'fortress' | 'tower' | 'temple' | 'lair';

export interface DungeonTypeDefinition {
  name: string;
  description: string;
  generationNotes: string;
  typicalFeatures: string[];
  roomDensity: 'low' | 'medium' | 'high';
  corridorDensity: 'low' | 'medium' | 'high';
}

export const DUNGEON_TYPE_DEFINITIONS: Record<DungeonType, DungeonTypeDefinition> = {
  dungeon: {
    name: 'Dungeon',
    description: 'Classic underground prison or complex with stone walls and corridors. Typically man-made with regular room layouts.',
    generationNotes: 'Uses structured BSP generation with rectangular rooms and straight corridors. Higher room density with organized layout. Often includes cells, storage rooms, and guard posts.',
    typicalFeatures: ['Cells', 'Guard rooms', 'Storage areas', 'Torture chambers', 'Barracks'],
    roomDensity: 'high',
    corridorDensity: 'medium',
  },
  cave: {
    name: 'Cave',
    description: 'Natural underground cavern system with irregular, organic shapes. Formed by erosion or geological processes.',
    generationNotes: 'Uses cellular automata or organic algorithms for irregular room shapes. Lower room density with winding, natural corridors. Rooms follow natural cave formations.',
    typicalFeatures: ['Caverns', 'Tunnels', 'Stalactites', 'Water pools', 'Natural chambers'],
    roomDensity: 'low',
    corridorDensity: 'low',
  },
  ruin: {
    name: 'Ruin',
    description: 'Abandoned or destroyed structure, partially collapsed. Mix of intact and damaged areas with debris.',
    generationNotes: 'Combines structured layout with random damage. Medium room density with some blocked passages. Includes collapsed rooms and rubble-filled corridors.',
    typicalFeatures: ['Collapsed rooms', 'Debris', 'Broken walls', 'Exposed foundations', 'Overgrown areas'],
    roomDensity: 'medium',
    corridorDensity: 'medium',
  },
  fortress: {
    name: 'Fortress',
    description: 'Military stronghold with defensive architecture. Thick walls, strategic chokepoints, and organized layout.',
    generationNotes: 'Highly structured with defensive considerations. High room density with multiple levels. Includes barracks, armories, and defensive positions. Corridors are wide for troop movement.',
    typicalFeatures: ['Barracks', 'Armories', 'Guard towers', 'Defensive positions', 'Command centers'],
    roomDensity: 'high',
    corridorDensity: 'high',
  },
  tower: {
    name: 'Tower',
    description: 'Vertical structure with multiple floors connected by stairs. Compact, vertical layout with circular or square rooms.',
    generationNotes: 'Vertical generation with smaller floor plans. Medium room density per level. Heavy emphasis on vertical connections via stairs. Rooms are typically smaller and more compact.',
    typicalFeatures: ['Spiral stairs', 'Circular rooms', 'Vertical shafts', 'Balconies', 'Lookout points'],
    roomDensity: 'medium',
    corridorDensity: 'low',
  },
  temple: {
    name: 'Temple',
    description: 'Sacred structure with ceremonial spaces. Grand halls, altars, and organized worship areas.',
    generationNotes: 'Symmetrical or organized layout with large central spaces. Medium room density with wide corridors for processions. Includes ceremonial rooms, shrines, and meditation chambers.',
    typicalFeatures: ['Altars', 'Shrines', 'Ceremonial halls', 'Meditation chambers', 'Relic storage'],
    roomDensity: 'medium',
    corridorDensity: 'medium',
  },
  lair: {
    name: 'Lair',
    description: 'Creature dwelling, often natural or adapted from existing structures. Organic layout suited to the inhabitant.',
    generationNotes: 'Organic, irregular generation similar to caves but may include adapted structures. Low to medium room density. Layout reflects creature needs (nests, food storage, escape routes).',
    typicalFeatures: ['Nests', 'Food storage', 'Treasure hoards', 'Escape routes', 'Creature-specific features'],
    roomDensity: 'low',
    corridorDensity: 'low',
  },
};

export function getDungeonTypeDefinition(type: DungeonType): DungeonTypeDefinition {
  return DUNGEON_TYPE_DEFINITIONS[type];
}

