# Isekai Project Migration & Reset Guide

## Quick Setup on a Fresh Machine

### 1. Prerequisites
- Node.js 20.x (https://nodejs.org/)
- Git (command line) and GitHub access
- Cursor IDE (or preferred editor, rules assume Cursor)
- Accounts with Supabase + Cloudflare Pages (project access)

### 2. Clone Repository
```powershell
git clone https://github.com/MdDg13/Isekai.git
cd Isekai
```

### 3. Install Dependencies
```powershell
cmd /c npm ci --no-fund --no-audit
```

### 4. Seed Environment Variables

#### Local Development (`.env.local`)
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xblkaezmfdhchndhkjsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>        # required for scripts/analyze-npcs.ps1
WORKERS_AI_ENABLE=true                              # enables AI enhancement in local Workers invocations
WORKERS_AI_MODEL=@cf/meta/llama-3.1-8b-instruct     # optional override
CLOUDFLARE_API_TOKEN=<token with Workers AI + Pages permissions>
CLOUDFLARE_ACCOUNT_ID=<account id>
```

Retrieve keys from Supabase Dashboard → Settings → API. Service role key is sensitive—never commit this file.

#### GitHub Repository Variables (build-time)
These must exist under **Settings → Secrets and variables → Actions → Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ENABLE_PAGES_ACTION` = `true`

Required secrets (Actions → Secrets):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

#### Cloudflare Pages Environment Variables (runtime)
Pages Dashboard → `isekai` project → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORKERS_AI_ENABLE` (`true` for AI pipeline)
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- Optional: `WORKERS_AI_MODEL`

Without `WORKERS_AI_ENABLE=true` the NPC generator falls back to procedural-only output.

### 5. Verify Tooling
```powershell
cmd /c npm run lint -- --max-warnings=0
cmd /c npx tsc --noEmit
cmd /c npm run test
```

### 6. Static Export Smoke Test
```powershell
cmd /c npm run build
```

Use `npm run check-logs` post-deploy to view wrangler summaries, or `npm run analyze-npcs` to inspect latest NPCs.

## Development Restart Checklist
Use this whenever returning after a break or recovering from interruption.

1. **Sync repo**
   - `cmd /c git status -sb` (ensure clean)
   - `$env:GIT_TERMINAL_PROMPT='0'; cmd /c git pull --rebase origin main --no-edit`
2. **Reload context**
   - Read `docs/CURSOR_CONTEXT.md` (current state)
   - Skim `docs/TODO_STATUS.md` or project board for open work
3. **Validate environment**
   - Confirm `.env.local` present with keys
   - If scripts need service role, test `npm run analyze-npcs`
4. **Quick health pass**
   - `npm run lint -- --max-warnings=0`
   - `npx tsc --noEmit`
   - `npm run test`
5. **Review deployment health**
   - `npm run check-logs` (ensures Cloudflare build succeeded)
   - Confirm latest deployment on GitHub Actions if needed
6. **Update Cursor rules**
   - Re-read `.cursorrules` / `docs/CURSOR_RULES.md` for enforced git patterns
7. **Set task focus**
   - Update local TODO or project issue tracker with next objective

## Account Access Reference
- GitHub: `MdDg13` (owner: Alex Peck – `alexpeck@hotmail.com`)
- Supabase project: `xblkaezmfdhchndhkjsv.supabase.co`
- Cloudflare Pages: project `isekai` (`isekai-f2i.pages.dev`)

## What’s Already Configured
- ✅ Supabase schema + RLS
- ✅ World NPC tables & Cloudflare functions
- ✅ GitHub Actions workflow for static export
- ✅ Git command guardrails + validation scripts
- ✅ Analysis tooling for NPC QA

## Troubleshooting Quick Hits
- **Lint/build fails**: run lint first, ensure Node 20+, delete `.next` if caching oddities
- **NPC quality issues**: `npm run analyze-npcs` and inspect logs; confirm `WORKERS_AI_ENABLE`
- **Deployment skipped**: ensure `ENABLE_PAGES_ACTION` repository variable is `true`
- **Git command hangs**: see `docs/CURSOR_RULES.md` and use `scripts/validate-git-pattern.ps1`

## Next Steps After Migration/Restart
1. Generate a world NPC using keywords, confirm AI pipeline active
2. Review TODO backlog and assign current priority (NPC prompt tuning, locations/items work)
3. Keep documentation in sync with any rule or workflow changes (`docs/CURSOR_RULES.md`, `.cursorrules`)
4. Run full validation loop before shipping (`lint → tsc → test → build`)
