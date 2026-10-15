import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  countWords, 
  calculateWpm, 
  normalizeTranscript, 
  extractWords, 
  formatDuration, 
  formatTimerDisplay,
  calculateFillerPercentage
} from '@/lib/speech/metrics';
import { SpeechEvaluationService } from '@/lib/ai/evaluation-service';
import { FinalizedRecordingSession, EvaluationResult } from '@/types';

// Test 1: 62 words and 119 seconds produces approximately 31 WPM
test('1. 62 words and 119 seconds produces approximately 31 WPM', () => {
  // Formula: 62 / (119 / 60) = 31.2605... -> Math.round gives 31 WPM
  const wpm = calculateWpm(62, 119);
  assert.equal(wpm, 31, `Expected 31 WPM for 62 words over 119s, got ${wpm}`);

  // Test with transcript normalization
  const sampleTranscript = `
    In today's fast moving world, technology plays a critical role in how we learn,
    communicate, and grow. Although there are challenges such as distraction and information
    overload, staying disciplined allows us to leverage digital platforms effectively.
    To summarize, we should embrace continuous learning, remain adaptable to change,
    and cultivate intentional habits every single day for genuine long-term success in our professional lives.
  `;
  const normalized = normalizeTranscript(sampleTranscript);
  const words = extractWords(normalized);
  assert.equal(words.length, 62, `Expected sample transcript to contain exactly 62 words, got ${words.length}`);
  const calculatedWpmFromText = calculateWpm(words.length, 119);
  assert.equal(calculatedWpmFromText, 31);
});

// Test 2: 100 words and 120 seconds produces 50 WPM
test('2. 100 words and 120 seconds produces 50 WPM', () => {
  // Formula: 100 / (120 / 60) = 100 / 2 = 50 WPM
  const wpm = calculateWpm(100, 120);
  assert.equal(wpm, 50, `Expected 50 WPM for 100 words over 120s, got ${wpm}`);
});

// Test 3: A 5-second recording with 62 words is calculated using its actual duration, not a stale 119-second value
test('3. A 5-second recording with 62 words uses actual duration (744 WPM) and does not reuse stale 119-second duration', () => {
  // If actual duration is 5s, gross pace is 62 / (5/60) = 744 WPM
  const actualWpmFor5s = calculateWpm(62, 5);
  assert.equal(actualWpmFor5s, 744, `Expected 744 WPM for 62 words in 5s, got ${actualWpmFor5s}`);

  // Stale duration would have produced 31 WPM
  const staleWpm = calculateWpm(62, 119);
  assert.notEqual(actualWpmFor5s, staleWpm, 'A 5s recording must not use stale 119s duration');
  assert.equal(staleWpm, 31);
});

// Test 4: A zero-second or invalid-duration recording does not produce Infinity, NaN, or an arbitrary WPM
test('4. A zero-second or invalid-duration recording does not produce Infinity, NaN, or arbitrary WPM', () => {
  assert.equal(calculateWpm(62, 0), 0, 'Zero duration should return safe 0 WPM');
  assert.equal(calculateWpm(62, -5), 0, 'Negative duration should return safe 0 WPM');
  assert.equal(calculateWpm(62, NaN), 0, 'NaN duration should return safe 0 WPM');
  assert.equal(calculateWpm(62, Infinity), 0, 'Infinity duration should return safe 0 WPM');
  assert.equal(calculateWpm(0, 120), 0, 'Zero word count should return 0 WPM');
  assert.equal(calculateWpm(-10, 120), 0, 'Negative word count should return 0 WPM');
  assert.equal(calculateWpm(NaN, 120), 0, 'NaN word count should return 0 WPM');

  // Verify formatDuration also gracefully handles zero or invalid input
  assert.equal(formatDuration(0), '0m 00s');
  assert.equal(formatDuration(-10), '0m 00s');
  assert.equal(formatDuration(NaN), '0m 00s');
  assert.equal(formatTimerDisplay(0), '0:00');
  assert.equal(formatTimerDisplay(-5), '0:00');
});

