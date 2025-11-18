# Isekai Development Context for Cursor

## Project Summary
Isekai is a world-building companion for DMs, built on Next.js 15.5.4 and React 19.1.0 with Supabase as the data backend. The app renders as a static export (Cloudflare Pages) and ships an AI-assisted content pipeline powered by a unified content graph. All world elements (NPCs, locations, items, puzzles, plot hooks, campaign arcs) derive from a curated source library and maintain cross-element relationships for narrative cohesion.

## Current State (Nov 2025)
- ✅ Authentication with magic links via Supabase
- ✅ Campaign + world dashboards with shared NPC library
- ✅ World NPC generator UI with keyword-driven prompts, list/detail toggle, selection + bulk delete
- ✅ Multi-stage Workers AI enhancement pipeline (procedural seed → enhancement → critique → style → grammar → QA)
- ✅ Cloudflare Pages deployments via GitHub Actions (`deploy.yml`) with log ingestion scripts
- ✅ Git command protection system (`.cursorrules`, `docs/GIT_COMMAND_PATTERNS.md`, `scripts/utilities/validate-git-pattern.ps1`)
- ✅ Theme system (light/dark) with persistent user preferences
- ✅ Unified content graph schema (Phase 0 complete - Nov 2025)
- 🔄 Source library ingestion (Phase 1 - in progress)
- 🔄 Context graph APIs and generation pipelines (Phase 2 - pending)

## Architecture: Content Graph System

### Database Schema
- **`world_element`** - Generic node table for all world content (NPCs, locations, items, puzzles, hooks, events, factions)
- **`element_link`** - Typed relationship edges (`belongs_to`, `rival_of`, `guards`, `spawned_by`, etc.)
- **`source_snippet`** - Normalized inspiration entries with license metadata and tags
- **`mechanic_template`** - Reusable mechanical patterns (traps, encounters, abilities)
- **`puzzle_blueprint`** - Puzzle/challenge templates with sensory cues
- **`campaign_arc`** - Multi-session story frameworks
- **Quality tracking**: `element_quality`, similarity vectors for deduplication

### Generation Pipeline
1. **Context Builder**: Queries world graph (locations, factions, existing elements) + user prompt
2. **Source Selection**: Pulls relevant snippets from curated library (folklore, literature, SRD, etc.)
3. **AI Generation**: Multi-stage enhancement with critique loops
4. **Relationship Linking**: Auto-creates `element_link` edges to existing world elements
5. **Quality Validation**: Similarity checks, completeness scoring, cross-element consistency

### Source Libraries (Phase 1)
- SRD variants (5e, A5E, Pathfinder 2e ORC)
- Folklore corpora (public domain mythology, oral histories)
- Literature (Shakespeare, classics, wuxia, cyberpunk)
- Open RPG supplements (Kobold Press, Mage Hand Press, CC-BY content)
- Socio-economic datasets (trade routes, conflicts, cultural patterns)
- Internal campaign logs and QC feedback

## Key Files & Directories
- `src/app/world/[id]/world-client.tsx` – Client surface for world dashboard
- `functions/api/generate-world-npc.ts` – Cloudflare Pages function implementing procedural + AI pipeline
- `functions/_lib/ai.ts` – Shared Workers AI helpers (`runWorkersAIText`, `runWorkersAIJSON`)
- `scripts/` – Organized by purpose:
  - `data-extraction/` – Content extraction and processing
  - `database/` – Backup, restore, population, analysis
  - `utilities/` – Git helpers, log checking, validation
- `.github/workflows/deploy.yml` – Static export deploy pipeline
- `.cursorrules` – Enforced Cursor terminal + git usage rules

## Database & Backend Notes
- **Supabase Project**: `xblkaezmfdhchndhkjsv.supabase.co`
- **Schema**: Unified content graph (see `docs/db/migrations/2025-11-content-graph.sql`)
- **Tables**: `world_element`, `element_link`, `source_snippet`, `mechanic_template`, `puzzle_blueprint`, `campaign_arc`, plus quality tracking tables
- `functions/api/generate-world-npc.ts` writes into `world_element` using Supabase service role (Cloudflare runtime)
- Scripts requiring elevated access read `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

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
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Required for database operations
WORKERS_AI_ENABLE=true                        # Enables AI pipeline when running functions locally
WORKERS_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
CLOUDFLARE_API_TOKEN=<token with Workers AI access>
CLOUDFLARE_ACCOUNT_ID=<account id>
```

## Active Focus / Open Work
- **Phase 1 (Current)**: Source library ingestion - building `docs/NPC_SOURCE_CATALOG.md` and ingestion scripts
- **Phase 2 (Next)**: Context graph APIs and generation pipeline updates
- **Phase 3 (Future)**: UI integration for locations, items, puzzles, campaign arcs
- Service worker + PWA offline mode (not started)

## Quick Reference Commands
- Lint + fix blockers: `npm run lint -- --max-warnings=0`
- Compile types: `npx tsc --noEmit`
- Unit tests: `npm run test`
- Build (static export): `npm run build`
- Analyze latest NPCs: `npm run analyze-npcs` (if script still in root)
- Deployment log fetch: `npm run check-logs`

## Project Plan
See `docs/PROJECT_PLAN.md` for detailed phase breakdown, checkpoints, and feasibility notes.

## Contact / Ownership
- Product owner & deployer: Alex Peck (`alexpeck@hotmail.com` / GitHub `MdDg13`)
- Repo: private GitHub (`MdDg13/Isekai`)
- Deploy target: Cloudflare Pages project `isekai`

## Architecture Notes
- Static export with forced trailing slash (Cloudflare requirement)
- Client components only where hooks/event handlers are needed
- Cloudflare Pages Functions act as API layer; Next.js API routes are disabled
- Workers AI used through Cloudflare-run `runWorkersAIText`/`runWorkersAIJSON` wrappers with strict JSON contracts
- All world content uses unified `world_element` table with type discrimination
- Cross-element relationships via `element_link` enable narrative cohesion
