-- RLS Policies for Schema v2 (World-Level and Campaign-Level Separation)

-- Enable RLS on all tables
alter table public.world enable row level security;
alter table public.campaign enable row level security;
alter table public.campaign_member enable row level security;

-- World-level tables
alter table public.world_location enable row level security;
alter table public.world_npc enable row level security;
alter table public.world_item enable row level security;
alter table public.world_map enable row level security;
alter table public.world_lore enable row level security;
alter table public.world_climate enable row level security;
alter table public.world_technology enable row level security;
alter table public.world_faction enable row level security;

-- Campaign-level tables
alter table public.campaign_character enable row level security;
alter table public.campaign_npc enable row level security;
alter table public.campaign_interaction enable row level security;
alter table public.arc enable row level security;
alter table public.beat enable row level security;
alter table public.encounter enable row level security;
alter table public.campaign_session enable row level security;
alter table public.shop enable row level security;
alter table public.scene enable row level security;
alter table public.campaign_world_state enable row level security;

-- Generation tracking
alter table public.generation_request enable row level security;
alter table public.generation_output enable row level security;

-- Helper functions
create or replace function public.is_dm(c_id uuid, u_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.campaign_member m
    where m.campaign_id = c_id and m.user_id = u_id and m.role = 'dm'
  );
$$;

