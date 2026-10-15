/**
 * Practice Sessions Service & Data Access Layer
 * 
 * Provides unified access to practice sessions and user statistics across:
 * 1. Supabase Mode (Authenticated PostgreSQL via RLS)
 * 2. Demo Mode (Local Storage fallback when offline or unconfigured)
 * 
 * Strict separation: A failed Supabase query will NEVER silently fall back to demo data.
 */

import { EvaluationResult, UserProfile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  getDemoSessions, 
  saveDemoSession as saveToDemoStorage, 
  deleteDemoSession as deleteFromDemoStorage, 
  getDemoProfile,
  isDemoModeActive,
  setDemoModeActive
} from '@/lib/supabase/demo-storage';
import { 
  calculateUserStatistics, 
  UserStatistics 
} from '@/lib/stats/user-stats';

export interface SessionsDataResult {
  mode: 'supabase' | 'demo';
  isDemo: boolean;
  userId: string | null;
  profile: UserProfile | null;
  sessions: EvaluationResult[];
  stats: UserStatistics;
  error: string | null;
}

/**
 * Validates if a string is a standard UUID.
 */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Maps a Supabase practice_sessions database row to our typed EvaluationResult model.
 */
export function mapSupabaseRowToEvaluation(row: any): EvaluationResult {
  return {
    id: row.id,
    topicId: row.topic_id || undefined,
    topicTitle: row.topic_title || 'Spontaneous Speech',
    sessionType: row.session_type || 'extempore',
    durationSeconds: Number(row.duration_seconds) || 0,
    wordCount: Number(row.word_count) || 0,
    wordsPerMinute: Number(row.words_per_minute) || 0,
    overallScore: Number(row.overall_score) || 0,
    criteria: Array.isArray(row.criteria_scores) ? row.criteria_scores : [],
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    areasForImprovement: Array.isArray(row.areas_for_improvement) ? row.areas_for_improvement : [],
    priorityImprovements: Array.isArray(row.priority_improvements) && row.priority_improvements.length >= 3
      ? (row.priority_improvements as [string, string, string])
      : ['Clear thesis structure', 'Pacing and cadence', 'Minimizing filler pauses'],
    strongestPart: row.strongest_part || '',
    fillerWords: Array.isArray(row.filler_words) ? row.filler_words : [],
    fillerWordPercentage: Number(row.filler_percentage) || 0,
    repeatedPhrases: Array.isArray(row.repeated_phrases) ? row.repeated_phrases : [],
    sentenceCorrections: Array.isArray(row.sentence_corrections) ? row.sentence_corrections : [],
    vocabularyUpgrades: Array.isArray(row.vocabulary_upgrades) ? row.vocabulary_upgrades : [],
    recommendedNextExercise: row.recommended_next_exercise || {
      title: 'Structured Argumentation Drill',
      type: 'Extempore Practice',
      reason: 'Reinforces speech organization and fluency'
    },
    transcript: row.transcript || '',
    audioUrl: row.recording_storage_path || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    isDemoData: false,
  };
}

/**
 * Maps an EvaluationResult object to a Supabase practice_sessions insert/upsert payload.
 */
export function mapEvaluationToSupabaseRow(result: EvaluationResult, userId: string): any {
  const rowId = isValidUUID(result.id) ? result.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

  return {
    ...(rowId ? { id: rowId } : {}),
    user_id: userId,
    topic_id: result.topicId || null,
    topic_title: result.topicTitle || 'Practice Session',
    session_type: result.sessionType || 'extempore',
    duration_seconds: Math.max(0, Math.round(result.durationSeconds || 0)),
    word_count: Math.max(0, Math.round(result.wordCount || 0)),
    words_per_minute: Math.max(0, Math.round(result.wordsPerMinute || 0)),
    overall_score: Math.max(0, Math.min(100, Math.round(result.overallScore || 0))),
    criteria_scores: result.criteria || [],
    strengths: result.strengths || [],
    areas_for_improvement: result.areasForImprovement || [],
    priority_improvements: result.priorityImprovements || [],
    strongest_part: result.strongestPart || '',
    filler_words: result.fillerWords || [],
    filler_percentage: result.fillerWordPercentage || 0,
    repeated_phrases: result.repeatedPhrases || [],
    transcript: result.transcript || '',
    sentence_corrections: result.sentenceCorrections || [],
    vocabulary_upgrades: result.vocabularyUpgrades || [],
    recommended_next_exercise: result.recommendedNextExercise || {},
    created_at: result.createdAt || new Date().toISOString(),
  };
}

/**
 * Fetches user sessions, active profile, and aggregated statistics from either Supabase or Demo storage.
 * 
 * Guarantees:
 * 1. If Supabase is configured and authenticated, reads ONLY the current user's records.
 * 2. If a Supabase query fails, returns explicit error state without switching to demo numbers.
 * 3. In demo mode, derives statistics dynamically from saved local demo sessions.
 */
