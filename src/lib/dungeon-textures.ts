// Texture library for dungeon visualization
// SVG patterns for different dungeon types and elements

export type DungeonType = 'dungeon' | 'cave' | 'ruin' | 'fortress' | 'tower' | 'temple' | 'lair';

export interface TextureSet {
  floor: {
    stone: string;
    dirt: string;
    wood: string;
    cave: string;
    temple: string;
    brick: string;
  };
  wall: {
    stone: string;
    brick: string;
    cave: string;
    smooth: string;
    rough: string;
  };
  features: {
    door_wooden: string;
    door_iron: string;
    door_stone: string;
    stairs_up: string;
    stairs_down: string;
  };
}

// Generate SVG pattern IDs for each texture type
export function getTexturePatternId(type: DungeonType, element: 'floor' | 'wall' | 'feature', variant: string): string {
  return `${type}-${element}-${variant}`;
}

// Create SVG pattern definitions for stone floor (improved with rock texture)
export function createStoneFloorPattern(id: string, theme: 'light' | 'dark'): string {
  const baseColor = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const detailColor = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
  const highlightColor = theme === 'light' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)';
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="20" height="20">
      <rect width="20" height="20" fill="${baseColor}"/>
      <!-- Stone tile grid -->
      <rect x="0" y="0" width="10" height="10" fill="${baseColor}" stroke="${detailColor}" strokeWidth="0.3" opacity="0.4"/>
      <rect x="10" y="10" width="10" height="10" fill="${baseColor}" stroke="${detailColor}" strokeWidth="0.3" opacity="0.4"/>
      <!-- Rock texture details -->
      <path d="M2,2 Q4,1 6,2 T10,2 Q12,3 14,2" stroke="${detailColor}" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M2,8 Q4,7 6,8 T10,8 Q12,9 14,8" stroke="${detailColor}" strokeWidth="0.6" fill="none" opacity="0.4"/>
      <path d="M12,2 Q14,1 16,2 T18,2" stroke="${detailColor}" strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M12,8 Q14,7 16,8 T18,8" stroke="${detailColor}" strokeWidth="0.6" fill="none" opacity="0.4"/>
      <!-- Highlights -->
      <ellipse cx="5" cy="5" rx="1.5" ry="1" fill="${highlightColor}" opacity="0.3"/>
      <ellipse cx="15" cy="15" rx="1.2" ry="0.8" fill="${highlightColor}" opacity="0.3"/>
    </pattern>
  `;
}

// Create SVG pattern for dirt/earth floor (improved with earth texture)
export function createDirtFloorPattern(id: string, theme: 'light' | 'dark'): string {
  const baseColor = theme === 'light' ? '#d4a574' : '#5c4a2a';
  const detailColor = theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
  const lightColor = theme === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="16" height="16">
      <rect width="16" height="16" fill="${baseColor}"/>
      <!-- Earth/clay texture -->
      <ellipse cx="3" cy="3" rx="2" ry="1.5" fill="${detailColor}" opacity="0.5"/>
      <ellipse cx="11" cy="7" rx="1.5" ry="2" fill="${detailColor}" opacity="0.5"/>
      <ellipse cx="7" cy="11" rx="2" ry="1.2" fill="${detailColor}" opacity="0.5"/>
      <ellipse cx="13" cy="13" rx="1.2" ry="1.5" fill="${detailColor}" opacity="0.4"/>
      <!-- Cracks and lines -->
      <path d="M2,6 Q4,4 6,6 T10,6" stroke="${detailColor}" strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M8,2 Q10,4 12,2" stroke="${detailColor}" strokeWidth="0.4" fill="none" opacity="0.3"/>
      <path d="M4,10 Q6,8 8,10 T12,10" stroke="${detailColor}" strokeWidth="0.4" fill="none" opacity="0.3"/>
      <!-- Pebbles/stones -->
      <circle cx="5" cy="8" r="0.8" fill="${detailColor}" opacity="0.6"/>
      <circle cx="12" cy="4" r="0.6" fill="${detailColor}" opacity="0.6"/>
      <circle cx="9" cy="13" r="0.7" fill="${detailColor}" opacity="0.6"/>
      <!-- Highlights -->
      <ellipse cx="4" cy="4" rx="1" ry="0.5" fill="${lightColor}" opacity="0.3"/>
    </pattern>
  `;
}

