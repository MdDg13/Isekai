-- Quick fix: Add world_npc table if it doesn't exist
-- Run this in Supabase SQL Editor if you get "Could not find the table 'public.world_npc'" error

-- Ensure visibility enum exists
do $$ begin
  create type public.visibility as enum ('public','party','dm_only');
exception when duplicate_object then null;
end $$;

-- Create world_npc table
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

-- Enable RLS
alter table public.world_npc enable row level security;

-- Helper functions for RLS (create if they don't exist)
create or replace function public.is_dm(c_id uuid, u_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.campaign_member m
    where m.campaign_id = c_id and m.user_id = u_id and m.role = 'dm'
  );
$$;

create or replace function public.has_world_access(w_id uuid, u_id uuid)
returns boolean language sql stable as $$
  -- User has access if they're a member of any campaign in that world
  select exists(
    select 1 from public.campaign c
    join public.campaign_member m on m.campaign_id = c.id
    where c.world_id = w_id and m.user_id = u_id
  );
$$;

-- RLS policies (matching rls_v2.sql)
-- Drop policies if they exist, then create them
drop policy if exists world_npc_read on public.world_npc;
create policy world_npc_read on public.world_npc for select
  using (public.has_world_access(world_id, auth.uid()));

drop policy if exists world_npc_write on public.world_npc;
create policy world_npc_write on public.world_npc for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_npc.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_npc.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- Verify table was created
select 'world_npc table created successfully' as status;

