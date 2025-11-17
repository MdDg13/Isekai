/**
 * Comprehensive Content Extractor
 * Extracts spells, items, monsters, puzzles, traps, and other game objects from PDFs and text files
 * Ensures all data conforms to standard format with source attribution
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractOptions {
  inputDir: string;
  outputDir: string;
  sampleSize?: number; // Number of files to sample before full extraction
}

interface ContentSummary {
  files: {
    total: number;
    pdfs: number;
    markdown: number;
    text: number;
    html: number;
  };
  estimatedContent: {
    spells: number;
    items: number;
    monsters: number;
    puzzles: number;
    traps: number;
    encounters: number;
  };
  sampleData: {
    spells: Array<Record<string, unknown>>;
    items: Array<Record<string, unknown>>;
    monsters: Array<Record<string, unknown>>;
    puzzles: Array<Record<string, unknown>>;
    traps: Array<Record<string, unknown>>;
  };
}

// PDF extraction - pdf-parse is an ES module, need to use dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParseFn: any = null;
async function getPdfParser() {
  if (!pdfParseFn) {
    try {
      // pdf-parse is an ES module, use dynamic import
      const pdfModule = await import('pdf-parse');
      // The default export should be the function
      pdfParseFn = pdfModule.default || pdfModule;
      
      // If still not a function, try to find PDFParse class
      if (typeof pdfParseFn !== 'function' && pdfModule.PDFParse) {
        const PDFParseClass = pdfModule.PDFParse;
        // Create a wrapper that uses getText() method - convert Buffer to Uint8Array
        pdfParseFn = async (buffer: Buffer | Uint8Array) => {
          const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
          const parser = new PDFParseClass(data);
          // Suppress console warnings during load
          const originalWarn = console.warn;
          console.warn = () => {}; // Suppress warnings
          try {
            await parser.load();
            const textResult = await parser.getText();
            // getText() returns a TextResult object with a text property
            return { text: textResult.text || '' };
          } finally {
            console.warn = originalWarn; // Restore warnings
          }
        };
      }
    } catch {
      // Fallback: try require for CommonJS compatibility
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfModule = require('pdf-parse');
        // Check if it's a function or has PDFParse
        if (typeof pdfModule === 'function') {
          pdfParseFn = pdfModule;
        } else if (pdfModule.PDFParse && typeof pdfModule.PDFParse === 'function') {
          const PDFParseClass = pdfModule.PDFParse;
          // Use getText() method - convert Buffer to Uint8Array
          pdfParseFn = async (buffer: Buffer | Uint8Array) => {
            const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
            const parser = new PDFParseClass(data);
            // Suppress console warnings during load
            const originalWarn = console.warn;
            console.warn = () => {}; // Suppress warnings
            try {
              await parser.load();
              const textResult = await parser.getText();
              // getText() returns a TextResult object with a text property
              return { text: textResult.text || '' };
            } finally {
              console.warn = originalWarn; // Restore warnings
            }
          };
        } else {
          throw new Error('pdf-parse module structure not recognized');
        }
      } catch (requireError) {
        console.error('Failed to load pdf-parse:', error, requireError);
        throw error;
      }
    }
  }
  return pdfParseFn;
}

/**
 * Extract text from PDF
 */
async function extractPDFText(filePath: string): Promise<string> {
  try {
    const pdfParse = await getPdfParser();
    const dataBuffer = fs.readFileSync(filePath);
    
    // Convert Buffer to Uint8Array if needed
    const data = dataBuffer instanceof Buffer ? new Uint8Array(dataBuffer) : dataBuffer;
    
    // Call the parser function
    const result = await pdfParse(data);
    return result.text || '';
  } catch (error) {
    console.error(`  ERROR extracting PDF ${path.basename(filePath)}: ${error}`);
    throw error;
  }
}

/**
 * Extract text from file based on extension
 */
