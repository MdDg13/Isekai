# Database Migrations

## Migration Order

1. **2025-11-content-graph.sql** - Initial content graph schema (world_element, element_link, etc.)
2. **2025-11-schema-enhancement.sql** - Phase 1: Adds indexes and helper functions

## Running Migrations

### In Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Paste and run
4. Verify with test queries at bottom of migration file

### From Command Line (if you have psql access)

```bash
psql -h <supabase-host> -U postgres -d postgres -f 2025-11-content-graph.sql
psql -h <supabase-host> -U postgres -d postgres -f 2025-11-schema-enhancement.sql
```

## Rollback

If you need to rollback the schema enhancement:

```bash
psql -h <supabase-host> -U postgres -d postgres -f 2025-11-schema-enhancement-rollback.sql
```

**Note:** The content-graph migration does not have a rollback as it's the foundation schema. If you need to rollback, you would need to manually drop tables.

## Verification

After running migrations, verify with:

```sql
-- Check indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'world_element' 
ORDER BY indexname;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'validate_%';

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%_with_%';
```

## JSONB Schema Documentation

See `docs/INTEGRATED_WORLD_DESIGN.md` for complete JSONB schemas:
- NPC detail structure (Part 1)
- Location detail structure (Part 2)
- Map detail structure (Part 3)
- Faction detail structure (Part 4)

## Performance Testing

After migration, test query performance:

```sql
-- Test NPC race filter
EXPLAIN ANALYZE
SELECT * FROM world_element 
WHERE type = 'npc' 
AND detail->'identity'->>'race' = 'human';

-- Test NPC level filter
EXPLAIN ANALYZE
SELECT * FROM world_element 
WHERE type = 'npc' 
AND (detail->'identity'->>'level')::INTEGER >= 5;

-- Test location biome filter
EXPLAIN ANALYZE
SELECT * FROM world_element 
WHERE type = 'location' 
AND detail->'geography'->>'biome' = 'forest';
```

Expected: Index scans, not sequential scans. Query times <100ms for typical datasets.

