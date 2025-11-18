# Schema Enhancement Migration - Execution Guide

## Quick Start

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/xblkaezmfdhchndhkjsv/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy Migration SQL**
   - Open `docs/db/migrations/2025-11-schema-enhancement.sql`
   - Copy entire contents (Ctrl+A, Ctrl+C)

3. **Paste and Execute**
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success" message

4. **Verify Results**
   - Run verification queries below
   - Or run: `npx ts-node scripts/database/verify-migration.ts`

## Verification Queries

Run these in Supabase SQL Editor after migration:

### Check Indexes Were Created

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'world_element' 
ORDER BY indexname;
```

**Expected:** Should see indexes like:
- `idx_npc_race`
- `idx_npc_class`
- `idx_npc_level`
- `idx_location_biome`
- etc.

### Check Functions Were Created

```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'validate_%'
ORDER BY routine_name;
```

**Expected:** Should see:
- `validate_npc_detail`
- `validate_location_detail`
- `validate_faction_detail`

### Check Views Were Created

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%_with_%'
ORDER BY table_name;
```

**Expected:** Should see:
- `npc_with_location`
- `location_with_npc_count`

### Test View Access

```sql
-- Test npc_with_location view
SELECT * FROM npc_with_location LIMIT 5;

-- Test location_with_npc_count view
SELECT * FROM location_with_npc_count LIMIT 5;
```

**Expected:** Should return results (even if empty) without errors.

### Test Query Performance

```sql
-- Test NPC query (should use idx_npc_race if data exists)
EXPLAIN ANALYZE
SELECT * FROM world_element 
WHERE type = 'npc' 
AND detail->'identity'->>'race' = 'human';
```

**Expected:** Should show "Index Scan" or "Bitmap Index Scan" (not "Seq Scan").

## Troubleshooting

### Error: "relation 'world_element' does not exist"
**Solution:** Run `2025-11-content-graph.sql` first to create the base schema.

### Error: "index already exists"
**Solution:** This is fine - the migration uses `IF NOT EXISTS`, so it's idempotent.

### Error: "function already exists"
**Solution:** This is fine - the migration uses `CREATE OR REPLACE`, so it's safe to re-run.

### Views return errors
**Solution:** Check that `world_element` table exists and has the `detail` JSONB column.

## Rollback

If you need to rollback:

1. Open SQL Editor
2. Copy contents of `docs/db/migrations/2025-11-schema-enhancement-rollback.sql`
3. Paste and execute

**Note:** This only removes indexes, functions, and views. The `world_element` table structure remains unchanged.

## Next Steps

After successful migration:

1. ✅ Run verification script: `npx ts-node scripts/database/verify-migration.ts`
2. ✅ Document any issues in checkpoint
3. ✅ Proceed to Phase 1 Checkpoint 3: Post-Migration Validation

