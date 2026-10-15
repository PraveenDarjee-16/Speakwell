'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  ArrowRight, 
  BookOpen, 
  Briefcase, 
  Compass, 
  AlertCircle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Check,
  Sparkles
} from 'lucide-react';
import { INITIAL_DEMO_SESSIONS } from '@/lib/supabase/demo-storage';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const sampleSession = INITIAL_DEMO_SESSIONS[0];

  const faqs = [
    {
      q: 'How does SpeakWell analyze my spoken English?',
      a: 'SpeakWell captures browser audio using the MediaRecorder API and transcribes it via Web Speech API or server-side inference. Our evaluation engine then analyzes the transcript across 8 distinct criteria: fluency, grammar accuracy, vocabulary sophistication, pronunciation/intelligibility, clarity, topic relevance, organization, and delivery.'
    },
    {
      q: 'Does SpeakWell require an external API key or Supabase to try?',
      a: 'No. SpeakWell features full local Demo Mode support. All practice sessions, mistake logs, and vocabulary progress are saved locally in your browser so you can practice instantly with zero setup.'
    },
    {
      q: 'What is the Extempore practice module?',
      a: 'Extempore is our flagship spontaneous speaking feature. You draw or spin a random topic from our 100+ curated bank spanning technology, business, college life, ethics, and current affairs. You receive structured prep hints, record for 1 to 3 minutes, and receive instant rubric feedback.'
    },
    {
      q: 'How is my audio recording handled?',
      a: 'Microphone permissions are requested only when you initiate recording. Audio recordings are processed on-device or encrypted in transit, and you can delete individual recordings or session histories at any time from your settings.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Subtle Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Minimalist Speech Laboratory</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-zinc-100 leading-[1.12]">
            Speak clearly. <br className="hidden sm:inline" />
            <span className="text-zinc-400">Think on your feet.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A distraction-free speech studio built for students, job applicants, and professionals. Practice 100+ extempore topics, mock interviews, and receive objective rubric feedback.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/extempore"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-zinc-950 bg-zinc-100 hover:bg-white transition-all flex items-center justify-center gap-2 group shadow-sm"
            >
              <Mic className="w-4 h-4 text-zinc-950" />
              <span>Start Extempore Practice</span>
              <ArrowRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-medium text-sm text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>Open Dashboard</span>
            </Link>
          </div>

          {/* Minimal Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-400" /> Real Browser Microphone
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-400" /> 100+ Curated Topics
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-400" /> STAR Interview Prep
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-400" /> Instant Local Demo
            </span>
          </div>
        </div>
      </section>

      {/* 2. MINIMALIST LIVE SAMPLE REPORT PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06] bg-[#0c0c0e]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Evaluation Preview</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
              Objective, Rubric-Driven Diagnostics
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Every speech is analyzed across 8 metrics with specific sentence upgrades and filler detection.
            </p>
          </div>

          {/* Minimal Sample Report Card */}
          <div className="minimal-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50">
                  {sampleSession.topicTitle}
                </span>
                <h3 className="text-lg font-medium text-zinc-100 pt-1">
                  Extempore Speech Diagnostic
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Duration: 1m 58s • 242 Words • 123 WPM • 3.7% Fillers
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                    {sampleSession.overallScore}
                  </span>
                  <span className="text-xs text-zinc-500 block font-mono">/ 100 Overall</span>
                </div>
              </div>
            </div>

            {/* Criteria Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sampleSession.criteria.slice(0, 4).map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1.5">
                  <span className="text-xs text-zinc-400 block truncate">{c.criterion}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-zinc-200 font-mono">{c.score}</span>
                    <span className="text-[10px] text-zinc-500">/ 100</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div style={{ width: `${c.score}%` }} className="h-full bg-zinc-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Side-by-side sentence correction */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.05] space-y-2 text-xs">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Sentence Upgrade
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-zinc-900 border border-red-500/10 text-zinc-300">
                  <span className="text-[10px] text-red-400 block font-mono uppercase mb-1">Spoken:</span>
                  "{sampleSession.sentenceCorrections[0].original}"
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-emerald-500/15 text-zinc-200">
                  <span className="text-[10px] text-emerald-400 block font-mono uppercase mb-1">Polished:</span>
                  "{sampleSession.sentenceCorrections[0].corrected}"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE MODULES GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Practice Modules</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
              Tools for Deliberate Practice
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto">
              Everything you need to practice, diagnose mistakes, and build speaking habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/extempore"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Extempore Studio
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                100+ topics with randomized roulette, preparation timers, and instant speech evaluations.
              </p>
            </Link>

            <Link
              href="/interview"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Mock Interview Studio
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Behavioral and technical drills with STAR method structuring and benchmark answers.
              </p>
            </Link>

            <Link
              href="/speaking-lab"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Speaking Lab & Drills
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Group discussion simulations, pronunciation minimal pairs, and rapid speech drills.
              </p>
            </Link>

            <Link
              href="/vocabulary"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Vocabulary Lab
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Curated word-of-the-day cards with audio pronunciations, contextual examples, and spaced repetition.
              </p>
            </Link>

            <Link
              href="/mistakes"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Mistake Notebook
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automatic capture of grammatical slips, filler words, and review tracking for deliberate improvement.
              </p>
            </Link>

            <Link
              href="/progress"
              className="minimal-card p-6 space-y-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
                Progress & Trends
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clean analytics tracking speaking durations, score milestones, and consecutive practice streaks.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FAQS SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">FAQ</span>
            <h2 className="text-2xl font-medium text-zinc-100 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left flex items-center justify-between gap-4 text-sm font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="text-xs text-zinc-400 leading-relaxed pt-3 pr-6">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. MINIMAL BOTTOM CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
            Begin with one spontaneous speech today.
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Choose a topic, take thirty seconds to think, and speak. No setup or credit card required.
          </p>
          <div className="pt-2">
            <Link
              href="/extempore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
            >
              <Mic className="w-4 h-4" />
              <span>Launch Extempore Studio</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
