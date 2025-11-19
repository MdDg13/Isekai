/**
 * Main procedural dungeon generation orchestrator
 * Combines BSP, room placement, corridors, and doors
 */

import { createBSPTree, getLeafNodes } from './bsp';
import { placeRooms } from './room-placer';
import { buildCorridors } from './corridor-builder';
import { placeDoors } from './door-placer';
import { addRoomFeatures } from './feature-generator';
import { getLayoutProfile } from './layout-profiles';
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
  min_tile_span: 2,
  max_tile_span: 2,
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
    secret_door_ratio = DEFAULT_PARAMS.secret_door_ratio,
    min_tile_span = DEFAULT_PARAMS.min_tile_span,
    max_tile_span = DEFAULT_PARAMS.max_tile_span,
  } = params;

  const { profile, type: dungeonType } = getLayoutProfile(params.theme);
  const tileSpanMin = Math.max(1, min_tile_span ?? profile.defaultTileSpan);
  const tileSpanMax = Math.max(tileSpanMin, max_tile_span ?? tileSpanMin);

  const resolvedMinRoomSize = Math.max(profile.minRoomSize, min_room_size);
  const resolvedMaxRoomSize = Math.max(resolvedMinRoomSize, Math.min(profile.maxRoomSize, max_room_size));
  const resolvedDensity = params.room_density ?? profile.roomDensity;
  const resolvedExtraConnections = params.extra_connections_ratio ?? profile.extraConnections;

  // Step 1: Create BSP tree
  const bspTree = createBSPTree(width, height, {
    minRoomSize: resolvedMinRoomSize,
    maxRoomSize: resolvedMaxRoomSize,
    splitRatio: profile.splitRatio,
    minSplitSize: Math.max(profile.minSplitSize, resolvedMinRoomSize * 2, tileSpanMin * 2),
  });

  // Step 2: Get leaf nodes and place rooms
  const leafNodes = getLeafNodes(bspTree);
  const roomDensity = resolvedDensity;
  
  // Calculate target room count based on density and available leaf nodes
  // Use density to determine how many leaf nodes to use for rooms
  const baseRoomCount = Math.max(1, Math.floor(leafNodes.length * roomDensity));
  
  // Ensure minimum viable room count (at least 2 for entry/exit, or 1 for single-room)
  const minRooms = Math.max(1, Math.floor(roomDensity * 5)); // At least 1 room per 20% density
  const targetRoomCount = Math.max(minRooms, baseRoomCount);
  
  // Select nodes up to target, but don't exceed available leaf nodes
  const selectedNodes = leafNodes.slice(0, Math.min(targetRoomCount, leafNodes.length));
  
  const rooms = placeRooms(selectedNodes, {
    minRoomSize: resolvedMinRoomSize,
    maxRoomSize: resolvedMaxRoomSize,
    roomPadding: profile.roomPadding,
    minTileSpan: tileSpanMin,
    maxTileSpan: tileSpanMax,
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
  const corridorStyle = profile.featureBias === 'organic' || profile.featureBias === 'wild' ? 'organic' : 'straight';
  const { corridors } = buildCorridors(rooms, resolvedExtraConnections, corridorStyle);

  // Step 6: Place doors
  const { updatedRooms, updatedCorridors } = placeDoors(
    rooms,
    corridors,
    { secretDoorRatio: secret_door_ratio }
  );

  const featuredRooms = addRoomFeatures(updatedRooms, profile, params.difficulty ?? 'medium');

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
    rooms: featuredRooms,
    corridors: updatedCorridors,
    stairs: [],
    tile_type: tileType,
    texture_set: dungeonType,
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
  const { type: identityType } = getLayoutProfile(theme);

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
      type: identityType,
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

