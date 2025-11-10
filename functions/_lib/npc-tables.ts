/**
 * NPC Generation Data Tables
 * Comprehensive tables for procedural NPC generation
 */

export interface NameTable {
  first: string[];
  last: string[];
}

export interface PersonalityTrait {
  text: string;
  category: string;
}

export interface Ideal {
  text: string;
  alignment: string;
}

export interface Bond {
  text: string;
  type: string;
}

export interface Flaw {
  text: string;
  severity: string;
}

export interface Background {
  name: string;
  skills: string[];
  equipment: string[];
  personalityTendencies: string[];
}

export interface NPCClass {
  name: string;
  statPriorities: string[];
  equipment: string[];
  typicalLevels: number[];
}

export interface NPCTables {
  names: Record<string, NameTable>;
  personalities: {
    traits: PersonalityTrait[];
    ideals: Ideal[];
    bonds: Bond[];
    flaws: Flaw[];
  };
  backgrounds: Background[];
  classes: NPCClass[];
  birthplaces: string[];
  lifeEvents: string[];
  motivations: string[];
  secrets: string[];
}

// Name tables by race
export const nameTables: Record<string, NameTable> = {
  human: {
    first: [
      'Aldric', 'Aria', 'Brenna', 'Cedric', 'Dara', 'Eamon', 'Fiona', 'Gareth',
      'Helena', 'Ivor', 'Jenna', 'Kael', 'Lara', 'Marcus', 'Nora', 'Owen',
      'Petra', 'Quinn', 'Rhea', 'Soren', 'Tara', 'Ulric', 'Vera', 'Wynn',
      'Yara', 'Zane', 'Alys', 'Bram', 'Cora', 'Dorian', 'Elara', 'Finn',
      'Gwen', 'Hugo', 'Iris', 'Jasper', 'Kira', 'Liam', 'Maya', 'Nolan',
      'Opal', 'Pax', 'Quinn', 'Raven', 'Sage', 'Tessa', 'Vex', 'Wren',
      'Yuki', 'Zara'
    ],
    last: [
      'Blackwood', 'Brightblade', 'Copperfield', 'Darkwater', 'Evergreen',
      'Fairwind', 'Goldleaf', 'Ironforge', 'Moonwhisper', 'Nightshade',
      'Oakheart', 'Palebrook', 'Quickfoot', 'Riversong', 'Silvermoon',
      'Stormcaller', 'Thornfield', 'Underhill', 'Vale', 'Whitehall',
      'Ashford', 'Briarwood', 'Crestfall', 'Dawnbringer', 'Elderwood',
      'Frosthold', 'Greymane', 'Holloway', 'Ironside', 'Jadevale',
      'Kingsley', 'Lightfoot', 'Meadowbrook', 'Northwood', 'Oakenheart',
      'Pinecrest', 'Quicksilver', 'Ravenwood', 'Shadowmere', 'Thornhill',
      'Valebrook', 'Westwood', 'Yarrow', 'Zephyr'
    ]
  },
  elf: {
    first: [
      'Aeliana', 'Baelen', 'Caelia', 'Daelen', 'Elandra', 'Faelan', 'Gaelen',
      'Haelia', 'Ilandra', 'Jaelen', 'Kaelia', 'Laeris', 'Maelis', 'Naelia',
      'Oraelis', 'Paelia', 'Qaelen', 'Raelis', 'Saelia', 'Taelen', 'Uraelis',
      'Vaelia', 'Waelen', 'Xaelis', 'Yaelia', 'Zaelen', 'Aeris', 'Braelis',
      'Craelia', 'Draelen', 'Eraelis', 'Fraelia', 'Graelis', 'Hraelis',
      'Iraelia', 'Jraelen', 'Kraelis', 'Lraelia', 'Mraelen', 'Nraelis',
      'Oraelia', 'Praelen', 'Qraelis', 'Rraelia', 'Sraelen', 'Traelis'
    ],
    last: [
      'Moonwhisper', 'Starweaver', 'Dawnblade', 'Nightwind', 'Silverleaf',
      'Goldensong', 'Brightwood', 'Shadowmere', 'Lightfoot', 'Darkbough',
      'Ironsong', 'Crystalwind', 'Frostblade', 'Fireheart', 'Stormcaller',
      'Thunderwood', 'Rainwhisper', 'Cloudsong', 'Skyblade', 'Earthsong',
      'Stonewhisper', 'Riverwind', 'Oceanblade', 'Forestsong', 'Meadowwhisper',
      'Valeblade', 'Hillwind', 'Mountainwhisper', 'Valleysong', 'Gladeblade'
    ]
  },
  dwarf: {
    first: [
      'Agnar', 'Borin', 'Cedric', 'Dorin', 'Erik', 'Fargrim', 'Gorin',
      'Haldor', 'Ivor', 'Jorin', 'Korin', 'Lorin', 'Magnar', 'Norin',
      'Orik', 'Porin', 'Qorin', 'Rorin', 'Sorin', 'Thorin', 'Urik',
      'Vorin', 'Worin', 'Xorin', 'Yorin', 'Zorin', 'Agnis', 'Brenna',
      'Dara', 'Eira', 'Fara', 'Gara', 'Hara', 'Ira', 'Jara', 'Kara',
      'Lara', 'Mara', 'Nara', 'Ora', 'Para', 'Qara', 'Rara', 'Sara',
      'Tara', 'Ura', 'Vara', 'Wara', 'Xara', 'Yara', 'Zara'
    ],
    last: [
      'Ironforge', 'Stonehammer', 'Goldbeard', 'Silveraxe', 'Bronzeblade',
      'Copperforge', 'Steelhammer', 'Ironbeard', 'Stoneaxe', 'Goldblade',
      'Silverforge', 'Bronzehammer', 'Copperbeard', 'Steelaxe', 'Ironblade',
      'Stoneforge', 'Goldhammer', 'Silverbeard', 'Bronzeaxe', 'Copperblade',
      'Steelforge', 'Ironhammer', 'Stonebeard', 'Goldaxe', 'Silverblade',
      'Bronzeforge', 'Copperhammer', 'Steelbeard', 'Ironaxe', 'Stoneblade',
      'Goldforge', 'Silverhammer', 'Bronzebeard', 'Copperaxe', 'Steelblade'
    ]
  },
  halfling: {
    first: [
      'Alton', 'Bella', 'Cora', 'Daisy', 'Ella', 'Finn', 'Ginny', 'Hugo',
      'Ivy', 'Jasper', 'Kira', 'Lily', 'Milo', 'Nora', 'Ollie', 'Pippa',
      'Quinn', 'Rosie', 'Sam', 'Tilly', 'Ursa', 'Vera', 'Willa', 'Xara',
      'Yara', 'Zara', 'Arlo', 'Bram', 'Cedric', 'Dorian', 'Eamon', 'Felix',
      'Gus', 'Hugo', 'Ivor', 'Jasper', 'Kael', 'Liam', 'Milo', 'Nolan',
      'Owen', 'Pax', 'Quinn', 'Rory', 'Sam', 'Toby', 'Ulf', 'Vex', 'Wynn',
      'Yuki', 'Zane'
    ],
    last: [
      'Goodbarrel', 'Underhill', 'Lightfoot', 'Greenbottle', 'Brownlock',
      'Goldworthy', 'Quickfoot', 'Fairweather', 'Brightbuckle', 'Warmheart',
      'Merryweather', 'Sweetwater', 'Honeywell', 'Appleblossom', 'Berrybush',
      'Meadowbrook', 'Riverbend', 'Hilltop', 'Valleyview', 'Sunnyvale',
      'Brightwood', 'Greenleaf', 'Goldleaf', 'Silverleaf', 'Copperleaf',
      'Bronzeleaf', 'Ironleaf', 'Steelleaf', 'Stoneleaf', 'Earthleaf'
    ]
  },
  orc: {
    first: [
      'Arok', 'Brak', 'Crok', 'Drok', 'Erok', 'Frok', 'Grok', 'Hrok',
      'Irok', 'Jrok', 'Krok', 'Lrok', 'Mrok', 'Nrok', 'Orok', 'Prok',
      'Qrok', 'Rrok', 'Srok', 'Trok', 'Urok', 'Vrok', 'Wrok', 'Xrok',
      'Yrok', 'Zrok', 'Agra', 'Braga', 'Craga', 'Draga', 'Egra', 'Fraga',
      'Graga', 'Hraga', 'Igra', 'Jraga', 'Kraga', 'Lraga', 'Mraga', 'Nraga',
      'Ogra', 'Praga', 'Qraga', 'Rraga', 'Sraga', 'Traga', 'Ugra', 'Vraga',
      'Wraga', 'Xraga', 'Yraga', 'Zraga'
    ],
    last: [
      'Ironjaw', 'Bloodaxe', 'Stonefist', 'Skullcrusher', 'Bonebreaker',
      'Gorefang', 'Deathblade', 'Warhammer', 'Battleaxe', 'Fierceclaw',
      'Rageheart', 'Brutalfist', 'Savageblade', 'Wildaxe', 'Feralclaw',
      'Thunderfist', 'Stormblade', 'Lightningaxe', 'Thunderclaw', 'Stormfist',
      'Ironfist', 'Steeljaw', 'Bronzefist', 'Copperjaw', 'Goldfist',
      'Silverjaw', 'Stonejaw', 'Rockfist', 'Earthjaw', 'Mountainfist'
    ]
  },
  tiefling: {
    first: [
      'Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon',
      'Leucis', 'Melech', 'Mordai', 'Pelaios', 'Skamos', 'Therai', 'Akta',
      'Bryseis', 'Criella', 'Damaia', 'Ea', 'Kallista', 'Lerissa', 'Makaria',
      'Nemeia', 'Orianna', 'Phelaia', 'Rieta', 'Soryth', 'Therai', 'Vadya',
      'Xara', 'Yara', 'Zara', 'Amon', 'Bael', 'Caim', 'Dagon', 'Eligos',
      'Furfur', 'Gremory', 'Haagenti', 'Ipos', 'Jezebeth', 'Kobal', 'Leraje',
      'Marbas', 'Naberius', 'Orobas', 'Paimon', 'Raum', 'Sabnock', 'Tannin',
      'Uvall', 'Vassago', 'Wormwood', 'Xaphan', 'Yax', 'Zaebos'
    ],
    last: [
      'Shadowborn', 'Darkflame', 'Nightwhisper', 'Soulfire', 'Bloodmoon',
      'Crimsonblade', 'Infernalheart', 'Demonclaw', 'Hellfire', 'Shadowblade',
      'Darkflame', 'Nightwhisper', 'Soulfire', 'Bloodmoon', 'Crimsonblade',
      'Infernalheart', 'Demonclaw', 'Hellfire', 'Shadowblade', 'Darkflame',
      'Nightwhisper', 'Soulfire', 'Bloodmoon', 'Crimsonblade', 'Infernalheart',
      'Demonclaw', 'Hellfire', 'Shadowblade', 'Darkflame', 'Nightwhisper'
    ]
  },
  dragonborn: {
    first: [
      'Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv',
      'Medrash', 'Mehen', 'Nadarr', 'Pandjed', 'Patrin', 'Rhogar', 'Shamash',
      'Shedinn', 'Tarhun', 'Torinn', 'Akra', 'Biri', 'Daar', 'Farideh',
      'Harann', 'Havilar', 'Jheri', 'Kava', 'Korinn', 'Mishann', 'Nala',
      'Perra', 'Raiann', 'Sora', 'Surina', 'Thava', 'Uadjit', 'Vex', 'Xara',
      'Yara', 'Zara', 'Amon', 'Bael', 'Caim', 'Dagon', 'Eligos', 'Furfur',
      'Gremory', 'Haagenti', 'Ipos', 'Jezebeth', 'Kobal', 'Leraje', 'Marbas',
      'Naberius', 'Orobas', 'Paimon', 'Raum', 'Sabnock', 'Tannin', 'Uvall',
      'Vassago', 'Wormwood', 'Xaphan', 'Yax', 'Zaebos'
    ],
    last: [
      'Flameheart', 'Stormclaw', 'Frostfang', 'Thunderwing', 'Lightningtail',
      'Firebreath', 'Iceclaw', 'Windwhisper', 'Earthshaker', 'Stoneheart',
      'Goldscale', 'Silverscale', 'Bronzescale', 'Copperscale', 'Ironscale',
      'Steelscale', 'Stonescale', 'Crystalscale', 'Diamondscale', 'Emeraldscale',
      'Sapphirescale', 'Rubyscale', 'Amberscale', 'Pearlscale', 'Opalscale',
      'Topazscale', 'Garnetscale', 'Jadescale', 'Quartzscale', 'Obsidianscale'
    ]
  },
  gnome: {
    first: [
      'Alston', 'Alvyn', 'Boddynock', 'Brocc', 'Burgell', 'Dimble', 'Eldon',
      'Erky', 'Fonkin', 'Frug', 'Gerbo', 'Gimble', 'Glim', 'Jebeddo', 'Kellen',
      'Namfoodle', 'Orryn', 'Roondar', 'Seebo', 'Sindri', 'Warryn', 'Wrenn',
      'Zook', 'Bimpnottin', 'Breena', 'Caramip', 'Carlin', 'Donella', 'Duvamil',
      'Ella', 'Ellyjobell', 'Ellywick', 'Lilli', 'Loopmottin', 'Lorilla', 'Mardnab',
      'Nissa', 'Nyx', 'Oda', 'Orla', 'Roywyn', 'Shamil', 'Tana', 'Waywocket',
      'Zanna', 'Zara', 'Amon', 'Bael', 'Caim', 'Dagon', 'Eligos', 'Furfur',
      'Gremory', 'Haagenti', 'Ipos', 'Jezebeth', 'Kobal', 'Leraje', 'Marbas',
      'Naberius', 'Orobas', 'Paimon', 'Raum', 'Sabnock', 'Tannin', 'Uvall',
      'Vassago', 'Wormwood', 'Xaphan', 'Yax', 'Zaebos'
    ],
    last: [
      'Beren', 'Daergel', 'Folkor', 'Garrick', 'Nackle', 'Murnig', 'Ningel',
      'Raulnor', 'Scheppen', 'Timbers', 'Turen', 'Bafflestone', 'Beren', 'Boondiggles',
      'Cobblelob', 'Daergel', 'Dunben', 'Eberhardt', 'Eldon', 'Erky', 'Fabblestabble',
      'Fellen', 'Folkor', 'Garrick', 'Gimble', 'Glim', 'Jebeddo', 'Kellen',
      'Namfoodle', 'Orryn', 'Roondar', 'Seebo', 'Sindri', 'Warryn', 'Wrenn',
      'Zook', 'Bimpnottin', 'Breena', 'Caramip', 'Carlin', 'Donella', 'Duvamil',
      'Ella', 'Ellyjobell', 'Ellywick', 'Lilli', 'Loopmottin', 'Lorilla', 'Mardnab',
      'Nissa', 'Nyx', 'Oda', 'Orla', 'Roywyn', 'Shamil', 'Tana', 'Waywocket',
      'Zanna', 'Zara'
    ]
  }
};

