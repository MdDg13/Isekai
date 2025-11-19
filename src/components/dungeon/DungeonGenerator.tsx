"use client";

import { useMemo, useState } from 'react';
import type { DungeonGenerationParams } from '../../types/dungeon';
import { getDungeonTypeDefinition, type DungeonType } from '../../lib/dungeon-definitions';

interface DungeonGeneratorProps {
  worldId: string;
  onGenerate: (params: DungeonGenerationParams & { name?: string }) => Promise<void>;
  isGenerating?: boolean;
}

type SizeCategory = 'tiny' | 'very_small' | 'small' | 'medium' | 'large' | 'huge';

// Size category presets based on D&D best practices
// Room sizes in grid cells (1 cell = 5 feet)
// Room counts are target ranges for generation
const SIZE_PRESETS: Record<SizeCategory, {
  width: number;
  height: number;
  minRoomSize: number;
  maxRoomSize: number;
  targetRoomCount: { min: number; max: number };
  roomDensity: number;
}> = {
  tiny: { 
    width: 15, 
    height: 15, 
    minRoomSize: 2,  // 10ft minimum
    maxRoomSize: 4,  // 20ft maximum
    targetRoomCount: { min: 3, max: 5 },
    roomDensity: 0.4, // Higher density for small dungeons
  },
  very_small: { 
    width: 20, 
    height: 20, 
    minRoomSize: 2,  // 10ft minimum
    maxRoomSize: 5,  // 25ft maximum
    targetRoomCount: { min: 5, max: 8 },
    roomDensity: 0.35,
  },
  small: { 
    width: 30, 
    height: 30, 
    minRoomSize: 2,  // 10ft minimum
    maxRoomSize: 6,  // 30ft maximum
    targetRoomCount: { min: 8, max: 12 },
    roomDensity: 0.3,
  },
  medium: { 
    width: 50, 
    height: 50, 
    minRoomSize: 3,  // 15ft minimum
    maxRoomSize: 8,  // 40ft maximum
    targetRoomCount: { min: 12, max: 20 },
    roomDensity: 0.3,
  },
  large: { 
    width: 70, 
    height: 70, 
    minRoomSize: 3,  // 15ft minimum
    maxRoomSize: 10, // 50ft maximum
    targetRoomCount: { min: 20, max: 30 },
    roomDensity: 0.25,
  },
  huge: {
    width: 100,
    height: 100,
    minRoomSize: 4,
    maxRoomSize: 12,
    targetRoomCount: { min: 30, max: 50 },
    roomDensity: 0.2,
  },
};

const defaultFormState = {
  name: '',
  sizeCategory: 'medium' as SizeCategory,
  grid_width: SIZE_PRESETS.medium.width,
  grid_height: SIZE_PRESETS.medium.height,
  num_levels: 1,
  min_room_size: SIZE_PRESETS.medium.minRoomSize,
  max_room_size: SIZE_PRESETS.medium.maxRoomSize,
  theme: 'dungeon' as DungeonType,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'deadly',
  use_ai: true,
  tile_type: 'square' as 'square' | 'hex',
  room_density: SIZE_PRESETS.medium.roomDensity,
  corridor_density: 0.5,
};

type FormState = typeof defaultFormState;

interface GeneratorStatsProps {
  formData: FormState;
  sizePreset: (typeof SIZE_PRESETS)[SizeCategory];
  isGenerating: boolean;
}