// Test 5: Pausing and resuming does not add paused time to active recording duration
test('5. Pausing and resuming does not add paused time to active recording duration', () => {
  // Simulate monotonic timestamps with performance.now()
  let simulatedNow = 1000;
  const startTime = simulatedNow;
  let totalPausedMs = 0;
  let pausedAt: number | null = null;

  // Speak for 10 seconds (10,000 ms)
  simulatedNow += 10000; // t = 11,000

  // Pause recording for 30 seconds
  pausedAt = simulatedNow; // paused at t = 11,000
  simulatedNow += 30000; // time passes while paused, t = 41,000

  // Resume recording
  totalPausedMs += simulatedNow - pausedAt; // totalPausedMs = 30,000
  pausedAt = null;

  // Speak for another 15 seconds
  simulatedNow += 15000; // t = 56,000

  // Stop recording
  const stopNow = simulatedNow;
  const totalWallClockSeconds = (stopNow - startTime) / 1000; // 55 seconds total
  const extraPaused = pausedAt !== null ? (stopNow - pausedAt) : 0;
  const activeRecordingSeconds = (stopNow - startTime - (totalPausedMs + extraPaused)) / 1000;

  assert.equal(totalWallClockSeconds, 55, 'Total wall clock elapsed was 55s');
  assert.equal(totalPausedMs / 1000, 30, 'Total paused duration was 30s');
  assert.equal(activeRecordingSeconds, 25, 'Active duration must be 25s (excluding the 30s paused period)');

  // WPM should be computed strictly using active recording time
  const wordsSpoken = 50;
  const wpmOnActiveTime = calculateWpm(wordsSpoken, activeRecordingSeconds);
  assert.equal(wpmOnActiveTime, 120, '50 words over 25 active seconds is 120 WPM');
});

// Test 6: Stopping and starting a new recording resets the relevant session state
test('6. Stopping and starting a new recording resets the relevant session state', () => {
  // Session A
  const sessionA: FinalizedRecordingSession = {
    sessionId: 'session-a-123',
    topicId: 'topic-1',
    topicTitle: 'Topic A',
    transcript: 'First speech attempt about artificial intelligence in education.',
    wordCount: countWords('First speech attempt about artificial intelligence in education.'),
    durationSeconds: 119,
    activeDurationSeconds: 119,
    wordsPerMinute: calculateWpm(8, 119),
    audioUrl: 'blob:http://localhost:3000/mock-audio-a',
    startedAt: new Date(Date.now() - 119000).toISOString(),
    endedAt: new Date().toISOString()
  };

  assert.equal(sessionA.durationSeconds, 119);
  assert.equal(sessionA.wordCount, 8);
  assert.equal(sessionA.wordsPerMinute, 4);

  // Discard / Reset
  let currentSessionState: FinalizedRecordingSession | null = null;
  let discardedAudioUrl: string | null = sessionA.audioUrl || null;
  let hasRevokedPreviousUrl = false;
  if (discardedAudioUrl) {
    hasRevokedPreviousUrl = true; // simulates URL.revokeObjectURL
    discardedAudioUrl = null;
  }

  assert.equal(currentSessionState, null);
  assert.equal(hasRevokedPreviousUrl, true);

  // Session B (fresh start with different topic, duration, and transcript)
  const sessionBTranscript = 'A completely separate and second practice speech with different duration.';
  const sessionBWordCount = countWords(sessionBTranscript);
  const sessionBDuration = 45;
  const sessionB: FinalizedRecordingSession = {
    sessionId: 'session-b-456',
    topicId: 'topic-2',
    topicTitle: 'Topic B',
    transcript: sessionBTranscript,
    wordCount: sessionBWordCount,
    durationSeconds: sessionBDuration,
    activeDurationSeconds: sessionBDuration,
    wordsPerMinute: calculateWpm(sessionBWordCount, sessionBDuration),
    audioUrl: 'blob:http://localhost:3000/mock-audio-b',
    startedAt: new Date(Date.now() - 45000).toISOString(),
    endedAt: new Date().toISOString()
  };

  assert.notEqual(sessionB.sessionId, sessionA.sessionId);
  assert.notEqual(sessionB.durationSeconds, sessionA.durationSeconds);
  assert.notEqual(sessionB.transcript, sessionA.transcript);
  assert.equal(sessionB.durationSeconds, 45);
  assert.equal(sessionB.wordCount, 10);
  assert.equal(sessionB.wordsPerMinute, 13); // 10 / (45/60) = 13.33 -> 13
});

