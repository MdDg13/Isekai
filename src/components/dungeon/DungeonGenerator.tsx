"use client";

import { useState } from 'react';
import type { DungeonGenerationParams } from '../../types/dungeon';

interface DungeonGeneratorProps {
  worldId: string;
  onGenerate: (params: DungeonGenerationParams & { name?: string }) => Promise<void>;
  isGenerating?: boolean;
}

export default function DungeonGenerator({
  worldId,
  onGenerate,
  isGenerating = false,
}: DungeonGeneratorProps) {
  const [formData, setFormData] = useState({
    name: '',
    grid_width: 50,
    grid_height: 50,
    num_levels: 1,
    min_room_size: 2,
    max_room_size: 10,
    theme: 'dungeon',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'deadly',
    use_ai: true,
  });

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
    <div className="space-y-6">
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
          </div>
        </div>

        {/* Levels */}
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
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Theme
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