export async function fetchUserSessionsAndStats(userTimezone?: string): Promise<SessionsDataResult> {
  const isBrowser = typeof window !== 'undefined';
  const supabase = isBrowser ? createClient() : null;

  // Check if Supabase client is available and configured
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.warn('Supabase auth query error:', authError);
      }

      // If user is authenticated in Supabase, fetch their real database records
      if (user) {
        const { data: dbSessions, error: sessionsError } = await supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionsError) {
          console.error('Error fetching Supabase practice sessions:', sessionsError);
          return {
            mode: 'supabase',
            isDemo: false,
            userId: user.id,
            profile: null,
            sessions: [],
            stats: calculateUserStatistics([]),
            error: `Failed to load practice data: ${sessionsError.message}`,
          };
        }

        // Fetch user profile from Supabase
        const { data: dbProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const mappedSessions: EvaluationResult[] = (dbSessions || []).map(mapSupabaseRowToEvaluation);
        const stats = calculateUserStatistics(
          mappedSessions, 
          userTimezone, 
          undefined, 
          dbProfile?.daily_target_minutes || 15
        );

        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          fullName: dbProfile?.full_name || user.user_metadata?.full_name || 'Learner',
          proficiencyLevel: dbProfile?.proficiency_level || 'Intermediate',
          primaryGoal: dbProfile?.primary_goal || 'Everyday Fluency & Confidence',
          targetRole: dbProfile?.target_role || undefined,
          dailyTargetMinutes: dbProfile?.daily_target_minutes || 15,
          streakDays: stats.streakDays,
          totalSpeakingMinutes: Math.round((stats.totalSpeakingSeconds / 60) * 10) / 10,
          totalSessions: stats.totalSessions,
          averageScore: stats.averageScore ?? 0,
          createdAt: dbProfile?.created_at || new Date().toISOString(),
        };

        return {
          mode: 'supabase',
          isDemo: false,
          userId: user.id,
          profile,
          sessions: mappedSessions,
          stats,
          error: null,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('Supabase query exception:', err);
      return {
        mode: 'supabase',
        isDemo: false,
        userId: null,
        profile: null,
        sessions: [],
        stats: calculateUserStatistics([]),
        error: message,
      };
    }
  }

  // Demo mode: Supabase is unconfigured or user is exploring without logging in
  const demoSessions = getDemoSessions();
  const demoProfile = getDemoProfile();
  const stats = calculateUserStatistics(
    demoSessions, 
    userTimezone, 
    undefined, 
    demoProfile.dailyTargetMinutes || 20
  );

  return {
    mode: 'demo',
    isDemo: true,
    userId: demoProfile.id,
    profile: {
      ...demoProfile,
      streakDays: stats.streakDays,
      totalSessions: stats.totalSessions,
      totalSpeakingMinutes: Math.round((stats.totalSpeakingSeconds / 60) * 10) / 10,
      averageScore: stats.averageScore ?? 0,
    },
    sessions: demoSessions,
    stats,
    error: null,
  };
}

/**
 * Persists a completed practice session once to the appropriate storage:
 * - If Supabase authenticated: inserts into practice_sessions table
 * - If Demo mode: saves to local storage with deduplication
 */
export async function savePracticeSession(session: EvaluationResult): Promise<{ success: boolean; error?: string }> {
  const isBrowser = typeof window !== 'undefined';
  const supabase = isBrowser ? createClient() : null;

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Prevent duplicate insertions
        if (isValidUUID(session.id)) {
          const { data: existing } = await supabase
            .from('practice_sessions')
            .select('id')
            .eq('id', session.id)
            .maybeSingle();

          if (existing) {
            return { success: true };
          }
        }

        const payload = mapEvaluationToSupabaseRow(session, user.id);
        const { error: insertError } = await supabase.from('practice_sessions').insert(payload);
        if (insertError) {
          console.error('Failed to insert practice session into Supabase:', insertError);
          return { success: false, error: insertError.message };
        }
        return { success: true };
      }
    } catch (err) {
      console.warn('Error saving practice session to Supabase:', err);
    }
  }

  // Demo mode fallback
  saveToDemoStorage(session);
  return { success: true };
}

/**
 * Deletes a practice session from storage.
 */
export async function deletePracticeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const isBrowser = typeof window !== 'undefined';
  const supabase = isBrowser ? createClient() : null;

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: deleteError } = await supabase
          .from('practice_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
        return { success: true };
      }
    } catch (err) {
      console.warn('Error deleting from Supabase:', err);
    }
  }

  deleteFromDemoStorage(sessionId);
  return { success: true };
}

/**
 * Signs out the current user:
 * - Invokes Supabase auth.signOut() if configured
 * - Resets demo active state
 * - Redirects to /login
 */
export async function signOutUser(): Promise<void> {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return;

  const supabase = createClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error signing out of Supabase:', e);
    }
  }

  setDemoModeActive(false);
  window.location.href = '/login';
}
