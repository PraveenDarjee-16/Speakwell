'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Clock, 
  Trophy, 
  Mic, 
  BookOpen, 
  Briefcase, 
  Compass, 
  AlertCircle, 
  ArrowRight, 
  Volume2, 
  ChevronRight,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  Bot
} from 'lucide-react';
import { UserProfile, EvaluationResult } from '@/types';
import { fetchUserSessionsAndStats } from '@/lib/data/sessions-service';
import { UserStatistics } from '@/lib/stats/user-stats';
import { VOCABULARY_WORDS } from '@/data/vocabulary-bank';
import { playPronunciation } from '@/lib/speech/tts';
import { formatDuration } from '@/lib/speech/metrics';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [recentSessions, setRecentSessions] = useState<EvaluationResult[]>([]);
  const [selectedSession, setSelectedSession] = useState<EvaluationResult | null>(null);
  const [dailyWordIndex, setDailyWordIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [greeting, setGreeting] = useState<string>('Welcome back');
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchUserSessionsAndStats();
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setProfile(result.profile);
        setStats(result.stats);
        setRecentSessions(result.stats.recentSessions.slice(0, 4));
        setIsDemo(result.isDemo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const now = new Date();
    const day = now.getDate();
    setDailyWordIndex(day % VOCABULARY_WORDS.length);
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const dailyWord = VOCABULARY_WORDS[dailyWordIndex] || VOCABULARY_WORDS[0];

  const handleAudioPronounce = async () => {
    if (!dailyWord) return;
    setIsPlayingAudio(true);
    await playPronunciation(dailyWord.word);
    setIsPlayingAudio(false);
  };

  const weeklyTargetMinutes = stats ? stats.weeklyTargetMinutes : 60;
  const currentWeeklyMinutes = stats ? Math.round((stats.weeklySpeakingSeconds / 60) * 10) / 10 : 0;
  const weeklyPercent = stats ? stats.weeklyPercent : 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-6xl mx-auto">
      {/* 1. Header with Mode indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500 font-mono">
            <span>{profile?.primaryGoal || 'Fluent Communication'}</span>
            <span>•</span>
            <span>{profile?.proficiencyLevel || 'Intermediate'}</span>
            {isDemo && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-medium">Demo Mode (Local Data)</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
            {greeting}, {profile?.fullName || 'Learner'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/live-interview"
            className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
            <span>Live AI Interview</span>
          </Link>
          <Link
            href="/extempore"
            className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-zinc-300" />
            <span>Start Speech</span>
          </Link>
        </div>
      </div>

      {/* Database Error Banner (Strict separation: does not hide failure or fake data) */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-red-200">Database synchronization error</p>
              <p className="text-red-400">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Stat Strip - Derived strictly from real session data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric A: Practice Streak */}
        <div className="minimal-card p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Streak</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-zinc-100 font-mono">
              {stats ? stats.streakDays : 0}
            </span>
            <span className="text-xs text-zinc-500">days</span>
          </div>
        </div>

        {/* Metric B: Completed Sessions */}
        <div className="minimal-card p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Sessions</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-zinc-100 font-mono">
              {stats ? stats.totalSessions : 0}
            </span>
            <span className="text-xs text-zinc-500">completed</span>
          </div>
        </div>

        {/* Metric C: Valid Speaking Time */}
        <div className="minimal-card p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Speaking Time</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-zinc-100 font-mono">
              {stats ? stats.formattedSpeakingTime : '0 sec'}
            </span>
          </div>
        </div>

        {/* Metric D: Arithmetic Mean Average Score */}
        <div className="minimal-card p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Average Score</span>
          <div className="flex items-baseline gap-1.5">
            {stats && stats.averageScore !== null ? (
              <>
                <span className="text-2xl font-semibold text-zinc-100 font-mono">
                  {stats.averageScore}
                </span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-zinc-400 font-mono">
                -- / 100
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Practice Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prominent Live AI Interview Card */}
          <div className="relative overflow-hidden minimal-card p-6 space-y-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-cyan-500/30 shadow-lg">
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[10px] font-mono text-cyan-300 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Conversational Spoken AI</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Live Multi-Turn Room</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-medium text-zinc-100 tracking-tight">
                Live AI Interview Studio
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Experience voice-driven, conversational English practice. The AI speaks aloud, listens to your reasoning, and asks dynamic follow-up questions tailored to your answers across campus placement, HR, and technical topics.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2.5 text-xs text-zinc-500 font-mono">
                <span>Spoken Audio</span>
                <span>•</span>
                <span>Live Speech Recognition</span>
                <span>•</span>
                <span>8 Competency Rubrics</span>
              </div>
              <Link
                href="/live-interview"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                <span>Launch Live Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Daily Extempore Prompt */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Daily Focus Topic
              </span>
              <span className="text-xs text-zinc-500 font-mono">2m duration</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-medium text-zinc-100 tracking-tight">
                "The Impact of Generative AI on Entry-Level Tech Careers"
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Practice organizing your thoughts rapidly. Structure: Clear thesis → 2 key supporting points → concluding takeaway. Keep filler words under 3%.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <span className="text-xs text-zinc-500">Category: Technology</span>
              <Link
                href="/extempore"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white"
              >
                <span>Launch Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Word of the Day */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Word of the Day
              </span>
              <span className="text-xs text-zinc-500 font-mono">{dailyWord.category}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-medium text-zinc-100">{dailyWord.word}</h3>
                  <span className="text-xs text-zinc-500 font-mono">{dailyWord.phonetic}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{dailyWord.meaning}</p>
                <p className="text-[11px] text-zinc-500 italic pt-1">"{dailyWord.exampleSentences[0]}"</p>
              </div>

              <button
                onClick={handleAudioPronounce}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors shrink-0 cursor-pointer"
                title="Play pronunciation"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-zinc-100' : ''}`} />
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-zinc-500">{dailyWord.partOfSpeech}</span>
              <Link href="/vocabulary" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                <span>Vocabulary Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Weekly Target Progress - Real Accumulation */}
          <div className="minimal-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Weekly Speaking Goal</span>
              <span className="text-zinc-500 font-mono">{currentWeeklyMinutes} / {weeklyTargetMinutes} min</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div style={{ width: `${weeklyPercent}%` }} className="h-full bg-zinc-300 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Right Column: Recent Sessions & Quick Links */}
        <div className="space-y-6">
          {/* Recent History - Clickable to genuine detail */}
          <div className="minimal-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200">Recent Sessions</span>
              <Link href="/progress" className="text-[11px] text-zinc-500 hover:text-zinc-300">
                View all
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No sessions recorded yet.</p>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="w-full text-left py-2.5 flex items-start justify-between gap-2 hover:bg-zinc-800/30 px-1.5 -mx-1.5 rounded transition-colors cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                        {s.topicTitle}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {formatDuration(s.durationSeconds)} • {s.wordsPerMinute} WPM
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-medium text-zinc-300">
                        {s.overallScore}
                      </span>
                      <Eye className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Modules */}
          <div className="minimal-card p-5 space-y-3">
            <span className="text-xs font-medium text-zinc-200 block">Quick Modules</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/live-interview"
                className="col-span-2 p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 hover:from-cyan-900/50 hover:to-indigo-900/50 border border-cyan-800/40 text-cyan-200 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">Live AI Interview</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>

              <Link
                href="/interview"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/[0.04] text-zinc-300 transition-colors"
              >
                <Briefcase className="w-4 h-4 mb-1 text-zinc-400" />
                <span className="block font-medium">Mock Q&A</span>
              </Link>

              <Link
                href="/speaking-lab"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/[0.04] text-zinc-300 transition-colors"
              >
                <Compass className="w-4 h-4 mb-1 text-zinc-400" />
                <span className="block font-medium">Speaking Lab</span>
              </Link>

              <Link
                href="/vocabulary"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/[0.04] text-zinc-300 transition-colors"
              >
                <BookOpen className="w-4 h-4 mb-1 text-zinc-400" />
                <span className="block font-medium">Vocabulary</span>
              </Link>

              <Link
                href="/mistakes"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/[0.04] text-zinc-300 transition-colors"
              >
                <AlertCircle className="w-4 h-4 mb-1 text-zinc-400" />
                <span className="block font-medium">Notebook</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Genuine Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl minimal-card p-6 bg-zinc-950 border border-zinc-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">{selectedSession.sessionType}</span>
                <h3 className="text-base font-medium text-zinc-100">{selectedSession.topicTitle}</h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {new Date(selectedSession.createdAt).toLocaleDateString()} • {formatDuration(selectedSession.durationSeconds)} • {selectedSession.wordsPerMinute} WPM
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/70 border border-white/[0.04]">
              <span className="text-xs text-zinc-400">Overall Score</span>
              <span className="text-lg font-mono font-semibold text-zinc-100">{selectedSession.overallScore}/100</span>
            </div>

            {selectedSession.transcript && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Transcript</span>
                <p className="text-zinc-300 leading-relaxed bg-zinc-900 p-3 rounded-lg border border-white/[0.04] max-h-36 overflow-y-auto">
                  "{selectedSession.transcript}"
                </p>
              </div>
            )}

            {selectedSession.criteria && selectedSession.criteria.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Criteria Scores</span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSession.criteria.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-zinc-900/60 border border-white/[0.04] flex items-center justify-between">
                      <span className="text-zinc-400">{c.criterion}</span>
                      <span className="font-mono text-zinc-200 font-medium">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
