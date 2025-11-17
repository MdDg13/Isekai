/**
 * Free5e Data Validator
 * Validates processed Free5e data for completeness, consistency, and rule compliance
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ItemValidation extends ValidationResult {
  item: {
    name: string;
    [key: string]: unknown;
  };
}

export interface SpellValidation extends ValidationResult {
  spell: {
    name: string;
    [key: string]: unknown;
  };
}

export interface MonsterValidation extends ValidationResult {
  monster: {
    name: string;
    [key: string]: unknown;
  };
}

/**
 * Validate a Free5e item
 */
export function validateItem(item: Record<string, unknown>): ItemValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  if (!item.kind || typeof item.kind !== 'string') {
    errors.push('Missing or invalid kind');
  }
  if (!item.description || typeof item.description !== 'string') {
    errors.push('Missing or invalid description');
  }
  
  // Cost validation
  if (item.cost_gp !== undefined) {
    const cost = typeof item.cost_gp === 'number' ? item.cost_gp : parseFloat(String(item.cost_gp));
    if (isNaN(cost) || cost < 0) {
      errors.push('Invalid cost_gp (must be non-negative number)');
    }
  }
  
  // Weight validation
  if (item.weight_lb !== undefined) {
    const weight = typeof item.weight_lb === 'number' ? item.weight_lb : parseFloat(String(item.weight_lb));
    if (isNaN(weight) || weight < 0) {
      errors.push('Invalid weight_lb (must be non-negative number)');
    }
  }
  
  // Rarity validation (for magic items)
  if (item.kind === 'magic_item' && !item.rarity) {
    warnings.push('Magic item missing rarity');
  }
  if (item.rarity && !['common', 'uncommon', 'rare', 'very_rare', 'legendary'].includes(String(item.rarity))) {
    errors.push(`Invalid rarity: ${item.rarity}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    item: item as { name: string; [key: string]: unknown },
  };
}

/**
 * Validate a Free5e spell
 */
export function validateSpell(spell: Record<string, unknown>): SpellValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!spell.name || typeof spell.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  if (spell.level === undefined || typeof spell.level !== 'number' || spell.level < 0 || spell.level > 9) {
    errors.push('Missing or invalid level (must be 0-9)');
  }
  if (!spell.school || typeof spell.school !== 'string') {
    errors.push('Missing or invalid school');
  }
  if (!spell.casting_time || typeof spell.casting_time !== 'string') {
    errors.push('Missing or invalid casting_time');
  }
  if (!spell.range || typeof spell.range !== 'string') {
    errors.push('Missing or invalid range');
  }
  if (!spell.components || typeof spell.components !== 'string') {
    errors.push('Missing or invalid components');
  }
  if (!spell.duration || typeof spell.duration !== 'string') {
    errors.push('Missing or invalid duration');
  }
  if (!spell.description || typeof spell.description !== 'string') {
    errors.push('Missing or invalid description');
  }
  
  // School validation
  const validSchools = [
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation',
  ];
  if (spell.school && !validSchools.includes(String(spell.school).toLowerCase())) {
    errors.push(`Invalid school: ${spell.school}`);
  }
  
  // Components validation
  if (spell.components) {
    const components = String(spell.components).toUpperCase();
    const validComponents = ['V', 'S', 'M'];
    for (const comp of components.split(',').map(c => c.trim())) {
      if (!validComponents.includes(comp)) {
        warnings.push(`Unknown component: ${comp}`);
      }
    }
  }
  
  // Concentration check
  if (spell.duration && String(spell.duration).toLowerCase().includes('concentration')) {
    if (spell.concentration !== true) {
      warnings.push('Duration mentions concentration but concentration flag is not set');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    spell: spell as { name: string; [key: string]: unknown },
  };
}

/**
 * Validate a Free5e monster
 */
export function validateMonster(monster: Record<string, unknown>): MonsterValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!monster.name || typeof monster.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  if (!monster.size || typeof monster.size !== 'string') {
    errors.push('Missing or invalid size');
  }
  if (!monster.type || typeof monster.type !== 'string') {
    errors.push('Missing or invalid type');
  }
  if (!monster.alignment || typeof monster.alignment !== 'string') {
    errors.push('Missing or invalid alignment');
  }
  if (monster.armor_class === undefined || typeof monster.armor_class !== 'number') {
    errors.push('Missing or invalid armor_class');
  }
  if (monster.hit_points === undefined || typeof monster.hit_points !== 'number') {
    errors.push('Missing or invalid hit_points');
  }
  if (!monster.hit_dice || typeof monster.hit_dice !== 'string') {
    errors.push('Missing or invalid hit_dice');
  }
  if (!monster.speed || typeof monster.speed !== 'object') {
    errors.push('Missing or invalid speed');
  }
  if (!monster.stats || typeof monster.stats !== 'object') {
    errors.push('Missing or invalid stats');
  }
  if (monster.challenge_rating === undefined) {
    errors.push('Missing challenge_rating');
  }
  
  // Size validation
  const validSizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
  if (monster.size && !validSizes.includes(String(monster.size))) {
    errors.push(`Invalid size: ${monster.size}`);
  }
  
  // Type validation
  const validTypes = [
    'aberration',
    'beast',
    'celestial',
    'construct',
    'dragon',
    'elemental',
    'fey',
    'fiend',
    'giant',
    'humanoid',
    'monstrosity',
    'ooze',
    'plant',
    'undead',
  ];
  if (monster.type && !validTypes.includes(String(monster.type).toLowerCase())) {
    errors.push(`Invalid type: ${monster.type}`);
  }
  
  // Stats validation
  if (monster.stats && typeof monster.stats === 'object') {
    const stats = monster.stats as Record<string, unknown>;
    const requiredStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const stat of requiredStats) {
      if (stats[stat] === undefined || typeof stats[stat] !== 'number') {
        errors.push(`Missing or invalid stat: ${stat}`);
      } else {
        const statValue = stats[stat] as number;
        if (statValue < 1 || statValue > 30) {
          warnings.push(`Stat ${stat} is outside normal range (1-30): ${statValue}`);
        }
      }
    }
  }
  
  // Challenge Rating validation
  if (monster.challenge_rating !== undefined) {
    const cr = typeof monster.challenge_rating === 'number'
      ? monster.challenge_rating
      : parseFloat(String(monster.challenge_rating));
    if (isNaN(cr) || cr < 0 || cr > 30) {
      errors.push(`Invalid challenge_rating: ${monster.challenge_rating}`);
    }
  }
  
  // Hit points validation
  if (monster.hit_points !== undefined) {
    const hp = typeof monster.hit_points === 'number' ? monster.hit_points : parseInt(String(monster.hit_points));
    if (isNaN(hp) || hp < 1) {
      errors.push(`Invalid hit_points: ${monster.hit_points}`);
    }
  }
  
  // Armor Class validation
  if (monster.armor_class !== undefined) {
    const ac = typeof monster.armor_class === 'number' ? monster.armor_class : parseInt(String(monster.armor_class));
    if (isNaN(ac) || ac < 1 || ac > 30) {
      errors.push(`Invalid armor_class: ${monster.armor_class}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    monster: monster as { name: string; [key: string]: unknown },
  };
}

/**
 * Validate proficiency bonus calculation
 */
export function validateProficiencyBonus(level: number, expectedBonus: number): boolean {
  const calculated = Math.ceil((level - 1) / 4) + 2;
  return calculated === expectedBonus;
}

/**
 * Validate CR to XP mapping
 */
export function validateCRtoXP(cr: number, xp: number): boolean {
  // This would use the actual XP table - simplified check
  if (cr === 0 && xp === 0) return true;
  if (cr === 0.125 && xp === 25) return true;
  if (cr === 0.25 && xp === 50) return true;
  if (cr === 0.5 && xp === 100) return true;
  if (cr === 1 && xp === 200) return true;
  // Add more mappings as needed
  return true; // Placeholder - implement full table
}