// Personality traits (D&D 5e inspired)
export const personalityTraits: PersonalityTrait[] = [
  { text: 'I idolize a particular hero and constantly refer to their deeds', category: 'admiration' },
  { text: 'I can find common ground between the fiercest enemies', category: 'diplomacy' },
  { text: 'I am always polite and respectful', category: 'manners' },
  { text: 'I am haunted by memories of war', category: 'trauma' },
  { text: 'I have lost too many friends and am slow to make new ones', category: 'loneliness' },
  { text: 'I am driven by a wanderlust that led me away from home', category: 'adventure' },
  { text: 'I watch over my friends as if they were a litter of newborn pups', category: 'loyalty' },
  { text: 'I once ran twenty-five miles without stopping to warn my clan of an approaching orc horde', category: 'endurance' },
  { text: 'I have a lesson for every situation, drawn from observing nature', category: 'wisdom' },
  { text: 'I place no stock in wealthy or well-mannered folk', category: 'distrust' },
  { text: 'I am always calm, no matter what the situation', category: 'composure' },
  { text: 'I blow up at the slightest insult', category: 'temper' },
  { text: 'I know a story relevant to almost every situation', category: 'storytelling' },
  { text: 'I am incredibly slow to trust', category: 'caution' },
  { text: 'I am fascinated by other cultures and customs', category: 'curiosity' },
  { text: 'I am always picking things up, absently fiddling with them', category: 'fidgeting' },
  { text: 'I have a strong sense of fair play and always try to find the most equitable solution', category: 'justice' },
  { text: 'I am confident in my own abilities and do what I can to instill confidence in others', category: 'leadership' },
  { text: 'I think anyone who is interesting for longer than a month is probably lying', category: 'cynicism' },
  { text: 'I am a snob who looks down on those who can\'t appreciate fine art', category: 'elitism' },
  { text: 'I always want to know how things work and what makes people tick', category: 'inquisitiveness' },
  { text: 'I am well known for my work, and I always make sure everyone knows it', category: 'pride' },
  { text: 'I am always on the lookout for danger', category: 'vigilance' },
  { text: 'I am incredibly empathetic and can\'t help but feel the pain of others', category: 'empathy' },
  { text: 'I am a hopeless romantic, always searching for my one true love', category: 'romance' },
  { text: 'I am obsessed with a particular goal and will do anything to achieve it', category: 'obsession' },
  { text: 'I am a perfectionist who can\'t stand anything less than the best', category: 'perfectionism' },
  { text: 'I am incredibly superstitious and see omens in everything', category: 'superstition' },
  { text: 'I am a compulsive liar, even when the truth would serve me better', category: 'deceit' },
  { text: 'I am incredibly generous and will give away my last coin to help someone', category: 'generosity' },
  { text: 'I am a natural leader and always take charge in a crisis', category: 'initiative' },
  { text: 'I am incredibly loyal and will never betray those I care about', category: 'devotion' },
  { text: 'I am a thrill-seeker who is always looking for the next adventure', category: 'adrenaline' },
  { text: 'I am incredibly patient and can wait for hours without complaint', category: 'patience' },
  { text: 'I am a natural teacher and love to share my knowledge with others', category: 'education' },
  { text: 'I am incredibly competitive and hate to lose at anything', category: 'competitiveness' },
  { text: 'I am a natural healer and feel compelled to help those in pain', category: 'compassion' },
  { text: 'I am incredibly organized and can\'t stand chaos or mess', category: 'order' },
  { text: 'I am a natural performer and love to be the center of attention', category: 'showmanship' },
  { text: 'I am incredibly resourceful and can make do with almost anything', category: 'ingenuity' },
  { text: 'I am a natural diplomat and can smooth over almost any conflict', category: 'mediation' },
  { text: 'I am incredibly brave and will face any danger without hesitation', category: 'courage' },
  { text: 'I am a natural strategist and always think several steps ahead', category: 'planning' },
  { text: 'I am incredibly creative and see solutions others miss', category: 'innovation' },
  { text: 'I am a natural survivor and can adapt to almost any situation', category: 'resilience' },
  { text: 'I am incredibly observant and notice details others miss', category: 'awareness' },
  { text: 'I am a natural problem-solver and love to tackle difficult challenges', category: 'analytical' },
  { text: 'I am incredibly determined and never give up, no matter the odds', category: 'perseverance' }
];

