# Dungeon Builder Design Document

## Executive Summary

This document outlines the design for Isekai's AI-assisted random dungeon generator. The system will procedurally generate multi-level dungeons with rooms, corridors, doors, stairs, and logical pathing, with optional AI enhancement for thematic coherence and narrative integration.

**Key Features:**
- **Dual Generation Modes:**
  - **Random Generation**: Procedural using Binary Space Partitioning (BSP) algorithm
  - **Tile-Based Generation**: Wave Function Collapse (WFC) from physical tile pool
- Multi-level support with stairs between levels
- Grid-based visualization (SVG/Canvas)
- Physical tile representation (5x5cm tiles = 2x2 grid of 5ft squares)
- AI enhancement for thematic coherence
- Integration with existing world_element schema
- Future: Encounters, treasure, traps population

---

## Part 1: Research & Best Practices

### Algorithm Research

**Binary Space Partitioning (BSP):**
- Divides space recursively into rooms
- Ensures all rooms are connected via corridors
- Produces organic, non-linear layouts
- Industry standard (used in Rogue, Diablo, etc.)

**Wave Function Collapse (WFC) for Tile-Based Generation:**
- Constraint-solving algorithm that generates patterns from input examples
- Perfect for tile-based systems (matches physical tile constraints)
- Ensures local and global coherence
- Used in games like Bad North, Townscaper
- Can work with physical tile sets

**Alternative Approaches Considered:**
- **Cellular Automata**: Good for cave-like dungeons, less structured
- **Room-and-Corridor**: Simple but can produce disconnected areas
- **Maze Generation**: Too linear, not suitable for D&D exploration
- **Delaunay Triangulation**: Good for connectivity, but less control over room placement

**Decision: Dual-Mode System**
- **Primary Mode: BSP + MST** - Procedural generation for random dungeons
- **Secondary Mode: WFC** - Tile-based generation from physical tile pool
- Both modes share visualization and data model

### D&D 5e Dungeon Design Best Practices

**From Dungeon Master's Guide & Published Adventures:**

**Room Size Patterns (from published modules):**
- **Small Chambers**: 10x10 to 15x15 feet (2x2 to 3x3 grid cells) - Guard posts, storage
- **Medium Rooms**: 20x20 to 30x30 feet (4x4 to 6x6 grid cells) - Common rooms, barracks
- **Large Chambers**: 40x40 to 50x50 feet (8x8 to 10x10 grid cells) - Throne rooms, temples
- **Corridors**: Typically 5 feet wide (1 cell), occasionally 10 feet (2 cells) for main passages
- **Irregular Shapes**: Many published dungeons use non-rectangular rooms (L-shaped, T-shaped)

**Published Dungeon Examples:**
- **Cragmaw Castle (LMoP)**: Mix of 10x10, 20x20, 30x30 rooms with 5ft corridors
- **Wave Echo Cave (LMoP)**: Larger chambers (40x40+) with natural cave passages
- **Sunless Citadel**: Multi-level with 15x15 to 30x30 rooms, vertical connections
- **Dungeon of the Mad Mage**: Massive multi-level with varied room sizes

**Design Principles:**
1. **Entry Points**: Clear entrance, may have multiple exits
2. **Room Variety**: Mix of sizes (10x10 to 50x50 feet typical in published modules)
3. **Logical Flow**: Main path + side branches for exploration
4. **Verticality**: Stairs, pits, elevation changes add interest
5. **Secrets**: Hidden doors, false walls, concealed passages (10-15% of doors in published modules)
6. **Themes**: Consistent architectural style per dungeon
7. **Purpose**: Each room should serve a function (guard post, treasure vault, etc.)
8. **Room Density**: Published dungeons typically use 20-40% of space for rooms, rest is corridors/walls

### Visualization Best Practices

**Grid-Based Rendering:**
- Standard D&D grid: 5-foot squares
- Top-down view (isometric optional later)
- Color coding: walls, floors, doors, stairs, special features
- Zoom/pan for large dungeons
- Click-to-inspect rooms

**Technology Options:**
- **SVG**: Vector-based, scalable, easy to style, good for small-medium dungeons
- **Canvas**: Better performance for large/complex maps, requires manual hit detection
- **Hybrid**: SVG for structure, Canvas for performance-critical layers

**Decision: SVG-first** - Easier to implement, sufficient for initial scope. Can migrate to Canvas if performance issues arise.

### AI Enhancement Strategy

**AI Role:**
- **Thematic Coherence**: Ensure dungeon matches world tone/culture
- **Narrative Integration**: Link to existing locations/NPCs/factions
- **Room Descriptions**: Generate atmospheric descriptions per room
- **Feature Suggestions**: Propose traps, encounters, treasure placement
- **Not Used For**: Core layout generation (procedural is more reliable)

