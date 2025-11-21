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

interface ColorSwatch {
  base: string;
  detail: string;
  highlight: string;
  shadow: string;
}

const TEXTURE_PALETTES: Record<DungeonType, { floor: ColorSwatch; wall: ColorSwatch }> = {
  dungeon: {
    floor: { base: '#323741', detail: 'rgba(9,9,11,0.35)', highlight: 'rgba(255,255,255,0.15)', shadow: 'rgba(0,0,0,0.45)' },
    wall: { base: '#4b5563', detail: 'rgba(15,23,42,0.45)', highlight: 'rgba(255,255,255,0.2)', shadow: 'rgba(0,0,0,0.4)' },
  },
  cave: {
    floor: { base: '#2f261d', detail: 'rgba(0,0,0,0.4)', highlight: 'rgba(255,255,255,0.08)', shadow: 'rgba(0,0,0,0.55)' },
    wall: { base: '#3b3025', detail: 'rgba(0,0,0,0.5)', highlight: 'rgba(255,255,255,0.07)', shadow: 'rgba(0,0,0,0.6)' },
  },
  ruin: {
    floor: { base: '#4a402f', detail: 'rgba(0,0,0,0.3)', highlight: 'rgba(255,255,255,0.12)', shadow: 'rgba(0,0,0,0.5)' },
    wall: { base: '#5f5c54', detail: 'rgba(0,0,0,0.45)', highlight: 'rgba(255,255,255,0.15)', shadow: 'rgba(0,0,0,0.55)' },
  },
  fortress: {
    floor: { base: '#3c4453', detail: 'rgba(14,23,38,0.4)', highlight: 'rgba(255,255,255,0.12)', shadow: 'rgba(0,0,0,0.45)' },
    wall: { base: '#515d6d', detail: 'rgba(15,23,42,0.4)', highlight: 'rgba(255,255,255,0.18)', shadow: 'rgba(0,0,0,0.45)' },
  },
  tower: {
    floor: { base: '#3a3645', detail: 'rgba(15,15,23,0.38)', highlight: 'rgba(255,255,255,0.15)', shadow: 'rgba(0,0,0,0.45)' },
    wall: { base: '#5b5375', detail: 'rgba(31,24,44,0.45)', highlight: 'rgba(255,255,255,0.2)', shadow: 'rgba(0,0,0,0.55)' },
  },
  temple: {
    floor: { base: '#4f3a2e', detail: 'rgba(0,0,0,0.35)', highlight: 'rgba(255,237,213,0.2)', shadow: 'rgba(59,7,4,0.3)' },
    wall: { base: '#6b4e54', detail: 'rgba(45,7,45,0.4)', highlight: 'rgba(255,255,255,0.18)', shadow: 'rgba(0,0,0,0.4)' },
  },
  lair: {
    floor: { base: '#2e3a2a', detail: 'rgba(0,0,0,0.4)', highlight: 'rgba(255,255,255,0.08)', shadow: 'rgba(0,0,0,0.55)' },
    wall: { base: '#3f4d39', detail: 'rgba(0,0,0,0.45)', highlight: 'rgba(255,255,255,0.1)', shadow: 'rgba(0,0,0,0.5)' },
  },
};

function getTexturePalette(type: DungeonType) {
  return TEXTURE_PALETTES[type] ?? TEXTURE_PALETTES.dungeon;
}

// Generate SVG pattern IDs for each texture type
export function getTexturePatternId(type: DungeonType, element: 'floor' | 'wall' | 'feature', variant: string): string {
  return `${type}-${element}-${variant}`;
}