// Ideals (D&D 5e inspired)
export const ideals: Ideal[] = [
  { text: 'Greater Good. It is each person\'s responsibility to make the most happiness for the whole tribe', alignment: 'good' },
  { text: 'Honor. If I dishonor myself, I dishonor my whole clan', alignment: 'lawful' },
  { text: 'Change. Life is like the seasons, in constant change, and we must change with it', alignment: 'chaotic' },
  { text: 'Greater Good. My gifts are meant to be shared with all, not used for my own benefit', alignment: 'good' },
  { text: 'Logic. Emotions must not cloud our sense of what is right and true, or our logical thinking', alignment: 'lawful' },
  { text: 'Free Thinking. Inquiry and curiosity are the pillars of progress', alignment: 'chaotic' },
  { text: 'Power. Solitude and contemplation are paths toward mystical or magical power', alignment: 'neutral' },
  { text: 'Live and Let Live. Meddling in the affairs of others only causes trouble', alignment: 'neutral' },
  { text: 'Self-Knowledge. If you know yourself, there\'s nothing left to know', alignment: 'any' },
  { text: 'Respect. All people, rich or poor, deserve respect', alignment: 'good' },
  { text: 'Community. It is the duty of all civilized people to strengthen the bonds of community and the security of civilization', alignment: 'lawful' },
  { text: 'Generosity. My talents were given to me so that I could use them to benefit the world', alignment: 'good' },
  { text: 'Freedom. Everyone should be free to pursue their own livelihood', alignment: 'chaotic' },
  { text: 'Might. The strongest are meant to rule', alignment: 'evil' },
  { text: 'Sincerity. There\'s no good pretending to be something I\'m not', alignment: 'neutral' },
  { text: 'Destiny. Nothing and no one can steer me away from my higher calling', alignment: 'any' },
  { text: 'People. I\'m committed to the people I care about, not to ideals', alignment: 'neutral' },
  { text: 'Aspiration. I seek to prove myself worthy of my god\'s favor by matching my actions against their teachings', alignment: 'any' },
  { text: 'Independence. I must prove that I can handle myself without the coddling of my family', alignment: 'chaotic' },
  { text: 'Power. I hope to one day rise to the top of my faith\'s religious hierarchy', alignment: 'lawful' },
  { text: 'Faith. I trust that my deity will guide my actions. I have faith that if I work hard, things will go well', alignment: 'lawful' },
  { text: 'Tradition. The ancient traditions of worship and sacrifice must be preserved and upheld', alignment: 'lawful' },
  { text: 'Charity. I always try to help those in need, no matter what the personal cost', alignment: 'good' },
  { text: 'Change. We must help bring about the changes the gods are constantly working in the world', alignment: 'chaotic' },
  { text: 'Power. I hope to one day rise to the top of my faith\'s religious hierarchy', alignment: 'lawful' },
  { text: 'Faith. I trust that my deity will guide my actions', alignment: 'any' },
  { text: 'Aspiration. I seek to prove myself worthy of my god\'s favor', alignment: 'any' },
  { text: 'Independence. I must prove that I can handle myself', alignment: 'chaotic' },
  { text: 'Power. I hope to one day rise to the top', alignment: 'lawful' }
];