**Prompt Structure:**
- Context: World, existing elements, user parameters
- Requirements: Room types, themes, difficulty
- Output: JSON with descriptions, features, suggested content

---

## Part 2: Data Model

### Dungeon Schema (world_element with type='dungeon')

```typescript
interface DungeonDetail {
  // IDENTITY
  identity: {
    name: string;
    type: "dungeon" | "cave" | "ruin" | "fortress" | "tower";
    theme: string; // "ancient temple", "goblin lair", "wizard's tower"
    difficulty: "easy" | "medium" | "hard" | "deadly";
    recommended_level: number; // Party level
  };

  // STRUCTURE
  structure: {
    levels: DungeonLevel[];
    entry_point: {
      level_index: number;
      room_index: number;
      description: string;
    };
    exit_points: Array<{
      level_index: number;
      room_index: number;
      description: string;
      condition?: string; // "requires key", "hidden", etc.
    }>;
  };

  // HISTORY & LORE
  history: {
    origin: string; // Who built it, when, why
    current_state: string; // What happened, who occupies it now
    legends: string[]; // Myths about this place
  };

  // WORLD INTEGRATION
  world_integration: {
    parent_location_id?: uuid; // Location this dungeon is part of
    connected_locations?: uuid[]; // Other locations accessible from here
    associated_factions?: Array<{
      faction_id: uuid;
      influence: "controls" | "inhabits" | "seeks" | "guards";
    }>;
  };
}

interface DungeonLevel {
  level_index: number; // 0 = ground level, negative = deeper
  name: string; // "Upper Floor", "Catacombs", "Deep Vault"
  grid: {
    width: number; // Grid cells (5-foot squares)
    height: number;
    cell_size: number; // 5 (feet per cell)
  };
  rooms: Room[];
  corridors: Corridor[];
  stairs: Stair[];
  // Visualization metadata
  texture_set?: string; // Reference to texture set (stone, cave, temple, etc.)
  fog_of_war?: FogOfWarState; // Player view state (optional, stored per session)
}

interface Room {
  id: string; // Unique within dungeon
  x: number; // Grid coordinates (top-left)
  y: number;
  width: number; // Grid cells
  height: number;
  type: "chamber" | "corridor" | "stairwell" | "entry" | "exit" | "special";
  doors: Door[];
  description: string; // AI-generated atmospheric description
  features: RoomFeature[];
  connections: string[]; // IDs of connected rooms
  // Visualization
  floor_texture?: string; // Texture type (stone, dirt, wood, etc.)
  wall_texture?: string; // Texture type (stone, brick, cave, etc.)
  is_secret?: boolean; // Hidden room (only visible after discovery)
}

interface Corridor {
  id: string;
  path: Array<{ x: number; y: number }>; // Grid coordinates
  width: number; // Usually 1 cell (5 feet)
  doors: Door[]; // Doors along the corridor
}

interface Door {
  id: string;
  x: number;
  y: number;
  type: "wooden" | "iron" | "stone" | "secret" | "magical" | "barred";
  state: "open" | "closed" | "locked" | "stuck" | "broken";
  lock_dc?: number; // Difficulty to pick
  strength_dc?: number; // Difficulty to break
  key_item_id?: uuid; // Item that unlocks it
  description?: string;
}

interface Stair {
  id: string;
  x: number;
  y: number;
  from_level: number;
  to_level: number;
  direction: "up" | "down" | "spiral";
  description: string;
}

interface RoomFeature {
  type: "fountain" | "altar" | "throne" | "chest" | "trap" | "encounter" | "treasure" | "decoration";
  x?: number; // Position within room (optional)
  y?: number;
  description: string;
  metadata?: Record<string, unknown>; // Type-specific data
}

// Future: Encounter, Trap, Treasure schemas (to be defined)
```

### Database Storage

**Primary Table: `world_element`**
- `type = 'dungeon'`
- `detail` JSONB contains `DungeonDetail`
- `name` = dungeon name
- `summary` = one-line description

**Supporting Tables:**
- `element_link`: Connect dungeon to locations, NPCs, factions
- `world_element` (rooms as sub-elements?): Optional - rooms could be separate elements for advanced features

**Indexes:**
- `idx_dungeon_type` on `(type, world_id)` for filtering
- GIN index on `detail->'structure'->'levels'` for level queries

---

## Part 3: Generation Algorithm

### BSP-Based Generation Flow

**Phase 1: Space Partitioning**
1. Start with dungeon bounds (e.g., 50x50 grid)
2. Recursively split space using BSP:
   - Choose random split axis (horizontal or vertical)
   - Split at random point (with min room size constraints)
   - Continue until leaf nodes are room-sized (min 3x3, max 10x10)
3. Result: Tree of rectangular spaces

