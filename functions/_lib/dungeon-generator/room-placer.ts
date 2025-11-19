/**
 * Room placement logic - creates rooms from BSP leaf nodes
 */

import type { BSPNode, Room } from './types';

export interface RoomPlacementOptions {
  minRoomSize: number;
  maxRoomSize: number;
  roomPadding: number; // Cells to shrink room from leaf bounds (default: 1-2)
}

/**
 * Create rooms from BSP leaf nodes
 */
export function placeRooms(
  leafNodes: BSPNode[],
  options: RoomPlacementOptions
): Room[] {
  const rooms: Room[] = [];
  const { minRoomSize, maxRoomSize, roomPadding } = options;

  for (let i = 0; i < leafNodes.length; i++) {
    const leaf = leafNodes[i];
    
    // Calculate room size (shrink from leaf bounds)
    const padding = roomPadding + Math.floor(Math.random() * 2); // 1-3 cells padding
    const roomX = leaf.x + padding;
    const roomY = leaf.y + padding;
    const roomWidth = Math.max(
      minRoomSize,
      Math.min(maxRoomSize, leaf.width - padding * 2)
    );
    const roomHeight = Math.max(
      minRoomSize,
      Math.min(maxRoomSize, leaf.height - padding * 2)
    );

    // Ensure room fits in leaf
    if (roomX + roomWidth > leaf.x + leaf.width) {
      continue; // Skip if room doesn't fit
    }
    if (roomY + roomHeight > leaf.y + leaf.height) {
      continue; // Skip if room doesn't fit
    }

    // Randomize position within leaf (if there's extra space)
    const extraWidth = (leaf.x + leaf.width) - (roomX + roomWidth);
    const extraHeight = (leaf.y + leaf.height) - (roomY + roomHeight);
    const offsetX = extraWidth > 0 ? Math.floor(Math.random() * extraWidth) : 0;
    const offsetY = extraHeight > 0 ? Math.floor(Math.random() * extraHeight) : 0;

    const room: Room = {
      id: `room-${i}`,
      x: roomX + offsetX,
      y: roomY + offsetY,
      width: roomWidth,
      height: roomHeight,
      type: 'chamber',
      doors: [],
      description: '',
      features: [],
      connections: [],
    };

    rooms.push(room);
  }

  return rooms;
}

/**
 * Get the center point of a room
 */
export function getRoomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

/**
 * Check if two rooms overlap
 */
export function roomsOverlap(room1: Room, room2: Room): boolean {
  return !(
    room1.x + room1.width <= room2.x ||
    room2.x + room2.width <= room1.x ||
    room1.y + room1.height <= room2.y ||
    room2.y + room2.height <= room1.y
  );
}

