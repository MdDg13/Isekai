"use client";

import type { DungeonLevel, Room, Door, Corridor, Point } from '../../types/dungeon';

interface DungeonMapViewProps {
  level: DungeonLevel;
  cellSize?: number; // Pixels per grid cell (default: 20px)
  showGrid?: boolean;
  showLabels?: boolean;
  interactive?: boolean;
  onRoomClick?: (room: Room) => void;
}

export default function DungeonMapView({
  level,
  cellSize = 20,
  showGrid = true,
  showLabels = false,
  interactive = false,
  onRoomClick,
}: DungeonMapViewProps) {
  const { grid, rooms, corridors } = level;
  // Collect all doors from rooms
  const doors = rooms.flatMap((room: Room) => room.doors);
  const svgWidth = grid.width * cellSize;
  const svgHeight = grid.height * cellSize;

  return (
    <div className="w-full overflow-auto bg-gray-900 rounded-lg border border-gray-800">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="grid-lines" stroke="#2a2a2a" strokeWidth="0.5">
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
                    fill="#4a4a4a"
                    stroke="#606060"
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
              {/* Room floor */}
              <rect
                x={room.x * cellSize}
                y={room.y * cellSize}
                width={room.width * cellSize}
                height={room.height * cellSize}
                fill={getRoomColor(room)}
                stroke="#606060"
                strokeWidth="2"
                className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
                onClick={() => interactive && onRoomClick?.(room)}
              />
              {/* Room label */}
              {showLabels && (
                <text
                  x={(room.x + room.width / 2) * cellSize}
                  y={(room.y + room.height / 2) * cellSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-300 pointer-events-none"
                  fontSize={cellSize * 0.6}
                >
                  {room.id}
                </text>
              )}
              {/* Entry/Exit markers */}
              {room.type === 'entry' && (
                <circle
                  cx={(room.x + room.width / 2) * cellSize}
                  cy={(room.y + room.height / 2) * cellSize}
                  r={cellSize * 0.3}
                  fill="#22c55e"
                  className="pointer-events-none"
                />
              )}
              {room.type === 'exit' && (
                <circle
                  cx={(room.x + room.width / 2) * cellSize}
                  cy={(room.y + room.height / 2) * cellSize}
                  r={cellSize * 0.3}
                  fill="#ef4444"
                  className="pointer-events-none"
                />
              )}
            </g>
          ))}
        </g>

        {/* Doors */}
        <g className="doors">
          {doors.map((door: Door) => (
            <g key={door.id}>
              <rect
                x={door.x * cellSize - cellSize * 0.2}
                y={door.y * cellSize - cellSize * 0.2}
                width={cellSize * 0.4}
                height={cellSize * 0.4}
                fill={getDoorColor(door)}
                stroke={door.type === 'secret' ? '#fbbf24' : '#8b4513'}
                strokeWidth={door.type === 'secret' ? '2' : '1'}
                strokeDasharray={door.type === 'secret' ? '2,2' : 'none'}
                className="pointer-events-none"
              />
              {/* Door state indicator */}
              {door.state === 'locked' && (
                <text
                  x={door.x * cellSize}
                  y={door.y * cellSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-yellow-400 pointer-events-none"
                  fontSize={cellSize * 0.4}
                >
                  🔒
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function getRoomColor(room: Room): string {
  switch (room.type) {
    case 'entry':
      return '#22c55e'; // Green
    case 'exit':
      return '#ef4444'; // Red
    case 'stairwell':
      return '#3b82f6'; // Blue
    case 'special':
      return '#a855f7'; // Purple
    default:
      return '#d0d0d0'; // Light gray
  }
}

function getDoorColor(door: Door): string {
  switch (door.type) {
    case 'wooden':
      return '#8b4513';
    case 'iron':
      return '#708090';
    case 'stone':
      return '#696969';
    case 'secret':
      return '#fbbf24';
    default:
      return '#8b4513';
  }
}