**Phase 2: Room Placement**
1. For each leaf node, create room:
   - Shrink room by 1-2 cells on each side (adds corridors)
   - Randomize position within leaf bounds
   - Ensure minimum size (3x3) and maximum (10x10)
2. Mark entry room (first room, or user-specified)
3. Mark exit rooms (last level, or user-specified)

**Phase 3: Corridor Generation**
1. Build minimum spanning tree (MST) connecting all rooms:
   - Use Prim's or Kruskal's algorithm
   - Ensures all rooms are reachable
2. Add extra connections (20-30% of rooms):
   - Randomly connect nearby rooms
   - Creates loops for non-linear exploration
3. Generate corridor paths:
   - L-shaped paths (horizontal then vertical, or vice versa)
   - Avoid cutting through rooms
   - Width = 1 cell (5 feet)

**Phase 4: Door Placement**
1. For each room-corridor connection:
   - Place door at connection point
   - Random type (wooden/iron/stone)
   - Random state (open/closed/locked)
2. Add secret doors (5-10% of doors):
   - Hidden in walls
   - Requires investigation to find

**Phase 5: Stair Placement (Multi-Level)**
1. For each level (except last):
   - Place 1-3 stairs connecting to next level
   - Position in different areas (spread exploration)
   - Type: regular stairs or spiral staircase
2. Ensure each level has at least one up/down connection

**Phase 6: Feature Population (Future)**
1. Assign room types (guard post, treasure vault, etc.)
2. Place encounters, traps, treasure
3. Generate room descriptions

### Algorithm Parameters

```typescript
interface DungeonGenerationParams {
  // Generation Mode
  generation_mode: "random" | "tile_based"; // Default: "random"
  
  // Size
  grid_width: number; // Default: 50 cells (250 feet)
  grid_height: number; // Default: 50 cells
  num_levels: number; // Default: 1, max: 5
  
  // Room Generation (for random mode)
  min_room_size: number; // Default: 2 cells (10 feet) - matches published modules
  max_room_size: number; // Default: 10 cells (50 feet) - matches published modules
  room_density: number; // 0.0-1.0, default: 0.3 (30% of space is rooms)
  
  // Connectivity
  extra_connections_ratio: number; // 0.0-1.0, default: 0.25 (25% extra)
  secret_door_ratio: number; // 0.0-1.0, default: 0.1 (10% secret) - matches published modules
  
  // Tile-Based Generation (for tile_based mode)
  tile_pool_id?: string; // ID of user's tile collection
  tile_constraints?: {
    allow_rotation: boolean; // Default: true
    enforce_connectivity: boolean; // Default: true
    max_iterations: number; // Default: 1000 (WFC constraint solving)
  };
  
  // Theming
  theme?: string; // "ancient temple", "goblin lair", etc.
  difficulty?: "easy" | "medium" | "hard" | "deadly";
  architectural_style?: string; // "gothic", "dwarven", "natural cave"
  
  // AI Enhancement
  use_ai: boolean; // Default: true
  world_id?: string; // For context fetching
}
```

### Procedural Generation Code Structure

```
functions/_lib/dungeon-generator/
  ├── bsp.ts              # BSP tree implementation
  ├── room-placer.ts      # Room generation from BSP leaves
  ├── corridor-builder.ts # MST + extra connections
  ├── door-placer.ts      # Door placement logic
  ├── stair-placer.ts     # Multi-level stair placement
  ├── procedural.ts       # Main orchestration function (random mode)
  ├── tile-based/
  │   ├── wfc.ts          # Wave Function Collapse implementation
  │   ├── tile-loader.ts  # Load and parse physical tile definitions
  │   ├── tile-constraints.ts # Define tile connection rules
  │   └── tile-generator.ts   # Main tile-based generation
  └── types.ts            # TypeScript interfaces
```

### Tile-Based Generation (Secondary Priority)

**Physical Tile System:**
- User's tiles: 5x5cm physical tiles
- Each tile represents: 2x2 grid of 5-foot squares (10x10 feet total)
- Tile types: Floor, wall, corner, door, special features
- Grid representation: Each physical tile = 2x2 cells in dungeon grid

**Tile Definition Schema:**
```typescript
interface PhysicalTile {
  id: string;
  name: string;
  physical_size: { width_cm: number; height_cm: number }; // 5x5cm
  grid_size: { width: number; height: number }; // Always 2x2 cells (10x10 feet)
  
  // Tile Pattern (2x2 grid of cells)
  pattern: Array<Array<CellType>>; // [row][col] = "floor" | "wall" | "door" | "corner" | "feature"
  
  // Connection Rules (for WFC)
  connections: {
    north: ConnectionType[]; // What can connect to north edge
    south: ConnectionType[];
    east: ConnectionType[];
    west: ConnectionType[];
  };
  
  // Visual
  image_url?: string; // Photo/scan of physical tile
  color?: string; // Fallback color for rendering
}

type CellType = "floor" | "wall" | "door" | "corner" | "stair" | "feature";
type ConnectionType = "open" | "wall" | "door" | "corner";
```

