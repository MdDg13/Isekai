# Isekai Content Graph Project Plan (Nov 2025 refresh)

This plan merges the recent NPC-quality strategy with a broader world-content roadmap. It assumes the existing Supabase data can be wiped (after archival) so we can apply a more coherent schema.

---

## Phase 0 – Reset & Baseline (1 week)

1. **Archive & purge**
   - Export current Supabase tables (`world`, `world_npc`, `campaign`, feedback) to `backups/2025-11-therios.sql`.
   - Drop existing data to avoid schema drift.
2. **Schema redesign**
   - Implement unified graph tables:
     - `world_element` (generic node covering NPCs, locations, items, puzzles, hooks, events, factions).
     - `element_link` (typed edges: `belongs_to`, `rival_of`, `guards`, `spawned_by`, etc.).
     - `source_snippet` (normalized inspiration entries with license + tags).
     - `mechanic_template`, `puzzle_blueprint`, `campaign_arc`.
   - Add support tables for qc metrics (`element_quality`, `similarity_vectors`).
3. **Checkpoints**
   - `npm run lint`, `npx tsc --noEmit`, `npm run build`.
   - Supabase migration scripts run cleanly (no manual fixes).

Feasibility: High—pure schema + infra work. Risk is data loss; mitigated by backups and scripted migrations.

---

## Phase 1 – Source Library Ingestion (2–3 weeks)

1. **Source catalog**
   - `docs/NPC_SOURCE_CATALOG.md` enumerating each source, license, tags, ingestion script.
   - Libraries: SRD variants, folklore corpora, literature (public domain), open RPG supplements, socio-economic datasets, internal campaign logs.
2. **Ingestion tooling**
   - `scripts/import-source-snippets.ts` for structured JSON/CSV.
   - Specialized scrapers (where licenses allow) for mythology, geography, puzzles, conflicts.
   - Tagging vocabulary: culture, biome, tone, archetype, conflict verbs, mechanics, sensory cues.
3. **Quality sampling**
   - Manual QC of first 50 entries per library to ensure tagging accuracy.
4. **Checkpoints**
   - After each library ingestion: run `npm run analyze-npcs` to ensure Supabase connectivity.
   - Weekly `npm run build` to ensure new schema references are tree-shake safe.

Feasibility: Medium—requires licensing diligence and tagging consistency. Use Notion/Sheets to manage review queues.

---

## Phase 2 – Context Graph & APIs (2 weeks)

1. **Graph services**
   - Supabase RPC or Edge Functions to fetch “context packs” per world (locations, factions, events, relationships).
   - Endpoints for random snippet selection with tag filters.
2. **Admin tooling**
   - Internal dashboard to browse `world_element` graph, approve/ban snippets, view similarity clusters.
3. **Checkpoints**
   - After RPC deployment, run integration tests (via `npm run analyze-npcs` hitting new endpoints).
   - `npm run build` to confirm new API hooks don’t break static export.

Feasibility: High—mostly SQL + Next admin views.

---

## Phase 3 – Generation Pipelines (3–4 weeks)

1. **NPC pipeline upgrade**
   - Context builder pulls world graph + source snippets.
   - Multi-pass AI (generation → critique → similarity guard). Write outputs into `world_element`.
2. **Locations / Items / Puzzles / Hooks**
   - Shared worker that accepts `elementType` and composes prompts from relevant snippets + world context.
   - Programmatic QC per type (e.g., puzzles must reference at least one clue stored in a linked location; items need origin event + mechanic template).
3. **Random vs Prompted modes**
   - Random: weighted selection from underrepresented tags.
   - Prompted: treat prompt as weighting rather than absolute; still anchored to world graph.
4. **Checkpoints**
   - After each element type: seed Therios with sample data, smoke-test UI tabs, run `npm run build`.
   - Nightly automated lint/tsc/build via GitHub Actions.

Feasibility: Medium/High—AI prompt engineering + QC logic are known patterns; biggest risk is inference cost (monitor Workers AI usage).

---

## Phase 4 – UI & User Workflows (2 weeks)

1. **World dashboard**
   - Display graph-derived relationships (e.g., NPC → faction → ongoing events).
   - Provide creation buttons for all element types with consistent menus.
2. **Content review**
   - Expand QC feedback UI so admins can flag entire elements, push them back into regeneration queue.
3. **Theme & UX polish**
   - Ensure light/dark parity for new components, reuse layout width system.
4. **Checkpoints**
   - After each major UI feature: `npm run lint`, `npx tsc`, `npm run build`.
   - CI nightly to catch regression.

Feasibility: High—leverages existing design system.

---

## Phase 5 – Continuous QA & Deployment (ongoing)

1. **Automated sanity tests**
   - Add Vitest suites for context-pack APIs and transformation functions.
   - Smoke tests verifying each element type renders in the app (Playwright-lite).
2. **Similarity monitoring**
   - Scheduled job to flag near-duplicate elements, queue for regeneration.
3. **Telemetry**
   - Track which generated elements users keep/edit; feed signals back into prompt weighting.
4. **Checkpoints**
   - Weekly: `npm run lint && npx tsc && npm run test && npm run build`.
   - Deployment log review via `npm run check-logs`.

Feasibility: Ongoing; low risk if scripts enforced.

---

## Project Flow Validation

- **Dependencies**: Phase 0 must finish before ingestion to avoid schema churn. Phase 1 + 2 can overlap (ingesting while building context APIs). Phase 3 requires graph endpoints ready. Phase 4 depends on generated data existing. Phase 5 runs in parallel once Phase 3 starts.
- **Build Safety**: Every phase includes explicit lint/tsc/build checkpoints; CI should gate merges. When data migrations occur, run `npm run build` with `NEXT_PUBLIC_*` env vars set to ensure static export still works.
- **Supabase reset**: Acceptable per user instruction. Ensure new schema migration is idempotent and captured in `docs/db/migrations/2025-11-content-graph.sql`.
- **Quality Bar**: `docs/NPC_THERIOS_SAMPLES.md` acts as spec. Use same structure for other element sample packs before enabling auto-generation.

This plan keeps implementation iterative while guaranteeing the app compiles and deploys after each milestone, preventing regression as the content system scales.

