# Dungeon World Integration Architecture

## Current Schema Analysis

### Two Location Systems

**1. `world_location` Table (2D Map Positioning)**
- Purpose: Places locations on the world's 2D map
- Fields: `id`, `world_id`, `name`, `description`, `region`, `coordinates` (JSONB: `{x, y}` or `{lat, lng}`)
- Use Case: Map markers, spatial relationships, travel routes

**2. `world_element` Table (Content Graph)**
- Purpose: Rich content for world elements (NPCs, locations, dungeons, factions, etc.)
- Fields: `id`, `world_id`, `type` (enum), `name`, `detail` (JSONB)
- Types: `'npc'`, `'location'`, `'faction'`, `'item'`, `'event'`, `'puzzle'`, `'hook'`, `'campaign_arc'`, `'ritual'`, `'dungeon'` (to be added)
- Use Case: Detailed content, relationships, lore

**3. `element_link` Table (Relationships)**
- Purpose: Links between world elements
- Link Types: `'belongs_to'`, `'controls'`, `'located_at'`, `'guards'`, etc.
- Use Case: "Dungeon A is located_at Town B", "Dungeon C is inside Dungeon A"

---

## How Dungeons Fit Into the World

### Scenario 1: Dungeon Entrance in a Town (2D Map)

```
World Map (2D)
├── Town "Riverside" (world_location: coordinates {x: 100, y: 200})
│   └── Dungeon "Ancient Crypt" (world_element type='dungeon')
│       └── Entrance at coordinates {x: 105, y: 205} (within town bounds)
```

**Implementation:**
- `world_location` entry for "Riverside" with coordinates
- `world_element` entry for "Ancient Crypt" (type='dungeon')
- `element_link`: `from_element=dungeon_id, to_element=town_location_id, link_type='located_at'`
- OR: Store entrance coordinates in `dungeon.detail.world_integration.entrance_coordinates`

### Scenario 2: Dungeon Inside Another Dungeon (Nested)

```
Dungeon "Castle Ruins" (world_element type='dungeon')
├── Room 5: "Hidden Basement"
│   └── Dungeon "Secret Catacombs" (world_element type='dungeon')
│       └── Entrance at Room 5 coordinates
```

**Implementation:**
- `world_element` entry for "Castle Ruins" (type='dungeon')
- `world_element` entry for "Secret Catacombs" (type='dungeon')
- `element_link`: `from_element=catacombs_id, to_element=castle_ruins_id, link_type='belongs_to'`
- Store entrance room reference: `dungeon.detail.world_integration.parent_dungeon_id` + `entrance_room_id`

### Scenario 3: Dungeon as Standalone POI on Map

```
World Map (2D)
├── Dungeon "Abandoned Mine" (world_location + world_element)
│   ├── world_location: coordinates {x: 500, y: 300} (map marker)
│   └── world_element type='dungeon': full dungeon detail
```

**Implementation:**
- `world_location` entry for map marker
- `world_element` entry for dungeon content
- Link them: `element_link` with `link_type='located_at'` OR store `world_location_id` in dungeon detail

---

## Recommended Architecture

### Option A: Dual Storage (Recommended)

**Dungeons stored in both systems:**

1. **`world_location`** - For 2D map positioning
   - Entry point coordinates on world map
   - Region, visibility
   - Quick reference

2. **`world_element` type='dungeon'** - For dungeon content
   - Full dungeon structure (rooms, corridors, doors)
   - Detailed descriptions
   - Relationships to other elements

3. **Link them:**
   - Store `world_location_id` in `dungeon.detail.world_integration.map_location_id`
   - OR use `element_link` with `link_type='located_at'`

**Benefits:**
- Clear separation: map positioning vs. content
- Supports both standalone dungeons and nested dungeons
- Easy to query "all locations on map" vs. "all dungeon content"

### Option B: Unified in world_element (Current Design)

**Dungeons only in `world_element`:**

1. **`world_element` type='dungeon'** - Contains everything
   - Dungeon structure in `detail`
   - Map coordinates in `detail.world_integration.entrance_coordinates`
   - Parent location in `detail.world_integration.parent_location_id`

2. **For 2D map rendering:**
   - Query `world_element` where `type='dungeon'` OR `type='location'`
   - Extract coordinates from `detail.world_integration.entrance_coordinates` or `detail.geography.coordinates`

**Benefits:**
- Single source of truth
- Consistent with other world elements
- Simpler queries for content graph

**Drawbacks:**
- Mixes map positioning with content
- Less clear separation of concerns

---

## Current Design Assessment

### What's Already Supported ✅

1. **Parent Location Reference:**
   ```typescript
   world_integration: {
     parent_location_id?: uuid; // Can reference world_element type='location'
   }
   ```

