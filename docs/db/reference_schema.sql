-- Reference Schema: Free5e Content Library
-- All reference tables store Free5e (Creative Commons Attribution 4.0) content
-- plus custom content created by DMs
-- These tables are world-agnostic and serve as a shared library

-- ============================================
-- CORE REFERENCE TABLES
-- ============================================

-- Reference items (weapons, armor, tools, consumables, magic items)
create table if not exists public.reference_item (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null, -- weapon, armor, tool, consumable, magic_item, etc.
  category text, -- subcategory (e.g., "martial_melee", "light_armor")
  rarity text, -- common, uncommon, rare, very_rare, legendary (for magic items)
  cost_gp numeric, -- cost in gold pieces (Free5e standard)
  cost_breakdown jsonb, -- {cp, sp, gp, pp} for detailed tracking
  weight_lb numeric,
  description text,
  properties jsonb, -- D&D 5e item properties (e.g., {finesse: true, versatile: "1d10"})
  attunement boolean default false, -- requires attunement
  attunement_requirements text, -- e.g., "by a spellcaster"
  source text not null default 'Free5e', -- Free5e, custom, etc.
  page_reference text, -- page number in Free5e source
  tags text[], -- searchable tags
  created_at timestamptz default now(),
  created_by uuid, -- user who created (for custom items)
  constraint reference_item_name_unique unique (name, source)
);

-- Reference spells (all Free5e spells)
create table if not exists public.reference_spell (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level int not null, -- 0-9 (cantrip = 0)
  school text not null, -- abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation
  casting_time text not null, -- e.g., "1 action", "1 bonus action", "1 minute"
  range text not null, -- e.g., "Self", "60 feet", "Touch"
  components text not null, -- V, S, M (Verbal, Somatic, Material)
  material_components text, -- specific material components if M is present
  duration text not null, -- e.g., "Instantaneous", "Concentration, up to 1 minute"
  description text not null,
  higher_level text, -- description of effects when cast at higher levels
  ritual boolean default false,
  concentration boolean default false,
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_spell_name_unique unique (name, source)
);

-- Reference monsters (all Free5e monsters)
create table if not exists public.reference_monster (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text not null, -- Tiny, Small, Medium, Large, Huge, Gargantuan
  type text not null, -- aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, humanoid, monstrosity, ooze, plant, undead
  subtype text, -- e.g., "shapechanger", "elf"
  alignment text, -- e.g., "lawful evil", "chaotic neutral", "unaligned"
  armor_class int not null,
  armor_class_type text, -- e.g., "natural armor", "chain mail"
  hit_points int not null,
  hit_dice text, -- e.g., "12d8+36"
  speed jsonb not null, -- {walk: 30, fly: 60, swim: 30, etc.}
  stats jsonb not null, -- {str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8}
  saving_throws jsonb, -- {str: "+5", dex: "+2", etc.}
  skills jsonb, -- {athletics: "+5", perception: "+3", etc.}
  damage_resistances text[],
  damage_immunities text[],
  condition_immunities text[],
  senses text, -- e.g., "darkvision 60 ft., passive Perception 13"
  languages text, -- e.g., "Common, Draconic"
  challenge_rating numeric not null, -- e.g., 0.5, 1, 2.5, 5
  xp int, -- experience points awarded
  traits jsonb, -- array of {name, description} for special traits
  actions jsonb, -- array of {name, description, attack_bonus, damage} for actions
  legendary_actions jsonb, -- array of {name, description, cost} for legendary creatures
  reactions jsonb, -- array of {name, description} for reactions
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_monster_name_unique unique (name, source)
);

-- Reference classes (Free5e classes)
create table if not exists public.reference_class (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hit_dice text not null, -- e.g., "1d8", "1d10", "1d12"
  hit_points_at_1st_level text not null, -- e.g., "8 + Constitution modifier"
  hit_points_at_higher_levels text, -- e.g., "1d8 (or 5) + Constitution modifier"
  proficiencies jsonb not null, -- {armor: [...], weapons: [...], tools: [...], saving_throws: [...], skills: {choose: 2, from: [...]}}
  starting_equipment jsonb, -- {options: [...], default: [...]}
  multiclassing jsonb, -- {prerequisites: {...}, proficiencies_gained: [...]}
  class_features jsonb, -- array of {level: 1, name: "...", description: "..."} for all levels
  spellcasting jsonb, -- spellcasting info if class has spells
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  extraction_confidence_score int, -- 0-100 quality score
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_class_name_unique unique (name, source)
);

-- Reference subclasses (Free5e subclasses)
create table if not exists public.reference_subclass (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_class text, -- e.g., "Fighter", "Wizard", "Cleric"
  level_granted int default 2, -- level at which subclass is chosen (usually 2 or 3)
  description text,
  features jsonb, -- array of {level: 3, name: "...", description: "..."} for subclass features
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  extraction_confidence_score int, -- 0-100 quality score
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_subclass_name_unique unique (name, source)
);

-- Reference races (Free5e races)
create table if not exists public.reference_race (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text not null, -- Small, Medium
  speed int not null, -- base walking speed in feet
  ability_score_increases jsonb not null, -- {str: 1, dex: 2} or {choose: 1, from: ["str", "dex", "con"]}
  traits jsonb, -- array of {name, description} for racial traits
  languages text[], -- languages known
  subraces jsonb, -- array of subrace data if applicable
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  extraction_confidence_score int, -- 0-100 quality score
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_race_name_unique unique (name, source)
);

