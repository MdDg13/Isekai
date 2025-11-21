"use client";

import type { DungeonLevel, Room } from '../../types/dungeon';
import DungeonMapImageView from './DungeonMapImageView';

interface DungeonMapViewProps {
  level: DungeonLevel;
  cellSize?: number; // Deprecated - kept for compatibility
  showGrid?: boolean; // Deprecated - kept for compatibility
  showLabels?: boolean; // Deprecated - kept for compatibility
  interactive?: boolean; // Deprecated - kept for compatibility
  onRoomClick?: (room: Room) => void; // Deprecated - kept for compatibility
  dungeonType?: string;
  showControls?: boolean;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
}

/**
 * Main dungeon map view component
 * Displays AI-generated maps when available, falls back to procedural SVG
 */
export default function DungeonMapView({
  level,
  dungeonType = 'dungeon',
  showControls = true,
  onSvgReady,
  // Deprecated props - kept for compatibility but not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cellSize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showGrid,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showLabels,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interactive,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRoomClick,
}: DungeonMapViewProps) {
  return (
    <DungeonMapImageView
      level={level}
      dungeonType={dungeonType}
      showControls={showControls}
      onSvgReady={onSvgReady}
    />
  );
}