2. **Element Links:**
   - `element_link` table supports `'located_at'`, `'belongs_to'` relationships
   - Can link dungeon to town, or dungeon to dungeon

3. **Nested Structure:**
   - `parent_location_id` can reference another dungeon
   - Entry point stored in `structure.entry_point`

### What's Missing ⚠️

1. **Map Coordinates:**
   - No clear field for dungeon entrance coordinates on 2D world map
   - `parent_location_id` doesn't specify WHERE in the parent (which room/coordinates)

2. **Ambiguity:**
   - `parent_location_id` could reference:
     - `world_location` (map marker)
     - `world_element` type='location' (location content)
     - `world_element` type='dungeon' (nested dungeon)
   - No way to distinguish which

3. **Entrance Location:**
   - For nested dungeons: need to specify which room in parent dungeon
   - For map dungeons: need coordinates on world map

---

## Recommended Enhancement

### Update DungeonDetail Schema

```typescript
interface DungeonDetail {
  // ... existing fields ...
  
  world_integration: {
    // Map positioning (for 2D world map)
    map_location_id?: string; // References world_location.id (if on world map)
    entrance_coordinates?: {  // World map coordinates (if standalone POI)
      x: number;
      y: number;
      map_id?: string; // References world_map.id if multiple maps
    };
    
    // Parent location (for nested dungeons)
    parent_location_id?: string; // References world_element.id (location or dungeon)
    parent_location_type?: 'location' | 'dungeon'; // Clarify what parent is
    entrance_room_id?: string; // If parent is dungeon, which room contains entrance
    
    // Relationships
    connected_locations?: string[]; // Other locations accessible from here
    associated_factions?: Array<{
      faction_id: string;
      influence: "controls" | "inhabits" | "seeks" | "guards";
    }>;
  };
}
```

### Migration Strategy

1. **Add 'dungeon' to enum** (already created migration)
2. **Update dungeon generation** to support map coordinates
3. **Add UI** for selecting parent location and entrance coordinates
4. **Use `element_link`** for relationships (complement to JSONB fields)

---

## Implementation Recommendations

### For MVP (Current Phase)

**Keep it simple:**
- Store dungeons in `world_element` type='dungeon'
- Use `parent_location_id` in detail JSONB for nesting
- For 2D map: add `entrance_coordinates` to `world_integration` when needed
- Use `element_link` table for explicit relationships

**Future Enhancement:**
- Add `world_location` entries for dungeon entrances on map
- Link via `map_location_id` in dungeon detail
- Support querying "all map locations" including dungeon entrances

### For Full World Map Integration

**When implementing 2D world map:**
1. Create `world_location` entry for each dungeon entrance
2. Store `world_location_id` in `dungeon.detail.world_integration.map_location_id`
3. Query `world_location` for map rendering
4. Query `world_element` type='dungeon' for dungeon content

---

## World Map & Travel Integration

### Dungeon Entrances as Travel Nodes

**Key Requirement:** Dungeon entrances must be part of the travel/pathing network for:
- World map visualization (markers, zoom levels)
- Travel calculations (distance, time, terrain)
- Pathing algorithms (A*, Dijkstra for route finding)
- Encounter generation along routes

### Integration Strategy

**1. Dungeon Entrance as `world_location` Entry (Recommended)**

For dungeons that appear on the world map (standalone POIs or entrances in towns):

```sql
-- Create world_location entry for dungeon entrance
INSERT INTO world_location (
  world_id,
  name,
  description,
  region,
  coordinates,  -- {x: 500, y: 300}
  visibility
) VALUES (
  'world-uuid',
  'Ancient Crypt Entrance',
  'The entrance to the Ancient Crypt',
  'Northern Wastes',
  '{"x": 500, "y": 300}'::jsonb,
  'public'
);

-- Link dungeon to location
UPDATE world_element
SET detail = jsonb_set(
  detail,
  '{world_integration,map_location_id}',
  '"location-uuid"'::jsonb
)
WHERE id = 'dungeon-uuid';
```

**Benefits:**
- Dungeon appears in `world_location` queries (for map rendering)
- Can be part of travel route calculations
- Supports zoom levels (entrance visible at world zoom, dungeon detail at local zoom)
- Terrain/pathing algorithms can include dungeon entrances

**2. Coordinates in Dungeon Detail (Alternative)**

For nested dungeons or when `world_location` isn't created:

```typescript
world_integration: {
  entrance_coordinates: {
    x: 500,
    y: 300,
    map_id: 'world-map-uuid',
    zoom_level: 1  // World-level zoom
  }
}
```

