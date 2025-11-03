-- Worlds and Campaigns core schema

create table if not exists public.world (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  ruleset text default 'DND5E',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.campaign (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.world(id) on delete cascade,
  name text not null,
  slug text unique not null,
  summary text,
  created_at timestamptz default now(),
  created_by uuid
);

create type public.campaign_role as enum ('dm','player');

create table if not exists public.campaign_member (
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  user_id uuid not null,
  role public.campaign_role not null,
  primary key (campaign_id, user_id)
);

-- Visibility and provenance
create type public.visibility as enum ('public','party','dm_only');

create table if not exists public.generation_request (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaign(id) on delete cascade,
  kind text not null, -- npc|arc|encounter|...
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

-- Narrative entities
create table if not exists public.npc (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  bio text,
  backstory text,
  traits jsonb,
  stats jsonb,
  image_url text,
  voice_id text,
  location_id uuid references public.location(id) on delete set null,
  affiliations jsonb default '[]', -- array of { type, name, ref_id }
  relationships jsonb default '{}', -- map of subject_id -> { attitude: -100..+100, notes }
  connections jsonb default '[]', -- array of { kind: 'npc'|'location'|'item', ref_id, label }
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- Interaction log for NPCs
create table if not exists public.npc_interaction (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  npc_id uuid not null references public.npc(id) on delete cascade,
  entry text not null,
  by_user uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.location (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  description text,
  region text,
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.item (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  kind text,
  rarity text,
  props jsonb,
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.arc (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  title text not null,
  synopsis text,
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.beat (
  id uuid primary key default gen_random_uuid(),
  arc_id uuid not null references public.arc(id) on delete cascade,
  title text not null,
  details text,
  sequence int,
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.encounter (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  difficulty text,
  participants jsonb, -- monsters/npcs/party refs
  loot jsonb,
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.shop (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  name text not null,
  inventory jsonb,
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.scene (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  title text not null,
  description text,
  background_image_url text,
  visibility public.visibility not null default 'party',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);


