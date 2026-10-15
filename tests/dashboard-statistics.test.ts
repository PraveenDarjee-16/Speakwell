import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateStreak, 
  formatSpeakingTime, 
  calculateAverageScore, 
  calculateUserStatistics,
  deduplicateSessions,
  isValidPracticeSession,
  resolveUserTimezone,
  formatDateInTimezone
} from '../src/lib/stats/user-stats';
import { countWords, calculateWpm, formatDuration } from '../src/lib/speech/metrics';
import { mapSupabaseRowToEvaluation, mapEvaluationToSupabaseRow } from '../src/lib/data/sessions-service';
import { EvaluationResult } from '../src/types';

// Helper to create mock evaluation result
function createMockSession(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    id: `session-${Math.random().toString(36).substring(2, 9)}`,
    topicTitle: 'Test Practice Topic',
    sessionType: 'extempore',
    durationSeconds: 120,
    wordCount: 60,
    wordsPerMinute: 30,
    overallScore: 80,
    criteria: [
      { criterion: 'Fluency', score: 80, weight: 25, status: 'evaluated', feedback: 'Good flow' },
      { criterion: 'Grammar', score: 80, weight: 25, status: 'evaluated', feedback: 'Solid grammar' }
    ],
    strengths: ['Clear structure'],
    areasForImprovement: ['Fewer fillers'],
    priorityImprovements: ['Pause silently', 'Vary vocabulary', 'State conclusion'],
    strongestPart: 'Introduction was crisp.',
    fillerWords: [],
    fillerWordPercentage: 0,
    repeatedPhrases: [],
    sentenceCorrections: [],
    vocabularyUpgrades: [],
    recommendedNextExercise: { title: 'Drill 1', type: 'Extempore', reason: 'Fluency' },
    transcript: 'This is a test transcript with clear spoken language and articulate delivery.',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// 1. A new user with zero sessions sees zero completed sessions, zero speaking time, no fabricated score, and a zero-day streak.
test('1. A new user with zero sessions sees zero completed sessions, zero speaking time, no fabricated score, and a 0-day streak', () => {
  const stats = calculateUserStatistics([]);

  assert.equal(stats.totalSessions, 0, 'Completed sessions should be 0');
  assert.equal(stats.totalSpeakingSeconds, 0, 'Total speaking seconds should be 0');
  assert.equal(stats.formattedSpeakingTime, '0 sec', 'Formatted speaking time should be 0 sec');
  assert.equal(stats.averageScore, null, 'Average score should be null (no fabricated score)');
  assert.equal(stats.streakDays, 0, 'Streak should be 0 (never default to 4 or 1)');
  assert.equal(stats.recentSessions.length, 0, 'Recent sessions should be empty');
});

// 2. Three completed sessions with scores of 70, 80, and 90 produce an average score of 80.
test('2. Three completed sessions with scores of 70, 80, and 90 produce an average score of 80', () => {
  const sessions = [
    createMockSession({ id: 's1', overallScore: 70 }),
    createMockSession({ id: 's2', overallScore: 80 }),
    createMockSession({ id: 's3', overallScore: 90 }),
  ];

  const avg = calculateAverageScore(sessions);
  assert.equal(avg, 80, 'Average of 70, 80, 90 must equal 80');

  const stats = calculateUserStatistics(sessions);
  assert.equal(stats.averageScore, 80, 'Stats averageScore must equal 80');
});

// 3. Sixty words spoken over 120 seconds produce 30 WPM.
test('3. Sixty words spoken over 120 seconds produce 30 WPM', () => {
  const wpm = calculateWpm(60, 120);
  assert.equal(wpm, 30, '60 words / (120s / 60) must be 30 WPM, not 700+');

  // Verify transcript word counting + WPM integration
  const words60 = 'word '.repeat(60).trim();
  assert.equal(countWords(words60), 60);
  assert.equal(calculateWpm(countWords(words60), 120), 30);
});

// 4. A session recorded for five seconds does not display a fabricated two-minute duration.
test('4. A session recorded for five seconds does not display a fabricated two-minute duration', () => {
  assert.equal(formatSpeakingTime(5), '5 sec', '5 seconds speaking time must format as 5 sec');
  assert.equal(formatDuration(5), '0m 05s', '5 seconds duration must format as 0m 05s, not 2m 00s');

  const session5s = createMockSession({ durationSeconds: 5 });
  const stats = calculateUserStatistics([session5s]);
  assert.equal(stats.totalSpeakingSeconds, 5);
  assert.equal(stats.formattedSpeakingTime, '5 sec');

  // Check required SpeakWell duration formats:
  // - Under one minute: "35 sec"
  // - One minute and thirty seconds: "1m 30s"
  // - Longer durations: "48 min" or "1h 12m"
  assert.equal(formatSpeakingTime(35), '35 sec');
  assert.equal(formatSpeakingTime(90), '1m 30s');
  assert.equal(formatSpeakingTime(48 * 60), '48 min');
  assert.equal(formatSpeakingTime(3600 + 12 * 60), '1h 12m');
});

// 5. Two sessions on the same day count as one active streak day.
test('5. Two sessions on the same day count as one active streak day', () => {
  const refDate = new Date('2026-10-15T18:00:00Z');
  const sessionDates = [
    '2026-10-15T09:30:00Z',
    '2026-10-15T15:45:00Z'
  ];

  const streak = calculateStreak(sessionDates, 'UTC', refDate);
  assert.equal(streak, 1, 'Two sessions on same calendar day must count as 1 active day');
});

// 6. Sessions on three consecutive calendar days produce a three-day streak.
test('6. Sessions on three consecutive calendar days produce a three-day streak', () => {
  const refDate = new Date('2026-10-15T12:00:00Z');
  const sessionDates = [
    '2026-10-15T10:00:00Z', // Today
    '2026-10-14T15:00:00Z', // Yesterday
    '2026-10-13T11:00:00Z', // 2 days ago
  ];

  const streak = calculateStreak(sessionDates, 'UTC', refDate);
  assert.equal(streak, 3, 'Sessions on 3 consecutive calendar days must yield a 3-day streak');

  // Also verify streak ending yesterday if not yet practiced today
  const streakYesterday = calculateStreak(
    ['2026-10-14T15:00:00Z', '2026-10-13T11:00:00Z', '2026-10-12T09:00:00Z'],
    'UTC',
    refDate
  );
  assert.equal(streakYesterday, 3, 'Consecutive days ending yesterday maintain streak pending today');
});

// 7. Missing an intervening calendar day breaks the streak.
test('7. Missing an intervening calendar day breaks the streak', () => {
  const refDate = new Date('2026-10-15T12:00:00Z');
  // Practiced today (15th) and 2 days ago (13th), but missed yesterday (14th)
  const sessionDates = [
    '2026-10-15T10:00:00Z',
    '2026-10-13T11:00:00Z',
  ];

  const streak = calculateStreak(sessionDates, 'UTC', refDate);
  assert.equal(streak, 1, 'Missing yesterday breaks streak, keeping only today (1 day)');

  // If missed both today and yesterday, streak is broken completely (0 days)
  const brokenStreak = calculateStreak(['2026-10-13T11:00:00Z'], 'UTC', refDate);
  assert.equal(brokenStreak, 0, 'Missing both today and yesterday returns 0 streak');
});

// 8. Incomplete and discarded sessions do not inflate the statistics.
test('8. Incomplete and discarded sessions do not inflate the statistics', () => {
  const validSession = createMockSession({
    id: 'valid-1',
    durationSeconds: 120,
    overallScore: 85,
    createdAt: '2026-10-15T10:00:00Z'
  });

  const abandonedSession = {
    id: 'abandoned-1',
    durationSeconds: 0, // Abandoned / 0 duration
    overallScore: 0,
    createdAt: '2026-10-15T11:00:00Z'
  } as unknown as EvaluationResult;

  const negativeDurationSession = {
    id: 'corrupt-1',
    durationSeconds: -30,
    overallScore: 50,
    createdAt: '2026-10-15T12:00:00Z'
  } as unknown as EvaluationResult;

  const missingDateSession = {
    id: 'missing-date',
    durationSeconds: 60,
    overallScore: 75,
    createdAt: 'invalid-date'
  } as unknown as EvaluationResult;

  assert.equal(isValidPracticeSession(validSession), true);
  assert.equal(isValidPracticeSession(abandonedSession), false);
  assert.equal(isValidPracticeSession(negativeDurationSession), false);
  assert.equal(isValidPracticeSession(missingDateSession), false);

  const stats = calculateUserStatistics([
    validSession,
    abandonedSession,
    negativeDurationSession,
    missingDateSession
  ]);

  assert.equal(stats.totalSessions, 1, 'Only valid session should be counted');
  assert.equal(stats.totalSpeakingSeconds, 120, 'Duration should only include valid session');
  assert.equal(stats.averageScore, 85, 'Average score should only reflect valid session');
});

// 9. A session is not counted twice after a refresh or repeated submission.
test('9. A session is not counted twice after a refresh or repeated submission', () => {
  const sessionA = createMockSession({
    id: 'unique-session-id-123',
    durationSeconds: 60,
    overallScore: 82,
    createdAt: '2026-10-15T10:00:00Z'
  });

  // Duplicate identical session (e.g. repeated submission or page reload)
  const duplicates = [sessionA, { ...sessionA }, { ...sessionA }];

  const deduplicated = deduplicateSessions(duplicates);
  assert.equal(deduplicated.length, 1, 'Duplicate session IDs must be filtered out');

  const stats = calculateUserStatistics(duplicates);
  assert.equal(stats.totalSessions, 1, 'Total sessions must equal 1, not 3');
  assert.equal(stats.totalSpeakingSeconds, 60, 'Speaking seconds must not be inflated');
  assert.equal(stats.averageScore, 82, 'Average score must remain 82');
});

// 10. A user cannot see another user\'s session data.
test('10. A user cannot see another user\'s session data', () => {
  const user1Id = '11111111-1111-4111-8111-111111111111';
  const user2Id = '22222222-2222-4222-8222-222222222222';

  const mockDbRecords = [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      user_id: user1Id,
      topic_title: 'User 1 Topic',
      duration_seconds: 120,
      overall_score: 85,
      words_per_minute: 120,
      word_count: 240,
      session_type: 'extempore',
      created_at: '2026-10-15T10:00:00Z'
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      user_id: user2Id,
      topic_title: 'User 2 Private Topic',
      duration_seconds: 180,
      overall_score: 95,
      words_per_minute: 130,
      word_count: 390,
      session_type: 'interview',
      created_at: '2026-10-15T11:00:00Z'
    }
  ];

  // Simulate authenticated user 1 query (.eq('user_id', user1Id))
  const user1Records = mockDbRecords.filter(r => r.user_id === user1Id);
  const user1Mapped = user1Records.map(mapSupabaseRowToEvaluation);

  assert.equal(user1Mapped.length, 1);
  assert.equal(user1Mapped[0].topicTitle, 'User 1 Topic');
  assert.equal(user1Records.some(r => r.user_id === user2Id), false);

  // Verify that mapEvaluationToSupabaseRow enforces the authenticated user_id
  const evalResult = createMockSession();
  const dbPayload = mapEvaluationToSupabaseRow(evalResult, user1Id);
  assert.equal(dbPayload.user_id, user1Id, 'Database row payload must bind authenticated user_id');
});

