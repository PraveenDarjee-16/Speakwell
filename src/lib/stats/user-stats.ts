/**
 * User Statistics Calculation Engine for SpeakWell
 * 
 * Provides a single, strongly typed, authoritative source of truth for:
 * - Completed session counts (distinct, completed, non-abandoned)
 * - Speaking time aggregation and formatting (<60s -> "35 sec", "1m 30s", "48 min", "1h 12m")
 * - Average evaluation scores (arithmetic mean of valid scores 0-100)
 * - Timezone-aware practice streak calculation (consecutive calendar days)
 * - Recent sessions sorting and formatting
 */

import { EvaluationResult } from '@/types';
import { countWords, calculateWpm } from '@/lib/speech/metrics';

export interface UserStatistics {
  totalSessions: number;
  totalSpeakingSeconds: number;
  formattedSpeakingTime: string;
  averageScore: number | null;
  streakDays: number;
  recentSessions: EvaluationResult[];
  weeklySpeakingSeconds: number;
  weeklyTargetMinutes: number;
  weeklyPercent: number;
}

/**
 * Validates whether a practice session represents a qualifying, successfully completed attempt.
 * Excludes abandoned sessions (zero duration), incomplete sessions, and corrupt records.
 */
export function isValidPracticeSession(session: unknown): session is EvaluationResult {
  if (!session || typeof session !== 'object') return false;
  const s = session as Partial<EvaluationResult>;

  // Must have a valid identifier and timestamp
  if (!s.id || typeof s.id !== 'string') return false;
  if (!s.createdAt || isNaN(new Date(s.createdAt).getTime())) return false;

  // Must have a positive, finite duration
  if (typeof s.durationSeconds !== 'number' || !Number.isFinite(s.durationSeconds) || s.durationSeconds <= 0) {
    return false;
  }

  return true;
}

/**
 * Deduplicates sessions by unique ID, preserving the latest instance if duplicates exist.
 * Prevents inflated statistics caused by repeated submissions, browser refreshes, or React effects.
 */
export function deduplicateSessions(sessions: EvaluationResult[]): EvaluationResult[] {
  const seen = new Set<string>();
  const unique: EvaluationResult[] = [];

  for (const session of sessions) {
    if (!session || !session.id) continue;
    if (!seen.has(session.id)) {
      seen.add(session.id);
      unique.push(session);
    }
  }

  return unique;
}

/**
 * Formats accumulated speaking duration in seconds to human-readable format according to SpeakWell specs:
 * - Under one minute: "35 sec", "0 sec"
 * - One minute and thirty seconds: "1m 30s"
 * - Exact minute marks: "48 min", "2 min"
 * - Hour marks: "1h 12m", "2h"
 */
export function formatSpeakingTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 sec';
  }

  const rounded = Math.round(totalSeconds);

  // 1. Under one minute
  if (rounded < 60) {
    return `${rounded} sec`;
  }

  // 2. Under one hour (< 3600 seconds)
  if (rounded < 3600) {
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    if (secs === 0) {
      return `${mins} min`;
    }
    return `${mins}m ${secs}s`;
  }

  // 3. One hour or more (>= 3600 seconds)
  const hours = Math.floor(rounded / 3600);
  const remMinutes = Math.floor((rounded % 3600) / 60);
  if (remMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remMinutes}m`;
}

/**
 * Calculates the arithmetic mean of overall evaluation scores for completed sessions.
 * Excludes sessions without a valid score (null, undefined, NaN, or out-of-range).
 * Returns null if no valid evaluated sessions exist.
 */
export function calculateAverageScore(
  sessions: Array<{ overallScore?: number | null }>
): number | null {
  const validScores = sessions
    .map((s) => s.overallScore)
    .filter((score): score is number => 
      typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100
    );

  if (validScores.length === 0) {
    return null;
  }

  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / validScores.length;
  // Round to one decimal place (e.g. 78.5 or 80.0)
  return Math.round(mean * 10) / 10;
}

/**
 * Validates and normalizes an IANA timezone identifier.
 * Falls back to local runtime timezone or 'UTC' if invalid.
 */
export function resolveUserTimezone(userTimezone?: string): string {
  if (userTimezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: userTimezone });
      return userTimezone;
    } catch {
      // Invalid timezone string, fallback below
    }
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats a Date or timestamp into a calendar date string (YYYY-MM-DD) in the specified timezone.
 */
export function formatDateInTimezone(dateInput: Date | string | number, timeZone?: string): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const safeTz = resolveUserTimezone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Returns the calendar day string (YYYY-MM-DD) preceding the provided date string.
 * Uses UTC date calculations to avoid daylight saving transitions.
 */
export function getPreviousCalendarDay(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${dd}`;
}

