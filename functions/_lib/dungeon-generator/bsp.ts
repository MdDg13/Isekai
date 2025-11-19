/**
 * Binary Space Partitioning (BSP) algorithm for dungeon generation
 * Recursively divides space into rooms
 */

import type { BSPNode } from './types';

export interface BSPOptions {
  minRoomSize: number;
  maxRoomSize: number;
  splitRatio: number; // 0.4-0.6, how to split (default: 0.5)
  minSplitSize: number; // Minimum size to continue splitting
}

/**
 * Create a BSP tree by recursively splitting the space
 */
export function createBSPTree(
  width: number,
  height: number,
  options: BSPOptions
): BSPNode {
  const root: BSPNode = {
    x: 0,
    y: 0,
    width,
    height,
  };

  splitNode(root, options, 0);

  return root;
}

/**
 * Recursively split a node until it's small enough for a room
 */
function splitNode(node: BSPNode, options: BSPOptions, depth: number): void {
  const { minRoomSize, maxRoomSize, splitRatio, minSplitSize } = options;

  // Stop splitting if node is too small
  if (node.width < minSplitSize || node.height < minSplitSize) {
    return;
  }

  // Stop splitting if node is room-sized
  if (
    node.width <= maxRoomSize * 1.5 &&
    node.height <= maxRoomSize * 1.5 &&
    node.width >= minRoomSize &&
    node.height >= minRoomSize
  ) {
    return;
  }

  // Decide split direction (prefer longer axis)
  const horizontal = node.width > node.height;
  const splitSize = horizontal ? node.width : node.height;

  // Can't split if too small
  if (splitSize < minSplitSize * 2) {
    return;
  }

  // Calculate split position (with randomness)
  const minSplit = minSplitSize;
  const maxSplit = splitSize - minSplitSize;
  const splitPos = Math.floor(minSplit + (maxSplit - minSplit) * splitRatio);
  const randomOffset = Math.floor((maxSplit - minSplit) * 0.2 * (Math.random() - 0.5));
  const finalSplitPos = Math.max(minSplit, Math.min(maxSplit, splitPos + randomOffset));

  // Create child nodes
  if (horizontal) {
    // Split vertically (divide width)
    node.left = {
      x: node.x,
      y: node.y,
      width: finalSplitPos,
      height: node.height,
    };
    node.right = {
      x: node.x + finalSplitPos,
      y: node.y,
      width: node.width - finalSplitPos,
      height: node.height,
    };
  } else {
    // Split horizontally (divide height)
    node.left = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: finalSplitPos,
    };
    node.right = {
      x: node.x,
      y: node.y + finalSplitPos,
      width: node.width,
      height: node.height - finalSplitPos,
    };
  }

  // Recursively split children
  splitNode(node.left, options, depth + 1);
  splitNode(node.right, options, depth + 1);
}

/**
 * Get all leaf nodes (nodes without children) from BSP tree
 * These are the spaces where rooms will be placed
 */
export function getLeafNodes(node: BSPNode): BSPNode[] {
  const leaves: BSPNode[] = [];

  function traverse(current: BSPNode): void {
    if (!current.left && !current.right) {
      // Leaf node
      leaves.push(current);
    } else {
      if (current.left) traverse(current.left);
      if (current.right) traverse(current.right);
    }
  }

  traverse(node);
  return leaves;
}

