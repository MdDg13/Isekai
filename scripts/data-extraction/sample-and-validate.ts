/**
 * Sample and Validate Extracted Data
 * Generates sample data with validation scores for review before database loading
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  validateSpell,
  validateItem,
  validateMonster,
  validateTrap,
  validatePuzzle,
  ValidationResult,
} from './validate-extracted-data';

interface SampleResult {
  type: string;
  sample: Record<string, unknown>;
  validation: {
    score: number;
    errors: string[];
    warnings: string[];
  };
}

function main() {
  const inputDir = process.argv[2] || 'data/free5e/processed';
  
  console.log('\n=== Sampling and Validating Extracted Data ===\n');
  console.log(`Input directory: ${inputDir}\n`);

  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  const samples: SampleResult[] = [];

  // Sample and validate spells
  const spellsFile = path.join(inputDir, 'spells-merged.json');
  if (fs.existsSync(spellsFile)) {
    let content = fs.readFileSync(spellsFile, 'utf-8');
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    const spells = JSON.parse(content) as Array<Record<string, unknown>>;
    if (spells.length > 0) {
      // Get 3 random samples
      const sampleSpells = spells.slice(0, Math.min(3, spells.length));
      for (const spell of sampleSpells) {
        const result = validateSpell(spell, (spell.source as string) || 'unknown');
        samples.push({
          type: 'spell',
          sample: spell,
          validation: {
            score: result.score,
            errors: result.errors,
            warnings: result.warnings,
          },
        });
      }
    }
  }

  // Sample and validate items
  const itemsFile = path.join(inputDir, 'items-merged.json');
  if (fs.existsSync(itemsFile)) {
    let content = fs.readFileSync(itemsFile, 'utf-8').trim();
    if (content.length === 0) {
      console.log('  Items file is empty, skipping...');
    } else {
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      try {
        const items = JSON.parse(content) as Array<Record<string, unknown>>;
        if (items.length > 0) {
          const sampleItems = items.slice(0, Math.min(3, items.length));
          for (const item of sampleItems) {
            const result = validateItem(item, (item.source as string) || 'unknown');
            samples.push({
              type: 'item',
              sample: item,
              validation: {
                score: result.score,
                errors: result.errors,
                warnings: result.warnings,
              },
            });
          }
        }
      } catch (error) {
        console.log(`  Error parsing items file: ${error}`);
      }
    }
  }

  // Sample and validate monsters
  const monstersFile = path.join(inputDir, 'monsters-merged.json');
  if (fs.existsSync(monstersFile)) {
    let content = fs.readFileSync(monstersFile, 'utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const monsters = JSON.parse(content) as Array<Record<string, unknown>>;
    if (monsters.length > 0) {
      const sampleMonsters = monsters.slice(0, Math.min(3, monsters.length));
      for (const monster of sampleMonsters) {
        const result = validateMonster(monster, (monster.source as string) || 'unknown');
        samples.push({
          type: 'monster',
          sample: monster,
          validation: {
            score: result.score,
            errors: result.errors,
            warnings: result.warnings,
          },
        });
      }
    }
  }

  // Sample and validate traps
  const trapsFile = path.join(inputDir, 'traps-extracted.json');
  if (fs.existsSync(trapsFile)) {
    let content = fs.readFileSync(trapsFile, 'utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const traps = JSON.parse(content) as Array<Record<string, unknown>>;
    if (traps.length > 0) {
      const sampleTraps = traps.slice(0, Math.min(3, traps.length));
      for (const trap of sampleTraps) {
        const result = validateTrap(trap, (trap.source as string) || 'unknown');
        samples.push({
          type: 'trap',
          sample: trap,
          validation: {
            score: result.score,
            errors: result.errors,
            warnings: result.warnings,
          },
        });
      }
    }
  }

  // Sample and validate puzzles
  const puzzlesFile = path.join(inputDir, 'puzzles-extracted.json');
  if (fs.existsSync(puzzlesFile)) {
    let content = fs.readFileSync(puzzlesFile, 'utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const puzzles = JSON.parse(content) as Array<Record<string, unknown>>;
    if (puzzles.length > 0) {
      const samplePuzzles = puzzles.slice(0, Math.min(3, puzzles.length));
      for (const puzzle of samplePuzzles) {
        const result = validatePuzzle(puzzle, (puzzle.source as string) || 'unknown');
        samples.push({
          type: 'puzzle',
          sample: puzzle,
          validation: {
            score: result.score,
            errors: result.errors,
            warnings: result.warnings,
          },
        });
      }
    }
  }

  // Print samples
  console.log('=== Sample Data with Validation Scores ===\n');

  for (const sample of samples) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${sample.type.toUpperCase()}: ${(sample.sample.name as string) || 'Unknown'}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Validation Score: ${sample.validation.score}/100`);
    if (sample.validation.errors.length > 0) {
      console.log(`Errors: ${sample.validation.errors.join(', ')}`);
    }
    if (sample.validation.warnings.length > 0) {
      console.log(`Warnings: ${sample.validation.warnings.join(', ')}`);
    }
    console.log(`\nSource: ${sample.sample.source || 'unknown'}`);
    console.log('\nData:');
    console.log(JSON.stringify(sample.sample, null, 2));
    console.log('');
  }

  // Summary
  console.log('\n=== Summary ===\n');
  const byType = samples.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s.validation.score);
    return acc;
  }, {} as Record<string, number[]>);

  for (const [type, scores] of Object.entries(byType)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    console.log(`${type}: ${scores.length} samples, avg score: ${Math.round(avg)}, range: ${min}-${max}`);
  }
}

if (require.main === module) {
  main();
}

