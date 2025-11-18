# NPC Generation Analysis Report - 2025-11-18

## Executive Summary

**Status:** ⚠️ **CRITICAL ISSUE IDENTIFIED & FIXED**

All 6 NPC generations (3 random, 3 prompted) show:
- ✅ AI enhancement is ENABLED
- ❌ **Context fetch was FAILING** (SQL error in RPC function) - **NOW FIXED**
- ❌ NPCs are generic and repetitive (no context applied)
- ❌ Prompted NPCs don't reflect the prompt

## Detailed Findings

### Generation Logs Analysis

**All 6 generations show the same pattern:**

1. **PROCEDURAL**: ✅ Complete
2. **CONTEXT_FETCH**: ❌ **FAILED**
   - Error: `aggregate function calls cannot contain set-returning function calls`
   - This was a PostgreSQL SQL error in `get_world_context` RPC function
   - **FIXED**: Changed line 59 to properly unnest arrays before aggregating
3. **AI_ENHANCE**: ⚠️ Not logged (likely skipped due to context failure)
4. **CRITIQUE**: ⚠️ Not logged (likely skipped)
5. **STYLE_FIX**: ⚠️ Not logged (likely skipped)
6. **GRAMMAR_FIX**: ⚠️ Not logged (likely skipped)
7. **FINAL**: ✅ Complete (but with poor quality)

### Root Cause - FIXED

**SQL Error in `get_world_context` RPC Function:**

The error "aggregate function calls cannot contain set-returning function calls" occurred at line 59:

```sql
-- ❌ BROKEN:
array_agg(DISTINCT unnest(culture_tags || keywords))
```

**Fixed to:**
```sql
-- ✅ FIXED:
SELECT array_agg(DISTINCT elem)
INTO v_tags
FROM world_element,
     unnest(COALESCE(culture_tags, ARRAY[]::TEXT[]) || COALESCE(keywords, ARRAY[]::TEXT[])) AS elem
WHERE world_id = p_world_id;
```

### NPC Quality Issues

**All 6 NPCs have identical problems:**

1. **Generic repetitive bio pattern**: 
   - "A neutral [race] [class] known for their [class] nature and [temperament] demeanor"
   - This is the procedural fallback, not AI-enhanced

2. **One-liner just repeats bio**:
   - No unique content, just shortened version
   - Indicates AI enhancement didn't run properly

3. **No context indicators**:
   - No references to cultures, factions, locations
   - No source snippet integration
   - Context fetch failed, so no context was available

4. **Prompt not followed**:
   - The 3 prompted NPCs with "a travelling performer with a dark past and a golden tongue"
   - Don't reflect "travelling performer", "dark past", or "golden tongue" themes
   - AI enhancement likely didn't run due to context fetch failure

### Missing Steps

The logs show only 3 steps completed:
- `procedural` ✅
- `context_fetch` ❌ (failed - now fixed)
- `final` ✅

Missing steps (not logged, likely skipped):
- `ai_enhance` - Should run after context fetch
- `critique` - Should run after AI enhance
- `style_fix` - Should run after critique
- `grammar_fix` - Should run after style fix

**This suggests the code is exiting early when context fetch fails, skipping all AI enhancement.**

## Fix Applied

### SQL Error Fixed in `get_world_context.sql`

**Before (Broken):**
```sql
array_agg(DISTINCT unnest(culture_tags || keywords))
```

**After (Fixed):**
```sql
-- Extract tags from arrays (must unnest first, then aggregate)
SELECT array_agg(DISTINCT elem)
INTO v_tags
FROM world_element,
     unnest(COALESCE(culture_tags, ARRAY[]::TEXT[]) || COALESCE(keywords, ARRAY[]::TEXT[])) AS elem
WHERE world_id = p_world_id;
```

## Next Steps

1. ✅ **Fix SQL error** in `get_world_context.sql` - DONE
2. ⏳ **Redeploy RPC function** to Supabase (manual step required)
3. ⏳ **Test context fetch** with test script
4. ⏳ **Generate new NPCs** and verify logs show all steps
5. ⏳ **Verify quality** improves with context

## Expected Results After Fix

**After redeploying the fixed RPC function:**
- Context fetch should succeed
- AI enhancement should run with context
- NPCs should be unique and interesting
- Prompts should be followed
- Quality should match Therios sample level
- All generation steps should complete

## Files Modified

- `docs/db/rpc/get-world-context.sql` - Fixed line 59 SQL error
