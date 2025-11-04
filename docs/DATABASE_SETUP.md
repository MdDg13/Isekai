# Database Setup Guide

## Quick Setup

The database tables need to be created in Supabase. Follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `docs/db/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the schema

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

## Required Tables

The following tables must be created:

1. `world` - Stores world settings
2. `campaign` - Stores campaigns (references world)
3. `campaign_member` - Stores campaign membership
4. `npc` - Stores NPCs
5. `location` - Stores locations
6. `item` - Stores items
7. `arc` - Stores story arcs
8. `beat` - Stores story beats
9. `encounter` - Stores encounters
10. `shop` - Stores shops
11. `scene` - Stores scenes
12. `generation_request` - Stores AI generation requests
13. `generation_output` - Stores AI generation outputs
14. `npc_interaction` - Stores NPC interaction logs

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

