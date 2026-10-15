'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Trash2, 
  Download,
  LogOut,
  User,
  Shield,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '@/types';
import { 
  getDemoProfile, 
  saveDemoProfile, 
  getDemoSessions, 
  getDemoMistakes, 
  isDemoModeActive 
} from '@/lib/supabase/demo-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchUserSessionsAndStats, signOutUser } from '@/lib/data/sessions-service';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [dailyMinutes, setDailyMinutes] = useState<number>(15);
  const [audioConsent, setAudioConsent] = useState<boolean>(true);
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(365);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    fetchUserSessionsAndStats().then((res) => {
      setIsDemo(res.isDemo);
      const prof = res.profile || getDemoProfile();
      setProfile(prof);
      if (prof) {
        setFullName(prof.fullName || '');
        setUserEmail(prof.email || '');
        setDailyMinutes(prof.dailyTargetMinutes || 15);
      }
    }).catch(() => {
      const prof = getDemoProfile();
      setProfile(prof);
      if (prof) {
        setFullName(prof.fullName || '');
        setUserEmail(prof.email || '');
        setDailyMinutes(prof.dailyTargetMinutes || 15);
      }
      setIsDemo(isDemoModeActive());
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = {
      ...profile,
      fullName,
      dailyTargetMinutes: dailyMinutes,
    };
    saveDemoProfile(updated);
    setProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOutUser();
  };

  const handleExportAllData = () => {
    const sessions = getDemoSessions();
    const mistakes = getDemoMistakes();
    const data = {
      profile,
      sessions,
      mistakes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speakwell-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllUserData = () => {
    try {
      localStorage.removeItem('speakwell_demo_sessions');
      localStorage.removeItem('speakwell_demo_mistakes');
      localStorage.removeItem('speakwell_bookmarks');
      localStorage.removeItem('speakwell_vocab_bookmarks');
      localStorage.removeItem('speakwell_vocab_mastered');
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
          Settings & Account
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your learner preferences, account session, and privacy controls.
        </p>
      </div>

      {/* 1. Account & Session (Logout Option) */}
      <div className="minimal-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-medium text-zinc-200 block">Account & Session</span>
            <p className="text-[11px] text-zinc-400">Current authentication status and account controls.</p>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
            isDemo 
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {isDemo ? 'Local Demo Mode' : 'Cloud Supabase Account'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-zinc-100">{fullName || 'Learner'}</p>
            <p className="text-[11px] text-zinc-500 font-mono">{userEmail || 'learner@speakwell.ai'}</p>
          </div>

          <div className="flex items-center gap-2.5">
            {isDemo && supabaseConfigured && (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors inline-flex items-center gap-1"
              >
                <span>Sign in to Cloud</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>{loggingOut ? 'Signing out...' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Profile Form */}
      <div className="minimal-card p-6 space-y-4">
        <span className="text-xs font-medium text-zinc-200 block">Personal Profile</span>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Learner"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                Daily Goal (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            ) : <div />}

            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* 3. Database & Cloud Status */}
      <div className="minimal-card p-6 space-y-4">
        <span className="text-xs font-medium text-zinc-200 block">Database & Services</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1">
            <span className="text-zinc-300 font-medium block">Supabase Database</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`w-2 h-2 rounded-full ${supabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`text-[11px] font-mono ${supabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {supabaseConfigured ? 'Connected & Active' : 'Unconfigured (Local Demo)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 pt-0.5">
              {supabaseConfigured
                ? 'Sessions sync directly to your cloud PostgreSQL database.'
                : 'Local demo mode active. All sessions are kept on this device.'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1">
            <span className="text-zinc-300 font-medium block">Evaluation Engine</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-emerald-400">Ready</span>
            </div>
            <p className="text-[11px] text-zinc-500 pt-0.5">
              Deterministic rule-based NLP + optional server-side inference.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Privacy & Retention */}
      <div className="minimal-card p-6 space-y-5 text-xs">
        <span className="text-xs font-medium text-zinc-200 block">Privacy & Data Controls</span>

        <div className="space-y-3">
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04] cursor-pointer">
            <input
              type="checkbox"
              checked={audioConsent}
              onChange={(e) => setAudioConsent(e.target.checked)}
              className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-zinc-300 focus:ring-0 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-zinc-200 font-medium block">Microphone Audio Consent</span>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Capture browser audio for live transcription and speech diagnostic scoring.
              </p>
            </div>
          </label>

          <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04] flex items-center justify-between">
            <div>
              <span className="text-zinc-200 font-medium block">Retention Period</span>
              <span className="text-[11px] text-zinc-500">Auto-prune old sessions.</span>
            </div>
            <select
              value={dataRetentionDays}
              onChange={(e) => setDataRetentionDays(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs"
            >
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={365}>1 Year</option>
              <option value={9999}>Indefinite</option>
            </select>
          </div>
        </div>

        {/* Data Actions */}
        <div className="pt-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleExportAllData}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data (JSON)</span>
          </button>

          {!confirmDeleteAll ? (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Confirm?</span>
              <button
                onClick={handleDeleteAllUserData}
                className="px-2.5 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-500 cursor-pointer"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-2.5 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
