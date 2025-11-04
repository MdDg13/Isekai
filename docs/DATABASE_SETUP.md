# Database Setup Guide

## Quick Setup

The database tables need to be created in Supabase. Follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

**For New Installations:**
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `docs/db/schema_v2.sql` (use v2 for new installations)
4. Paste into the SQL Editor
5. Click **Run** to execute the schema
6. Then run `docs/db/rls_v2.sql` to apply Row Level Security policies

**For Existing Installations (Migration):**
1. See `docs/db/MIGRATION_V2.md` for migration instructions
2. Run `docs/db/schema_v2.sql` to create new tables
3. Migrate existing data (see migration guide)
4. Run `docs/db/rls_v2.sql` to apply new RLS policies

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply the schema
supabase db push
```

Or directly:

```bash
psql -h your-db-host -U postgres -d postgres -f docs/db/schema.sql
```

### Option 3: Manual Table Creation

If the above methods don't work, you can create tables manually in the Supabase dashboard:

1. Go to **Table Editor** in Supabase dashboard
2. Create each table manually using the schema definitions

## Required Tables (Schema v2)

### Core Tables
1. `world` - Stores world settings
2. `campaign` - Stores campaigns (references world)
3. `campaign_member` - Stores campaign membership

### World-Level Tables (Shared Across Campaigns)
4. `world_npc` - World NPCs (shared across all campaigns)
5. `world_location` - World locations (cities, dungeons, landmarks)
6. `world_item` - World items (magic items, artifacts)
7. `world_map` - World maps
8. `world_lore` - World lore (history, mythology, legends)
9. `world_climate` - Climate/weather patterns
10. `world_technology` - Technology/magic systems
11. `world_faction` - Factions (organizations, guilds, religions)

### Campaign-Level Tables (Game-Specific)
12. `campaign_character` - Player characters
13. `campaign_npc` - Campaign-specific NPCs
14. `campaign_interaction` - NPC interaction logs
15. `arc` - Story arcs
16. `beat` - Story beats within arcs
17. `encounter` - Combat encounters
18. `campaign_session` - Session logs
19. `shop` - Shops (campaign-specific)
20. `scene` - Scenes/descriptions
21. `campaign_world_state` - Track world changes from campaign

### Generation Tracking
22. `generation_request` - AI generation requests
23. `generation_output` - AI generation outputs

## Required Types

The following custom types must be created:

1. `campaign_role` enum: `'dm'`, `'player'`
2. `visibility` enum: `'public'`, `'party'`, `'dm_only'`

## After Schema Setup

1. Apply RLS policies: Run `docs/db/rls.sql` in SQL Editor
2. (Optional) Seed initial data: Run `docs/db/seed_campaigns.sql` in SQL Editor

## Verify Setup

After applying the schema, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all the tables listed above.

