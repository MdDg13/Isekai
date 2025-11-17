/**
 * Free5e Data Parser Utilities
 * Shared parsing functions for extracting structured data from Free5e sources
 */

export interface ParsedItem {
  name: string;
  kind: string;
  category?: string;
  rarity?: string;
  cost_gp?: number;
  cost_breakdown?: { cp?: number; sp?: number; gp?: number; pp?: number };
  weight_lb?: number;
  description: string;
  properties?: Record<string, unknown>;
  attunement?: boolean;
  attunement_requirements?: string;
  page_reference?: string;
  tags?: string[];
}

export interface ParsedSpell {
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  material_components?: string;
  duration: string;
  description: string;
  higher_level?: string;
  ritual?: boolean;
  concentration?: boolean;
  page_reference?: string;
  tags?: string[];
}

export interface ParsedMonster {
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment: string;
  armor_class: number;
  armor_class_type?: string;
  hit_points: number;
  hit_dice: string;
  speed: Record<string, number | string>;
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  saving_throws?: Record<string, string>;
  skills?: Record<string, string>;
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  senses?: string;
  languages?: string;
  challenge_rating: number;
  xp?: number;
  traits?: Array<{ name: string; description: string }>;
  actions?: Array<{ name: string; description: string; attack_bonus?: number; damage?: string }>;
  legendary_actions?: Array<{ name: string; description: string; cost?: number }>;
  reactions?: Array<{ name: string; description: string }>;
  page_reference?: string;
  tags?: string[];
}

/**
 * Parse cost string (e.g., "50 gp", "2 sp", "1,000 cp") to gold pieces
 */
export function parseCostToGP(costStr: string): number {
  if (!costStr) return 0;
  
  const normalized = costStr.toLowerCase().replace(/,/g, '').trim();
  const match = normalized.match(/([\d.]+)\s*(cp|sp|gp|pp)/);
  
  if (!match) return 0;
  
  const amount = parseFloat(match[1]);
  const unit = match[2];
  
  const conversion: Record<string, number> = {
    cp: 0.01,
    sp: 0.1,
    gp: 1,
    pp: 10,
  };
  
  return amount * (conversion[unit] || 0);
}

/**
 * Parse cost string to breakdown object
 */
export function parseCostBreakdown(costStr: string): { cp?: number; sp?: number; gp?: number; pp?: number } | undefined {
  if (!costStr) return undefined;
  
  const normalized = costStr.toLowerCase().replace(/,/g, '').trim();
  const match = normalized.match(/([\d.]+)\s*(cp|sp|gp|pp)/);
  
  if (!match) return undefined;
  
  const amount = parseFloat(match[1]);
  const unit = match[2];
  
  const breakdown: { cp?: number; sp?: number; gp?: number; pp?: number } = {};
  breakdown[unit as keyof typeof breakdown] = amount;
  
  return breakdown;
}

/**
 * Parse weight string (e.g., "5 lb.", "10 pounds") to number
 */
export function parseWeight(weightStr: string): number | undefined {
  if (!weightStr) return undefined;
  
  const match = weightStr.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Parse spell components string (e.g., "V, S, M (a piece of fur)")
 */
export function parseSpellComponents(componentsStr: string): {
  components: string;
  material_components?: string;
} {
  if (!componentsStr) return { components: '' };
  
  const parts = componentsStr.split(',').map(s => s.trim());
  const components: string[] = [];
  let materialComponents: string | undefined;
  
  for (const part of parts) {
    if (part.match(/^[VSM]$/i)) {
      components.push(part.toUpperCase());
    } else if (part.startsWith('M') || part.startsWith('m')) {
      components.push('M');
      const materialMatch = part.match(/\((.+)\)/);
      if (materialMatch) {
        materialComponents = materialMatch[1].trim();
      }
    }
  }
  
  return {
    components: components.join(', '),
    material_components: materialComponents,
  };
}

/**
 * Parse challenge rating string to number
 */
export function parseChallengeRating(crStr: string): number {
  if (!crStr) return 0;
  
  const normalized = crStr.toLowerCase().trim();
  
  // Handle fractions
  if (normalized.includes('/')) {
    const [num, den] = normalized.split('/').map(s => parseFloat(s.trim()));
    return num / den;
  }
  
  return parseFloat(normalized) || 0;
}

/**
 * Calculate XP from challenge rating
 */
export function calculateXP(cr: number): number {
  const xpTable: Record<number, number> = {
    0: 0,
    0.125: 25,
    0.25: 50,
    0.5: 100,
    1: 200,
    2: 450,
    3: 700,
    4: 1100,
    5: 1800,
    6: 2300,
    7: 2900,
    8: 3900,
    9: 5000,
    10: 5900,
    11: 7200,
    12: 8400,
    13: 10000,
    14: 11500,
    15: 13000,
    16: 15000,
    17: 18000,
    18: 20000,
    19: 22000,
    20: 25000,
    21: 33000,
    22: 41000,
    23: 50000,
    24: 62000,
    30: 155000,
  };
  
  // Find closest CR in table
  const crs = Object.keys(xpTable).map(k => parseFloat(k)).sort((a, b) => a - b);
  let closestCr = 0;
  let minDiff = Infinity;
  
  for (const tableCr of crs) {
    const diff = Math.abs(cr - tableCr);
    if (diff < minDiff) {
      minDiff = diff;
      closestCr = tableCr;
    }
  }
  
  return xpTable[closestCr] || 0;
}

/**
 * Parse ability scores from stat block
 */
export function parseAbilityScores(
  str: number | string,
  dex: number | string,
  con: number | string,
  int: number | string,
  wis: number | string,
  cha: number | string
): { str: number; dex: number; con: number; int: number; wis: number; cha: number } {
  return {
    str: typeof str === 'string' ? parseInt(str) || 10 : str,
    dex: typeof dex === 'string' ? parseInt(dex) || 10 : dex,
    con: typeof con === 'string' ? parseInt(con) || 10 : con,
    int: typeof int === 'string' ? parseInt(int) || 10 : int,
    wis: typeof wis === 'string' ? parseInt(wis) || 10 : wis,
    cha: typeof cha === 'string' ? parseInt(cha) || 10 : cha,
  };
}

/**
 * Extract tags from description text
 */
export function extractTags(text: string, knownTags: string[] = []): string[] {
  if (!text) return [];
  
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for known tags
  for (const tag of knownTags) {
    if (lowerText.includes(tag.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return [...new Set(tags)];
}

