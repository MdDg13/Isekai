# Integrated World Design: NPCs, Locations, Maps & One-Click Generation

## Executive Summary

This document provides a comprehensive, research-backed design for Isekai's unified world-building system. It integrates NPCs, locations, maps, items, puzzles, factions, and campaign arcs into a cohesive content graph that supports one-click world/campaign generation with user consultation and refinement.

**Key Innovations:**
- **Unified Element System**: All world content uses `world_element` with type-specific JSONB structures
- **Graph Relationships**: `element_link` connects all elements (NPCs ↔ Locations ↔ Factions ↔ Items ↔ Events)
- **Map Integration**: Locations have spatial coordinates, maps reference locations, NPCs positioned on maps
- **One-Click Generation**: Parameterized prompts generate interconnected world elements in logical order
- **Quality Assurance**: Multi-stage validation ensures coherence and completeness

---

## Part 1: NPC Design (Confirmed & Enhanced)

### Research Validation

**Industry Best Practices Confirmed:**
- ✅ Clear roles and motivations (quest giver, merchant, information broker)
- ✅ Distinct personalities with quirks and mannerisms
- ✅ Consistent behavior and speech patterns
- ✅ Integration into game world (locations, factions, relationships)
- ✅ Balance of detail vs. functionality
- ✅ Preparation for improvisation (escalation paths, multiple interaction options)
- ✅ Visual and behavioral cues (appearance, voice, mannerisms)

**D&D 5e SRD Alignment:**
- ✅ Complete stat blocks (AC, HP, abilities, skills, saves, actions)
- ✅ Challenge Rating for encounter balancing
- ✅ Spellcasting blocks for casters
- ✅ Equipment with mechanical properties

### Final NPC Structure

**Tier 1: Quick Reference Profile** (for immediate table use)
- Name, race, class, level, alignment
- One-sentence bio
- Active conflict
- 2-3 roleplay cues
- Basic stats (AC, HP, key abilities)
- 1-2 quest hooks

**Tier 2: Full Dossier** (for world-building and recurring NPCs)
- Complete identity, appearance, mechanical stats
- Full narrative (backstory, motivations, personality)
- Conflict with escalation paths
- DM tools (roleplay cues, quest hooks, services, secrets)
- World integration (locations, factions, relationships)

### NPC Detail JSONB Schema

