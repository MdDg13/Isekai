# RPC Function Deployment Guide

This guide explains how to deploy the Supabase RPC functions required for Phase 2: Context Graph & APIs.

## Prerequisites

- Access to Supabase project dashboard
- SQL Editor access
- Service role key (for testing)

## Deployment Steps

### 1. Deploy `get_context_pack`

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/xblkaezmfdhchndhkjsv/sql/new
2. Copy contents of `docs/db/rpc/get-context-pack.sql`
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl+Enter)
5. Verify success: Should see "Success. No rows returned"

### 2. Deploy `get_random_snippets`

1. In SQL Editor, copy contents of `docs/db/rpc/get-random-snippets.sql`
2. Paste and run
3. Verify success

### 3. Deploy `get_world_context`

1. In SQL Editor, copy contents of `docs/db/rpc/get-world-context.sql`
2. Paste and run
3. Verify success

## Verification

After deployment, run the test script:

```bash
npx tsx scripts/database/test-rpc-functions.ts
```

Expected output:
- ✅ `get_context_pack` works
- ✅ `get_random_snippets` works
- ✅ `get_world_context` works (may fail if no worlds exist - that's OK)

## Troubleshooting

### Error: "function already exists"
- This is OK - the `CREATE OR REPLACE FUNCTION` will update it
- If you see this, the function was already deployed

### Error: "relation source_snippet does not exist"
- Ensure Phase 1 migration was run: `docs/db/migrations/2025-11-content-graph.sql`
- Check that `source_snippet` table exists in database

### Error: "type world_element_type does not exist"
- Ensure Phase 1 migration was run
- Check that enum `world_element_type` exists

### Error: "permission denied"
- Ensure you're using SQL Editor (not REST API)
- Check that you have admin access to the project

## Testing After Deployment

Once deployed, test via:

1. **Test Script**: `npx tsx scripts/database/test-rpc-functions.ts`
2. **Cloudflare Functions**: Deploy and test API endpoints
3. **Frontend**: Test from admin source library page

## Next Steps

After RPC functions are deployed:
- Test Cloudflare Functions (`functions/api/*.ts`)
- Verify context builder library works
- Test from frontend admin dashboard

