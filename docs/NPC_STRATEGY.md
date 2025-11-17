## NPC Generation Strategy

The current pipeline produces usable results, but it still leans on a small set of patterns. To scale to “endless, interesting characters”, we need to combine broader data sources, layered creativity prompts, and automated QC. The plan below expands each stage.

### 1. Deep data infusion
- **Source corpora**: ingest open CC SRD descriptions, DM Guild free supplements, folklore databases, real-world cultural summaries, and procedurally generated prompt banks (locations, historical events, tensions).
- **Tagged traits**: normalize each source into structured tags (culture, profession, conflict, archetype, tone).
- **Conflict library**: maintain lists of micro-conflicts (family, guild politics, personal vice, promises, debts) so every NPC has at least one active tension.

### 2. Prompt diversification
- **Layered intent**: generation_request.prompt now stores base tags plus “hooks” (conflict + relationship + quirk). When the user provides few hints, we randomize hooks from the library to avoid generic outputs.
- **Archetype blender**: pick a primary archetype (mentor, rival, trickster) and blend with a counter-trait (e.g., “warm-hearted necromancer”) to create contrast.
- **Setting echo**: tie NPC goals to existing world resources (world locations, factions, recent NPCs) by querying Supabase for related records and referencing them in the prompt.

### 3. Multi-pass AI shaping
1. **Procedural base (already in place)** – ensures every NPC has stats and baseline lore.
2. **Constraint-focused enhancement (existing)** – but add explicit “freshness” rule requiring:
   - at least one unexpected skill or habit,
   - one active relationship (friend / rival / dependent),
   - one evolving goal with a built-in timer or trigger.
3. **Critique loop** – extend current critique to flag “similarity score” by comparing summary.oneLiner against recent NPC summaries (vector similarity). If overlap > 0.85, regenerate hooks before retrying.
4. **Readability polish (new step added in code)** – ensures bios, bullet points, and backstories stay concise and DM-usable.

### 4. Automatic QC & telemetry
- **Similarity index**: store embeddings for summary.oneLiner and backstory paragraphs. Nightly job finds near-duplicates and queues them for regeneration.
- **Play-test signals**: track when a DM pins/favorites an NPC or edits their backstory. Feed these signals back into the critique prompts as “examples of engaging NPCs”.
- **Theme coverage**: maintain counts per archetype/conflict; bias future generations toward underrepresented combos.

### 5. UX hooks
- **Global NPC library filters**: allow DMs to ask for “need a rival artificer who hates flying” and use the new tags to pull matches.
- **“Surprise me” button**: surfaces a curated NPC from the similarity-diverse pool when the DM is stuck mid-session.

This strategy keeps the generator fresh by ensuring every NPC has: (a) a unique hook, (b) actionable motivations, (c) cross-links to existing world elements, and (d) a QC loop that actively prunes repetition. As we expand the corpora and feedback signals, the system can continue producing high-variance characters without hand-written content.

