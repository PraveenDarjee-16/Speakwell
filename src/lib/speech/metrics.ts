/**
 * Speech metrics and transcript processing utilities for SpeakWell.
 * Single source of truth for word counting, speaking rate (WPM), duration formatting,
 * and filler word metrics.
 */

/**
 * Normalizes transcript text by cleaning extra whitespace,
 * normalizing smart apostrophes, and trimming.
 */
export function normalizeTranscript(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // Normalize smart single quotes / apostrophes
    .replace(/[\u201C\u201D]/g, '"') // Normalize smart double quotes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Accurately extracts word tokens from transcript text.
 * Ignores empty strings, whitespace, and punctuation-only tokens (e.g. "...", "?", "-").
 * Words with apostrophes (e.g. "don't", "it's", "O'Connor") are counted as single words.
 */
export function extractWords(text: string | null | undefined): string[] {
  const normalized = normalizeTranscript(text);
  if (!normalized) return [];

  // Match words containing alphabetical characters, optionally with internal apostrophes or hyphens
  const matches = normalized.toLowerCase().match(/\b[a-z0-9]+(?:['’\-][a-z0-9]+)*\b/g);
  return matches || [];
}

/**
 * Counts the number of real words in the transcript.
 */
export function countWords(text: string | null | undefined): number {
  return extractWords(text).length;
}

/**
 * Calculates gross Words Per Minute (WPM) based on measured word count and duration in seconds.
 * 
 * Formula: gross WPM = wordCount / (durationSeconds / 60)
 * 
 * Guards:
 * - If durationSeconds <= 0 or is invalid, returns 0.
 * - If wordCount <= 0, returns 0.
 * - Never returns Infinity, NaN, or negative numbers.
 */
export function calculateWpm(wordCount: number, durationSeconds: number): number {
  if (!Number.isFinite(wordCount) || wordCount <= 0) return 0;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;

  const minutes = durationSeconds / 60;
  if (minutes <= 0) return 0;

  const rawWpm = wordCount / minutes;
  if (!Number.isFinite(rawWpm)) return 0;

  return Math.round(rawWpm);
}

/**
 * Formats a duration in seconds to human-readable string: e.g. "1m 59s" or "0m 05s".
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0m 00s';
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

/**
 * Formats a duration in seconds into a digital timer display: e.g. "1:59" or "0:05".
 */
export function formatTimerDisplay(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Calculates the percentage of filler words relative to total words.
 * Returns 0 if wordCount is <= 0.
 */
export function calculateFillerPercentage(fillerCount: number, wordCount: number): number {
  if (!Number.isFinite(fillerCount) || fillerCount <= 0) return 0;
  if (!Number.isFinite(wordCount) || wordCount <= 0) return 0;

  const pct = (fillerCount / wordCount) * 100;
  return Math.round(pct * 10) / 10;
}
