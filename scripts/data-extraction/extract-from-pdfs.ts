/**
 * PDF-Specific Content Extractor
 * Extracts content from PDFs using text-based patterns (not markdown)
 */

import * as fs from 'fs';
import * as path from 'path';
import { normalizeItemCost } from './cost-normalizer';
import { processItemWeightAndVolume, calculateConfidence } from './weight-and-volume-estimator';

interface ExtractOptions {
  inputDir: string;
  outputDir: string;
}

// PDF extraction - reuse from extract-all-content.ts pattern
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParseFn: any = null;
async function getPdfParser() {
  if (!pdfParseFn) {
    try {
      const pdfModule = await import('pdf-parse');
      // pdf-parse module structure varies, handle both default and named exports
      const moduleWithDefault = pdfModule as { default?: unknown; [key: string]: unknown };
      pdfParseFn = (moduleWithDefault.default || pdfModule) as typeof pdfParseFn;
      if (typeof pdfParseFn !== 'function' && pdfModule.PDFParse) {
        const PDFParseClass = pdfModule.PDFParse;
        pdfParseFn = async (buffer: Buffer | Uint8Array) => {
          const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
          const parser = new PDFParseClass(data);
          const originalWarn = console.warn;
          console.warn = () => {};
          try {
            // @ts-expect-error - load() is private but required for PDFParse class
            await parser.load();
            const textResult = await parser.getText();
            return { text: textResult.text || '' };
          } finally {
            console.warn = originalWarn;
          }
        };
      }
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfModule = require('pdf-parse');
        if (typeof pdfModule === 'function') {
          pdfParseFn = pdfModule;
        } else if (pdfModule.PDFParse && typeof pdfModule.PDFParse === 'function') {
          const PDFParseClass = pdfModule.PDFParse;
          pdfParseFn = async (buffer: Buffer | Uint8Array) => {
            const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
            const parser = new PDFParseClass(data);
            await parser.load();
            const textResult = await parser.getText();
            return { text: textResult.text || '' };
          };
        }
      } catch {
        // PDF parsing not available
      }
    }
  }
  return pdfParseFn;
}