// Create SVG pattern for cave/rock wall (improved with natural rock texture)
export function createCaveWallPattern(id: string, theme: 'light' | 'dark'): string {
  const baseColor = theme === 'light' ? '#9ca3af' : '#374151';
  const detailColor = theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.5)';
  const highlightColor = theme === 'light' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24">
      <rect width="24" height="24" fill="${baseColor}"/>
      <!-- Natural rock formations -->
      <path d="M2,2 Q5,1 8,3 T14,2 Q17,4 18,7 T20,10" stroke="${detailColor}" strokeWidth="1.8" fill="none" opacity="0.7"/>
      <path d="M4,8 Q7,6 10,8 T16,7 Q18,9 19,12 T20,16" stroke="${detailColor}" strokeWidth="1.4" fill="none" opacity="0.6"/>
      <path d="M3,14 Q6,12 9,14 T15,13 Q17,15 18,18 T19,22" stroke="${detailColor}" strokeWidth="1.6" fill="none" opacity="0.6"/>
      <path d="M6,4 Q9,3 12,5 T17,4" stroke="${detailColor}" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <!-- Rock protrusions -->
      <circle cx="6" cy="5" r="2" fill="${detailColor}" opacity="0.4"/>
      <circle cx="14" cy="15" r="1.5" fill="${detailColor}" opacity="0.4"/>
      <circle cx="18" cy="8" r="1.2" fill="${detailColor}" opacity="0.35"/>
      <circle cx="10" cy="19" r="1.8" fill="${detailColor}" opacity="0.4"/>
      <!-- Cracks and fissures -->
      <line x1="8" y1="2" x2="8" y2="8" stroke="${detailColor}" strokeWidth="0.8" opacity="0.5"/>
      <line x1="16" y1="6" x2="16" y2="12" stroke="${detailColor}" strokeWidth="0.7" opacity="0.5"/>
      <line x1="12" y1="14" x2="12" y2="20" stroke="${detailColor}" strokeWidth="0.8" opacity="0.5"/>
      <!-- Highlights on rock faces -->
      <ellipse cx="7" cy="6" rx="1.5" ry="1" fill="${highlightColor}" opacity="0.4"/>
      <ellipse cx="15" cy="16" rx="1.2" ry="0.8" fill="${highlightColor}" opacity="0.3"/>
    </pattern>
  `;
}

// Create SVG pattern for stone wall (improved with brick/stone blocks)
export function createStoneWallPattern(id: string, theme: 'light' | 'dark'): string {
  const baseColor = theme === 'light' ? '#cbd5e1' : '#475569';
  const mortarColor = theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
  const highlightColor = theme === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="32" height="20">
      <rect width="32" height="20" fill="${baseColor}"/>
      <!-- Mortar lines -->
      <line x1="0" y1="10" x2="32" y2="10" stroke="${mortarColor}" strokeWidth="1.2"/>
      <line x1="16" y1="0" x2="16" y2="20" stroke="${mortarColor}" strokeWidth="1.2"/>
      <!-- Stone blocks with offset pattern -->
      <rect x="0" y="0" width="16" height="10" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.8"/>
      <rect x="16" y="10" width="16" height="10" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.8"/>
      <!-- Individual stone texture -->
      <rect x="2" y="2" width="12" height="6" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.5" opacity="0.6"/>
      <rect x="18" y="12" width="12" height="6" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.5" opacity="0.6"/>
      <!-- Highlights on stones -->
      <line x1="3" y1="3" x2="13" y2="3" stroke="${highlightColor}" strokeWidth="0.5" opacity="0.4"/>
      <line x1="19" y1="13" x2="29" y2="13" stroke="${highlightColor}" strokeWidth="0.5" opacity="0.4"/>
      <!-- Stone grain -->
      <path d="M4,5 Q6,4 8,5" stroke="${mortarColor}" strokeWidth="0.3" fill="none" opacity="0.3"/>
      <path d="M20,15 Q22,14 24,15" stroke="${mortarColor}" strokeWidth="0.3" fill="none" opacity="0.3"/>
    </pattern>
  `;
}

