# Isekai Project History & Context

## Project Overview
Isekai is a cross-platform world-building assistant for tabletop DMs. It blends procedural systems with Workers AI to generate rich NPCs, items, and locations while keeping campaign management grounded in Supabase. The app ships as a static export on Cloudflare Pages and targets browsers first, with an Android wrapper via Capacitor on the roadmap.

## Core Feature Pillars
1. **Campaign & World Management** – Create worlds, organize campaigns, and share resources.
2. **Shared NPC Library** – Generate, review, and curate NPCs at the world level.
3. **Interactive Detail Views** – Toggle between list and rich detail modes with combat stat displays.
4. **AI-Assisted Authoring** – Multi-pass Workers AI pipeline improves creativity, grammar, and usability.
5. **Operational Guardrails** – Automated lint/test/build loops and git command validation.

## Technical Stack (Nov 2025)
- **Frontend**: Next.js 15.5.4 (App Router, static export), React 19.1.0, Tailwind 4, TypeScript 5.9
- **Backend**: Supabase (Postgres, Auth, Storage) accessed via client SDK + service role RPCs
- **Serverless Functions**: Cloudflare Pages Functions (TypeScript)
- **Deployment**: GitHub Actions → `wrangler deploy` (Cloudflare Pages)
- **Automation**: PowerShell scripts (`auto-fix-cycle.ps1`, `check-logs.ps1`, `analyze-npcs.ps1`)
- **ML / AI**: Cloudflare Workers AI (`runWorkersAIText`, `runWorkersAIJSON`)
- **Visualization (planned)**: Cytoscape.js, vis-timeline (dependencies installed)

## Development Timeline

### Phase 1 – Foundation (Complete)
- ✅ Repository + CI/CD wiring (GitHub Actions + Cloudflare Pages)
- ✅ Supabase schema with campaigns/worlds/NPC tables
- ✅ Authentication (Supabase magic links)
- ✅ Initial campaign & entity management UI

### Phase 2 – World & NPC Enhancements (Current)
- ✅ World dashboard with NPC generator/list/detail toggle
- ✅ NPC selection, bulk delete, stay-on-generator preference
- ✅ Multi-iteration AI pipeline with critique + grammar passes
- ✅ Git command safety net (`.cursorrules`, validation script, documentation)
- ✅ Deployment observability (`check-logs`, log summarisation in workflows)
- 🔄 Prompt tuning for keyword adherence (e.g. requested class/race fidelity)
- 🔄 Extend keyword taxonomy (professions, demeanours, setting cues)

### Phase 3 – Upcoming
- Graph view for entity relationships (Cytoscape scaffolding)
- Timeline / session journal (vis-timeline)
- Location & item AI generation parity with NPC pipeline
- Offline/PWA enhancements and Capacitor Android shell
- PDF or shareable exports

## Key Decisions & Rationale
1. **Static Export** – Required for Cloudflare Pages; influences routing (`generateStaticParams`, no ISR).
2. **Cloudflare Functions for APIs** – Aligns with static export constraints; API routes live in `functions/`.
3. **Workers AI** – Direct Cloudflare integration avoids external providers; strict JSON schema ensures reliability.
4. **Service Role Usage** – Kept server-side in functions/scripts, enabling RLS-safe operations (analysis tooling).
5. **Git Safety Rules** – Mandatory patterns documented to prevent hangs in Cursor/PowerShell environments.

## Database Snapshot
```sql
-- Core tables in use
worlds (id, name, created_by, created_at)
world_npcs (id, world_id, name, bio, backstory, traits, stats, created_at)
campaigns (id, world_id, name, created_by, created_at)
campaign_members (campaign_id, user_id, role, inserted_at)
```
*Additional legacy tables (entities, edges, sessions, revisions) remain for future expansion.*

## Operational Artifacts
- `.github/workflows/deploy.yml` – static export, wrangler deploy, deployment URL extraction
- `scripts/check-logs.ps1` – parse wrangler output for failures
- `scripts/analyze-npcs.ps1` – QA generated NPCs using service role key
- `docs/CURSOR_RULES.md` / `.cursorrules` – enforced terminal + git patterns

## Environment & Access Recap
- **GitHub**: `MdDg13/Isekai`
- **Owner**: Alex Peck (`alexpeck@hotmail.com`)
- **Supabase**: project `xblkaezmfdhchndhkjsv.supabase.co`
- **Cloudflare Pages**: project `isekai` (`isekai-f2i.pages.dev`)

## Recently Resolved Issues
1. Fixed NPC generator UI to drive class/race/background from keywords.
2. Added multi-step AI review pipeline (enhance → critique → style → grammar → QA).
3. Stabilized git usage in Cursor with documented patterns (`--no-pager diff`, etc.).
4. Improved deployment visibility (wrangler error extraction + check-logs updates).

## Known Workstreams
- Ongoing: improve AI adherence to explicit class/race requests.
- Planned: hook up location/item generation using same pipeline.
- Planned: integrate graph/timeline views once entity relationships surface again.