```typescript
{
  // IDENTITY (indexed for queries)
  identity: {
    race: string,
    class: string,
    level: number,
    background: string,
    alignment: string,
    age?: string,
    gender?: string
  },
  
  // APPEARANCE & PRESENCE (sensory details for immersion)
  appearance: {
    physical_description: string,
    distinctive_features: string[],
    typical_attire: string,
    presence: "imposing" | "unassuming" | "mysterious" | "welcoming" | "threatening",
    sensory_details: {
      voice: string,              // "raspy baritone", "melodic soprano"
      mannerisms: string[],       // ["taps fingers", "avoids eye contact"]
      speech_patterns: string[], // ["uses metaphors", "speaks in questions"]
      catchphrases: string[],
      emotional_tells: string[]  // ["blinks rapidly when lying"]
    }
  },
  
  // MECHANICAL (D&D 5e SRD aligned)
  stats: {
    level: number,
    challenge_rating?: number,
    armor_class: number,
    hit_points: number,
    hit_dice?: string,
    speed: { base: number, climb?: number, swim?: number, fly?: number },
    abilities: { str, dex, con, int, wis, cha: number },
    saving_throws?: { str?, dex?, con?, int?, wis?, cha?: number },
    skills?: Array<{ name: string, modifier: number, proficiency?: boolean }>,
    senses?: { passive_perception: number, darkvision?: number, etc. },
    languages: string[],
    traits?: Array<{ name: string, description: string }>,
    actions?: Array<{ name, type, description, attack_bonus?, damage? }>,
    spellcasting?: { level, ability, spell_save_dc, spell_attack_bonus, spells_known?, spells_prepared?, spell_slots? }
  },
  
  // EQUIPMENT (structured for queries)
  equipment: {
    worn: Array<{ slot: string, name: string, description: string, properties?: Record<string, unknown> }>,
    carried: Array<{ name: string, quantity?: number, description: string, value?: number }>,
    stored?: Array<{ location: string, items: Array<{name, description}> }>
  },
  
  // NARRATIVE
  narrative: {
    bio: string,                    // One-sentence elevator pitch
    backstory: string,              // Extended history
    current_situation: string,      // What's happening now
    motivations: {
      primary_goal: string,
      secondary_goals: string[],
      fears: string[],
      desires: string[]
    },
    personality: {
      traits: string[],
      ideal: string,
      bond: string,
      flaw: string,
      temperament: string
    }
  },
  
  // CONFLICT & HOOKS (actionable story elements)
  conflict: {
    active_conflict: string,        // Current problem/threat
    conflict_stakes: string,         // What happens if unresolved
    escalation_paths: Array<{
      trigger: string,               // PC action that causes this
      outcome: string,               // How conflict escalates
      new_state: string              // New conflict state
    }>,
    resolution_possibilities: string[]
  },
  
  // DM TOOLS (immediately usable at table)
  dm_tools: {
    roleplay_cues: {
      first_impression: string,
      typical_behavior: string,
      reaction_to_pcs: string,
      secrets: string[],
      information_they_know: Array<{
        topic: string,
        detail: string,
        reveal_condition?: string
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
      availability?: string
    }>,
    plot_threads: Array<{
      thread: string,
      connection_to: string,
      significance: string
    }>
  },
  
  // WORLD INTEGRATION (graph relationships)
  world_integration: {
    primary_location_id: uuid,      // References world_element (location)
    frequent_locations: uuid[],
    faction_affiliations: Array<{
      faction_id: uuid,
      role: "member" | "leader" | "informant" | "ally" | "rival",
      standing: "trusted" | "neutral" | "suspicious" | "hostile"
    }>,
    economic_role: string,           // "merchant", "guard", "scholar", etc.
    social_standing: string,        // "noble", "commoner", "outcast"
    known_by: string[]              // Who in the world knows them
  }
}
```

---

## Part 2: Location Design

### Research Findings

**Location Design Best Practices:**
- **Layered Detail**: Quick description for first visit, deeper lore for exploration
- **Sensory Richness**: Sight, sound, smell, texture, temperature
- **Purpose-Driven**: Every location should serve a function (quest hub, resource, danger, mystery)
- **NPC Integration**: Locations should naturally host NPCs with clear reasons for being there
- **Map Positioning**: Spatial relationships matter (distance, terrain, routes)
- **History & Secrets**: Layers of discovery (surface appearance, hidden depths, historical significance)

### Location Detail JSONB Schema

