# Schema v2 Migration Guide

## Overview

This migration separates **world-level** content (shared across campaigns) from **campaign-level** content (game-specific). 

## Step 1: Apply New Schema

Run `docs/db/schema_v2.sql` in Supabase SQL Editor. This will:
- Create new world-level tables (`world_npc`, `world_location`, `world_item`, etc.)
- Create new campaign-level tables (`campaign_character`, `campaign_session`, `campaign_npc`, etc.)
- Keep existing campaign tables (`arc`, `beat`, `encounter`, etc.)

## Step 2: Migrate Existing Data (if any)

If you have existing NPCs, locations, or items in the old schema, you'll need to migrate them:

### Option A: Migrate to World Level (Recommended)

If your existing NPCs/locations/items should be shared across all campaigns:

```sql
-- Migrate NPCs to world level
-- First, get the world_id from the campaign
INSERT INTO public.world_npc (
  world_id, name, bio, backstory, traits, stats, 
  image_url, voice_id, location_id, affiliations, 
  relationships, connections, visibility, created_at, created_by
)
SELECT 
  c.world_id,
  n.name, n.bio, n.backstory, n.traits, n.stats,
  n.image_url, n.voice_id, n.location_id, n.affiliations,
  n.relationships, n.connections, n.visibility, n.created_at, n.created_by
FROM public.npc n
JOIN public.campaign c ON c.id = n.campaign_id;

-- Migrate locations to world level
INSERT INTO public.world_location (
  world_id, name, description, region, visibility, created_at, created_by
)
SELECT 
  c.world_id,
  l.name, l.description, l.region, l.visibility, l.created_at, l.created_by
FROM public.location l
JOIN public.campaign c ON c.id = l.campaign_id;

-- Migrate items to world level
INSERT INTO public.world_item (
  world_id, name, kind, rarity, props, visibility, created_at, created_by
)
SELECT 
  c.world_id,
  i.name, i.kind, i.rarity, i.props, i.visibility, i.created_at, i.created_by
FROM public.item i
JOIN public.campaign c ON c.id = i.campaign_id;
```

### Option B: Migrate to Campaign Level

If your existing NPCs/locations/items are campaign-specific:

```sql
-- Migrate NPCs to campaign_npc
INSERT INTO public.campaign_npc (
  campaign_id, name, bio, backstory, traits, stats,
  image_url, location_id, affiliations, relationships, 
  connections, visibility, permitted_member_ids, created_at, created_by
)
SELECT 
  n.campaign_id, n.name, n.bio, n.backstory, n.traits, n.stats,
  n.image_url, n.location_id, n.affiliations, n.relationships,
  n.connections, n.visibility, n.permitted_member_ids, n.created_at, n.created_by
FROM public.npc n;
```

## Step 3: Apply RLS Policies

Run `docs/db/rls_v2.sql` in Supabase SQL Editor to apply Row Level Security policies for the new schema.

## Step 4: Clean Up Old Tables (Optional)

After confirming the migration worked, you can drop the old tables:

```sql
-- WARNING: Only run this after confirming migration worked!
-- DROP TABLE IF EXISTS public.npc;
-- DROP TABLE IF EXISTS public.location;
-- DROP TABLE IF EXISTS public.item;
-- DROP TABLE IF EXISTS public.npc_interaction;
```

## Step 5: Update Application Code

The application code has already been updated to use the new schema:
- World NPCs: `world_npc` table
- Campaign NPCs: `campaign_npc` table
- World locations: `world_location` table
- Campaign-specific content: `campaign_character`, `campaign_session`, etc.

## Verification

After migration, verify:

1. **World-level content**:
   ```sql
   SELECT COUNT(*) FROM public.world_npc;
   SELECT COUNT(*) FROM public.world_location;
   SELECT COUNT(*) FROM public.world_item;
   ```

2. **Campaign-level content**:
   ```sql
   SELECT COUNT(*) FROM public.campaign_npc;
   SELECT COUNT(*) FROM public.campaign_character;
   SELECT COUNT(*) FROM public.campaign_session;
   ```

3. **RLS policies**:
   - Try accessing world NPCs as a campaign member
   - Try accessing campaign NPCs as a campaign member
   - Verify DM-only content is protected

## Rollback Plan

If you need to rollback:

1. Keep the old tables (`npc`, `location`, `item`) until you're confident
2. The application can be updated to use old tables if needed
3. RLS policies for old tables are still in `docs/db/rls.sql`

## Notes

- **World-level content** is shared across ALL campaigns in that world
- **Campaign-level content** is specific to ONE campaign/game
- NPCs can exist at both levels:
  - World NPCs: Part of the world lore (e.g., "The King of the Realm")
  - Campaign NPCs: Created for a specific game (e.g., "Random guard the party met")
- Campaign NPCs can optionally link to world NPCs via `world_npc_id`