**Wave Function Collapse Algorithm:**
1. **Initialize**: Create grid of "superposition" cells (each can be any tile)
2. **Observe**: Start with constraints (entry point, required features)
3. **Propagate**: For each cell, eliminate tiles that don't match neighbors
4. **Collapse**: Choose tile for cell with fewest possibilities
5. **Repeat**: Until all cells are collapsed or contradiction (restart if needed)
6. **Validate**: Ensure connectivity, add doors/stairs as needed

**Tile Pool Management:**
- User uploads photos/scans of physical tiles
- System extracts pattern (2x2 grid) from image
- User defines connection rules (or auto-detect from pattern)
- Store in `dungeon_tile` table (future schema extension)

**Generation Flow (Tile-Based Mode):**
1. Load user's tile pool
2. Run WFC algorithm with tile constraints
3. Convert 2x2 tile grid to full dungeon grid
4. Add doors/stairs/features (same as random mode)
5. Validate connectivity
6. Apply AI enhancement (same as random mode)

---

## Part 4: Visualization & Representation

### Overview

The dungeon visualization system supports:
- **2D top-down view** (primary representation)
- **Textured rendering** for clear feature identification
- **Dual output formats**: Printable (PDF/PNG) and digital (SVG/Canvas)
- **View modes**: DM view (all visible) and Player view (fog of war)
- **Export options**: High-res for printing, optimized for screens

### Rendering Architecture

**Technology Stack:**
- **Primary**: SVG for vector-based rendering (scalable, printable)
- **Fallback**: Canvas for complex textures/performance-critical scenarios
- **Export**: SVG → PDF (printable), SVG → PNG (raster), Canvas → PNG (textured)

**Component: `DungeonMapView`**

```typescript
interface DungeonMapViewProps {
  dungeon: DungeonDetail;
  levelIndex: number; // Which level to display
  viewMode: "dm" | "player"; // DM sees all, Player sees revealed only
  cellSize?: number; // Pixels per grid cell (default: 20px for screen, 40px for print)
  showGrid?: boolean; // Show grid lines
  showLabels?: boolean; // Show room IDs/names
  showTextures?: boolean; // Use textured rendering (default: true)
  exportMode?: "screen" | "print"; // Optimize for screen or printing
  interactive?: boolean; // Click to inspect rooms
  revealedRooms?: Set<string>; // Room IDs visible to players (for fog of war)
  onRoomClick?: (room: Room) => void;
  onRoomReveal?: (roomId: string) => void; // DM reveals room to players
}
```

### Textured Rendering System

**Texture Library:**
Each dungeon element uses distinct textures/patterns for visual clarity:

**Floor Textures:**
- **Stone Floor**: Gray stone pattern with subtle cracks
- **Dirt Floor**: Brown earth texture
- **Wooden Floor**: Wood grain pattern
- **Cave Floor**: Rough, irregular stone
- **Temple Floor**: Carved stone with patterns

**Wall Textures:**
- **Stone Wall**: Dark gray with mortar lines
- **Brick Wall**: Red/brown brick pattern
- **Rough Cave Wall**: Irregular rock texture
- **Smooth Wall**: Polished stone (temples, palaces)

**Feature Textures:**
- **Door**: Wood grain (wooden), metallic (iron), stone (stone doors)
- **Stairs**: Step pattern with directional indicator
- **Chest**: Wooden box with lock detail
- **Altar**: Carved stone with symbols
- **Fountain**: Circular base with water pattern

**Implementation:**
- **SVG Patterns**: Use `<pattern>` elements with embedded images or procedural patterns
- **CSS Backgrounds**: For simple textures (fallback)
- **Canvas Textures**: For complex patterns (export only)

**Texture Mapping:**
```typescript
interface TextureSet {
  floor: {
    stone: string; // SVG pattern ID or image URL
    dirt: string;
    wood: string;
    cave: string;
    temple: string;
  };
  wall: {
    stone: string;
    brick: string;
    cave: string;
    smooth: string;
  };
  features: {
    door_wooden: string;
    door_iron: string;
    door_stone: string;
    stairs_up: string;
    stairs_down: string;
    chest: string;
    altar: string;
    fountain: string;
  };
}
```

### Rendering Layers (z-index order)

1. **Background**: Grid lines (if enabled, subtle gray)
2. **Floors (Unrevealed)**: Dark gray overlay for fog of war (player view only)
3. **Floors (Revealed)**: Room and corridor floor tiles with textures
4. **Walls (Unrevealed)**: Hidden walls (player view only)
5. **Walls (Revealed)**: Room and corridor walls with textures
6. **Doors**: Door markers with state indicators and textures
7. **Stairs**: Stair markers with direction arrows and textures
8. **Features**: Room features (chests, altars, etc.) with textures
9. **Labels**: Room names/IDs (if enabled, DM view only)
10. **Overlay**: Selection highlights, hover effects, fog of war edges

