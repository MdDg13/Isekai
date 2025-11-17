/**
 * Validate Extracted Data Quality
 * Validates extracted spells, items, monsters, puzzles, and traps against:
 * - Schema requirements
 * - Known 5etools patterns
 * - Completeness checks
 * - Consistency checks
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  type: string;
  name: string;
  source: string;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  averageScore: number;
  results: ValidationResult[];
}

// Known 5etools patterns for validation
const KNOWN_SPELL_SCHOOLS = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation'
];

const KNOWN_SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const KNOWN_MONSTER_TYPES = [
  'aberration', 'beast', 'celestial', 'construct', 'dragon',
  'elemental', 'fey', 'fiend', 'giant', 'humanoid',
  'monstrosity', 'ooze', 'plant', 'undead'
];

const KNOWN_MONSTER_SIZES = [
  'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'
];

const KNOWN_ITEM_KINDS = [
  'weapon', 'armor', 'tool', 'consumable', 'magic_item', 'other'
];

const KNOWN_RARITIES = [
  'common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'
];

const KNOWN_THREAT_LEVELS = ['setback', 'dangerous', 'deadly'];

const KNOWN_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Validate a spell entry
 */
function validateSpell(spell: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const name = spell.name as string;
  if (!name || name.length < 2) {
    errors.push('Missing or invalid name');
    score -= 50;
  }

  // Check level
  const level = spell.level as number;
  if (level === undefined || level === null) {
    errors.push('Missing level');
    score -= 20;
  } else if (!KNOWN_SPELL_LEVELS.includes(level)) {
    errors.push(`Invalid level: ${level} (must be 0-9)`);
    score -= 15;
  }

  // Check school
  const school = (spell.school as string)?.toLowerCase();
  if (!school) {
    errors.push('Missing school');
    score -= 20;
  } else if (!KNOWN_SPELL_SCHOOLS.includes(school)) {
    warnings.push(`Unknown school: ${school}`);
    score -= 5;
  }

  // Check required fields
  if (!spell.casting_time) {
    errors.push('Missing casting_time');
    score -= 10;
  }
  if (!spell.range) {
    errors.push('Missing range');
    score -= 10;
  }
  if (!spell.components) {
    errors.push('Missing components');
    score -= 10;
  }
  if (!spell.duration) {
    errors.push('Missing duration');
    score -= 10;
  }
  if (!spell.description || (spell.description as string).length < 20) {
    errors.push('Missing or too short description');
    score -= 15;
  }

  // Validate casting time format (should contain "action", "bonus action", "reaction", "minute", "hour", etc.)
  const castingTime = (spell.casting_time as string)?.toLowerCase() || '';
  if (castingTime && !castingTime.match(/\b(action|bonus action|reaction|minute|hour|day)\b/)) {
    warnings.push(`Unusual casting time format: ${spell.casting_time}`);
    score -= 3;
  }

  // Validate range format (should contain "feet", "miles", "Self", "Touch", "Sight", etc.)
  const range = (spell.range as string)?.toLowerCase() || '';
  if (range && !range.match(/\b(self|touch|sight|unlimited|feet|miles)\b/)) {
    warnings.push(`Unusual range format: ${spell.range}`);
    score -= 3;
  }

  // Validate components (should contain V, S, M)
  const components = (spell.components as string)?.toUpperCase() || '';
  if (components && !components.match(/[VSM]/)) {
    warnings.push(`Unusual components format: ${spell.components}`);
    score -= 3;
  }

  // Check for common false positives
  if (name && name.length < 3) {
    errors.push('Name too short (likely false positive)');
    score -= 30;
  }

  // Check description quality
  const description = (spell.description as string) || '';
  if (description.length < 50 && !description.match(/cantrip/i)) {
    warnings.push('Description seems too short');
    score -= 5;
  }

  // Check for truncated data (common extraction issue)
  if (description.match(/\.\.\.$|\[truncated\]|\[cut off\]/i)) {
    warnings.push('Description appears truncated');
    score -= 5;
  }

  score = Math.max(0, score);

  return {
    type: 'spell',
    name: name || 'Unknown',
    source,
    errors,
    warnings,
    score
  };
}

/**
 * Validate an item entry
 */