// Bonds (D&D 5e inspired)
export const bonds: Bond[] = [
  { text: 'I would die to recover an ancient artifact of my faith that was lost long ago', type: 'artifact' },
  { text: 'I will someday get revenge on the corrupt temple hierarchy who branded me a heretic', type: 'revenge' },
  { text: 'Everything I do is for the common people', type: 'people' },
  { text: 'I will do anything to protect the temple where I served', type: 'place' },
  { text: 'I seek to preserve a sacred text that my enemies consider heretical and seek to destroy', type: 'knowledge' },
  { text: 'I owe my life to the priest who took me in when my parents died', type: 'person' },
  { text: 'I will do anything to protect the temple where I served', type: 'place' },
  { text: 'I seek to preserve a sacred text that my enemies consider heretical', type: 'knowledge' },
  { text: 'I owe my life to the priest who took me in when my parents died', type: 'person' },
  { text: 'I will someday get revenge on the corrupt temple hierarchy', type: 'revenge' },
  { text: 'Everything I do is for the common people', type: 'people' },
  { text: 'I would die to recover an ancient artifact of my faith', type: 'artifact' },
  { text: 'I protect those who cannot protect themselves', type: 'duty' },
  { text: 'I will bring terrible wrath down on the evildoers who destroyed my homeland', type: 'revenge' },
  { text: 'I am the last of my tribe, and it is up to me to ensure their names enter legend', type: 'heritage' },
  { text: 'I suffer awful visions of a coming disaster and will do anything to prevent it', type: 'prophecy' },
  { text: 'It is my duty to provide children to sustain my tribe', type: 'duty' },
  { text: 'I will do anything to protect the temple where I served', type: 'place' },
  { text: 'I seek to preserve a sacred text that my enemies consider heretical', type: 'knowledge' },
  { text: 'I owe my life to the priest who took me in when my parents died', type: 'person' },
  { text: 'I will someday get revenge on the corrupt temple hierarchy', type: 'revenge' },
  { text: 'Everything I do is for the common people', type: 'people' },
  { text: 'I would die to recover an ancient artifact of my faith', type: 'artifact' },
  { text: 'I protect those who cannot protect themselves', type: 'duty' },
  { text: 'I will bring terrible wrath down on the evildoers who destroyed my homeland', type: 'revenge' },
  { text: 'I am the last of my tribe, and it is up to me to ensure their names enter legend', type: 'heritage' },
  { text: 'I suffer awful visions of a coming disaster and will do anything to prevent it', type: 'prophecy' },
  { text: 'It is my duty to provide children to sustain my tribe', type: 'duty' },
  { text: 'I will do anything to protect the temple where I served', type: 'place' },
  { text: 'I seek to preserve a sacred text that my enemies consider heretical', type: 'knowledge' },
  { text: 'I owe my life to the priest who took me in when my parents died', type: 'person' },
  { text: 'I will someday get revenge on the corrupt temple hierarchy', type: 'revenge' },
  { text: 'Everything I do is for the common people', type: 'people' },
  { text: 'I would die to recover an ancient artifact of my faith', type: 'artifact' },
  { text: 'I protect those who cannot protect themselves', type: 'duty' },
  { text: 'I will bring terrible wrath down on the evildoers who destroyed my homeland', type: 'revenge' },
  { text: 'I am the last of my tribe, and it is up to me to ensure their names enter legend', type: 'heritage' },
  { text: 'I suffer awful visions of a coming disaster and will do anything to prevent it', type: 'prophecy' },
  { text: 'It is my duty to provide children to sustain my tribe', type: 'duty' }
];

