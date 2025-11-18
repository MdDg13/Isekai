/**
 * Enhanced Content Extractor
 * Extracts classes, subclasses, races, feats, and complete monster data
 * Includes all special attacks, legendary actions, lair actions, and reactions
 */

import * as fs from 'fs';
import * as path from 'path';
import { normalizeItemCost } from './cost-normalizer';
import { processItemWeightAndVolume, calculateConfidence } from './weight-and-volume-estimator';

interface ExtractOptions {
  inputDir: string;
  outputDir: string;
}

/**
 * Parse classes with complete data
 */
function parseClasses(text: string, source: string): Array<Record<string, unknown>> {
  const classes: Array<Record<string, unknown>> = [];
  
  // Pattern: ## Class Name with structured sections
  const classPattern = /##\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Class|Hit\s+Dice|Proficiencies)/gi;
  
  let match;
  while ((match = classPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Extract full class block
      const blockStart = match.index;
      const nextClass = text.substring(blockStart + match[0].length).search(/\n##\s+[A-Z]/);
      const classBlock = nextClass > 0 ? text.substring(blockStart, blockStart + nextClass) : text.substring(blockStart, blockStart + 5000);
      
      // Extract hit dice
      const hitDiceMatch = classBlock.match(/\*\*Hit\s+Dice:\*\*\s*(\d+d\d+)/i);
      const hitDice = hitDiceMatch ? hitDiceMatch[1] : null;
      
      // Extract hit points at 1st level
      const hp1stMatch = classBlock.match(/\*\*Hit\s+Points\s+at\s+1st\s+Level:\*\*\s*([^\n]+)/i);
      const hp1st = hp1stMatch ? hp1stMatch[1].trim() : null;
      
      // Extract hit points at higher levels
      const hpHigherMatch = classBlock.match(/\*\*Hit\s+Points\s+at\s+Higher\s+Levels:\*\*\s*([^\n]+)/i);
      const hpHigher = hpHigherMatch ? hpHigherMatch[1].trim() : null;
      
      // Extract proficiencies (complex - may need refinement)
      const proficiencies: Record<string, unknown> = {
        armor: [],
        weapons: [],
        tools: [],
        saving_throws: [],
        skills: { choose: 0, from: [] }
      };
      
      const armorMatch = classBlock.match(/\*\*Armor:\*\*\s*([^\n]+)/i);
      if (armorMatch) {
        proficiencies.armor = armorMatch[1].split(',').map(s => s.trim());
      }
      
      const weaponsMatch = classBlock.match(/\*\*Weapons:\*\*\s*([^\n]+)/i);
      if (weaponsMatch) {
        proficiencies.weapons = weaponsMatch[1].split(',').map(s => s.trim());
      }
      
      const savesMatch = classBlock.match(/\*\*Saving\s+Throws:\*\*\s*([^\n]+)/i);
      if (savesMatch) {
        proficiencies.saving_throws = savesMatch[1].split(',').map(s => s.trim().toLowerCase());
      }
      
      // Extract class features (array of {level, name, description})
      const features: Array<{ level: number; name: string; description: string }> = [];
      const featurePattern = /\*\*(\d+)(?:st|nd|rd|th)\s+Level[:\s]+([^\n]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*\d+)[^\n]+)*)/gi;
      let featureMatch;
      while ((featureMatch = featurePattern.exec(classBlock)) !== null) {
        features.push({
          level: parseInt(featureMatch[1]),
          name: featureMatch[2]?.trim() || 'Feature',
          description: featureMatch[3]?.trim() || ''
        });
      }
      
      // Extract spellcasting info if present
      const spellcastingMatch = classBlock.match(/\*\*Spellcasting\*\*/i);
      const spellcasting = spellcastingMatch ? {
        ability: classBlock.match(/\*\*Spellcasting\s+Ability:\*\*\s*([^\n]+)/i)?.[1]?.trim().toLowerCase() || null,
        spell_save_dc: classBlock.match(/\*\*Spell\s+Save\s+DC\s*[=:]\s*([^\n]+)/i)?.[1]?.trim() || null,
        spell_attack_modifier: classBlock.match(/\*\*Spell\s+Attack\s+Modifier\s*[=:]\s*([^\n]+)/i)?.[1]?.trim() || null,
      } : null;
      
      if (name && hitDice && hp1st) {
        // Calculate confidence for class
        const classConfidence = calculateConfidence(
          false, // weight not applicable
          false, // cost not applicable
          classBlock.length > 100,
          classBlock.length,
          features.length > 0,
          'class'
        );
        
        classes.push({
          name: name,
          hit_dice: hitDice,
          hit_points_at_1st_level: hp1st,
          hit_points_at_higher_levels: hpHigher,
          proficiencies: proficiencies,
          class_features: features.length > 0 ? features : null,
          spellcasting: spellcasting,
          extraction_confidence_score: classConfidence,
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return classes;
}

/**
 * Parse subclasses with complete data
 */
function parseSubclasses(text: string, source: string): Array<Record<string, unknown>> {
  const subclasses: Array<Record<string, unknown>> = [];
  
  // Pattern: ### Subclass Name or ## Subclass Name (Parent Class)
  const subclassPattern = /(?:###|##)\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*(?:\(([A-Z][A-Za-z\s]+)\))?/gi;
  
  let match;
  while ((match = subclassPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      const parentClass = match[2]?.trim() || null;
      if (!name || name.length < 3) continue;
      
      // Extract full subclass block
      const blockStart = match.index;
      const nextSubclass = text.substring(blockStart + match[0].length).search(/\n(?:###|##)\s+[A-Z]/);
      const subclassBlock = nextSubclass > 0 ? text.substring(blockStart, blockStart + match[0].length + nextSubclass) : text.substring(blockStart, blockStart + 3000);
      
      // Extract features
      const features: Array<{ level: number; name: string; description: string }> = [];
      const featurePattern = /\*\*(\d+)(?:st|nd|rd|th)\s+Level[:\s]+([^\n]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*\d+)[^\n]+)*)/gi;
      let featureMatch;
      while ((featureMatch = featurePattern.exec(subclassBlock)) !== null) {
        features.push({
          level: parseInt(featureMatch[1]),
          name: featureMatch[2]?.trim() || 'Feature',
          description: featureMatch[3]?.trim() || ''
        });
      }
      
      if (name && features.length > 0) {
        const subclassConfidence = calculateConfidence(
          false,
          false,
          subclassBlock.length > 100,
          subclassBlock.length,
          features.length > 0,
          'subclass'
        );
        
        subclasses.push({
          name: name,
          parent_class: parentClass,
          level_granted: features[0]?.level || 2,
          description: subclassBlock.substring(0, 500).trim(),
          features: features,
          extraction_confidence_score: subclassConfidence,
          source: source,
        });
      }
    } catch {
      continue;
    }
  }
  
  return subclasses;
}

/**
 * Parse races with complete data
 */
function parseRaces(text: string, source: string): Array<Record<string, unknown>> {
  const races: Array<Record<string, unknown>> = [];
  
  // Pattern: ## Race Name
  const racePattern = /##\s+([A-Z][A-Za-z\s'-]{3,50}?)\s*\n\s*(?:Race|Size|Speed)/gi;
  
  let match;
  while ((match = racePattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Extract full race block
      const blockStart = match.index;
      const nextRace = text.substring(blockStart + match[0].length).search(/\n##\s+[A-Z]/);
      const raceBlock = nextRace > 0 ? text.substring(blockStart, blockStart + nextRace) : text.substring(blockStart, blockStart + 3000);
      
      // Extract size
      const sizeMatch = raceBlock.match(/\*\*Size:\*\*\s*([^\n]+)/i);
      const size = sizeMatch ? sizeMatch[1].trim() : 'Medium';
      
      // Extract speed
      const speedMatch = raceBlock.match(/\*\*Speed:\*\*\s*(\d+)/i);
      const speed = speedMatch ? parseInt(speedMatch[1]) : 30;
      
      // Extract ability score increases
      const asiMatch = raceBlock.match(/\*\*Ability\s+Score\s+Increase:\*\*\s*([^\n]+)/i);
      const abilityIncreases: Record<string, number> = {};
      if (asiMatch) {
        const asiText = asiMatch[1];
        // Parse patterns like "Your Strength score increases by 2" or "You can increase one ability score by 2 and another by 1"
        const fixedMatch = asiText.match(/(?:Your\s+)?(\w+)\s+score\s+increases?\s+by\s+(\d+)/i);
        if (fixedMatch) {
          const stat = fixedMatch[1].toLowerCase().substring(0, 3);
          abilityIncreases[stat] = parseInt(fixedMatch[2]);
        }
      }
      
      // Extract traits
      const traits: Array<{ name: string; description: string }> = [];
      const traitPattern = /\*\*([A-Z][^\n*]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
      let traitMatch;
      while ((traitMatch = traitPattern.exec(raceBlock)) !== null) {
        if (!traitMatch[1].match(/(Size|Speed|Ability|Languages?|Subraces?)/i)) {
          traits.push({
            name: traitMatch[1].trim(),
            description: traitMatch[2].trim()
          });
        }
      }
      
      // Extract languages
      const languagesMatch = raceBlock.match(/\*\*Languages?:\*\*\s*([^\n]+)/i);
      const languages = languagesMatch ? languagesMatch[1].split(',').map(s => s.trim()) : [];
      
      // Extract subraces
      const subraces: Array<Record<string, unknown>> = [];
      const subracePattern = /\*\*([A-Z][A-Za-z\s]+)\s+(?:Elf|Dwarf|Halfling|etc\.)\*\*/gi;
      // This is simplified - actual subrace extraction would be more complex
      
      if (name && size && speed) {
        const raceConfidence = calculateConfidence(
          false,
          false,
          raceBlock.length > 100,
          raceBlock.length,
          traits.length > 0,
          'race'
        );
        
        races.push({
          name: name,
          size: size,
          speed: speed,
          ability_score_increases: Object.keys(abilityIncreases).length > 0 ? abilityIncreases : { choose: 1, from: ['str', 'dex', 'con', 'int', 'wis', 'cha'] },
          traits: traits.length > 0 ? traits : null,
          languages: languages,
          subraces: subraces.length > 0 ? subraces : null,
          extraction_confidence_score: raceConfidence,
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
 * Parse feats with complete data
 */
function parseFeats(text: string, source: string): Array<Record<string, unknown>> {
  const feats: Array<Record<string, unknown>> = [];
  
  // Pattern: ## Feat Name or **Feat Name**
  const featPattern = /(?:##\s+|\*\*)([A-Z][A-Za-z\s'-]{3,50}?)(?:\*\*)?\s*(?:Feat)?/gi;
  
  let match;
  while ((match = featPattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name || name.length < 3) continue;
      
      // Extract full feat block
      const blockStart = match.index;
      const nextFeat = text.substring(blockStart + match[0].length).search(/\n(?:##|\*\*)[A-Z]/);
      const featBlock = nextFeat > 0 ? text.substring(blockStart, blockStart + nextFeat) : text.substring(blockStart, blockStart + 1000);
      
      // Extract prerequisites
      const prereqMatch = featBlock.match(/\*\*Prerequisite[s]?:\*\*\s*([^\n]+)/i);
      const prerequisites = prereqMatch ? prereqMatch[1].trim() : null;
      
      // Extract benefits/description
      const description = featBlock.replace(/^\*\*[^\n]+\*\*\s*\n\s*/i, '').trim();
      
      if (name && description.length > 20) {
        const featConfidence = calculateConfidence(
          false,
          false,
          description.length > 50,
          description.length,
          prerequisites !== null,
          'feat'
        );
        
        feats.push({
          name: name,
          prerequisites: prerequisites,
          benefits: description,
          description: description,
          extraction_confidence_score: featConfidence,
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
 * Enhanced monster parser - extracts all fields including traits, actions, legendary actions, reactions, lair actions
 */
function parseMonstersEnhanced(text: string, source: string): Array<Record<string, unknown>> {
  const monsters: Array<Record<string, unknown>> = [];
  
  // Pattern: ## Monster Name\nChallenge X\n...
  const pattern = /^##\s+([A-Z][^\n]+?)\s*\n\s*Challenge\s+([\d./]+)\s*\n\s*([^\n]+)\s*\n\s*\*\*AC\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*HP\s+\*\*\s*(\d+)(?:\s*\(([^)]+)\))?\s*\n\s*\*\*Speed\s+\*\*\s*([^\n]+)\s*\n/gm;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    try {
      const name = match[1]?.trim();
      if (!name) continue;
      
      // Extract full monster block
      const blockStart = match.index;
      const nextMonster = text.substring(blockStart).search(/\n##\s+[A-Z]/);
      const monsterBlock = nextMonster > 0 ? text.substring(blockStart, blockStart + nextMonster) : text.substring(blockStart, blockStart + 5000);
      
      // Parse speed JSON
      const speedText = match[8]?.trim() || '30 ft';
      const speed: Record<string, number> = {};
      const speedMatches = speedText.match(/(\w+)\s+(\d+)/g);
      if (speedMatches) {
        for (const speedMatch of speedMatches) {
          const parts = speedMatch.match(/(\w+)\s+(\d+)/);
          if (parts) {
            speed[parts[1]] = parseInt(parts[2]);
          }
        }
      } else {
        speed.walk = parseInt(speedText.match(/(\d+)/)?.[1] || '30');
      }
      
      // Extract stats
      const statsMatch = monsterBlock.match(/\*\*STR\s+\*\*\s*(\d+)\s*\*\*DEX\s+\*\*\s*(\d+)\s*\*\*CON\s+\*\*\s*(\d+)\s*\*\*INT\s+\*\*\s*(\d+)\s*\*\*WIS\s+\*\*\s*(\d+)\s*\*\*CHA\s+\*\*\s*(\d+)/i);
      const stats = statsMatch ? {
        str: parseInt(statsMatch[1]),
        dex: parseInt(statsMatch[2]),
        con: parseInt(statsMatch[3]),
        int: parseInt(statsMatch[4]),
        wis: parseInt(statsMatch[5]),
        cha: parseInt(statsMatch[6])
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      
      // Extract saving throws
      const savesMatch = monsterBlock.match(/\*\*Saving\s+Throws:\*\*\s*([^\n]+)/i);
      const saving_throws: Record<string, string> = {};
      if (savesMatch) {
        const savesText = savesMatch[1];
        const saveMatches = savesText.match(/(\w+)\s+([+-]?\d+)/g);
        if (saveMatches) {
          for (const saveMatch of saveMatches) {
            const parts = saveMatch.match(/(\w+)\s+([+-]?\d+)/);
            if (parts) {
              saving_throws[parts[1].toLowerCase().substring(0, 3)] = parts[2];
            }
          }
        }
      }
      
      // Extract skills
      const skillsMatch = monsterBlock.match(/\*\*Skills:\*\*\s*([^\n]+)/i);
      const skills: Record<string, string> = {};
      if (skillsMatch) {
        const skillsText = skillsMatch[1];
        const skillMatches = skillsText.match(/(\w+)\s+([+-]?\d+)/g);
        if (skillMatches) {
          for (const skillMatch of skillMatches) {
            const parts = skillMatch.match(/(\w+)\s+([+-]?\d+)/);
            if (parts) {
              skills[parts[1].toLowerCase()] = parts[2];
            }
          }
        }
      }
      
      // Extract damage resistances/immunities
      const resistMatch = monsterBlock.match(/\*\*Damage\s+Resistances:\*\*\s*([^\n]+)/i);
      const damage_resistances = resistMatch ? resistMatch[1].split(',').map(s => s.trim()) : [];
      
      const immuneMatch = monsterBlock.match(/\*\*Damage\s+Immunities:\*\*\s*([^\n]+)/i);
      const damage_immunities = immuneMatch ? immuneMatch[1].split(',').map(s => s.trim()) : [];
      
      const condImmuneMatch = monsterBlock.match(/\*\*Condition\s+Immunities:\*\*\s*([^\n]+)/i);
      const condition_immunities = condImmuneMatch ? condImmuneMatch[1].split(',').map(s => s.trim()) : [];
      
      // Extract senses
      const sensesMatch = monsterBlock.match(/\*\*Senses:\*\*\s*([^\n]+)/i);
      const senses = sensesMatch ? sensesMatch[1].trim() : null;
      
      // Extract languages
      const langMatch = monsterBlock.match(/\*\*Languages:\*\*\s*([^\n]+)/i);
      const languages = langMatch ? langMatch[1].trim() : null;
      
      // Extract XP
      const xpMatch = monsterBlock.match(/\*\*XP:\*\*\s*(\d+)/i);
      const xp = xpMatch ? parseInt(xpMatch[1]) : null;
      
      // Extract traits
      const traits: Array<{ name: string; description: string }> = [];
      const traitSection = monsterBlock.match(/\*\*Traits?\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*Actions?)[^\n]+)*)/i);
      if (traitSection) {
        const traitPattern = /\*\*([^\n*]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
        let traitMatch;
        while ((traitMatch = traitPattern.exec(traitSection[1])) !== null) {
          traits.push({
            name: traitMatch[1].trim(),
            description: traitMatch[2].trim()
          });
        }
      }
      
      // Extract actions
      const actions: Array<{ name: string; description: string; attack_bonus: number | null; damage: string | null }> = [];
      const actionSection = monsterBlock.match(/\*\*Actions?\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*Legendary)[^\n]+)*)/i);
      if (actionSection) {
        const actionPattern = /\*\*([^\n*]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
        let actionMatch;
        while ((actionMatch = actionPattern.exec(actionSection[1])) !== null) {
          const actionName = actionMatch[1].trim();
          const actionDesc = actionMatch[2].trim();
          
          // Extract attack bonus and damage
          const attackMatch = actionDesc.match(/\+(\d+)\s+to\s+hit/i);
          const attack_bonus = attackMatch ? parseInt(attackMatch[1]) : null;
          
          const damageMatch = actionDesc.match(/(\d+d\d+[^\s]*)/i);
          const damage = damageMatch ? damageMatch[1] : null;
          
          actions.push({
            name: actionName,
            description: actionDesc,
            attack_bonus: attack_bonus,
            damage: damage
          });
        }
      }
      
      // Extract legendary actions
      const legendaryActions: Array<{ name: string; description: string; cost: number }> = [];
      const legendarySection = monsterBlock.match(/\*\*Legendary\s+Actions?\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*Lair)[^\n]+)*)/i);
      if (legendarySection) {
        const legendaryPattern = /\*\*([^\n*]+?)\s*\(Costs?\s+(\d+)\s+Actions?\)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/gi;
        let legendaryMatch;
        while ((legendaryMatch = legendaryPattern.exec(legendarySection[1])) !== null) {
          legendaryActions.push({
            name: legendaryMatch[1].trim(),
            description: legendaryMatch[3].trim(),
            cost: parseInt(legendaryMatch[2])
          });
        }
      }
      
      // Extract reactions
      const reactions: Array<{ name: string; description: string }> = [];
      const reactionSection = monsterBlock.match(/\*\*Reactions?\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      if (reactionSection) {
        const reactionPattern = /\*\*([^\n*]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
        let reactionMatch;
        while ((reactionMatch = reactionPattern.exec(reactionSection[1])) !== null) {
          reactions.push({
            name: reactionMatch[1].trim(),
            description: reactionMatch[2].trim()
          });
        }
      }
      
      // Extract lair actions (if present)
      const lairActions: Array<{ name: string; description: string }> = [];
      const lairSection = monsterBlock.match(/\*\*Lair\s+Actions?\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      if (lairSection) {
        const lairPattern = /\*\*([^\n*]+?)\*\*\s*\n\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
        let lairMatch;
        while ((lairMatch = lairPattern.exec(lairSection[1])) !== null) {
          lairActions.push({
            name: lairMatch[1].trim(),
            description: lairMatch[2].trim()
          });
        }
      }
      
      const cr = parseFloat(match[2]?.trim() || '0');
      const sizeType = match[3]?.trim() || 'Medium beast';
      const size = sizeType.split(/\s+/)[0]?.toLowerCase() || 'medium';
      const type = sizeType.split(/\s+/).slice(1).join(' ') || 'beast';
      
      // Calculate confidence for monster
      const monsterConfidence = calculateConfidence(
        false, // weight not applicable
        false, // cost not applicable
        monsterBlock.length > 200,
        monsterBlock.length,
        traits.length > 0 || actions.length > 0,
        'monster'
      );
      
      monsters.push({
        name: name,
        size: size,
        type: type,
        alignment: null, // Extract if available
        armor_class: parseInt(match[4]) || 10,
        armor_class_type: match[5] || null,
        hit_points: parseInt(match[6]) || 1,
        hit_dice: match[7] || null,
        speed: speed,
        stats: stats,
        saving_throws: Object.keys(saving_throws).length > 0 ? saving_throws : null,
        skills: Object.keys(skills).length > 0 ? skills : null,
        damage_resistances: damage_resistances.length > 0 ? damage_resistances : null,
        damage_immunities: damage_immunities.length > 0 ? damage_immunities : null,
        condition_immunities: condition_immunities.length > 0 ? condition_immunities : null,
        senses: senses,
        languages: languages,
        challenge_rating: cr,
        xp: xp,
        traits: traits.length > 0 ? traits : null,
        actions: actions.length > 0 ? actions : null,
        legendary_actions: legendaryActions.length > 0 ? legendaryActions : null,
        reactions: reactions.length > 0 ? reactions : null,
        lair_actions: lairActions.length > 0 ? lairActions : null, // Note: May need schema update
        extraction_confidence_score: monsterConfidence,
        source: source,
      });
    } catch {
      continue;
    }
  }
  
  return monsters;
}

/**
 * Enhanced item parser - handles all item types comprehensively
 */
function parseItemsEnhanced(text: string, source: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  
  // Pattern 1: **Item Name**\nCost: X gp\n...
  const pattern1 = /\*\*([A-Z][A-Za-z\s'-]{2,50}?)\*\*\s*\n\s*(?:Cost|Price)[:\s]+([^\n]+?)\s*(?:gp|GP)?/gi;
  
  // Pattern 2: ## Item Name (for magic items)
  const pattern2 = /##\s+([A-Z][A-Za-z\s'-]{2,50}?)\s*(?:\(([^)]+)\))?/gi;
  
  const patterns = [pattern1, pattern2];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const name = match[1]?.trim();
        if (!name || name.length < 2) continue;
        
        // Extract item block
        const blockStart = match.index;
        const nextItem = text.substring(blockStart).search(/\n(?:##|\*\*)[A-Z]/);
        const itemBlock = nextItem > 0 ? text.substring(blockStart, blockStart + nextItem) : text.substring(blockStart, blockStart + 1000);
        
        // Determine item kind
        const lowerName = name.toLowerCase();
        const lowerBlock = itemBlock.toLowerCase();
        let kind = 'other';
        let category: string | null = null;
        let rarity: string | null = null;
        
        // Check for magic items
        if (lowerBlock.includes('requires attunement') || lowerBlock.includes('rarity:') || lowerBlock.match(/\+\d+\s+(weapon|armor)/i)) {
          kind = 'magic_item';
          const rarityMatch = itemBlock.match(/\*\*Rarity:\*\*\s*([^\n]+)/i) || itemBlock.match(/Rarity[:\s]+([^\n]+)/i);
          rarity = rarityMatch ? rarityMatch[1].trim().toLowerCase() : null;
        } else if (lowerName.match(/\b(potion|elixir|philter)\b/)) {
          kind = 'consumable';
          category = 'potion';
        } else if (lowerName.match(/\b(poison|venom)\b/) || lowerBlock.includes('constitution saving throw') && lowerBlock.includes('poison')) {
          kind = 'consumable';
          category = 'poison';
        } else if (lowerName.match(/\b(sword|axe|mace|dagger|spear|bow|crossbow|whip|flail|halberd|rapier|scimitar|weapon)\b/)) {
          kind = 'weapon';
          if (lowerName.match(/\b(martial|simple)\b/)) {
            category = lowerName.includes('martial') ? 'martial_melee' : 'simple_melee';
          }
        } else if (lowerName.match(/\b(armor|plate|mail|leather|shield|helmet|gauntlet)\b/)) {
          kind = 'armor';
          if (lowerName.match(/\b(light|medium|heavy)\b/)) {
            category = `${lowerName.match(/\b(light|medium|heavy)\b/i)?.[0]?.toLowerCase()}_armor`;
          }
        } else if (lowerName.match(/\b(tool|kit|set|pack|bag|pouch|backpack)\b/)) {
          kind = 'tool';
        } else if (lowerBlock.includes('spell component') || lowerBlock.includes('material component')) {
          kind = 'consumable';
          category = 'spell_component';
        }
        
        // Extract cost
        const costMatch = itemBlock.match(/(?:Cost|Price)[:\s]+([^\n]+?)\s*(?:gp|GP)?/i);
        let cost_gp: number | null = null;
        if (costMatch) {
          const costStr = costMatch[1].trim();
          const numMatch = costStr.match(/([\d,.]+)/);
          if (numMatch) {
            cost_gp = parseFloat(numMatch[1].replace(/,/g, ''));
          }
        }
        
        // Normalize cost using cost normalizer
        const normalized = normalizeItemCost({ name, kind, rarity, cost_gp });
        cost_gp = normalized.cost_gp;
        
        // Extract weight
        const weightMatch = itemBlock.match(/Weight[:\s]+([^\n]+?)\s*(?:lb|LB)?/i);
        let weight_lb: number | null = null;
        if (weightMatch) {
          const weightStr = weightMatch[1].match(/([\d.]+)/);
          if (weightStr) weight_lb = parseFloat(weightStr[1]);
        }
        
        // Extract description (before using it)
        let description = itemBlock.substring(match[0].length).trim();
        // Remove cost/weight/properties from description
        description = description.replace(/(?:Cost|Price|Weight|Rarity|Properties?)[:\s]+[^\n]+/gi, '').trim();
        
        // Extract properties
        const properties: Record<string, unknown> = {};
        if (itemBlock.match(/\b(finesse|versatile|two-handed|light|heavy|reach|thrown)\b/i)) {
          const versatileMatch = itemBlock.match(/versatile\s+(\d+d\d+)/i);
          if (versatileMatch) properties.versatile = versatileMatch[1];
          if (itemBlock.match(/\bfinesse\b/i)) properties.finesse = true;
          if (itemBlock.match(/\btwo-handed\b/i)) properties.two_handed = true;
          if (itemBlock.match(/\blight\b/i)) properties.light = true;
          if (itemBlock.match(/\bheavy\b/i)) properties.heavy = true;
          if (itemBlock.match(/\breach\b/i)) properties.reach = true;
          if (itemBlock.match(/\bthrown\b/i)) properties.thrown = true;
        }
        
        // Extract attunement
        const attunement = itemBlock.match(/\brequires?\s+attunement\b/i) !== null;
        const attunementReqMatch = itemBlock.match(/attunement\s+(?:by\s+)?([^\n.]+)/i);
        const attunement_requirements = attunementReqMatch ? attunementReqMatch[1].trim() : null;
        
        // Process weight and volume (description already extracted above)
        const weightVolume = processItemWeightAndVolume({
          name,
          kind,
          description,
          weight_lb
        });
        
        // Calculate extraction confidence
        const extraction_confidence_score = calculateConfidence(
          weight_lb !== null && weight_lb > 0,
          cost_gp !== null && cost_gp > 0,
          description.length > 0,
          description.length,
          Object.keys(properties).length > 0,
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
            properties: Object.keys(properties).length > 0 ? properties : null,
            attunement: attunement,
            attunement_requirements: attunement_requirements,
            extraction_confidence_score: extraction_confidence_score,
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
 * Main extraction function
 */
async function extractEnhancedContent(options: ExtractOptions) {
  const { inputDir, outputDir } = options;
  
  console.log('\n=== Enhanced Content Extraction ===\n');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`);
    return;
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all files
  const allFiles = getAllFiles(inputDir, ['.pdf', '.md', '.txt', '.html']);
  
  const allClasses: Array<Record<string, unknown>> = [];
  const allSubclasses: Array<Record<string, unknown>> = [];
  const allRaces: Array<Record<string, unknown>> = [];
  const allFeats: Array<Record<string, unknown>> = [];
  const allMonsters: Array<Record<string, unknown>> = [];
  const allItems: Array<Record<string, unknown>> = [];
  
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    console.log(`Processing: ${fileName}`);
    
    try {
      const text = await extractTextFromFile(filePath);
      if (text.length < 100) continue;
      
      const source = standardizeSource(filePath, inputDir);
      
      // Parse all content types
      const classes = parseClasses(text, source);
      const subclasses = parseSubclasses(text, source);
      const races = parseRaces(text, source);
      const feats = parseFeats(text, source);
      const monsters = parseMonstersEnhanced(text, source);
      const items = parseItemsEnhanced(text, source);
      
      allClasses.push(...classes);
      allSubclasses.push(...subclasses);
      allRaces.push(...races);
      allFeats.push(...feats);
      allMonsters.push(...monsters);
      allItems.push(...items);
      
      if (classes.length > 0 || subclasses.length > 0 || races.length > 0 || feats.length > 0 || monsters.length > 0 || items.length > 0) {
        console.log(`  Found: ${classes.length} classes, ${subclasses.length} subclasses, ${races.length} races, ${feats.length} feats, ${monsters.length} monsters, ${items.length} items`);
      }
    } catch (error) {
      console.error(`  ERROR: ${error}`);
    }
  }
  
  // Remove duplicates
  const uniqueClasses = removeDuplicates(allClasses, 'name', 'source');
  const uniqueSubclasses = removeDuplicates(allSubclasses, 'name', 'source');
  const uniqueRaces = removeDuplicates(allRaces, 'name', 'source');
  const uniqueFeats = removeDuplicates(allFeats, 'name', 'source');
  const uniqueMonsters = removeDuplicates(allMonsters, 'name', 'source');
  const uniqueItems = removeDuplicates(allItems, 'name', 'source');
  
  // Save results
  fs.writeFileSync(path.join(outputDir, 'classes-extracted.json'), JSON.stringify(uniqueClasses, null, 2));
  fs.writeFileSync(path.join(outputDir, 'subclasses-extracted.json'), JSON.stringify(uniqueSubclasses, null, 2));
  fs.writeFileSync(path.join(outputDir, 'races-extracted.json'), JSON.stringify(uniqueRaces, null, 2));
  fs.writeFileSync(path.join(outputDir, 'feats-extracted.json'), JSON.stringify(uniqueFeats, null, 2));
  fs.writeFileSync(path.join(outputDir, 'monsters-enhanced.json'), JSON.stringify(uniqueMonsters, null, 2));
  fs.writeFileSync(path.join(outputDir, 'items-enhanced.json'), JSON.stringify(uniqueItems, null, 2));
  
  console.log('\n=== Extraction Complete ===\n');
  console.log(`Classes: ${uniqueClasses.length}`);
  console.log(`Subclasses: ${uniqueSubclasses.length}`);
  console.log(`Races: ${uniqueRaces.length}`);
  console.log(`Feats: ${uniqueFeats.length}`);
  console.log(`Monsters: ${uniqueMonsters.length}`);
  console.log(`Items: ${uniqueItems.length}`);
}

// Helper functions (reuse from extract-all-content.ts)
function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
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
      console.log(`  PDF parsing not available: ${path.basename(filePath)}`);
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

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    return await extractPDFText(filePath);
  } else if (ext === '.md' || ext === '.txt' || ext === '.html') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'Downloads';
  const outputDir = args[1] || 'data/free5e/processed';
  
  extractEnhancedContent({ inputDir, outputDir }).catch(console.error);
}

