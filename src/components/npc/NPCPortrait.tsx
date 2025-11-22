"use client";

import React, { useState } from 'react';

interface NPCPortraitProps {
  imageUrl: string | null;
  npcName: string;
  onRegenerate?: () => Promise<void>;
  size?: 'small' | 'medium' | 'large';
  showRegenerate?: boolean;
  isRegenerating?: boolean;
}

export default function NPCPortrait({
  imageUrl,
  npcName,
  onRegenerate,
  size = 'large',
  showRegenerate = false,
  isRegenerating = false,
}: NPCPortraitProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-full aspect-[3/4] max-w-md',
  };

  const handleRegenerate = () => {
    if (!onRegenerate) return;
    setShowConfirm(true);
  };

  const confirmRegenerate = async () => {
    if (!onRegenerate) return;
    setShowConfirm(false);
    try {
      await onRegenerate();
    } catch {
      // Error handling is done by parent component via toast
    }
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={npcName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-gray-500 text-xs text-center px-2">No portrait</p>
          </div>
        )}
      </div>
      
      {showRegenerate && (
        <div className="mt-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Portrait'}
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Regenerate Portrait?</h3>
            <p className="text-sm text-gray-300 mb-4">
              This will replace the current portrait with a new AI-generated image. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRegenerate}
                disabled={isRegenerating}
                className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRegenerating ? 'Regenerating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

