# Isekai Development Context for Cursor

## Project Summary
Isekai is a world-building companion for DMs, built on Next.js 15.5.4 and React 19.1.0 with Supabase as the data backend. The app renders as a static export (Cloudflare Pages) and ships an AI-assisted content pipeline for NPCs, locations, and future entities. Android delivery is planned via Capacitor using the same static assets.

## Current State (Nov 2025)
- ✅ Authentication with magic links via Supabase
- ✅ Campaign + world dashboards with shared NPC library
- ✅ World NPC generator UI with keyword-driven prompts, list/detail toggle, selection + bulk delete
- ✅ Multi-stage Workers AI enhancement pipeline (procedural seed → enhancement → critique → style → grammar → QA)
- ✅ Cloudflare Pages deployments via GitHub Actions (`deploy.yml`) with log ingestion scripts
- ✅ Git command protection system (`.cursorrules`, `docs/GIT_COMMAND_PATTERNS.md`, `scripts/validate-git-pattern.ps1`)
- ✅ NPC analysis tooling (`scripts/analyze-npcs.ps1`) powered by Supabase service role
- 🔄 Quality iteration on generated NPCs (ongoing prompt tuning and schema enforcement)
- 🔄 Expanded content generation for locations/items (UI scaffolding present, logic pending)

## Key Files & Directories
- `src/app/world/[id]/world-client.tsx` – Client surface for world dashboard (generation, list/detail views, actions)
- `functions/api/generate-world-npc.ts` – Cloudflare Pages function implementing procedural + AI pipeline
- `functions/_lib/ai.ts` – Shared Workers AI helpers (`runWorkersAIText`, `runWorkersAIJSON`)
- `scripts/` – Operational scripts (`check-logs.ps1`, `auto-fix-cycle.ps1`, `analyze-npcs.ps1`, `validate-git-pattern.ps1`)
- `.github/workflows/deploy.yml` – Static export deploy pipeline with wrangler error surfacing
- `.cursorrules` – Enforced Cursor terminal + git usage rules (mirrored in `docs/CURSOR_RULES.md`)

## Database & Backend Notes
- **Supabase Project**: `xblkaezmfdhchndhkjsv.supabase.co`
- Tables in active use: `campaigns`, `worlds`, `world_npcs` (+ future story entities)
- `functions/api/generate-world-npc.ts` writes into `world_npcs` using Supabase service role (Cloudflare runtime)
- Scripts requiring elevated access (`analyze-npcs.ps1`) read `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

## Deployment & Operations
- **Cloudflare Pages Project**: `isekai` (`isekai-f2i.pages.dev`)
- Builds triggered by push to `main`; requires repo variable `ENABLE_PAGES_ACTION=true`
- Required GitHub variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Pages env vars (runtime): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKERS_AI_ENABLE`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, optional `WORKERS_AI_MODEL`

## Local Environment (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xblkaezmfdhchndhkjsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Required for analysis scripts
WORKERS_AI_ENABLE=true                        # Enables AI pipeline when running functions locally
WORKERS_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
CLOUDFLARE_API_TOKEN=<token with Workers AI access>
CLOUDFLARE_ACCOUNT_ID=<account id>
```

## Active Focus / Open Work
- Continue tuning prompt heuristics for bard-class adherence, combat stat completeness, and narrative cohesion
- Extend keyword parsing beyond race/class/background (e.g., temperament synonyms, professions)
- Fill in generation logic for locations/items tabs leveraging shared AI helpers
- Service worker + PWA offline mode (not started)

## Quick Reference Commands
- Lint + fix blockers: `npm run lint -- --max-warnings=0`
- Compile types: `npx tsc --noEmit`
- Unit tests: `npm run test`
- Build (static export): `npm run build`
- Analyze latest NPCs: `npm run analyze-npcs`
- Deployment log fetch: `npm run check-logs`

## Contact / Ownership
- Product owner & deployer: Alex Peck (`alexpeck@hotmail.com` / GitHub `MdDg13`)
- Repo: private GitHub (`MdDg13/Isekai`)
- Deploy target: Cloudflare Pages project `isekai`

## Architecture Refresh
- Static export with forced trailing slash (Cloudflare requirement)
- Client components only where hooks/event handlers are needed; world NPC listing/generation is client
- Cloudflare Pages Functions act as API layer; Next.js API routes are disabled
- Workers AI used through Cloudflare-run `runWorkersAIText`/`runWorkersAIJSON` wrappers with strict JSON contracts