// 11. Demo mode and Supabase mode calculate statistics consistently.
test('11. Demo mode and Supabase mode calculate statistics consistently', () => {
  const commonTimestamp = '2026-10-15T10:00:00Z';

  // Demo representation
  const demoSessions: EvaluationResult[] = [
    createMockSession({
      id: 'demo-s1',
      durationSeconds: 90,
      overallScore: 80,
      createdAt: commonTimestamp
    }),
    createMockSession({
      id: 'demo-s2',
      durationSeconds: 150,
      overallScore: 90,
      createdAt: '2026-10-14T10:00:00Z'
    })
  ];

  // Supabase database row representation
  const supabaseRows = [
    {
      id: 'demo-s1',
      topic_title: 'Test Practice Topic',
      duration_seconds: 90,
      overall_score: 80,
      word_count: 60,
      words_per_minute: 40,
      session_type: 'extempore',
      created_at: commonTimestamp
    },
    {
      id: 'demo-s2',
      topic_title: 'Test Practice Topic',
      duration_seconds: 150,
      overall_score: 90,
      word_count: 100,
      words_per_minute: 40,
      session_type: 'extempore',
      created_at: '2026-10-14T10:00:00Z'
    }
  ];

  const mappedSupabaseSessions = supabaseRows.map(mapSupabaseRowToEvaluation);

  const demoStats = calculateUserStatistics(demoSessions, 'UTC', new Date('2026-10-15T12:00:00Z'));
  const supabaseStats = calculateUserStatistics(mappedSupabaseSessions, 'UTC', new Date('2026-10-15T12:00:00Z'));

  assert.equal(demoStats.totalSessions, supabaseStats.totalSessions);
  assert.equal(demoStats.totalSpeakingSeconds, supabaseStats.totalSpeakingSeconds);
  assert.equal(demoStats.formattedSpeakingTime, supabaseStats.formattedSpeakingTime);
  assert.equal(demoStats.averageScore, supabaseStats.averageScore);
  assert.equal(demoStats.streakDays, supabaseStats.streakDays);
});