// Flaws (D&D 5e inspired)
export const flaws: Flaw[] = [
  { text: 'I judge others harshly, and myself even more severely', severity: 'moderate' },
  { text: 'I put too much trust in those who wield power within my temple\'s hierarchy', severity: 'moderate' },
  { text: 'My piety sometimes leads me to blindly trust those that profess faith in my god', severity: 'moderate' },
  { text: 'I am inflexible in my thinking', severity: 'moderate' },
  { text: 'I am suspicious of strangers and expect the worst of them', severity: 'moderate' },
  { text: 'Once I pick a goal, I become obsessed with it to the detriment of everything else in my life', severity: 'severe' },
  { text: 'I can\'t resist a pretty face', severity: 'moderate' },
  { text: 'I\'m always in debt. I spend my ill-gotten gains on decadent luxuries faster than I bring them in', severity: 'moderate' },
  { text: 'I\'m convinced that no one could ever fool me the way I fool others', severity: 'moderate' },
  { text: 'I can\'t resist a pretty face', severity: 'moderate' },
  { text: 'I\'m always in debt', severity: 'moderate' },
  { text: 'I\'m convinced that no one could ever fool me', severity: 'moderate' },
  { text: 'I am too enamored of ale, wine, and other intoxicants', severity: 'moderate' },
  { text: 'There\'s no room for caution in a life lived to the fullest', severity: 'moderate' },
  { text: 'I remember every insult I\'ve received and nurse a silent resentment toward anyone who\'s ever wronged me', severity: 'severe' },
  { text: 'I am slow to trust members of other races, tribes, and societies', severity: 'moderate' },
  { text: 'Violence is my answer to almost any challenge', severity: 'severe' },
  { text: 'Don\'t expect me to save those who can\'t save themselves', severity: 'moderate' },
  { text: 'I am easily distracted by the promise of information', severity: 'moderate' },
  { text: 'Most people scream and run when they see a demon. I stop and take notes on its anatomy', severity: 'moderate' },
  { text: 'Unlocking an ancient mystery is worth the price of a civilization', severity: 'severe' },
  { text: 'I overlook obvious solutions in favor of complicated ones', severity: 'moderate' },
  { text: 'I speak without really thinking through my words, invariably insulting others', severity: 'moderate' },
  { text: 'I can\'t keep a secret to save my life, or anyone else\'s', severity: 'moderate' },
  { text: 'I follow orders, even if I think they\'re wrong', severity: 'moderate' },
  { text: 'I\'ll say anything to avoid having to do extra work', severity: 'moderate' },
  { text: 'Once someone questions my courage, I never back down no matter how dangerous the situation', severity: 'severe' },
  { text: 'I am horribly, horribly awkward in social situations', severity: 'moderate' },
  { text: 'I am convinced that people are always trying to steal my secrets', severity: 'moderate' },
  { text: 'My pride will probably lead to my destruction', severity: 'moderate' },
  { text: 'I am easily distracted by the promise of information', severity: 'moderate' },
  { text: 'Most people scream and run when they see a demon', severity: 'moderate' },
  { text: 'Unlocking an ancient mystery is worth the price of a civilization', severity: 'severe' },
  { text: 'I overlook obvious solutions in favor of complicated ones', severity: 'moderate' },
  { text: 'I speak without really thinking through my words', severity: 'moderate' },
  { text: 'I can\'t keep a secret to save my life', severity: 'moderate' },
  { text: 'I follow orders, even if I think they\'re wrong', severity: 'moderate' },
  { text: 'I\'ll say anything to avoid having to do extra work', severity: 'moderate' },
  { text: 'Once someone questions my courage, I never back down', severity: 'severe' },
  { text: 'I am horribly, horribly awkward in social situations', severity: 'moderate' },
  { text: 'I am convinced that people are always trying to steal my secrets', severity: 'moderate' },
  { text: 'My pride will probably lead to my destruction', severity: 'moderate' }
];