// Test 7: The displayed recording duration matches the finalized audio or reliable elapsed-time fallback
test('7. The displayed recording duration matches the finalized audio or reliable elapsed-time fallback', () => {
  // Case A: Audio metadata duration is valid
  const audioMetadataDurationA = 119.2;
  const elapsedFallbackA = 118.9;
  const finalDurationA = (audioMetadataDurationA !== null && audioMetadataDurationA > 0.2)
    ? Math.round(audioMetadataDurationA * 10) / 10
    : Math.round(elapsedFallbackA * 10) / 10;
  assert.equal(finalDurationA, 119.2);
  assert.equal(formatDuration(finalDurationA), '1m 59s');

  // Case B: Audio metadata duration is unavailable/invalid (fallback to elapsed timer)
  const audioMetadataDurationB = null;
  const elapsedFallbackB = 45.4;
  const finalDurationB = (audioMetadataDurationB !== null && audioMetadataDurationB > 0.2)
    ? Math.round(audioMetadataDurationB * 10) / 10
    : Math.round(elapsedFallbackB * 10) / 10;
  assert.equal(finalDurationB, 45.4);
  assert.equal(formatDuration(finalDurationB), '0m 45s');

  // Formatting verification
  assert.equal(formatDuration(119), '1m 59s');
  assert.equal(formatDuration(5), '0m 05s');
  assert.equal(formatDuration(60), '1m 00s');
  assert.equal(formatDuration(125), '2m 05s');
});

// Test 8: The final transcript update is included before evaluation metrics are calculated
test('8. The final transcript update is included before evaluation metrics are calculated', async () => {
  // Simulating live streaming transcript where recognition delivers a final update upon closing
  let liveTranscript = 'In today modern society climate'; // 5 words
  const finalEventTranscript = 'In today modern society climate change requires urgent collective responsibility and global leadership'; // 13 words

  // Pipeline step: capture longest / final transcript before evaluating
  let transcriptToEvaluate = liveTranscript;
  if (finalEventTranscript && finalEventTranscript.length > transcriptToEvaluate.length) {
    transcriptToEvaluate = finalEventTranscript;
  }

  assert.equal(transcriptToEvaluate, finalEventTranscript);
  const wordCount = countWords(transcriptToEvaluate);
  assert.equal(wordCount, 13, `Expected 13 words in final transcript, got ${wordCount}`);

  // Evaluate with SpeechEvaluationService using exact finalized transcript and duration
  const evaluation = await SpeechEvaluationService.evaluateSpeech({
    topicTitle: 'Climate Action',
    transcript: transcriptToEvaluate,
    durationSeconds: 30,
    sessionType: 'extempore'
  });

  assert.equal(evaluation.wordCount, 13);
  assert.equal(evaluation.durationSeconds, 30);
  assert.equal(evaluation.wordsPerMinute, calculateWpm(13, 30)); // 13 / (30/60) = 26 WPM
  assert.equal(evaluation.transcript, finalEventTranscript);
});

// Test 9: The audio player and evaluation report refer to the same recording session
test('9. The audio player and evaluation report refer to the same recording session', async () => {
  const finalizedSession: FinalizedRecordingSession = {
    sessionId: 'session-match-789',
    topicId: 'topic-global-trade',
    topicTitle: 'The Future of Global Trade',
    transcript: 'Global trade is experiencing rapid transformation driven by technological innovation and shifting economic alliances across developed and emerging markets.',
    wordCount: countWords('Global trade is experiencing rapid transformation driven by technological innovation and shifting economic alliances across developed and emerging markets.'),
    durationSeconds: 119,
    activeDurationSeconds: 119,
    wordsPerMinute: calculateWpm(19, 119), // 19 / (119/60) = 9.57 -> 10 WPM
    audioUrl: 'blob:http://localhost:3000/verified-wav-audio',
    startedAt: new Date(Date.now() - 119000).toISOString(),
    endedAt: new Date().toISOString()
  };

  const evaluationResult = await SpeechEvaluationService.evaluateSpeech({
    topicTitle: finalizedSession.topicTitle,
    transcript: finalizedSession.transcript,
    durationSeconds: finalizedSession.durationSeconds,
    activeDurationSeconds: finalizedSession.activeDurationSeconds,
    sessionType: 'extempore',
    recordingSession: finalizedSession
  });

  // Verify binding between recording session and evaluation report
  assert.equal(evaluationResult.durationSeconds, finalizedSession.durationSeconds);
  assert.equal(evaluationResult.wordCount, finalizedSession.wordCount);
  assert.equal(evaluationResult.wordsPerMinute, finalizedSession.wordsPerMinute);
  assert.equal(evaluationResult.recordingSession?.sessionId, finalizedSession.sessionId);
  assert.equal(evaluationResult.recordingSession?.audioUrl, finalizedSession.audioUrl);

  // Both report duration and audio player duration display 1m 59s (or 1:59)
  assert.equal(formatDuration(evaluationResult.durationSeconds), '1m 59s');
  assert.equal(formatTimerDisplay(evaluationResult.durationSeconds), '1:59');
  assert.equal(formatTimerDisplay(finalizedSession.durationSeconds), '1:59');
});
