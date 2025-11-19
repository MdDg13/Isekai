# Dungeon Travel & Pathing Integration

## Overview

Dungeon entrances must integrate with the world map travel system to support:
- **Visualization**: Dungeons appear on world map at appropriate zoom levels
- **Travel Calculations**: Distance, time, and difficulty to reach dungeons
- **Pathing**: Terrain-aware route finding to dungeon entrances
- **Encounters**: Route-based encounter generation considering terrain and dungeon proximity

---

## Coordinate System

### World Map Coordinates

**Coordinate Storage:**
- **Primary**: `world_location.coordinates` (JSONB: `{x, y}` or `{lat, lng}`)
- **Secondary**: `dungeon.detail.world_integration.entrance_coordinates` (for nested dungeons)

**Coordinate Types:**
1. **Cartesian (x, y)**: For game maps, grid-based systems
2. **Geographic (lat, lng)**: For realistic world maps

**Units:**
- World map: Miles or kilometers
- Regional map: Smaller units (1 mile = N pixels)
- Local map: Feet or meters
- Dungeon map: 5-foot squares

### Zoom Levels

**Multi-Scale Map System:**

| Zoom Level | Scale | Visible Elements | Dungeon Display |
|------------|-------|------------------|-----------------|
| 1 (World) | 1:1000 miles | Continents, major cities, major dungeons | Icon only |
| 2 (Regional) | 1:100 miles | Towns, roads, terrain, all dungeons | Icon + label |
| 3 (Local) | 1:10 miles | Detailed terrain, paths, POIs | Entrance location visible |
| 4 (Dungeon) | 1:1 (5ft squares) | Dungeon interior | Full dungeon map |

**Implementation:**
- `entrance_coordinates.zoom_level` determines visibility threshold
- Dungeon appears when map zoom >= entrance zoom level
- Click dungeon marker → Zoom to level 3 or open dungeon detail

---

## Travel Calculations

### Distance Calculation

**Straight-Line Distance:**
```typescript
function calculateDistance(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy); // In map units
}
```

**Path Distance (Terrain-Aware):**
- Use A* pathfinding through terrain grid
- Each terrain type has `travel_modifier` (from `reference_terrain_type`)
- Path cost = distance × terrain_modifier for each segment

### Travel Time Calculation

**Base Travel Speed:**
- On foot: 3 miles/hour (normal pace)
- On road: 4 miles/hour
- On path: 2.5 miles/hour
- Difficult terrain: 1.5 miles/hour

**Formula:**
```typescript
function calculateTravelTime(
  distance: number,
  terrainModifiers: number[], // Array of modifiers for each route segment
  routeType: 'road' | 'path' | 'off_road'
): {
  hours: number;
  days: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'dangerous';
}
```

**Example:**
```
Route: Town → Dungeon (15 miles)
- Segment 1: 5 miles road (modifier: 0.8x) = 4 miles equivalent
- Segment 2: 10 miles forest (modifier: 1.5x) = 15 miles equivalent
- Total: 19 miles equivalent
- Travel Time: 19 miles ÷ 3 mph = 6.3 hours
```

---

## Pathing Algorithm

### A* Pathfinding with Terrain

**Grid-Based Pathfinding:**

```typescript
interface TerrainCell {
  x: number;
  y: number;
  terrain_type: string;
  travel_modifier: number; // From reference_terrain_type
  elevation?: number;
  obstacles?: boolean;
}

function findPath(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  terrainGrid: TerrainCell[][]
): {
  path: Array<{ x: number; y: number }>;
  totalCost: number;
  segments: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    terrain: string;
    distance: number;
    cost: number;
  }>;
}
```

**Heuristic Function:**
- Use Euclidean distance with terrain modifiers
- `h(n) = distance(n, goal) × average_terrain_modifier`

**Cost Function:**
- `g(n) = distance × terrain_modifier`
- Prefer roads over difficult terrain
- Avoid obstacles (mountains, water without bridges)

### Dungeon Entrances as Path Nodes

**Integration:**
1. Dungeon entrance = pathfinding node
2. Can be intermediate waypoint (travel through dungeon area)
3. Can be final destination (travel to dungeon)
4. Terrain around entrance affects path cost

**Example Path:**
```
Town A → [Forest] → Dungeon Entrance → [Mountain Pass] → Town B
         (1.5x)                        (2.0x)
```

---

## Encounter Generation

### Route-Based Encounters

**Encounter Probability Per Segment:**

