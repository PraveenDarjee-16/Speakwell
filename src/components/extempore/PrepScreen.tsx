'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Eye, 
  EyeOff, 
  Clock, 
  Lightbulb, 
  BookMarked, 
  MessageSquare, 
  Timer
} from 'lucide-react';
import { ExtemporeTopic } from '@/types';

interface PrepScreenProps {
  topic: ExtemporeTopic;
  onStartSpeaking: (config: {
    durationSeconds: number;
    prepSeconds: number;
    examMode: boolean;
  }) => void;
  onPickAnotherTopic: () => void;
}

export const PrepScreen: React.FC<PrepScreenProps> = ({
  topic,
  onStartSpeaking,
  onPickAnotherTopic,
}) => {
  // Settings
  const [selectedDuration, setSelectedDuration] = useState<number>(120); // 2 minutes default
  const [customMinutes, setCustomMinutes] = useState<string>('2');
  const [customSeconds, setCustomSeconds] = useState<string>('00');
  const [selectedPrepTime, setSelectedPrepTime] = useState<number>(30); // 30s prep default
  const [examMode, setExamMode] = useState<boolean>(false); // Hide hints toggle
  const [isPrepCountingDown, setIsPrepCountingDown] = useState<boolean>(false);
  const [prepTimeRemaining, setPrepTimeRemaining] = useState<number>(30);

  // Duration Options
  const durationOptions = [
    { label: '1m', seconds: 60 },
    { label: '1.5m', seconds: 90 },
    { label: '2m', seconds: 120 },
    { label: '3m', seconds: 180 },
    { label: 'Custom', seconds: -1 },
  ];

  // Prep Time Options
  const prepOptions = [
    { label: 'None', seconds: 0 },
    { label: '15s', seconds: 15 },
    { label: '30s', seconds: 30 },
    { label: '60s', seconds: 60 },
  ];

  // Effective duration calculation
  const getEffectiveDuration = (): number => {
    if (selectedDuration !== -1) return selectedDuration;
    const mins = Math.max(0, parseInt(customMinutes, 10) || 1);
    const secs = Math.max(0, Math.min(59, parseInt(customSeconds, 10) || 0));
    const total = mins * 60 + secs;
    return total > 10 ? total : 60;
  };

  // Handle Prep Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrepCountingDown && prepTimeRemaining > 0) {
      interval = setInterval(() => {
        setPrepTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isPrepCountingDown && prepTimeRemaining === 0) {
      setIsPrepCountingDown(false);
      onStartSpeaking({
        durationSeconds: getEffectiveDuration(),
        prepSeconds: selectedPrepTime,
        examMode,
      });
    }
    return () => clearInterval(interval);
  }, [isPrepCountingDown, prepTimeRemaining]);

  const handleStart = () => {
    if (selectedPrepTime > 0 && !isPrepCountingDown) {
      setPrepTimeRemaining(selectedPrepTime);
      setIsPrepCountingDown(true);
    } else {
      onStartSpeaking({
        durationSeconds: getEffectiveDuration(),
        prepSeconds: selectedPrepTime,
        examMode,
      });
    }
  };

  const handleCancelCountdown = () => {
    setIsPrepCountingDown(false);
    setPrepTimeRemaining(selectedPrepTime);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <button
          onClick={onPickAnotherTopic}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Topic</span>
        </button>

        <button
          onClick={() => setExamMode(!examMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
            examMode
              ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          {examMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span>{examMode ? 'Exam Mode' : 'Practice Mode'}</span>
        </button>
      </div>

      {/* Topic Card */}
      <div className="minimal-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <span className="uppercase">{topic.category}</span>
          <span>•</span>
          <span>{topic.difficulty}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight leading-snug">
          "{topic.title}"
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/[0.04] text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Context</span>
            <p className="text-zinc-400 leading-relaxed">{topic.background}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Relevance</span>
            <p className="text-zinc-400 leading-relaxed">{topic.whyItMatters}</p>
          </div>
        </div>
      </div>

      {/* Preparation Content */}
      {!examMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Talking Points */}
          <div className="minimal-card p-5 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
              <span>Key Talking Points</span>
            </div>
            <ul className="space-y-2">
              {topic.talkingPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-zinc-400 leading-relaxed">
                  <span className="text-zinc-600 font-mono text-[11px] mt-0.5">{index + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vocabulary */}
          <div className="minimal-card p-5 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <BookMarked className="w-3.5 h-3.5 text-zinc-400" />
              <span>Vocabulary Hints</span>
            </div>
            <div className="space-y-2">
              {topic.vocabulary.map((vocab, index) => (
                <div key={index} className="p-2 rounded bg-zinc-900 border border-white/[0.04]">
                  <span className="font-medium text-zinc-200">{vocab.word}</span>:
                  <span className="text-zinc-400 ml-1.5">{vocab.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl minimal-card text-center space-y-2">
          <p className="text-xs font-mono text-zinc-400">Exam Mode Active</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Hints are hidden to simulate competitive conditions.
          </p>
        </div>
      )}

      {/* Duration and Prep Settings */}
      <div className="minimal-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Duration */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase text-zinc-500 block">Duration</span>
            <div className="grid grid-cols-5 gap-1.5">
              {durationOptions.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setSelectedDuration(opt.seconds)}
                  className={`py-1.5 px-1 rounded-md text-center text-xs font-mono border transition-colors cursor-pointer ${
                    selectedDuration === opt.seconds
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prep Timer */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase text-zinc-500 block">Preparation</span>
            <div className="grid grid-cols-4 gap-1.5">
              {prepOptions.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setSelectedPrepTime(opt.seconds)}
                  className={`py-1.5 px-1 rounded-md text-center text-xs font-mono border transition-colors cursor-pointer ${
                    selectedPrepTime === opt.seconds
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Prep Countdown Banner */}
        {isPrepCountingDown && (
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-700 text-center space-y-2">
            <span className="text-[11px] font-mono uppercase text-zinc-500 block">Preparation Time</span>
            <div className="text-4xl font-semibold font-mono text-zinc-100">
              {prepTimeRemaining}s
            </div>
            <p className="text-xs text-zinc-400">Outline your main ideas. Studio opens when time expires.</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleCancelCountdown}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPrepCountingDown(false);
                  onStartSpeaking({
                    durationSeconds: getEffectiveDuration(),
                    prepSeconds: selectedPrepTime,
                    examMode,
                  });
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white"
              >
                Skip & Start
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isPrepCountingDown && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStart}
              className="px-5 py-2.5 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>{selectedPrepTime > 0 ? `Begin ${selectedPrepTime}s Prep` : 'Start Speech Studio'}</span>
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
