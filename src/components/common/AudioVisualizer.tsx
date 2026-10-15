'use client';

import React from 'react';

interface AudioVisualizerProps {
  volume: number; // 0 to 100
  isRecording: boolean;
  isPaused?: boolean;
  barsCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  volume,
  isRecording,
  isPaused = false,
  barsCount = 28,
}) => {
  // Generate bar heights based on current audio volume
  const bars = Array.from({ length: barsCount }, (_, index) => {
    if (!isRecording || isPaused) {
      return 15; // idle minimum height
    }

    // Bell-curve center weighting + pseudo-random jitter scaled by live volume
    const distanceFromCenter = Math.abs(index - barsCount / 2) / (barsCount / 2);
    const centerFactor = 1 - Math.min(0.7, distanceFromCenter * 0.7);
    const randomized = Math.sin(index * 1.5 + Date.now() / 200) * 15;
    const computedHeight = Math.max(12, Math.min(100, (volume * 1.2 * centerFactor) + randomized));

    return computedHeight;
  });

  return (
    <div className="w-full flex items-center justify-center gap-1 sm:gap-1.5 h-16 px-4 py-2 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
      {bars.map((height, i) => {
        const isCenter = Math.abs(i - barsCount / 2) < barsCount / 4;
        return (
          <div
            key={i}
            style={{
              height: `${height}%`,
              transition: isRecording && !isPaused ? 'height 0.08s ease-in-out' : 'height 0.3s ease-out',
            }}
            className={`w-1 sm:w-1.5 rounded-full transition-all ${
              !isRecording
                ? 'bg-zinc-800'
                : isPaused
                ? 'bg-zinc-600'
                : isCenter
                ? 'bg-zinc-200'
                : 'bg-zinc-500'
            }`}
          />
        );
      })}
    </div>
  );
};