create or replace function public.is_member(c_id uuid, u_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.campaign_member m
    where m.campaign_id = c_id and m.user_id = u_id
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

-- ============================================
-- WORLD POLICIES
-- ============================================

-- Worlds: accessible if user is member of any campaign in that world
create policy world_read on public.world for select
  using (public.has_world_access(id, auth.uid()));

create policy world_write on public.world for all
  using (public.has_world_access(id, auth.uid()))
  with check (public.has_world_access(id, auth.uid()));

-- ============================================
-- WORLD-LEVEL CONTENT POLICIES
-- ============================================

-- World locations: read if world accessible, write if DM of any campaign in world
create policy world_location_read on public.world_location for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_location_write on public.world_location for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_location.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_location.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World NPCs: read if world accessible, write if DM of any campaign in world
create policy world_npc_read on public.world_npc for select
  using (public.has_world_access(world_id, auth.uid()));

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

-- World items: read if world accessible, write if DM of any campaign in world
create policy world_item_read on public.world_item for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_item_write on public.world_item for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_item.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_item.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World maps: read if world accessible, write if DM of any campaign in world
create policy world_map_read on public.world_map for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_map_write on public.world_map for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_map.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_map.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World lore: read if world accessible, write if DM of any campaign in world
create policy world_lore_read on public.world_lore for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_lore_write on public.world_lore for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_lore.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_lore.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World climate: read if world accessible, write if DM of any campaign in world
create policy world_climate_read on public.world_climate for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_climate_write on public.world_climate for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_climate.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_climate.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World technology: read if world accessible, write if DM of any campaign in world
create policy world_technology_read on public.world_technology for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_technology_write on public.world_technology for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_technology.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_technology.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- World factions: read if world accessible, write if DM of any campaign in world
create policy world_faction_read on public.world_faction for select
  using (public.has_world_access(world_id, auth.uid()));

create policy world_faction_write on public.world_faction for all
  using (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_faction.world_id
      and public.is_dm(c.id, auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.campaign c
      where c.world_id = world_faction.world_id
      and public.is_dm(c.id, auth.uid())
    )
  );

-- ============================================
-- CAMPAIGN POLICIES
-- ============================================

-- Campaigns: members can read, DMs can write
create policy campaign_read on public.campaign for select
  using (public.is_member(id, auth.uid()));

create policy campaign_write on public.campaign for all
  using (public.is_dm(id, auth.uid()))
  with check (public.is_dm(id, auth.uid()));

-- Campaign members: users can see their own membership, DMs manage all
create policy cm_read on public.campaign_member for select
  using (user_id = auth.uid() or public.is_dm(campaign_id, auth.uid()));

create policy cm_write on public.campaign_member for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- ============================================
-- CAMPAIGN-LEVEL CONTENT POLICIES
-- ============================================

-- Campaign characters: members can read, DMs can write
create policy campaign_character_read on public.campaign_character for select
  using (public.is_member(campaign_id, auth.uid()));

create policy campaign_character_write on public.campaign_character for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Campaign NPCs: visibility-aware read, DMs write
create policy campaign_npc_read on public.campaign_npc for select
  using (
    public.is_dm(campaign_id, auth.uid())
    or (
      public.is_member(campaign_id, auth.uid()) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy campaign_npc_write on public.campaign_npc for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Campaign interactions: members can read, DMs write
create policy campaign_interaction_read on public.campaign_interaction for select
  using (public.is_member(campaign_id, auth.uid()));

create policy campaign_interaction_write on public.campaign_interaction for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Arcs: members can read, DMs write
create policy arc_read on public.arc for select
  using (public.is_member(campaign_id, auth.uid()));

create policy arc_write on public.arc for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Beats: visibility-aware read, DMs write
create policy beat_read on public.beat for select
  using (
    public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
    or (
      exists (
        select 1 from public.arc a
        where a.id = beat.arc_id and public.is_member(a.campaign_id, auth.uid())
      ) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy beat_write on public.beat for all
  using (
    public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
  )
  with check (
    public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
  );

-- Encounters: visibility-aware read, DMs write
create policy encounter_read on public.encounter for select
  using (
    public.is_dm(campaign_id, auth.uid())
    or (
      public.is_member(campaign_id, auth.uid()) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy encounter_write on public.encounter for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Campaign sessions: members can read, DMs write
create policy campaign_session_read on public.campaign_session for select
  using (public.is_member(campaign_id, auth.uid()));

create policy campaign_session_write on public.campaign_session for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Shops: visibility-aware read, DMs write
create policy shop_read on public.shop for select
  using (
    public.is_dm(campaign_id, auth.uid())
    or (
      public.is_member(campaign_id, auth.uid()) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy shop_write on public.shop for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Scenes: visibility-aware read, DMs write
create policy scene_read on public.scene for select
  using (
    public.is_dm(campaign_id, auth.uid())
    or (
      public.is_member(campaign_id, auth.uid()) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy scene_write on public.scene for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- Campaign world state: DMs only
create policy campaign_world_state_read on public.campaign_world_state for select
  using (public.is_dm(campaign_id, auth.uid()));

create policy campaign_world_state_write on public.campaign_world_state for all
  using (public.is_dm(campaign_id, auth.uid()))
  with check (public.is_dm(campaign_id, auth.uid()));

-- ============================================
-- GENERATION TRACKING POLICIES
-- ============================================

-- Generation requests: accessible if world/campaign accessible
create policy generation_request_read on public.generation_request for select
  using (
    (world_id is null or public.has_world_access(world_id, auth.uid()))
    and (campaign_id is null or public.is_member(campaign_id, auth.uid()))
  );

create policy generation_request_write on public.generation_request for all
  using (
    (world_id is null or exists(
      select 1 from public.campaign c
      where c.world_id = generation_request.world_id
      and public.is_dm(c.id, auth.uid())
    ))
    and (campaign_id is null or public.is_dm(campaign_id, auth.uid()))
  )
  with check (
    (world_id is null or exists(
      select 1 from public.campaign c
      where c.world_id = generation_request.world_id
      and public.is_dm(c.id, auth.uid())
    ))
    and (campaign_id is null or public.is_dm(campaign_id, auth.uid()))
  );

-- Generation outputs: accessible if request accessible
create policy generation_output_read on public.generation_output for select
  using (
    exists(
      select 1 from public.generation_request r
      where r.id = generation_output.request_id
      and (
        (r.world_id is null or public.has_world_access(r.world_id, auth.uid()))
        and (r.campaign_id is null or public.is_member(r.campaign_id, auth.uid()))
      )
    )
  );

create policy generation_output_write on public.generation_output for all
  using (
    exists(
      select 1 from public.generation_request r
      where r.id = generation_output.request_id
      and (
        (r.world_id is null or exists(
          select 1 from public.campaign c
          where c.world_id = r.world_id
          and public.is_dm(c.id, auth.uid())
        ))
        and (r.campaign_id is null or public.is_dm(r.campaign_id, auth.uid()))
      )
    )
  )
  with check (
    exists(
      select 1 from public.generation_request r
      where r.id = generation_output.request_id
      and (
        (r.world_id is null or exists(
          select 1 from public.campaign c
          where c.world_id = r.world_id
          and public.is_dm(c.id, auth.uid())
        ))
        and (r.campaign_id is null or public.is_dm(r.campaign_id, auth.uid()))
      )
    )
  );