async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return await extractPDFText(filePath);
  } else if (ext === '.md' || ext === '.txt' || ext === '.html') {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Standardize source path to readable format
 */
function standardizeSource(filePath: string, baseDir: string): string {
  const relative = path.relative(baseDir, filePath);
  const dir = path.dirname(relative);
  const name = path.basename(relative, path.extname(relative));
  
  // Clean up path separators and create readable source
  const cleanDir = dir.replace(/\\/g, '/').replace(/^\.\//, '');
  if (cleanDir && cleanDir !== '.') {
    return `${cleanDir}/${name}`;
  }
  return name;
}

// Known spell schools for validation
const KNOWN_SPELL_SCHOOLS = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation'
];

/**
 * Parse spells with standardized format
 */
function parseSpells(text: string, source: string): Array<Record<string, unknown>> {
  const spells: Array<Record<string, unknown>> = [];
  
  // Pattern 1: Free5e format (#### Spell Name\n_Level School_\n**Casting Time:** ...)
  // Improved: Require minimum name length and exclude common false positives
  const free5ePattern = /####\s+([A-Z][A-Za-z\s'-]{2,50}?)\s*\n\s*_([^\n]+?)_\s*\n\s*\*\*Casting\s+Time:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/gi;
  
  // Common false positive patterns to exclude
  const falsePositives = /^(Table|Chapter|Section|Appendix|Index|Contents|Spell|Spells|Level|School|Casting|Range|Components|Duration|Description)/i;
  
  let match;
  while ((match = free5ePattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      if (falsePositives.test(name)) continue; // Skip false positives
      
      const levelSchool = match[2]?.trim() || '';
      let level = 0;
      let school = 'evocation';
      
      if (levelSchool.toLowerCase().includes('cantrip')) {
        level = 0;
      } else {
        const levelMatch = levelSchool.match(/(\d+)/);
        if (levelMatch) level = parseInt(levelMatch[1]);
      }
      
      const schoolMatch = levelSchool.match(/(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
      if (schoolMatch) school = schoolMatch[1].toLowerCase();
      
      // Extract other properties
      const blockStart = match.index;
      const nextSpell = text.substring(blockStart).search(/\n####\s+[A-Z]/);
      const spellBlock = nextSpell > 0 ? text.substring(blockStart, blockStart + nextSpell) : text.substring(blockStart, blockStart + 2000);
      
      const castingTimeMatch = spellBlock.match(/\*\*Casting\s+Time:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i);
      const rangeMatch = spellBlock.match(/\*\*Range:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i);
      const componentsMatch = spellBlock.match(/\*\*Components:\*\*\s+([^\\\n]+?)(?:\\\s*\n|$)/i);
      const durationMatch = spellBlock.match(/\*\*Duration:\*\*\s+([^\\\n]+?)(?:\n|$)/i);
      
      // Extract description
      const durationEnd = durationMatch ? (spellBlock.indexOf(durationMatch[0]) + durationMatch[0].length) : match[0].length;
      let description = spellBlock.substring(durationEnd).trim();
      
      // Remove "At Higher Levels" section
      const higherLevelMatch = description.match(/\*\*At\s+Higher\s+Levels\.?\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/i);
      const higherLevel = higherLevelMatch ? higherLevelMatch[0].replace(/\*\*At\s+Higher\s+Levels\.?\*\*\s*/i, '').trim() : undefined;
      if (higherLevelMatch) {
        description = description.substring(0, higherLevelMatch.index).trim();
      }
      
      // Quality checks: require minimum description length and valid school
      if (description.length < 30) continue; // Too short, likely false positive
      if (!KNOWN_SPELL_SCHOOLS.includes(school)) continue; // Invalid school
      
      // Validate casting time format
      const castingTime = castingTimeMatch?.[1]?.trim() || '1 action';
      if (!castingTime.match(/\b(action|bonus action|reaction|minute|hour|day)\b/i)) {
        continue; // Invalid casting time format
      }
      
      spells.push({
        name: name,
        level: level,
        school: school,
        casting_time: castingTime,
        range: rangeMatch?.[1]?.trim() || 'Self',
        components: componentsMatch?.[1]?.trim() || 'V',
        duration: durationMatch?.[1]?.trim() || 'Instantaneous',
        description: description.substring(0, 2000),
        higher_level: higherLevel ? higherLevel.substring(0, 500) : null,
        ritual: levelSchool.toLowerCase().includes('ritual') || description.toLowerCase().includes('ritual'),
        concentration: (durationMatch?.[1] || '').toLowerCase().includes('concentration'),
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  return spells;
}

/**
 * Parse items with standardized format
 */
function parseItems(text: string, source: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Pattern: **Item Name**\nCost: X gp\nWeight: Y lb\n...
  // Improved: Require minimum name length and exclude false positives
  const pattern = /\*\*([A-Z][A-Za-z\s'-]{2,50}?)\*\*\s*\n\s*(?:Cost|Price)[:\s]+([^\n]+?)\s*(?:gp|GP)?/gi;
  
  // Common false positive patterns
  const falsePositives = /^(Table|Chapter|Section|Appendix|Index|Contents|Item|Items|Cost|Price|Weight|Description|Properties|Attunement)/i;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      if (falsePositives.test(name)) continue; // Skip false positives
      
      // Extract cost
      let cost_gp: number | null = null;
      const costMatch = match[2]?.match(/([\d.]+)\s*gp/i);
      if (costMatch) cost_gp = parseFloat(costMatch[1]);
      
      // Extract weight
      const weightMatch = text.substring(match.index).match(/Weight[:\s]+([^\n]+?)\s*(?:lb|LB)?/i);
      let weight_lb: number | null = null;
      if (weightMatch) {
        const weightStr = weightMatch[1].match(/([\d.]+)/);
        if (weightStr) weight_lb = parseFloat(weightStr[1]);
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
      
      // Quality checks: require at least cost, weight, or substantial description
      const finalDescription = description;
      if (finalDescription.length < 15 && cost_gp === null && weight_lb === null) continue; // Too little data
      
      // Validate cost if present
      if (cost_gp !== null && (isNaN(cost_gp) || cost_gp < 0 || cost_gp > 1000000)) continue;
      
      // Validate weight if present
      if (weight_lb !== null && (isNaN(weight_lb) || weight_lb < 0 || weight_lb > 10000)) continue;
      
      items.push({
        name: name,
        kind: inferItemKind(name, finalDescription),
        cost_gp: cost_gp,
        weight_lb: weight_lb,
        description: finalDescription.substring(0, 2000),
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  return items;
}

/**
 * Parse monsters with standardized format
 */
function parseMonsters(text: string, source: string): Array<Record<string, unknown>> {
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
    } catch {
      continue;
    }
  }
  
  return monsters;
}

/**
 * Parse puzzles with standardized format
 */
function parsePuzzles(text: string, source: string): Array<Record<string, unknown>> {
  const puzzles: Array<Record<string, unknown>> = [];
  
  // Pattern 1: Tasha's Cauldron format - ## Puzzle Name with structured sections
  // Improved: More specific pattern
  const tashaPuzzlePattern = /##\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*Difficulty\.\s*([^\n]+)/gi;
  
  // Common false positive patterns - expanded to catch short words
  const falsePositives = /^(Table|Chapter|Section|Appendix|Index|Contents|Puzzle|Puzzles|Difficulty|Solution|Features|to|or|is|not|the|and|a|an|in|on|at|for|of|with|by)$/i;
  
  // Common short words that are likely false positives
  const shortWords = /^(to|or|is|not|the|and|a|an|in|on|at|for|of|with|by|it|as|be|we|he|so|if|up|do|go|my|me|no|oh|ok|hi|ok)$/i;
  
  let match;
  while ((match = tashaPuzzlePattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 5) continue;
      if (falsePositives.test(name)) continue; // Skip false positives
      if (shortWords.test(name)) continue; // Skip common short words
      
      // Extract full puzzle block
      const blockStart = match.index;
      const nextPuzzle = text.substring(blockStart + match[0].length).search(/\n##\s+[A-Z]/);
      const blockEnd = nextPuzzle > 0 ? blockStart + match[0].length + nextPuzzle : blockStart + match[0].length + 2000;
      const description = text.substring(blockStart, blockEnd).trim();
      
      // Extract structured sections
      const difficultyMatch = description.match(/Difficulty\.\s*([^\n]+)/i);
      const featuresMatch = description.match(/Puzzle\s+Features\.\s*([^\n]+(?:\n(?!Solution\.)[^\n]+)*)/i);
      const solutionMatch = description.match(/Solution\.\s*([^\n]+(?:\n(?!Hint\s+Checks\.)[^\n]+)*)/i);
      const hintsMatch = description.match(/Hint\s+Checks\.\s*([^\n]+(?:\n(?!Customizing)[^\n]+)*)/i);
      
      // Quality checks: require minimum description length
      if (description.length < 60) continue; // Too short, likely false positive
      
      // Validate difficulty
      const difficulty = difficultyMatch ? difficultyMatch[1].trim().toLowerCase() : inferDifficulty(description);
      if (!['easy', 'medium', 'hard'].includes(difficulty)) continue; // Invalid difficulty
      
      puzzles.push({
        name: name,
        description: description.substring(0, 2000),
        difficulty: difficulty,
        puzzle_features: featuresMatch ? featuresMatch[1].trim() : null,
        solution: solutionMatch ? solutionMatch[1].trim() : extractSolution(description),
        hint_checks: hintsMatch ? hintsMatch[1].trim() : null,
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  // Pattern 2: Generic puzzle format
  const genericPuzzlePattern = /(?:##\s+|\*\*)([A-Z][^\n*]+?)(?:\*\*)?\s*(?:Puzzle|Riddle|Challenge)/gi;
  while ((match = genericPuzzlePattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Skip if already found
      if (puzzles.some(p => p.name === name)) continue;
      
      const descStart = match.index + match[0].length;
      const nextPuzzle = text.substring(descStart).search(/\n(?:##|\*\*)[A-Z]/);
      let description = '';
      if (nextPuzzle > 0) {
        description = text.substring(descStart, descStart + nextPuzzle).trim();
      } else {
        description = text.substring(descStart, descStart + 1000).trim();
      }
      
      if (description.length > 30) {
        puzzles.push({
          name: name,
          description: description.substring(0, 2000),
          difficulty: inferDifficulty(description),
          solution: extractSolution(description),
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return puzzles;
}

/**
 * Parse traps with standardized format
 */
function parseTraps(text: string, source: string): Array<Record<string, unknown>> {
  const traps: Array<Record<string, unknown>> = [];
  
  // Pattern 1: "The [Trap Name] Trap\nsimple trap (level X-Y, threat level)"
  // This is the DeviousTraps format - must be followed by "simple trap"
  // Improved: More specific pattern to reduce false positives
  const deviousTrapPattern = /(The\s+[A-Z][A-Za-z\s'-]{3,40}?\s+Trap)\s*\n\s*simple\s+trap\s*\([^)]+\)/gi;
  
  // Common false positive patterns
  const falsePositives = /^(The\s+Traps?\s*$|The\s+[A-Z]\s+Trap$)/i;
  
  let match;
  while ((match = deviousTrapPattern.exec(text)) !== null) {
    try {
      let name = match[1]?.trim();
      if (!name || name.length < 8) continue; // Must be at least "The X Trap"
      if (falsePositives.test(name)) continue; // Skip false positives
      
      // Clean up name - remove section headers like "The Traps\n"
      name = name.replace(/^The\s+Traps\s*\n\s*/i, '');
      name = name.replace(/\n/g, ' ').trim();
      
      // Extract the full trap block
      const blockStart = match.index;
      // Look for next trap or section header
      const nextTrap = text.substring(blockStart + match[0].length).search(/(?:The\s+[A-Z][^\n]+?\s+Trap|##\s+[A-Z]|\n\n\n)/);
      const blockEnd = nextTrap > 0 ? blockStart + match[0].length + nextTrap : blockStart + match[0].length + 2000;
      const description = text.substring(blockStart, blockEnd).trim();
      
      // Extract structured sections
      const triggerMatch = description.match(/Trigger\.\s*([^\n]+(?:\n(?!Effect\.)[^\n]+)*)/i);
      const effectMatch = description.match(/Effect\.\s*([^\n]+(?:\n(?!Countermeasures\.)[^\n]+)*)/i);
      const countermeasuresMatch = description.match(/Countermeasures\.\s*([^\n]+(?:\n(?!Special\.)[^\n]+)*)/i);
      const specialMatch = description.match(/Special\.\s*([^\n]+(?:\n(?!The\s+[A-Z]|##)[^\n]+)*)/i);
      
      // Extract DC and damage
      const dcMatch = description.match(/DC\s+(\d+)/i);
      const damageMatch = description.match(/(\d+d\d+[^\n]*damage)/i);
      
      // Extract level range and threat level
      const levelMatch = description.match(/level\s+(\d+)-(\d+)/i);
      const threatMatch = description.match(/(setback|dangerous|deadly)\s+threat/i);
      
      // Quality checks: require minimum description length
      if (description.length < 60) continue; // Too short, likely false positive
      
      // Validate DC if present
      const dc = dcMatch ? parseInt(dcMatch[1]) : null;
      if (dc !== null && (isNaN(dc) || dc < 1 || dc > 30)) continue; // Invalid DC
      
      // Validate threat level if present
      const threat = threatMatch ? threatMatch[1].toLowerCase() : null;
      if (threat && !['setback', 'dangerous', 'deadly'].includes(threat)) continue;
      
      traps.push({
        name: name,
        description: description.substring(0, 2000),
        trigger: triggerMatch ? triggerMatch[1].trim() : null,
        effect: effectMatch ? effectMatch[1].trim() : null,
        countermeasures: countermeasuresMatch ? countermeasuresMatch[1].trim() : null,
        special: specialMatch ? specialMatch[1].trim() : null,
        difficulty_class: dc,
        damage: damageMatch ? damageMatch[1] : null,
        level_range: levelMatch ? `${levelMatch[1]}-${levelMatch[2]}` : null,
        threat_level: threat,
        difficulty: inferDifficulty(description),
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  // Pattern 2: Standard trap format from rulebooks (## Trap Name or **Trap Name**)
  const standardTrapPattern = /(?:##\s+|\*\*)([A-Z][^\n*]+?)(?:\*\*)?\s*(?:Trap|Hazard)/gi;
  while ((match = standardTrapPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Skip if we already found this trap
      if (traps.some(t => t.name === name)) continue;
      
      const descStart = match.index + match[0].length;
      const nextTrap = text.substring(descStart).search(/\n(?:##|\*\*)[A-Z]/);
      let description = '';
      if (nextTrap > 0) {
        description = text.substring(descStart, descStart + nextTrap).trim();
      } else {
        description = text.substring(descStart, descStart + 1000).trim();
      }
      
      const dcMatch = description.match(/DC\s+(\d+)/i);
      const damageMatch = description.match(/(\d+d\d+[^\n]*damage)/i);
      
      if (description.length > 30) {
        traps.push({
          name: name,
          description: description.substring(0, 2000),
          difficulty_class: dcMatch ? parseInt(dcMatch[1]) : null,
          damage: damageMatch ? damageMatch[1] : null,
          difficulty: inferDifficulty(description),
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return traps;
}

/**
 * Helper: Infer item kind
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
 * Helper: Infer difficulty from description
 */
function inferDifficulty(description: string): string {
  const lower = description.toLowerCase();
  if (lower.match(/\b(easy|simple|basic)\b/)) return 'easy';
  if (lower.match(/\b(hard|difficult|complex|deadly)\b/)) return 'hard';
  if (lower.match(/\b(medium|moderate|average)\b/)) return 'medium';
  return 'medium';
}

/**
 * Helper: Extract solution from puzzle description
 */
function extractSolution(description: string): string | null {
  const solutionMatch = description.match(/\*\*Solution:\*\*\s*([^\n]+)/i) ||
                       description.match(/Solution[:\s]+([^\n]+)/i);
  return solutionMatch ? solutionMatch[1].trim() : null;
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
 * Generate summary of available data
 */
async function generateSummary(options: ExtractOptions): Promise<ContentSummary> {
  const { inputDir } = options;
  
  console.log('\n=== Analyzing Available Data ===\n');
  
  // Find all files
  const allFiles = getAllFiles(inputDir, ['.pdf', '.md', '.txt', '.html']);
  
  const fileCounts = {
    total: allFiles.length,
    pdfs: allFiles.filter(f => f.endsWith('.pdf')).length,
    markdown: allFiles.filter(f => f.endsWith('.md')).length,
    text: allFiles.filter(f => f.endsWith('.txt')).length,
    html: allFiles.filter(f => f.endsWith('.html')).length,
  };
  
  console.log('Files found:');
  console.log(`  Total: ${fileCounts.total}`);
  console.log(`  PDFs: ${fileCounts.pdfs}`);
  console.log(`  Markdown: ${fileCounts.markdown}`);
  console.log(`  Text: ${fileCounts.text}`);
  console.log(`  HTML: ${fileCounts.html}`);
  
  // Sample a few files to estimate content
  const sampleSize = Math.min(options.sampleSize || 5, allFiles.length);
  const sampleFiles = allFiles.slice(0, sampleSize);
  
  console.log(`\nSampling ${sampleFiles.length} files for content estimation...`);
  
  const sampleData = {
    spells: [] as Array<Record<string, unknown>>,
    items: [] as Array<Record<string, unknown>>,
    monsters: [] as Array<Record<string, unknown>>,
    puzzles: [] as Array<Record<string, unknown>>,
    traps: [] as Array<Record<string, unknown>>,
  };
  
  for (const filePath of sampleFiles) {
    const fileName = path.basename(filePath);
    console.log(`  Sampling: ${fileName}`);
    
    try {
      const text = await extractTextFromFile(filePath);
      if (text.length < 100) continue;
      
      const source = standardizeSource(filePath, inputDir);
      
      // Parse all content types
      const spells = parseSpells(text, source);
      const items = parseItems(text, source);
      const monsters = parseMonsters(text, source);
      const puzzles = parsePuzzles(text, source);
      const traps = parseTraps(text, source);
      
      sampleData.spells.push(...spells);
      sampleData.items.push(...items);
      sampleData.monsters.push(...monsters);
      sampleData.puzzles.push(...puzzles);
      sampleData.traps.push(...traps);
      
      if (spells.length > 0 || items.length > 0 || monsters.length > 0 || puzzles.length > 0 || traps.length > 0) {
        console.log(`    Found: ${spells.length} spells, ${items.length} items, ${monsters.length} monsters, ${puzzles.length} puzzles, ${traps.length} traps`);
      }
    } catch (error) {
      console.log(`    Error: ${error}`);
    }
  }
  
  // Estimate total content based on sample
  const sampleRatio = sampleFiles.length / allFiles.length;
  const estimatedContent = {
    spells: Math.round(sampleData.spells.length / sampleRatio),
    items: Math.round(sampleData.items.length / sampleRatio),
    monsters: Math.round(sampleData.monsters.length / sampleRatio),
    puzzles: Math.round(sampleData.puzzles.length / sampleRatio),
    traps: Math.round(sampleData.traps.length / sampleRatio),
    encounters: 0, // Will be calculated separately
  };
  
  return {
    files: fileCounts,
    estimatedContent,
    sampleData,
  };
}

/**
 * Main extraction function
 */
async function extractAllContent(options: ExtractOptions) {
  const { inputDir, outputDir } = options;
  
  console.log('\n=== Comprehensive Content Extraction ===\n');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    return;
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate summary first
  const summary = await generateSummary(options);
  
  console.log('\n=== Summary ===');
  console.log('Files:');
  console.log(`  Total: ${summary.files.total}`);
  console.log(`  PDFs: ${summary.files.pdfs}`);
  console.log(`  Markdown: ${summary.files.markdown}`);
  console.log(`  Text: ${summary.files.text}`);
  console.log(`  HTML: ${summary.files.html}`);
  
  console.log('\nEstimated Content:');
  console.log(`  Spells: ${summary.estimatedContent.spells}`);
  console.log(`  Items: ${summary.estimatedContent.items}`);
  console.log(`  Monsters: ${summary.estimatedContent.monsters}`);
  console.log(`  Puzzles: ${summary.estimatedContent.puzzles}`);
  console.log(`  Traps: ${summary.estimatedContent.traps}`);
  
  console.log('\nSample Data:');
  if (summary.sampleData.spells.length > 0) {
    console.log(`\nSample Spell:`);
    console.log(JSON.stringify(summary.sampleData.spells[0], null, 2));
  }
  if (summary.sampleData.items.length > 0) {
    console.log(`\nSample Item:`);
    console.log(JSON.stringify(summary.sampleData.items[0], null, 2));
  }
  if (summary.sampleData.puzzles.length > 0) {
    console.log(`\nSample Puzzle:`);
    console.log(JSON.stringify(summary.sampleData.puzzles[0], null, 2));
  }
  if (summary.sampleData.traps.length > 0) {
    console.log(`\nSample Trap:`);
    console.log(JSON.stringify(summary.sampleData.traps[0], null, 2));
  }
  
  console.log('\n=== Proceeding with full extraction ===\n');
  
  // Now extract from all files
  const allSpells: Array<Record<string, unknown>> = [];
  const allItems: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  const allPuzzles: Array<Record<string, unknown>> = [];
  const allTraps: Array<Record<string, unknown>> = [];
  
  const allFiles = getAllFiles(inputDir, ['.pdf', '.md', '.txt', '.html']);
  
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(inputDir, filePath);
    
    // Skip certain files
    if (fileName.match(/Character Sheet|Pregen|Map|Image|\.jpg|\.png/i)) {
      continue;
    }
    
    console.log(`Processing: ${relativePath}`);
    
    try {
      const text = await extractTextFromFile(filePath);
      if (text.length < 100) {
        console.log(`  Skipped: file too short`);
        continue;
      }
      
      const source = standardizeSource(filePath, inputDir);
      
      // Parse all content types
      const spells = parseSpells(text, source);
      const items = parseItems(text, source);
      const monsters = parseMonsters(text, source);
      const puzzles = parsePuzzles(text, source);
      const traps = parseTraps(text, source);
      
      allSpells.push(...spells);
      allItems.push(...items);
      allMonsters.push(...monsters);
      allPuzzles.push(...puzzles);
      allTraps.push(...traps);
      
      if (spells.length > 0 || items.length > 0 || monsters.length > 0 || puzzles.length > 0 || traps.length > 0) {
        console.log(`  Found: ${spells.length} spells, ${items.length} items, ${monsters.length} monsters, ${puzzles.length} puzzles, ${traps.length} traps`);
      }
    } catch (error) {
      console.error(`  ERROR: ${error}`);
    }
  }
  
  // Remove duplicates (by name and source)
  const uniqueSpells = removeDuplicates(allSpells, 'name', 'source');
  const uniqueItems = removeDuplicates(allItems, 'name', 'source');
  const uniqueMonsters = removeDuplicates(allMonsters, 'name', 'source');
  const uniquePuzzles = removeDuplicates(allPuzzles, 'name', 'source');
  const uniqueTraps = removeDuplicates(allTraps, 'name', 'source');
  
  // Save extracted data
  if (uniqueSpells.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'spells-extracted.json'),
      JSON.stringify(uniqueSpells, null, 2)
    );
    console.log(`\n✓ Saved ${uniqueSpells.length} unique spells`);
  }
  
  if (uniqueItems.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'items-extracted.json'),
      JSON.stringify(uniqueItems, null, 2)
    );
    console.log(`✓ Saved ${uniqueItems.length} unique items`);
  }
  
  if (uniqueMonsters.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'monsters-extracted.json'),
      JSON.stringify(uniqueMonsters, null, 2)
    );
    console.log(`✓ Saved ${uniqueMonsters.length} unique monsters`);
  }
  
  if (uniquePuzzles.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'puzzles-extracted.json'),
      JSON.stringify(uniquePuzzles, null, 2)
    );
    console.log(`✓ Saved ${uniquePuzzles.length} unique puzzles`);
  }
  
  if (uniqueTraps.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, 'traps-extracted.json'),
      JSON.stringify(uniqueTraps, null, 2)
    );
    console.log(`✓ Saved ${uniqueTraps.length} unique traps`);
  }
  
  console.log('\n=== Extraction Complete ===');
  console.log(`Spells: ${uniqueSpells.length}`);
  console.log(`Items: ${uniqueItems.length}`);
  console.log(`Monsters: ${uniqueMonsters.length}`);
  console.log(`Puzzles: ${uniquePuzzles.length}`);
  console.log(`Traps: ${uniqueTraps.length}`);
}

/**
 * Remove duplicates by key(s)
 */
function removeDuplicates<T extends Record<string, unknown>>(
  array: T[],
  ...keys: (keyof T)[]
): T[] {
  const seen = new Set<string>();
  return array.filter(item => {
    const keyValue = keys.map(k => String(item[k] || '')).join('|').toLowerCase();
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
}

// Main execution
const args = process.argv.slice(2);
const inputDir = args[0] || 'Downloads';
const outputDir = args[1] || 'data/free5e/processed';
const sampleSize = args[2] ? parseInt(args[2]) : 5;

extractAllContent({ inputDir, outputDir, sampleSize }).catch(console.error);