```typescript
{
  // IDENTITY
  identity: {
    type: "settlement" | "dungeon" | "landmark" | "wilderness" | "structure" | "ruin",
    size?: "hamlet" | "village" | "town" | "city" | "metropolis",
    population?: number,
    government_type?: string,
    primary_economy?: string
  },
  
  // GEOGRAPHY & SPATIAL
  geography: {
    region: string,
    biome: "forest" | "desert" | "mountain" | "coastal" | "urban" | "underground" | "planar",
    terrain_features: string[],      // ["river", "cliffs", "ancient road"]
    climate: string,
    coordinates: {
      map_id?: uuid,                 // References world_map
      x: number,                     // Map coordinates
      y: number,
      zoom_level?: number            // For multi-scale maps
    },
    connections: Array<{             // Routes to other locations
      to_location_id: uuid,
      route_type: "road" | "path" | "river" | "teleport" | "secret",
      distance: number,              // In miles or days travel
      difficulty: "easy" | "moderate" | "hard" | "dangerous",
      description: string
    }>
  },
  
  // APPEARANCE & ATMOSPHERE
  appearance: {
    first_impression: string,        // What PCs see on arrival
    visual_description: string,      // Detailed appearance
    sensory_details: {
      sounds: string[],
      smells: string[],
      textures: string[],
      temperature: string,
      lighting: string
    },
    atmosphere: string,              // "oppressive", "welcoming", "mysterious"
    notable_features: string[]       // Distinctive landmarks/structures
  },
  
  // FUNCTION & PURPOSE
  function: {
    primary_purpose: "trade" | "defense" | "religious" | "scholarly" | "residential" | "adventure" | "mystery",
    services_available: Array<{
      type: string,                  // "inn", "blacksmith", "temple", "library"
      description: string,
      quality: "poor" | "average" | "good" | "excellent"
    }>,
    resources: string[],             // What can be obtained here
    dangers: string[],              // Threats present
    secrets: Array<{
      secret: string,
      discovery_method: string,      // How PCs might learn it
      significance: string
    }>
  },
  
  // HISTORY & LORE
  history: {
    founding_story: string,
    significant_events: Array<{
      event: string,
      timeframe: string,            // "50 years ago", "ancient"
      impact: string
    }>,
    current_events: string[],       // What's happening now
    legends: string[]               // Myths/stories about this place
  },
  
  // NPC INTEGRATION
  npc_integration: {
    residents: Array<{               // NPCs who live here
      npc_id: uuid,
      role: string,                  // "mayor", "innkeeper", "guard captain"
      location_specific: string      // Where in location they're found
    }>,
    frequent_visitors: Array<{        // NPCs who visit regularly
      npc_id: uuid,
      reason: string,
      schedule?: string              // "market days", "full moons"
    }>,
    associated_factions: Array<{
      faction_id: uuid,
      influence_level: "dominant" | "significant" | "minor" | "hidden",
      presence: string              // How they manifest here
    }>
  },
  
  // DM TOOLS
  dm_tools: {
    encounter_tables: Array<{        // Random encounters for this location
      time_of_day?: "day" | "night",
      trigger?: string,              // "wandering", "exploring", "resting"
      encounters: Array<{
        description: string,
        npc_ids?: uuid[],
        challenge_rating?: number,
        loot?: string
      }>
    }>,
    quest_hooks: Array<{
      type: string,
      title: string,
      description: string,
      npc_giver_id?: uuid,           // Who offers this quest
      location_specific: boolean     // Can only happen here
    }>,
    exploration_notes: string[],     // Things to discover through investigation
    hidden_areas: Array<{
      name: string,
      access_method: string,
      contents: string
    }>
  }
}
```

---

## Part 3: Map Integration

### Map System Design

**Multi-Scale Maps:**
- **World Map**: Continents, regions, major cities
- **Regional Map**: Provinces, towns, landmarks
- **Local Map**: City districts, building layouts
- **Dungeon Map**: Room-by-room layouts

**Map-Location-NPC Integration:**
- Locations have `coordinates` referencing `world_map.id`
- NPCs have `primary_location_id` → location has coordinates → renders on map
- Maps can have multiple layers (terrain, political, trade routes, danger zones)
- Clickable map markers link to location/NPC detail views

### Map Detail JSONB Schema

```typescript
{
  // MAP IDENTITY
  identity: {
    scale: "world" | "regional" | "local" | "dungeon",
    name: string,
    description: string,
    parent_map_id?: uuid              // For nested maps (city within region)
  },
  
  // SPATIAL DATA
  spatial: {
    bounds: {
      min_x: number,
      min_y: number,
      max_x: number,
      max_y: number
    },
    coordinate_system: "cartesian" | "geographic",  // x,y or lat,lng
    units: "miles" | "kilometers" | "feet" | "meters",
    zoom_levels: Array<{
      level: number,
      scale_factor: number,          // How much to zoom
      visible_layers: string[]       // Which layers show at this zoom
    }>
  },
  
  // LAYERS (for visual rendering)
  layers: Array<{
    name: string,                      // "terrain", "political", "trade_routes"
    type: "image" | "vector" | "marker",
    data: string | JSONB,             // Image URL or vector data
    opacity: number,
    z_index: number,
    visible_by_default: boolean
  }>,
  
  // MARKERS (clickable points)
  markers: Array<{
    type: "location" | "npc" | "event" | "custom",
    element_id?: uuid,                // References world_element
    coordinates: { x: number, y: number },
    label: string,
    icon?: string,                    // Icon identifier
    tooltip?: string
  }>,
  
  // ROUTES (paths between locations)
  routes: Array<{
    from_location_id: uuid,
    to_location_id: uuid,
    path: Array<{ x: number, y: number }>,  // Waypoints
    route_type: "road" | "path" | "river" | "trade_route",
    distance: number,
    difficulty: string
  }>
}
```