function validateItem(item: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const name = item.name as string;
  if (!name || name.length < 2) {
    errors.push('Missing or invalid name');
    score -= 50;
  }

  // Check kind
  const kind = (item.kind as string)?.toLowerCase();
  if (!kind) {
    errors.push('Missing kind');
    score -= 20;
  } else if (!KNOWN_ITEM_KINDS.includes(kind)) {
    warnings.push(`Unknown kind: ${kind}`);
    score -= 5;
  }

  // Check rarity for magic items
  if (kind === 'magic_item' && !item.rarity) {
    warnings.push('Magic item missing rarity');
    score -= 10;
  } else if (item.rarity) {
    const rarity = (item.rarity as string)?.toLowerCase();
    if (!KNOWN_RARITIES.includes(rarity)) {
      warnings.push(`Unknown rarity: ${rarity}`);
      score -= 3;
    }
  }

  // Validate cost
  if (item.cost_gp !== null && item.cost_gp !== undefined) {
    const cost = Number(item.cost_gp);
    if (isNaN(cost) || cost < 0) {
      errors.push(`Invalid cost_gp: ${item.cost_gp}`);
      score -= 10;
    }
  }

  // Validate weight
  if (item.weight_lb !== null && item.weight_lb !== undefined) {
    const weight = Number(item.weight_lb);
    if (isNaN(weight) || weight < 0) {
      errors.push(`Invalid weight_lb: ${item.weight_lb}`);
      score -= 10;
    }
  }

  // Check description
  if (!item.description || (item.description as string).length < 10) {
    warnings.push('Missing or very short description');
    score -= 10;
  }

  // Check for false positives
  if (name && name.length < 3) {
    errors.push('Name too short (likely false positive)');
    score -= 30;
  }

  // Check for common extraction issues
  const description = (item.description as string) || '';
  if (description.match(/\.\.\.$|\[truncated\]/i)) {
    warnings.push('Description appears truncated');
    score -= 5;
  }

  score = Math.max(0, score);

  return {
    type: 'item',
    name: name || 'Unknown',
    source,
    errors,
    warnings,
    score
  };
}

/**
 * Validate a monster entry
 */
function validateMonster(monster: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const name = monster.name as string;
  if (!name || name.length < 2) {
    errors.push('Missing or invalid name');
    score -= 50;
  }

  // Check type
  const type = (monster.type as string)?.toLowerCase();
  if (!type) {
    errors.push('Missing type');
    score -= 20;
  } else if (!KNOWN_MONSTER_TYPES.includes(type)) {
    warnings.push(`Unknown type: ${type}`);
    score -= 5;
  }

  // Check size
  const size = (monster.size as string)?.toLowerCase();
  if (!size) {
    errors.push('Missing size');
    score -= 20;
  } else if (!KNOWN_MONSTER_SIZES.includes(size)) {
    warnings.push(`Unknown size: ${size}`);
    score -= 5;
  }

  // Check AC
  const ac = monster.armor_class as number;
  if (ac === undefined || ac === null) {
    errors.push('Missing armor_class');
    score -= 15;
  } else if (ac < 1 || ac > 30) {
    warnings.push(`Unusual AC: ${ac} (expected 1-30)`);
    score -= 5;
  }

  // Check HP
  const hp = monster.hit_points as number;
  if (hp === undefined || hp === null) {
    errors.push('Missing hit_points');
    score -= 15;
  } else if (hp < 1 || hp > 1000) {
    warnings.push(`Unusual HP: ${hp} (expected 1-1000)`);
    score -= 5;
  }

  // Check CR
  const cr = monster.challenge_rating as number;
  if (cr === undefined || cr === null) {
    errors.push('Missing challenge_rating');
    score -= 15;
  } else if (cr < 0 || cr > 30) {
    warnings.push(`Unusual CR: ${cr} (expected 0-30)`);
    score -= 5;
  }

  // Check stats
  if (!monster.stats) {
    warnings.push('Missing stats');
    score -= 10;
  } else {
    const stats = monster.stats as Record<string, number>;
    const requiredStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const stat of requiredStats) {
      if (stats[stat] === undefined || stats[stat] === null) {
        warnings.push(`Missing stat: ${stat}`);
        score -= 2;
      } else if (stats[stat] < 1 || stats[stat] > 30) {
        warnings.push(`Unusual ${stat}: ${stats[stat]} (expected 1-30)`);
        score -= 2;
      }
    }
  }

  // Check for false positives
  if (name && name.length < 3) {
    errors.push('Name too short (likely false positive)');
    score -= 30;
  }

  score = Math.max(0, score);

  return {
    type: 'monster',
    name: name || 'Unknown',
    source,
    errors,
    warnings,
    score
  };
}

/**
 * Validate a trap entry
 */
