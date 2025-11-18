# Generation Logs Migration

## Purpose

The `generation_log` table stores detailed logs of the NPC generation process for debugging and analysis. This allows us to:

1. Track each step of generation (procedural, context fetch, AI enhance, critique, style fix, grammar fix, final)
2. Identify where AI assistance is failing
3. Measure performance of each step
4. Debug issues with context fetching or AI responses

## Migration

Run the migration in Supabase SQL Editor:

```sql
-- Copy contents of docs/db/migrations/2025-11-generation-logs.sql
-- Paste and run in Supabase SQL Editor
```

## Usage

### Viewing Logs

After generating NPCs, logs are automatically stored. View them with:

```bash
# Analyze all recent generation logs
npx tsx scripts/database/analyze-generation-logs.ts

# Analyze logs for a specific NPC
npx tsx scripts/database/analyze-generation-logs.ts <npc_id>
```

### Log Structure

Each log entry contains:
- `generation_request_id` - Links to the generation request
- `world_id` - The world being generated for
- `step` - Generation step (procedural, context_fetch, ai_enhance, critique, style_fix, grammar_fix, programmatic_fix, final)
- `log_type` - Log level (info, warning, error, debug)
- `message` - Human-readable message
- `data` - Structured JSONB data (context snippets, AI responses, etc.)
- `duration_ms` - Time taken for this step
- `timestamp` - When the log was created

### Steps Tracked

1. **procedural** - Initial procedural NPC generation
2. **context_fetch** - Fetching world context and source snippets
3. **ai_enhance** - AI enhancement of the NPC
4. **critique** - Self-critique and targeted edits
5. **style_fix** - Style normalization (third-person, coherence)
6. **grammar_fix** - Grammar fixes (first-person removal)
7. **programmatic_fix** - Programmatic fixes (fallback summaries, pattern fixes)
8. **final** - Final NPC creation

## Analysis

The analysis script shows:
- Which steps completed successfully
- Which steps had errors or warnings
- Duration of each step
- Context fetch results (elements, snippets)
- AI enhancement results
- Critique issues found

## Troubleshooting

### No Logs Found

If `analyze-generation-logs.ts` shows "No generation logs found":
1. Check if `generation_log` table exists
2. Verify migration was run
3. Check if NPCs were generated after migration
4. Verify RLS policies allow reading logs

### Missing Steps

If logs show steps are missing:
- Check Cloudflare Pages logs for errors
- Verify `WORKERS_AI_ENABLE` is set to `"true"`
- Check if AI model is accessible
- Verify Supabase RPC functions are deployed

## Example Analysis Output

```
📊 Generation Log Analysis

Found 1 generation requests with logs

📋 Generation Request: a1b2c3d4...
   Tags: a travelling performer with a dark past and a golden tongue
   Logs: 15 entries

   PROCEDURAL:
      ✅ Starting procedural NPC generation
      ✅ Procedural generation complete
      ⏱️  Total duration: 5ms

   CONTEXT_FETCH:
      ✅ Fetching world context and source snippets
      ✅ World context fetched
         Elements: 0
         Snippets: 5
      ✅ Random snippets fetched
         Random snippets: 3
      ✅ Context formatted for prompt
         Context length: 1234
      ⏱️  Total duration: 234ms

   AI_ENHANCE:
      ✅ Starting AI enhancement
         Context used: true
         Model: @cf/meta/llama-3.1-8b-instruct
      ✅ AI enhancement complete
         Summary generated: true
      ⏱️  Total duration: 1234ms

   CRITIQUE:
      ✅ Starting self-critique
      ✅ Critique complete
         Issues found: 2
      ⏱️  Total duration: 567ms

   STYLE_FIX:
      ✅ Starting style normalization
      ✅ Style edits complete
      ⏱️  Total duration: 345ms

   GRAMMAR_FIX:
      ✅ Starting grammar fixes
      ⏱️  Total duration: 123ms

   FINAL:
      ✅ NPC generation complete
      ⏱️  Total duration: 2ms

   📊 Summary:
      Total steps: 7
      Total duration: 2510ms
      Errors: 0
      Warnings: 0
```

