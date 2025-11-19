"use client";

import { useState } from 'react';
import type { DungeonGenerationParams } from '../../types/dungeon';

interface DungeonGeneratorProps {
  worldId: string;
  onGenerate: (params: DungeonGenerationParams & { name?: string }) => Promise<void>;
  isGenerating?: boolean;
}

type SizeCategory = 'small' | 'medium' | 'large' | 'huge';

const SIZE_PRESETS: Record<SizeCategory, { width: number; height: number; minRoom: number; maxRoom: number }> = {
  small: { width: 30, height: 30, minRoom: 2, maxRoom: 6 },
  medium: { width: 50, height: 50, minRoom: 2, maxRoom: 10 },
  large: { width: 70, height: 70, minRoom: 3, maxRoom: 12 },
  huge: { width: 100, height: 100, minRoom: 4, maxRoom: 15 },
};

export default function DungeonGenerator({
  worldId,
  onGenerate,
  isGenerating = false,
}: DungeonGeneratorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sizeCategory: 'medium' as SizeCategory,
    grid_width: 50,
    grid_height: 50,
    num_levels: 1,
    min_room_size: 2,
    max_room_size: 10,
    theme: 'dungeon',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'deadly',
    use_ai: true,
  });

  // Update size when category changes
  const handleSizeCategoryChange = (category: SizeCategory) => {
    const preset = SIZE_PRESETS[category];
    setFormData({
      ...formData,
      sizeCategory: category,
      grid_width: preset.width,
      grid_height: preset.height,
      min_room_size: preset.minRoom,
      max_room_size: preset.maxRoom,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Type/Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dungeon">Dungeon</option>
              <option value="cave">Cave</option>
              <option value="ruin">Ruin</option>
              <option value="fortress">Fortress</option>
              <option value="tower">Tower</option>
              <option value="temple">Temple</option>
              <option value="lair">Lair</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          {/* Size Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Size Category
            </label>
            <select
              value={formData.sizeCategory}
              onChange={(e) => handleSizeCategoryChange(e.target.value as SizeCategory)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small (30×30, ~15 rooms)</option>
              <option value="medium">Medium (50×50, ~25 rooms)</option>
              <option value="large">Large (70×70, ~40 rooms)</option>
              <option value="huge">Huge (100×100, ~60 rooms)</option>
            </select>
          </div>

          {/* Number of Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Levels: {formData.num_levels}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.num_levels}
              onChange={(e) => setFormData({ ...formData, num_levels: Number.parseInt(e.target.value, 10) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* AI Enhancement */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="use_ai"
            checked={formData.use_ai}
            onChange={(e) => setFormData({ ...formData, use_ai: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="use_ai" className="text-sm text-gray-300">
            Use AI enhancement (adds room descriptions and features)
          </label>
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 bg-gray-800 border border-gray-700 rounded-md transition-colors"
          >
            <span>Advanced Settings</span>
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-md">
            {/* Grid Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Width: {formData.grid_width} cells ({formData.grid_width * 5} ft)
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formData.grid_width}
                  onChange={(e) => setFormData({ ...formData, grid_width: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20</span>
                  <span>100</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Height: {formData.grid_height} cells ({formData.grid_height * 5} ft)
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formData.grid_height}
                  onChange={(e) => setFormData({ ...formData, grid_height: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Room Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Min Room Size: {formData.min_room_size} cells ({formData.min_room_size * 5} ft)
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={formData.min_room_size}
                  onChange={(e) => setFormData({ ...formData, min_room_size: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Max Room Size: {formData.max_room_size} cells ({formData.max_room_size * 5} ft)
                </label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={formData.max_room_size}
                  onChange={(e) => setFormData({ ...formData, max_room_size: Number.parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>15</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Dungeon'}
        </button>
      </form>
    </div>
  );
}
