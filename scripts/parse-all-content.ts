/**
 * Comprehensive Content Parser
 * Scans Downloads folder recursively, extracts content from PDFs, markdown, text files
 * Parses spells, items, monsters, and other content
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParseOptions {
  inputDir: string;
  outputDir: string;
  recursive?: boolean;
}

interface ContentStats {
  spells: number;
  items: number;
  monsters: number;
  filesProcessed: number;
  filesSkipped: number;
  errors: number;
}

// Lazy load pdf-parse - it's an ES module, use dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParseFn: any = null;
async function loadPdfParse() {
  if (!pdfParseFn) {
    try {
      // pdf-parse is an ES module, use dynamic import
      const pdfModule = await import('pdf-parse');
      // The module exports PDFParse class, but we need the default export
      // pdf-parse module structure varies, handle both default and named exports
      const moduleWithDefault = pdfModule as { default?: unknown; [key: string]: unknown };
      pdfParseFn = (moduleWithDefault.default || pdfModule) as typeof pdfParseFn;
    } catch (error) {
      // Fallback to require for CommonJS compatibility
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfModule = require('pdf-parse');
        // Try PDFParse class if module is not callable
        if (typeof pdfModule === 'function') {
          pdfParseFn = pdfModule;
        } else if (pdfModule.PDFParse && typeof pdfModule.PDFParse === 'function') {
          // Use PDFParse class - might need instantiation
          pdfParseFn = pdfModule.PDFParse;
        } else {
          pdfParseFn = pdfModule;
        }
      } catch (requireError) {
        console.error(`Failed to load pdf-parse: ${requireError}`);
        throw requireError;
      }
    }
  }
  return pdfParseFn;
}

/**
 * Extract text from PDF file
 */
async function extractPDFText(filePath: string): Promise<string> {
  try {
    const pdfParse = await loadPdfParse();
    const dataBuffer = fs.readFileSync(filePath);
    
    // Try calling directly first
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else {
      // If it's a class, might need instantiation - but pdf-parse should be callable
      console.error(`  pdf-parse is not a function, type: ${typeof pdfParse}`);
      return '';
    }
  } catch (error) {
    console.error(`  ERROR extracting PDF ${path.basename(filePath)}: ${error}`);
    return '';
  }
}

/**
 * Extract text from file based on extension
 */
async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    // PDF extraction - try to use pdf-parse, but skip if it fails
    try {
      return await extractPDFText(filePath);
    } catch (error) {
      console.log(`  Skipping PDF (extraction not available): ${path.basename(filePath)}`);
      return '';
    }
  } else if (ext === '.md' || ext === '.txt' || ext === '.html') {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    console.log(`  Skipping unsupported file type: ${ext}`);
    return '';
  }
}

/**
 * Parse spells from text (enhanced pattern matching)
 */