### View Modes

#### DM View (All Visible)
- **All rooms visible**: No fog of war
- **All labels shown**: Room names, IDs, features
- **Secret doors visible**: Marked with dashed outline
- **Hidden areas visible**: Concealed passages shown
- **Full metadata**: Encounters, traps, treasure visible
- **Edit mode**: Can reveal/hide rooms for players

#### Player View (Fog of War)
- **Revealed rooms only**: Rooms players have explored
- **Fog of war overlay**: Dark gray/black for unrevealed areas
- **No labels**: Room names/IDs hidden
- **Secret doors hidden**: Only visible after discovery
- **Progressive reveal**: Rooms reveal as players explore
- **Entry visibility**: Entry point always visible

**Fog of War System:**
```typescript
interface FogOfWarState {
  revealedRooms: Set<string>; // Room IDs that are visible
  revealedCorridors: Set<string>; // Corridor IDs that are visible
  discoveredDoors: Set<string>; // Door IDs that have been found
  discoveredSecrets: Set<string>; // Secret door/area IDs
  entryPointVisible: boolean; // Always true
}

// Room visibility rules:
// - Room is visible if: room ID in revealedRooms
// - Corridor is visible if: both connected rooms are revealed OR corridor ID in revealedCorridors
// - Door is visible if: door ID in discoveredDoors AND at least one adjacent room is revealed
// - Secret door is visible if: door ID in discoveredSecrets AND at least one adjacent room is revealed
```

### Export Formats

#### Printable Output (PDF/PNG)
**Use Cases:**
- Printing for tabletop play
- Physical handouts
- Campaign documentation

**Specifications:**
- **Resolution**: 300 DPI minimum
- **Cell Size**: 40-50 pixels per 5-foot square (for 1-inch grid printing)
- **Format**: PDF (vector) or PNG (raster, high-res)
- **Size**: A4, Letter, or custom dimensions
- **Grid**: Visible 1-inch grid overlay
- **Labels**: Optional (DM version with labels, Player version without)
- **Color**: Full color with textures
- **Bleed**: Optional margin for printing

**Export Options:**
```typescript
interface PrintExportOptions {
  format: "pdf" | "png";
  paperSize: "a4" | "letter" | "custom";
  customSize?: { width_inches: number; height_inches: number };
  dpi: number; // Default: 300
  showGrid: boolean; // Default: true
  showLabels: boolean; // Default: false (for player handouts)
  viewMode: "dm" | "player"; // Which view to export
  includeLegend: boolean; // Default: true
  includeScale: boolean; // Default: true
}
```

#### Digital Screen Output (SVG/PNG)
**Use Cases:**
- Digital display (tablets, screens)
- Online sharing
- VTT (Virtual Tabletop) import

**Specifications:**
- **Resolution**: Screen-optimized (72-150 DPI)
- **Cell Size**: 20-30 pixels per 5-foot square (for screen viewing)
- **Format**: SVG (interactive) or PNG (static)
- **Size**: Responsive to viewport
- **Grid**: Optional (can be toggled)
- **Labels**: Toggleable
- **Color**: Full color with textures
- **Interactivity**: Clickable rooms, zoom/pan (SVG only)

**Export Options:**
```typescript
interface ScreenExportOptions {
  format: "svg" | "png";
  cellSize: number; // Default: 20px
  showGrid: boolean; // Default: true
  showLabels: boolean; // Default: false
  viewMode: "dm" | "player";
  includeInteractivity: boolean; // SVG only, default: true
  optimizeForVTT: boolean; // Default: false (removes interactivity, adds grid)
}
```

### Visual Styling (Textured)

**Floor Styles:**
- **Stone Floor**: `#d0d0d0` base with `#b0b0b0` pattern overlay
- **Dirt Floor**: `#8B7355` base with `#6B5A45` texture
- **Wooden Floor**: `#D2B48C` base with `#A0826D` grain pattern
- **Cave Floor**: `#808080` base with irregular `#606060` patches
- **Temple Floor**: `#E8E8E8` base with `#C0C0C0` carved patterns

**Wall Styles:**
- **Stone Wall**: `#404040` fill with `#303030` mortar lines (2px stroke)
- **Brick Wall**: `#8B4513` base with `#654321` brick pattern
- **Rough Cave Wall**: `#505050` with irregular `#303030` texture
- **Smooth Wall**: `#606060` with subtle `#707070` highlights

