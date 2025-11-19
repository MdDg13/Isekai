/**
 * Corridor generation using Minimum Spanning Tree (MST) + extra connections
 */

import type { Room, Corridor, RoomConnection, Point } from './types';
import { getRoomCenter } from './room-placer';

/**
 * Build corridors connecting all rooms using MST + extra connections
 */
export function buildCorridors(
  rooms: Room[],
  extraConnectionsRatio: number,
  style: 'straight' | 'organic' = 'straight'
): { corridors: Corridor[]; connections: RoomConnection[] } {
  if (rooms.length === 0) {
    return { corridors: [], connections: [] };
  }

  if (rooms.length === 1) {
    return { corridors: [], connections: [] };
  }

  // Calculate distances between all room pairs
  const allConnections: RoomConnection[] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const center1 = getRoomCenter(rooms[i]);
      const center2 = getRoomCenter(rooms[j]);
      const distance = Math.abs(center1.x - center2.x) + Math.abs(center1.y - center2.y);
      allConnections.push({
        room1Id: rooms[i].id,
        room2Id: rooms[j].id,
        distance,
      });
    }
  }

  // Sort by distance (for MST)
  allConnections.sort((a, b) => a.distance - b.distance);

  // Build MST using Kruskal's algorithm
  const mstConnections: RoomConnection[] = [];
  const roomSets = new Map<string, string>(); // roomId -> set representative

  // Initialize each room as its own set
  for (const room of rooms) {
    roomSets.set(room.id, room.id);
  }

  function findSet(roomId: string): string {
    const rep = roomSets.get(roomId);
    if (!rep || rep === roomId) {
      return roomId;
    }
    // Path compression
    const root = findSet(rep);
    roomSets.set(roomId, root);
    return root;
  }

  function union(room1Id: string, room2Id: string): void {
    const root1 = findSet(room1Id);
    const root2 = findSet(room2Id);
    if (root1 !== root2) {
      roomSets.set(root2, root1);
    }
  }

  // Build MST
  for (const connection of allConnections) {
    const root1 = findSet(connection.room1Id);
    const root2 = findSet(connection.room2Id);
    if (root1 !== root2) {
      mstConnections.push(connection);
      union(connection.room1Id, connection.room2Id);
    }
  }

  // Add extra connections (for loops/non-linear exploration)
  const extraCount = Math.floor(mstConnections.length * extraConnectionsRatio);
  const extraConnections: RoomConnection[] = [];
  const usedConnections = new Set(
    mstConnections.map((c) => `${c.room1Id}-${c.room2Id}`)
  );

  for (const connection of allConnections) {
    if (extraConnections.length >= extraCount) break;
    const key = `${connection.room1Id}-${connection.room2Id}`;
    const reverseKey = `${connection.room2Id}-${connection.room1Id}`;
    if (!usedConnections.has(key) && !usedConnections.has(reverseKey)) {
      extraConnections.push(connection);
      usedConnections.add(key);
    }
  }

  const allConnectionsToBuild = [...mstConnections, ...extraConnections];

  // Generate corridor paths for each connection
  const corridors: Corridor[] = [];
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  for (let i = 0; i < allConnectionsToBuild.length; i++) {
    const connection = allConnectionsToBuild[i];
    const room1 = roomMap.get(connection.room1Id);
    const room2 = roomMap.get(connection.room2Id);

    if (!room1 || !room2) continue;

    const center1 = getRoomCenter(room1);
    const center2 = getRoomCenter(room2);

    // Create L-shaped path (horizontal then vertical, or vice versa)
    const path = createLShapedPath(center1, center2, style);

    const corridor: Corridor = {
      id: `corridor-${i}`,
      path,
      width: 1, // 5 feet (1 cell)
      doors: [],
    };

    corridors.push(corridor);

    // Update room connections
    if (!room1.connections.includes(room2.id)) {
      room1.connections.push(room2.id);
    }
    if (!room2.connections.includes(room1.id)) {
      room2.connections.push(room1.id);
    }
  }

  return { corridors, connections: allConnectionsToBuild };
}

/**
 * Create an L-shaped path between two points
 * Randomly chooses horizontal-first or vertical-first
 */
function createLShapedPath(start: Point, end: Point, style: 'straight' | 'organic'): Point[] {
  const path: Point[] = [start];

  // Randomly choose direction (horizontal-first or vertical-first)
  const horizontalFirst = Math.random() < 0.5;

  if (horizontalFirst) {
    // Move horizontally first, then vertically
    path.push({ x: end.x, y: start.y });
    path.push(end);
  } else {
    // Move vertically first, then horizontally
    path.push({ x: start.x, y: end.y });
    path.push(end);
  }

  if (style === 'organic') {
    // Insert slight deviations to simulate winding tunnels
    const jittered: Point[] = [path[0]];
    for (let i = 1; i < path.length; i++) {
      const prev = jittered[jittered.length - 1];
      const current = path[i];
      const midX = Math.round((prev.x + current.x) / 2);
      const midY = Math.round((prev.y + current.y) / 2);
      const offsetX = Math.round((Math.random() - 0.5) * 2);
      const offsetY = Math.round((Math.random() - 0.5) * 2);
      jittered.push({ x: midX + offsetX, y: midY + offsetY });
      jittered.push(current);
    }
    return jittered;
  }

  return path;
}

