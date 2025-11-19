/**
 * Room placement logic - creates rooms from BSP leaf nodes
 */

import type { BSPNode, Room } from './types';

export interface RoomPlacementOptions {
  minRoomSize: number;
  maxRoomSize: number;
  roomPadding: number; // Cells to shrink room from leaf bounds (default: 1-2)
  minTileSpan: number;
  maxTileSpan: number;
}

/**
 * Create rooms from BSP leaf nodes
 */
export function placeRooms(
  leafNodes: BSPNode[],
  options: RoomPlacementOptions
): Room[] {
  const rooms: Room[] = [];
  const { minRoomSize, maxRoomSize, roomPadding, minTileSpan, maxTileSpan } = options;

  for (let i = 0; i < leafNodes.length; i++) {
    const leaf = leafNodes[i];
    
    // Calculate room size (shrink from leaf bounds)
    const padding = roomPadding + Math.floor(Math.random() * 2); // 1-3 cells padding
    const roomX = leaf.x + padding;
    const roomY = leaf.y + padding;
    const tileUnit = Math.max(1, minTileSpan);
    const maxTileUnit = Math.max(tileUnit, maxTileSpan);

    const rawWidth = Math.min(maxRoomSize, leaf.width - padding * 2);
    const rawHeight = Math.min(maxRoomSize, leaf.height - padding * 2);

    const roomWidth = quantizeDimension(rawWidth, tileUnit, maxTileUnit, minRoomSize);
    const roomHeight = quantizeDimension(rawHeight, tileUnit, maxTileUnit, minRoomSize);

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

    const snappedOffsetX = offsetX - (offsetX % tileUnit);
    const snappedOffsetY = offsetY - (offsetY % tileUnit);

    const room: Room = {
      id: `room-${i}`,
      x: roomX + snappedOffsetX,
      y: roomY + snappedOffsetY,
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

function quantizeDimension(value: number, tileUnit: number, maxTileUnit: number, minRoomSize: number): number {
  const maxTiles = Math.max(1, Math.floor(value / tileUnit));
  const clampedTiles = Math.max(Math.ceil(minRoomSize / tileUnit), Math.min(maxTileUnit, maxTiles));
  return clampedTiles * tileUnit;
}

