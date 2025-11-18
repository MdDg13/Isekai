# Command Hang Fixes

## Issue: npx Confirmation Prompts

**Problem:** `npx ts-node` commands hang when packages aren't installed, waiting for "Ok to proceed? (y)" confirmation.

**Root Cause:** npx prompts for user confirmation when installing packages, which is interactive and causes hangs in non-interactive terminals.

**Solution:**
1. Use `--yes` flag with npx: `npx --yes ts-node <script>`
2. Or use `tsx` which is already in the project: `npx tsx <script>`
3. Or install packages first: `npm install --save-dev ts-node`

**Updated Pattern:**
```bash
# ❌ BAD: Hangs on confirmation prompt
npx ts-node scripts/database/verify-migration.ts

# ✅ GOOD: Auto-confirms
npx --yes ts-node scripts/database/verify-migration.ts

# ✅ BETTER: Use tsx (already in project)
npx tsx scripts/database/verify-migration.ts
```

## Commands That Hung

1. `npx ts-node scripts/database/verify-migration.ts` - Cancelled (confirmation prompt)
2. `npx ts-node scripts/database/validate-phase1-complete.ts` - Cancelled (confirmation prompt)
3. `npx ts-node scripts/data-extraction/import-source-snippets.ts ... --dry-run` - Cancelled (confirmation prompt)

## Prevention Rules

- **Always use `--yes` with npx** when running one-off commands
- **Prefer `tsx` over `ts-node`** for TypeScript execution (already in project)
- **Install dev dependencies** if a script will be run frequently
- **Add timeout detection** for commands that might hang

## Updated Command Patterns

```bash
# TypeScript execution
npx tsx scripts/path/to/script.ts [args]

# Or with npx confirmation
npx --yes ts-node scripts/path/to/script.ts [args]

# Never without --yes
# ❌ npx ts-node scripts/path/to/script.ts
```

