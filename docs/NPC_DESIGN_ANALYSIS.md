# NPC Design Analysis & Recommendations

## Executive Summary

This document analyzes current NPC design practices, compares them to industry standards and best practices, and proposes improved data structures for the Isekai content graph system.

**Key Findings:**
- Current structure is functional but lacks depth for memorable NPCs
- Missing critical DM-facing fields (roleplaying cues, hooks, conflict escalation)
- Stat blocks need better alignment with D&D 5e SRD format
- Relationship/connection system is good but underutilized
- Need better separation between "quick reference" and "deep detail"

**Recommendation:** Implement a two-tier structure: **NPC Profile** (quick reference) + **NPC Dossier** (deep detail), with improved field organization and DM-facing tools.

---

## Current State Analysis

### Existing Schema (`world_npc` table)

```sql
world_npc (
  id, world_id, name,
  bio,                    -- Brief description
  backstory,              -- Longer narrative
  traits JSONB,           -- {race, temperament, keywords, ideals, flaws, bonds}
  stats JSONB,            -- {level, abilities: {str, dex, con, int, wis, cha}, equipment}
  image_url, voice_id,
  location_id,            -- Single location reference
  affiliations JSONB,     -- Array of {type, name, ref_id}
  relationships JSONB,    -- Map of subject_id -> {attitude: -100..+100, notes}
  connections JSONB,      -- Array of {kind: 'npc'|'location'|'item', ref_id, label}
  visibility, created_at, created_by
)
```

### Current Generation Output Structure

From `functions/api/generate-world-npc.ts` and `functions/_lib/npc-procedural.ts`:

```typescript
{
  name: string,
  bio: string,                    // One-liner summary
  backstory: string,              // Extended narrative
  traits: {
    race, temperament, personalityTraits[], ideal, bond, flaw, background, class, keywords[]
  },
  stats: {
    level, abilities: {str, dex, con, int, wis, cha}, equipment: string
  }
}
```

### Strengths
- ✅ Basic structure covers core needs
- ✅ JSONB fields allow flexibility
- ✅ Relationships/connections support world-building
- ✅ Location linking exists
- ✅ Visibility controls for campaign management

### Weaknesses
- ❌ Missing roleplaying cues (voice, mannerisms, speech patterns)
- ❌ No explicit conflict/hook fields (buried in backstory)
- ❌ Stats incomplete (missing AC, HP, skills, saving throws, attacks)
- ❌ No DM-facing "how to use" guidance
- ❌ Equipment is just a string, not structured
- ❌ No quest/plot hook tracking
- ❌ Missing sensory details (appearance, environment)
- ❌ No escalation paths for conflicts

---

## Best Practices Research

### D&D 5e SRD NPC Stat Block Format

**Standard Fields:**
1. **Header:** Name, Size, Type, Alignment
2. **Armor Class (AC):** Base + modifiers
3. **Hit Points (HP):** Average + hit dice
4. **Speed:** Base movement + special modes
5. **Ability Scores:** STR, DEX, CON, INT, WIS, CHA (with modifiers)
6. **Skills:** Proficiencies with bonuses
7. **Senses:** Passive Perception, special senses
8. **Languages:** Known languages
9. **Challenge Rating (CR):** Combat difficulty
10. **Traits:** Special abilities (non-combat)
11. **Actions:** Combat abilities
12. **Reactions:** Reactive abilities
13. **Legendary Actions:** (if applicable)

### Industry Best Practices (RPG Design)

**Essential NPC Components:**

1. **Identity Layer**
   - Name, race, class, level
   - Appearance (detailed)
   - Age, gender (if relevant)
   - Alignment/moral compass

2. **Mechanical Layer**
   - Complete stat block (AC, HP, abilities, skills, saves)
   - Equipment (structured, not just text)
   - Special abilities/traits
   - Spell list (if applicable)

3. **Narrative Layer**
   - Background/history
   - Motivations/goals
   - Ideals, bonds, flaws
   - Current situation/conflict

4. **Roleplaying Layer** (Critical for DMs)
   - Voice/mannerisms
   - Speech patterns/catchphrases
   - Physical quirks
   - Emotional tells