// Backgrounds (D&D 5e)
export const backgrounds: Background[] = [
  {
    name: 'Acolyte',
    skills: ['Insight', 'Religion'],
    equipment: ['Holy symbol', 'Prayer book', '5 sticks of incense', 'Vestments', 'Common clothes', '15 gp'],
    personalityTendencies: ['pious', 'devout', 'scholarly', 'humble']
  },
  {
    name: 'Criminal',
    skills: ['Deception', 'Stealth'],
    equipment: ['Crowbar', 'Common clothes', '15 gp'],
    personalityTendencies: ['suspicious', 'cunning', 'opportunistic', 'secretive']
  },
  {
    name: 'Folk Hero',
    skills: ['Animal Handling', 'Survival'],
    equipment: ['Artisan\'s tools', 'Common clothes', '10 gp'],
    personalityTendencies: ['brave', 'humble', 'determined', 'charitable']
  },
  {
    name: 'Hermit',
    skills: ['Medicine', 'Religion'],
    equipment: ['Scroll case', 'Winter blanket', 'Common clothes', 'Herbalism kit', '5 gp'],
    personalityTendencies: ['solitary', 'wise', 'contemplative', 'patient']
  },
  {
    name: 'Noble',
    skills: ['History', 'Persuasion'],
    equipment: ['Fine clothes', 'Signet ring', 'Scroll of pedigree', 'Purse with 25 gp'],
    personalityTendencies: ['proud', 'refined', 'authoritative', 'entitled']
  },
  {
    name: 'Sage',
    skills: ['Arcana', 'History'],
    equipment: ['Bottle of black ink', 'Quill', 'Small knife', 'Letter from a dead colleague', 'Common clothes', '10 gp'],
    personalityTendencies: ['scholarly', 'curious', 'analytical', 'absent-minded']
  },
  {
    name: 'Soldier',
    skills: ['Athletics', 'Intimidation'],
    equipment: ['Insignia of rank', 'Trophy from a fallen enemy', 'Gaming set', 'Common clothes', '10 gp'],
    personalityTendencies: ['disciplined', 'loyal', 'brave', 'aggressive']
  },
  {
    name: 'Entertainer',
    skills: ['Acrobatics', 'Performance'],
    equipment: ['Musical instrument', 'Costume', 'Pouch with 15 gp'],
    personalityTendencies: ['charismatic', 'dramatic', 'flamboyant', 'attention-seeking']
  },
  {
    name: 'Guild Artisan',
    skills: ['Insight', 'Persuasion'],
    equipment: ['Artisan\'s tools', 'Letter of introduction', 'Traveler\'s clothes', '15 gp'],
    personalityTendencies: ['practical', 'skilled', 'business-minded', 'proud']
  },
  {
    name: 'Outlander',
    skills: ['Athletics', 'Survival'],
    equipment: ['Staff', 'Hunting trap', 'Trophy from an animal', 'Traveler\'s clothes', '10 gp'],
    personalityTendencies: ['independent', 'survivalist', 'practical', 'wanderlust']
  },
  {
    name: 'Sailor',
    skills: ['Athletics', 'Perception'],
    equipment: ['Belaying pin', '50 feet of silk rope', 'Lucky charm', 'Common clothes', '10 gp'],
    personalityTendencies: ['adventurous', 'superstitious', 'loyal', 'rough']
  },
  {
    name: 'Charlatan',
    skills: ['Deception', 'Sleight of Hand'],
    equipment: ['Fine clothes', 'Disguise kit', 'Tools of the con', '15 gp'],
    personalityTendencies: ['deceptive', 'charming', 'opportunistic', 'manipulative']
  },
  {
    name: 'Urchin',
    skills: ['Sleight of Hand', 'Stealth'],
    equipment: ['Small knife', 'Map of the city', 'Pet mouse', 'Token to remember your parents', 'Common clothes', '10 gp'],
    personalityTendencies: ['street-smart', 'resourceful', 'suspicious', 'loyal']
  }
];

