"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../providers/theme-context';
import type { DungeonLevel, Room, Door, Corridor, Point, RoomFeature } from '../../types/dungeon';
import { generateTexturePatterns, getTexturePatternId, getTextureSetForType, type DungeonType } from '../../lib/dungeon-textures';
import { getMapThemePalette, type MapThemePalette } from '../../lib/theme/map-theme';
import { FEATURE_ICON_DEFS, type FeatureIconKey } from './feature-icons';

interface DungeonMapViewProps {
  level: DungeonLevel;
  cellSize?: number; // Pixels per grid cell (default: 20px)
  showGrid?: boolean;
  showLabels?: boolean;
  interactive?: boolean;
  onRoomClick?: (room: Room) => void;
  dungeonType?: DungeonType; // For texture selection
  showControls?: boolean;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
}

type GridType = 'square' | 'hex';

export default function DungeonMapView({
  level,
  cellSize = 20,
  showGrid = true,
  showLabels = false,
  interactive = false,
  onRoomClick,
  dungeonType = 'dungeon',
  showControls = true,
  onSvgReady,
}: DungeonMapViewProps) {
  const { theme } = useTheme();
  const levelTileType = level.tile_type || 'square';
  const [gridType, setGridType] = useState<GridType>(levelTileType as GridType);
  const [showGridLines, setShowGridLines] = useState(showGrid);
  const [showRoomLabels, setShowRoomLabels] = useState(showLabels);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setShowGridLines(showGrid);
  }, [showGrid]);

  useEffect(() => {
    setShowRoomLabels(showLabels);
  }, [showLabels]);

  const { grid, rooms, corridors } = level;
  // Collect all doors from rooms
  const doors = rooms.flatMap((room: Room) => room.doors);
  const svgWidth = grid.width * cellSize;
  const svgHeight = grid.height * cellSize;

  // Theme-aware colors (shared map palette)
  const colors = getMapThemePalette(theme);

  // Generate improved texture patterns based on dungeon type
  const texturePatterns = generateTexturePatterns(dungeonType, theme);
  const textures = getTextureSetForType(dungeonType);
  const chamberPatternId = textures?.floor ?? getTexturePatternId(dungeonType, 'floor', 'stone');
  const corridorPatternId = textures?.corridor ?? 'corridor-texture';
  const corridorPatternFill = corridorPatternId === 'corridor-texture' ? 'url(#corridor-texture)' : `url(#${corridorPatternId})`;
  
  // Generate texture pattern for rooms (fallback for room types)
  const roomTexturePattern = (roomType: Room['type']) => {
    const patternId = `room-texture-${roomType}`;
    const baseColor = getRoomColor(roomType, colors, theme);
    // Use improved textures for chambers, simple patterns for special rooms
    if (roomType === 'chamber' || roomType === 'corridor') {
      // Will use dungeon-type textures via pattern references
      return null; // Handled by texturePatterns
    }
    return (
      <pattern
        id={patternId}
        patternUnits="userSpaceOnUse"
        width="12"
        height="12"
        key={patternId}
      >
        <rect width="12" height="12" fill={baseColor} />
        <circle cx="6" cy="6" r="1" fill={theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} />
      </pattern>
    );
  };

  useEffect(() => {
    onSvgReady?.(svgRef.current);
  }, [onSvgReady, level, gridType, showGridLines, showRoomLabels, cellSize, theme, dungeonType]);

  return (
    <div className="w-full space-y-2">
      {showControls && (
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
      )}

      {/* Map Container */}
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
          {/* Define patterns */}
          <defs>
            {/* Improved textures from texture library */}
            <g dangerouslySetInnerHTML={{ __html: texturePatterns }} />
            <radialGradient id={`vignette-${level.level_index}`} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor={theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.55)'} />
            </radialGradient>
            {/* Room-specific patterns */}
            {roomTexturePattern('entry')}
            {roomTexturePattern('exit')}
            {roomTexturePattern('stairwell')}
            {roomTexturePattern('special')}
            {/* Chamber/corridor use dungeon-type floor textures */}
            <pattern
              id="room-texture-chamber"
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
            >
              <rect width="20" height="20" fill={colors.roomFloor} />
            </pattern>
            {/* Corridor texture */}
            <pattern
              id="corridor-texture"
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <rect width="8" height="8" fill={colors.corridor} />
              <line x1="0" y1="4" x2="8" y2="4" stroke={theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.8" />
              <line x1="4" y1="0" x2="4" y2="8" stroke={theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#vignette-${level.level_index})`} opacity="0.35" pointerEvents="none" />

          {/* Grid lines - clearly visible tiles for gameplay */}
          {showGridLines && gridType === 'square' && (
            <>
              <g className="grid-lines" stroke={colors.gridLine} strokeWidth={theme === 'light' ? '1' : '0.8'} opacity={theme === 'light' ? '0.3' : '0.4'}>
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
              {/* Tile borders for clearer visibility */}
              {Array.from({ length: grid.width }, (_, x) =>
                Array.from({ length: grid.height }, (_, y) => (
                  <rect
                    key={`tile-${x}-${y}`}
                    x={x * cellSize}
                    y={y * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="none"
                    stroke={colors.gridLine}
                    strokeWidth="0.3"
                    opacity={theme === 'light' ? '0.2' : '0.25'}
                  />
                ))
              )}
            </>
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
                      fill={corridorPatternFill}
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
              // Use appropriate texture based on room type and dungeon type
              const patternId = `room-texture-${room.type}`;
              let fillValue: string | undefined;
              const fillColor = getRoomColor(room.type, colors, theme);

              if (room.type === 'chamber') {
                fillValue = `url(#${chamberPatternId})`;
              } else if (room.type === 'corridor') {
                fillValue = corridorPatternFill;
              } else if (room.type === 'entry' || room.type === 'exit' || room.type === 'stairwell' || room.type === 'special') {
                fillValue = `url(#${patternId})`;
              }
              
              return (
                <g key={room.id}>
                  {/* Room floor with texture */}
                  <rect
                    x={room.x * cellSize}
                    y={room.y * cellSize}
                    width={room.width * cellSize}
                    height={room.height * cellSize}
                    fill={fillValue ?? fillColor}
                    stroke={colors.roomBorder}
                    strokeWidth={theme === 'light' ? '2.5' : '2'}
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
                      {room.id}
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
                  {renderRoomFeatures(room, cellSize)}
                </g>
              );
            })}
          </g>

          {/* Doors */}
          <g className="doors">
            {doors.map((door: Door) => (
              <g key={door.id}>
                <rect
                  x={door.x * cellSize - cellSize * 0.3}
                  y={door.y * cellSize - cellSize * 0.3}
                  width={cellSize * 0.6}
                  height={cellSize * 0.6}
                  fill={door.type === 'secret' ? colors.doorSecret : colors.door}
                  stroke={colors.roomBorder}
                  strokeWidth={door.type === 'secret' ? '2' : theme === 'light' ? '1.8' : '1.5'}
                  strokeDasharray={door.type === 'secret' ? '2,2' : 'none'}
                  className="pointer-events-none drop-shadow-sm"
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

function getRoomColor(roomType: Room['type'], colors: MapThemePalette, currentTheme: 'light' | 'dark'): string {
  switch (roomType) {
    case 'entry':
      return currentTheme === 'light' ? '#dcfce7' : '#166534'; // Light green / Dark green
    case 'exit':
      return currentTheme === 'light' ? '#fee2e2' : '#991b1b'; // Light red / Dark red
    case 'stairwell':
      return currentTheme === 'light' ? '#dbeafe' : '#1e3a8a'; // Light blue / Dark blue
    case 'special':
      return currentTheme === 'light' ? '#f3e8ff' : '#6b21a8'; // Light purple / Dark purple
    case 'chamber':
    case 'corridor':
    default:
      return colors.roomFloor;
  }
}

function renderRoomFeatures(room: Room, cellSize: number) {
  if (!room.features || room.features.length === 0) return null;
  const features = room.features.filter((feature) => feature.icon) as Array<RoomFeature & { icon: FeatureIconKey }>;
  if (features.length === 0) return null;
  const renderCount = Math.min(features.length, 3);
  const centerX = (room.x + room.width / 2) * cellSize;
  const centerY = (room.y + room.height / 2) * cellSize;

  return features.slice(0, renderCount).map((feature, idx) => {
    const icon = FEATURE_ICON_DEFS[feature.icon];
    if (!icon) return null;
    const offset = (idx - (renderCount - 1) / 2) * 14;
    const scale = Math.min(cellSize / 18, 1.15);
    return (
      <g
        key={`${room.id}-feature-${idx}`}
        transform={`translate(${centerX}, ${centerY + offset}) scale(${scale}) translate(-8, -8)`}
        className="pointer-events-none"
      >
        <path d={icon.path} fill={icon.fill} stroke={icon.stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  });
}