**Query Strategy:**
- Query `world_location` for all map markers (includes dungeon entrances)
- Query `world_element` type='dungeon' for dungeon content
- Join on `map_location_id` or `entrance_coordinates`

### Travel & Pathing Integration

**Dungeon Entrances in Travel Network:**

1. **As Travel Destinations:**
   - Dungeon entrance = travel node
   - Can calculate distance/time from any location
   - Terrain modifiers apply to routes leading to dungeon

2. **As Route Waypoints:**
   - Routes can pass through dungeon entrances
   - "Travel from Town A → Dungeon Entrance → Town B"
   - Pathing algorithm includes dungeon as intermediate node

3. **Terrain-Based Pathing:**
   - Routes to dungeon consider terrain (forest, mountain, etc.)
   - `reference_terrain_type.travel_modifier` affects travel time
   - Encounter probability based on terrain + route difficulty

**Example Travel Calculation:**

```
Route: Town "Riverside" → Dungeon "Ancient Crypt"
- Distance: 15 miles (straight line)
- Terrain: Forest (travel_modifier: 1.5x)
- Route Type: Path (difficulty: moderate)
- Actual Travel Time: 15 miles × 1.5 = 22.5 miles equivalent
- Encounter Rolls: Based on forest terrain + moderate difficulty
```

### Zoom Levels & Map Layers

**Multi-Scale Visualization:**

1. **World Zoom (Level 1):**
   - Show: Towns, major landmarks, dungeon entrances
   - Dungeon appears as marker/icon
   - Click → Zoom to region or show dungeon detail

2. **Regional Zoom (Level 2):**
   - Show: Towns, roads, terrain, dungeon entrances
   - Dungeon entrance visible with label
   - Routes between locations visible

3. **Local Zoom (Level 3):**
   - Show: Detailed terrain, paths, dungeon entrance location
   - Can "enter" dungeon (switch to dungeon map view)

4. **Dungeon Zoom (Level 4):**
   - Show: Full dungeon map (rooms, corridors, doors)
   - Internal navigation only

**Implementation:**
- `entrance_coordinates.zoom_level` determines when dungeon appears
- `world_location.coordinates` used for map rendering
- Dungeon detail view triggered when clicking dungeon marker

### Pathing Algorithm Integration

**A* Pathfinding with Terrain:**

```typescript
interface PathNode {
  location_id: string;
  coordinates: { x: number; y: number };
  terrain_type: string;
  travel_modifier: number; // From reference_terrain_type
}

function calculateTravelPath(
  from: PathNode,
  to: PathNode,
  terrainMap: TerrainGrid
): {
  path: PathNode[];
  totalDistance: number;
  travelTime: number; // In hours/days
  difficulty: 'easy' | 'moderate' | 'hard' | 'dangerous';
  encounterProbability: number;
}
```

**Dungeon Entrances in Pathing:**
- Included as path nodes
- Can be intermediate waypoints
- Terrain around entrance affects path cost
- Encounter probability calculated for route segments

### Encounter Generation Along Routes

**Route-Based Encounters:**

When traveling to/from a dungeon:
1. Calculate route segments (each terrain type = segment)
2. Roll encounters per segment based on:
   - Terrain type (forest = different encounters than desert)
   - Route difficulty
   - Distance traveled
   - Proximity to dungeon (higher encounter rate near dangerous areas)

**Dungeon Proximity Modifiers:**
- Routes within 5 miles of dungeon: +20% encounter rate
- Routes within 1 mile: +50% encounter rate
- Encounters may be dungeon-related (scouts, patrols, etc.)

---

## Summary

**Current Design Status:**
- ✅ Supports nested dungeons (via `parent_location_id`)
- ✅ Supports relationships (via `element_link` table)
- ✅ Supports map coordinates (via `entrance_coordinates` or `map_location_id`)
- ✅ Supports travel/pathing (dungeon entrances as travel nodes)
- ✅ Supports terrain-based pathing (via `reference_terrain_type.travel_modifier`)

**Implementation Strategy:**
1. **Create `world_location` entries** for dungeon entrances on world map
2. **Link via `map_location_id`** in dungeon detail
3. **Include in travel queries** - dungeon entrances appear in location lists
4. **Support pathing** - entrances are nodes in travel network
5. **Terrain integration** - routes to dungeons respect terrain modifiers
6. **Zoom levels** - dungeons appear at appropriate zoom levels

**The design fully accounts for:**
- ✅ Nested dungeons (dungeon inside dungeon)
- ✅ Dungeons in towns (entrance in town location)
- ✅ Standalone dungeon POIs on world map
- ✅ Travel calculations to/from dungeons
- ✅ Terrain-based pathing through different biomes
- ✅ Encounter generation along routes
- ✅ Multi-scale map visualization (zoom in/out)