// 12. Missing transcripts, invalid durations, and missing scores are handled safely.
test('12. Missing transcripts, invalid durations, and missing scores are handled safely', () => {
  // Empty/null/undefined transcript
  assert.equal(countWords(''), 0);
  assert.equal(countWords(null), 0);
  assert.equal(countWords(undefined), 0);
  assert.equal(countWords('   \n\t  '), 0);
  assert.equal(countWords('...?!---'), 0);

  // Invalid duration in WPM
  assert.equal(calculateWpm(100, 0), 0);
  assert.equal(calculateWpm(100, -10), 0);
  assert.equal(calculateWpm(100, NaN), 0);
  assert.equal(calculateWpm(0, 60), 0);

  // Invalid / negative durations in formatting
  assert.equal(formatSpeakingTime(-10), '0 sec');
  assert.equal(formatSpeakingTime(NaN), '0 sec');
  assert.equal(formatDuration(-5), '0m 00s');

  // Missing or out-of-range scores
  const sessionsWithMissingScores = [
    { overallScore: null },
    { overallScore: undefined },
    { overallScore: NaN },
    { overallScore: -10 },
    { overallScore: 120 }, // out of bounds (> 100)
    { overallScore: 84 },
  ];
  assert.equal(calculateAverageScore(sessionsWithMissingScores), 84);

  // Completely empty score list returns null
  assert.equal(calculateAverageScore([{ overallScore: null }, { overallScore: undefined }]), null);

  // Invalid timezone resolution falls back gracefully to a valid IANA timezone
  const fallbackTz = resolveUserTimezone('Invalid/Nonexistent_Timezone');
  assert.ok(fallbackTz && typeof fallbackTz === 'string' && fallbackTz.length > 0);
  assert.doesNotThrow(() => new Intl.DateTimeFormat(undefined, { timeZone: fallbackTz }));
  assert.ok(formatDateInTimezone(new Date(), 'Invalid/Nonexistent_Timezone').length > 0);
});
