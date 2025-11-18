# Phase 1 Checkpoint 2: Migration Ready for Execution

**Date:** 2025-11-17  
**Phase:** 1 - Schema Enhancement  
**Checkpoint:** 2 - Migration Ready  
**Status:** ✅ Ready for Manual Execution

## Current Status

✅ **Migration Script Created:** `docs/db/migrations/2025-11-schema-enhancement.sql`  
✅ **Rollback Script Created:** `docs/db/migrations/2025-11-schema-enhancement-rollback.sql`  
✅ **Verification Scripts Created:** 
- `scripts/database/check-migration-status.ps1`
- `scripts/database/verify-migration.ts`
- `scripts/database/test-schema-enhancement.ts`

✅ **Base Schema Verified:** `world_element` table exists  
❌ **Migration Not Run:** Views `npc_with_location` and `location_with_npc_count` not found

## Migration Execution

**Note:** Supabase doesn't expose direct SQL execution via REST API, so the migration must be run manually in the Supabase SQL Editor.

### Steps to Execute

1. **Open Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/xblkaezmfdhchndhkjsv/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy Migration SQL**
   - File: `docs/db/migrations/2025-11-schema-enhancement.sql`
   - Copy entire contents (Ctrl+A, Ctrl+C)

3. **Paste and Execute**
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success" message

4. **Verify Results**
   - Run: `powershell -ExecutionPolicy Bypass -File scripts/database/check-migration-status.ps1`
   - Or check manually in SQL Editor (see verification queries below)

## What the Migration Does

### Creates 15 Indexes
- **NPC Indexes:** race, class, level, alignment, conflict, primary_location
- **Location Indexes:** type, biome, region
- **Faction Indexes:** type
- **Element Link Indexes:** from_element, to_element, link_type, world_id
- **General Indexes:** world_element (world_id, type), element_quality checks

### Creates 3 Validation Functions
- `validate_npc_detail(JSONB)` - Validates NPC detail structure
- `validate_location_detail(JSONB)` - Validates location detail structure
- `validate_faction_detail(JSONB)` - Validates faction detail structure

### Creates 2 Convenience Views
- `npc_with_location` - Joins NPCs with their primary location
- `location_with_npc_count` - Shows locations with NPC counts

### Adds Documentation Comments
- Comments on `world_element.detail` column
- Comments on all indexes with usage examples

## Verification Queries

After running the migration, execute these in Supabase SQL Editor:

```sql
-- Check indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'world_element' 
ORDER BY indexname;

-- Check functions were created
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'validate_%'
ORDER BY routine_name;

-- Check views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%_with_%'
ORDER BY table_name;

-- Test view access
SELECT * FROM npc_with_location LIMIT 5;
SELECT * FROM location_with_npc_count LIMIT 5;
```

## Expected Results

**Indexes:** Should see 15+ indexes including:
- `idx_npc_race`
- `idx_npc_class`
- `idx_npc_level`
- `idx_location_biome`
- etc.

**Functions:** Should see 3 functions:
- `validate_npc_detail`
- `validate_location_detail`
- `validate_faction_detail`

**Views:** Should see 2 views:
- `npc_with_location`
- `location_with_npc_count`

## Next Steps

**After Migration:**
1. ✅ Run verification script
2. ✅ Document results in Checkpoint 3
3. ✅ Proceed to Phase 1 Checkpoint 3: Post-Migration Validation

## Troubleshooting

### Error: "relation 'world_element' does not exist"
**Solution:** Run `2025-11-content-graph.sql` first.

### Error: "index already exists"
**Solution:** This is fine - migration uses `IF NOT EXISTS`.

### Error: "function already exists"
**Solution:** This is fine - migration uses `CREATE OR REPLACE`.

### Views return errors
**Solution:** Check that `world_element` table exists and has `detail` JSONB column.

## Rollback

If needed, run `docs/db/migrations/2025-11-schema-enhancement-rollback.sql` in SQL Editor.

