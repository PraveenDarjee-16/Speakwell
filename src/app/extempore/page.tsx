'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  Bookmark, 
  Search, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ExtemporeTopic, EvaluationResult } from '@/types';
import { EXTEMPORE_TOPICS, EXTEMPORE_CATEGORIES } from '@/data/extempore-topics';
import { TopicRoulette } from '@/components/extempore/TopicRoulette';
import { PrepScreen } from '@/components/extempore/PrepScreen';
import { SpeakingStudio } from '@/components/extempore/SpeakingStudio';
import { EvaluationReport } from '@/components/extempore/EvaluationReport';
import { fetchUserSessionsAndStats } from '@/lib/data/sessions-service';

type ExtemporeStep = 'browse' | 'prep' | 'speaking' | 'evaluation';

export default function ExtemporePage() {
  const [currentStep, setCurrentStep] = useState<ExtemporeStep>('browse');
  const [selectedTopic, setSelectedTopic] = useState<ExtemporeTopic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRouletteModal, setShowRouletteModal] = useState<boolean>(false);
  const [excludeAttempted, setExcludeAttempted] = useState<boolean>(false);
  const [attemptedTopicIds, setAttemptedTopicIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Studio configuration
  const [studioConfig, setStudioConfig] = useState<{
    durationSeconds: number;
    prepSeconds: number;
    examMode: boolean;
  }>({
    durationSeconds: 120,
    prepSeconds: 30,
    examMode: false,
  });

  // Current Evaluation Result
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Load attempted topics from user session history
  useEffect(() => {
    let isMounted = true;
    fetchUserSessionsAndStats().then((res) => {
      if (isMounted && res.sessions) {
        const ids = res.sessions.map((s) => s.topicId).filter(Boolean) as string[];
        setAttemptedTopicIds(ids);
      }
    }).catch(() => {});

    try {
      const storedBookmarks = localStorage.getItem('speakwell_bookmarks');
      if (storedBookmarks) {
        setBookmarkedIds(JSON.parse(storedBookmarks));
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter((b) => b !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    try {
      localStorage.setItem('speakwell_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  // Filter topics
  const filteredTopics = EXTEMPORE_TOPICS.filter((topic) => {
    const matchCategory = selectedCategory === 'All' || topic.category === selectedCategory;
    const matchDifficulty = selectedDifficulty === 'All' || topic.difficulty === selectedDifficulty;
    const matchSearch =
      searchQuery.trim() === '' ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.background.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAttempted = !excludeAttempted || !attemptedTopicIds.includes(topic.id);
    return matchCategory && matchDifficulty && matchSearch && matchAttempted;
  });

  const handleSelectTopic = (topic: ExtemporeTopic) => {
    setSelectedTopic(topic);
    setCurrentStep('prep');
    setShowRouletteModal(false);
  };

  const handleStartSpeaking = (config: {
    durationSeconds: number;
    prepSeconds: number;
    examMode: boolean;
  }) => {
    setStudioConfig(config);
    setCurrentStep('speaking');
  };

  const handleEvaluationComplete = (result: EvaluationResult) => {
    setEvaluationResult(result);
    setCurrentStep('evaluation');
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Step: Browse and Topic Selection */}
      {currentStep === 'browse' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
                Extempore Studio
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Choose a topic, take thirty seconds to outline, and record your spontaneous speech.
              </p>
            </div>

            <button
              onClick={() => setShowRouletteModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <Dices className="w-3.5 h-3.5 text-zinc-950" />
              <span>Random Topic</span>
            </button>
          </div>

          {/* Topic Roulette Modal */}
          {showRouletteModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xl relative minimal-card p-6 bg-zinc-950 border border-zinc-800">
                <TopicRoulette
                  selectedCategory={selectedCategory}
                  selectedDifficulty={selectedDifficulty}
                  attemptedTopicIds={attemptedTopicIds}
                  onTopicSelected={handleSelectTopic}
                />
                <button
                  onClick={() => setShowRouletteModal(false)}
                  className="absolute top-4 right-4 text-xs font-medium text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Minimal Filter Bar */}
          <div className="minimal-card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search topics (e.g. AI, Climate, College)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="All">All Categories (15)</option>
                  {EXTEMPORE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/[0.04] text-[11px] text-zinc-500">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeAttempted}
                  onChange={(e) => setExcludeAttempted(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-0 cursor-pointer"
                />
                <span>Exclude attempted ({attemptedTopicIds.length} done)</span>
              </label>

              <span>Showing {filteredTopics.length} of {EXTEMPORE_TOPICS.length} topics</span>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => {
              const isAttempted = attemptedTopicIds.includes(topic.id);
              const isBookmarked = bookmarkedIds.includes(topic.id);

              return (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className="minimal-card p-5 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500 uppercase tracking-wider">
                        {topic.category}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">
                          {topic.difficulty}
                        </span>

                        <button
                          onClick={(e) => toggleBookmark(topic.id, e)}
                          className="text-zinc-600 hover:text-zinc-300 p-0.5 transition-colors"
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-zinc-300 text-zinc-300' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                      {topic.title}
                    </h2>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {topic.background}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
                    {isAttempted ? (
                      <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Practiced</span>
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">New</span>
                    )}

                    <span className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-white transition-colors">
                      <span>Prepare</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Preparation Screen */}
      {currentStep === 'prep' && selectedTopic && (
        <PrepScreen
          topic={selectedTopic}
          onStartSpeaking={handleStartSpeaking}
          onPickAnotherTopic={() => setCurrentStep('browse')}
        />
      )}

      {/* Step: Live Speaking Studio */}
      {currentStep === 'speaking' && selectedTopic && (
        <SpeakingStudio
          topic={selectedTopic}
          durationSeconds={studioConfig.durationSeconds}
          examMode={studioConfig.examMode}
          onEvaluationComplete={handleEvaluationComplete}
          onCancel={() => setCurrentStep('prep')}
        />
      )}

      {/* Step: Evaluation Results */}
      {currentStep === 'evaluation' && evaluationResult && (
        <EvaluationReport
          result={evaluationResult}
          onPracticeAgain={() => setCurrentStep('speaking')}
          onTryAnotherTopic={() => {
            setSelectedTopic(null);
            setEvaluationResult(null);
            setCurrentStep('browse');
          }}
        />
      )}
    </div>
  );
}