**Feature Styles:**
- **Door (Wooden)**: `#8B4513` with `#654321` grain, lock detail
- **Door (Iron)**: `#708090` metallic with `#556B2F` rust accents
- **Door (Stone)**: `#696969` with `#808080` highlights
- **Stairs (Up)**: `#4169E1` with white up-arrow pattern
- **Stairs (Down)**: `#4169E1` with white down-arrow pattern
- **Chest**: `#8B4513` wooden with `#FFD700` lock
- **Altar**: `#C0C0C0` stone with `#808080` carved symbols
- **Fountain**: `#87CEEB` water with `#708090` stone base

**Fog of War:**
- **Unrevealed Area**: `#1a1a1a` overlay (80% opacity)
- **Revealed Edge**: `#2a2a2a` gradient (fade effect)
- **Currently Visible**: Full color, no overlay

### Interactivity

**DM View Interactions:**
- Click room → Show room details panel
- Right-click room → Reveal/hide for players
- Hover room → Highlight room + connected corridors
- Click door → Toggle door state (open/closed/locked)
- Click secret door → Mark as discovered
- Drag to pan
- Scroll to zoom

**Player View Interactions:**
- Click revealed room → Show room description (if available)
- Hover revealed room → Highlight room
- No editing capabilities (read-only)
- Drag to pan
- Scroll to zoom

### Responsive Design

- **Desktop**: Full map view with side panel for details, DM controls
- **Tablet**: Map with collapsible detail panel, touch-optimized controls
- **Mobile**: Stacked layout (map above, details below), simplified controls
- **Print**: Full-width map, legend below, scale indicator

### Export Implementation

**SVG to PDF (Printable):**
- Use `@react-pdf/renderer` or `jsPDF` with SVG conversion
- Maintain vector quality
- Add page breaks for large dungeons
- Include legend and scale

**SVG to PNG (Raster):**
- Use `html2canvas` or server-side rendering
- High DPI for printing (300+)
- Lower DPI for screen (72-150)
- Preserve textures and colors

**Canvas Rendering (Textured):**
- For complex textures that SVG can't handle
- Export to PNG at target resolution
- Fallback for advanced texture features

---

## Part 5: AI Enhancement

### AI Prompt Structure

**System Prompt:**
```
You are a D&D dungeon designer. Generate thematic, atmospheric descriptions and features for procedurally generated dungeon rooms. Ensure consistency with the provided world context and user parameters.
```

**User Prompt Template:**
```
Generate descriptions and features for a {theme} dungeon with {difficulty} difficulty.

WORLD CONTEXT:
- World: {world_name}
- Parent Location: {parent_location_name} - {description}
- Associated Factions: {faction_list}
- Existing NPCs: {npc_list}

DUNGEON PARAMETERS:
- Type: {type}
- Theme: {theme}
- Architectural Style: {architectural_style}
- Recommended Level: {recommended_level}
- Number of Levels: {num_levels}

GENERATED STRUCTURE:
{rooms_json} // Array of room data (position, size, connections)

REQUIREMENTS:
1. Generate atmospheric description for each room
2. Suggest room features (fountain, altar, chest, etc.)
3. Ensure thematic consistency across all rooms
4. Link descriptions to world context where appropriate
5. Suggest encounter types for each room (future: will be populated)

OUTPUT FORMAT: JSON matching RoomEnhancement schema
```

**Room Enhancement Schema:**
```typescript
interface RoomEnhancement {
  room_id: string;
  description: string; // Atmospheric description
  features: Array<{
    type: string;
    description: string;
    position?: { x: number; y: number };
  }>;
  suggested_encounter?: {
    type: string;
    challenge_rating: number;
    description: string;
  };
  suggested_treasure?: {
    type: string;
    description: string;
  };
  suggested_trap?: {
    type: string;
    difficulty: number;
    description: string;
  };
}
```

### AI Integration Points

1. **Post-Generation Enhancement**: After procedural layout, enhance all rooms with AI
2. **Room-by-Room Enhancement**: Generate descriptions on-demand (lazy loading)
3. **Regeneration**: User can regenerate specific room descriptions

---

## Part 6: API Design

### Cloudflare Pages Function: `generate-dungeon.ts`

**Endpoint:** `POST /api/generate-dungeon`

**Request Body:**
```typescript
interface GenerateDungeonRequest {
  world_id: string;
  name?: string; // Optional name hint
  params: DungeonGenerationParams;
  use_ai?: boolean; // Default: true
}
```

**Response:**
```typescript
interface GenerateDungeonResponse {
  dungeon_id: string; // world_element.id
  dungeon: DungeonDetail;
  generation_log?: {
    procedural_duration_ms: number;
    ai_enhancement_duration_ms?: number;
    total_rooms: number;
    total_corridors: number;
    total_doors: number;
    total_stairs: number;
  };
}
```