/**
 * Calculates consecutive active practice streak days in the user's configured timezone.
 * 
 * Rules:
 * - A day counts when the user completes at least one qualifying practice session.
 * - Multiple sessions on one calendar day count as one streak day.
 * - If user practiced today, count consecutive active days ending today.
 * - If user has not practiced today but practiced yesterday, calculate streak ending yesterday.
 * - Missing an intervening calendar day breaks the streak.
 * - Returns 0 for accounts with 0 sessions or when yesterday was missed without practicing today.
 * 
 * Timezone Changes:
 * Session timestamps are stored in UTC (e.g. ISO-8601). When a user changes timezones or travels,
 * dates are re-projected onto the calendar boundaries of that specific timezone. This ensures
 * midnight transitions match the user's real-world day.
 * 
 * First Practice Day:
 * A user who completes their very first practice session today achieves a 1-day streak.
 */
export function calculateStreak(
  sessionDates: (string | Date)[],
  userTimezone?: string,
  referenceDate?: Date
): number {
  if (!sessionDates || sessionDates.length === 0) {
    return 0;
  }

  const tz = resolveUserTimezone(userTimezone);
  const now = referenceDate || new Date();

  // 1. Project all valid dates into unique YYYY-MM-DD strings in user's timezone
  const activeDaysSet = new Set<string>();
  for (const dateVal of sessionDates) {
    const formatted = formatDateInTimezone(dateVal, tz);
    if (formatted) {
      activeDaysSet.add(formatted);
    }
  }

  if (activeDaysSet.size === 0) {
    return 0;
  }

  // 2. Identify "today" and "yesterday" in the target timezone
  const todayStr = formatDateInTimezone(now, tz);
  const yesterdayStr = getPreviousCalendarDay(todayStr);

  const practicedToday = activeDaysSet.has(todayStr);
  const practicedYesterday = activeDaysSet.has(yesterdayStr);

  // If neither today nor yesterday has activity, streak is broken
  if (!practicedToday && !practicedYesterday) {
    return 0;
  }

  // Count backwards from today (if practiced today) or from yesterday (if pending practice today)
  let streak = 0;
  let checkDay = practicedToday ? todayStr : yesterdayStr;

  while (activeDaysSet.has(checkDay)) {
    streak++;
    checkDay = getPreviousCalendarDay(checkDay);
  }

  return streak;
}

/**
 * Master calculation function: aggregates all dashboard and progress metrics
 * from a collection of session records.
 */
export function calculateUserStatistics(
  rawSessions: EvaluationResult[],
  userTimezone?: string,
  referenceDate?: Date,
  dailyTargetMinutes: number = 15
): UserStatistics {
  // 1. Filter out invalid, abandoned, or failed sessions
  const validSessions = (rawSessions || []).filter(isValidPracticeSession);

  // 2. Deduplicate sessions by ID
  const sessions = deduplicateSessions(validSessions);

  // 3. Count distinct sessions
  const totalSessions = sessions.length;

  // 4. Sum valid speaking duration in seconds
  const totalSpeakingSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const formattedSpeakingTime = formatSpeakingTime(totalSpeakingSeconds);

  // 5. Average overall score (arithmetic mean)
  const averageScore = calculateAverageScore(sessions);

  // 6. Streak calculation
  const sessionDates = sessions.map((s) => s.createdAt);
  const streakDays = calculateStreak(sessionDates, userTimezone, referenceDate);

  // 7. Recent sessions sorted by creation timestamp (newest first)
  const recentSessions = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 8. Weekly goal progress (last 7 days)
  const now = referenceDate || new Date();
  const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weeklySessions = sessions.filter((s) => new Date(s.createdAt).getTime() >= sevenDaysAgoTime);
  const weeklySpeakingSeconds = weeklySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const weeklyTargetMinutes = Math.max(15, dailyTargetMinutes * 5); // 5 practice days per week target
  const weeklySpeakingMinutes = Math.round((weeklySpeakingSeconds / 60) * 10) / 10;
  const weeklyPercent = Math.min(100, Math.round((weeklySpeakingMinutes / weeklyTargetMinutes) * 100));

  return {
    totalSessions,
    totalSpeakingSeconds,
    formattedSpeakingTime,
    averageScore,
    streakDays,
    recentSessions,
    weeklySpeakingSeconds,
    weeklyTargetMinutes,
    weeklyPercent,
  };
}
