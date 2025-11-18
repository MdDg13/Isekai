/**
 * Update existing extracted data files with new fields:
 * - weight_kg (metric weight)
 * - volume_category
 * - estimated_real_weight_kg
 * - extraction_confidence_score
 */

import * as fs from 'fs';
import * as path from 'path';
import { processItemWeightAndVolume, calculateConfidence } from './weight-and-volume-estimator';
import { normalizeItemCost } from './cost-normalizer';

function updateItems(items: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return items.map(item => {
    const name = (item.name as string) || '';
    const kind = (item.kind as string) || 'other';
    const description = (item.description as string) || '';
    const weight_lb = (item.weight_lb as number) || null;
    const cost_gp = (item.cost_gp as number) || null;
    const properties = (item.properties as Record<string, unknown>) || {};
    
    // Process weight and volume
    const weightVolume = processItemWeightAndVolume({
      name,
      kind,
      description,
      weight_lb
    });
    
    // Calculate confidence
    const extraction_confidence_score = calculateConfidence(
      weight_lb !== null && weight_lb > 0,
      cost_gp !== null && cost_gp > 0,
      description.length > 0,
      description.length,
      Object.keys(properties).length > 0,
      kind
    );
    
    // Normalize cost if not already done
    let cost_breakdown = item.cost_breakdown;
    if (!cost_breakdown && cost_gp) {
      const normalized = normalizeItemCost({ name, kind, rarity: (item.rarity as string) || null, cost_gp });
      cost_breakdown = normalized.cost_breakdown;
    }
    
    return {
      ...item,
      weight_kg: weightVolume.weight_kg,
      estimated_real_weight_kg: weightVolume.estimated_real_weight_kg,
      volume_category: weightVolume.volume_category,
      extraction_confidence_score: extraction_confidence_score,
      cost_breakdown: cost_breakdown || null,
    };
  });
}

function updateMonsters(monsters: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return monsters.map(monster => {
    const description = JSON.stringify(monster).substring(0, 500); // Use full monster as description proxy
    const traits = (monster.traits as Array<unknown>) || [];
    const actions = (monster.actions as Array<unknown>) || [];
    
    const extraction_confidence_score = calculateConfidence(
      false, // weight not applicable
      false, // cost not applicable
      description.length > 200,
      description.length,
      traits.length > 0 || actions.length > 0,
      'monster'
    );
    
    return {
      ...monster,
      extraction_confidence_score: extraction_confidence_score,
    };
  });
}

function updateSpells(spells: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return spells.map(spell => {
    const description = (spell.description as string) || '';
    const level = (spell.level as number) || null;
    const school = (spell.school as string) || null;
    
    const extraction_confidence_score = calculateConfidence(
      false, // weight not applicable
      false, // cost not applicable
      description.length > 50,
      description.length,
      level !== null && school !== null,
      'spell'
    );
    
    return {
      ...spell,
      extraction_confidence_score: extraction_confidence_score,
    };
  });
}

function updateClasses(classes: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return classes.map(cls => {
    const features = (cls.class_features as Array<unknown>) || [];
    const description = JSON.stringify(cls).substring(0, 500);
    
    const extraction_confidence_score = calculateConfidence(
      false,
      false,
      description.length > 100,
      description.length,
      features.length > 0,
      'class'
    );
    
    return {
      ...cls,
      extraction_confidence_score: extraction_confidence_score,
    };
  });
}

function updateRaces(races: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return races.map(race => {
    const traits = (race.traits as Array<unknown>) || [];
    const description = JSON.stringify(race).substring(0, 500);
    
    const extraction_confidence_score = calculateConfidence(
      false,
      false,
      description.length > 100,
      description.length,
      traits.length > 0,
      'race'
    );
    
    return {
      ...race,
      extraction_confidence_score: extraction_confidence_score,
    };
  });
}

function updateFeats(feats: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return feats.map(feat => {
    const description = (feat.description as string) || (feat.benefits as string) || '';
    const prerequisites = (feat.prerequisites as string) || null;
    
    const extraction_confidence_score = calculateConfidence(
      false,
      false,
      description.length > 50,
      description.length,
      prerequisites !== null,
      'feat'
    );
    
    return {
      ...feat,
      extraction_confidence_score: extraction_confidence_score,
    };
  });
}

function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'data/free5e/processed';
  const outputDir = args[1] || inputDir;
  
  console.log('\n=== Updating Existing Data Files ===\n');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Update items
  const itemsFile = path.join(inputDir, 'items-merged.json');
  if (fs.existsSync(itemsFile)) {
    console.log('Updating items...');
    let content = fs.readFileSync(itemsFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const items = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateItems(items);
        fs.writeFileSync(path.join(outputDir, 'items-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} items`);
      } catch (error) {
        console.error(`  Error updating items: ${error}`);
      }
    }
  }
  
  // Update monsters
  const monstersFile = path.join(inputDir, 'monsters-merged.json');
  if (fs.existsSync(monstersFile)) {
    console.log('Updating monsters...');
    let content = fs.readFileSync(monstersFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const monsters = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateMonsters(monsters);
        fs.writeFileSync(path.join(outputDir, 'monsters-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} monsters`);
      } catch (error) {
        console.error(`  Error updating monsters: ${error}`);
      }
    }
  }
  
  // Update spells
  const spellsFile = path.join(inputDir, 'spells-merged.json');
  if (fs.existsSync(spellsFile)) {
    console.log('Updating spells...');
    let content = fs.readFileSync(spellsFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const spells = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateSpells(spells);
        fs.writeFileSync(path.join(outputDir, 'spells-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} spells`);
      } catch (error) {
        console.error(`  Error updating spells: ${error}`);
      }
    }
  }

  // Update classes
  const classesFile = path.join(inputDir, 'classes-merged.json');
  if (fs.existsSync(classesFile)) {
    console.log('Updating classes...');
    let content = fs.readFileSync(classesFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const classes = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateClasses(classes);
        fs.writeFileSync(path.join(outputDir, 'classes-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} classes`);
      } catch (error) {
        console.error(`  Error updating classes: ${error}`);
      }
    }
  }

  // Update races
  const racesFile = path.join(inputDir, 'races-merged.json');
  if (fs.existsSync(racesFile)) {
    console.log('Updating races...');
    let content = fs.readFileSync(racesFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const races = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateRaces(races);
        fs.writeFileSync(path.join(outputDir, 'races-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} races`);
      } catch (error) {
        console.error(`  Error updating races: ${error}`);
      }
    }
  }

  // Update feats
  const featsFile = path.join(inputDir, 'feats-merged.json');
  if (fs.existsSync(featsFile)) {
    console.log('Updating feats...');
    let content = fs.readFileSync(featsFile, 'utf-8').trim();
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    if (content.length > 0) {
      try {
        const feats = JSON.parse(content) as Array<Record<string, unknown>>;
        const updated = updateFeats(feats);
        fs.writeFileSync(path.join(outputDir, 'feats-merged.json'), JSON.stringify(updated, null, 2));
        console.log(`  Updated ${updated.length} feats`);
      } catch (error) {
        console.error(`  Error updating feats: ${error}`);
      }
    }
  }
  
  console.log('\n=== Update Complete ===\n');
}

if (require.main === module) {
  main();
}