// Create SVG pattern definitions for stone floor (improved with rock texture)
// Classic dungeon style: cut stone tiles with natural variations
export function createStoneFloorPattern(id: string, theme: 'light' | 'dark', palette?: ColorSwatch): string {
  const baseColor = palette?.base ?? (theme === 'light' ? '#e2e8f0' : '#1e293b');
  const detailColor = palette?.detail ?? (theme === 'light' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.15)');
  const highlightColor = palette?.highlight ?? (theme === 'light' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)');
  const shadowColor = palette?.shadow ?? (theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.2)');
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24">
      <rect width="24" height="24" fill="${baseColor}"/>
      <!-- Stone tile grid (offset pattern for visual interest) -->
      <rect x="0" y="0" width="12" height="12" fill="${baseColor}" stroke="${detailColor}" strokeWidth="0.4" opacity="0.5"/>
      <rect x="12" y="12" width="12" height="12" fill="${baseColor}" stroke="${detailColor}" strokeWidth="0.4" opacity="0.5"/>
      <!-- Individual stone texture with cracks and grain -->
      <path d="M2,3 Q4,2 6,3 Q8,4 10,3" stroke="${detailColor}" strokeWidth="0.9" fill="none" opacity="0.6"/>
      <path d="M2,9 Q4,8 6,9 Q8,10 10,9" stroke="${detailColor}" strokeWidth="0.7" fill="none" opacity="0.5"/>
      <path d="M14,3 Q16,2 18,3 Q20,4 22,3" stroke="${detailColor}" strokeWidth="0.9" fill="none" opacity="0.6"/>
      <path d="M14,9 Q16,8 18,9 Q20,10 22,9" stroke="${detailColor}" strokeWidth="0.7" fill="none" opacity="0.5"/>
      <path d="M14,15 Q16,14 18,15 Q20,16 22,15" stroke="${detailColor}" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M2,15 Q4,14 6,15 Q8,16 10,15" stroke="${detailColor}" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <!-- Stone imperfections and cracks -->
      <line x1="6" y1="2" x2="6" y2="6" stroke="${detailColor}" strokeWidth="0.5" opacity="0.4"/>
      <line x1="18" y1="14" x2="18" y2="18" stroke="${detailColor}" strokeWidth="0.5" opacity="0.4"/>
      <!-- Highlights on stone surfaces (light reflection) -->
      <ellipse cx="6" cy="6" rx="2" ry="1.5" fill="${highlightColor}" opacity="0.4"/>
      <ellipse cx="18" cy="18" rx="1.8" ry="1.3" fill="${highlightColor}" opacity="0.4"/>
      <!-- Shadows for depth -->
      <ellipse cx="4" cy="8" rx="1" ry="0.8" fill="${shadowColor}" opacity="0.3"/>
      <ellipse cx="16" cy="20" rx="1" ry="0.8" fill="${shadowColor}" opacity="0.3"/>
    </pattern>
  `;
}

// Create SVG pattern for dirt/earth floor (improved with earth texture)
export function createDirtFloorPattern(id: string, theme: 'light' | 'dark', palette?: ColorSwatch): string {
  const baseColor = palette?.base ?? (theme === 'light' ? '#d4a574' : '#5c4a2a');
  const detailColor = palette?.detail ?? (theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)');
  const lightColor = palette?.highlight ?? (theme === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)');
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
// Based on natural cave formations: irregular, organic shapes with protrusions
export function createCaveWallPattern(id: string, theme: 'light' | 'dark', palette?: ColorSwatch): string {
  const baseColor = palette?.base ?? (theme === 'light' ? '#9ca3af' : '#374151');
  const detailColor = palette?.detail ?? (theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)');
  const highlightColor = palette?.highlight ?? (theme === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)');
  const shadowColor = palette?.shadow ?? (theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)');
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="28" height="28">
      <rect width="28" height="28" fill="${baseColor}"/>
      <!-- Natural rock formations - organic, flowing lines -->
      <path d="M2,3 Q4,1 7,3 Q10,5 12,3 Q15,1 18,3 Q21,5 24,3" stroke="${detailColor}" strokeWidth="2" fill="none" opacity="0.7"/>
      <path d="M3,10 Q6,8 9,10 Q12,12 15,10 Q18,8 21,10 Q24,12 26,10" stroke="${detailColor}" strokeWidth="1.6" fill="none" opacity="0.6"/>
      <path d="M4,17 Q7,15 10,17 Q13,19 16,17 Q19,15 22,17 Q25,19 27,17" stroke="${detailColor}" strokeWidth="1.8" fill="none" opacity="0.6"/>
      <path d="M5,24 Q8,22 11,24 Q14,26 17,24 Q20,22 23,24" stroke="${detailColor}" strokeWidth="1.4" fill="none" opacity="0.5"/>
      <!-- Rock protrusions and formations -->
      <ellipse cx="7" cy="6" rx="2.5" ry="1.8" fill="${detailColor}" opacity="0.5"/>
      <ellipse cx="16" cy="14" rx="2" ry="2.5" fill="${detailColor}" opacity="0.5"/>
      <ellipse cx="21" cy="9" rx="1.8" ry="1.5" fill="${detailColor}" opacity="0.45"/>
      <ellipse cx="11" cy="20" rx="2.2" ry="2" fill="${detailColor}" opacity="0.5"/>
      <!-- Stalactite-like formations (hanging) -->
      <path d="M9,2 Q9,4 9,6" stroke="${shadowColor}" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M19,4 Q19,6 19,8" stroke="${shadowColor}" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <!-- Cracks and fissures (vertical) -->
      <line x1="8" y1="2" x2="8" y2="10" stroke="${detailColor}" strokeWidth="1" opacity="0.5"/>
      <line x1="17" y1="5" x2="17" y2="13" stroke="${detailColor}" strokeWidth="0.9" opacity="0.5"/>
      <line x1="13" y1="15" x2="13" y2="23" stroke="${detailColor}" strokeWidth="1" opacity="0.5"/>
      <!-- Highlights on rock faces (light reflection) -->
      <ellipse cx="8" cy="7" rx="1.8" ry="1.2" fill="${highlightColor}" opacity="0.5"/>
      <ellipse cx="17" cy="15" rx="1.5" ry="1" fill="${highlightColor}" opacity="0.4"/>
      <ellipse cx="22" cy="10" rx="1.2" ry="0.9" fill="${highlightColor}" opacity="0.4"/>
    </pattern>
  `;
}

