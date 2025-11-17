-- Schema v2: Separated World-Level and Campaign-Level Content
-- World-level content is shared across all campaigns in that world
-- Campaign-level content is specific to one game/story

-- ============================================
-- CORE TABLES
-- ============================================

create table if not exists public.world (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  ruleset text default 'Free5e',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.campaign (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  slug text unique not null,
  summary text,
  time_period text, -- When in the world's timeline this campaign takes place
  created_at timestamptz default now(),
  created_by uuid
);

create type public.campaign_role as enum ('dm','player');
create type public.visibility as enum ('public','party','dm_only');

create table if not exists public.campaign_member (
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  user_id uuid not null,
  role public.campaign_role not null,
  primary key (campaign_id, user_id)
);

-- ============================================
-- WORLD-LEVEL CONTENT (Shared Across Campaigns)
-- ============================================

-- World locations (cities, dungeons, landmarks)
create table if not exists public.world_location (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  description text,
  region text,
  coordinates jsonb, -- {lat, lng} or {x, y} for map positioning
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World NPCs (part of the world lore, not campaign-specific)
create table if not exists public.world_npc (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  bio text,
  backstory text,
  traits jsonb, -- {race, temperament, keywords, ideals, flaws, bonds}
  stats jsonb, -- {level, abilities: {str, dex, con, int, wis, cha}, equipment}
  image_url text,
  voice_id text,
  location_id uuid references public.world_location(id) on delete set null,
  affiliations jsonb default '[]', -- array of { type, name, ref_id }
  relationships jsonb default '{}', -- map of subject_id -> { attitude: -100..+100, notes }
  connections jsonb default '[]', -- array of { kind: 'npc'|'location'|'item', ref_id, label }
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World items (magic items, artifacts, equipment available in the world)
create table if not exists public.world_item (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  kind text, -- weapon, armor, tool, consumable, etc.
  rarity text, -- common, uncommon, rare, very_rare, legendary
  description text,
  props jsonb, -- item properties, stats, etc.
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World maps
create table if not exists public.world_map (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  bounds jsonb, -- {min_x, min_y, max_x, max_y} for map coordinates
  zoom_level int default 1,
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World lore (history, mythology, legends)
create table if not exists public.world_lore (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  title text not null,
  category text, -- history, mythology, legend, religion, culture
  content text,
  references jsonb default '[]', -- links to other lore, NPCs, locations
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World climate/weather patterns
create table if not exists public.world_climate (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  region text not null,
  season text, -- spring, summer, fall, winter, or world-specific seasons
  temperature_range jsonb, -- {min, max, unit}
  weather_patterns text[],
  description text,
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World technology/magic systems
create table if not exists public.world_technology (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  category text, -- magic, technology, tools, weapons, transportation
  name text not null,
  description text,
  availability text, -- common, uncommon, rare, restricted
  props jsonb, -- properties, capabilities, limitations
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- World factions (organizations, guilds, religions, governments)
create table if not exists public.world_faction (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  type text, -- government, guild, religion, organization, etc.
  description text,
  headquarters_id uuid references public.world_location(id) on delete set null,
  leader_id uuid references public.world_npc(id) on delete set null,
  members jsonb default '[]', -- array of NPC IDs
  visibility public.visibility not null default 'public',
  created_at timestamptz default now(),
  created_by uuid
);

-- ============================================
-- CAMPAIGN-LEVEL CONTENT (Game-Specific)
-- ============================================

-- Player characters in this campaign
create table if not exists public.campaign_character (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  player_id uuid, -- user who owns this character
  name text not null,
  class text,
  level int default 1,
  race text,
  stats jsonb, -- {abilities, skills, equipment, etc.}
  backstory text,
  notes text,
  visibility public.visibility not null default 'party',
  created_at timestamptz default now(),
  created_by uuid
);

-- Campaign-specific NPCs (different from world NPCs)
-- These are NPCs created specifically for this campaign
create table if not exists public.campaign_npc (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  world_npc_id uuid references public.world_npc(id) on delete set null, -- optional link to world NPC
  name text not null,
  bio text,
  backstory text,
  traits jsonb,
  stats jsonb,
  location_id uuid, -- campaign-specific location
  affiliations jsonb default '[]',
  relationships jsonb default '{}',
  connections jsonb default '[]',
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- Campaign interaction logs (for both world and campaign NPCs)
create table if not exists public.campaign_interaction (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  npc_id uuid, -- campaign_npc id
  world_npc_id uuid references public.world_npc(id) on delete set null, -- or world_npc id
  entry text not null,
  by_user uuid,
  by_character_id uuid references public.campaign_character(id) on delete set null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Story arcs for this campaign
create table if not exists public.arc (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  title text not null,
  synopsis text,
  status text default 'planned', -- planned, active, completed
  created_at timestamptz default now(),
  created_by uuid
);

-- Story beats within arcs
create table if not exists public.beat (
  id uuid primary key default gen_random_uuid(),
  arc_id uuid not null references public.arc(id) on delete cascade,
  title text not null,
  details text,
  sequence int,
  status text default 'planned', -- planned, active, completed
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- Combat encounters
create table if not exists public.encounter (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  difficulty text,
  participants jsonb, -- monsters/npcs/party refs
  loot jsonb,
  status text default 'planned', -- planned, active, completed
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- Campaign sessions
create table if not exists public.campaign_session (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  title text,
  session_date date,
  notes text,
  summary text,
  participants uuid[], -- character IDs who attended
  visibility public.visibility not null default 'party',
  created_at timestamptz default now(),
  created_by uuid
);

-- Campaign shops (specific to this campaign)
create table if not exists public.shop (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  location_id uuid, -- campaign or world location
  owner_id uuid, -- campaign_npc or world_npc id
  inventory jsonb, -- array of {item_id, price, quantity}
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- Campaign scenes
create table if not exists public.scene (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  title text not null,
  description text,
  background_image_url text,
  location_id uuid, -- campaign or world location
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- World state changes from campaign
-- Tracks how the campaign affects/changes the world
create table if not exists public.campaign_world_state (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  change_type text, -- npc_status, location_change, faction_change, lore_addition, etc.
  description text,
  affected_world_id uuid not null references public.world(id) on delete cascade,
  affected_entity_type text, -- npc, location, faction, lore, etc.
  affected_entity_id uuid,
  metadata jsonb,
  visibility public.visibility not null default 'dm_only',
  created_at timestamptz default now(),
  created_by uuid
);

-- ============================================
-- GENERATION TRACKING
-- ============================================

create table if not exists public.generation_request (
  id uuid primary key default gen_random_uuid(),
  world_id uuid references public.world(id) on delete cascade,
  campaign_id uuid references public.campaign(id) on delete cascade,
  kind text not null, -- npc|location|item|lore|arc|encounter|...
  prompt jsonb not null,
  model text,
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.generation_output (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.generation_request(id) on delete cascade,
  content jsonb not null,
  status text not null default 'draft', -- draft|approved|rejected
  created_at timestamptz default now(),
  created_by uuid
);