function parseSpellsFromText(text: string, source: string): Array<Record<string, unknown>> {
  const spells: Array<Record<string, unknown>> = [];
  
  // Multiple spell patterns to catch different formats
  const patterns = [
    // Pattern 1: #### Spell Name\n_Level School_\n**Casting Time:** ... (Free5e format)
    /####\s+([A-Z][^\n]+?)\s*\n\s*_([^\n]+?)_\s*\n\s*\*\*Casting\s+Time:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/gi,
    // Pattern 2: Spell Name (Level School)\nCasting Time: ... (alternative format)
    /^([A-Z][^\n]+?)\s*\((\d+)(?:st|nd|rd|th)?-level\s+([^\n)]+?)\)\s*\n\s*Casting\s+Time:\s+([^\n]+)/gim,
    // Pattern 3: **Spell Name**\nLevel: X School\n...
    /\*\*([A-Z][^\n]+?)\*\*\s*\n\s*Level:\s*(\d+)\s+([^\n]+?)\s*\n/gim,
  ];
  
  // Try each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const name = match[1]?.trim();
        if (!name || name.length < 2) continue;
        
        // Extract level and school
        let level = 0;
        let school = 'evocation';
        
        if (match[2] && match[3]) {
          // Pattern 1 or 2
          const levelSchool = match[2] || match[3];
          if (levelSchool.toLowerCase().includes('cantrip')) {
            level = 0;
          } else {
            const levelMatch = levelSchool.match(/(\d+)/);
            if (levelMatch) level = parseInt(levelMatch[1]);
          }
          const schoolMatch = levelSchool.match(/(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
          if (schoolMatch) school = schoolMatch[1].toLowerCase();
        }
        
        // Extract other properties (simplified - would need more robust parsing)
        const castingTimeMatch = text.substring(match.index).match(/\*\*Casting\s+Time:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i) ||
                                 text.substring(match.index).match(/Casting\s+Time:\s+([^\n]+)/i);
        const rangeMatch = text.substring(match.index).match(/\*\*Range:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i) ||
                          text.substring(match.index).match(/Range:\s+([^\n]+)/i);
        const componentsMatch = text.substring(match.index).match(/\*\*Components:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i) ||
                               text.substring(match.index).match(/Components:\s+([^\n]+)/i);
        const durationMatch = text.substring(match.index).match(/\*\*Duration:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i) ||
                             text.substring(match.index).match(/Duration:\s+([^\n]+)/i);
        
        // Extract description (everything after duration until next spell or section)
        let description = '';
        const descStart = durationMatch ? (match.index + (durationMatch.index || 0) + durationMatch[0].length) : match.index + match[0].length;
        const nextSpell = text.substring(descStart).search(/\n(?:####|##|\*\*)[A-Z]/);
        if (nextSpell > 0) {
          description = text.substring(descStart, descStart + nextSpell).trim();
        } else {
          description = text.substring(descStart, descStart + 500).trim();
        }
        
        if (description.length > 20) {
          spells.push({
            name: name,
            level: level,
            school: school,
            casting_time: castingTimeMatch?.[1]?.trim() || '1 action',
            range: rangeMatch?.[1]?.trim() || 'Self',
            components: componentsMatch?.[1]?.trim() || 'V',
            duration: durationMatch?.[1]?.trim() || 'Instantaneous',
            description: description.substring(0, 2000),
            ritual: description.toLowerCase().includes('ritual'),
            concentration: (durationMatch?.[1] || '').toLowerCase().includes('concentration'),
            source: source,
          });
        }
      } catch (error) {
        // Skip malformed entries
        continue;
      }
    }
  }
  
  return spells;
}

/**
 * Parse items from text
 */
function parseItemsFromText(text: string, source: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Pattern for items: Name, cost, weight, description
  // Multiple formats possible
  const patterns = [
    // Format 1: **Item Name**\nCost: X gp\nWeight: Y lb\n...
    /\*\*([A-Z][^\n]+?)\*\*\s*\n\s*(?:Cost|Price):\s*([^\n]+?)\s*(?:gp|GP)?\s*\n\s*Weight:\s*([^\n]+?)\s*(?:lb|LB)?/gi,
    // Format 2: Item Name (X gp, Y lb)
    /([A-Z][^\n]+?)\s*\(([^)]+?gp[^)]*?)\)/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const name = match[1]?.trim();
        if (!name || name.length < 2) continue;
        
        // Extract cost and weight
        let cost_gp: number | null = null;
        let weight_lb: number | null = null;
        
        if (match[2]) {
          const costMatch = match[2].match(/([\d.]+)\s*gp/i);
          if (costMatch) cost_gp = parseFloat(costMatch[1]);
        }
        if (match[3]) {
          const weightMatch = match[3].match(/([\d.]+)\s*lb/i);
          if (weightMatch) weight_lb = parseFloat(weightMatch[1]);
        }
        
        // Extract description
        const descStart = match.index + match[0].length;
        const nextItem = text.substring(descStart).search(/\n(?:####|##|\*\*)[A-Z]/);
        let description = '';
        if (nextItem > 0) {
          description = text.substring(descStart, descStart + nextItem).trim();
        } else {
          description = text.substring(descStart, descStart + 500).trim();
        }
        
        if (name && (cost_gp !== null || weight_lb !== null || description.length > 20)) {
          items.push({
            name: name,
            kind: inferItemKind(name, description),
            cost_gp: cost_gp,
            weight_lb: weight_lb,
            description: description.substring(0, 2000),
            source: source,
          });
        }
      } catch (error) {
        continue;
      }
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
  
  if (lowerName.match(/\b(sword|axe|mace|dagger|spear|bow|crossbow|whip|flail|halberd|rapier|scimitar)\b/)) return 'weapon';
  if (lowerName.match(/\b(armor|plate|mail|leather|shield|helmet|gauntlet)\b/)) return 'armor';
  if (lowerName.match(/\b(tool|kit|set|pack|bag|pouch|backpack)\b/)) return 'tool';
  if (lowerName.match(/\b(potion|scroll|wand|staff|ring|amulet|cloak|boots|gloves|belt)\b/)) return 'magic_item';
  if (lowerDesc.match(/\b(magical|enchanted|\+1|\+2|\+3|rare|legendary)\b/)) return 'magic_item';
  
  return 'other';
}

