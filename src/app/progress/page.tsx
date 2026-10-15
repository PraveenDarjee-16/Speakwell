'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trash2, 
  ArrowRight,
  Eye,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { EvaluationResult } from '@/types';
import { fetchUserSessionsAndStats, deletePracticeSession } from '@/lib/data/sessions-service';
import { formatDuration } from '@/lib/speech/metrics';

export default function ProgressPage() {
  const [sessions, setSessions] = useState<EvaluationResult[]>([]);
  const [selectedSession, setSelectedSession] = useState<EvaluationResult | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchUserSessionsAndStats();
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSessions(res.sessions);
        setIsDemo(res.isDemo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load progress data.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDeleteSession = async (id: string) => {
    await deletePracticeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchActivity = activityFilter === 'all' || s.sessionType === activityFilter;
    const matchScore = s.overallScore >= minScoreFilter;
    return matchActivity && matchScore;
  });

  const chartData = [...filteredSessions].reverse().map((s, idx) => ({
    name: `S${idx + 1}`,
    score: s.overallScore,
    duration: Math.round(s.durationSeconds / 60 * 10) / 10,
    wpm: s.wordsPerMinute,
    title: s.topicTitle,
    date: new Date(s.createdAt).toLocaleDateString(),
  }));

  const avgCriterionScores: Record<string, number> = {
    Fluency: 0,
    Grammar: 0,
    Vocabulary: 0,
    Clarity: 0,
    Organization: 0,
  };

  let hasCriterionData = false;

  if (sessions.length > 0) {
    const sums: Record<string, number> = { Fluency: 0, Grammar: 0, Vocabulary: 0, Clarity: 0, Organization: 0 };
    const counts: Record<string, number> = { Fluency: 0, Grammar: 0, Vocabulary: 0, Clarity: 0, Organization: 0 };

    sessions.forEach((s) => {
      s.criteria?.forEach((c) => {
        if (sums[c.criterion] !== undefined) {
          sums[c.criterion] += c.score;
          counts[c.criterion] += 1;
        }
      });
    });

    Object.keys(sums).forEach((crit) => {
      if (counts[crit] > 0) {
        avgCriterionScores[crit] = Math.round(sums[crit] / counts[crit]);
        hasCriterionData = true;
      }
    });
  }

  const criterionBarData = Object.entries(avgCriterionScores).map(([name, score]) => ({
    criterion: name,
    score,
  }));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
              Progress & History
            </h1>
            {isDemo && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track speech scores, speaking pace, and criterion milestones over time.
          </p>
        </div>

        <Link
          href="/extempore"
          className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span>Practice Speech</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Database Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-red-200">Unable to load practice history</p>
              <p className="text-red-400">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={loadSessions}
            className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="minimal-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono">Module:</span>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">All Modules</option>
            <option value="extempore">Extempore</option>
            <option value="interview">Mock Interview</option>
            <option value="conversation">Conversation</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono">Min Score:</span>
          <select
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(parseInt(e.target.value, 10))}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
          >
            <option value={0}>All Scores (0+)</option>
            <option value={70}>70+ (Proficient)</option>
            <option value={80}>80+ (Strong)</option>
            <option value={85}>85+ (Exceptional)</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-200">Score Progression</span>
            <span className="font-mono text-zinc-500">Scale: 50-100</span>
          </div>

          <div className="h-56 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[50, 100]} stroke="#71717a" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#fafafa" strokeWidth={2} dot={{ fill: '#fafafa', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No session data yet.
              </div>
            )}
          </div>
        </div>

        {/* Criteria Strengths Bar Chart */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-200">Criterion Breakdown</span>
            <span className="font-mono text-zinc-500">Average Scores</span>
          </div>

          <div className="h-56 w-full">
            {hasCriterionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={criterionBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="criterion" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="score" fill="#71717a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No criterion data evaluated yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session History Table */}
      <div className="minimal-card p-5 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-200">Session History</span>
          <span className="font-mono text-zinc-500">{filteredSessions.length} recorded</span>
        </div>

        {filteredSessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No sessions found.</p>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredSessions.map((s) => (
              <div key={s.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{s.sessionType}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500 font-mono">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-medium text-zinc-200">"{s.topicTitle}"</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {formatDuration(s.durationSeconds)} • {s.wordsPerMinute} WPM • {s.fillerWordPercentage}% Fillers
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium font-mono text-zinc-200">
                    {s.overallScore}/100
                  </span>

                  <button
                    onClick={() => setSelectedSession(s)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Session Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl minimal-card p-6 bg-zinc-950 border border-zinc-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">{selectedSession.sessionType}</span>
                <h3 className="text-base font-medium text-zinc-100">{selectedSession.topicTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Transcript</span>
              <p className="text-zinc-300 leading-relaxed bg-zinc-900 p-3 rounded-lg border border-white/[0.04]">
                "{selectedSession.transcript}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {selectedSession.criteria?.map((c, idx) => (
                <div key={idx} className="p-2.5 rounded bg-zinc-900/60 border border-white/[0.04] flex items-center justify-between">
                  <span className="text-zinc-400">{c.criterion}</span>
                  <span className="font-mono text-zinc-200">{c.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