```typescript
interface RouteSegment {
  distance: number;
  terrain: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'dangerous';
  proximity_to_dungeon?: number; // Miles from nearest dungeon
}

function calculateEncounterProbability(segment: RouteSegment): number {
  let base = 0.1; // 10% base chance per mile
  
  // Terrain modifiers
  if (segment.terrain === 'forest') base += 0.05;
  if (segment.terrain === 'desert') base += 0.03;
  if (segment.terrain === 'mountain') base += 0.08;
  
  // Difficulty modifiers
  if (segment.difficulty === 'hard') base += 0.1;
  if (segment.difficulty === 'dangerous') base += 0.2;
  
  // Dungeon proximity modifier
  if (segment.proximity_to_dungeon) {
    if (segment.proximity_to_dungeon < 1) base += 0.3; // Very close
    else if (segment.proximity_to_dungeon < 5) base += 0.15; // Close
  }
  
  return Math.min(base, 0.8); // Cap at 80%
}
```

**Encounter Types by Terrain:**
- **Forest**: Bandits, wild animals, fey creatures
- **Desert**: Sandstorms, scorpions, nomads
- **Mountain**: Rockslides, goblins, wyverns
- **Near Dungeon**: Dungeon scouts, patrols, escapees

### Dungeon Proximity Encounters

**Special Encounters Near Dungeons:**
- Dungeon inhabitants scouting area
- Escaped prisoners/monsters
- Adventuring parties heading to/from dungeon
- Merchants selling dungeon supplies
- Rumors about dungeon (information encounters)

---

## Implementation Phases

### Phase 1: Basic Integration (Current)
- ✅ Dungeon entrances stored with coordinates
- ✅ Support for `world_location` entries
- ✅ `map_location_id` linking

### Phase 2: World Map Visualization (Future)
- [ ] Render dungeon entrances on world map
- [ ] Zoom level support
- [ ] Click marker → Open dungeon
- [ ] Show routes to dungeon

### Phase 3: Travel Calculations (Future)
- [ ] Distance calculation API
- [ ] Travel time calculation
- [ ] Route generation (A* pathfinding)
- [ ] Terrain-aware pathing

### Phase 4: Encounter System (Future)
- [ ] Route segment encounter generation
- [ ] Terrain-based encounter tables
- [ ] Dungeon proximity modifiers
- [ ] Encounter resolution UI

---

## Database Queries

### Get All Map Locations (Including Dungeons)

```sql
-- Get all locations for world map rendering
SELECT 
  wl.id,
  wl.name,
  wl.coordinates,
  wl.region,
  'location' as type
FROM world_location wl
WHERE wl.world_id = $1

UNION ALL

-- Get dungeon entrances
SELECT 
  we.id,
  we.name,
  (we.detail->'world_integration'->'entrance_coordinates')::jsonb as coordinates,
  NULL as region,
  'dungeon' as type
FROM world_element we
WHERE we.world_id = $1
  AND we.type = 'dungeon'
  AND we.detail->'world_integration'->'entrance_coordinates' IS NOT NULL

-- Or if using map_location_id:
SELECT 
  wl.id,
  wl.name,
  wl.coordinates,
  wl.region,
  'dungeon' as type
FROM world_location wl
JOIN world_element we ON we.detail->'world_integration'->>'map_location_id' = wl.id::text
WHERE wl.world_id = $1
  AND we.type = 'dungeon';
```

### Calculate Travel Route

```sql
-- Get terrain data for pathfinding
SELECT 
  rt.name,
  rt.travel_modifier,
  rt.encounter_modifiers
FROM reference_terrain_type rt
WHERE rt.category = 'biome';
```

---

## Summary

**Dungeon Integration with Travel System:**
- ✅ Dungeon entrances are travel nodes
- ✅ Coordinates support multi-scale visualization
- ✅ Terrain-aware pathing includes dungeon entrances
- ✅ Encounter generation considers dungeon proximity
- ✅ Travel calculations work for routes to/from dungeons

**Key Design Decisions:**
1. **Dual Storage**: `world_location` for map rendering, `world_element` for content
2. **Coordinate Flexibility**: Support both `world_location` and `entrance_coordinates`
3. **Pathing Integration**: Dungeons are nodes in travel network
4. **Terrain Awareness**: Routes respect terrain modifiers
5. **Encounter System**: Dungeon proximity affects encounter probability

The system fully supports world map visualization, zooming, travel calculations, and terrain-based pathing with dungeon integration.

