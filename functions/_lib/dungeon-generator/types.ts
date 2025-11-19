/**
 * Type definitions for dungeon generation system
 */

export interface DungeonGenerationParams {
  // Generation Mode
  generation_mode?: "random" | "tile_based"; // Default: "random"
  
  // Size
  grid_width: number; // Default: 50 cells (250 feet)
  grid_height: number; // Default: 50 cells
  num_levels?: number; // Default: 1, max: 5
  
  // Room Generation (for random mode)
  min_room_size?: number; // Default: 2 cells (10 feet)
  max_room_size?: number; // Default: 10 cells (50 feet)
  room_density?: number; // 0.0-1.0, default: 0.3 (30% of space is rooms)
  
  // Connectivity
  extra_connections_ratio?: number; // 0.0-1.0, default: 0.25 (25% extra)
  secret_door_ratio?: number; // 0.0-1.0, default: 0.1 (10% secret)
  
  // Theming
  theme?: string; // "ancient temple", "goblin lair", etc.
  difficulty?: "easy" | "medium" | "hard" | "deadly";
  architectural_style?: string; // "gothic", "dwarven", "natural cave"
  
  // AI Enhancement
  use_ai?: boolean; // Default: true
  world_id?: string; // For context fetching
}

export interface DungeonDetail {
  // IDENTITY
  identity: {
    name: string;
    type: "dungeon" | "cave" | "ruin" | "fortress" | "tower";
    theme: string;
    difficulty: "easy" | "medium" | "hard" | "deadly";
    recommended_level: number;
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
      condition?: string;
    }>;
  };

  // HISTORY & LORE
  history: {
    origin: string;
    current_state: string;
    legends: string[];
  };

  // WORLD INTEGRATION
  world_integration: {
    parent_location_id?: string;
    connected_locations?: string[];
    associated_factions?: Array<{
      faction_id: string;
      influence: "controls" | "inhabits" | "seeks" | "guards";
    }>;
  };
}

export interface DungeonLevel {
  level_index: number; // 0 = ground level, negative = deeper
  name: string;
  grid: {
    width: number; // Grid cells (5-foot squares)
    height: number;
    cell_size: number; // 5 (feet per cell)
  };
  rooms: Room[];
  corridors: Corridor[];
  stairs: Stair[];
  texture_set?: string;
  fog_of_war?: FogOfWarState;
}

export interface Room {
  id: string;
  x: number; // Grid coordinates (top-left)
  y: number;
  width: number; // Grid cells
  height: number;
  type: "chamber" | "corridor" | "stairwell" | "entry" | "exit" | "special";
  doors: Door[];
  description: string;
  features: RoomFeature[];
  connections: string[]; // IDs of connected rooms
  floor_texture?: string;
  wall_texture?: string;
  is_secret?: boolean;
}

export interface Corridor {
  id: string;
  path: Array<{ x: number; y: number }>; // Grid coordinates
  width: number; // Usually 1 cell (5 feet)
  doors: Door[];
}

export interface Door {
  id: string;
  x: number;
  y: number;
  type: "wooden" | "iron" | "stone" | "secret" | "magical" | "barred";
  state: "open" | "closed" | "locked" | "stuck" | "broken";
  lock_dc?: number;
  strength_dc?: number;
  key_item_id?: string;
  description?: string;
}

export interface Stair {
  id: string;
  x: number;
  y: number;
  from_level: number;
  to_level: number;
  direction: "up" | "down" | "spiral";
  description: string;
}

export interface RoomFeature {
  type: "fountain" | "altar" | "throne" | "chest" | "trap" | "encounter" | "treasure" | "decoration";
  x?: number;
  y?: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface FogOfWarState {
  revealedRooms: string[]; // Room IDs that are visible
  revealedCorridors: string[]; // Corridor IDs that are visible
  discoveredDoors: string[]; // Door IDs that have been found
  discoveredSecrets: string[]; // Secret door/area IDs
  entryPointVisible: boolean; // Always true
}

// Internal types for generation

export interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: Room;
}

export interface RoomConnection {
  room1Id: string;
  room2Id: string;
  distance: number; // For MST
}

export interface Point {
  x: number;
  y: number;
}