---

## Part 4: One-Click World Generation

### Generation Workflow

**User Input Parameters:**
```typescript
interface WorldGenerationParams {
  // Core Identity
  world_name: string,
  ruleset: "DND5E_2024" | "A5E" | "PF2E",
  theme: string,                      // "medieval fantasy", "cyberpunk", "steampunk"
  tone: "heroic" | "dark" | "comedic" | "mysterious",
  
  // Scope
  scope: {
    generate_npcs: boolean,
    generate_locations: boolean,
    generate_factions: boolean,
    generate_items: boolean,
    generate_campaign_arc: boolean,
    npc_count?: number,               // How many NPCs to generate
    location_count?: number,
    faction_count?: number
  },
  
  // Style Preferences
  style: {
    complexity: "simple" | "moderate" | "complex",
    detail_level: "quick_reference" | "full_dossier",
    interconnectivity: "loose" | "moderate" | "dense",  // How connected elements are
    conflict_level: "low" | "medium" | "high"
  },
  
  // Constraints
  constraints?: {
    cultures?: string[],                // Specific cultures to include
    biomes?: string[],                // Specific biomes
    power_level?: "low" | "medium" | "high",  // Average NPC/encounter level
    technology_level?: string
  }
}
```

### Generation Pipeline

**Step 1: Foundation (Factions & Major Locations)**
1. Generate 2-4 major factions with goals and conflicts
2. Generate 3-5 major locations (capitals, key cities, important landmarks)
3. Link factions to locations (control, influence, presence)
4. Create initial `element_link` relationships

**Step 2: Location Population (NPCs & Items)**
1. For each location:
   - Generate 2-5 NPCs appropriate to location type
   - Link NPCs to location (`located_at` relationship)
   - Generate 1-3 location-specific items
   - Create location services (shops, temples, etc.)
2. Generate 3-5 wandering/traveling NPCs
3. Link NPCs to factions where appropriate

**Step 3: Interconnection (Relationships & Hooks)**
1. Create NPC-to-NPC relationships (allies, rivals, family)
2. Create NPC-to-Item relationships (owns, seeks, guards)
3. Create location-to-location routes (trade, travel, political)
4. Generate quest hooks that span multiple elements

**Step 4: Campaign Arc (Optional)**
1. Identify primary conflict from faction relationships
2. Generate 3-5 session campaign arc with beats
3. Link arc to relevant NPCs, locations, items
4. Create escalation paths

**Step 5: Map Generation**
1. Create world map with generated locations positioned
2. Add routes between connected locations
3. Place NPC markers at their primary locations
4. Add faction territories/regions

**Step 6: Quality Validation**
1. Check all NPCs have at least one location link
2. Check all locations have at least one NPC
3. Check all factions have at least one location and one NPC
4. Verify no orphaned elements
5. Run similarity checks (flag near-duplicates)

### Prompt Templates

