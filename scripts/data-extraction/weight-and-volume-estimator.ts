/**
 * Weight and Volume Estimation System
 * Estimates weight in metric (kg) and categorizes volume for items
 */

interface WeightEstimate {
  weight_kg: number;
  estimated_real_weight_kg: number | null;
  volume_category: string;
  confidence: number; // 0-100
}

// Volume category definitions
const VOLUME_CATEGORIES = {
  pouch: { max_weight_kg: 2, max_volume: 'small', description: 'Small items that fit in a pouch' },
  bag: { max_weight_kg: 10, max_volume: 'medium', description: 'Items that fit in a bag' },
  backpack: { max_weight_kg: 30, max_volume: 'large', description: 'Items that fit in a backpack' },
  'sheath/quiver': { max_weight_kg: 5, max_volume: 'long', description: 'Weapons and arrows that fit in sheaths/quivers' },
  held: { max_weight_kg: 5, max_volume: 'hand', description: 'Items held in one or two hands' },
  wagon: { max_weight_kg: 500, max_volume: 'very_large', description: 'Large items requiring a wagon' },
  'too big': { max_weight_kg: Infinity, max_volume: 'massive', description: 'Items too large to transport normally' },
};

const KNOWN_VOLUME_CATEGORIES = new Set<keyof typeof VOLUME_CATEGORIES>(Object.keys(VOLUME_CATEGORIES) as Array<keyof typeof VOLUME_CATEGORIES>);

function normalizeVolumeCategory(category: string): keyof typeof VOLUME_CATEGORIES {
  return KNOWN_VOLUME_CATEGORIES.has(category as keyof typeof VOLUME_CATEGORIES) ? (category as keyof typeof VOLUME_CATEGORIES) : 'held';
}

// Weight estimation patterns based on item descriptions
const WEIGHT_ESTIMATES: Array<{
  pattern: RegExp;
  weight_kg: number | null;
  volume_category: string;
  confidence: number;
}> = [
  // Weapons
  { pattern: /\b(dagger|knife|shortsword|rapier)\b/i, weight_kg: 0.5, volume_category: 'sheath/quiver', confidence: 90 },
  { pattern: /\b(longsword|scimitar|battleaxe|warhammer)\b/i, weight_kg: 1.5, volume_category: 'sheath/quiver', confidence: 90 },
  { pattern: /\b(greatsword|greataxe|maul|polearm)\b/i, weight_kg: 3.0, volume_category: 'held', confidence: 90 },
  { pattern: /\b(bow|crossbow)\b/i, weight_kg: 1.0, volume_category: 'sheath/quiver', confidence: 90 },
  { pattern: /\b(arrow|bolt|dart)\b/i, weight_kg: 0.05, volume_category: 'sheath/quiver', confidence: 90 },
  { pattern: /\b(shield)\b/i, weight_kg: 3.0, volume_category: 'held', confidence: 90 },
  
  // Armor
  { pattern: /\b(leather\s+armor|padded\s+armor)\b/i, weight_kg: 4.5, volume_category: 'backpack', confidence: 90 },
  { pattern: /\b(chain\s+mail|scale\s+mail)\b/i, weight_kg: 20.0, volume_category: 'wagon', confidence: 90 },
  { pattern: /\b(plate\s+armor|full\s+plate)\b/i, weight_kg: 27.0, volume_category: 'wagon', confidence: 90 },
  { pattern: /\b(ring\s+mail|splint\s+armor)\b/i, weight_kg: 20.0, volume_category: 'wagon', confidence: 90 },
  
  // Potions and consumables
  { pattern: /\b(potion|elixir|philter|vial)\b/i, weight_kg: 0.1, volume_category: 'pouch', confidence: 95 },
  { pattern: /\b(poison|venom)\b/i, weight_kg: 0.05, volume_category: 'pouch', confidence: 95 },
  { pattern: /\b(scroll)\b/i, weight_kg: 0.01, volume_category: 'pouch', confidence: 95 },
  { pattern: /\b(ration|food)\b/i, weight_kg: 0.5, volume_category: 'bag', confidence: 85 },
  
  // Tools and equipment
  { pattern: /\b(tool|kit|set)\b/i, weight_kg: 2.0, volume_category: 'bag', confidence: 70 },
  { pattern: /\b(backpack|pack)\b/i, weight_kg: 2.0, volume_category: 'backpack', confidence: 90 },
  { pattern: /\b(bag|pouch|sack)\b/i, weight_kg: 0.5, volume_category: 'bag', confidence: 85 },
  { pattern: /\b(rope)\b/i, weight_kg: 2.3, volume_category: 'backpack', confidence: 90 },
  { pattern: /\b(torch|lantern)\b/i, weight_kg: 0.5, volume_category: 'bag', confidence: 85 },
  
  // Spell components
  { pattern: /\b(spell\s+component|material\s+component)\b/i, weight_kg: 0.01, volume_category: 'pouch', confidence: 80 },
  { pattern: /\b(diamond|gem|jewel|pearl)\b/i, weight_kg: 0.01, volume_category: 'pouch', confidence: 85 },
  
  // Magic items (generally lighter or same as mundane)
  { pattern: /\b(magic|magical|enchanted)\b/i, weight_kg: null, volume_category: 'held', confidence: 50 }, // Use base item weight
  
  // Large items
  { pattern: /\b(chest|barrel|crate)\b/i, weight_kg: 25.0, volume_category: 'wagon', confidence: 85 },
  { pattern: /\b(wagon|cart|chariot)\b/i, weight_kg: 200.0, volume_category: 'too big', confidence: 95 },
  { pattern: /\b(ship|boat)\b/i, weight_kg: 1000.0, volume_category: 'too big', confidence: 95 },
];