5. **Gameplay Layer**
   - Quest hooks
   - Information they possess
   - Services they offer
   - Relationships with other NPCs/PCs

6. **World Integration**
   - Location(s) they frequent
   - Faction affiliations
   - Economic role
   - Social standing

### Memorable NPC Design Principles

**From "The NPC Handbook" and DM guides:**

1. **The Three Hooks Rule:** Every NPC should have:
   - A **conflict** (something they want/need/fear)
   - A **connection** (link to world/other NPCs/PCs)
   - A **quirk** (memorable trait/behavior)

2. **The Elevator Pitch:** Can you describe the NPC in one sentence that makes DMs want to use them?

3. **Actionable Details:** Information should be immediately usable at the table, not require interpretation.

4. **Scalable Depth:** Quick reference for first encounter, deeper detail for recurring NPCs.

5. **Conflict Escalation:** NPCs should have clear paths from "neutral" to "ally" or "enemy" based on PC actions.

---

## Comparison: Therios Samples vs Current Structure

### What Makes Therios Samples Excellent

**Example: Eris Thornwell**
- ✅ **Clear hook:** "Curates forbidden wing, records dreams as history"
- ✅ **Active conflict:** "Patron demon demands historical corrections"
- ✅ **Memorable quirk:** "Sleepwalks while writing; pages contain prophecies when read backward"
- ✅ **Roleplaying cues:** "Speaks in hushed present-tense; eyes glaze when playing back nightmares"
- ✅ **DM hooks:** "Needs protection during public reading; can reveal hidden fears"
- ✅ **Complete stats:** AC 12, HP 58, specific equipment with mechanical effects
- ✅ **Equipment details:** Not just "wand" but "wand of detect thoughts 3/day" with flavor

