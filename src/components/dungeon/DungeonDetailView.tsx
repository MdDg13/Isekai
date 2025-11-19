"use client";

import { useMemo, useState } from 'react';
import DungeonMapView from './DungeonMapView';
import type { DungeonDetail, Room, DungeonLevel, Door } from '../../types/dungeon';

interface DungeonDetailViewProps {
  dungeon: DungeonDetail;
  onRoomClick?: (room: Room) => void;
  compact?: boolean;
  showControls?: boolean;
}

export default function DungeonDetailView({
  dungeon,
  onRoomClick,
  compact = false,
  showControls = true,
}: DungeonDetailViewProps) {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const currentLevel = dungeon.structure.levels[selectedLevelIndex];

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    onRoomClick?.(room);
  };

  const mapCellSize = useMemo(() => {
    const maxDimension = Math.max(currentLevel.grid.width, currentLevel.grid.height);
    if (!compact) {
      return 24;
    }
    if (maxDimension === 0) {
      return 16;
    }
    const targetPixels = 520;
    return Math.max(12, Math.min(32, Math.floor(targetPixels / maxDimension)));
  }, [compact, currentLevel.grid.width, currentLevel.grid.height]);

  return (
    <div className={`space-y-4 ${compact ? 'space-y-2' : ''}`}>
      <div className="flex items-center justify-between">
        {!compact ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{dungeon.identity.name}</h2>
            <p className="text-sm text-gray-400">
              {dungeon.identity.type} • {dungeon.identity.theme} • {dungeon.identity.difficulty}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase text-gray-500">Preview</p>
            <p className="text-sm font-semibold text-gray-100">{dungeon.identity.name}</p>
          </div>
        )}
        {showControls && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4"
              />
              Grid
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4"
              />
              Labels
            </label>
          </div>
        )}
      </div>

      {dungeon.structure.levels.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {dungeon.structure.levels.map((level: DungeonLevel, idx: number) => (
            <button
              key={level.level_index}
              onClick={() => {
                setSelectedLevelIndex(idx);
                setSelectedRoom(null);
              }}
              className={`rounded-md border px-3 py-1 ${
                selectedLevelIndex === idx
                  ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                  : 'border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-500'
              }`}
            >
              {compact ? `L${level.level_index}` : `${level.name}`}
            </button>
          ))}
        </div>
      )}

      {/* Map and Details */}
      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-3'} gap-4`}>
        {/* Map */}
        <div className={compact ? '' : 'lg:col-span-2'}>
          <DungeonMapView
            level={currentLevel}
            cellSize={mapCellSize}
            showGrid={showGrid}
            showLabels={showLabels}
            interactive={!compact}
            onRoomClick={handleRoomClick}
            dungeonType={dungeon.identity.theme as 'dungeon' | 'cave' | 'ruin' | 'fortress' | 'tower' | 'temple' | 'lair'}
          />
        </div>

        {/* Room List / Details */}
        {!compact && (
          <div className="space-y-4">
          {selectedRoom ? (
            <div className="surface-panel surface-bordered p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {selectedRoom.id}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  <span className="text-gray-200">{selectedRoom.type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>{' '}
                  <span className="text-gray-200">
                    {selectedRoom.width} × {selectedRoom.height} cells
                    ({selectedRoom.width * 5} × {selectedRoom.height * 5} ft)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Position:</span>{' '}
                  <span className="text-gray-200">
                    ({selectedRoom.x}, {selectedRoom.y})
                  </span>
                </div>
                {selectedRoom.description && (
                  <div>
                    <span className="text-gray-400">Description:</span>
                    <p className="text-gray-200 mt-1">{selectedRoom.description}</p>
                  </div>
                )}
                {selectedRoom.doors.length > 0 && (
                  <div>
                    <span className="text-gray-400">Doors:</span>
                    <ul className="list-disc list-inside text-gray-200 mt-1">
                      {selectedRoom.doors.map((door: Door) => (
                        <li key={door.id}>
                          {door.type} ({door.state})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedRoom.connections.length > 0 && (
                  <div>
                    <span className="text-gray-400">Connections:</span>
                    <p className="text-gray-200 mt-1">
                      {selectedRoom.connections.length} connected room(s)
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="surface-panel surface-bordered p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Rooms ({currentLevel.rooms.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentLevel.rooms.map((room: Room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className="w-full text-left p-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-sm text-gray-200">{room.id}</div>
                    <div className="text-xs text-gray-400">
                      {room.type} • {room.width}×{room.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

            {/* Level Stats */}
            <div className="surface-panel surface-bordered p-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-2">Level Stats</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Rooms: {currentLevel.rooms.length}</div>
                <div>Corridors: {currentLevel.corridors.length}</div>
                <div>
                  Doors:{' '}
                  {currentLevel.rooms.reduce((sum: number, r: Room) => sum + r.doors.length, 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

