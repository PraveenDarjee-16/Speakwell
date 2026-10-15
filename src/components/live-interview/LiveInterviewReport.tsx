'use client';

import React, { useState } from 'react';
import { 
  LiveInterviewEvaluation, 
  ConversationTurn,
  CriterionScore 
} from '@/types';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  ArrowLeft, 
  Check, 
  Zap, 
  Info,
  ShieldCheck,
  HelpCircle,
  FileText
} from 'lucide-react';

interface LiveInterviewReportProps {
  evaluation: LiveInterviewEvaluation;
  onRestart: () => void;
  onViewHistory: () => void;
}

export const LiveInterviewReport: React.FC<LiveInterviewReportProps> = ({
  evaluation,
  onRestart,
  onViewHistory
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'criteria' | 'questions' | 'grammar' | 'transcript'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    if (score >= 70) return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
    if (score >= 55) return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Live Interview</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onViewHistory}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            All Saved Sessions
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-950" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>

      {/* Hero Scorecard */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              <span>{evaluation.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{evaluation.difficulty}</span>
              <span>•</span>
              <span className="capitalize">{evaluation.personality.replace('_', ' ')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              {evaluation.topicTitle}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              {evaluation.summary}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-zinc-900/80 border border-white/[0.06] backdrop-blur-md shrink-0">
            <div className="text-center">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">Overall Score</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-mono font-bold text-zinc-100">
                  {evaluation.overallScore}
                </span>
                <span className="text-xs text-zinc-500 font-mono">/100</span>
              </div>
            </div>

            <div className="h-12 w-px bg-white/[0.08]" />

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Duration</span>
                <span className="text-zinc-200">{formatDuration(evaluation.durationSeconds)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Cadence</span>
                <span className="text-zinc-200">{evaluation.averageWpm} WPM</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Turns</span>
                <span className="text-zinc-200">{evaluation.userTurns} answered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Speech Notice */}
      {evaluation.totalUserWords < 15 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3.5 text-xs text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200 text-sm">
              {evaluation.totalUserWords === 0 ? 'No Speech Detected (Score: 0/100)' : `Insufficient Speech Volume (${evaluation.totalUserWords} words)`}
            </h4>
            <p className="text-rose-300 leading-relaxed">
              {evaluation.totalUserWords === 0
                ? 'You remained silent or completed the interview without speaking answers into the microphone. A conversational interview requires active speaking to evaluate fluency, vocabulary, and grammar.'
                : 'You spoke fewer than 15 words across the entire session. In genuine interviews, single-word or fragmented replies result in an incomplete score. Aim to speak at least 3-4 full sentences with concrete examples for each question.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Highlights' },
          { id: 'criteria', label: '8 Competency Rubrics' },
          { id: 'questions', label: 'Turn-by-Turn Feedback' },
          { id: 'grammar', label: `Grammar & Vocabulary (${evaluation.grammarCorrections.length})` },
          { id: 'transcript', label: 'Full Dialogue Transcript' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Highlights */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Strengths & Priority Improvements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="minimal-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  What You Did Well
                </h3>
              </div>
              <ul className="space-y-2.5">
                {evaluation.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top 3 Priority Areas to Improve */}
            <div className="minimal-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Top 3 Priority Focus Areas
                </h3>
              </div>
              <div className="space-y-2.5">
                {evaluation.priorityImprovements.map((imp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04] flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-zinc-300 leading-relaxed">{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filler Words & Pacing Metrics */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Fluency & Filler Word Analysis
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Filler Ratio: <span className="text-zinc-200 font-semibold">{evaluation.fillerWordPercentage}%</span>
              </span>
            </div>

            {evaluation.fillerWords.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {evaluation.fillerWords.map((fw, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-900/70 border border-white/[0.04] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">"{fw.word}"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono font-semibold">
                      {fw.count}x
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400">
                No repeated filler words detected! Clean speech cadence.
              </p>
            )}
          </div>

          {/* Practice Recommendations */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Recommended Action Plan
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {evaluation.practiceRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.04] space-y-2">
                  <span className="text-[11px] font-mono text-cyan-400 block font-semibold">Exercise {idx + 1}</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 8 Competency Rubrics */}
      {activeTab === 'criteria' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/[0.06] text-xs text-zinc-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              All 8 core competencies are independently evaluated. Notice: Metrics without dedicated acoustic sensors (e.g. Pronunciation and Delivery) are transparently labeled as text and pacing proxies rather than claiming fake acoustic telemetry.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.criteria.map((c, idx) => (
              <div key={idx} className="minimal-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100">{c.criterion}</h4>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Weight: {c.weight}% • Status: {c.status}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-mono font-bold border ${getScoreColor(c.score)}`}>
                    {c.score}/100
                  </span>
                </div>

                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${c.score}%` }} 
                    className="h-full bg-cyan-400 transition-all duration-300" 
                  />
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  {c.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Turn-by-Turn Question Relevance */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/[0.06] text-xs text-zinc-400 flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Detailed turn-by-turn analysis reviewing whether your responses directly addressed the interviewer’s specific question, with a demonstration model answer for comparison.
            </span>
          </div>

          <div className="space-y-4">
            {evaluation.turnFeedback.map((turn, idx) => (
              <div key={idx} className="minimal-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-semibold text-zinc-400">
                    Question Turn {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${turn.isDirectlyAddressed ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'}`}>
                      {turn.isDirectlyAddressed ? 'Directly Addressed' : 'Partially Addressed'}
                    </span>
                    <span className="font-mono text-xs text-zinc-200 font-semibold">{turn.score}/100</span>
                  </div>
                </div>

                {/* AI Question */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">Interviewer Prompt</span>
                  <p className="text-xs text-zinc-200 font-medium bg-zinc-900/80 p-3 rounded-lg border border-white/[0.04]">
                    "{turn.question}"
                  </p>
                </div>

                {/* Candidate Answer */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Your Spoken Answer</span>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-white/[0.04] leading-relaxed">
                    "{turn.answer}"
                  </p>
                </div>

                {/* Evaluator Notes */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Evaluator Feedback</span>
                  <p className="text-zinc-400">{turn.notes}</p>
                </div>

                {/* Model Improved Answer */}
                {turn.improvedAnswer && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Polished Professional Phrasing (Same Meaning)</span>
                    </span>
                    <p className="text-xs text-zinc-300 italic bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30 leading-relaxed">
                      "{turn.improvedAnswer}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Grammar & Vocabulary */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          {/* Grammar Mistakes Section */}
          <div className="minimal-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Grammar Corrections ({evaluation.grammarCorrections.length})
            </h3>

            {evaluation.grammarCorrections.length > 0 ? (
              <div className="space-y-3">
                {evaluation.grammarCorrections.map((corr, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-900/70 border border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{corr.category}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40 text-xs">
                        <span className="text-[10px] font-mono text-red-400 block uppercase">Original</span>
                        <span className="text-red-200 line-through">{corr.original}</span>
                      </div>
                      <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-xs">
                        <span className="text-[10px] font-mono text-emerald-400 block uppercase">Correction</span>
                        <span className="text-emerald-200 font-medium">{corr.corrected}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 pt-1 leading-relaxed">{corr.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400">
                Zero grammar errors identified! Your sentence construction was sound.
              </p>
            )}
          </div>

          {/* Vocabulary Upgrades */}
          <div className="minimal-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Vocabulary Upgrades & Alternatives
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evaluation.vocabularyUpgrades.map((voc, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.04] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-mono">Basic word:</span>
                    <span className="text-zinc-200 font-semibold">{voc.originalWord}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">Elevated Alternatives:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {voc.suggestedAlternatives.map((alt, aIdx) => (
                        <span key={aIdx} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-200 text-xs">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[11px] pt-1 italic">{voc.contextSentence}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Full Dialogue Transcript */}
      {activeTab === 'transcript' && (
        <div className="minimal-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Complete Conversation Log
            </h3>
            <span className="text-xs font-mono text-zinc-500">{evaluation.turns.length} Total Exchanges</span>
          </div>

          <div className="space-y-4">
            {evaluation.turns.map((turn, idx) => {
              const isAi = turn.speaker === 'ai';
              return (
                <div key={idx} className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                  isAi
                    ? 'bg-zinc-900/80 border-white/[0.06] text-zinc-200'
                    : 'bg-indigo-950/30 border-indigo-900/40 text-indigo-100'
                }`}>
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.04] text-[10px] font-mono text-zinc-400">
                    <span className="font-semibold text-zinc-300">{isAi ? 'AI Interviewer' : 'Candidate'}</span>
                    <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
