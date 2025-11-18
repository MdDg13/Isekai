# Phase Acceptance Criteria & Checkpoints

## Strategy

**Hybrid Approach:**
- **Phase 1-2**: Detailed acceptance criteria now (ready to start)
- **Phase 3-6**: High-level criteria now, detailed as we approach each phase
- **Rationale**: Start fast, learn and adapt, maintain overall vision

---

## Phase 1: Schema Enhancement

### Acceptance Criteria

**Functional Requirements:**
- [ ] `world_element.detail` JSONB supports NPC schema (all fields from `INTEGRATED_WORLD_DESIGN.md`)
- [ ] `world_element.detail` JSONB supports location schema
- [ ] `world_element.detail` JSONB supports map schema
- [ ] `world_element.detail` JSONB supports faction schema
- [ ] Migration script is idempotent (can run multiple times safely)
- [ ] Migration includes rollback script
- [ ] All existing `world_npc` data can be migrated to new structure (if any exists)

**Quality Requirements:**
- [ ] GIN indexes created for commonly queried nested fields:
  - `(detail->'identity'->>'race')`
  - `(detail->'identity'->>'class')`
  - `(detail->'identity'->>'level')`
  - `(detail->'conflict'->>'active_conflict')`
  - `(detail->'world_integration'->>'primary_location_id')`
- [ ] Indexes improve query performance (verify with `EXPLAIN ANALYZE`)
- [ ] No breaking changes to existing API endpoints (if any)

**Performance Requirements:**
- [ ] Migration completes in <5 minutes on empty database
- [ ] Queries on indexed fields complete in <100ms
- [ ] JSONB queries don't cause full table scans

**Testing Requirements:**
- [ ] Migration script tested on empty database
- [ ] Migration script tested with sample data (if available)
- [ ] Rollback script tested
- [ ] Sample queries tested (fetch NPC by race, location by biome, etc.)

### Checkpoints

**Checkpoint 1: Schema Design Review**
- Review JSONB structure matches `INTEGRATED_WORLD_DESIGN.md`
- Verify all required fields are present
- Confirm indexes are appropriate

**Checkpoint 2: Migration Script Review**
- Review migration SQL for correctness
- Verify idempotency
- Test rollback script

**Checkpoint 3: Post-Migration Validation**
- Run sample queries to verify structure
- Check index performance
- Verify no data loss (if migrating existing data)

### Success Metrics

- ✅ Migration runs without errors
- ✅ All indexes created successfully
- ✅ Sample queries return expected results
- ✅ Query performance meets requirements
- ✅ Build still passes (`npm run build`)

---

## Phase 2: Generation Pipeline

### Acceptance Criteria

**Functional Requirements:**
- [ ] Context pack API returns world graph data (locations, factions, existing NPCs)
- [ ] NPC generation uses new schema structure
- [ ] NPC generation pulls relevant source snippets
- [ ] NPC generation creates `element_link` relationships automatically
- [ ] Location generation implemented
- [ ] Faction generation implemented
- [ ] Quality validation rules enforce:
  - NPCs have at least one location link
  - NPCs have at least one conflict
  - Locations have at least one NPC
  - Factions have at least one location and one NPC
- [ ] Similarity detection flags near-duplicates (cosine similarity >0.85)

**Quality Requirements:**
- [ ] Generated NPCs match Therios sample quality (human evaluation of first 10)
- [ ] 95% of generated NPCs have complete stat blocks (AC, HP, abilities, skills, saves)
- [ ] 100% of generated NPCs have at least one location link
- [ ] 100% of generated NPCs have at least one conflict
- [ ] 90% of generated NPCs have roleplay cues (voice, mannerisms)
- [ ] Generated locations have sensory details (sounds, smells, textures)
- [ ] Generated factions have clear goals and conflicts

**Performance Requirements:**
- [ ] NPC generation completes in <30 seconds per NPC
- [ ] Context pack API responds in <500ms
- [ ] Similarity check completes in <2 seconds per NPC
- [ ] Batch generation of 10 NPCs completes in <5 minutes

**Testing Requirements:**
- [ ] Unit tests for context pack API
- [ ] Unit tests for quality validation rules
- [ ] Integration test: Generate NPC → verify structure → verify relationships
- [ ] Manual test: Generate 10 NPCs, evaluate quality against Therios samples

### Checkpoints

**Checkpoint 1: Context Pack API**
- Review API design
- Test with sample world data
- Verify performance

**Checkpoint 2: NPC Generation (First Iteration)**
- Generate first 5 NPCs
- Review output quality
- Compare to Therios samples
- Refine prompts based on results

**Checkpoint 3: NPC Generation (Quality Validation)**
- Generate 10 NPCs
- Evaluate against acceptance criteria
- Check relationship linking
- Verify similarity detection

**Checkpoint 4: Location & Faction Generation**
- Generate 5 locations
- Generate 3 factions
- Verify integration with NPCs
- Check relationship creation

**Checkpoint 5: Full Pipeline Test**
- Generate small world (5 NPCs, 3 locations, 2 factions)
- Verify all relationships created
- Check quality scores
- Validate no orphaned elements

### Success Metrics

- ✅ Generated NPCs meet quality threshold (human evaluation)
- ✅ All validation rules pass
- ✅ Relationship linking works correctly
- ✅ Similarity detection prevents duplicates
- ✅ Performance meets requirements
- ✅ Build still passes

---

## Phase 3: Map System (High-Level)

### High-Level Acceptance Criteria

