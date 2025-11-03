-- Minimal seed: one world and one campaign; members to be added manually

insert into public.world (name, slug, description, ruleset)
values ('Isekai Prime', 'isekai-prime', 'Primary world scaffold', 'DND5E')
on conflict (slug) do nothing;

insert into public.campaign (world_id, name, slug, summary)
select w.id, 'The Shattered Spire', 'the-shattered-spire', 'Mystery and planar fractures around an ancient spire'
from public.world w where w.slug = 'isekai-prime'
on conflict (slug) do nothing;


