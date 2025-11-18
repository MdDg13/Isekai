# NPC Generation Assessment - 2025-11-18

## Executive Summary

**Status:** ⚠️ **Context System NOT Engaged**

The new context graph system is **not being used** in NPC generation. All 6 NPCs analyzed show:
- No context indicators (cultures, factions, locations, world elements)
- Generic, repetitive bios
- Poor quality one-liners that just repeat the bio
- No evidence of source snippet integration

## Detailed Findings

### NPCs Analyzed

**6 NPCs total:**
- 3 random generated (first batch)
- 3 with prompt "a travelling performer with a dark past and a golden tongue" (level 1)

### Quality Issues

**All 6 NPCs have:**
1. **Generic repetitive bio pattern**: "A neutral [race] [class] known for their [class] nature and [temperament] demeanor"
2. **One-liner just repeats bio**: No unique content, just shortened version
3. **No context indicators**: No references to cultures, factions, locations, or world elements
4. **No source snippet integration**: No evidence of using the 56 source snippets in the database

### Example NPCs

**Bram Thornhill** (Commoner, human):
- Bio: "A neutral human commoner known for their commoner nature and humble demeanor."
- One-liner: "A neutral human commoner known for commoner and humble."
- Issues: Generic, repetitive, no context

**Saelia Nightwind** (Noble, elf):
- Bio: "A neutral elf noble known for their noble nature and patient demeanor."
- One-liner: "A neutral elf noble known for noble and patient."
- Issues: Generic, repetitive, no context

**Dorian Thornhill** (Ranger, human):
- Bio: "A neutral human ranger known for their ranger nature and brave demeanor."
- One-liner: "A neutral human ranger known for ranger and brave."
- Issues: Generic, repetitive, no context

### Prompt Following

**The 3 NPCs with prompt "a travelling performer with a dark past and a golden tongue":**
- **Tag parsing issue**: Tags are being split incorrectly:
  - Stored as: "a travelli", "g performer with a dark past a", "d a golde", "to", "gue"
  - Should be: "a travelling performer with a dark past and a golden tongue" (single tag or properly parsed)
- **No evidence of prompt being followed**: NPCs don't reflect "travelling performer", "dark past", or "golden tongue" themes

## Root Cause Analysis

### 1. AI Enhancement Likely Disabled

The context builder is only called if `WORKERS_AI_ENABLE` is set to `"true"`:

```typescript
const modelEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
if (modelEnabled) {
  // Context builder is called here
  const worldContext = await getWorldContext(...);
  // ...
}
```

**If `WORKERS_AI_ENABLE` is not set to `"true"` in Cloudflare Pages environment variables, the entire AI enhancement (including context) is skipped.**

### 2. Tag Parsing Bug

The tag parsing in `world-client.tsx` line 500-503:
```typescript
const keywordTags = npcForm.keywords
  .split(/[,\\n]+/)  // Double backslash is wrong
  .map(tag => tag.trim())
  .filter(tag => tag.length > 0);
```

**Issues:**
- Regex `/[,\\n]+/` should be `/[,\n]+/` (double backslash is incorrect)
- When user enters a phrase without commas, it should be treated as a single tag
- Current behavior splits on unexpected characters

### 3. No Logging

There's no logging to indicate:
- Whether context is being fetched
- Whether context fetch succeeded or failed
- What context was used in the prompt

## Recommendations

### Immediate Actions

1. **Check Cloudflare Pages Environment Variables:**
   - Verify `WORKERS_AI_ENABLE` is set to `"true"`
   - Verify `CLOUDFLARE_API_TOKEN` is set
   - Verify `CLOUDFLARE_ACCOUNT_ID` is set
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set

2. **Fix Tag Parsing:**
   - Fix regex in `world-client.tsx` line 501
   - Ensure phrases without commas are treated as single tags
   - Test with the prompt "a travelling performer with a dark past and a golden tongue"

3. **Add Diagnostic Logging:**
   - Log when context is fetched
   - Log context fetch success/failure
   - Log context content (truncated) in generation logs

### Verification Steps

1. **Check Cloudflare Pages Logs:**
   - Look for "Failed to fetch world context" warnings
   - Look for context fetch success messages
   - Check if AI enhancement is enabled

2. **Test Context Fetching:**
   ```bash
   npx tsx scripts/database/test-rpc-functions.ts
   ```
   - Should show all 3 RPC functions working

3. **Test with AI Enabled:**
   - Generate a new NPC with a specific prompt
   - Check if backstory includes context indicators
   - Check if NPC reflects the prompt

## Expected Behavior (When Working)

When the context system is engaged, NPCs should:
- Reference existing world elements (locations, factions, other NPCs)
- Include cultural/biome/tone context from source snippets
- Have diverse, interesting bios (not generic patterns)
- Follow user prompts more accurately
- Have unique one-liners (not just bio repeats)

## Files to Check

1. **Cloudflare Pages Environment Variables:**
   - Dashboard → Pages → isekai → Settings → Environment Variables

2. **Code Files:**
   - `functions/api/generate-world-npc.ts` (line 132 - AI enable check)
   - `src/app/world/[id]/world-client.tsx` (line 500-503 - tag parsing)

3. **Database:**
   - `source_snippet` table (should have 56 snippets)
   - `world_element` table (should have existing elements if any)

## Next Steps

1. ✅ Assessment complete
2. ⏳ Fix tag parsing bug
3. ⏳ Add diagnostic logging
4. ⏳ Verify Cloudflare environment variables
5. ⏳ Test with AI enabled
6. ⏳ Re-assess NPC quality

