/**
 * Procedural NPC Generation Engine
 * Generates diverse, logical NPCs using weighted tables and procedural logic
 */

import { npcTables, type NPCTables, type Background, type NPCClass } from './npc-tables';

export interface GenerateNPCOptions {
  nameHint?: string;
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  temperament?: string;
  fullyRandom?: boolean;
}

export interface GeneratedNPC {
  name: string;
  bio: string;
  backstory: string;
  traits: {
    race: string;
    temperament: string;
    personalityTraits: string[];
    ideal: string;
    bond: string;
    flaw: string;
    background: string;
    class: string;
    keywords: string[];
  };
  stats: {
    level: number;
    abilities: {
      str: number;
      dex: number;
      con: number;
      int: number;
      wis: number;
      cha: number;
    };
    equipment: string;
  };
}

// Race weights (commonality in fantasy settings)
const raceWeights: Record<string, number> = {
  human: 40,
  elf: 15,
  dwarf: 12,
  halfling: 10,
  orc: 8,
  tiefling: 5,
  dragonborn: 5,
  gnome: 5
};

// Class weights (commonality in settlements)
const classWeights: Record<string, number> = {
  Commoner: 30,
  Guard: 15,
  Merchant: 12,
  Scholar: 10,
  Warrior: 10,
  Noble: 8,
  Spellcaster: 7,
  Rogue: 4,
  Ranger: 2,
  Cleric: 2
};

/**
 * Weighted random selection from array
 */
function weightedRandom<T>(items: T[], weights?: number[]): T {
  if (!weights || weights.length !== items.length) {
    return items[Math.floor(Math.random() * items.length)];
  }
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Select random item from array
 */
function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Select multiple unique random items
 */
function randomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

/**
 * Generate name from race-specific tables
 */
function generateName(race: string, nameHint?: string): string {
  if (nameHint && nameHint.trim()) {
    return nameHint.trim();
  }

  const raceKey = race.toLowerCase();
  const nameTable = npcTables.names[raceKey];
  
  if (!nameTable) {
    // Fallback to human names
    const humanTable = npcTables.names.human;
    return `${randomItem(humanTable.first)} ${randomItem(humanTable.last)}`;
  }

  const firstName = randomItem(nameTable.first);
  const lastName = randomItem(nameTable.last);
  return `${firstName} ${lastName}`;
}

/**
 * Select race (weighted or specified)
 */
function selectRace(specifiedRace?: string): string {
  if (specifiedRace && npcTables.names[specifiedRace.toLowerCase()]) {
    return specifiedRace.toLowerCase();
  }
  
  const races = Object.keys(raceWeights);
  const weights = races.map(r => raceWeights[r]);
  return weightedRandom(races, weights);
}

/**
 * Select class/role (weighted or specified)
 */
function selectClass(specifiedClass?: string): NPCClass {
  if (specifiedClass) {
    const found = npcTables.classes.find(c => 
      c.name.toLowerCase() === specifiedClass.toLowerCase()
    );
    if (found) return found;
  }
  
  const classes = Object.keys(classWeights);
  const weights = classes.map(c => classWeights[c]);
  const selectedName = weightedRandom(classes, weights);
  return npcTables.classes.find(c => c.name === selectedName) || npcTables.classes[0];
}

/**
 * Select background (with class alignment)
 */
function selectBackground(npcClass: NPCClass, specifiedBackground?: string): Background {
  if (specifiedBackground) {
    const found = npcTables.backgrounds.find(b => 
      b.name.toLowerCase() === specifiedBackground.toLowerCase()
    );
    if (found) return found;
  }

  // Some backgrounds align better with certain classes
  const classBackgroundMap: Record<string, string[]> = {
    'Commoner': ['Folk Hero', 'Urchin', 'Guild Artisan'],
    'Guard': ['Soldier', 'Criminal'],
    'Noble': ['Noble', 'Acolyte'],
    'Merchant': ['Guild Artisan', 'Merchant'],
    'Scholar': ['Sage', 'Hermit', 'Acolyte'],
    'Warrior': ['Soldier', 'Folk Hero'],
    'Spellcaster': ['Sage', 'Hermit', 'Acolyte'],
    'Rogue': ['Criminal', 'Charlatan', 'Urchin'],
    'Ranger': ['Outlander', 'Folk Hero'],
    'Cleric': ['Acolyte', 'Hermit']
  };

  const preferred = classBackgroundMap[npcClass.name] || [];
  if (preferred.length > 0 && Math.random() < 0.6) {
    const preferredBg = npcTables.backgrounds.find(b => 
      preferred.includes(b.name)
    );
    if (preferredBg) return preferredBg;
  }

  return randomItem(npcTables.backgrounds);
}

/**
 * Generate stats based on class and level
 */
function generateStats(npcClass: NPCClass, level: number): { str: number; dex: number; con: number; int: number; wis: number; cha: number } {
  const baseStats: { str: number; dex: number; con: number; int: number; wis: number; cha: number } = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
  };

  // Base stat roll (8-15 for NPCs)
  const rollStat = () => 8 + Math.floor(Math.random() * 8);

  // Set base stats
  Object.keys(baseStats).forEach(stat => {
    baseStats[stat] = rollStat();
  });

  // Boost stats based on class priorities
  npcClass.statPriorities.forEach(stat => {
    baseStats[stat] = Math.max(baseStats[stat], 13 + Math.floor(Math.random() * 3));
  });

  // Level-based improvements (every 4 levels, +1 to primary stat)
  const levelBonus = Math.floor(level / 4);
  if (npcClass.statPriorities.length > 0) {
    const primaryStat = npcClass.statPriorities[0];
    baseStats[primaryStat] += levelBonus;
  }

  return baseStats;
}

