/**
 * Main procedural dungeon generation orchestrator
 * Combines BSP, room placement, corridors, and doors
 */

import { createBSPTree, getLeafNodes } from './bsp';
import { placeRooms } from './room-placer';
import { buildCorridors } from './corridor-builder';
import { placeDoors } from './door-placer';
import type {
  DungeonGenerationParams,
  DungeonDetail,
  DungeonLevel,
} from './types';

const DEFAULT_PARAMS: Required<Omit<DungeonGenerationParams, 'world_id' | 'theme' | 'difficulty' | 'architectural_style'>> = {
  generation_mode: 'random',
  grid_width: 50,
  grid_height: 50,
  num_levels: 1,
  min_room_size: 2,
  max_room_size: 10,
  room_density: 0.3,
  extra_connections_ratio: 0.25,
  secret_door_ratio: 0.1,
  tile_type: 'square',
  use_ai: true,
};

/**
 * Generate a single-level dungeon procedurally
 */
export function generateSingleLevel(
  width: number,
  height: number,
  params: DungeonGenerationParams
): DungeonLevel {
  const {
    min_room_size = DEFAULT_PARAMS.min_room_size,
    max_room_size = DEFAULT_PARAMS.max_room_size,
    extra_connections_ratio = DEFAULT_PARAMS.extra_connections_ratio,
    secret_door_ratio = DEFAULT_PARAMS.secret_door_ratio,
  } = params;

  // Step 1: Create BSP tree
  const bspTree = createBSPTree(width, height, {
    minRoomSize: min_room_size,
    maxRoomSize: max_room_size,
    splitRatio: 0.5,
    minSplitSize: min_room_size * 2,
  });

  // Step 2: Get leaf nodes and place rooms
  const leafNodes = getLeafNodes(bspTree);
  const roomDensity = params.room_density ?? DEFAULT_PARAMS.room_density;
  
  // Adjust number of rooms based on density
  // For very small dungeons, ensure we get a reasonable minimum
  const baseRoomCount = Math.max(1, Math.floor(leafNodes.length * roomDensity));
  // Apply density more intelligently - ensure at least 1 room per 10% density
  const minRoomsFromDensity = Math.max(1, Math.floor(roomDensity * 10));
  const targetRoomCount = Math.max(minRoomsFromDensity, baseRoomCount);
  const selectedNodes = leafNodes.slice(0, Math.min(targetRoomCount, leafNodes.length));
  
  const rooms = placeRooms(selectedNodes, {
    minRoomSize: min_room_size,
    maxRoomSize: max_room_size,
    roomPadding: 1,
  });

  if (rooms.length === 0) {
    throw new Error('Failed to generate any rooms');
  }

  // Step 3: Mark entry room (first room)
  rooms[0].type = 'entry';
  rooms[0].description = 'The entrance to the dungeon';

  // Step 4: Mark exit room (last room, if multiple rooms)
  if (rooms.length > 1) {
    rooms[rooms.length - 1].type = 'exit';
    rooms[rooms.length - 1].description = 'An exit from the dungeon';
  }

  // Step 5: Build corridors
  const { corridors } = buildCorridors(rooms, extra_connections_ratio);

  // Step 6: Place doors
  const { updatedRooms, updatedCorridors } = placeDoors(
    rooms,
    corridors,
    { secretDoorRatio: secret_door_ratio }
  );

  // Step 7: Create level
  const tileType = params.tile_type || 'square';
  const level: DungeonLevel = {
    level_index: 0,
    name: 'Main Level',
    grid: {
      width,
      height,
      cell_size: 5, // 5 feet per cell
    },
    rooms: updatedRooms,
    corridors: updatedCorridors,
    stairs: [],
    tile_type: tileType,
  };

  return level;
}

/**
 * Generate a complete dungeon with multiple levels
 */
export function generateDungeonProcedural(
  params: DungeonGenerationParams
): DungeonDetail {
  const {
    grid_width = DEFAULT_PARAMS.grid_width,
    grid_height = DEFAULT_PARAMS.grid_height,
    num_levels = DEFAULT_PARAMS.num_levels,
    theme = 'dungeon',
    difficulty = 'medium',
  } = params;

  // Generate levels
  const levels: DungeonLevel[] = [];
  for (let i = 0; i < num_levels; i++) {
    const level = generateSingleLevel(grid_width, grid_height, params);
    level.level_index = i;
    level.name = i === 0 ? 'Upper Level' : i === num_levels - 1 ? 'Deep Level' : `Level ${i + 1}`;
    levels.push(level);
  }

  // Find entry and exit points
  const entryLevel = levels[0];
  const entryRoom = entryLevel.rooms.find((r) => r.type === 'entry') || entryLevel.rooms[0];
  const exitLevel = levels[levels.length - 1];
  const exitRoom = exitLevel.rooms.find((r) => r.type === 'exit') || exitLevel.rooms[exitLevel.rooms.length - 1];

  // Create dungeon detail
  const dungeon: DungeonDetail = {
    identity: {
      name: `${theme} ${Math.floor(Math.random() * 1000)}`,
      type: theme.includes('cave') ? 'cave' : theme.includes('ruin') ? 'ruin' : theme.includes('fortress') ? 'fortress' : theme.includes('tower') ? 'tower' : 'dungeon',
      theme,
      difficulty,
      recommended_level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 5 : difficulty === 'hard' ? 10 : 15,
    },
    structure: {
      levels,
      entry_point: {
        level_index: entryLevel.level_index,
        room_index: entryLevel.rooms.indexOf(entryRoom),
        description: 'The main entrance to the dungeon',
      },
      exit_points: [
        {
          level_index: exitLevel.level_index,
          room_index: exitLevel.rooms.indexOf(exitRoom),
          description: 'An exit from the dungeon',
        },
      ],
    },
    history: {
      origin: 'A procedurally generated dungeon',
      current_state: 'Unknown',
      legends: [],
    },
    world_integration: {
      parent_location_id: params.world_id,
      connected_locations: [],
      associated_factions: [],
    },
  };

  return dungeon;
}

