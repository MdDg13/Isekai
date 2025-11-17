/**
 * Seed Therios with curated NPCs.
 * Usage:
 *   npx ts-node scripts/seed-therios-npcs.ts
 *
 * Requires:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const WORLD_ID = '9d3f8a90-4f31-43cf-9431-f3d1f517459e';

const npcs = [
  {
    name: 'Eris Thornwell',
    bio: 'A tiefling archivist who records dreams inside Therios’s forbidden stacks.',
    backstory:
      'Eris monitors the Sapphire Athenaeum’s sealed wing, stealing nightmares and binding them into ink. Her demonic patron now demands she revise history to glorify the infernal empire, forcing her to choose between truth and survival.',
    traits: {
      race: 'tiefling',
      class: 'wizard (lore archivist)',
      temperament: 'serene',
      keywords: ['Sapphire Athenaeum', 'dream ink', 'infernal patron'],
      summary: {
        oneLiner: 'Serene tiefling historian torn between truthful record keeping and a demon’s demand for propaganda.',
        keyPoints: [
          'Sleepwalks while writing; pages capture future events when read backward.',
          'Needs allies to counter her patron’s pressure.',
          'Can extract dreams from PCs as payment for research.',
        ],
      },
    },
  },
  // ...remaining NPCs declared below
];

const detailedNpcs = [
  {
    name: 'Eris Thornwell',
    bio: 'A tiefling archivist who records dreams inside Therios’s forbidden stacks.',
    backstory:
      'Eris monitors the Sapphire Athenaeum’s sealed wing, stealing nightmares and binding them into ink. Her demonic patron now demands she revise history to glorify the infernal empire, forcing her to choose between truth and survival.',
    traits: {
      race: 'tiefling',
      class: 'wizard (lore archivist)',
      temperament: 'serene',
      keywords: ['Sapphire Athenaeum', 'dream ink', 'infernal patron'],
      summary: {
        oneLiner: 'Serene tiefling historian torn between truthful record keeping and a demon’s demand for propaganda.',
        keyPoints: [
          'Sleepwalks while writing; pages capture future events when read backward.',
          'Needs allies to counter her patron’s pressure.',
          'Can extract dreams from PCs as payment for research.',
        ],
      },
    },
  },
  {
    name: 'Bram Coalhook',
    bio: 'A dwarf monk who left mercenary work to build a meditation order inside magma ducts.',
    backstory:
      'Bram carved sanctuaries into the basalt beneath Therios, teaching combat veterans to channel trauma into ki. The Iron Syndicate wants his calm tunnels for weapon smuggling, threatening the students he protects.',
    traits: {
      race: 'dwarf',
      class: 'monk',
      temperament: 'grounded',
      keywords: ['Iron Syndicate', 'magma monastery', 'former mercenary'],
      summary: {
        oneLiner: 'Grounded dwarf monk defending a magma monastery from smugglers eager to reclaim his past.',
        keyPoints: [
          'Serves tea brewed from volcanic herbs that neutralize rage.',
          'Pressure-point strikes extinguish torches—useful in stealth scenes.',
          'Seeks PCs to intercept Syndicate negotiators.',
        ],
      },
    },
  },
  {
    name: 'Lysa Quillwater',
    bio: 'A human itinerant judge who weighs intentions with a clockwork scale.',
    backstory:
      'Lysa arbitrates disputes in frontier towns, trusting a relic that measures motive, not gold. Nobles whose verdicts she overturned now fund bounty hunters to silence her.',
    traits: {
      race: 'human',
      class: 'cleric (order domain)',
      temperament: 'measured',
      keywords: ['clockwork scale', 'frontier justice', 'noble vendetta'],
      summary: {
        oneLiner: 'Measured judge whose relic reveals intent, making her a target for corrupt nobles.',
        keyPoints: [
          'Can deputize PCs with sigils that heat up when oaths break.',
          'Needs escorts between court circuits.',
          'Her scale occasionally prophesies crimes before they happen.',
        ],
      },
    },
  },
  {
    name: 'Tovin Starfallow',
    bio: 'An elf who shepherds falling stars into nets for spellcasters.',
    backstory:
      'Tovin discovered how to redirect meteors using crystalline kites. The Astral Port Authority now accuses him of tax evasion on “cosmic imports,” threatening to impound his star herd.',
    traits: {
      race: 'elf',
      class: 'ranger (horizon walker)',
      temperament: 'gleeful',
      keywords: ['meteor shepherd', 'astral authority', 'spell component trader'],
      summary: {
        oneLiner: 'Gleeful meteor wrangler whose cosmic side hustle angers the Astral Port Authority.',
        keyPoints: [
          'Maintains a “shooting star stable” of luminous familiars.',
          'Can barter star iron for rare favors.',
          'Needs legal counsel—or daring smugglers—to dodge audits.',
        ],
      },
    },
  },
  {
    name: 'Mara Driftline',
    bio: 'A halfling river warden who protects a floating temple barge.',
    backstory:
      'Mara ferries refugees down the Therine River, using sacred currents to cloak the barge. A plague cult believes the barge hides their “chosen vectors” and plots to burn it.',
    traits: {
      race: 'halfling',
      class: 'druid (river)',
      temperament: 'warm',
      keywords: ['floating temple', 'plague cult', 'river magic'],
      summary: {
        oneLiner: 'Warm river druid shielding refugee barges from a cult eager to claim them as disease carriers.',
        keyPoints: [
          'Reads currents like tarot cards.',
          'Summons protective fog banks for stealth travel.',
          'Needs investigators to unmask cult spies onboard.',
        ],
      },
    },
  },
  {
    name: 'Gregor Vox',
    bio: 'A warforged gossipwright recording tavern stories in resonant crystals.',
    backstory:
      'Gregor installs “story nodes” in taverns to capture history verbatim. The city’s tyrant wants every crystal destroyed before a rebellion trial uses them as evidence.',
    traits: {
      race: 'warforged',
      class: 'bard (chronicle college)',
      temperament: 'curious',
      keywords: ['gossipwright', 'tyrant secrets', 'memory crystals'],
      summary: {
        oneLiner: 'Curious warforged bard whose living archives threaten a tyrant’s cover-up.',
        keyPoints: [
          'Projects memories as full illusions for witnesses.',
          'Needs help hiding crystals under the city.',
          'Speaks in sampled voices, confusing eavesdroppers.',
        ],
      },
    },
  },
  {
    name: 'Selene Blackfen',
    bio: 'A half-elf ranger who tracks quarry through mirrors.',
    backstory:
      'Selene’s soul fractured after a Feywild mission. Her reflection now acts independently, trafficking secrets to shadow courts unless Selene supplies new thrills.',
    traits: {
      race: 'half-elf',
      class: 'ranger (gloom stalker)',
      temperament: 'brooding',
      keywords: ['mirror tracking', 'shadow courts', 'split soul'],
      summary: {
        oneLiner: 'Brooding mirror ranger bargaining with her own reflection to keep shadow courts at bay.',
        keyPoints: [
          'Can manifest the last scene a mirror witnessed.',
          'Seeks daring heists to keep her reflection satisfied.',
          'Carries mirror shards that act as sending stones.',
        ],
      },
    },
  },
  {
    name: 'Oro Finch',
    bio: 'A kenku bone-luthier crafting instruments from unearthed dinosaurs.',
    backstory:
      'Oro excavates the Verdant Cradle for fossils, turning ribcages into resonant lutes. The Paleontological Guild calls it desecration and tries to seize his workshop.',
    traits: {
      race: 'kenku',
      class: 'artificer (sound smith)',
      temperament: 'eccentric',
      keywords: ['dinosaur fossils', 'guild dispute', 'musical enchantments'],
      summary: {
        oneLiner: 'Eccentric kenku luthier whose fossil instruments enrage academia yet empower bards.',
        keyPoints: [
          'Each instrument grants bespoke bardic inspiration flavors.',
          'Needs bodyguards for a public showcase.',
          'Communicates via musical riffs rather than speech.',
        ],
      },
    },
  },
  {
    name: 'Nadina Brassveil',
    bio: 'A storm-slinging dragonborn who bottles lightning for artificers.',
    backstory:
      'Nadina wrangles thunderstorms over Therios and sells lightning vials. A storm giant wants his stolen thundercloud back, threatening retaliation if she refuses.',
    traits: {
      race: 'dragonborn',
      class: 'sorcerer (storm)',
      temperament: 'bombastic',
      keywords: ['lightning broker', 'storm giant dispute', 'artificer market'],
      summary: {
        oneLiner: 'Bombastic lightning broker caught between artisanal clients and a furious storm giant.',
        keyPoints: [
          'Lightning tattoos form eavesdropping circuits.',
          'Needs intermediaries to negotiate with giants.',
          'Provides discount spell slots in exchange for favors.',
        ],
      },
    },
  },
  {
    name: 'Brother Cale Driftveil',
    bio: 'A penitent vampire who donates blood to fund orphanages.',
    backstory:
      'Cale swore off predation, draining himself to keep orphanages afloat. His sire wants the donations stopped and the children enthralled as a choir.',
    traits: {
      race: 'human (vampire)',
      class: 'paladin (redemption)',
      temperament: 'melancholic',
      keywords: ['penitent vampire', 'orphanages', 'sire vendetta'],
      summary: {
        oneLiner: 'Melancholic redemption paladin fighting his sire to keep orphanages safe.',
        keyPoints: [
          'Uses mirrored gauntlets to reflect sunlight.',
          'Contracts fiends into monastery service paperwork.',
          'Needs escorts when delivering blood tithe wagons.',
        ],
      },
    },
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const payload = detailedNpcs.map((npc) => ({
    world_id: WORLD_ID,
    name: npc.name,
    bio: npc.bio,
    backstory: npc.backstory,
    traits: npc.traits,
    stats: { level: 5, combat: { hitpoints: 32, armorClass: 14, speed: 30 } },
    visibility: 'public',
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('world_npc').insert(payload);
  if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  console.log(`Seeded ${payload.length} NPCs into Therios.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

