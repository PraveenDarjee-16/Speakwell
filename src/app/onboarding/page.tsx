'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { ProficiencyLevel, UserGoal } from '@/types';
import { getDemoProfile, saveDemoProfile } from '@/lib/supabase/demo-storage';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>('Praveen');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('Intermediate');
  const [primaryGoal, setPrimaryGoal] = useState<UserGoal>('Campus Placements & Job Interviews');
  const [targetRole, setTargetRole] = useState<string>('Associate Software Engineer');
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const existing = getDemoProfile();
    if (existing) {
      if (existing.fullName) setFullName(existing.fullName);
      if (existing.proficiencyLevel) setProficiencyLevel(existing.proficiencyLevel);
      if (existing.primaryGoal) setPrimaryGoal(existing.primaryGoal);
      if (existing.targetRole) setTargetRole(existing.targetRole);
    }
  }, []);

  const goals: UserGoal[] = [
    'Campus Placements & Job Interviews',
    'Public Speaking & Presentations',
    'Everyday Fluency & Confidence',
    'Workplace & Professional Communication',
    'Exams (IELTS / TOEFL / Extempore)',
  ];

  const levels: { level: ProficiencyLevel; desc: string }[] = [
    { level: 'Beginner', desc: 'Can hold simple conversations; looking to build grammatical confidence.' },
    { level: 'Intermediate', desc: 'Comfortable speaking; looking to reduce fillers, refine pace, and expand vocabulary.' },
    { level: 'Advanced', desc: 'Fluent speaker; aiming for persuasive public speaking, nuance, and executive presence.' },
  ];

  const timeOptions = [10, 15, 20, 30];

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedProfile = {
      ...getDemoProfile(),
      fullName,
      proficiencyLevel,
      primaryGoal,
      targetRole,
      dailyTargetMinutes,
    };

    saveDemoProfile(updatedProfile);

    // Save to Supabase if configured
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({
            full_name: fullName,
            proficiency_level: proficiencyLevel,
            primary_goal: primaryGoal,
            target_role: targetRole,
            daily_target_minutes: dailyTargetMinutes,
          }).eq('id', user.id);
        }
      } catch (err) {
        console.warn('Supabase profile update notice:', err);
      }
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-12 px-4 sm:px-6 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/[0.08] text-[11px] font-medium text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>Personalize profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Tailor your speaking practice
        </h1>
        <p className="text-sm text-zinc-400">
          We tune your recommended extempore prompts, interview questions, and pace targets based on your goals.
        </p>
      </div>

      <form onSubmit={handleComplete} className="rounded-2xl bg-zinc-900/50 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-sm space-y-6">
        {/* Preferred Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            What should we call you?
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Proficiency Level */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">
            Current speaking proficiency
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {levels.map(({ level, desc }) => (
              <button
                type="button"
                key={level}
                onClick={() => setProficiencyLevel(level)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  proficiencyLevel === level
                    ? 'bg-zinc-800/80 border-white/20 text-zinc-100'
                    : 'bg-zinc-950/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                <div>
                  <h4 className="text-sm font-medium text-zinc-100">{level}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{desc}</p>
                </div>
                {proficiencyLevel === level && (
                  <CheckCircle className="w-4 h-4 text-zinc-200 self-end mt-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">
            Primary communication goal
          </label>
          <div className="space-y-2">
            {goals.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setPrimaryGoal(g)}
                className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs text-left ${
                  primaryGoal === g
                    ? 'bg-zinc-800/80 border-white/20 text-zinc-100 font-medium'
                    : 'bg-zinc-950/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                <span>{g}</span>
                {primaryGoal === g && <CheckCircle className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Target Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            Target role or aspiration (optional)
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Associate Software Engineer, Product Manager"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Daily Target Minutes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">
            Daily practice commitment
          </label>
          <div className="grid grid-cols-4 gap-2">
            {timeOptions.map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setDailyTargetMinutes(mins)}
                className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  dailyTargetMinutes === mins
                    ? 'bg-zinc-100 text-zinc-950 border-transparent'
                    : 'bg-zinc-950/60 text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                {mins}m / day
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">
            Consistency matters more than duration. 15 minutes per day delivers compounding progress.
          </p>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-950 bg-zinc-100 hover:bg-white active:bg-zinc-200 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Saving...' : 'Finish setup'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
