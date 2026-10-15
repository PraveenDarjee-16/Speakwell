'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Trash2, 
  Check
} from 'lucide-react';
import { MistakeItem } from '@/types';
import { getDemoMistakes, updateDemoMistake, deleteDemoMistake } from '@/lib/supabase/demo-storage';

export default function MistakeNotebookPage() {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterReviewed, setFilterReviewed] = useState<'all' | 'unreviewed' | 'reviewed'>('all');

  useEffect(() => {
    setMistakes(getDemoMistakes());
  }, []);

  const handleToggleReviewed = (id: string, current: boolean) => {
    updateDemoMistake(id, { reviewed: !current });
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, reviewed: !current } : m))
    );
  };

  const handleToggleImproved = (id: string, current: boolean) => {
    updateDemoMistake(id, { improvedInSubsequentAttempt: !current });
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, improvedInSubsequentAttempt: !current } : m))
    );
  };

  const handleDelete = (id: string) => {
    deleteDemoMistake(id);
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  };

  const categories = [
    'All',
    'Subject-Verb Agreement',
    'Verb Tense',
    'Prepositions',
    'Articles',
    'Sentence Structure',
    'Vocabulary Misuse',
    'Filler Words',
  ];

  const filteredMistakes = mistakes.filter((m) => {
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchReview =
      filterReviewed === 'all'
        ? true
        : filterReviewed === 'reviewed'
        ? m.reviewed
        : !m.reviewed;
    return matchCat && matchReview;
  });

  const unreviewedCount = mistakes.filter((m) => !m.reviewed).length;
  const improvedCount = mistakes.filter((m) => m.improvedInSubsequentAttempt).length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
            Mistake Notebook
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review grammatical slips detected across your speeches and reinforce correct phrasing.
          </p>
        </div>

        {/* Minimal Stats */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            Unreviewed: <span className="text-zinc-200 font-medium">{unreviewedCount}</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            Improved: <span className="text-emerald-400 font-medium">{improvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="minimal-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div>
          <select
            value={filterReviewed}
            onChange={(e) => setFilterReviewed(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none text-xs"
          >
            <option value="all">All Mistakes</option>
            <option value="unreviewed">Unreviewed Only</option>
            <option value="reviewed">Reviewed Only</option>
          </select>
        </div>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="p-12 text-center minimal-card space-y-2">
          <CheckCircle2 className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-medium text-zinc-200">No Flagged Mistakes</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You currently have no unreviewed mistakes matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMistakes.map((item) => (
            <div
              key={item.id}
              className={`minimal-card p-5 space-y-3 transition-opacity ${
                item.reviewed ? 'opacity-70' : 'opacity-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-zinc-400 font-medium">{item.category}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-600">{new Date(item.occurredAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleImproved(item.id, !!item.improvedInSubsequentAttempt)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 border ${
                      item.improvedInSubsequentAttempt
                        ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{item.improvedInSubsequentAttempt ? 'Improved' : 'Mark Improved'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReviewed(item.id, item.reviewed)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                      item.reviewed
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {item.reviewed ? 'Reviewed' : 'Review'}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Side-by-side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-red-500/10 space-y-1">
                  <span className="text-[10px] text-red-400 font-mono uppercase block">Original Spoken:</span>
                  <p className="text-zinc-300 leading-relaxed font-sans">
                    "{item.originalSentence}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-emerald-500/15 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase block">Standard Form:</span>
                  <p className="text-zinc-200 leading-relaxed font-sans">
                    "{item.correctedSentence}"
                  </p>
                </div>
              </div>

              {/* Rule Explanation */}
              <div className="text-xs text-zinc-400 leading-relaxed pt-1">
                <span className="text-zinc-500 font-mono text-[11px] block mb-0.5">Note:</span>
                {item.ruleExplanation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
