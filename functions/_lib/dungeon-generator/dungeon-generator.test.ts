/**
 * Unit tests for dungeon generation logic
 */

import { describe, it, expect } from 'vitest';
import { createBSPTree, getLeafNodes } from './bsp';
import { placeRooms, getRoomCenter, roomsOverlap } from './room-placer';
import { buildCorridors } from './corridor-builder';
import { generateSingleLevel, generateDungeonProcedural } from './procedural';
import type { DungeonGenerationParams } from './types';

describe('BSP Algorithm', () => {
  it('should create a BSP tree', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });

    expect(tree).toBeDefined();
    expect(tree.width).toBe(50);
    expect(tree.height).toBe(50);
  });

  it('should produce leaf nodes', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });

    const leaves = getLeafNodes(tree);
    expect(leaves.length).toBeGreaterThan(0);
    
    // All leaves should be within bounds
    for (const leaf of leaves) {
      expect(leaf.x).toBeGreaterThanOrEqual(0);
      expect(leaf.y).toBeGreaterThanOrEqual(0);
      expect(leaf.x + leaf.width).toBeLessThanOrEqual(50);
      expect(leaf.y + leaf.height).toBeLessThanOrEqual(50);
    }
  });
});

describe('Room Placement', () => {
  it('should place rooms from leaf nodes', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });
    const leaves = getLeafNodes(tree);

    const rooms = placeRooms(leaves, {
      minRoomSize: 3,
      maxRoomSize: 10,
      roomPadding: 1,
    });

    expect(rooms.length).toBeGreaterThan(0);
    
    // All rooms should be within bounds
    for (const room of rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0);
      expect(room.y).toBeGreaterThanOrEqual(0);
      expect(room.x + room.width).toBeLessThanOrEqual(50);
      expect(room.y + room.height).toBeLessThanOrEqual(50);
      expect(room.width).toBeGreaterThanOrEqual(3);
      expect(room.height).toBeGreaterThanOrEqual(3);
      expect(room.width).toBeLessThanOrEqual(10);
      expect(room.height).toBeLessThanOrEqual(10);
    }
  });

  it('should not create overlapping rooms', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });
    const leaves = getLeafNodes(tree);
    const rooms = placeRooms(leaves, {
      minRoomSize: 3,
      maxRoomSize: 10,
      roomPadding: 1,
    });

    // Check for overlaps
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        expect(roomsOverlap(rooms[i], rooms[j])).toBe(false);
      }
    }
  });

  it('should calculate room centers correctly', () => {
    const room = {
      id: 'test',
      x: 10,
      y: 10,
      width: 5,
      height: 5,
      type: 'chamber' as const,
      doors: [],
      description: '',
      features: [],
      connections: [],
    };

    const center = getRoomCenter(room);
    expect(center.x).toBe(12); // 10 + floor(5/2) = 12
    expect(center.y).toBe(12); // 10 + floor(5/2) = 12
  });
});

describe('Corridor Generation', () => {
  it('should connect all rooms', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });
    const leaves = getLeafNodes(tree);
    const rooms = placeRooms(leaves, {
      minRoomSize: 3,
      maxRoomSize: 10,
      roomPadding: 1,
    });

    if (rooms.length < 2) {
      // Skip if not enough rooms
      return;
    }

    const { corridors, connections } = buildCorridors(rooms, 0.25);

    // Should have at least (rooms.length - 1) connections (MST minimum)
    expect(connections.length).toBeGreaterThanOrEqual(rooms.length - 1);
    expect(corridors.length).toBe(connections.length);

    // All rooms should have connections
    const roomsWithConnections = new Set<string>();
    for (const connection of connections) {
      roomsWithConnections.add(connection.room1Id);
      roomsWithConnections.add(connection.room2Id);
    }
    expect(roomsWithConnections.size).toBe(rooms.length);
  });

  it('should create valid corridor paths', () => {
    const tree = createBSPTree(50, 50, {
      minRoomSize: 3,
      maxRoomSize: 10,
      splitRatio: 0.5,
      minSplitSize: 6,
    });
    const leaves = getLeafNodes(tree);
    const rooms = placeRooms(leaves, {
      minRoomSize: 3,
      maxRoomSize: 10,
      roomPadding: 1,
    });

    if (rooms.length < 2) {
      return;
    }

    const { corridors } = buildCorridors(rooms, 0.25);

    for (const corridor of corridors) {
      expect(corridor.path.length).toBeGreaterThanOrEqual(2);
      // All path points should be within bounds
      for (const point of corridor.path) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThan(50);
        expect(point.y).toBeLessThan(50);
      }
    }
  });
});

describe('Single Level Generation', () => {
  it('should generate a valid level', () => {
    const level = generateSingleLevel(50, 50, {
      min_room_size: 3,
      max_room_size: 10,
      extra_connections_ratio: 0.25,
      secret_door_ratio: 0.1,
    });

    expect(level).toBeDefined();
    expect(level.grid.width).toBe(50);
    expect(level.grid.height).toBe(50);
    expect(level.rooms.length).toBeGreaterThan(0);
    expect(level.level_index).toBe(0);

    // Should have entry room
    const entryRoom = level.rooms.find((r) => r.type === 'entry');
    expect(entryRoom).toBeDefined();
  });

  it('should handle different grid sizes', () => {
    const level1 = generateSingleLevel(30, 30, {
      min_room_size: 2,
      max_room_size: 8,
    });
    const level2 = generateSingleLevel(100, 100, {
      min_room_size: 5,
      max_room_size: 15,
    });

    expect(level1.grid.width).toBe(30);
    expect(level1.grid.height).toBe(30);
    expect(level2.grid.width).toBe(100);
    expect(level2.grid.height).toBe(100);
  });
});

describe('Full Dungeon Generation', () => {
  it('should generate a complete dungeon', () => {
    const params: DungeonGenerationParams = {
      grid_width: 50,
      grid_height: 50,
      num_levels: 1,
      min_room_size: 3,
      max_room_size: 10,
      theme: 'test dungeon',
      difficulty: 'medium',
    };

    const dungeon = generateDungeonProcedural(params);

    expect(dungeon).toBeDefined();
    expect(dungeon.identity.name).toContain('test dungeon');
    expect(dungeon.identity.difficulty).toBe('medium');
    expect(dungeon.structure.levels.length).toBe(1);
    expect(dungeon.structure.entry_point).toBeDefined();
    expect(dungeon.structure.exit_points.length).toBeGreaterThan(0);
  });

  it('should generate multi-level dungeons', () => {
    const params: DungeonGenerationParams = {
      grid_width: 50,
      grid_height: 50,
      num_levels: 3,
      min_room_size: 3,
      max_room_size: 10,
    };

    const dungeon = generateDungeonProcedural(params);

    expect(dungeon.structure.levels.length).toBe(3);
    expect(dungeon.structure.levels[0].level_index).toBe(0);
    expect(dungeon.structure.levels[1].level_index).toBe(1);
    expect(dungeon.structure.levels[2].level_index).toBe(2);
  });

  it('should respect room size constraints', () => {
    const params: DungeonGenerationParams = {
      grid_width: 50,
      grid_height: 50,
      num_levels: 1,
      min_room_size: 5,
      max_room_size: 8,
    };

    const dungeon = generateDungeonProcedural(params);
    const level = dungeon.structure.levels[0];

    for (const room of level.rooms) {
      expect(room.width).toBeGreaterThanOrEqual(5);
      expect(room.height).toBeGreaterThanOrEqual(5);
      expect(room.width).toBeLessThanOrEqual(8);
      expect(room.height).toBeLessThanOrEqual(8);
    }
  });
});

