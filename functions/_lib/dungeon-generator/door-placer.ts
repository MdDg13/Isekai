/**
 * Door placement logic - places doors at room-corridor connections
 */

import type { Room, Corridor, Door } from './types';
import { getRoomCenter } from './room-placer';

export interface DoorPlacementOptions {
  secretDoorRatio: number; // 0.0-1.0, default: 0.1
}

/**
 * Place doors at room entrances and along corridors
 */
export function placeDoors(
  rooms: Room[],
  corridors: Corridor[],
  options: DoorPlacementOptions
): { doors: Door[]; updatedRooms: Room[]; updatedCorridors: Corridor[] } {
  const doors: Door[] = [];
  const { secretDoorRatio } = options;

  // Create maps for quick lookup
  const roomMap = new Map(rooms.map((r) => [r.id, { ...r }]));
  const corridorMap = new Map(corridors.map((c) => [c.id, { ...c }]));

  let doorIdCounter = 0;

  // Place doors at room entrances (where corridors connect to rooms)
  for (const corridor of corridors) {
    if (corridor.path.length < 2) continue;

    const start = corridor.path[0];
    const end = corridor.path[corridor.path.length - 1];

    // Find rooms connected to this corridor
    const connectedRooms = rooms.filter((room) => {
      const center = getRoomCenter(room);
      const startDist = Math.abs(center.x - start.x) + Math.abs(center.y - start.y);
      const endDist = Math.abs(center.x - end.x) + Math.abs(center.y - end.y);
      return startDist < 3 || endDist < 3; // Within 3 cells of room center
    });

    for (const room of connectedRooms) {
      // Find connection point (where corridor touches room)
      const connectionPoint = findConnectionPoint(room, corridor);
      if (!connectionPoint) continue;

      // Determine if this should be a secret door
      const isSecret = Math.random() < secretDoorRatio;

      const door: Door = {
        id: `door-${doorIdCounter++}`,
        x: connectionPoint.x,
        y: connectionPoint.y,
        type: isSecret ? 'secret' : getRandomDoorType(),
        state: getRandomDoorState(),
        lock_dc: Math.random() < 0.3 ? 10 + Math.floor(Math.random() * 10) : undefined, // 10-20 DC
        strength_dc: Math.random() < 0.2 ? 15 + Math.floor(Math.random() * 10) : undefined, // 15-25 DC
      };

      doors.push(door);

      // Add door to room
      const updatedRoom = roomMap.get(room.id);
      if (updatedRoom) {
        updatedRoom.doors.push(door);
      }

      // Add door to corridor if it's along the path
      const updatedCorridor = corridorMap.get(corridor.id);
      if (updatedCorridor && isDoorAlongCorridor(door, corridor)) {
        updatedCorridor.doors.push(door);
      }
    }
  }

  return {
    doors,
    updatedRooms: Array.from(roomMap.values()),
    updatedCorridors: Array.from(corridorMap.values()),
  };
}

/**
 * Find the point where a corridor connects to a room
 */
function findConnectionPoint(room: Room, corridor: Corridor): Point | null {
  if (corridor.path.length < 2) return null;

  const start = corridor.path[0];
  const end = corridor.path[corridor.path.length - 1];

  // Check if start or end is on room boundary
  const startOnBoundary = isPointOnRoomBoundary(start, room);
  const endOnBoundary = isPointOnRoomBoundary(end, room);

  if (startOnBoundary) return start;
  if (endOnBoundary) return end;

  // Find closest point on room boundary to corridor start/end
  const closestToStart = findClosestBoundaryPoint(start, room);
  const closestToEnd = findClosestBoundaryPoint(end, room);

  const distToStart = Math.abs(closestToStart.x - start.x) + Math.abs(closestToStart.y - start.y);
  const distToEnd = Math.abs(closestToEnd.x - end.x) + Math.abs(closestToEnd.y - end.y);

  return distToStart < distToEnd ? closestToStart : closestToEnd;
}

/**
 * Check if a point is on a room's boundary
 */
function isPointOnRoomBoundary(point: Point, room: Room): boolean {
  const onLeft = point.x === room.x && point.y >= room.y && point.y < room.y + room.height;
  const onRight = point.x === room.x + room.width - 1 && point.y >= room.y && point.y < room.y + room.height;
  const onTop = point.y === room.y && point.x >= room.x && point.x < room.x + room.width;
  const onBottom = point.y === room.y + room.height - 1 && point.x >= room.x && point.x < room.x + room.width;

  return onLeft || onRight || onTop || onBottom;
}

/**
 * Find the closest point on a room's boundary to a given point
 */
function findClosestBoundaryPoint(point: Point, room: Room): Point {
  // Find closest edge
  const distToLeft = Math.abs(point.x - room.x);
  const distToRight = Math.abs(point.x - (room.x + room.width - 1));
  const distToTop = Math.abs(point.y - room.y);
  const distToBottom = Math.abs(point.y - (room.y + room.height - 1));

  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

  if (minDist === distToLeft) {
    return { x: room.x, y: Math.max(room.y, Math.min(room.y + room.height - 1, point.y)) };
  }
  if (minDist === distToRight) {
    return { x: room.x + room.width - 1, y: Math.max(room.y, Math.min(room.y + room.height - 1, point.y)) };
  }
  if (minDist === distToTop) {
    return { x: Math.max(room.x, Math.min(room.x + room.width - 1, point.x)), y: room.y };
  }
  // distToBottom
  return { x: Math.max(room.x, Math.min(room.x + room.width - 1, point.x)), y: room.y + room.height - 1 };
}

/**
 * Check if a door is along a corridor path
 */
function isDoorAlongCorridor(door: Door, corridor: Corridor): boolean {
  for (let i = 0; i < corridor.path.length - 1; i++) {
    const p1 = corridor.path[i];
    const p2 = corridor.path[i + 1];
    if (
      (door.x === p1.x && door.y === p1.y) ||
      (door.x === p2.x && door.y === p2.y) ||
      (door.x >= Math.min(p1.x, p2.x) &&
        door.x <= Math.max(p1.x, p2.x) &&
        door.y >= Math.min(p1.y, p2.y) &&
        door.y <= Math.max(p1.y, p2.y))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Get a random door type
 */
function getRandomDoorType(): Door['type'] {
  const types: Door['type'][] = ['wooden', 'iron', 'stone'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Get a random door state
 */
function getRandomDoorState(): Door['state'] {
  const states: Door['state'][] = ['open', 'closed', 'locked', 'stuck'];
  const weights = [0.2, 0.5, 0.2, 0.1]; // Most doors are closed
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < states.length; i++) {
    sum += weights[i];
    if (rand < sum) {
      return states[i];
    }
  }
  return 'closed';
}