**Functional Requirements:**
- [ ] Maps can be created and stored
- [ ] Locations can be positioned on maps with coordinates
- [ ] NPCs appear on maps at their primary locations
- [ ] Routes between locations can be visualized
- [ ] Map can be displayed in UI
- [ ] Clicking map markers opens element detail views

**Quality Requirements:**
- [ ] Map rendering is performant (<2s load for 100 locations)
- [ ] Coordinates are accurate
- [ ] Routes are visually clear

**Decisions Needed Before Implementation:**
- [ ] Map library choice (Leaflet? Mapbox? Custom SVG?)
- [ ] Coordinate system (cartesian x,y or geographic lat/lng?)
- [ ] Map interaction design (zoom, pan, click behavior)
- [ ] Visual design (marker styles, route colors, layers)

**Detailed Criteria:** To be established in Phase 3 planning session

---

## Phase 4: One-Click Generation (High-Level)

### High-Level Acceptance Criteria

**Functional Requirements:**
- [ ] User can input generation parameters
- [ ] System generates world elements in logical order
- [ ] User can review generated elements
- [ ] User can approve, edit, regenerate, or delete elements
- [ ] System shows relationship graph
- [ ] User can refine relationships
- [ ] Final approval creates active world

**Quality Requirements:**
- [ ] Generation workflow is intuitive
- [ ] Preview shows enough information for decision-making
- [ ] Refinement tools are easy to use
- [ ] Error recovery is graceful

**Decisions Needed Before Implementation:**
- [ ] Workflow design (step-by-step process)
- [ ] Preview format (what information to show?)
- [ ] Refinement UI (how to edit/regenerate?)
- [ ] Relationship graph visualization (library choice?)

**Detailed Criteria:** To be established in Phase 4 planning session

---

## Phase 5: UI Integration (High-Level)

### High-Level Acceptance Criteria

**Functional Requirements:**
- [ ] All element types display in world dashboard
- [ ] Quick reference vs. full dossier views available
- [ ] Filters and search work for all element types
- [ ] Relationship navigation works
- [ ] Map integration in all relevant views

**Quality Requirements:**
- [ ] UI is responsive (mobile-friendly)
- [ ] Navigation is intuitive
- [ ] Performance is acceptable (<2s page loads)

**Decisions Needed Before Implementation:**
- [ ] Design system or component library
- [ ] Information hierarchy
- [ ] Responsive breakpoints

**Detailed Criteria:** To be established in Phase 5 planning session

---

## Phase 6: Quality & Polish (High-Level)

### High-Level Acceptance Criteria

**Functional Requirements:**
- [ ] Similarity detection runs automatically
- [ ] Quality scoring dashboard exists
- [ ] User feedback can be collected
- [ ] Prompt refinement based on feedback

**Quality Requirements:**
- [ ] Quality metrics are meaningful
- [ ] Feedback loop improves generation over time

**Detailed Criteria:** To be established in Phase 6 planning session

---

## Checkpoint Process

### Weekly Checkpoint Format

**1. Progress Review**
- What was completed this week?
- What's in progress?
- What's blocked?

**2. Quality Check**
- Do outputs meet acceptance criteria?
- Are there quality issues?
- What needs refinement?

**3. Performance Check**
- Are build times acceptable?
- Are API costs within budget?
- Are queries performant?

**4. Integration Check**
- Do components work together?
- Are there breaking changes?
- Is the build passing?

**5. Next Steps**
- What's the plan for next week?
- Are acceptance criteria still appropriate?
- Do we need to adjust the plan?

### Checkpoint Artifacts

**For Each Checkpoint, Document:**
- ✅ Completed items
- ⚠️ Issues found
- 🔄 In progress items
- 📋 Next steps
- 📊 Metrics (if applicable)

**Store in:**
- `docs/checkpoints/phase-{N}-checkpoint-{date}.md`

---

## Phase Transition Criteria

**A phase is complete when:**
- ✅ All acceptance criteria met
- ✅ All checkpoints passed
- ✅ Quality thresholds achieved
- ✅ Performance requirements satisfied
- ✅ Documentation updated
- ✅ Build passing
- ✅ Ready for next phase

**Before starting next phase:**
- [ ] Review previous phase learnings
- [ ] Establish detailed acceptance criteria for next phase
- [ ] Make any required decisions (libraries, designs, etc.)
- [ ] Update project plan if needed

---

## Risk Mitigation

### Common Risks & Mitigation

**Risk: Generated content quality is low**
- **Mitigation**: Early checkpoints with human evaluation, prompt refinement loop
- **Trigger**: Quality scores below threshold in Checkpoint 2

**Risk: Performance issues**
- **Mitigation**: Performance monitoring, early load testing
- **Trigger**: Build times >2x baseline, API costs >budget

**Risk: Integration failures**
- **Mitigation**: Integration tests, regular build checks
- **Trigger**: Build fails, tests fail

**Risk: Scope creep**
- **Mitigation**: Strict acceptance criteria, checkpoint reviews
- **Trigger**: New requirements added without updating criteria

**Risk: Technical debt**
- **Mitigation**: Code reviews, refactoring time in each phase
- **Trigger**: Code quality metrics decline

---

## Success Definition

**Project is successful when:**
- ✅ All phases complete with acceptance criteria met
- ✅ Generated content meets quality standards (Therios sample level)
- ✅ One-click generation works end-to-end
- ✅ Users can create and refine worlds effectively
- ✅ System is performant and maintainable
- ✅ Build safety maintained throughout

**Ongoing Success:**
- Quality improves over time (feedback loop working)
- User satisfaction is high
- System is extensible (new element types can be added)
- Technical debt is manageable