function validateTrap(trap: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const name = trap.name as string;
  if (!name || name.length < 3) {
    errors.push('Missing or invalid name');
    score -= 50;
  }

  // Check description
  if (!trap.description || (trap.description as string).length < 30) {
    errors.push('Missing or too short description');
    score -= 30;
  }

  // Validate DC
  if (trap.difficulty_class !== null && trap.difficulty_class !== undefined) {
    const dc = Number(trap.difficulty_class);
    if (isNaN(dc) || dc < 1 || dc > 30) {
      warnings.push(`Unusual DC: ${trap.difficulty_class} (expected 1-30)`);
      score -= 5;
    }
  }

  // Validate threat level
  if (trap.threat_level) {
    const threat = (trap.threat_level as string)?.toLowerCase();
    if (!KNOWN_THREAT_LEVELS.includes(threat)) {
      warnings.push(`Unknown threat level: ${threat}`);
      score -= 5;
    }
  }

  // Validate difficulty
  if (trap.difficulty) {
    const difficulty = (trap.difficulty as string)?.toLowerCase();
    if (!KNOWN_DIFFICULTIES.includes(difficulty)) {
      warnings.push(`Unknown difficulty: ${difficulty}`);
      score -= 3;
    }
  }

  // Check for structured sections (preferred)
  if (!trap.trigger && !trap.effect) {
    warnings.push('Missing structured sections (trigger/effect)');
    score -= 10;
  }

  // Check for false positives
  if (name && name.length < 5) {
    errors.push('Name too short (likely false positive)');
    score -= 30;
  }

  score = Math.max(0, score);

  return {
    type: 'trap',
    name: name || 'Unknown',
    source,
    errors,
    warnings,
    score
  };
}

/**
 * Validate a puzzle entry
 */
function validatePuzzle(puzzle: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const name = puzzle.name as string;
  if (!name || name.length < 3) {
    errors.push('Missing or invalid name');
    score -= 50;
  }

  // Check description
  if (!puzzle.description || (puzzle.description as string).length < 50) {
    errors.push('Missing or too short description');
    score -= 30;
  }

  // Validate difficulty
  if (puzzle.difficulty) {
    const difficulty = (puzzle.difficulty as string)?.toLowerCase();
    if (!KNOWN_DIFFICULTIES.includes(difficulty)) {
      warnings.push(`Unknown difficulty: ${difficulty}`);
      score -= 3;
    }
  }

  // Check for structured sections (preferred)
  if (!puzzle.solution && !puzzle.puzzle_features) {
    warnings.push('Missing structured sections (solution/features)');
    score -= 10;
  }

  // Check for false positives
  if (name && name.length < 5) {
    errors.push('Name too short (likely false positive)');
    score -= 30;
  }

  score = Math.max(0, score);

  return {
    type: 'puzzle',
    name: name || 'Unknown',
    source,
    errors,
    warnings,
    score
  };
}

/**
 * Validate all data in a directory
 */
