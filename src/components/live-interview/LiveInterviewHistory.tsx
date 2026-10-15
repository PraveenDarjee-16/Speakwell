'use client';

import React, { useState, useEffect } from 'react';
import { 
  LiveInterviewEvaluation, 
  LiveInterviewCategory, 
  LiveInterviewPurpose 
} from '@/types';
import { 
  fetchLiveInterviewHistory, 
  deleteLiveInterview 
} from '@/lib/data/live-interview-service';
import { 
  CATEGORY_METADATA, 
  PURPOSE_METADATA 
} from '@/data/live-interview-topics';
import { 
  Clock, 
  Calendar, 
  Award, 
  ArrowLeft, 
  Trash2, 
  Eye, 
  Filter, 
  Search, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  RotateCcw 
} from 'lucide-react';

interface LiveInterviewHistoryProps {
  onSelectInterview: (interview: LiveInterviewEvaluation) => void;
  onNewInterview: () => void;
}

export const LiveInterviewHistory: React.FC<LiveInterviewHistoryProps> = ({
  onSelectInterview,
  onNewInterview
}) => {
  const [interviews, setInterviews] = useState<LiveInterviewEvaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLiveInterviewHistory();
      if (res.error) {
        setError(res.error);
      } else {
        setInterviews(res.interviews);
        setIsDemo(res.isDemo);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interview history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this live interview record?')) return;

    const res = await deleteLiveInterview(id);
    if (res.success) {
      setInterviews((prev) => prev.filter(i => i.id !== id));
    } else {
      alert(`Delete failed: ${res.error}`);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (score >= 70) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    if (score >= 55) return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
  };

  // Filtered interviews list
  const filtered = interviews.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedPurpose !== 'all' && item.purpose !== selectedPurpose) return false;
    if (item.overallScore < minScore) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTopic = item.topicTitle.toLowerCase().includes(q);
      const matchStrength = item.strengths.some(s => s.toLowerCase().includes(q));
      if (!matchTopic && !matchStrength) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <button
            onClick={onNewInterview}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Live Studio</span>
          </button>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Live AI Interview History
          </h1>
          <p className="text-xs text-zinc-400">
            Review your past live spoken interviews, scoring breakdowns, and conversational transcripts.
          </p>
        </div>

        <button
          onClick={onNewInterview}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadHistory} className="underline text-red-200 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="minimal-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic title or strength..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_METADATA).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_METADATA[cat as LiveInterviewCategory]?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose Filter */}
          <div>
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 outline-none focus:border-cyan-500"
            >
              <option value="all">All Purposes</option>
              {Object.keys(PURPOSE_METADATA).map((p) => (
                <option key={p} value={p}>
                  {PURPOSE_METADATA[p as LiveInterviewPurpose]?.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-xs font-mono text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Loading your live interview records...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="minimal-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-200">No Live Interviews Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {interviews.length === 0 
                ? "You haven't completed any live spoken AI interviews yet. Click below to launch your first session!" 
                : "No interview records matched your search filters."}
            </p>
          </div>
          {interviews.length === 0 ? (
            <button
              onClick={onNewInterview}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>Launch First Live Interview</span>
            </button>
          ) : (
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedPurpose('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Interview Cards List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectInterview(item)}
              className="minimal-card p-5 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.04] text-cyan-300">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{item.difficulty}</span>
                  <span>•</span>
                  <span className="capitalize">{item.personality.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-base font-medium text-zinc-100 group-hover:text-cyan-300 transition-colors">
                  {item.topicTitle}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-zinc-400">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-mono text-[11px] shrink-0 font-bold">Strength:</span>
                    <span className="line-clamp-1">{item.strengths[0] || 'Active participation'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-mono text-[11px] shrink-0 font-bold">Focus:</span>
                    <span className="line-clamp-1">{item.priorityImprovements[0] || 'Structure & examples'}</span>
                  </div>
                </div>
              </div>

              {/* Metrics & Actions */}
              <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06] w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-mono font-bold border ${getScoreBadge(item.overallScore)}`}>
                      {item.overallScore}/100
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 block mt-1">
                    {formatDuration(item.durationSeconds)} • {item.averageWpm} WPM
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Delete interview record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