**Implementation Flow:**
1. Create `generation_request` row
2. Initialize `GenerationLogger`
3. Run procedural generation (`generateDungeonProcedural`)
4. If `use_ai`: Run AI enhancement (`enhanceDungeonWithAI`)
5. Save to `world_element` (type='dungeon')
6. Create `element_link` entries for world integration
7. Return dungeon data

### Helper Functions

**`functions/_lib/dungeon-generator/procedural.ts`:**
```typescript
export function generateDungeonProcedural(
  params: DungeonGenerationParams
): DungeonDetail;
```

**`functions/_lib/dungeon-generator/ai-enhancer.ts`:**
```typescript
export async function enhanceDungeonWithAI(
  env: WorkersAIEnv,
  dungeon: DungeonDetail,
  worldContext: ContextPack
): Promise<DungeonDetail>;
```

---

## Part 7: UI Integration

### World Dashboard Integration

**New Tab: "Dungeons"**
- List of dungeons (similar to NPCs tab)
- "Generate Dungeon" button
- Click dungeon → Detail view with map

**Dungeon Detail View:**
- Level selector (dropdown for multi-level)
- Map visualization (SVG)
- Room list (sidebar)
- Click room → Room details panel

**Dungeon Generator Form:**
- Name input
- Size sliders (width, height, levels)
- Theme dropdown
- Difficulty selector
- Architectural style input
- "Generate" button

### Component Structure

```
src/components/dungeon/
  ├── DungeonMapView.tsx      # SVG map renderer
  ├── DungeonGenerator.tsx    # Generation form
  ├── DungeonDetailView.tsx   # Full dungeon view
  ├── RoomDetailPanel.tsx     # Room information panel
  └── LevelSelector.tsx        # Level navigation
```

---

## Part 8: Implementation Phases

### Phase 1: Core Procedural Generation (Week 1)
- [ ] Implement BSP algorithm
- [ ] Room placement logic
- [ ] Corridor generation (MST + extra)
- [ ] Door placement
- [ ] Single-level dungeon generation
- [ ] Unit tests for generation logic

### Phase 2: Multi-Level Support (Week 1-2)
- [ ] Stair placement algorithm
- [ ] Level management in data model
- [ ] Level selector UI
- [ ] Multi-level generation flow

### Phase 3: Visualization (Week 2)
- [ ] SVG map renderer component
- [ ] Grid system
- [ ] Room/corridor/door rendering with textures
- [ ] Stair markers with textures
- [ ] Basic interactivity (click, hover)
- [ ] Texture system (SVG patterns)
- [ ] DM view mode (all visible)
- [ ] Player view mode (fog of war)
- [ ] Export to PDF (printable)
- [ ] Export to PNG (digital)

### Phase 4: AI Enhancement (Week 2-3)
- [ ] AI prompt design
- [ ] Room enhancement function
- [ ] Integration with generation pipeline
- [ ] Error handling (fallback to procedural)

### Phase 5: UI Integration (Week 3)
- [ ] Dungeon list/detail views
- [ ] Generator form
- [ ] Integration with world dashboard
- [ ] Responsive design

### Phase 6: Polish & Future Prep (Week 4)
- [ ] Performance optimization
- [ ] Advanced texture library (more patterns)
- [ ] Print optimization (high-res, page breaks)
- [ ] VTT export format (Foundry, Roll20 compatible)
- [ ] Room editing (manual adjustments)
- [ ] Fog of war state persistence
- [ ] Schema preparation for encounters/treasure/traps

### Phase 7: Tile-Based Generation (Future - Secondary Priority)
- [ ] Tile definition schema and storage
- [ ] Tile upload/scan interface
- [ ] WFC algorithm implementation
- [ ] Tile connection rule editor
- [ ] Tile-based generation UI
- [ ] Integration with random generation mode

---

## Part 9: Future Enhancements

### Phase 7: Content Population (Future)
- Encounter generation per room
- Treasure placement
- Trap generation
- Puzzle integration

### Phase 8: Advanced Features (Future)
- Isometric view option
- Fog of war (player exploration)
- Room editing (drag to resize, add doors)
- Import/export dungeon files
- Collaborative editing
- Physical tile scanning/recognition (OCR/ML)

---

## Part 10: Technical Decisions

### Algorithm: BSP + MST (Primary), WFC (Secondary)
**Rationale:** 
- BSP + MST: Industry-proven, produces good layouts, ensures connectivity
- WFC: Perfect for tile-based generation, matches physical tile constraints, ensures coherence

### Visualization: SVG with Texture Support
**Rationale:** 
- SVG: Easier implementation, vector-based (scalable, printable), sufficient performance
- Textures: Clear visual distinction of features, professional appearance
- Export: SVG → PDF/PNG for both printable and digital use
- View Modes: DM/Player separation with fog of war for immersive gameplay