/**
 * Parse monsters from text (enhanced)
 */
function parseMonstersFromText(text: string, source: string): Array<Record<string, unknown>> {
  const monsters: Array<Record<string, unknown>> = [];
  
  // Pattern: ## Monster Name\nChallenge X\n...
  const pattern = /^##\s+([A-Z][^\n]+?)\s*\n\s*Challenge\s+([\d./]+)\s*\n\s*([^\n]+)\s*\n\s*\*\*AC\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*HP\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*Speed\s+\*\*\s*([^\n]+)\s*\n/gm;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name) continue;
      
      monsters.push({
        name: name,
        challenge_rating: match[2]?.trim() || '0',
        size: match[3]?.split(/\s+/)[0] || 'medium',
        type: match[3]?.split(/\s+/).slice(1).join(' ') || 'beast',
        armor_class: parseInt(match[4]) || 10,
        armor_class_type: match[5] || null,
        hit_points: parseInt(match[6]) || 1,
        hit_dice: match[7] || null,
        speed: match[8]?.trim() || '30 ft',
        source: source,
      });
    } catch (error) {
      continue;
    }
  }
  
  return monsters;
}

/**
 * Main parsing function
 */
async function parseAllContent(options: ParseOptions) {
  const { inputDir, outputDir } = options;
  
  console.log(`\n=== Comprehensive Content Parser ===\n`);
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    return;
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const stats: ContentStats = {
    spells: 0,
    items: 0,
    monsters: 0,
    filesProcessed: 0,
    filesSkipped: 0,
    errors: 0,
  };
  
  const allSpells: Array<Record<string, unknown>> = [];
  const allItems: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  
  // Find all relevant files recursively
  console.log('Scanning for content files...');
  // Start with markdown and text files (PDFs can be added later when extraction is working)
  const files = getAllFiles(inputDir, ['.md', '.txt', '.html']);
  console.log(`Found ${files.length} text/markdown files to process`);
  console.log('Note: PDF files are skipped for now (extraction needs configuration)\n');
  
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(inputDir, filePath);
    const source = path.dirname(relativePath).replace(/\\/g, '/') || 'root';
    
    // Skip certain files
    if (fileName.match(/Character Sheet|Pregen|Map|Image|\.jpg|\.png/i)) {
      stats.filesSkipped++;
      continue;
    }
    
    console.log(`Processing: ${relativePath}`);
    stats.filesProcessed++;
    
    try {
      const text = await extractTextFromFile(filePath);
      if (!text || text.length < 100) {
        console.log(`  Skipped: file too short or extraction failed`);
        stats.filesSkipped++;
        continue;
      }
      
      // Determine content type from filename/path
      const lowerName = fileName.toLowerCase();
      const lowerPath = relativePath.toLowerCase();
      
      // Parse spells
      if (lowerName.match(/spell|magic|wizard|sorcerer|cleric|druid|bard|ranger|paladin|warlock/) ||
          lowerPath.match(/spell|magic/)) {
        const spells = parseSpellsFromText(text, source);
        allSpells.push(...spells);
        stats.spells += spells.length;
        if (spells.length > 0) {
          console.log(`  Found ${spells.length} spells`);
        }
      }
      
      // Parse items
      if (lowerName.match(/item|equipment|weapon|armor|tool|treasure|trinket/) ||
          lowerPath.match(/item|equipment|weapon|armor|tool|treasure|trinket/)) {
        const items = parseItemsFromText(text, source);
        allItems.push(...items);
        stats.items += items.length;
        if (items.length > 0) {
          console.log(`  Found ${items.length} items`);
        }
      }
      
      // Parse monsters
      if (lowerName.match(/monster|creature|beast|fiend|undead|dragon|demon|devil/) ||
          lowerPath.match(/monster|creature|beast/)) {
        const monsters = parseMonstersFromText(text, source);
        allMonsters.push(...monsters);
        stats.monsters += monsters.length;
        if (monsters.length > 0) {
          console.log(`  Found ${monsters.length} monsters`);
        }
      }
      
      // Try parsing all types if file name doesn't give hints
      if (!lowerName.match(/spell|item|monster|magic|equipment|creature/)) {
        const spells = parseSpellsFromText(text, source);
        const items = parseItemsFromText(text, source);
        const monsters = parseMonstersFromText(text, source);
        
        allSpells.push(...spells);
        allItems.push(...items);
        allMonsters.push(...monsters);
        
        stats.spells += spells.length;
        stats.items += items.length;
        stats.monsters += monsters.length;
        
        if (spells.length > 0 || items.length > 0 || monsters.length > 0) {
          console.log(`  Found: ${spells.length} spells, ${items.length} items, ${monsters.length} monsters`);
        }
      }
      
    } catch (error) {
      console.error(`  ERROR processing ${fileName}: ${error}`);
      stats.errors++;
    }
  }
  
  // Remove duplicates (by name)
  const uniqueSpells = removeDuplicates(allSpells, 'name');
  const uniqueItems = removeDuplicates(allItems, 'name');
  const uniqueMonsters = removeDuplicates(allMonsters, 'name');
  
  // Save parsed data
  if (uniqueSpells.length > 0) {
    const spellsFile = path.join(outputDir, 'spells-additional.json');
    fs.writeFileSync(spellsFile, JSON.stringify(uniqueSpells, null, 2));
    console.log(`\n✓ Saved ${uniqueSpells.length} unique spells to spells-additional.json`);
  }
  
  if (uniqueItems.length > 0) {
    const itemsFile = path.join(outputDir, 'items-additional.json');
    fs.writeFileSync(itemsFile, JSON.stringify(uniqueItems, null, 2));
    console.log(`✓ Saved ${uniqueItems.length} unique items to items-additional.json`);
  }
  
  if (uniqueMonsters.length > 0) {
    const monstersFile = path.join(outputDir, 'monsters-additional.json');
    fs.writeFileSync(monstersFile, JSON.stringify(uniqueMonsters, null, 2));
    console.log(`✓ Saved ${uniqueMonsters.length} unique monsters to monsters-additional.json`);
  }
  
  // Print summary
  console.log(`\n=== Parsing Complete ===`);
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files skipped: ${stats.filesSkipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`\nTotal content found:`);
  console.log(`  Spells: ${uniqueSpells.length}`);
  console.log(`  Items: ${uniqueItems.length}`);
  console.log(`  Monsters: ${uniqueMonsters.length}`);
}

/**
 * Get all files recursively
 */
function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip certain directories
        if (!entry.name.match(/Processed|Individual Cards|Character Sheets/i)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Remove duplicates by key
 */
function removeDuplicates<T extends Record<string, unknown>>(array: T[], key: keyof T): T[] {
  const seen = new Set<string>();
  return array.filter(item => {
    const value = String(item[key] || '').toLowerCase();
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Main execution
const args = process.argv.slice(2);
const inputDir = args[0] || 'Downloads';
const outputDir = args[1] || 'data/free5e/processed';

parseAllContent({ inputDir, outputDir, recursive: true }).catch(console.error);