/**
 * Convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  return lb * 0.453592;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  return kg / 0.453592;
}

/**
 * Estimate volume category based on weight and description
 */
export function estimateVolumeCategory(weight_kg: number | null, description: string, itemName: string): string {
  const lowerDesc = description.toLowerCase();
  const lowerName = itemName.toLowerCase();
  const combined = `${lowerName} ${lowerDesc}`;
  
  // Check specific patterns first
  for (const estimate of WEIGHT_ESTIMATES) {
    if (estimate.pattern.test(combined)) {
      return normalizeVolumeCategory(estimate.volume_category);
    }
  }
  
  // If no pattern match, use weight-based estimation
  if (weight_kg === null || weight_kg === 0) {
    // Default to held if we can't determine
    return normalizeVolumeCategory('held');
  }
  
  if (weight_kg <= 2) return normalizeVolumeCategory('pouch');
  if (weight_kg <= 5) {
    // Check if it's a weapon (sheath/quiver) or other (bag)
    if (lowerName.match(/\b(sword|axe|bow|arrow|bolt|dagger|weapon)\b/)) {
      return normalizeVolumeCategory('sheath/quiver');
    }
    return normalizeVolumeCategory('held');
  }
  if (weight_kg <= 10) return normalizeVolumeCategory('bag');
  if (weight_kg <= 30) return normalizeVolumeCategory('backpack');
  if (weight_kg <= 500) return normalizeVolumeCategory('wagon');
  return normalizeVolumeCategory('too big');
}

/**
 * Estimate real weight based on description when weight is 0 or missing
 */
export function estimateRealWeight(description: string, itemName: string, itemKind: string): number | null {
  const lowerDesc = description.toLowerCase();
  const lowerName = itemName.toLowerCase();
  const combined = `${lowerName} ${lowerDesc}`;
  
  // Check specific patterns
  for (const estimate of WEIGHT_ESTIMATES) {
    if (estimate.pattern.test(combined)) {
      return estimate.weight_kg;
    }
  }
  
  // Fallback estimates based on item kind
  switch (itemKind) {
    case 'weapon':
      // Default weapon weight
      if (lowerName.match(/\b(dagger|knife|shortsword)\b/)) return 0.5;
      if (lowerName.match(/\b(longsword|scimitar|axe|hammer)\b/)) return 1.5;
      if (lowerName.match(/\b(great|polearm|two-handed)\b/)) return 3.0;
      return 1.0; // Default weapon
    case 'armor':
      if (lowerName.match(/\b(leather|padded)\b/)) return 4.5;
      if (lowerName.match(/\b(chain|scale|ring|splint)\b/)) return 20.0;
      if (lowerName.match(/\b(plate|full)\b/)) return 27.0;
      return 10.0; // Default armor
    case 'consumable':
      if (lowerName.match(/\b(potion|elixir|vial)\b/)) return 0.1;
      if (lowerName.match(/\b(poison|venom)\b/)) return 0.05;
      if (lowerName.match(/\b(scroll)\b/)) return 0.01;
      return 0.2; // Default consumable
    case 'tool':
      return 2.0; // Default tool
    case 'magic_item':
      // Magic items are often lighter, but use base item weight if applicable
      return null; // Let description patterns handle it
    default:
      return 0.5; // Default small item
  }
}

/**
 * Calculate extraction confidence score
 */
export function calculateConfidence(
  hasWeight: boolean,
  hasCost: boolean,
  hasDescription: boolean,
  descriptionLength: number,
  hasProperties: boolean,
  itemKind: string | null
): number {
  let confidence = 0;
  
  // Base confidence from data completeness
  if (hasWeight) confidence += 20;
  if (hasCost) confidence += 20;
  if (hasDescription) {
    confidence += 20;
    if (descriptionLength > 50) confidence += 10;
    if (descriptionLength > 100) confidence += 10;
  }
  if (hasProperties) confidence += 10;
  if (itemKind && itemKind !== 'other') confidence += 10;
  
  // Maximum is 100
  return Math.min(confidence, 100);
}

/**
 * Process weight and volume for an item
 */
export function processItemWeightAndVolume(
  item: {
    name?: string;
    kind?: string;
    description?: string;
    weight_lb?: number | null;
  }
): WeightEstimate {
  const name = item.name || '';
  const description = item.description || '';
  const kind = item.kind || 'other';
  
  // Convert existing weight to kg
  let weight_kg: number | null = null;
  if (item.weight_lb !== null && item.weight_lb !== undefined && item.weight_lb > 0) {
    weight_kg = lbToKg(item.weight_lb);
  }
  
  // Estimate real weight if missing
  let estimated_real_weight_kg: number | null = null;
  if (weight_kg === null || weight_kg === 0) {
    estimated_real_weight_kg = estimateRealWeight(description, name, kind);
    weight_kg = estimated_real_weight_kg; // Use estimate as weight
  }
  
  // Determine volume category
  const volume_category = estimateVolumeCategory(weight_kg, description, name);
  
  // Calculate confidence
  const confidence = calculateConfidence(
    item.weight_lb !== null && item.weight_lb !== undefined && item.weight_lb > 0,
    false, // cost handled separately
    description.length > 0,
    description.length,
    false, // properties handled separately
    kind
  );
  
  return {
    weight_kg: weight_kg || 0,
    estimated_real_weight_kg: estimated_real_weight_kg,
    volume_category: volume_category,
    confidence: confidence,
  };
}