async function extractPDFText(filePath: string): Promise<string> {
  try {
    const pdfParse = await getPdfParser();
    if (!pdfParse) {
      return '';
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = dataBuffer instanceof Buffer ? new Uint8Array(dataBuffer) : dataBuffer;
    const result = await pdfParse(data);
    return result.text || '';
  } catch (error) {
    console.error(`  ERROR extracting PDF ${path.basename(filePath)}: ${error}`);
    return '';
  }
}

/**
 * Parse spells from PDF text (plain text, not markdown)
 */
function parseSpellsFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const spells: Array<Record<string, unknown>> = [];
  
  // Pattern 1: "SPELL NAME" or "Spell Name" followed by level/school info
  // Look for patterns like: "Fireball\n3rd-level evocation" or "FIREBALL\n3rd-level evocation"
  const spellPattern1 = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(\d+)(?:st|nd|rd|th)?-level\s+(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/gim;
  
  // Pattern 2: "SPELL NAME" in all caps followed by level info
  const spellPattern2 = /^([A-Z][A-Z\s'-]{3,50}?)\s*\n\s*(\d+)(?:st|nd|rd|th)?-level/gim;
  
  // Pattern 3: Cantrip pattern
  const cantripPattern = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:cantrip|Cantrip)\s+(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/gim;
  
  const patterns = [spellPattern1, spellPattern2, cantripPattern];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const name = match[1]?.trim();
        if (!name || name.length < 3) continue;
        
        // Extract spell block (next 50 lines or until next spell)
        const blockStart = match.index;
        const nextSpell = text.substring(blockStart + match[0].length).search(/\n[A-Z][A-Za-z\s'-]{3,50}?\s*\n\s*(\d+|-level|cantrip)/i);
        const spellBlock = nextSpell > 0 ? text.substring(blockStart, blockStart + match[0].length + nextSpell) : text.substring(blockStart, blockStart + 2000);
        
        // Extract level
        let level = 0;
        if (match[2]) {
          level = parseInt(match[2]);
        } else if (spellBlock.match(/cantrip/i)) {
          level = 0;
        }
        
        // Extract school
        let school = 'evocation';
        if (match[3]) {
          school = match[3].toLowerCase();
        } else {
          const schoolMatch = spellBlock.match(/(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)/i);
          if (schoolMatch) school = schoolMatch[1].toLowerCase();
        }
        
        // Extract casting time
        const castingTimeMatch = spellBlock.match(/Casting\s+Time[:\s]+([^\n]+)/i);
        const castingTime = castingTimeMatch ? castingTimeMatch[1].trim() : '1 action';
        
        // Extract range
        const rangeMatch = spellBlock.match(/Range[:\s]+([^\n]+)/i);
        const range = rangeMatch ? rangeMatch[1].trim() : 'Self';
        
        // Extract components
        const componentsMatch = spellBlock.match(/Components[:\s]+([^\n]+)/i);
        const components = componentsMatch ? componentsMatch[1].trim() : 'V';
        
        // Extract duration
        const durationMatch = spellBlock.match(/Duration[:\s]+([^\n]+)/i);
        const duration = durationMatch ? durationMatch[1].trim() : 'Instantaneous';
        
        // Extract description (everything after Duration)
        const descStart = durationMatch ? (durationMatch.index! + durationMatch[0].length) : match[0].length;
        let description = spellBlock.substring(descStart).trim();
        
        // Remove "At Higher Levels" section
        const higherLevelMatch = description.match(/At\s+Higher\s+Levels[:\s]+([^\n]+(?:\n(?![A-Z][A-Za-z]{3,})[^\n]+)*)/i);
        const higherLevel = higherLevelMatch ? higherLevelMatch[1].trim() : null;
        if (higherLevelMatch) {
          description = description.substring(0, higherLevelMatch.index).trim();
        }
        
        // Quality checks
        if (description.length < 30) continue;
        if (level < 0 || level > 9) continue;
        
        const confidence = calculateConfidence(
          false,
          false,
          description.length > 50,
          description.length,
          castingTimeMatch !== null && rangeMatch !== null,
          'spell'
        );
        
        spells.push({
          name: name,
          level: level,
          school: school,
          casting_time: castingTime,
          range: range,
          components: components,
          duration: duration,
          description: description.substring(0, 2000),
          higher_level: higherLevel ? higherLevel.substring(0, 500) : null,
          ritual: spellBlock.toLowerCase().includes('ritual'),
          concentration: duration.toLowerCase().includes('concentration'),
          extraction_confidence_score: confidence,
          source: source,
        });
      } catch {
        continue;
      }
    }
  }
  
  return spells;
}

/**
 * Parse monsters from PDF text
 */
function parseMonstersFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const monsters: Array<Record<string, unknown>> = [];
  
  // Pattern: "MONSTER NAME" or "Monster Name" followed by "Challenge X" or "CR X"
  const monsterPattern = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Challenge|CR)[:\s]+([\d./]+)/gim;
  
  let match;
  while ((match = monsterPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Extract monster block (next 100 lines or until next monster)
      const blockStart = match.index;
      const nextMonster = text.substring(blockStart + match[0].length).search(/\n[A-Z][A-Za-z\s'-]{3,50}?\s*\n\s*(?:Challenge|CR)/i);
      const monsterBlock = nextMonster > 0 ? text.substring(blockStart, blockStart + match[0].length + nextMonster) : text.substring(blockStart, blockStart + 5000);
      
      // Extract size and type
      const sizeTypeMatch = monsterBlock.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([^\n,]+)/i);
      const size = sizeTypeMatch ? sizeTypeMatch[1].toLowerCase() : 'medium';
      const type = sizeTypeMatch ? sizeTypeMatch[2].trim().toLowerCase() : 'beast';
      
      // Extract AC
      const acMatch = monsterBlock.match(/Armor\s+Class[:\s]+(\d+)/i);
      const armor_class = acMatch ? parseInt(acMatch[1]) : 10;
      
      // Extract HP
      const hpMatch = monsterBlock.match(/Hit\s+Points[:\s]+(\d+)/i);
      const hit_points = hpMatch ? parseInt(hpMatch[1]) : 1;
      
      // Extract speed
      const speedMatch = monsterBlock.match(/Speed[:\s]+([^\n]+)/i);
      const speedText = speedMatch ? speedMatch[1].trim() : '30 ft';
      const speed: Record<string, number> = {};
      const speedParts = speedText.match(/(\w+)\s+(\d+)/g);
      if (speedParts) {
        for (const part of speedParts) {
          const p = part.match(/(\w+)\s+(\d+)/);
          if (p) speed[p[1]] = parseInt(p[2]);
        }
      } else {
        speed.walk = parseInt(speedText.match(/(\d+)/)?.[1] || '30');
      }
      
      // Extract stats (STR, DEX, CON, INT, WIS, CHA)
      const stats: Record<string, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      const strMatch = monsterBlock.match(/STR\s+(\d+)/i);
      const dexMatch = monsterBlock.match(/DEX\s+(\d+)/i);
      const conMatch = monsterBlock.match(/CON\s+(\d+)/i);
      const intMatch = monsterBlock.match(/INT\s+(\d+)/i);
      const wisMatch = monsterBlock.match(/WIS\s+(\d+)/i);
      const chaMatch = monsterBlock.match(/CHA\s+(\d+)/i);
      if (strMatch) stats.str = parseInt(strMatch[1]);
      if (dexMatch) stats.dex = parseInt(dexMatch[1]);
      if (conMatch) stats.con = parseInt(conMatch[1]);
      if (intMatch) stats.int = parseInt(intMatch[1]);
      if (wisMatch) stats.wis = parseInt(wisMatch[1]);
      if (chaMatch) stats.cha = parseInt(chaMatch[1]);
      
      // Extract CR
      const cr = parseFloat(match[2]?.trim() || '0');
      
      // Extract traits, actions, etc. (simplified - full extraction would be more complex)
      const traits: Array<{ name: string; description: string }> = [];
      const actions: Array<{ name: string; description: string; attack_bonus: number | null; damage: string | null }> = [];
      
      // Look for trait sections
      const traitSection = monsterBlock.match(/Traits?[:\s]+\n([^\n]+(?:\n(?!Actions?)[^\n]+)*)/i);
      if (traitSection) {
        // Simplified trait extraction
        const traitMatches = traitSection[1].match(/([A-Z][^\n]+?)[.\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/g);
        if (traitMatches) {
          for (const tm of traitMatches.slice(0, 5)) {
            const parts = tm.match(/([A-Z][^\n]+?)[.\s]+(.+)/);
            if (parts && parts[1].length < 50) {
              traits.push({
                name: parts[1].trim(),
                description: parts[2].trim().substring(0, 500)
              });
            }
          }
        }
      }
      
      // Look for action sections
      const actionSection = monsterBlock.match(/Actions?[:\s]+\n([^\n]+(?:\n(?!Legendary)[^\n]+)*)/i);
      if (actionSection) {
        const actionMatches = actionSection[1].match(/([A-Z][^\n]+?)[.\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/g);
        if (actionMatches) {
          for (const am of actionMatches.slice(0, 10)) {
            const parts = am.match(/([A-Z][^\n]+?)[.\s]+(.+)/);
            if (parts && parts[1].length < 50) {
              const attackMatch = parts[2].match(/\+(\d+)\s+to\s+hit/i);
              const damageMatch = parts[2].match(/(\d+d\d+[^\s]*)/i);
              actions.push({
                name: parts[1].trim(),
                description: parts[2].trim().substring(0, 500),
                attack_bonus: attackMatch ? parseInt(attackMatch[1]) : null,
                damage: damageMatch ? damageMatch[1] : null
              });
            }
          }
        }
      }
      
      const confidence = calculateConfidence(
        false,
        false,
        monsterBlock.length > 200,
        monsterBlock.length,
        traits.length > 0 || actions.length > 0,
        'monster'
      );
      
      monsters.push({
        name: name,
        size: size,
        type: type,
        armor_class: armor_class,
        hit_points: hit_points,
        speed: speed,
        stats: stats,
        challenge_rating: cr,
        traits: traits.length > 0 ? traits : null,
        actions: actions.length > 0 ? actions : null,
        extraction_confidence_score: confidence,
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  return monsters;
}

/**
 * Parse items from PDF text
 * Items include: weapons, armor, tools, consumables, magic items, potions, poisons, etc.
 */
function parseItemsFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Pattern 1: "ITEM NAME" followed by cost/weight info (mundane items)
  const itemPattern1 = /^([A-Z][A-Za-z\s'-]{2,50}?)\s*\n\s*(?:Cost|Price)[:\s]+([^\n]+)/gim;
  
  // Pattern 2: Magic items - "ITEM NAME" followed by "Rarity:" or "requires attunement"
  const itemPattern2 = /^([A-Z][A-Za-z\s'-]{2,50}?)\s*\n\s*(?:Rarity|requires\s+attunement)/gim;
  
  // Pattern 3: Items in equipment lists (look for common item keywords)
  const itemKeywords = /\b(sword|axe|mace|dagger|bow|crossbow|staff|wand|rod|ring|amulet|potion|scroll|armor|shield|helmet|boots|gloves|cloak|robe|weapon|tool|kit|pack|rations|torch|rope|lantern|oil|ink|parchment|book|map|gem|coin|vial|flask|bottle|pouch|bag|backpack|quiver|sheath|whetstone|crowbar|hammer|nails|chain|lock|key|tent|bedroll|waterskin|rations|rations|tinderbox|flint|steel|chalk|mirror|soap|perfume|grappling|hook|shovel|pickaxe|bucket|barrel|chest|trunk|sack|basket|barrel|jug|mug|plate|bowl|cup|spoon|fork|knife|cleaver|pot|pan|kettle|cauldron|mortar|pestle|scale|weights|hourglass|compass|spyglass|magnifying|glass|bell|whistle|horn|drum|flute|lyre|lute|harp|viol|pipe|tobacco|wine|ale|beer|cheese|bread|meat|fruit|vegetable|herb|spice|salt|pepper|sugar|honey|milk|butter|egg|fish|game|venison|pork|beef|mutton|chicken|duck|goose|turkey|rabbit|squirrel|deer|boar|bear|wolf|fox|badger|otter|beaver|mink|ermine|sable|marten|lynx|bobcat|puma|cougar|mountain|lion|tiger|leopard|jaguar|panther|cheetah|hyena|jackal|coyote|dingo|wild|dog|feline|canine|equine|bovine|ovine|caprine|porcine|suine|galline|anserine|anatine|columbine|passerine|corvine|accipitrine|falconine|strigine|psittacine|colubrine|viperine|crotaline|elapine|boidine|pythonine|testudine|chelonian|crocodilian|alligatorine|caimanine|gavialine|saurian|lacertilian|iguanine|agamid|chameleonine|gekkonine|scincine|anguine|amphisbaenine|serpentine|ophidian|anguilline|muraenine|congrine|gadine|salmonine|troutine|pikeine|percine|bassine|sunfishine|catfishine|sturgeonine|paddlefishine|garine|bowfinine|lungfishine|coelacanthine|dipnoan|actinopterygian|chondrichthyan|elasmobranch|selachian|batoid|rajiform|myliobatiform|torpediniform|rhinobatiform|pristiform|squatiniform|hexanchiform|heterodontiform|orectolobiform|lamniform|carcharhiniform|squaliform|squatiniform|pristiophoriform|squatiniform|hexanchiform|heterodontiform|orectolobiform|lamniform|carcharhiniform|squaliform)\b/i;
  
  // Pattern 3: Items in equipment tables (look for item names followed by weight or cost indicators)
  const itemPattern3 = /^([A-Z][A-Za-z\s'-]{2,50}?)\s*\n\s*(?:Weight[:\s]+|(\d+)\s*(?:gp|sp|cp|pp|lb|oz))/gim;
  
  // Pattern 4: Items in lists (bullet points or numbered lists)
  const itemPattern4 = /(?:^|\n)\s*(?:[-•*]|\d+[.)])\s*([A-Z][A-Za-z\s'-]{2,50}?)\s*(?:\([^)]+\))?\s*(?:[,\n]|$)/gim;
  
  const patterns = [itemPattern1, itemPattern2, itemPattern3];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const name = match[1]?.trim();
        if (!name || name.length < 2) continue;
        
        // Extract item block
        const blockStart = match.index;
        const nextItem = text.substring(blockStart + match[0].length).search(/\n[A-Z][A-Za-z\s'-]{2,50}?\s*\n\s*(?:Cost|Price|Rarity)/i);
        const itemBlock = nextItem > 0 ? text.substring(blockStart, blockStart + match[0].length + nextItem) : text.substring(blockStart, blockStart + 1000);
        
        // Determine item kind
        const lowerName = name.toLowerCase();
        const lowerBlock = itemBlock.toLowerCase();
        let kind = 'other';
        let category: string | null = null;
        let rarity: string | null = null;
        
        if (lowerBlock.includes('requires attunement') || lowerBlock.includes('rarity:')) {
          kind = 'magic_item';
          const rarityMatch = itemBlock.match(/Rarity[:\s]+([^\n]+)/i);
          rarity = rarityMatch ? rarityMatch[1].trim().toLowerCase() : null;
        } else if (lowerName.match(/\b(potion|elixir)\b/)) {
          kind = 'consumable';
          category = 'potion';
        } else if (lowerName.match(/\b(poison|venom)\b/)) {
          kind = 'consumable';
          category = 'poison';
        } else if (lowerName.match(/\b(sword|axe|mace|dagger|weapon)\b/)) {
          kind = 'weapon';
        } else if (lowerName.match(/\b(armor|plate|mail|shield)\b/)) {
          kind = 'armor';
        } else if (lowerName.match(/\b(tool|kit)\b/)) {
          kind = 'tool';
        }
        
        // Extract cost
        const costMatch = itemBlock.match(/(?:Cost|Price)[:\s]+([^\n]+)/i);
        let cost_gp: number | null = null;
        if (costMatch) {
          const costStr = costMatch[1].trim();
          const numMatch = costStr.match(/([\d,.]+)/);
          if (numMatch) {
            cost_gp = parseFloat(numMatch[1].replace(/,/g, ''));
          }
        }
        
        // Normalize cost
        const normalized = normalizeItemCost({ name, kind, rarity, cost_gp });
        cost_gp = normalized.cost_gp;
        
        // Extract weight
        const weightMatch = itemBlock.match(/Weight[:\s]+([^\n]+)/i);
        let weight_lb: number | null = null;
        if (weightMatch) {
          const weightStr = weightMatch[1].match(/([\d.]+)/);
          if (weightStr) weight_lb = parseFloat(weightStr[1]);
        }
        
        // Process weight and volume
        const weightVolume = processItemWeightAndVolume({
          name,
          kind,
          description: itemBlock.substring(match[0].length).trim(),
          weight_lb
        });
        
        // Extract description
        let description = itemBlock.substring(match[0].length).trim();
        description = description.replace(/(?:Cost|Price|Weight|Rarity)[:\s]+[^\n]+/gi, '').trim();
        
        // Calculate confidence
        const confidence = calculateConfidence(
          weight_lb !== null && weight_lb > 0,
          cost_gp !== null && cost_gp > 0,
          description.length > 0,
          description.length,
          false,
          kind
        );
        
        if (name && (cost_gp !== null || weight_lb !== null || description.length > 15)) {
          items.push({
            name: name,
            kind: kind,
            category: category,
            rarity: rarity,
            cost_gp: cost_gp,
            cost_breakdown: normalized.cost_breakdown,
            weight_lb: weight_lb,
            weight_kg: weightVolume.weight_kg,
            estimated_real_weight_kg: weightVolume.estimated_real_weight_kg,
            volume_category: weightVolume.volume_category,
            description: description.substring(0, 2000),
            extraction_confidence_score: confidence,
            source: source,
          });
        }
      } catch {
        continue;
      }
    }
  }
  
  return items;
}

/**
 * Parse feats from PDF text
 * Feats are much rarer - only extract from dedicated feat sections
 */
function parseFeatsFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const feats: Array<Record<string, unknown>> = [];
  
  // Known false positive patterns to exclude
  const falsePositives = /^(Table|Chapter|Section|Appendix|Index|Contents|Spell|Spells|Monster|Monsters|Item|Items|Class|Classes|Race|Races|Background|Backgrounds|Level|Ability|Skill|Saving|Attack|Damage|Armor|Hit|Speed|Challenge|Experience|Proficiency|Equipment|Weapon|Armor|Tool|Language|Feature|Trait|Action|Reaction|Legendary|Lair|Regional|Innate|Spellcasting|Cantrip|Ritual|Concentration|Material|Somatic|Verbal|Component|Range|Duration|Casting|Time|School|Evocation|Abjuration|Conjuration|Divination|Enchantment|Illusion|Necromancy|Transmutation)$/i;
  
  // Much more specific pattern - look for "FEAT NAME" on its own line, followed by "Prerequisite:" or "You gain" or "When you"
  // Must be in a feat section (look for "Feats" header nearby)
  const featSectionMatch = text.match(/(?:^|\n)\s*(?:##\s+)?Feats?\s*(?:\n|$)/i);
  if (!featSectionMatch) {
    // No feat section found - skip this file
    return feats;
  }
  
  // Pattern: Line starting with capitalized word(s), followed by newline and "Prerequisite:" or "You gain" or "When you"
  const featPattern = /^([A-Z][A-Za-z\s'-]{3,40}?)\s*\n\s*(?:Prerequisite[s]?[:\s]+|You\s+gain|When\s+you)/gim;
  
  let match;
  while ((match = featPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      if (falsePositives.test(name)) continue; // Skip false positives
      
      // Must be within reasonable distance of feat section (within 5000 chars)
      const featSectionIndex = featSectionMatch.index!;
      if (Math.abs(match.index - featSectionIndex) > 5000) continue;
      
      // Extract feat block
      const blockStart = match.index;
      const nextFeat = text.substring(blockStart + match[0].length).search(/\n([A-Z][A-Za-z\s'-]{3,40}?)\s*\n\s*(?:Prerequisite[s]?[:\s]+|You\s+gain|When\s+you)/i);
      const featBlock = nextFeat > 0 ? text.substring(blockStart, blockStart + match[0].length + nextFeat) : text.substring(blockStart, blockStart + 1000);
      
      // Extract prerequisites
      const prereqMatch = featBlock.match(/Prerequisite[s]?[:\s]+([^\n]+)/i);
      const prerequisites = prereqMatch ? prereqMatch[1].trim() : null;
      
      // Extract description
      const description = featBlock.substring(match[0].length).trim();
      
      // Quality checks - must have substantial description
      if (name && description.length > 30 && !description.match(/^(Table|Chapter|Section)/i)) {
        const confidence = calculateConfidence(
          false,
          false,
          description.length > 100,
          description.length,
          prerequisites !== null,
          'feat'
        );
        
        feats.push({
          name: name,
          prerequisites: prerequisites,
          benefits: description,
          description: description,
          extraction_confidence_score: confidence,
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return feats;
}

/**
 * Parse classes from PDF text
 * Core classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard
 * Additional classes in other books: Artificer, Blood Hunter, etc.
 */
function parseClassesFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const classes: Array<Record<string, unknown>> = [];
  
  // Known class names to validate against
  const knownClasses = [
    'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
    'Artificer', 'Blood Hunter'
  ];
  
  // Pattern 1: "CLASS NAME" followed by "Class" or "Hit Dice" or "Proficiencies"
  const classPattern1 = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Class|Hit\s+Dice|Proficiencies)/gim;
  
  // Pattern 2: "## CLASS NAME" (markdown-style in some PDFs)
  const classPattern2 = /##\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*(?:Class|$)/gim;
  
  // Pattern 3: "THE CLASS NAME" (some books use "The" prefix)
  const classPattern3 = /The\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Class|Hit\s+Dice)/gim;
  
  const patterns = [classPattern1, classPattern2, classPattern3];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        let name = match[1]?.trim();
        if (!name || name.length < 3) continue;
        
        // Clean up name (remove "The" if present, etc.)
        name = name.replace(/^The\s+/i, '').trim();
        
        // Validate against known classes (but allow unknown ones from supplements)
        const isKnownClass = knownClasses.some(c => name.toLowerCase() === c.toLowerCase());
        if (!isKnownClass && !name.match(/\b(Class|Hit\s+Dice)\b/i)) {
          // If not a known class and doesn't contain class keywords, might be false positive
          // But allow it - could be a new class from supplements
        }
        
        // Extract class block
        const blockStart = match.index;
        const nextClass = text.substring(blockStart + match[0].length).search(/\n(?:##\s+)?[A-Z][A-Za-z\s'-]{3,50}?\s*\n\s*(?:Class|Hit\s+Dice|The\s+[A-Z])/i);
        const classBlock = nextClass > 0 ? text.substring(blockStart, blockStart + match[0].length + nextClass) : text.substring(blockStart, blockStart + 5000);
        
        // Extract hit dice
        const hitDiceMatch = classBlock.match(/Hit\s+Dice[:\s]+(\d+d\d+)/i);
        const hitDice = hitDiceMatch ? hitDiceMatch[1] : null;
        
        // Extract HP at 1st level
        const hp1stMatch = classBlock.match(/Hit\s+Points\s+at\s+1st\s+Level[:\s]+([^\n]+)/i);
        const hp1st = hp1stMatch ? hp1stMatch[1].trim() : null;
        
        // Extract HP at higher levels
        const hpHigherMatch = classBlock.match(/Hit\s+Points\s+at\s+Higher\s+Levels[:\s]+([^\n]+)/i);
        const hpHigher = hpHigherMatch ? hpHigherMatch[1].trim() : null;
        
        // Quality check: must have hit dice and HP at 1st level
        if (name && hitDice && hp1st) {
          const confidence = calculateConfidence(
            false,
            false,
            classBlock.length > 200,
            classBlock.length,
            hpHigher !== null,
            'class'
          );
          
          classes.push({
            name: name,
            hit_dice: hitDice,
            hit_points_at_1st_level: hp1st,
            hit_points_at_higher_levels: hpHigher,
            extraction_confidence_score: confidence,
            source: source,
          });
        }
      } catch {
        continue;
      }
    }
  }
  
  return classes;
}

/**
 * Parse subclasses from PDF text
 * Subclasses are typically under their parent class, e.g., "Berserker" under "Barbarian"
 */
function parseSubclassesFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const subclasses: Array<Record<string, unknown>> = [];
  
  // Known subclass patterns - they often appear after class features
  // Pattern 1: "SUBCLASS NAME" followed by class-specific keywords
  const subclassPattern1 = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Path|Archetype|Domain|Circle|Oath|Way|School|Origin|Patron|Tradition)/gim;
  
  // Pattern 2: "## SUBCLASS NAME" (markdown-style)
  const subclassPattern2 = /##\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*(?:Path|Archetype|Domain|Circle|Oath|Way|School|Origin|Patron|Tradition)/gim;
  
  // Pattern 3: "THE SUBCLASS NAME" (some books use "The" prefix)
  const subclassPattern3 = /The\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Path|Archetype|Domain|Circle|Oath|Way|School|Origin|Patron|Tradition)/gim;
  
  const patterns = [subclassPattern1, subclassPattern2, subclassPattern3];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        let name = match[1]?.trim();
        if (!name || name.length < 3) continue;
        
        // Clean up name
        name = name.replace(/^The\s+/i, '').trim();
        
        // Extract subclass block
        const blockStart = match.index;
        const nextSubclass = text.substring(blockStart + match[0].length).search(/\n(?:##\s+)?[A-Z][A-Za-z\s'-]{3,50}?\s*\n\s*(?:Path|Archetype|Domain|Circle|Oath|Way|School|Origin|Patron|Tradition|The\s+[A-Z])/i);
        const subclassBlock = nextSubclass > 0 ? text.substring(blockStart, blockStart + match[0].length + nextSubclass) : text.substring(blockStart, blockStart + 3000);
        
        // Try to infer parent class from context (look backwards 3000 chars for class name)
        const classContext = text.substring(Math.max(0, blockStart - 3000), blockStart);
        let parentClass: string | null = null;
        
        // Known subclass keywords by class
        const classSubclassMap: Record<string, string[]> = {
          'Barbarian': ['Path'],
          'Bard': ['College'],
          'Cleric': ['Domain'],
          'Druid': ['Circle'],
          'Fighter': ['Martial', 'Archetype'],
          'Monk': ['Way', 'Tradition'],
          'Paladin': ['Oath'],
          'Ranger': ['Archetype', 'Conclave'],
          'Rogue': ['Archetype', 'Roguish'],
          'Sorcerer': ['Origin', 'Bloodline'],
          'Warlock': ['Patron', 'Otherworldly'],
          'Wizard': ['School', 'Tradition'],
          'Artificer': ['Specialist']
        };
        
        // Find which class this subclass belongs to
        for (const [className, keywords] of Object.entries(classSubclassMap)) {
          if (classContext.match(new RegExp(`\\b${className}\\b`, 'i'))) {
            const matchedKeyword = match[0].match(/(?:Path|Archetype|Domain|Circle|Oath|Way|School|Origin|Patron|Tradition|College|Martial|Conclave|Roguish|Bloodline|Otherworldly|Specialist)/i)?.[0];
            if (matchedKeyword && keywords.some(k => matchedKeyword.toLowerCase().includes(k.toLowerCase()))) {
              parentClass = className;
              break;
            }
          }
        }
        
        // If no parent class found, try a broader search
        if (!parentClass) {
          const parentClassMatch = classContext.match(/\b(Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard|Artificer)\b/i);
          parentClass = parentClassMatch ? parentClassMatch[1] : null;
        }
        
        // Quality check: must have parent class nearby (within 3000 chars)
        if (!parentClass) {
          // Check if we're within 5000 chars of a class name
          const nearbyClass = text.substring(Math.max(0, blockStart - 5000), blockStart + 1000).match(/\b(Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard|Artificer)\b/i);
          if (!nearbyClass) continue; // Too far from any class - likely false positive
          parentClass = nearbyClass[1];
        }
        
        // Extract features (simplified - full extraction would be more complex)
        const features: Array<{ level: number; name: string; description: string }> = [];
        const featurePattern = /(\d+)(?:st|nd|rd|th)?\s+Level[:\s]+([A-Z][^\n]+?)\s*\n\s*([^\n]+(?:\n(?!\d+[stndrdth]?\s+Level)[^\n]+)*)/gi;
        let featureMatch;
        while ((featureMatch = featurePattern.exec(subclassBlock)) !== null && features.length < 10) {
          const level = parseInt(featureMatch[1]);
          if (level >= 2 && level <= 20) { // Valid subclass levels
            features.push({
              level: level,
              name: featureMatch[2]?.trim() || 'Feature',
              description: featureMatch[3]?.trim() || ''
            });
          }
        }
        
        if (name && parentClass && subclassBlock.length > 100) {
          const confidence = calculateConfidence(
            false,
            false,
            subclassBlock.length > 200,
            subclassBlock.length,
            parentClass !== null,
            'subclass'
          );
          
          subclasses.push({
            name: name,
            parent_class: parentClass,
            features: features.length > 0 ? features : null,
            description: subclassBlock.substring(0, 2000),
            extraction_confidence_score: confidence,
            source: source,
          });
        }
      } catch {
        continue;
      }
    }
  }
  
  return subclasses;
}

/**
 * Parse races from PDF text
 * Core races: Dwarf, Elf, Halfling, Human, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling
 * Additional races in other books: Aasimar, Genasi, Goliath, etc.
 */
function parseRacesFromPDF(text: string, source: string): Array<Record<string, unknown>> {
  const races: Array<Record<string, unknown>> = [];
  
  // Known race names to validate against
  const knownRaces = [
    'Dwarf', 'Elf', 'Halfling', 'Human', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling',
    'Aasimar', 'Genasi', 'Goliath', 'Firbolg', 'Kenku', 'Lizardfolk', 'Tabaxi', 'Triton', 'Bugbear',
    'Goblin', 'Hobgoblin', 'Kobold', 'Orc', 'Yuan-ti', 'Tortle', 'Gith', 'Changeling', 'Kalashtar',
    'Shifter', 'Warforged', 'Centaur', 'Loxodon', 'Minotaur', 'Simic Hybrid', 'Vedalken', 'Leonin',
    'Satyr', 'Fairy', 'Harengon', 'Owlin', 'Reborn', 'Hexblood', 'Dhampir', 'Autognome', 'Plasmoid',
    'Hadozee', 'Giff', 'Thri-kreen'
  ];
  
  // False positive patterns to exclude
  const falsePositives = /^(Table|Chapter|Section|Appendix|Index|Contents|Race|Races|Size|Speed|Ability|Score|Increase|Trait|Traits|Language|Languages|Subrace|Subraces|Feature|Features|Proficiency|Proficiencies|Skill|Skills|Saving|Throw|Throws|Armor|Weapon|Weapons|Tool|Tools|Equipment|Starting|Hit|Points|Dice|Level|Class|Classes|Background|Backgrounds|Spell|Spells|Monster|Monsters|Item|Items|Feat|Feats)$/i;
  
  // Pattern 1: "RACE NAME" followed by "Race" or "Size" or "Speed"
  // Look for race section, but don't require it (some PDFs don't have clear sections)
  const raceSectionMatch = text.match(/(?:^|\n)\s*(?:##\s+)?Races?\s*(?:\n|$)/i);
  
  const racePattern = /^([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Race|Size|Speed)/gim;
  
  let match;
  while ((match = racePattern.exec(text)) !== null) {
    try {
      let name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      if (falsePositives.test(name)) continue;
      
      // Clean up name
      name = name.replace(/^The\s+/i, '').trim();
      
      // Validate against known races (but allow unknown ones from supplements)
      const isKnownRace = knownRaces.some(r => {
        const raceLower = r.toLowerCase();
        const nameLower = name.toLowerCase();
        return nameLower === raceLower || nameLower.includes(raceLower) || raceLower.includes(nameLower);
      });
      
      // If not a known race, be more cautious - require it to be near a race section or have race-like structure
      if (!isKnownRace) {
        // Must be within reasonable distance of race section if one exists
        if (raceSectionMatch) {
          const raceSectionIndex = raceSectionMatch.index!;
          if (Math.abs(match.index - raceSectionIndex) > 10000) continue;
        } else {
          // No race section - require the name to match known race patterns more closely
          // Allow if it contains common race words or is a compound name
          if (!name.match(/\b(Half|Elf|Orc|Dwarf|Elf|Gnome|Human|Dragon|Tiefling|Aasimar|Genasi|Goliath|Firbolg|Kenku|Lizard|Tabaxi|Triton|Bugbear|Goblin|Hobgoblin|Kobold|Orc|Yuan|Tortle|Gith|Changeling|Kalashtar|Shifter|Warforged|Centaur|Loxodon|Minotaur|Simic|Vedalken|Leonin|Satyr|Fairy|Harengon|Owlin|Reborn|Hexblood|Dhampir|Autognome|Plasmoid|Hadozee|Giff|Thri|Kreen)\b/i)) {
            continue;
          }
        }
      }
      
      // Extract race block
      const blockStart = match.index;
      const nextRace = text.substring(blockStart + match[0].length).search(/\n([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Race|Size|Speed)/i);
      const raceBlock = nextRace > 0 ? text.substring(blockStart, blockStart + match[0].length + nextRace) : text.substring(blockStart, blockStart + 3000);
      
      // Extract size
      const sizeMatch = raceBlock.match(/Size[:\s]+([^\n]+)/i);
      const size = sizeMatch ? sizeMatch[1].trim().toLowerCase() : 'medium';
      
      // Extract speed
      const speedMatch = raceBlock.match(/Speed[:\s]+(\d+)/i);
      const speed = speedMatch ? parseInt(speedMatch[1]) : 30;
      
      // Quality check: must have valid size and speed
      if (name && size && speed && speed > 0 && speed < 200) {
        const confidence = calculateConfidence(
          false,
          false,
          raceBlock.length > 100,
          raceBlock.length,
          sizeMatch !== null && speedMatch !== null,
          'race'
        );
        
        races.push({
          name: name,
          size: size,
          speed: speed,
          extraction_confidence_score: confidence,
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return races;
}

/**
 * Main extraction function
 */
async function extractFromPDFs(options: ExtractOptions) {
  const { inputDir, outputDir } = options;
  
  console.log('\n=== PDF Content Extraction ===\n');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    return;
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all PDF files
  const allFiles: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.match(/Processed|Individual Cards|Character Sheets/i)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        allFiles.push(fullPath);
      }
    }
  }
  walk(inputDir);
  
  const allSpells: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  const allItems: Array<Record<string, unknown>> = [];
  const allFeats: Array<Record<string, unknown>> = [];
  const allClasses: Array<Record<string, unknown>> = [];
  const allSubclasses: Array<Record<string, unknown>> = [];
  const allRaces: Array<Record<string, unknown>> = [];
  
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    console.log(`Processing: ${fileName}`);
    
    try {
      const text = await extractPDFText(filePath);
      if (text.length < 100) {
        console.log(`  Skipped: file too short`);
        continue;
      }
      
      const source = standardizeSource(filePath, inputDir);
      
      // Parse all content types
      const spells = parseSpellsFromPDF(text, source);
      const monsters = parseMonstersFromPDF(text, source);
      const items = parseItemsFromPDF(text, source);
      const feats = parseFeatsFromPDF(text, source);
      const classes = parseClassesFromPDF(text, source);
      const subclasses = parseSubclassesFromPDF(text, source);
      const races = parseRacesFromPDF(text, source);
      
      allSpells.push(...spells);
      allMonsters.push(...monsters);
      allItems.push(...items);
      allFeats.push(...feats);
      allClasses.push(...classes);
      allSubclasses.push(...subclasses);
      allRaces.push(...races);
      
      if (spells.length > 0 || monsters.length > 0 || items.length > 0 || feats.length > 0 || classes.length > 0 || subclasses.length > 0 || races.length > 0) {
        console.log(`  Found: ${spells.length} spells, ${monsters.length} monsters, ${items.length} items, ${feats.length} feats, ${classes.length} classes, ${subclasses.length} subclasses, ${races.length} races`);
      }
    } catch (error) {
      console.error(`  ERROR: ${error}`);
    }
  }
  
  // Remove duplicates
  const uniqueSpells = removeDuplicates(allSpells, 'name', 'source');
  const uniqueMonsters = removeDuplicates(allMonsters, 'name', 'source');
  const uniqueItems = removeDuplicates(allItems, 'name', 'source');
  const uniqueFeats = removeDuplicates(allFeats, 'name', 'source');
  const uniqueClasses = removeDuplicates(allClasses, 'name', 'source');
  const uniqueSubclasses = removeDuplicates(allSubclasses, 'name', 'source');
  const uniqueRaces = removeDuplicates(allRaces, 'name', 'source');
  
  // Save results
  fs.writeFileSync(path.join(outputDir, 'spells-pdf-extracted.json'), JSON.stringify(uniqueSpells, null, 2));
  fs.writeFileSync(path.join(outputDir, 'monsters-pdf-extracted.json'), JSON.stringify(uniqueMonsters, null, 2));
  fs.writeFileSync(path.join(outputDir, 'items-pdf-extracted.json'), JSON.stringify(uniqueItems, null, 2));
  fs.writeFileSync(path.join(outputDir, 'feats-pdf-extracted.json'), JSON.stringify(uniqueFeats, null, 2));
  fs.writeFileSync(path.join(outputDir, 'classes-pdf-extracted.json'), JSON.stringify(uniqueClasses, null, 2));
  fs.writeFileSync(path.join(outputDir, 'subclasses-pdf-extracted.json'), JSON.stringify(uniqueSubclasses, null, 2));
  fs.writeFileSync(path.join(outputDir, 'races-pdf-extracted.json'), JSON.stringify(uniqueRaces, null, 2));
  
  console.log('\n=== Extraction Complete ===\n');
  console.log(`Spells: ${uniqueSpells.length}`);
  console.log(`Monsters: ${uniqueMonsters.length}`);
  console.log(`Items: ${uniqueItems.length}`);
  console.log(`Feats: ${uniqueFeats.length}`);
  console.log(`Classes: ${uniqueClasses.length}`);
  console.log(`Subclasses: ${uniqueSubclasses.length}`);
  console.log(`Races: ${uniqueRaces.length}`);
}

function standardizeSource(filePath: string, baseDir: string): string {
  const relative = path.relative(baseDir, filePath);
  const dir = path.dirname(relative);
  const name = path.basename(relative, path.extname(relative));
  const cleanDir = dir.replace(/\\/g, '/').replace(/^\.\//, '');
  if (cleanDir && cleanDir !== '.') {
    return `${cleanDir}/${name}`;
  }
  return name;
}

function removeDuplicates(items: Array<Record<string, unknown>>, nameKey: string, sourceKey: string): Array<Record<string, unknown>> {
  const seen = new Set<string>();
  return items.filter(item => {
    const name = (item[nameKey] as string) || '';
    const source = (item[sourceKey] as string) || '';
    const key = `${name}::${source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'Downloads';
  const outputDir = args[1] || 'data/free5e/processed';
  
  extractFromPDFs({ inputDir, outputDir }).catch(console.error);
}