// NPC Classes/Roles
export const npcClasses: NPCClass[] = [
  {
    name: 'Commoner',
    statPriorities: [],
    equipment: ['Common clothes', 'Simple tools'],
    typicalLevels: [0, 1]
  },
  {
    name: 'Guard',
    statPriorities: ['str', 'con'],
    equipment: ['Spear', 'Shield', 'Leather armor', 'Uniform'],
    typicalLevels: [1, 2, 3]
  },
  {
    name: 'Noble',
    statPriorities: ['cha'],
    equipment: ['Fine clothes', 'Signet ring', 'Dagger'],
    typicalLevels: [1, 2, 3, 4]
  },
  {
    name: 'Merchant',
    statPriorities: ['cha', 'int'],
    equipment: ['Common clothes', 'Merchant\'s scale', 'Coin purse'],
    typicalLevels: [1, 2, 3]
  },
  {
    name: 'Scholar',
    statPriorities: ['int', 'wis'],
    equipment: ['Common clothes', 'Books', 'Writing supplies'],
    typicalLevels: [1, 2, 3, 4, 5]
  },
  {
    name: 'Warrior',
    statPriorities: ['str', 'con'],
    equipment: ['Longsword', 'Shield', 'Chain mail'],
    typicalLevels: [2, 3, 4, 5]
  },
  {
    name: 'Spellcaster',
    statPriorities: ['int', 'wis'],
    equipment: ['Spellbook', 'Spellcasting focus', 'Robes'],
    typicalLevels: [2, 3, 4, 5, 6]
  },
  {
    name: 'Rogue',
    statPriorities: ['dex'],
    equipment: ['Shortsword', 'Dagger', 'Leather armor', 'Thieves\' tools'],
    typicalLevels: [2, 3, 4, 5]
  },
  {
    name: 'Ranger',
    statPriorities: ['dex', 'wis'],
    equipment: ['Longbow', 'Shortsword', 'Leather armor'],
    typicalLevels: [2, 3, 4, 5]
  },
  {
    name: 'Cleric',
    statPriorities: ['wis', 'cha'],
    equipment: ['Mace', 'Shield', 'Chain mail', 'Holy symbol'],
    typicalLevels: [2, 3, 4, 5, 6]
  }
];

