"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from '../../providers/theme-context';
import type { DungeonLevel, Room, Corridor, Point } from '../../types/dungeon';
import { getMapThemePalette } from '../../lib/theme/map-theme';

interface DungeonMapViewFallbackProps {
  level: DungeonLevel;
  dungeonType?: string;
  showControls?: boolean;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
}

/**
 * Simple procedural SVG renderer as fallback when AI-generated map is not available
 * Clean, minimal style - no textures, just clear lines
 */
export default function DungeonMapViewFallback({
  level,
  showControls = true,
  onSvgReady,
}: DungeonMapViewFallbackProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cellSize = 20; // Pixels per grid cell

  const { grid, rooms, corridors } = level;
  const svgWidth = grid.width * cellSize;
  const svgHeight = grid.height * cellSize;
  const colors = getMapThemePalette(theme);

  useEffect(() => {
    onSvgReady?.(svgRef.current);
  }, [onSvgReady, level]);

  // Get room color based on type
  const getRoomColor = (roomType: Room['type']): string => {
    switch (roomType) {
      case 'entry':
        return theme === 'light' ? '#dbeafe' : '#1e3a5f';
      case 'exit':
        return theme === 'light' ? '#fef3c7' : '#5a4a1f';
      case 'stairwell':
        return theme === 'light' ? '#e9d5ff' : '#4a1f5a';
      case 'special':
        return theme === 'light' ? '#fce7f3' : '#5a1f3a';
      default:
        return colors.roomFloor;
    }
  };

  return (
    <div className="w-full space-y-2">
      {showControls && (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span>Procedural Map (Fallback)</span>
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-lg border border-gray-700"
        style={{
          backgroundColor: colors.background,
          aspectRatio: `${grid.width}/${grid.height}`,
          minHeight: 360,
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block h-full w-full"
        >
          {/* Grid lines */}
          <g className="grid-lines" stroke={colors.gridLine} strokeWidth="0.5" opacity="0.2">
            {Array.from({ length: grid.width + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={svgHeight}
              />
            ))}
            {Array.from({ length: grid.height + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * cellSize}
                x2={svgWidth}
                y2={i * cellSize}
              />
            ))}
          </g>

          {/* Corridors */}
          <g className="corridors">
            {corridors.map((corridor: Corridor) => (
              <g key={corridor.id}>
                {corridor.path.map((point: Point, idx: number) => {
                  if (idx === 0) return null;
                  const prev = corridor.path[idx - 1];
                  return (
                    <rect
                      key={`${corridor.id}-${idx}`}
                      x={Math.min(prev.x, point.x) * cellSize}
                      y={Math.min(prev.y, point.y) * cellSize}
                      width={Math.abs(point.x - prev.x) * cellSize + cellSize}
                      height={Math.abs(point.y - prev.y) * cellSize + cellSize}
                      fill={colors.corridor}
                      stroke={colors.corridorBorder}
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            ))}
          </g>

          {/* Rooms */}
          <g className="rooms">
            {rooms.map((room: Room) => (
              <g key={room.id}>
                <rect
                  x={room.x * cellSize}
                  y={room.y * cellSize}
                  width={room.width * cellSize}
                  height={room.height * cellSize}
                  fill={getRoomColor(room.type)}
                  stroke={colors.roomBorder}
                  strokeWidth="2"
                />
                {/* Doors */}
                {room.doors.map((door) => (
                  <rect
                    key={door.id}
                    x={door.x * cellSize - 2}
                    y={door.y * cellSize - 2}
                    width={4}
                    height={4}
                    fill={door.type === 'secret' ? colors.roomBorder : '#8b5cf6'}
                    stroke={colors.roomBorder}
                    strokeWidth="1"
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