export default function DungeonGenerator({
  worldId,
  onGenerate,
  isGenerating = false,
}: DungeonGeneratorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<FormState>(defaultFormState);

  // Update size when category changes
  const handleSizeCategoryChange = (category: SizeCategory) => {
    const preset = SIZE_PRESETS[category];
    setFormData({
      ...formData,
      sizeCategory: category,
      grid_width: preset.width,
      grid_height: preset.height,
      min_room_size: preset.minRoomSize,
      max_room_size: preset.maxRoomSize,
      room_density: preset.roomDensity,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const params: DungeonGenerationParams = {
      generation_mode: 'random',
      grid_width: formData.grid_width,
      grid_height: formData.grid_height,
      num_levels: formData.num_levels,
      min_room_size: formData.min_room_size,
      max_room_size: formData.max_room_size,
      theme: formData.theme,
      difficulty: formData.difficulty,
      use_ai: formData.use_ai,
      world_id: worldId,
      room_density: formData.room_density,
      extra_connections_ratio: formData.corridor_density,
      tile_type: formData.tile_type,
    };
    await onGenerate({ ...params, name: formData.name || undefined });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Generate Dungeon</h2>
        <p className="text-sm text-gray-400">
          Create a procedurally generated dungeon with rooms, corridors, and doors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Dungeon"
          />
        </div>

        {/* Minimal Mode - Essential Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Type/Theme */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Type
            </label>
            <div className="relative group">
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value as DungeonType })}
                className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dungeon">Dungeon</option>
                <option value="cave">Cave</option>
                <option value="ruin">Ruin</option>
                <option value="fortress">Fortress</option>
                <option value="tower">Tower</option>
                <option value="temple">Temple</option>
                <option value="lair">Lair</option>
              </select>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gray-900 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 pointer-events-none">
                <h4 className="text-sm font-semibold text-gray-100 mb-1">
                  {getDungeonTypeDefinition(formData.theme).name}
                </h4>
                <p className="text-xs text-gray-300 mb-2">
                  {getDungeonTypeDefinition(formData.theme).description}
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="font-medium text-gray-300">Generation:</p>
                  <p>{getDungeonTypeDefinition(formData.theme).generationNotes}</p>
                  <p className="font-medium text-gray-300 mt-2">Typical Features:</p>
                  <ul className="list-disc list-inside">
                    {getDungeonTypeDefinition(formData.theme).typicalFeatures.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          {/* Size Category */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Size
            </label>
            <select
              value={formData.sizeCategory}
              onChange={(e) => handleSizeCategoryChange(e.target.value as SizeCategory)}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tiny">Tiny (3-5 rooms, 10-20ft)</option>
              <option value="very_small">Very Small (5-8 rooms, 10-25ft)</option>
              <option value="small">Small (8-12 rooms, 10-30ft)</option>
              <option value="medium">Medium (12-20 rooms, 15-40ft)</option>
              <option value="large">Large (20-30 rooms, 15-50ft)</option>
              <option value="huge">Huge (30-50 rooms, 20-60ft)</option>
            </select>
          </div>

          {/* Number of Levels */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Levels
            </label>
            <select
              value={formData.num_levels}
              onChange={(e) => setFormData({ ...formData, num_levels: Number.parseInt(e.target.value, 10) })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        </div>

        {/* AI Enhancement & Advanced Toggle Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use_ai"
              checked={formData.use_ai}
              onChange={(e) => setFormData({ ...formData, use_ai: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="use_ai" className="text-xs text-gray-300">
              AI Enhancement
            </label>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span>Advanced</span>
            <span className={`transform transition-transform text-[10px] ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div className="space-y-3 p-3 bg-gray-800/50 border border-gray-700 rounded-md">
            {/* Grid Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Width: {formData.grid_width} ({formData.grid_width * 5}ft)
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formData.grid_width}
                  onChange={(e) => setFormData({ ...formData, grid_width: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>20</span>
                  <span>100</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Height: {formData.grid_height} ({formData.grid_height * 5}ft)
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formData.grid_height}
                  onChange={(e) => setFormData({ ...formData, grid_height: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>20</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Tile Type */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Tile Type
              </label>
              <select
                value={formData.tile_type}
                onChange={(e) => setFormData({ ...formData, tile_type: e.target.value as 'square' | 'hex' })}
                className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="square">Square (5ft × 5ft)</option>
                <option value="hex">Hexagonal (5ft)</option>
              </select>
            </div>

            {/* Room vs Corridor Density */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Room Density: {Math.round(formData.room_density * 100)}% (0.0-1.0)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={formData.room_density}
                  onChange={(e) => setFormData({ ...formData, room_density: Number.parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0.1</span>
                  <span>0.8</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Target: ~{SIZE_PRESETS[formData.sizeCategory].targetRoomCount.min}-{SIZE_PRESETS[formData.sizeCategory].targetRoomCount.max} rooms
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Corridor Density: {Math.round(formData.corridor_density * 100)}% (0.0-1.0)
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.corridor_density}
                  onChange={(e) => setFormData({ ...formData, corridor_density: Number.parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0.0</span>
                  <span>1.0</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Extra connections between rooms</p>
              </div>
            </div>

            {/* Room Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Min Room: {formData.min_room_size} ({formData.min_room_size * 5}ft)
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={formData.min_room_size}
                  onChange={(e) => setFormData({ ...formData, min_room_size: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Max Room: {formData.max_room_size} ({formData.max_room_size * 5}ft)
                </label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={formData.max_room_size}
                  onChange={(e) => setFormData({ ...formData, max_room_size: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>5</span>
                  <span>15</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status + Stats */}
        <GeneratorStats
          formData={formData}
          sizePreset={SIZE_PRESETS[formData.sizeCategory]}
          isGenerating={isGenerating}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isGenerating ? 'Generating...' : 'Generate Dungeon'}
        </button>
      </form>
    </div>
  );
}

function GeneratorStats({ formData, sizePreset, isGenerating }: GeneratorStatsProps) {
  const gridCells = formData.grid_width * formData.grid_height;
  const floorArea = gridCells * 25; // 5ft squares
  const estimatedRooms = sizePreset.targetRoomCount;

  const stats = useMemo(
    () => [
      { label: 'Grid Size', value: `${formData.grid_width} × ${formData.grid_height} (${gridCells} cells)` },
      { label: 'Footprint', value: `${floorArea.toLocaleString()} sq ft` },
      { label: 'Target Rooms', value: `${estimatedRooms.min}–${estimatedRooms.max}` },
      { label: 'Tile Type', value: formData.tile_type === 'square' ? '5 ft squares' : '5 ft hexes' },
    ],
    [formData.grid_width, formData.grid_height, formData.tile_type, gridCells, floorArea, estimatedRooms.min, estimatedRooms.max],
  );

  return (
    <div className="space-y-2 rounded-lg border border-gray-800/60 bg-gray-900/40 p-3">
      <div className="flex items-center justify-between text-sm text-gray-300">
        <span>Generation Stats</span>
        {isGenerating && <ProgressBar />}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded bg-gray-900/30 px-2 py-1.5">
            <dt className="text-[11px] uppercase tracking-wide text-gray-500">{stat.label}</dt>
            <dd className="text-gray-200">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="relative h-2 w-28 overflow-hidden rounded-full bg-gray-800">
      <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/90" />
    </div>
  );
}