-- Reference backgrounds (Free5e backgrounds)
create table if not exists public.reference_background (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skill_proficiencies text[], -- skills granted
  tool_proficiencies text[], -- tools/languages granted
  languages text[], -- languages granted
  equipment jsonb, -- starting equipment
  feature_name text, -- name of background feature
  feature_description text, -- description of background feature
  personality_traits text[], -- suggested personality traits
  ideals text[], -- suggested ideals
  bonds text[], -- suggested bonds
  flaws text[], -- suggested flaws
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_background_name_unique unique (name, source)
);

-- Reference feats (Free5e feats)
create table if not exists public.reference_feat (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prerequisites text, -- e.g., "Ability Score Improvement", "Proficiency with medium armor"
  benefits text not null, -- description of what the feat provides
  description text, -- additional flavor text
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_feat_name_unique unique (name, source)
);

-- Reference traits (personality traits, ideals, bonds, flaws)
create table if not exists public.reference_trait (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- personality_trait, ideal, bond, flaw
  description text,
  associated_background text, -- optional link to background
  source text not null default 'custom', -- most traits are custom
  tags text[],
  created_at timestamptz default now(),
  created_by uuid
);

-- Reference location name components (for procedural naming)
create table if not exists public.reference_location_name_component (
  id uuid primary key default gen_random_uuid(),
  component_type text not null, -- prefix, suffix, root, descriptor
  text text not null,
  category text, -- settlement, natural, structure, etc.
  culture text, -- generic, elven, dwarven, human, etc.
  frequency int default 1, -- relative frequency for weighted selection
  created_at timestamptz default now(),
  created_by uuid
);

-- Reference terrain types (biomes, climates)
create table if not exists public.reference_terrain_type (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- biome, climate, elevation
  travel_modifier numeric default 1.0, -- movement cost multiplier (1.0 = normal, 0.5 = easy, 2.0 = difficult)
  description text,
  texture_tags text[], -- tags for map rendering (e.g., "grass", "rock", "snow")
  encounter_modifiers jsonb, -- modifiers to encounter tables
  source text default 'custom',
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_terrain_name_unique unique (name, category)
);

-- Reference map tiles (terrain tiles, structure tiles, POI markers)
create table if not exists public.reference_map_tile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tile_type text not null, -- terrain, structure, poi_marker
  category text, -- subcategory
  image_url text, -- stored in Supabase Storage
  width int, -- tile width in pixels
  height int, -- tile height in pixels
  tags text[],
  created_at timestamptz default now(),
  created_by uuid
);

-- Reference equipment packs (starting equipment packages)
create table if not exists public.reference_equipment_pack (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost_gp numeric not null,
  contents jsonb not null, -- array of {item_name, quantity} or {item_id, quantity}
  weight_lb numeric,
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_equipment_pack_name_unique unique (name, source)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Reference item indexes
create index if not exists idx_reference_item_name on public.reference_item(name);
create index if not exists idx_reference_item_kind on public.reference_item(kind);
create index if not exists idx_reference_item_rarity on public.reference_item(rarity);
create index if not exists idx_reference_item_source on public.reference_item(source);
create index if not exists idx_reference_item_tags on public.reference_item using gin(tags);

-- Reference spell indexes
create index if not exists idx_reference_spell_name on public.reference_spell(name);
create index if not exists idx_reference_spell_level on public.reference_spell(level);
create index if not exists idx_reference_spell_school on public.reference_spell(school);
create index if not exists idx_reference_spell_source on public.reference_spell(source);
create index if not exists idx_reference_spell_tags on public.reference_spell using gin(tags);

-- Reference monster indexes
create index if not exists idx_reference_monster_name on public.reference_monster(name);
create index if not exists idx_reference_monster_type on public.reference_monster(type);
create index if not exists idx_reference_monster_cr on public.reference_monster(challenge_rating);
create index if not exists idx_reference_monster_source on public.reference_monster(source);
create index if not exists idx_reference_monster_tags on public.reference_monster using gin(tags);

-- Reference class indexes
create index if not exists idx_reference_class_name on public.reference_class(name);
create index if not exists idx_reference_class_source on public.reference_class(source);

-- Reference race indexes
create index if not exists idx_reference_race_name on public.reference_race(name);
create index if not exists idx_reference_race_source on public.reference_race(source);

-- Reference background indexes
create index if not exists idx_reference_background_name on public.reference_background(name);
create index if not exists idx_reference_background_source on public.reference_background(source);

-- Reference feat indexes
create index if not exists idx_reference_feat_name on public.reference_feat(name);
create index if not exists idx_reference_feat_source on public.reference_feat(source);

-- Reference trait indexes
create index if not exists idx_reference_trait_category on public.reference_trait(category);
create index if not exists idx_reference_trait_source on public.reference_trait(source);

-- Reference location name component indexes
create index if not exists idx_reference_location_name_component_type on public.reference_location_name_component(component_type);
create index if not exists idx_reference_location_name_component_category on public.reference_location_name_component(category);
create index if not exists idx_reference_location_name_component_culture on public.reference_location_name_component(culture);

-- Reference terrain type indexes
create index if not exists idx_reference_terrain_type_name on public.reference_terrain_type(name);
create index if not exists idx_reference_terrain_type_category on public.reference_terrain_type(category);

-- Reference map tile indexes
create index if not exists idx_reference_map_tile_type on public.reference_map_tile(tile_type);
create index if not exists idx_reference_map_tile_category on public.reference_map_tile(category);

-- Reference equipment pack indexes
create index if not exists idx_reference_equipment_pack_name on public.reference_equipment_pack(name);
create index if not exists idx_reference_equipment_pack_source on public.reference_equipment_pack(source);

