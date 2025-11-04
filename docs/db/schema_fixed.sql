-- Fixed schema with correct table ordering
-- Run this in Supabase SQL Editor to fix the dependency issue

-- First, create the enums if they don't exist
create type if not exists public.campaign_role as enum ('dm','player');
create type if not exists public.visibility as enum ('public','party','dm_only');

-- Worlds and Campaigns (no dependencies)
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

create table if not exists public.campaign_member (
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  user_id uuid not null,
  role public.campaign_role not null,
  primary key (campaign_id, user_id)
);

-- Generation tracking
create table if not exists public.generation_request (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaign(id) on delete cascade,
  kind text not null,
  prompt jsonb not null,
  model text,
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.generation_output (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.generation_request(id) on delete cascade,
  content jsonb not null,
  status text not null default 'draft',
  created_at timestamptz default now(),
  created_by uuid
);

-- Location must be created BEFORE npc (npc references it)
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

-- NPC (references location, so must come after)
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
  affiliations jsonb default '[]',
  relationships jsonb default '{}',
  connections jsonb default '[]',
  visibility public.visibility not null default 'dm_only',
  permitted_member_ids uuid[] default '{}',
  created_at timestamptz default now(),
  created_by uuid
);

-- NPC interaction log (references npc)
create table if not exists public.npc_interaction (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaign(id) on delete cascade,
  npc_id uuid not null references public.npc(id) on delete cascade,
  entry text not null,
  by_user uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Other entities (no special ordering needed)
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
  participants jsonb,
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

