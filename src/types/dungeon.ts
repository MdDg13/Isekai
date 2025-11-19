// Dungeon types - duplicated from functions for use in src components
// These match functions/_lib/dungeon-generator/types.ts

export interface DungeonGenerationParams {
  generation_mode?: "random" | "tile_based";
  grid_width: number;
  grid_height: number;
  num_levels?: number;
  min_room_size?: number;
  max_room_size?: number;
  room_density?: number;
  extra_connections_ratio?: number;
  secret_door_ratio?: number;
  theme?: string;
  difficulty?: "easy" | "medium" | "hard" | "deadly";
  architectural_style?: string;
  tile_type?: "square" | "hex";
  use_ai?: boolean;
  world_id?: string;
}

export interface DungeonDetail {
  identity: {
    name: string;
    type: "dungeon" | "cave" | "ruin" | "fortress" | "tower";
    theme: string;
    difficulty: "easy" | "medium" | "hard" | "deadly";
    recommended_level: number;
  };
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
  history: {
    origin: string;
    current_state: string;
    legends: string[];
  };
  world_integration: {
    // Map positioning (for 2D world map)
    map_location_id?: string; // References world_location.id (if dungeon entrance is on world map)
    entrance_coordinates?: {  // World map coordinates (if standalone POI on map)
      x: number;
      y: number;
      map_id?: string; // References world_map.id if multiple maps
    };
    
    // Parent location (for nested dungeons or dungeons inside towns)
    parent_location_id?: string; // References world_element.id (can be type='location' or type='dungeon')
    parent_location_type?: 'location' | 'dungeon'; // Clarify what the parent is
    entrance_room_id?: string; // If parent is dungeon, which room contains the entrance
    
    // Relationships
    connected_locations?: string[]; // Other locations accessible from here
    associated_factions?: Array<{
      faction_id: string;
      influence: "controls" | "inhabits" | "seeks" | "guards";
    }>;
  };
}

export interface DungeonLevel {
  level_index: number;
  name: string;
  grid: {
    width: number;
    height: number;
    cell_size: number;
  };
  rooms: Room[];
  corridors: Corridor[];
  stairs: Stair[];
  texture_set?: string;
  fog_of_war?: FogOfWarState;
  tile_type?: "square" | "hex";
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "chamber" | "corridor" | "stairwell" | "entry" | "exit" | "special";
  doors: Door[];
  description: string;
  features: RoomFeature[];
  connections: string[];
  floor_texture?: string;
  wall_texture?: string;
  is_secret?: boolean;
}

export interface Corridor {
  id: string;
  path: Array<{ x: number; y: number }>;
  width: number;
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
  revealedRooms: string[];
  revealedCorridors: string[];
  discoveredDoors: string[];
  discoveredSecrets: string[];
  entryPointVisible: boolean;
}

export interface Point {
  x: number;
  y: number;
}