// Create SVG pattern for stairs (improved with 3D effect)
export function createStairsPattern(id: string, direction: 'up' | 'down', theme: 'light' | 'dark'): string {
  const baseColor = theme === 'light' ? '#e2e8f0' : '#334155';
  const stepColor = theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';
  const shadowColor = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)';
  const highlightColor = theme === 'light' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)';
  const arrow = direction === 'up' ? 'M8,12 L6,10 L10,10 Z' : 'M8,4 L6,6 L10,6 Z';
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="20" height="16">
      <rect width="20" height="16" fill="${baseColor}"/>
      <!-- Stair steps with 3D effect -->
      <rect x="0" y="3" width="20" height="3" fill="${baseColor}" stroke="${stepColor}" strokeWidth="1"/>
      <rect x="0" y="7" width="20" height="3" fill="${baseColor}" stroke="${stepColor}" strokeWidth="1"/>
      <rect x="0" y="11" width="20" height="3" fill="${baseColor}" stroke="${stepColor}" strokeWidth="1"/>
      <!-- Step faces (vertical) -->
      <line x1="0" y1="3" x2="0" y2="6" stroke="${shadowColor}" strokeWidth="1.5"/>
      <line x1="0" y1="7" x2="0" y2="10" stroke="${shadowColor}" strokeWidth="1.5"/>
      <line x1="0" y1="11" x2="0" y2="14" stroke="${shadowColor}" strokeWidth="1.5"/>
      <!-- Step tops (horizontal highlights) -->
      <line x1="0" y1="3" x2="20" y2="3" stroke="${highlightColor}" strokeWidth="0.8"/>
      <line x1="0" y1="7" x2="20" y2="7" stroke="${highlightColor}" strokeWidth="0.8"/>
      <line x1="0" y1="11" x2="20" y2="11" stroke="${highlightColor}" strokeWidth="0.8"/>
      <!-- Direction arrow -->
      <path d="${arrow}" fill="${stepColor}" opacity="0.8"/>
    </pattern>
  `;
}

// Get texture set for a dungeon type
export function getTextureSetForType(type: DungeonType): Record<string, string> {
  const textures: Record<string, string> = {};
  
  // Floor textures
  switch (type) {
    case 'cave':
      textures.floor = getTexturePatternId(type, 'floor', 'dirt');
      break;
    case 'ruin':
    case 'temple':
      textures.floor = getTexturePatternId(type, 'floor', 'stone');
      break;
    case 'fortress':
    case 'tower':
      textures.floor = getTexturePatternId(type, 'floor', 'brick');
      break;
    case 'lair':
      textures.floor = getTexturePatternId(type, 'floor', 'dirt');
      break;
    default: // dungeon
      textures.floor = getTexturePatternId(type, 'floor', 'stone');
  }
  
  // Wall textures
  switch (type) {
    case 'cave':
    case 'lair':
      textures.wall = getTexturePatternId(type, 'wall', 'cave');
      break;
    case 'temple':
      textures.wall = getTexturePatternId(type, 'wall', 'smooth');
      break;
    default:
      textures.wall = getTexturePatternId(type, 'wall', 'stone');
  }
  
  return textures;
}

// Generate all texture patterns for a dungeon type
export function generateTexturePatterns(type: DungeonType, theme: 'light' | 'dark'): string {
  const patterns: string[] = [];
  
  // Floor patterns
  patterns.push(createStoneFloorPattern(getTexturePatternId(type, 'floor', 'stone'), theme));
  patterns.push(createDirtFloorPattern(getTexturePatternId(type, 'floor', 'dirt'), theme));
  
  // Wall patterns
  patterns.push(createStoneWallPattern(getTexturePatternId(type, 'wall', 'stone'), theme));
  patterns.push(createCaveWallPattern(getTexturePatternId(type, 'wall', 'cave'), theme));
  
  // Stairs patterns
  patterns.push(createStairsPattern(getTexturePatternId(type, 'feature', 'stairs_up'), 'up', theme));
  patterns.push(createStairsPattern(getTexturePatternId(type, 'feature', 'stairs_down'), 'down', theme));
  
  return patterns.join('\n');
}