/**
 * Generate equipment based on class, level, and background
 */
function generateEquipment(npcClass: NPCClass, background: Background, level: number): string {
  // Start with class equipment
  let equipment = npcClass.equipment.slice();
  
  // Add background equipment
  equipment.push(...background.equipment);
  
  // Level-based improvements
  if (level >= 5) {
    equipment.push('Masterwork ' + equipment[0]);
  }
  if (level >= 10) {
    equipment.push('Magical ' + equipment[0]);
  }

  // Remove duplicates and format
  const unique = [...new Set(equipment)];
  return unique.slice(0, 5).join(', ');
}

/**
 * Generate personality traits
 */
function generatePersonality() {
  const traits = randomItems(npcTables.personalities.traits, 2);
  const ideal = randomItem(npcTables.personalities.ideals);
  const bond = randomItem(npcTables.personalities.bonds);
  const flaw = randomItem(npcTables.personalities.flaws);

  return {
    traits: traits.map(t => t.text),
    ideal: ideal.text,
    bond: bond.text,
    flaw: flaw.text
  };
}

/**
 * Generate backstory
 */
function generateBackstory(
  race: string,
  background: Background,
  npcClass: NPCClass,
  personality: ReturnType<typeof generatePersonality>
): string {
  const birthplace = randomItem(npcTables.birthplaces);
  const lifeEvent = randomItem(npcTables.lifeEvents);
  const motivation = randomItem(npcTables.motivations);
  const secret = Math.random() < 0.3 ? randomItem(npcTables.secrets) : null;

  const parts: string[] = [
    `Born in ${birthplace}, this ${race} grew up as a ${background.name.toLowerCase()}.`,
    `Their life was marked by ${lifeEvent}, which shaped who they are today.`,
    `They are driven by ${motivation}, and ${personality.bond.toLowerCase()}.`,
    `As a ${npcClass.name.toLowerCase()}, they have learned to ${personality.traits[0].toLowerCase()}.`
  ];

  if (secret) {
    parts.push(`They carry a secret: ${secret}.`);
  }

  return parts.join(' ');
}

/**
 * Generate bio (short description)
 */
function generateBio(
  race: string,
  temperament: string,
  npcClass: NPCClass,
  background: Background,
  personality: ReturnType<typeof generatePersonality>
): string {
  const keywords: string[] = [];
  
  // Add class-related keywords
  keywords.push(npcClass.name.toLowerCase());
  
  // Add background keywords
  if (background.personalityTendencies.length > 0) {
    keywords.push(randomItem(background.personalityTendencies));
  }
  
  // Add personality trait keywords
  if (personality.traits.length > 0) {
    const traitCategory = npcTables.personalities.traits.find(t => 
      t.text === personality.traits[0]
    )?.category || 'mysterious';
    keywords.push(traitCategory);
  }

  return `A ${temperament} ${race} ${npcClass.name.toLowerCase()} ${keywords.length > 0 ? `known for ${keywords.slice(0, 2).join(' and ')}` : 'with a storied past'}.`;
}

/**
 * Main generation function
 */
export function generateNPC(options: GenerateNPCOptions = {}): GeneratedNPC {
  const {
    nameHint,
    race: specifiedRace,
    class: specifiedClass,
    level = 0,
    background: specifiedBackground,
    temperament = 'neutral',
    fullyRandom = false
  } = options;

  // Select race
  const race = selectRace(specifiedRace);

  // Select class
  const npcClass = selectClass(specifiedClass);

  // Select background
  const background = selectBackground(npcClass, specifiedBackground);

  // Generate name
  const name = generateName(race, nameHint);

  // Generate personality
  const personality = generatePersonality();

  // Generate stats
  const abilities = generateStats(npcClass, level);

  // Generate equipment
  const equipment = generateEquipment(npcClass, background, level);

  // Generate backstory
  const backstory = generateBackstory(race, background, npcClass, personality);

  // Generate bio
  const bio = generateBio(race, temperament, npcClass, background, personality);

  // Compile keywords
  const keywords = [
    race,
    npcClass.name.toLowerCase(),
    background.name.toLowerCase(),
    ...personality.traits.map(t => {
      const trait = npcTables.personalities.traits.find(tr => tr.text === t);
      return trait?.category || '';
    }).filter(Boolean)
  ].slice(0, 5);

  return {
    name,
    bio,
    backstory,
    traits: {
      race,
      temperament,
      personalityTraits: personality.traits,
      ideal: personality.ideal,
      bond: personality.bond,
      flaw: personality.flaw,
      background: background.name,
      class: npcClass.name,
      keywords
    },
    stats: {
      level,
      abilities,
      equipment
    }
  };
}