### Storage: world_element JSONB
**Rationale:** Consistent with existing architecture, flexible schema, supports future extensions.

### AI: Post-Generation Enhancement
**Rationale:** Procedural layout is reliable; AI adds thematic coherence without risking structural issues.

---

## Part 11: Physical Tile Integration Details

### Tile Representation

**Physical to Digital Mapping:**
- **Physical Tile**: 5x5cm square
- **Digital Representation**: 2x2 grid cells (each cell = 5-foot square)
- **Total Coverage**: 10x10 feet per physical tile
- **Grid Alignment**: Physical tiles align to 2x2 boundaries in dungeon grid

**Tile Types (Common Patterns):**
1. **Floor Tile**: 2x2 floor cells (open space)
2. **Wall Tile**: 2x2 with walls on specific edges
3. **Corner Tile**: 2x2 with corner walls (L-shaped)
4. **Door Tile**: 2x2 with door on one edge
5. **Feature Tile**: 2x2 with special feature (altar, chest, etc.)

**Connection Rules:**
- **Open Edge**: Connects to open edge (floor to floor)
- **Wall Edge**: Connects to wall edge (wall to wall)
- **Door Edge**: Connects to door edge or open edge
- **Corner Edge**: Special handling for corner-to-corner connections

### Tile Pool Schema (Future)

```sql
CREATE TABLE dungeon_tile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  physical_size_cm JSONB, -- {width: 5, height: 5}
  grid_pattern JSONB, -- 2x2 array of cell types
  connections JSONB, -- {north: [...], south: [...], east: [...], west: [...]}
  image_url TEXT, -- Photo/scan of physical tile
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### WFC Implementation Notes

**Constraint Propagation:**
- Each cell maintains set of possible tiles (superposition)
- Neighbor constraints eliminate incompatible tiles
- Collapse cell with fewest possibilities (entropy)
- Backtrack if contradiction occurs

**Optimization:**
- Pre-compute tile compatibility matrix
- Cache connection rules
- Limit iterations to prevent infinite loops
- Fallback to random placement if WFC fails

## Part 12: Visualization Component Structure

### Component Hierarchy

```
src/components/dungeon/
  ├── DungeonMapView.tsx          # Main map renderer (SVG)
  ├── DungeonMapCanvas.tsx        # Canvas fallback (textures)
  ├── DungeonGenerator.tsx        # Generation form
  ├── DungeonDetailView.tsx       # Full dungeon view
  ├── RoomDetailPanel.tsx         # Room information panel
  ├── LevelSelector.tsx           # Level navigation
  ├── ViewModeToggle.tsx          # DM/Player view switcher
  ├── FogOfWarController.tsx      # DM controls for revealing rooms
  ├── ExportDialog.tsx            # Export options (PDF/PNG)
  └── textures/
      ├── TextureLibrary.ts       # Texture definitions
      ├── SVGPatterns.tsx         # SVG pattern components
      └── texture-assets/         # Image assets for textures
```

### Texture Asset Management

**Texture Sources:**
1. **Procedural SVG Patterns**: Generated programmatically (stone, brick patterns)
2. **Image Assets**: Pre-made texture images (wood grain, detailed stone)
3. **CSS Patterns**: Simple repeating patterns (fallback)

**Texture Loading:**
- Lazy load textures on demand
- Cache rendered patterns
- Fallback to solid colors if texture fails

### Export Service

**`src/lib/dungeon-export.ts`:**
```typescript
export async function exportDungeonToPDF(
  dungeon: DungeonDetail,
  levelIndex: number,
  options: PrintExportOptions
): Promise<Blob>;

export async function exportDungeonToPNG(
  dungeon: DungeonDetail,
  levelIndex: number,
  options: ScreenExportOptions
): Promise<Blob>;

export async function exportDungeonToSVG(
  dungeon: DungeonDetail,
  levelIndex: number,
  options: ScreenExportOptions
): Promise<string>;
```

## Conclusion

This design provides:
- **Solid algorithmic foundation** (BSP + MST for random, WFC for tiles)
- **Dual generation modes** (random procedural + tile-based from physical tiles)
- **Scalable data model** (fits existing schema, extensible for tiles)
- **Comprehensive visualization** (SVG-based with textures, DM/Player views, fog of war)
- **Dual output formats** (printable PDF/PNG + digital SVG/PNG)
- **Textured rendering** (clear visual distinction of features)
- **AI integration strategy** (enhancement, not generation)
- **Phased implementation plan** (random first, tiles later)
- **Physical tile support** (5x5cm = 2x2 grid representation)

The system will generate playable, visually clear dungeons that integrate with Isekai's world-building ecosystem. The textured 2D representation supports both printable handouts and digital display, with separate DM and Player views for immersive tabletop gameplay. The tile-based mode allows users to leverage their physical tile collections while maintaining digital flexibility.