function validateData(inputDir: string): {
  spells: ValidationStats;
  items: ValidationStats;
  monsters: ValidationStats;
  traps: ValidationStats;
  puzzles: ValidationStats;
} {
  const results = {
    spells: { total: 0, valid: 0, invalid: 0, warnings: 0, averageScore: 0, results: [] as ValidationResult[] },
    items: { total: 0, valid: 0, invalid: 0, warnings: 0, averageScore: 0, results: [] as ValidationResult[] },
    monsters: { total: 0, valid: 0, invalid: 0, warnings: 0, averageScore: 0, results: [] as ValidationResult[] },
    traps: { total: 0, valid: 0, invalid: 0, warnings: 0, averageScore: 0, results: [] as ValidationResult[] },
    puzzles: { total: 0, valid: 0, invalid: 0, warnings: 0, averageScore: 0, results: [] as ValidationResult[] },
  };

  // Validate spells
  const spellsFile = path.join(inputDir, 'spells-extracted.json');
  if (fs.existsSync(spellsFile)) {
    const spells = JSON.parse(fs.readFileSync(spellsFile, 'utf-8')) as Array<Record<string, unknown>>;
    for (const spell of spells) {
      const result = validateSpell(spell, (spell.source as string) || 'unknown');
      results.spells.results.push(result);
      results.spells.total++;
      if (result.errors.length === 0) {
        results.spells.valid++;
      } else {
        results.spells.invalid++;
      }
      if (result.warnings.length > 0) {
        results.spells.warnings++;
      }
      results.spells.averageScore += result.score;
    }
    if (results.spells.total > 0) {
      results.spells.averageScore /= results.spells.total;
    }
  }

  // Validate items
  const itemsFile = path.join(inputDir, 'items-extracted.json');
  if (fs.existsSync(itemsFile)) {
    const items = JSON.parse(fs.readFileSync(itemsFile, 'utf-8')) as Array<Record<string, unknown>>;
    for (const item of items) {
      const result = validateItem(item, (item.source as string) || 'unknown');
      results.items.results.push(result);
      results.items.total++;
      if (result.errors.length === 0) {
        results.items.valid++;
      } else {
        results.items.invalid++;
      }
      if (result.warnings.length > 0) {
        results.items.warnings++;
      }
      results.items.averageScore += result.score;
    }
    if (results.items.total > 0) {
      results.items.averageScore /= results.items.total;
    }
  }

  // Validate monsters
  const monstersFile = path.join(inputDir, 'monsters-extracted.json');
  if (fs.existsSync(monstersFile)) {
    const monsters = JSON.parse(fs.readFileSync(monstersFile, 'utf-8')) as Array<Record<string, unknown>>;
    for (const monster of monsters) {
      const result = validateMonster(monster, (monster.source as string) || 'unknown');
      results.monsters.results.push(result);
      results.monsters.total++;
      if (result.errors.length === 0) {
        results.monsters.valid++;
      } else {
        results.monsters.invalid++;
      }
      if (result.warnings.length > 0) {
        results.monsters.warnings++;
      }
      results.monsters.averageScore += result.score;
    }
    if (results.monsters.total > 0) {
      results.monsters.averageScore /= results.monsters.total;
    }
  }

  // Validate traps
  const trapsFile = path.join(inputDir, 'traps-extracted.json');
  if (fs.existsSync(trapsFile)) {
    const traps = JSON.parse(fs.readFileSync(trapsFile, 'utf-8')) as Array<Record<string, unknown>>;
    for (const trap of traps) {
      const result = validateTrap(trap, (trap.source as string) || 'unknown');
      results.traps.results.push(result);
      results.traps.total++;
      if (result.errors.length === 0) {
        results.traps.valid++;
      } else {
        results.traps.invalid++;
      }
      if (result.warnings.length > 0) {
        results.traps.warnings++;
      }
      results.traps.averageScore += result.score;
    }
    if (results.traps.total > 0) {
      results.traps.averageScore /= results.traps.total;
    }
  }

  // Validate puzzles
  const puzzlesFile = path.join(inputDir, 'puzzles-extracted.json');
  if (fs.existsSync(puzzlesFile)) {
    const puzzles = JSON.parse(fs.readFileSync(puzzlesFile, 'utf-8')) as Array<Record<string, unknown>>;
    for (const puzzle of puzzles) {
      const result = validatePuzzle(puzzle, (puzzle.source as string) || 'unknown');
      results.puzzles.results.push(result);
      results.puzzles.total++;
      if (result.errors.length === 0) {
        results.puzzles.valid++;
      } else {
        results.puzzles.invalid++;
      }
      if (result.warnings.length > 0) {
        results.puzzles.warnings++;
      }
      results.puzzles.averageScore += result.score;
    }
    if (results.puzzles.total > 0) {
      results.puzzles.averageScore /= results.puzzles.total;
    }
  }

  return results;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'data/free5e/processed';

  console.log('\n=== Data Quality Validation ===\n');
  console.log(`Input directory: ${inputDir}\n`);

  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  const results = validateData(inputDir);

  // Print summary
  console.log('=== Validation Summary ===\n');

  const types = ['spells', 'items', 'monsters', 'traps', 'puzzles'] as const;
  for (const type of types) {
    const stats = results[type];
    if (stats.total === 0) continue;

    console.log(`${type.toUpperCase()}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Valid: ${stats.valid} (${Math.round((stats.valid / stats.total) * 100)}%)`);
    console.log(`  Invalid: ${stats.invalid} (${Math.round((stats.invalid / stats.total) * 100)}%)`);
    console.log(`  Warnings: ${stats.warnings} (${Math.round((stats.warnings / stats.total) * 100)}%)`);
    console.log(`  Average Score: ${Math.round(stats.averageScore)}/100`);
    console.log('');
  }

  // Print top issues
  console.log('=== Top Issues ===\n');

  for (const type of types) {
    const stats = results[type];
    if (stats.total === 0) continue;

    const invalid = stats.results.filter(r => r.errors.length > 0).slice(0, 10);
    if (invalid.length > 0) {
      console.log(`${type.toUpperCase()} - Invalid entries (showing first 10):`);
      for (const result of invalid) {
        console.log(`  - ${result.name} (${result.source}): ${result.errors.join(', ')}`);
      }
      console.log('');
    }

    const lowScore = stats.results.filter(r => r.score < 70).slice(0, 10);
    if (lowScore.length > 0) {
      console.log(`${type.toUpperCase()} - Low quality entries (score < 70, showing first 10):`);
      for (const result of lowScore) {
        console.log(`  - ${result.name} (${result.source}): Score ${Math.round(result.score)} - ${result.errors.join(', ') || result.warnings.join(', ')}`);
      }
      console.log('');
    }
  }

  // Save detailed report
  const reportFile = path.join(inputDir, 'validation-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${reportFile}`);
}

if (require.main === module) {
  main();
}

export { validateData, validateSpell, validateItem, validateMonster, validateTrap, validatePuzzle, ValidationResult };