**NPC Generation Prompt:**
```
Generate a {race} {class} NPC named {name} for a {theme} {tone} campaign.

CONTEXT:
- World: {world_name}
- Location: {location_name} - {location_description}
- Faction: {faction_name} - {faction_goals} (role: {faction_role})
- Existing NPCs: {list_of_nearby_npcs}

REQUIREMENTS:
1. Identity: race, class, level {level}, alignment, background
2. Appearance: physical description, voice, mannerisms, distinctive features
3. Stats: Complete D&D 5e stat block (AC, HP, abilities, skills, saves, actions)
4. Equipment: Structured list with mechanical properties
5. Narrative: One-sentence bio, extended backstory, current situation
6. Conflict: Active conflict related to {faction_conflict} or {location_issue}
7. DM Tools: Roleplay cues, quest hooks, services offered, secrets
8. World Integration: Link to {location_name}, {faction_name}, and suggest 1-2 other connections

QUALITY STANDARDS:
- Memorable quirk or trait
- Actionable quest hook
- Clear roleplay cues for DM
- Complete mechanical stats
- Integration with existing world elements

OUTPUT FORMAT: JSON matching NPC detail schema
```

**Location Generation Prompt:**
```
Generate a {location_type} location named {name} for a {theme} {tone} campaign.

CONTEXT:
- World: {world_name}
- Region: {region_name}
- Biome: {biome}
- Nearby Locations: {list_of_nearby_locations}
- Controlling Faction: {faction_name} - {faction_goals}

REQUIREMENTS:
1. Geography: Region, biome, terrain features, coordinates
2. Appearance: First impression, visual description, sensory details (sounds, smells, textures)
3. Function: Primary purpose, services available, resources, dangers, secrets
4. History: Founding story, significant events, current events, legends
5. NPC Integration: Suggest 3-5 NPCs who would naturally be here (with roles)
6. DM Tools: Encounter tables, quest hooks, exploration notes, hidden areas

QUALITY STANDARDS:
- Clear purpose and function
- Rich sensory details
- Integration with existing locations and factions
- Actionable DM tools

OUTPUT FORMAT: JSON matching location detail schema
```

**Faction Generation Prompt:**
```
Generate a {faction_type} faction named {name} for a {theme} {tone} campaign.

CONTEXT:
- World: {world_name}
- Existing Factions: {list_of_existing_factions_with_goals}
- Primary Locations: {list_of_locations}

REQUIREMENTS:
1. Identity: Type, goals, ideology, structure
2. Resources: What they control (locations, items, NPCs)
3. Conflicts: Rivalries with other factions, internal tensions
4. NPCs: Suggest 3-5 key NPCs (leaders, agents, members)
5. Locations: Suggest 2-3 locations they control or influence
6. Campaign Hooks: How this faction can drive story

OUTPUT FORMAT: JSON matching faction detail schema
```

---

## Part 5: Element Integration Strategy

### Relationship Types & Usage

**NPC ↔ Location:**
- `located_at`: NPC's primary residence
- `visits`: NPC frequents this location
- `guards`: NPC protects this location
- `controls`: NPC has authority here

**NPC ↔ Faction:**
- `belongs_to`: NPC is member
- `controls`: NPC leads faction
- `rival_of`: NPC opposes faction
- `allied_with`: NPC supports faction

**NPC ↔ Item:**
- `owns`: NPC possesses item
- `seeks`: NPC wants item
- `guards`: NPC protects item
- `created`: NPC made item

**Location ↔ Faction:**
- `controls`: Faction rules location
- `influences`: Faction has presence
- `in_conflict_over`: Faction disputes control

**Location ↔ Location:**
- `connected_to`: Trade/travel route
- `near`: Geographic proximity
- `rival_of`: Competing settlements

**Item ↔ Location:**
- `located_at`: Item is here
- `hidden_in`: Item is concealed here
- `guards`: Location protects item

### Cross-Element Validation Rules

1. **NPC Validation:**
   - Must have at least one `located_at` link
   - Should have at least one `belongs_to` or `rival_of` faction link
   - Should have at least one conflict

2. **Location Validation:**
   - Should have at least one NPC `located_at`
   - Should have at least one faction `controls` or `influences`
   - Should have at least one connection to another location

