/**
 * Free5e Markdown Parser
 * Parses Free5e markdown files into structured JSON data
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParseOptions {
  inputDir: string;
  outputDir: string;
}

/**
 * Parse spells from Characters Codex markdown
 */
function parseSpellsFromMarkdown(text: string): Array<Record<string, unknown>> {
  const spells: Array<Record<string, unknown>> = [];
  
  // Look for "Spell Descriptions" section - match until next ## header that doesn't start with "Spell"
  const spellSectionMatch = text.match(/##\s+Spell\s+Descriptions[\s\S]*?(?=\n##\s+(?!Spell)|$)/i);
  if (!spellSectionMatch) {
    console.log('  Warning: Spell Descriptions section not found');
    return spells;
  }
  
  const spellSection = spellSectionMatch[0];
  console.log(`  Found Spell Descriptions section (${spellSection.length} chars)`);
  
  // Spells start with #### Spell Name
  // Use a simpler approach: find all #### headers, then extract the block after each
  const spellHeaderPattern = /\n####\s+([A-Z][^\n]+?)\s*\n/g;
  const spellHeaders: Array<{ name: string; index: number }> = [];
  
  let headerMatch;
  while ((headerMatch = spellHeaderPattern.exec(spellSection)) !== null) {
    const spellName = headerMatch[1].trim();
    // Skip section headers
    if (!spellName.match(/^(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z)$/)) {
      spellHeaders.push({ name: spellName, index: headerMatch.index + headerMatch[0].length });
    }
  }
  
  console.log(`  Found ${spellHeaders.length} spell headers`);
  
  // Extract each spell block
  for (let i = 0; i < spellHeaders.length; i++) {
    const header = spellHeaders[i];
    const nextHeader = i < spellHeaders.length - 1 ? spellHeaders[i + 1].index : spellSection.length;
    const spellBlock = spellSection.substring(header.index, nextHeader);
    
    // Extract spell properties from block
    const levelSchoolMatch = spellBlock.match(/_\s*([^\n]+?)_/);
    if (!levelSchoolMatch) continue;
    
    const levelSchool = levelSchoolMatch[1].trim();
    // Match each field value - fields end with backslash-escaped newlines (\)
    // Pattern: **Field:** value\ (backslash escapes the newline)
    // We want to capture just the value, stopping before the backslash and newline
    const castingTimeMatch = spellBlock.match(/\*\*Casting\s+Time:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/);
    const rangeMatch = spellBlock.match(/\*\*Range:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/);
    const componentsMatch = spellBlock.match(/\*\*Components:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/);
    const durationMatch = spellBlock.match(/\*\*Duration:\*\*\s+([^\\\n]+?)(?:\n|$)/);
    
    if (!castingTimeMatch || !rangeMatch || !componentsMatch || !durationMatch) continue;
    
    // Parse level and school
    let level = 0;
    let school = 'evocation';
    let ritual = false;
    
    if (levelSchool.toLowerCase().includes('cantrip')) {
      level = 0;
      const schoolMatch = levelSchool.match(/(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
      if (schoolMatch) school = schoolMatch[1].toLowerCase();
    } else {
      const levelMatch = levelSchool.match(/(\d+)(?:st|nd|rd|th)?-level/i);
      if (levelMatch) level = parseInt(levelMatch[1]);
      const schoolMatch = levelSchool.match(/(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
      if (schoolMatch) school = schoolMatch[1].toLowerCase();
    }
    
    if (levelSchool.toLowerCase().includes('ritual')) ritual = true;
    
    // Extract description (everything after Duration until next spell or section)
    // Find the end of the Duration line (may have escaped line break)
    const durationEnd = durationMatch.index! + durationMatch[0].length;
    // Skip past any escaped line breaks and blank lines
    let descStart = durationEnd;
    while (descStart < spellBlock.length && (spellBlock[descStart] === '\n' || spellBlock[descStart] === '\\' || spellBlock[descStart] === ' ')) {
        descStart++;
    }
    let description = spellBlock.substring(descStart).trim();
    // Remove "At Higher Levels" section for separate field
    const higherLevelMatch = description.match(/\*\*At\s+Higher\s+Levels\.?\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/i);
    const higherLevel = higherLevelMatch ? higherLevelMatch[0].replace(/\*\*At\s+Higher\s+Levels\.?\*\*\s*/i, '').trim() : undefined;
    if (higherLevelMatch) {
      description = description.substring(0, higherLevelMatch.index).trim();
    }
    
    // Parse components
    const { components: parsedComponents, material_components } = parseSpellComponents(componentsMatch[1].trim());
    
    if (description.length > 20) {
      spells.push({
        name: header.name,
        level: level,
        school: school,
        casting_time: castingTimeMatch[1].trim().replace(/\\/g, ''),
        range: rangeMatch[1].trim().replace(/\\/g, ''),
        components: parsedComponents,
        material_components: material_components,
        duration: durationMatch[1].trim().replace(/\\/g, ''),
        description: description.substring(0, 2000),
        higher_level: higherLevel ? higherLevel.substring(0, 500) : undefined,
        ritual: ritual,
        concentration: durationMatch[1].toLowerCase().includes('concentration'),
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
 * Parse monsters from Monstrous Manuscript markdown
 */
function parseMonstersFromMarkdown(text: string): Array<Record<string, unknown>> {
  const monsters: Array<Record<string, unknown>> = [];
  
  // Monster entries start with ## Monster Name
  // Then have: Challenge X, Size Type, AC, HP, Speed, Stats, etc.
  // More flexible pattern to handle variations and blank lines
  const monsterPattern = /^##\s+([A-Z][^\n]+?)\s*\n\s*Challenge\s+([\d./]+)\s*\n\s*([^\n]+)\s*\n\s*\*\*AC\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*HP\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*Speed\s+\*\*\s*([^\n]+)\s*\n/gm;
  
  let match;
  while ((match = monsterPattern.exec(text)) !== null) {
    const monsterName = match[1].trim();
    
    // Skip variant entries (they start with ###)
    if (monsterName.length > 100) {
      continue;
    }
    
    const crStr = match[2].trim();
    const sizeType = match[3].trim();
    const ac = parseInt(match[4]);
    const acType = match[5] || undefined;
    const hp = parseInt(match[6]);
    const hitDice = match[7] || undefined;
    const speedStr = match[8].trim();
    
    // Parse size and type
    const sizeTypeMatch = sizeType.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan|Titanic)\s+([^\n]+)/i);
    const size = sizeTypeMatch ? sizeTypeMatch[1] : 'Medium';
    const type = sizeTypeMatch ? sizeTypeMatch[2].trim().toLowerCase() : 'beast';
    
    // Parse challenge rating (handle fractions like "1/2", "1/4")
    let cr = 0;
    if (crStr.includes('/')) {
      const parts = crStr.split('/');
      cr = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else {
      cr = parseFloat(crStr);
    }
    
    // Parse speed
    const speed: Record<string, number | string> = {};
    const speedParts = speedStr.split(',').map(s => s.trim());
    for (const part of speedParts) {
      const speedMatch = part.match(/(\w+)[:\s]+(\d+)/i);
      if (speedMatch) {
        speed[speedMatch[1].toLowerCase()] = parseInt(speedMatch[2]);
      } else {
        const numMatch = part.match(/(\d+)/);
        if (numMatch) {
          speed.walk = parseInt(numMatch[1]);
        }
      }
    }
    if (!speed.walk) speed.walk = 30;
    
    // Extract the monster block (from this match to next ## or end)
    const blockStart = match.index;
    const nextMonster = text.indexOf('\n## ', blockStart + match[0].length);
    const blockEnd = nextMonster > 0 ? nextMonster : blockStart + 5000;
    const monsterBlock = text.substring(blockStart, blockEnd);
    
    // Parse ability scores - look for table format: Strength	Dexterity	Constitution	Intelligence	Wisdom	Charisma
    // Then values like: 12 (+1) 12 (+1) 10 (+0) 1 (–5) 10 (+0) 1 (–5)
    const statsLineMatch = monsterBlock.match(/Strength[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)[\s\S]{0,200}?(\d+)\s*\([+-]?\d+\)/i);
    
    let str = 10, dex = 10, con = 10, int = 10, wis = 10, cha = 10;
    if (statsLineMatch) {
      str = parseInt(statsLineMatch[1]) || 10;
      dex = parseInt(statsLineMatch[2]) || 10;
      con = parseInt(statsLineMatch[3]) || 10;
      int = parseInt(statsLineMatch[4]) || 10;
      wis = parseInt(statsLineMatch[5]) || 10;
      cha = parseInt(statsLineMatch[6]) || 10;
    } else {
      // Fallback: try individual matches
      const strMatch = monsterBlock.match(/(?:Strength|STR)[:\s]+(\d+)/i);
      const dexMatch = monsterBlock.match(/(?:Dexterity|DEX)[:\s]+(\d+)/i);
      const conMatch = monsterBlock.match(/(?:Constitution|CON)[:\s]+(\d+)/i);
      const intMatch = monsterBlock.match(/(?:Intelligence|INT)[:\s]+(\d+)/i);
      const wisMatch = monsterBlock.match(/(?:Wisdom|WIS)[:\s]+(\d+)/i);
      const chaMatch = monsterBlock.match(/(?:Charisma|CHA)[:\s]+(\d+)/i);
      
      str = strMatch ? parseInt(strMatch[1]) : 10;
      dex = dexMatch ? parseInt(dexMatch[1]) : 10;
      con = conMatch ? parseInt(conMatch[1]) : 10;
      int = intMatch ? parseInt(intMatch[1]) : 10;
      wis = wisMatch ? parseInt(wisMatch[1]) : 10;
      cha = chaMatch ? parseInt(chaMatch[1]) : 10;
    }
    
    // Extract alignment (usually after type or in description)
    const alignmentMatch = monsterBlock.match(/\*\*Alignment\*\*\s+([^\n]+)/i) ||
                          monsterBlock.match(/(lawful\s+(good|neutral|evil)|chaotic\s+(good|neutral|evil)|neutral\s+(good|evil)?|unaligned)/i);
    const alignment = alignmentMatch ? alignmentMatch[0].trim() : 'unaligned';
    
    // Extract senses and languages
    const sensesMatch = monsterBlock.match(/\*\*Senses\*\*\s+([^\n]+)/i);
    const languagesMatch = monsterBlock.match(/\*\*Languages\*\*\s+([^\n]+)/i);
    
    // Extract traits (look for **Trait Name.** format)
    const traits: Array<{ name: string; description: string }> = [];
    const traitPattern = /\*\*([^*]+?)\*\*\.\s+([^\n]+(?:\n(?!\*\*|\n##|\n###)[^\n]+)*)/g;
    let traitMatch;
    while ((traitMatch = traitPattern.exec(monsterBlock)) !== null) {
      const traitName = traitMatch[1].trim();
      // Skip if it's a section header (Actions, Reactions, etc.)
      if (!traitName.match(/^(Actions?|Reactions?|Legendary Actions?|Bonus Actions?|Combat)$/i)) {
        traits.push({
          name: traitName,
          description: traitMatch[2].trim().substring(0, 500),
        });
      }
    }
    
    // Extract actions (look for ###### Actions section)
    const actionsSection = monsterBlock.match(/######\s+Actions?\s*\n([\s\S]*?)(?=######|##|$)/i);
    const actions: Array<{ name: string; description: string }> = [];
    if (actionsSection) {
      const actionPattern = /\*\*([^*]+?)\*\*\.?\s+([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
      let actionMatch;
      while ((actionMatch = actionPattern.exec(actionsSection[1])) !== null) {
        actions.push({
          name: actionMatch[1].trim(),
          description: actionMatch[2].trim().substring(0, 500),
        });
      }
    }
    
    monsters.push({
      name: monsterName,
      size: size,
      type: type,
      alignment: alignment,
      armor_class: ac,
      armor_class_type: acType,
      hit_points: hp,
      hit_dice: hitDice || `${Math.ceil(hp / 4.5)}d8`,
      speed: speed,
      stats: {
        str: str,
        dex: dex,
        con: con,
        int: int,
        wis: wis,
        cha: cha,
      },
      senses: sensesMatch ? sensesMatch[1].trim() : undefined,
      languages: languagesMatch ? languagesMatch[1].trim() : undefined,
      challenge_rating: cr,
      traits: traits.length > 0 ? traits : undefined,
      actions: actions.length > 0 ? actions : undefined,
      source: 'Free5e',
    });
  }
  
  return monsters;
}

/**
 * Parse items from Characters Codex markdown
 */
function parseItemsFromMarkdown(text: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Look for equipment/items section
  const equipmentSectionMatch = text.match(/##+\s+Equipment[\s\S]*?(?=##+\s+[^#]|$)/i);
  if (!equipmentSectionMatch) {
    return items;
  }
  
  const equipmentSection = equipmentSectionMatch[0];
  
  // Items are often listed in tables or as bullet points
  // Look for item names followed by details
  const itemPattern = /(?:^|\n)(?:#{3,4}|\*{1,2})\s*([A-Z][^\n]+?)(?:\s*\{[^}]+\})?\s*\n(?:[^\n]*cost[^\n]*\n)?([\s\S]{0,500}?)(?=\n(?:#{1,4}|\*{1,2})\s*[A-Z]|$)/gi;
  
  let match;
  while ((match = itemPattern.exec(equipmentSection)) !== null) {
    const itemName = match[1].trim();
    const itemText = match[2].trim();
    
    // Skip if it's clearly not an item
    if (itemName.length > 100 || 
        itemName.includes('Table') || 
        itemName.includes('Chapter') ||
        itemName.includes('Equipment') ||
        itemText.length < 10) {
      continue;
    }
    
    // Extract properties
    const costMatch = itemText.match(/(?:cost|price)[:\s]+([\d,]+)\s*(?:gp|gold)/i);
    const weightMatch = itemText.match(/(?:weight)[:\s]+([\d.]+)\s*(?:lb|pounds?)/i);
    const rarityMatch = itemText.match(/(?:rarity)[:\s]+(common|uncommon|rare|very\s+rare|legendary)/i);
    
    // Infer kind from name and description
    const kind = inferItemKind(itemName, itemText);
    
    if (itemName && itemText.length > 10) {
      items.push({
        name: itemName,
        kind: kind,
        cost_gp: costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : undefined,
        weight_lb: weightMatch ? parseFloat(weightMatch[1]) : undefined,
        rarity: rarityMatch ? rarityMatch[1].toLowerCase().replace(/\s+/g, '_') : undefined,
        description: itemText.substring(0, 1000),
        source: 'Free5e',
      });
    }
  }
  
  return items;
}

/**
 * Infer item kind
 */
function inferItemKind(name: string, description: string): string {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('sword') || lowerName.includes('axe') || lowerName.includes('mace') || 
      lowerName.includes('dagger') || lowerName.includes('bow') || lowerName.includes('crossbow') ||
      lowerName.includes('spear') || lowerName.includes('halberd') || lowerName.includes('whip')) {
    return 'weapon';
  }
  if (lowerName.includes('armor') || lowerName.includes('mail') || lowerName.includes('plate') ||
      lowerName.includes('leather') || lowerName.includes('shield') || lowerName.includes('chain')) {
    return 'armor';
  }
  if (lowerDesc.includes('magic') || lowerDesc.includes('enchanted') || lowerDesc.includes('magical') ||
      lowerName.includes('wand') || lowerName.includes('staff') || lowerName.includes('ring') ||
      lowerName.includes('amulet') || lowerName.includes('cloak')) {
    return 'magic_item';
  }
  if (lowerName.includes('potion') || lowerName.includes('scroll') || lowerName.includes('elixir')) {
    return 'consumable';
  }
  if (lowerName.includes('tool') || lowerName.includes('kit') || lowerName.includes('instrument') ||
      lowerName.includes('hammer') || lowerName.includes('chisel')) {
    return 'tool';
  }
  
  return 'other';
}

/**
 * Main parsing function
 */
async function parseFree5eMarkdownFiles(options: ParseOptions) {
  const { inputDir, outputDir } = options;
  
  console.log(`\n=== Free5e Markdown Parser ===\n`);
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  // Find markdown files
  const markdownFiles = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.md') && (f.includes('Characters_Codex') || f.includes('Monstrous_Manuscript')))
    .map(f => path.join(inputDir, f));
  
  if (markdownFiles.length === 0) {
    console.log('No Free5e markdown files found.');
    return;
  }
  
  const allItems: Array<Record<string, unknown>> = [];
  const allSpells: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  
  for (const mdFile of markdownFiles) {
    console.log(`Processing: ${path.basename(mdFile)}`);
    const text = fs.readFileSync(mdFile, 'utf-8');
    
    if (mdFile.includes('Characters_Codex')) {
      console.log('  Extracting items and spells...');
      const items = parseItemsFromMarkdown(text);
      const spells = parseSpellsFromMarkdown(text);
      allItems.push(...items);
      allSpells.push(...spells);
      console.log(`  Found ${items.length} items, ${spells.length} spells`);
    } else if (mdFile.includes('Monstrous_Manuscript')) {
      console.log('  Extracting monsters...');
      const monsters = parseMonstersFromMarkdown(text);
      allMonsters.push(...monsters);
      console.log(`  Found ${monsters.length} monsters`);
    }
  }
  
  // Save parsed data
  if (allItems.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'items.json'),
      JSON.stringify(allItems, null, 2)
    );
    console.log(`\n✓ Saved ${allItems.length} items to items.json`);
  }
  
  if (allSpells.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'spells.json'),
      JSON.stringify(allSpells, null, 2)
    );
    console.log(`✓ Saved ${allSpells.length} spells to spells.json`);
  }
  
  if (allMonsters.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'monsters.json'),
      JSON.stringify(allMonsters, null, 2)
    );
    console.log(`✓ Saved ${allMonsters.length} monsters to monsters.json`);
  }
  
  console.log(`\n=== Parsing Complete ===\n`);
}

// Run if called directly
if (require.main === module) {
  const inputDir = process.argv[2] || path.join(process.cwd(), 'Downloads');
  const outputDir = process.argv[3] || path.join(process.cwd(), 'data/free5e/processed');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  parseFree5eMarkdownFiles({ inputDir, outputDir }).catch(console.error);
}

export { parseFree5eMarkdownFiles, parseSpellsFromMarkdown, parseMonstersFromMarkdown, parseItemsFromMarkdown };

