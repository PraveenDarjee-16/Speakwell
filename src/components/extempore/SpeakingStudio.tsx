'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Pause, 
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Loader2,
  FileText
} from 'lucide-react';
import { ExtemporeTopic, EvaluationResult, FinalizedRecordingSession } from '@/types';
import { AudioRecorderService } from '@/lib/speech/recorder';
import { LiveSpeechRecognitionService, LiveTranscriptUpdate } from '@/lib/speech/recognition';
import { 
  normalizeTranscript, 
  countWords, 
  calculateWpm, 
  formatTimerDisplay 
} from '@/lib/speech/metrics';
import { AudioVisualizer } from '@/components/common/AudioVisualizer';
import { savePracticeSession } from '@/lib/data/sessions-service';

interface SpeakingStudioProps {
  topic: ExtemporeTopic;
  durationSeconds: number;
  examMode: boolean;
  onEvaluationComplete: (result: EvaluationResult) => void;
  onCancel: () => void;
}

export const SpeakingStudio: React.FC<SpeakingStudioProps> = ({
  topic,
  durationSeconds,
  examMode,
  onEvaluationComplete,
  onCancel,
}) => {
  // Recording State
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(durationSeconds);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lowSpeechWarning, setLowSpeechWarning] = useState<{
    transcript: string;
    wordCount: number;
    duration: number;
  } | null>(null);

  // Transcription State
  const [showLiveFeedback, setShowLiveFeedback] = useState<boolean>(!examMode);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveWordCount, setLiveWordCount] = useState<number>(0);
  const [liveFillers, setLiveFillers] = useState<{ word: string; count: number }[]>([]);
  const [manualTranscriptMode, setManualTranscriptMode] = useState<boolean>(false);
  const [manualTranscriptText, setManualTranscriptText] = useState<string>('');

  // Service References & Monotonic Clocks
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const recognitionRef = useRef<LiveSpeechRecognitionService | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const sessionTotalPausedMsRef = useRef<number>(0);
  const sessionPausedAtRef = useRef<number | null>(null);
  const previousAudioUrlRef = useRef<string | null>(null);
  const isFinishingRef = useRef<boolean>(false);

  // Initialize Services
  useEffect(() => {
    recorderRef.current = new AudioRecorderService();
    recognitionRef.current = new LiveSpeechRecognitionService();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recorderRef.current) recorderRef.current.discardRecording();
      if (recognitionRef.current) recognitionRef.current.stopListening();
    };
  }, []);

  // Monotonic timer helpers
  const getActiveElapsedSeconds = (): number => {
    if (sessionStartTimeRef.current === 0) return 0;
    const now = performance.now();
    const extraPaused = sessionPausedAtRef.current !== null ? (now - sessionPausedAtRef.current) : 0;
    const activeMs = now - sessionStartTimeRef.current - (sessionTotalPausedMsRef.current + extraPaused);
    return Math.max(0, activeMs / 1000);
  };

  const startTimerInterval = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const elapsed = getActiveElapsedSeconds();
      const remaining = Math.max(0, Math.ceil(durationSeconds - elapsed));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        handleAutoStop();
      }
    }, 250);
  };

  const initiateRecording = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = async () => {
    setErrorMessage(null);
    setLowSpeechWarning(null);
    isFinishingRef.current = false;

    try {
      if (recorderRef.current) {
        await recorderRef.current.startRecording((vol: number) => {
          setVolumeLevel(vol);
        });
      }

      if (recognitionRef.current && LiveSpeechRecognitionService.isSupported()) {
        recognitionRef.current.startListening((update: LiveTranscriptUpdate) => {
          setLiveTranscript(update.transcript);
          setLiveWordCount(update.wordCount);
          setLiveFillers(update.detectedFillers);
        });
      }

      // Initialize monotonic reference timestamps ONLY when recording starts successfully
      sessionStartTimeRef.current = performance.now();
      sessionTotalPausedMsRef.current = 0;
      sessionPausedAtRef.current = null;

      setIsRecording(true);
      setIsPaused(false);
      setHasStarted(true);
      setTimeRemaining(durationSeconds);

      startTimerInterval();
    } catch (err: unknown) {
      console.error('Recording initialization error:', err);
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(
        msg || 'Microphone access denied. Please allow microphone permissions in your browser.'
      );
      setIsRecording(false);
      setHasStarted(false);
    }
  };

  const handlePauseResume = () => {
    if (!recorderRef.current) return;

    if (isPaused) {
      recorderRef.current.resumeRecording();
      if (sessionPausedAtRef.current !== null) {
        sessionTotalPausedMsRef.current += performance.now() - sessionPausedAtRef.current;
        sessionPausedAtRef.current = null;
      }
      setIsPaused(false);
      startTimerInterval();
    } else {
      recorderRef.current.pauseRecording();
      sessionPausedAtRef.current = performance.now();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleAutoStop = () => {
    handleFinishRecording();
  };

  const resumeFromLowSpeech = () => {
    setLowSpeechWarning(null);
    if (recorderRef.current) {
      recorderRef.current.resumeRecording();
    }
    if (sessionPausedAtRef.current !== null) {
      sessionTotalPausedMsRef.current += performance.now() - sessionPausedAtRef.current;
      sessionPausedAtRef.current = null;
    }
    setIsPaused(false);
    startTimerInterval();
  };

  const proceedWithEvaluation = async (transcriptToEvaluate: string) => {
    isFinishingRef.current = true;
    setLowSpeechWarning(null);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      // 1. Stop speech recognition immediately
      if (recognitionRef.current) {
        recognitionRef.current.stopListening();
      }

      // 2. Stop audio recording and obtain audio metadata duration
      let audioBlob: Blob | null = null;
      let audioUrl: string | null = null;
      let audioMetadataDuration: number | null = null;
      let recorderActiveDuration: number = 0;

      if (recorderRef.current) {
        try {
          const recResult = await recorderRef.current.stopRecording();
          audioBlob = recResult.audioBlob;
          audioUrl = recResult.audioUrl;
          audioMetadataDuration = recResult.durationSeconds;
          recorderActiveDuration = recResult.activeDurationSeconds;
        } catch (e: unknown) {
          console.warn('Audio capture stop notice:', e);
        }
      }

      // 3. Compute authoritative duration: prioritize decoded audio metadata, fallback to monotonic timer
      const monotonicDuration = getActiveElapsedSeconds();
      let authoritativeDuration = 0;
      if (audioMetadataDuration !== null && audioMetadataDuration > 0.2) {
        authoritativeDuration = Math.round(audioMetadataDuration * 10) / 10;
      } else if (recorderActiveDuration > 0.2) {
        authoritativeDuration = Math.round(recorderActiveDuration * 10) / 10;
      } else if (monotonicDuration > 0) {
        authoritativeDuration = Math.round(monotonicDuration * 10) / 10;
      }

      // 4. Normalize transcript and compute metrics with shared utilities
      const normalizedTranscript = normalizeTranscript(transcriptToEvaluate);
      const wordCount = countWords(normalizedTranscript);
      const wordsPerMinute = calculateWpm(wordCount, authoritativeDuration);

      // 5. Clean up previous object URL if any
      if (previousAudioUrlRef.current && previousAudioUrlRef.current !== audioUrl) {
        try {
          URL.revokeObjectURL(previousAudioUrlRef.current);
        } catch {}
      }
      previousAudioUrlRef.current = audioUrl;

      // 6. Build finalized recording session
      const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const finalizedSession: FinalizedRecordingSession = {
        sessionId,
        topicId: topic.id,
        topicTitle: topic.title,
        transcript: normalizedTranscript,
        wordCount,
        durationSeconds: authoritativeDuration,
        activeDurationSeconds: recorderActiveDuration || authoritativeDuration,
        wordsPerMinute,
        audioBlob,
        audioUrl,
        startedAt: new Date(Date.now() - authoritativeDuration * 1000).toISOString(),
        endedAt: new Date().toISOString(),
      };

      // 7. Request evaluation from API
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          topicTitle: topic.title,
          transcript: normalizedTranscript,
          durationSeconds: authoritativeDuration,
          activeDurationSeconds: finalizedSession.activeDurationSeconds,
          sessionType: 'extempore',
          recordingSession: finalizedSession,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Evaluation server returned an error.');
      }

      const evaluationData: EvaluationResult = await response.json();

      // Ensure evaluated result binds to the finalized session
      evaluationData.durationSeconds = authoritativeDuration;
      evaluationData.activeDurationSeconds = finalizedSession.activeDurationSeconds;
      evaluationData.wordCount = wordCount;
      evaluationData.wordsPerMinute = wordsPerMinute;
      if (audioUrl) {
        evaluationData.audioUrl = audioUrl;
      }
      evaluationData.recordingSession = finalizedSession;

      // Automatically persist completed practice attempt (idempotent)
      await savePracticeSession(evaluationData);

      setIsEvaluating(false);
      onEvaluationComplete(evaluationData);
    } catch (err: unknown) {
      console.error('Evaluation processing failed:', err);
      setIsEvaluating(false);
      isFinishingRef.current = false;
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(msg || 'Speech evaluation service encountered an error.');
    }
  };

  const handleFinishRecording = async () => {
    if (isFinishingRef.current) return;

    let finalTranscript = liveTranscript;
    if (recognitionRef.current) {
      const captured = recognitionRef.current.getCurrentTranscript();
      if (captured && captured.length > finalTranscript.length) {
        finalTranscript = captured;
      }
    }

    if (manualTranscriptMode && manualTranscriptText.trim()) {
      finalTranscript = manualTranscriptText.trim();
    }

    finalTranscript = normalizeTranscript(finalTranscript);
    const wordCount = countWords(finalTranscript);
    const elapsedActive = getActiveElapsedSeconds();

    // Check if speech is critically short (< 15 words)
    if (wordCount < 15 && !lowSpeechWarning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (recorderRef.current) {
        recorderRef.current.pauseRecording();
      }
      sessionPausedAtRef.current = performance.now();
      setIsPaused(true);
      setLowSpeechWarning({
        transcript: finalTranscript,
        wordCount,
        duration: Math.round(elapsedActive * 10) / 10
      });
      return;
    }

    await proceedWithEvaluation(finalTranscript);
  };

  const handleDiscard = () => {
    isFinishingRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.discardRecording();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stopListening();
    }
    if (previousAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(previousAudioUrlRef.current);
      } catch {}
      previousAudioUrlRef.current = null;
    }

    sessionStartTimeRef.current = 0;
    sessionTotalPausedMsRef.current = 0;
    sessionPausedAtRef.current = null;

    setIsRecording(false);
    setIsPaused(false);
    setHasStarted(false);
    setTimeRemaining(durationSeconds);
    setLiveTranscript('');
    setLiveWordCount(0);
    setLiveFillers([]);
    setManualTranscriptText('');
    setManualTranscriptMode(false);
    setLowSpeechWarning(null);
    setErrorMessage(null);
  };

  const formatTime = (seconds: number) => formatTimerDisplay(seconds);

  const totalFillerCount = liveFillers.reduce((sum, f) => sum + f.count, 0);
  const activeElapsed = getActiveElapsedSeconds();
  const progressPercent = Math.max(0, Math.min(100, (activeElapsed / durationSeconds) * 100));

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-8xl font-semibold font-mono text-zinc-100">
            {countdown}
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-4">
            Begin speaking...
          </span>
        </div>
      )}

      {/* Evaluating Overlay */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto" />
          <h3 className="text-base font-medium text-zinc-100">
            Analyzing speech rigorously...
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs">
            Evaluating pacing, grammar integrity, vocabulary diversity, and topic depth.
          </p>
        </div>
      )}

      {/* Low Speech Volume Confirmation Modal */}
      {lowSpeechWarning && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4 animate-fade-in text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium text-zinc-100">
                  Insufficient speech detected
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Only <span className="font-semibold text-zinc-200">{lowSpeechWarning.wordCount} words</span> were recorded across {Math.round(lowSpeechWarning.duration)} seconds. In real extempore examinations, speech under 20-30 words results in disqualification.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] text-xs text-zinc-300 italic max-h-24 overflow-y-auto">
              {lowSpeechWarning.transcript ? `"${lowSpeechWarning.transcript}"` : '(No spoken words captured)'}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={resumeFromLowSpeech}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer"
              >
                Keep speaking
              </button>
              <button
                onClick={() => proceedWithEvaluation(lowSpeechWarning.transcript)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
              >
                Submit anyway (Strict reality check)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Topic Banner */}
      <div className="minimal-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            {topic.category} • {topic.difficulty}
          </span>
          <h2 className="text-sm font-medium text-zinc-200 mt-0.5">
            "{topic.title}"
          </h2>
        </div>

        <button
          onClick={() => setShowLiveFeedback(!showLiveFeedback)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
        >
          {showLiveFeedback ? <Eye className="w-3 h-3 text-zinc-300" /> : <EyeOff className="w-3 h-3 text-zinc-500" />}
          <span>{showLiveFeedback ? 'Feedback On' : 'Feedback Off'}</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-zinc-900 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Core Studio */}
      <div className="minimal-card p-8 flex flex-col items-center text-center space-y-6">
        {/* Timer */}
        <div className="space-y-1">
          <div className="text-5xl sm:text-6xl font-semibold font-mono tracking-tight text-zinc-100">
            {formatTime(timeRemaining)}
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
            {isRecording ? (isPaused ? 'Paused' : 'Time Left') : 'Ready'}
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full max-w-md h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full transition-all duration-300 ${
              timeRemaining < 15 ? 'bg-red-400' : 'bg-zinc-200'
            }`}
          />
        </div>

        {/* Audio Visualizer */}
        <div className="w-full max-w-md py-2">
          <AudioVisualizer
            volume={volumeLevel}
            isRecording={isRecording}
            isPaused={isPaused}
          />
        </div>

        {/* Live Metrics */}
        {showLiveFeedback && isRecording && (
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
              Words: <strong className="text-zinc-200">{liveWordCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
              Fillers: <strong className={totalFillerCount > 4 ? 'text-amber-400' : 'text-zinc-200'}>{totalFillerCount}</strong>
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          {!hasStarted ? (
            <button
              onClick={initiateRecording}
              className="px-6 py-2.5 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Mic className="w-4 h-4 text-zinc-950" />
              <span>Start Speaking</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleFinishRecording}
                className="px-5 py-2 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Finish & Analyze</span>
              </button>

              <button
                onClick={handleDiscard}
                className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {!hasStarted && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Transcription Stream */}
      {hasStarted && (
        <div className="minimal-card p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-zinc-500 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isRecording && !isPaused ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                Live Transcription
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                liveWordCount < 15
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : liveWordCount < 45
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {liveWordCount} words {liveWordCount < 15 ? '(low volume)' : ''}
              </span>
            </div>

            <button
              onClick={() => {
                setManualTranscriptMode(!manualTranscriptMode);
                if (!manualTranscriptText) setManualTranscriptText(liveTranscript);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {manualTranscriptMode ? 'Auto mode' : 'Manual edit'}
            </button>
          </div>

          {!manualTranscriptMode ? (
            <div className="p-3 rounded-xl bg-zinc-900 border border-white/[0.04] text-xs text-zinc-300 min-h-[60px] leading-relaxed">
              {liveTranscript || (
                <div className="space-y-1 text-zinc-500 italic">
                  <p>Listening to microphone... Speech will transcribe here in real time.</p>
                  <p className="text-[11px] not-italic text-zinc-600">
                    Tip: Speak continuously for at least 45 seconds to achieve a passing evaluation.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={manualTranscriptText}
              onChange={(e) => setManualTranscriptText(e.target.value)}
              placeholder="Edit transcript text..."
              rows={3}
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          )}
        </div>
      )}
    </div>
  );
};
