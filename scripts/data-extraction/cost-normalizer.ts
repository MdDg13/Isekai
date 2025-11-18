/**
 * Cost Normalization System
 * Uses "Sane Magical Prices" as reference for cost inconsistencies
 * Estimates costs when not provided based on rarity and item type
 */

interface CostBreakdown {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
}

interface CostReference {
  rarity: string;
  min_gp: number;
  max_gp: number;
  typical_gp: number;
}

// Rarity-based cost estimates (from Sane Magical Prices and D&D 5e standards)
const RARITY_COST_ESTIMATES: Record<string, CostReference> = {
  common: { rarity: 'common', min_gp: 50, max_gp: 100, typical_gp: 75 },
  uncommon: { rarity: 'uncommon', min_gp: 100, max_gp: 500, typical_gp: 300 },
  rare: { rarity: 'rare', min_gp: 500, max_gp: 5000, typical_gp: 2500 },
  very_rare: { rarity: 'very_rare', min_gp: 5000, max_gp: 50000, typical_gp: 25000 },
  legendary: { rarity: 'legendary', min_gp: 50000, max_gp: 500000, typical_gp: 250000 },
  artifact: { rarity: 'artifact', min_gp: 500000, max_gp: 10000000, typical_gp: 5000000 },
};

// Known item costs from Sane Magical Prices (sample - expand as needed)
const KNOWN_COSTS: Record<string, number> = {
  // Potions
  'potion of healing': 50,
  'potion of greater healing': 150,
  'potion of superior healing': 450,
  'potion of supreme healing': 1350,
  'potion of invisibility': 180,
  'potion of speed': 480,
  'potion of flying': 500,
  'potion of fire breath': 150,
  'potion of resistance': 300,
  
  // Weapons
  '+1 weapon': 500,
  '+2 weapon': 4000,
  '+3 weapon': 32000,
  'flametongue': 5000,
  'frost brand': 5000,
  'vorpal sword': 50000,
  'holy avenger': 50000,
  
  // Armor
  '+1 armor': 500,
  '+2 armor': 4000,
  '+3 armor': 32000,
  'adamantine armor': 500,
  'mithral armor': 1000,
  
  // Wondrous Items
  'bag of holding': 500,
  'boots of elvenkind': 500,
  'cloak of elvenkind': 500,
  'ring of protection': 3500,
  'amulet of health': 8000,
  'belt of giant strength': 10000,
  'staff of power': 20000,
  'staff of the magi': 200000,
};

/**
 * Normalize cost to gold pieces
 */
export function normalizeCostToGP(cost: string | number | null | undefined, itemName?: string): number | null {
  if (cost === null || cost === undefined) {
    // Try to find known cost
    if (itemName) {
      const lowerName = itemName.toLowerCase();
      for (const [key, value] of Object.entries(KNOWN_COSTS)) {
        if (lowerName.includes(key)) {
          return value;
        }
      }
    }
    return null;
  }

  if (typeof cost === 'number') {
    return cost;
  }

  const costStr = cost.toString().toLowerCase().trim();
  
  // Extract number and unit
  const match = costStr.match(/([\d,.]+)\s*(cp|sp|gp|pp|copper|silver|gold|platinum|pieces?)?/);
  if (!match) {
    return null;
  }

  const amount = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2] || 'gp';

  // Convert to gold pieces
  switch (unit.toLowerCase()) {
    case 'cp':
    case 'copper':
      return amount / 100;
    case 'sp':
    case 'silver':
      return amount / 10;
    case 'gp':
    case 'gold':
    case 'pieces':
      return amount;
    case 'pp':
    case 'platinum':
      return amount * 10;
    default:
      return amount; // Assume gold if unclear
  }
}

/**
 * Estimate cost based on rarity and item type
 */
export function estimateCost(rarity: string | null, itemKind: string, itemName?: string): number | null {
  // Check known costs first
  if (itemName) {
    const lowerName = itemName.toLowerCase();
    for (const [key, value] of Object.entries(KNOWN_COSTS)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
  }

  if (!rarity || !RARITY_COST_ESTIMATES[rarity]) {
    // No rarity - estimate based on item kind
    switch (itemKind) {
      case 'weapon':
        return 15; // Average mundane weapon
      case 'armor':
        return 50; // Average mundane armor
      case 'tool':
        return 10; // Average tool
      case 'consumable':
        return 25; // Average consumable
      default:
        return 10; // Default estimate
    }
  }

  const estimate = RARITY_COST_ESTIMATES[rarity];
  
  // Adjust based on item kind
  let multiplier = 1.0;
  switch (itemKind) {
    case 'weapon':
      multiplier = 1.0;
      break;
    case 'armor':
      multiplier = 1.2; // Armor typically costs more
      break;
    case 'consumable':
      multiplier = 0.5; // Consumables typically cost less
      break;
    case 'tool':
      multiplier = 0.8;
      break;
  }

  return Math.round(estimate.typical_gp * multiplier);
}

/**
 * Convert gold pieces to cost breakdown
 */
export function gpToCostBreakdown(gp: number): CostBreakdown {
  const pp = Math.floor(gp / 10);
  const remainingGp = gp % 10;
  const sp = Math.floor(remainingGp * 10);
  const cp = Math.round((remainingGp * 10 - sp) * 10);

  return {
    cp: cp,
    sp: sp,
    gp: remainingGp,
    pp: pp,
  };
}

/**
 * Normalize and estimate cost for an item
 */
export function normalizeItemCost(
  item: {
    name?: string;
    kind?: string;
    rarity?: string | null;
    cost_gp?: number | string | null;
  }
): { cost_gp: number | null; cost_breakdown: CostBreakdown | null } {
  let cost_gp: number | null = null;

  // Try to normalize existing cost
  if (item.cost_gp !== null && item.cost_gp !== undefined) {
    cost_gp = normalizeCostToGP(item.cost_gp, item.name);
  }

  // If no cost, estimate based on rarity and kind
  if (cost_gp === null) {
    cost_gp = estimateCost(item.rarity || null, item.kind || 'other', item.name);
  }

  const cost_breakdown = cost_gp !== null ? gpToCostBreakdown(cost_gp) : null;

  return { cost_gp, cost_breakdown };
}

