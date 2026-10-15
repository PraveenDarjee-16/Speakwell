'use client';

import React, { useState } from 'react';
import { Dices, FastForward, Check, Shuffle } from 'lucide-react';
import { ExtemporeTopic } from '@/types';
import { EXTEMPORE_TOPICS } from '@/data/extempore-topics';

interface TopicRouletteProps {
  onTopicSelected: (topic: ExtemporeTopic) => void;
  selectedCategory: string;
  selectedDifficulty: string;
  attemptedTopicIds: string[];
}

export const TopicRoulette: React.FC<TopicRouletteProps> = ({
  onTopicSelected,
  selectedCategory,
  selectedDifficulty,
  attemptedTopicIds,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayTopic, setDisplayTopic] = useState<ExtemporeTopic>(EXTEMPORE_TOPICS[0]);
  const [spinCandidates, setSpinCandidates] = useState<ExtemporeTopic[]>([]);

  const getEligibleTopics = () => {
    return EXTEMPORE_TOPICS.filter((t) => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || t.difficulty === selectedDifficulty;
      return matchCat && matchDiff;
    });
  };

  const startSpin = () => {
    let pool = getEligibleTopics();
    const unattempted = pool.filter((t) => !attemptedTopicIds.includes(t.id));
    if (unattempted.length > 0) pool = unattempted;
    if (pool.length === 0) pool = EXTEMPORE_TOPICS;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSpinCandidates(shuffled);
    setIsSpinning(true);

    let current = 0;
    let speed = 40;
    const totalSteps = 18;
    const targetTopic = shuffled[Math.floor(Math.random() * shuffled.length)];

    const step = () => {
      current++;
      const nextIndex = current % shuffled.length;
      setDisplayTopic(shuffled[nextIndex]);

      if (current >= totalSteps) {
        setDisplayTopic(targetTopic);
        setIsSpinning(false);
        return;
      }

      speed = speed * 1.09;
      setTimeout(step, speed);
    };

    setTimeout(step, speed);
  };

  const skipSpin = () => {
    if (!isSpinning) return;
    setIsSpinning(false);
    const pool = spinCandidates.length > 0 ? spinCandidates : getEligibleTopics();
    const finalTopic = pool[Math.floor(Math.random() * pool.length)] || EXTEMPORE_TOPICS[0];
    setDisplayTopic(finalTopic);
  };

  const confirmTopic = () => {
    onTopicSelected(displayTopic);
  };

  return (
    <div className="w-full space-y-5 text-center">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-zinc-100 tracking-tight">
          Random Topic Selector
        </h3>
        <p className="text-xs text-zinc-400">
          Simulate surprise impromptu speaking conditions.
        </p>
      </div>

      {/* Card */}
      <div className="minimal-card p-6 min-h-[140px] flex flex-col justify-center items-center relative space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
          <span>{displayTopic.category}</span>
          <span>•</span>
          <span>{displayTopic.difficulty}</span>
        </div>

        <h4 className="text-base font-medium text-zinc-100 line-clamp-2 max-w-md">
          "{displayTopic.title}"
        </h4>
        <p className="text-xs text-zinc-400 line-clamp-2 max-w-md">
          {displayTopic.background}
        </p>

        {isSpinning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-300">Shuffling...</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-2.5">
        {!isSpinning ? (
          <>
            <button
              onClick={startSpin}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Spin Again</span>
            </button>

            <button
              onClick={confirmTopic}
              className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select Topic</span>
            </button>
          </>
        ) : (
          <button
            onClick={skipSpin}
            className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};