**What's Missing in Current Schema:**
- No dedicated `conflict` field (buried in backstory)
- No `roleplay_cues` field (mannerisms, voice, speech patterns)
- No `dm_hooks` field (specific quest/information hooks)
- Stats incomplete (no AC, HP, skills, saves)
- Equipment not structured (can't query/filter)

---

## Proposed Design: Two-Tier NPC Structure

### Design Philosophy

**Tier 1: NPC Profile** (Quick Reference)
- What DMs need at a glance
- One-page printable format
- Core stats, roleplaying cues, immediate hooks

**Tier 2: NPC Dossier** (Deep Detail)
- Full backstory, relationships, plot threads
- World integration details
- Escalation paths, secrets, hidden motivations

### Option A: Enhanced Single Table (Recommended)

Extend `world_element` (type='npc') with comprehensive JSONB structure:

```sql
world_element (
  -- Core fields (existing)
  id, world_id, type='npc', name, summary, detail JSONB,
  
  -- New/Enhanced detail JSONB structure:
  detail: {
    -- IDENTITY
    identity: {
      race: string,
      class: string,
      level: number,
      background: string,
      alignment: string,
      age?: string,
      gender?: string
    },
    
    -- APPEARANCE & PRESENCE
    appearance: {
      physical_description: string,
      distinctive_features: string[],
      typical_attire: string,
      presence: string,  // "imposing", "unassuming", "mysterious"
      sensory_details: {
        voice: string,      // "raspy baritone", "melodic soprano"
        mannerisms: string[], // ["taps fingers", "avoids eye contact"]
        speech_patterns: string[], // ["uses metaphors", "speaks in questions"]
        catchphrases: string[],
        emotional_tells: string[]  // ["blinks rapidly when lying"]
      }
    },
    
    -- MECHANICAL (D&D 5e aligned)
    stats: {
      level: number,
      challenge_rating?: number,
      armor_class: number,
      hit_points: number,
      hit_dice?: string,  // "8d8+16"
      speed: {
        base: number,
        climb?: number,
        swim?: number,
        fly?: number
      },
      abilities: {
        str: number, dex: number, con: number,
        int: number, wis: number, cha: number
      },
      saving_throws?: {
        str?: number, dex?: number, con?: number,
        int?: number, wis?: number, cha?: number
      },
      skills?: Array<{
        name: string,
        modifier: number,
        proficiency?: boolean
      }>,
      senses?: {
        passive_perception: number,
        darkvision?: number,
        truesight?: number,
        tremorsense?: number
      },
      languages: string[],
      traits?: Array<{
        name: string,
        description: string
      }>,
      actions?: Array<{
        name: string,
        type: "action" | "bonus_action" | "reaction" | "legendary",
        description: string,
        attack_bonus?: number,
        damage?: string
      }>,
      spellcasting?: {
        level: number,
        ability: "int" | "wis" | "cha",
        spell_save_dc: number,
        spell_attack_bonus: number,
        spells_known?: string[],
        spells_prepared?: string[],
        spell_slots?: Record<string, number>
      }
    },
    
    -- EQUIPMENT (structured)
    equipment: {
      worn: Array<{
        slot: string,  // "armor", "weapon", "accessory"
        name: string,
        description: string,
        properties?: Record<string, unknown>  // magical effects, etc.
      }>,
      carried: Array<{
        name: string,
        quantity?: number,
        description: string,
        value?: number
      }>,
      stored?: Array<{  // At home/base
        location: string,
        items: Array<{name: string, description: string}>
      }>
    },
    
    -- NARRATIVE
    narrative: {
      bio: string,  // One-sentence elevator pitch
      backstory: string,  // Extended history
      current_situation: string,  // What's happening now
      motivations: {
        primary_goal: string,
        secondary_goals: string[],
        fears: string[],
        desires: string[]
      },
      personality: {
        traits: string[],  // Personality traits
        ideal: string,
        bond: string,
        flaw: string,
        temperament: string
      }
    },
    
    -- CONFLICT & HOOKS
    conflict: {
      active_conflict: string,  // Current problem/threat
      conflict_stakes: string,  // What happens if unresolved
      escalation_paths: Array<{
        trigger: string,  // What PC action causes this
        outcome: string,  // How conflict escalates
        new_state: string  // New conflict state
      }>,
      resolution_possibilities: string[]  // How conflict could end
    },
    
    -- DM TOOLS
    dm_tools: {
      roleplay_cues: {
        first_impression: string,  // How they appear when met
        typical_behavior: string,
        reaction_to_pcs: string,  // Initial attitude
        secrets: string[],  // Hidden information
        information_they_know: Array<{
          topic: string,
          detail: string,
          reveal_condition?: string  // When/how they share it
        }>
      },
      quest_hooks: Array<{
        type: "information" | "escort" | "investigation" | "combat" | "social" | "fetch",
        title: string,
        description: string,
        reward?: string,
        urgency: "immediate" | "soon" | "whenever"
      }>,
      services: Array<{
        type: "merchant" | "information" | "training" | "safe_house" | "crafting",
        description: string,
        cost?: string,
        availability?: string  // "always", "daytime only", "by appointment"
      }>,
      plot_threads: Array<{
        thread: string,
        connection_to: string,  // Other NPC/location/event
        significance: string
      }>
    },
    
    -- WORLD INTEGRATION
    world_integration: {
      primary_location_id: uuid,  // References world_element (location)
      frequent_locations: uuid[],  // Other places they visit
      faction_affiliations: Array<{
        faction_id: uuid,
        role: string,  // "member", "leader", "informant"
        standing: "trusted" | "neutral" | "suspicious"
      }>,
      economic_role: string,  // "merchant", "guard", "scholar", etc.
      social_standing: string,  // "noble", "commoner", "outcast"
      known_by: string[]  // Who in the world knows them
    }
  }
)
```

### Option B: Separate Tables (Alternative)

Keep `world_element` minimal, create `npc_profile` and `npc_dossier`:

```sql
npc_profile (
  element_id UUID PRIMARY KEY REFERENCES world_element(id),
  -- Quick reference fields (indexed for fast queries)
  race, class, level, alignment,
  ac, hp, cr,
  roleplay_summary TEXT,  -- One-liner for quick reference
  conflict_hook TEXT,
  dm_hook TEXT
)

npc_dossier (
  element_id UUID PRIMARY KEY REFERENCES world_element(id),
  -- Deep detail (JSONB, less frequently queried)
  full_backstory JSONB,
  relationship_web JSONB,
  plot_threads JSONB,
  escalation_paths JSONB
)
```

**Recommendation:** Option A (enhanced single table) because:
- Simpler queries (one table)
- Better for content graph (all data in `world_element`)
- JSONB allows flexible querying with GIN indexes
- Easier to maintain consistency

---

## Field-by-Field Comparison

### Current vs Proposed

| Field Category | Current | Proposed | Improvement |
|--------------|---------|----------|-------------|
| **Identity** | `traits.race`, `traits.class` | `detail.identity.*` | Structured, includes alignment, age |
| **Appearance** | None | `detail.appearance.*` | Full sensory details, mannerisms |
| **Stats** | Partial (abilities only) | `detail.stats.*` | Complete D&D 5e stat block |
| **Equipment** | String | `detail.equipment.*` | Structured, queryable, with properties |
| **Conflict** | Buried in backstory | `detail.conflict.*` | Explicit, with escalation paths |
| **DM Tools** | None | `detail.dm_tools.*` | Roleplay cues, quest hooks, services |
| **World Links** | `location_id`, `affiliations` | `detail.world_integration.*` | More comprehensive, faction roles |

---

## Migration Strategy

### Phase 1: Schema Update
1. Add new JSONB structure to `world_element.detail` for NPCs
2. Create migration script to transform existing `world_npc` data
3. Add indexes on commonly queried nested fields:
   ```sql
   CREATE INDEX idx_npc_race ON world_element USING GIN ((detail->'identity'->>'race'));
   CREATE INDEX idx_npc_class ON world_element USING GIN ((detail->'identity'->>'class'));
   CREATE INDEX idx_npc_level ON world_element ((detail->'identity'->>'level'));
   CREATE INDEX idx_npc_conflict ON world_element USING GIN ((detail->'conflict'->>'active_conflict'));
   ```

### Phase 2: Generation Pipeline Update
1. Update `generate-world-npc.ts` to populate new structure
2. Enhance AI prompts to generate all new fields
3. Add validation to ensure completeness

### Phase 3: UI Updates
1. Create "Quick Reference" view (Profile tier)
2. Create "Full Dossier" view (Dossier tier)
3. Add filters/search for new structured fields

---

## Quality Benchmarks

### Minimum Viable NPC (Quick Reference)
- ✅ Name, race, class, level
- ✅ One-sentence bio
- ✅ Active conflict
- ✅ At least 2 roleplay cues
- ✅ Basic stats (AC, HP, abilities)
- ✅ At least 1 quest hook

### High-Quality NPC (Full Dossier)
- ✅ All minimum fields
- ✅ Complete stat block (skills, saves, actions)
- ✅ Detailed appearance with sensory cues
- ✅ Structured equipment with properties
- ✅ Escalation paths for conflict
- ✅ Multiple quest hooks
- ✅ World integration (location, faction, relationships)
- ✅ Secrets and hidden information

### Therios Sample Quality Level
- ✅ All high-quality fields
- ✅ Unique memorable quirk
- ✅ DM-facing "how to use" guidance
- ✅ Equipment with mechanical effects
- ✅ Clear connection to world factions/locations
- ✅ Multiple interaction possibilities

---

## Recommendations

### Immediate Actions

1. **Adopt Option A structure** (enhanced `world_element.detail` JSONB)
2. **Update generation pipeline** to populate all new fields
3. **Create migration script** for existing NPCs
4. **Add validation** to ensure quality benchmarks are met

### Future Enhancements

1. **NPC Relationship Visualizer** - Graph view of connections
2. **Conflict Tracker** - Track how NPC conflicts evolve with PC actions
3. **Quest Hook Manager** - Link NPC hooks to campaign arcs
4. **Voice/Appearance Generator** - AI-generated portraits/voice samples
5. **NPC Encounter Builder** - Suggest NPC combinations for scenes

---

## Conclusion

The current NPC structure is functional but lacks depth for memorable, DM-friendly characters. The proposed two-tier structure (Profile + Dossier) provides:

- **Quick reference** for immediate use at the table
- **Deep detail** for world-building and recurring NPCs
- **DM-facing tools** (roleplay cues, hooks, services)
- **Complete mechanical data** aligned with D&D 5e SRD
- **World integration** through structured relationships

This aligns with industry best practices, matches the quality of the Therios samples, and supports the content graph vision where NPCs are nodes in a rich, interconnected world.