// Birthplaces
export const birthplaces: string[] = [
  'a small village', 'the capital city', 'a remote outpost', 'the wilderness',
  'a bustling port town', 'a mountain fortress', 'a coastal fishing village',
  'a desert oasis', 'a forest settlement', 'a mining town', 'a trading post',
  'a religious monastery', 'a military encampment', 'a nomadic camp',
  'a hidden enclave', 'a ruined city', 'a floating city', 'an underground city',
  'a sky city', 'a magical academy', 'a thieves\' guild', 'a noble estate',
  'a farming community', 'a logging camp', 'a quarry town', 'a border fort',
  'a river town', 'a lakeside village', 'a hilltop settlement', 'a valley town',
  'a crossroads village', 'a frontier town', 'a walled city', 'a free city',
  'a conquered territory', 'a newly founded settlement', 'a ancient city',
  'a ghost town', 'a refugee camp', 'a prison colony', 'a research station'
];

// Life Events
export const lifeEvents: string[] = [
  'a great tragedy', 'a momentous triumph', 'a life-changing discovery',
  'a devastating loss', 'an unexpected opportunity', 'a dangerous encounter',
  'a miraculous escape', 'a profound betrayal', 'a deep friendship',
  'a bitter rivalry', 'a romantic encounter', 'a family reunion',
  'a terrible accident', 'a heroic act', 'a moment of weakness',
  'a spiritual awakening', 'a political upheaval', 'a natural disaster',
  'a war', 'a plague', 'a famine', 'a great feast', 'a tournament',
  'a festival', 'a religious ceremony', 'a magical event', 'a prophecy',
  'a curse', 'a blessing', 'a transformation', 'a journey', 'a quest',
  'a discovery', 'a secret revealed', 'a lie exposed', 'a truth uncovered',
  'a debt paid', 'a debt incurred', 'a promise made', 'a promise broken',
  'a sacrifice', 'a reward', 'a punishment', 'a redemption', 'a fall from grace',
  'a rise to power', 'a loss of power', 'a change of heart', 'a change of mind',
  'a moment of clarity', 'a moment of confusion', 'a moment of inspiration',
  'a moment of despair', 'a moment of hope', 'a moment of fear', 'a moment of courage'
];

// Motivations
export const motivations: string[] = [
  'revenge', 'redemption', 'power', 'wealth', 'knowledge', 'fame',
  'glory', 'adventure', 'protection', 'love', 'duty', 'honor',
  'survival', 'freedom', 'justice', 'peace', 'chaos', 'order',
  'faith', 'doubt', 'curiosity', 'boredom', 'fear', 'courage',
  'hope', 'despair', 'greed', 'generosity', 'pride', 'humility',
  'ambition', 'contentment', 'wanderlust', 'home', 'family', 'friendship',
  'loyalty', 'betrayal', 'truth', 'deception', 'creation', 'destruction'
];

// Secrets
export const secrets: string[] = [
  'a hidden identity', 'a dark past', 'a terrible crime', 'a forbidden love',
  'a magical curse', 'a divine blessing', 'a demonic pact', 'a lost memory',
  'a stolen inheritance', 'a false name', 'a secret family', 'a hidden talent',
  'a dangerous knowledge', 'a forbidden ritual', 'a cursed bloodline',
  'a divine mission', 'a demonic possession', 'a magical transformation',
  'a lost treasure', 'a hidden location', 'a secret organization',
  'a forbidden relationship', 'a dark secret', 'a terrible truth',
  'a hidden power', 'a cursed item', 'a divine artifact', 'a demonic artifact',
  'a magical bond', 'a spiritual connection', 'a prophetic vision',
  'a terrible prophecy', 'a hidden agenda', 'a secret plan', 'a forbidden quest'
];

// Export combined tables
export const npcTables: NPCTables = {
  names: nameTables,
  personalities: {
    traits: personalityTraits,
    ideals,
    bonds,
    flaws
  },
  backgrounds,
  classes: npcClasses,
  birthplaces,
  lifeEvents,
  motivations,
  secrets
};

