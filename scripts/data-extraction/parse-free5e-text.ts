/**
 * Free5e Text Parser
 * Parses extracted text from Free5e files into structured JSON
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParseOptions {
  inputDir: string;
  outputDir: string;
}

/**
 * Parse items from text
 */
function parseItems(text: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Look for item patterns (this is a simplified parser - enhance based on actual Free5e format)
  // Pattern: Item name, followed by details
  
  // Example patterns to look for:
  // - "**Item Name**" or "### Item Name"
  // - Cost: X gp
  // - Weight: X lb
  // - Properties, description, etc.
  
  const itemPattern = /(?:^|\n)(?:#{1,3}\s+)?\*{0,2}([A-Z][^\n]+?)\*{0,2}(?:\n|$)/g;
  let match;
  
  while ((match = itemPattern.exec(text)) !== null) {
    const itemName = match[1].trim();
    
    // Skip if it's clearly not an item (e.g., section headers)
    if (itemName.length > 100 || itemName.includes('Chapter') || itemName.includes('Table of')) {
      continue;
    }
    
    // Extract context around the match
    const start = Math.max(0, match.index - 500);
    const end = Math.min(text.length, match.index + 2000);
    const context = text.substring(start, end);
    
    // Try to extract item properties
    const costMatch = context.match(/(?:cost|price)[:\s]+([\d,]+)\s*(?:gp|gold)/i);
    const weightMatch = context.match(/(?:weight)[:\s]+([\d.]+)\s*(?:lb|pounds?)/i);
    const rarityMatch = context.match(/(?:rarity)[:\s]+(common|uncommon|rare|very\s+rare|legendary)/i);
    
    // Extract description (text after item name until next item or section)
    const descMatch = context.match(new RegExp(itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]{0,500}?(?=\\n\\*{0,2}[A-Z]|$)', 'i'));
    const description = descMatch ? descMatch[0].replace(itemName, '').trim() : '';
    
    if (itemName && description.length > 10) {
      items.push({
        name: itemName,
        kind: inferItemKind(itemName, description),
        cost_gp: costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : undefined,
        weight_lb: weightMatch ? parseFloat(weightMatch[1]) : undefined,
        rarity: rarityMatch ? rarityMatch[1].toLowerCase().replace(/\s+/g, '_') : undefined,
        description: description.substring(0, 1000), // Limit description length
        source: 'Free5e',
      });
    }
  }
  
  return items;
}

/**
 * Infer item kind from name and description
 */
function inferItemKind(name: string, description: string): string {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('sword') || lowerName.includes('axe') || lowerName.includes('mace') || 
      lowerName.includes('dagger') || lowerName.includes('bow') || lowerName.includes('crossbow')) {
    return 'weapon';
  }
  if (lowerName.includes('armor') || lowerName.includes('mail') || lowerName.includes('plate') ||
      lowerName.includes('leather') || lowerName.includes('shield')) {
    return 'armor';
  }
  if (lowerDesc.includes('magic') || lowerDesc.includes('enchanted') || lowerDesc.includes('magical')) {
    return 'magic_item';
  }
  if (lowerName.includes('potion') || lowerName.includes('scroll') || lowerName.includes('wand')) {
    return 'consumable';
  }
  if (lowerName.includes('tool') || lowerName.includes('kit') || lowerName.includes('instrument')) {
    return 'tool';
  }
  
  return 'other';
}

/**
 * Parse spells from text
 */
function parseSpells(text: string): Array<Record<string, unknown>> {
  const spells: Array<Record<string, unknown>> = [];
  
  // Look for spell patterns
  // Pattern: Spell name, level, school, casting time, range, components, duration, description
  
  const spellPattern = /(?:^|\n)(?:#{1,3}\s+)?\*{0,2}([A-Z][^\n]+?)\*{0,2}\s*\n\s*(?:(\d+)\s+)?(?:level\s+)?(?:cantrip|spell)?/gi;
  let match;
  
  while ((match = spellPattern.exec(text)) !== null) {
    const spellName = match[1].trim();
    const level = match[2] ? parseInt(match[2]) : 0;
    
    // Skip if it's clearly not a spell
    if (spellName.length > 100 || spellName.includes('Chapter') || spellName.includes('Spell List')) {
      continue;
    }
    
    // Extract context
    const start = Math.max(0, match.index - 200);
    const end = Math.min(text.length, match.index + 3000);
    const context = text.substring(start, end);
    
    // Extract spell properties
    const schoolMatch = context.match(/(?:school|type)[:\s]+(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
    const castingTimeMatch = context.match(/(?:casting\s+time)[:\s]+([^\n]+)/i);
    const rangeMatch = context.match(/(?:range)[:\s]+([^\n]+)/i);
    const componentsMatch = context.match(/(?:components)[:\s]+([^\n]+)/i);
    const durationMatch = context.match(/(?:duration)[:\s]+([^\n]+)/i);
    
    // Extract description
    const descStart = context.indexOf(spellName) + spellName.length;
    const descEnd = context.indexOf('\n\n', descStart);
    const description = context.substring(descStart, descEnd > 0 ? descEnd : context.length).trim();
    
    if (spellName && description.length > 20) {
      const components = componentsMatch ? componentsMatch[1].trim() : '';
      const { components: parsedComponents, material_components } = parseSpellComponents(components);
      
      spells.push({
        name: spellName,
        level: level,
        school: schoolMatch ? schoolMatch[1].toLowerCase() : 'evocation',
        casting_time: castingTimeMatch ? castingTimeMatch[1].trim() : '1 action',
        range: rangeMatch ? rangeMatch[1].trim() : 'Self',
        components: parsedComponents,
        material_components: material_components,
        duration: durationMatch ? durationMatch[1].trim() : 'Instantaneous',
        description: description.substring(0, 2000),
        ritual: description.toLowerCase().includes('ritual'),
        concentration: description.toLowerCase().includes('concentration'),
        source: 'Free5e',
      });
    }
  }
  
  return spells;
}

/**
 * Parse spell components
 */
function parseSpellComponents(componentsStr: string): { components: string; material_components?: string } {
  if (!componentsStr) return { components: '' };
  
  const parts = componentsStr.split(',').map(s => s.trim());
  const components: string[] = [];
  let materialComponents: string | undefined;
  
  for (const part of parts) {
    if (/^[VSM]$/i.test(part)) {
      components.push(part.toUpperCase());
    } else if (/^M/i.test(part)) {
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
 * Parse monsters from text
 */
function parseMonsters(text: string): Array<Record<string, unknown>> {
  const monsters: Array<Record<string, unknown>> = [];
  
  // Look for monster stat blocks
  // Pattern: Monster name, size, type, alignment, AC, HP, speed, stats, CR
  
  const monsterPattern = /(?:^|\n)(?:#{1,3}\s+)?\*{0,2}([A-Z][^\n]+?)\*{0,2}\s*\n\s*(?:size|type)[:\s]+/gi;
  let match;
  
  while ((match = monsterPattern.exec(text)) !== null) {
    const monsterName = match[1].trim();
    
    // Skip if it's clearly not a monster
    if (monsterName.length > 100 || monsterName.includes('Chapter') || monsterName.includes('Monster List')) {
      continue;
    }
    
    // Extract context (monster stat blocks are usually 500-2000 characters)
    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + 3000);
    const context = text.substring(start, end);
    
    // Extract monster properties
    const sizeMatch = context.match(/(?:size)[:\s]+(Tiny|Small|Medium|Large|Huge|Gargantuan)/i);
    const typeMatch = context.match(/(?:type)[:\s]+([^\n,]+)/i);
    const alignmentMatch = context.match(/(?:alignment)[:\s]+([^\n]+)/i);
    const acMatch = context.match(/(?:armor\s+class|ac)[:\s]+(\d+)/i);
    const hpMatch = context.match(/(?:hit\s+points|hp)[:\s]+(\d+)/i);
    const hitDiceMatch = context.match(/(?:hit\s+dice)[:\s]+([^\n]+)/i);
    const speedMatch = context.match(/(?:speed)[:\s]+([^\n]+)/i);
    const crMatch = context.match(/(?:challenge\s+rating|cr)[:\s]+([\d/]+)/i);
    
    // Extract stats (STR, DEX, CON, INT, WIS, CHA)
    const strMatch = context.match(/(?:str|strength)[:\s]+(\d+)/i);
    const dexMatch = context.match(/(?:dex|dexterity)[:\s]+(\d+)/i);
    const conMatch = context.match(/(?:con|constitution)[:\s]+(\d+)/i);
    const intMatch = context.match(/(?:int|intelligence)[:\s]+(\d+)/i);
    const wisMatch = context.match(/(?:wis|wisdom)[:\s]+(\d+)/i);
    const chaMatch = context.match(/(?:cha|charisma)[:\s]+(\d+)/i);
    
    if (monsterName && acMatch && hpMatch && crMatch) {
      // Parse challenge rating (handle fractions like "1/2")
      const crStr = crMatch[1].trim();
      const cr = crStr.includes('/') 
        ? parseFloat(crStr.split('/')[0]) / parseFloat(crStr.split('/')[1])
        : parseFloat(crStr);
      
      // Parse speed
      const speed: Record<string, number | string> = {};
      if (speedMatch) {
        const speedParts = speedMatch[1].split(',').map(s => s.trim());
        for (const part of speedParts) {
          const speedMatch2 = part.match(/(\w+)[:\s]+(\d+)/i);
          if (speedMatch2) {
            speed[speedMatch2[1].toLowerCase()] = parseInt(speedMatch2[2]);
          } else {
            speed.walk = parseInt(part) || 30;
          }
        }
      } else {
        speed.walk = 30;
      }
      
      monsters.push({
        name: monsterName,
        size: sizeMatch ? sizeMatch[1] : 'Medium',
        type: typeMatch ? typeMatch[1].trim().toLowerCase() : 'beast',
        alignment: alignmentMatch ? alignmentMatch[1].trim() : 'unaligned',
        armor_class: parseInt(acMatch[1]),
        hit_points: parseInt(hpMatch[1]),
        hit_dice: hitDiceMatch ? hitDiceMatch[1].trim() : '1d8',
        speed: speed,
        stats: {
          str: strMatch ? parseInt(strMatch[1]) : 10,
          dex: dexMatch ? parseInt(dexMatch[1]) : 10,
          con: conMatch ? parseInt(conMatch[1]) : 10,
          int: intMatch ? parseInt(intMatch[1]) : 10,
          wis: wisMatch ? parseInt(wisMatch[1]) : 10,
          cha: chaMatch ? parseInt(chaMatch[1]) : 10,
        },
        challenge_rating: cr,
        source: 'Free5e',
      });
    }
  }
  
  return monsters;
}

/**
 * Main parsing function
 */
async function parseFree5eFiles(options: ParseOptions) {
  const { inputDir, outputDir } = options;
  
  // Find extracted text files
  const textFiles = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('-extracted.txt'))
    .map(f => path.join(inputDir, f));
  
  if (textFiles.length === 0) {
    console.log('No extracted text files found. Run extract-free5e-data.ps1 first.');
    return;
  }
  
  const allItems: Array<Record<string, unknown>> = [];
  const allSpells: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  
  for (const textFile of textFiles) {
    console.log(`Processing: ${path.basename(textFile)}`);
    const text = fs.readFileSync(textFile, 'utf-8');
    
    // Determine file type and parse accordingly
    if (textFile.includes('Characters_Codex')) {
      const items = parseItems(text);
      const spells = parseSpells(text);
      allItems.push(...items);
      allSpells.push(...spells);
      console.log(`  Extracted ${items.length} items, ${spells.length} spells`);
    } else if (textFile.includes('Monstrous_Manuscript')) {
      const monsters = parseMonsters(text);
      allMonsters.push(...monsters);
      console.log(`  Extracted ${monsters.length} monsters`);
    }
  }
  
  // Save parsed data
  if (allItems.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'items.json'),
      JSON.stringify(allItems, null, 2)
    );
    console.log(`\nSaved ${allItems.length} items to items.json`);
  }
  
  if (allSpells.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'spells.json'),
      JSON.stringify(allSpells, null, 2)
    );
    console.log(`Saved ${allSpells.length} spells to spells.json`);
  }
  
  if (allMonsters.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'monsters.json'),
      JSON.stringify(allMonsters, null, 2)
    );
    console.log(`Saved ${allMonsters.length} monsters to monsters.json`);
  }
}

// Run if called directly
if (require.main === module) {
  const inputDir = process.argv[2] || 'data/free5e/processed';
  const outputDir = process.argv[3] || 'data/free5e/processed';
  
  parseFree5eFiles({ inputDir, outputDir }).catch(console.error);
}

export { parseFree5eFiles, parseItems, parseSpells, parseMonsters };


