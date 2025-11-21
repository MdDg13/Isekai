"use client";

import { useState } from 'react';
import type { DungeonLevel } from '../../types/dungeon';
import DungeonMapViewFallback from './DungeonMapViewFallback';

interface DungeonMapImageViewProps {
  level: DungeonLevel;
  dungeonType?: string;
  showControls?: boolean;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
}

/**
 * Displays AI-generated dungeon map image with fallback to procedural SVG
 */
export default function DungeonMapImageView({
  level,
  dungeonType = 'dungeon',
  showControls = true,
  onSvgReady,
}: DungeonMapImageViewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // If no AI-generated image, use fallback
  if (!level.map_image_url || imageError) {
    return (
      <DungeonMapViewFallback
        level={level}
        dungeonType={dungeonType}
        showControls={showControls}
        onSvgReady={onSvgReady}
      />
    );
  }

  return (
    <div className="w-full space-y-2">
      {showControls && (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <span>AI-Generated Map</span>
          <button
            onClick={() => setImageError(true)}
            className="text-gray-500 hover:text-gray-300 underline text-xs"
          >
            Show procedural view
          </button>
        </div>
      )}
      <div className="w-full overflow-hidden rounded-lg border border-gray-700 bg-white">
        {imageLoading && (
          <div className="flex items-center justify-center min-h-[360px] bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={level.map_image_url}
          alt={`Dungeon map - ${level.name}`}
          className={`w-full h-auto ${imageLoading ? 'hidden' : 'block'}`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}

