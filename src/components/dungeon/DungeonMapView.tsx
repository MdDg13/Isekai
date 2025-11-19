"use client";

import { useState } from 'react';
import { useTheme } from '../../providers/theme-context';
import type { DungeonLevel, Room, Door, Corridor, Point } from '../../types/dungeon';

interface DungeonMapViewProps {
  level: DungeonLevel;
  cellSize?: number; // Pixels per grid cell (default: 20px)
  showGrid?: boolean;
  showLabels?: boolean;
  interactive?: boolean;
  onRoomClick?: (room: Room) => void;
}

type GridType = 'square' | 'hex';

export default function DungeonMapView({
  level,
  cellSize = 20,
  showGrid = true,
  showLabels = false,
  interactive = false,
  onRoomClick,
}: DungeonMapViewProps) {
  const { theme } = useTheme();
  const [gridType, setGridType] = useState<GridType>('square');
  const [showGridLines, setShowGridLines] = useState(showGrid);
  const [showRoomLabels, setShowRoomLabels] = useState(showLabels);

  const { grid, rooms, corridors } = level;
  // Collect all doors from rooms
  const doors = rooms.flatMap((room: Room) => room.doors);
  const svgWidth = grid.width * cellSize;
  const svgHeight = grid.height * cellSize;

  // Theme-aware colors
  const colors = theme === 'light' ? {
    background: '#f8fafc',
    gridLine: 'rgba(15, 23, 42, 0.1)',
    roomFloor: '#e2e8f0',
    roomBorder: '#94a3b8',
    corridor: '#cbd5e1',
    corridorBorder: '#94a3b8',
    door: '#8b4513',
    doorSecret: '#f59e0b',
    text: '#0f172a',
    textMuted: '#475569',
    entryMarker: '#22c55e',
    exitMarker: '#ef4444',
  } : {
    background: '#0b0b10',
    gridLine: 'rgba(255, 255, 255, 0.05)',
    roomFloor: '#1e293b',
    roomBorder: '#475569',
    corridor: '#334155',
    corridorBorder: '#475569',
    door: '#8b4513',
    doorSecret: '#fbbf24',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    entryMarker: '#22c55e',
    exitMarker: '#ef4444',
  };

  // Generate texture pattern for rooms
  const roomTexturePattern = (roomType: Room['type']) => {
    const patternId = `room-texture-${roomType}`;
    const baseColor = getRoomColor(roomType, colors, theme);
    return (
      <pattern
        id={patternId}
        patternUnits="userSpaceOnUse"
        width="8"
        height="8"
        key={patternId}
      >
        <rect width="8" height="8" fill={baseColor} />
        <circle cx="4" cy="4" r="0.5" fill={theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} />
      </pattern>
    );
  };

  return (
    <div className="w-full space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-gray-300">
            <input
              type="checkbox"
              checked={showGridLines}
              onChange={(e) => setShowGridLines(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span>Grid</span>
          </label>
          <label className="flex items-center gap-1.5 text-gray-300">
            <input
              type="checkbox"
              checked={showRoomLabels}
              onChange={(e) => setShowRoomLabels(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span>Labels</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridType('square')}
            className={`px-2 py-1 rounded text-[10px] transition-colors ${
              gridType === 'square'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Square
          </button>
          <button
            onClick={() => setGridType('hex')}
            className={`px-2 py-1 rounded text-[10px] transition-colors ${
              gridType === 'hex'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Hex
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full overflow-auto rounded-lg border border-gray-700" style={{ backgroundColor: colors.background }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
        >
          {/* Define patterns */}
          <defs>
            {roomTexturePattern('normal')}
            {roomTexturePattern('entry')}
            {roomTexturePattern('exit')}
            {roomTexturePattern('stairwell')}
            {roomTexturePattern('special')}
            {/* Corridor texture */}
            <pattern
              id="corridor-texture"
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
            >
              <rect width="4" height="4" fill={colors.corridor} />
              <line x1="0" y1="2" x2="4" y2="2" stroke={theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid lines */}
          {showGridLines && gridType === 'square' && (
            <g className="grid-lines" stroke={colors.gridLine} strokeWidth="0.5">
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
          )}

          {/* Hex grid (simplified - shows as square for now, full hex implementation would be more complex) */}
          {showGridLines && gridType === 'hex' && (
            <g className="grid-lines" stroke={colors.gridLine} strokeWidth="0.5" opacity="0.3">
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
          )}

          {/* Corridors (render first so they're behind rooms) */}
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
                      fill="url(#corridor-texture)"
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
            {rooms.map((room: Room) => {
              const patternId = `room-texture-${room.type}`;
              return (
                <g key={room.id}>
                  {/* Room floor with texture */}
                  <rect
                    x={room.x * cellSize}
                    y={room.y * cellSize}
                    width={room.width * cellSize}
                    height={room.height * cellSize}
                    fill={`url(#${patternId})`}
                    stroke={colors.roomBorder}
                    strokeWidth="2"
                    className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
                    onClick={() => interactive && onRoomClick?.(room)}
                  />
                  {/* Room label */}
                  {showRoomLabels && (
                    <text
                      x={(room.x + room.width / 2) * cellSize}
                      y={(room.y + room.height / 2) * cellSize}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={colors.text}
                      fontSize={cellSize * 0.5}
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {room.name || room.id}
                    </text>
                  )}
                  {/* Entry/Exit markers */}
                  {room.type === 'entry' && (
                    <circle
                      cx={(room.x + room.width / 2) * cellSize}
                      cy={(room.y + room.height / 2) * cellSize}
                      r={cellSize * 0.4}
                      fill={colors.entryMarker}
                      stroke={colors.background}
                      strokeWidth="2"
                      className="pointer-events-none"
                    />
                  )}
                  {room.type === 'exit' && (
                    <circle
                      cx={(room.x + room.width / 2) * cellSize}
                      cy={(room.y + room.height / 2) * cellSize}
                      r={cellSize * 0.4}
                      fill={colors.exitMarker}
                      stroke={colors.background}
                      strokeWidth="2"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Doors */}
          <g className="doors">
            {doors.map((door: Door) => (
              <g key={door.id}>
                <rect
                  x={door.x * cellSize - cellSize * 0.25}
                  y={door.y * cellSize - cellSize * 0.25}
                  width={cellSize * 0.5}
                  height={cellSize * 0.5}
                  fill={door.type === 'secret' ? colors.doorSecret : colors.door}
                  stroke={door.type === 'secret' ? colors.doorSecret : colors.door}
                  strokeWidth={door.type === 'secret' ? '2' : '1.5'}
                  strokeDasharray={door.type === 'secret' ? '2,2' : 'none'}
                  className="pointer-events-none"
                  rx="1"
                />
                {/* Door state indicator */}
                {door.state === 'locked' && (
                  <text
                    x={door.x * cellSize}
                    y={door.y * cellSize}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={colors.text}
                    fontSize={cellSize * 0.35}
                    className="pointer-events-none"
                  >
                    🔒
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function getRoomColor(roomType: Room['type'], colors: Record<string, string>, currentTheme: 'light' | 'dark'): string {
  switch (roomType) {
    case 'entry':
      return currentTheme === 'light' ? '#dcfce7' : '#166534'; // Light green / Dark green
    case 'exit':
      return currentTheme === 'light' ? '#fee2e2' : '#991b1b'; // Light red / Dark red
    case 'stairwell':
      return currentTheme === 'light' ? '#dbeafe' : '#1e3a8a'; // Light blue / Dark blue
    case 'special':
      return currentTheme === 'light' ? '#f3e8ff' : '#6b21a8'; // Light purple / Dark purple
    default:
      return colors.roomFloor;
  }
}