3. **Faction Validation:**
   - Must have at least one location `controls` or `influences`
   - Should have at least 2-3 NPC `belongs_to` links
   - Should have at least one `rival_of` or `allied_with` other faction

4. **Item Validation:**
   - Should have at least one `located_at` or `owned_by` link
   - Should reference origin event or creator NPC

---

## Part 6: User Consultation & Refinement Workflow

### Generation Preview & Approval

**Step 1: Parameter Input**
- User fills form with world generation parameters
- System shows preview of what will be generated
- User can adjust parameters before generation

**Step 2: Batch Generation**
- System generates all elements in logical order
- Shows progress indicator
- Stores generated elements in draft state

**Step 3: Review & Refinement**
- User sees generated world summary:
  - List of NPCs with quick bios
  - List of locations with descriptions
  - List of factions with goals
  - Map preview with markers
- User can:
  - **Approve** element (moves to active)
  - **Edit** element (opens editor, regenerates if needed)
  - **Regenerate** element (keeps context, creates new version)
  - **Delete** element (removes and adjusts relationships)
  - **Request More** (generates additional elements of same type)

**Step 4: Relationship Review**
- System shows relationship graph visualization
- User can see:
  - Which NPCs are connected to which locations
  - Which factions control which areas
  - Quest hook chains (NPC → Location → Item → Conflict)
- User can:
  - Add new relationships
  - Remove relationships
  - Adjust relationship weights

**Step 5: Final Approval**
- User reviews complete world
- System runs final validation
- User approves → world becomes active
- User can continue refining after approval

### Refinement Tools

**Quick Edit Mode:**
- One-click edit for any element
- Regenerate specific fields (e.g., "regenerate NPC's conflict")
- Bulk operations (e.g., "regenerate all NPCs in this location")

**Relationship Editor:**
- Visual graph editor
- Drag-and-drop to create relationships
- Auto-suggest relationships based on element content

**Quality Dashboard:**
- Shows completeness scores
- Flags missing relationships
- Suggests improvements

---

## Part 7: Implementation Roadmap

### Phase 1: Schema Enhancement (Week 1)
- [ ] Update `world_element.detail` JSONB with NPC schema
- [ ] Add location detail schema
- [ ] Add map detail schema
- [ ] Add faction detail schema
- [ ] Create migration script
- [ ] Add GIN indexes for common queries

### Phase 2: Generation Pipeline (Weeks 2-4)
- [ ] Build context pack API (fetch world graph for prompts)
- [ ] Implement NPC generation with new schema
- [ ] Implement location generation
- [ ] Implement faction generation
- [ ] Implement relationship auto-linking
- [ ] Add quality validation rules

### Phase 3: Map System (Week 5)
- [ ] Create map storage and rendering
- [ ] Implement coordinate system
- [ ] Build marker placement UI
- [ ] Add route visualization
- [ ] Link map clicks to element detail views

### Phase 4: One-Click Generation (Weeks 6-7)
- [ ] Build parameter input UI
- [ ] Implement generation workflow
- [ ] Create preview/review interface
- [ ] Add refinement tools
- [ ] Build relationship graph visualizer

### Phase 5: UI Integration (Week 8)
- [ ] Update world dashboard with new element types
- [ ] Create quick reference vs. full dossier views
- [ ] Add filters and search
- [ ] Implement relationship navigation
- [ ] Add map integration to all views

### Phase 6: Quality & Polish (Ongoing)
- [ ] Automated similarity detection
- [ ] Quality scoring dashboard
- [ ] User feedback integration
- [ ] Continuous prompt refinement

---

## Conclusion

This integrated design provides:
- **Comprehensive NPC structure** aligned with D&D 5e and best practices
- **Rich location system** with spatial, sensory, and functional details
- **Map integration** connecting all elements visually
- **One-click generation** with user consultation and refinement
- **Quality assurance** through validation and similarity checks
- **Scalable architecture** supporting future element types

The unified `world_element` + `element_link` graph ensures all content is interconnected, creating a living, coherent world that supports rich storytelling and memorable gameplay.