// Create SVG pattern for stone wall (improved with brick/stone blocks)
// Classic dungeon/fortress style: regular blocks with mortar
export function createStoneWallPattern(id: string, theme: 'light' | 'dark', palette?: ColorSwatch): string {
  const baseColor = palette?.base ?? (theme === 'light' ? '#cbd5e1' : '#475569');
  const mortarColor = palette?.detail ?? (theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.5)');
  const highlightColor = palette?.highlight ?? (theme === 'light' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)');
  const shadowColor = palette?.shadow ?? (theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)');
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="36" height="22">
      <rect width="36" height="22" fill="${baseColor}"/>
      <!-- Mortar lines (running bond pattern) -->
      <line x1="0" y1="11" x2="36" y2="11" stroke="${mortarColor}" strokeWidth="1.5"/>
      <line x1="18" y1="0" x2="18" y2="22" stroke="${mortarColor}" strokeWidth="1.5"/>
      <!-- Stone blocks with offset pattern (running bond) -->
      <rect x="0" y="0" width="18" height="11" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="1"/>
      <rect x="18" y="11" width="18" height="11" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="1"/>
      <!-- Individual stone blocks with depth -->
      <rect x="1" y="1" width="16" height="9" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.6" opacity="0.7"/>
      <rect x="19" y="12" width="16" height="9" fill="${baseColor}" stroke="${mortarColor}" strokeWidth="0.6" opacity="0.7"/>
      <!-- 3D effect: highlights on top edges -->
      <line x1="1" y1="1" x2="17" y2="1" stroke="${highlightColor}" strokeWidth="1" opacity="0.5"/>
      <line x1="19" y1="12" x2="35" y2="12" stroke="${highlightColor}" strokeWidth="1" opacity="0.5"/>
      <!-- 3D effect: shadows on bottom edges -->
      <line x1="1" y1="10" x2="17" y2="10" stroke="${shadowColor}" strokeWidth="0.8" opacity="0.4"/>
      <line x1="19" y1="21" x2="35" y2="21" stroke="${shadowColor}" strokeWidth="0.8" opacity="0.4"/>
      <!-- Stone texture/grain -->
      <path d="M3,4 Q5,3 7,4 Q9,5 11,4" stroke="${mortarColor}" strokeWidth="0.4" fill="none" opacity="0.3"/>
      <path d="M21,15 Q23,14 25,15 Q27,16 29,15" stroke="${mortarColor}" strokeWidth="0.4" fill="none" opacity="0.3"/>
      <!-- Small imperfections -->
      <circle cx="6" cy="5" r="0.5" fill="${shadowColor}" opacity="0.3"/>
      <circle cx="24" cy="16" r="0.5" fill="${shadowColor}" opacity="0.3"/>
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

// Get texture set for a dungeon type (uses blended patterns for cohesive look)
export function getTextureSetForType(type: DungeonType): Record<string, string> {
  const textures: Record<string, string> = {};
  
  // Always use the main blended pattern (procedural + AI overlay)
  textures.floor = getTexturePatternId(type, 'floor', 'main');
  textures.wall = getTexturePatternId(type, 'wall', 'main');
  
  return textures;
}

// Map dungeon types to AI-generated texture assets
const AI_TEXTURE_MAP: Record<DungeonType, { floor?: string; wall?: string }> = {
  dungeon: {
    floor: '/generated/textures/floor/stone_floor_modular.png',
  },
  cave: {
    floor: '/generated/textures/floor/forest_floor_moss.png', // Fallback to moss for cave floors
    wall: '/generated/textures/wall/cave_wall_organic.png',
  },
  ruin: {
    wall: '/generated/textures/wall/ruin_wall_cracked.png',
  },
  fortress: {
    floor: '/generated/textures/floor/fortress_floor_metal.png',
  },
  tower: {
    floor: '/generated/textures/floor/fortress_floor_metal.png', // Reuse fortress floor
  },
  temple: {
    floor: '/generated/textures/floor/temple_floor_marble.png',
    wall: '/generated/textures/wall/temple_wall_gilded.png',
  },
  lair: {
    floor: '/generated/textures/floor/forest_floor_moss.png', // Fallback to moss for lair floors
    wall: '/generated/textures/wall/cave_wall_organic.png',
  },
};

// Create a blended texture pattern that combines procedural base with AI texture overlay
function createBlendedTexturePattern(
  id: string,
  basePatternId: string,
  textureImagePath: string | null,
  cellSize: number = 20,
  theme: 'light' | 'dark',
  palette: ColorSwatch
): string {
  const patternSize = cellSize * 4;
  const patterns: string[] = [];
  
  // Base procedural pattern with subtle tile detail
  patterns.push(`<pattern id="${id}-base" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">`);
  patterns.push(`<rect width="${patternSize}" height="${patternSize}" fill="${palette.base}"/>`);
  // Add subtle procedural detail for visual interest
  patterns.push(`<rect x="0" y="0" width="${patternSize/2}" height="${patternSize/2}" fill="${palette.base}" stroke="${palette.detail}" strokeWidth="0.5" opacity="0.25"/>`);
  patterns.push(`<rect x="${patternSize/2}" y="${patternSize/2}" width="${patternSize/2}" height="${patternSize/2}" fill="${palette.base}" stroke="${palette.detail}" strokeWidth="0.5" opacity="0.25"/>`);
  // Add subtle highlight for depth
  patterns.push(`<ellipse cx="${patternSize/4}" cy="${patternSize/4}" rx="${patternSize/8}" ry="${patternSize/12}" fill="${palette.highlight}" opacity="0.15"/>`);
  patterns.push(`</pattern>`);
  
  // Combined pattern with texture overlay (subtle blend)
  patterns.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">`);
  patterns.push(`<rect width="${patternSize}" height="${patternSize}" fill="url(#${id}-base)"/>`);
  if (textureImagePath) {
    // Use lower opacity for more subtle texture overlay
    patterns.push(`<image href="${textureImagePath}" width="${patternSize}" height="${patternSize}" preserveAspectRatio="none" opacity="0.3"/>`);
  }
  patterns.push(`</pattern>`);
  
  return patterns.join('\n');
}

// Generate all texture patterns for a dungeon type
// Uses a cohesive design: procedural base patterns with subtle AI texture overlays
export function generateTexturePatterns(type: DungeonType, theme: 'light' | 'dark', cellSize: number = 20): string {
  const patterns: string[] = [];
  const palette = getTexturePalette(type);
  const aiTextures = AI_TEXTURE_MAP[type] ?? {};
  
  // Floor patterns - blended approach: procedural base + AI texture overlay
  const floorPatternId = getTexturePatternId(type, 'floor', 'main');
  patterns.push(createBlendedTexturePattern(
    floorPatternId,
    getTexturePatternId(type, 'floor', 'stone'),
    aiTextures.floor ?? null,
    cellSize,
    theme,
    palette.floor
  ));
  
  // Always include pure procedural patterns as fallback
  patterns.push(createStoneFloorPattern(getTexturePatternId(type, 'floor', 'stone'), theme, palette.floor));
  patterns.push(createDirtFloorPattern(getTexturePatternId(type, 'floor', 'dirt'), theme, palette.floor));
  
  // Wall patterns - blended approach
  const wallPatternId = getTexturePatternId(type, 'wall', 'main');
  patterns.push(createBlendedTexturePattern(
    wallPatternId,
    getTexturePatternId(type, 'wall', 'stone'),
    aiTextures.wall ?? null,
    cellSize,
    theme,
    palette.wall
  ));
  
  // Always include pure procedural wall patterns as fallback
  patterns.push(createStoneWallPattern(getTexturePatternId(type, 'wall', 'stone'), theme, palette.wall));
  patterns.push(createCaveWallPattern(getTexturePatternId(type, 'wall', 'cave'), theme, palette.wall));
  
  // Stairs patterns (always procedural for clarity)
  patterns.push(createStairsPattern(getTexturePatternId(type, 'feature', 'stairs_up'), 'up', theme));
  patterns.push(createStairsPattern(getTexturePatternId(type, 'feature', 'stairs_down'), 'down', theme));
  
  return patterns.join('\n');
}

