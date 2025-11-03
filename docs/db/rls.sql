-- Enable RLS on core tables with DM/Player semantics

alter table public.world enable row level security;
alter table public.campaign enable row level security;
alter table public.campaign_member enable row level security;
alter table public.npc enable row level security;
alter table public.location enable row level security;
alter table public.item enable row level security;
alter table public.arc enable row level security;
alter table public.beat enable row level security;
alter table public.encounter enable row level security;
alter table public.shop enable row level security;
alter table public.scene enable row level security;
alter table public.npc_interaction enable row level security;

-- Helpers
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

-- Campaign membership: only members can read campaign; DMs manage
create policy campaign_read on public.campaign for select
  using (public.is_member(id, auth.uid()));

create policy campaign_write on public.campaign for all
  using (public.is_dm(id, auth.uid())) with check (public.is_dm(id, auth.uid()));

-- Members table: user can see their own membership entries; DM manage all
create policy cm_read on public.campaign_member for select
  using (user_id = auth.uid() or public.is_dm(campaign_id, auth.uid()));

create policy cm_write on public.campaign_member for all
  using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

-- Visibility-aware read helper expression
-- Players: visibility in ('public','party') or listed in permitted_member_ids
-- DMs: full access

-- npc
create policy npc_read on public.npc for select
  using (
    public.is_dm(campaign_id, auth.uid())
    or (
      public.is_member(campaign_id, auth.uid()) and (
        visibility in ('public','party')
        or auth.uid() = any(permitted_member_ids)
      )
    )
  );

create policy npc_write on public.npc for all
  using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

-- npc interaction logs
create policy npc_interaction_read on public.npc_interaction for select using (
  public.is_dm(campaign_id, auth.uid()) or public.is_member(campaign_id, auth.uid())
);
create policy npc_interaction_write on public.npc_interaction for all using (
  public.is_dm(campaign_id, auth.uid())
) with check (
  public.is_dm(campaign_id, auth.uid())
);

-- Repeat the same visibility pattern for other narrative tables
create policy location_read on public.location for select using (
  public.is_dm(campaign_id, auth.uid()) or (
    public.is_member(campaign_id, auth.uid()) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy location_write on public.location for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

create policy item_read on public.item for select using (
  public.is_dm(campaign_id, auth.uid()) or (
    public.is_member(campaign_id, auth.uid()) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy item_write on public.item for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

create policy arc_read on public.arc for select using (public.is_member(campaign_id, auth.uid()));
create policy arc_write on public.arc for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

create policy beat_read on public.beat for select using (
  public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
  or (
    exists (
      select 1 from public.arc a
      where a.id = beat.arc_id and public.is_member(a.campaign_id, auth.uid())
    ) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy beat_write on public.beat for all using (
  public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
) with check (
  public.is_dm((select campaign_id from public.arc a where a.id = beat.arc_id), auth.uid())
);

create policy encounter_read on public.encounter for select using (
  public.is_dm(campaign_id, auth.uid()) or (
    public.is_member(campaign_id, auth.uid()) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy encounter_write on public.encounter for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

create policy shop_read on public.shop for select using (
  public.is_dm(campaign_id, auth.uid()) or (
    public.is_member(campaign_id, auth.uid()) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy shop_write on public.shop for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));

create policy scene_read on public.scene for select using (
  public.is_dm(campaign_id, auth.uid()) or (
    public.is_member(campaign_id, auth.uid()) and (
      visibility in ('public','party') or auth.uid() = any(permitted_member_ids)
    )
  )
);
create policy scene_write on public.scene for all using (public.is_dm(campaign_id, auth.uid())) with check (public.is_dm(campaign_id, auth.uid()));


