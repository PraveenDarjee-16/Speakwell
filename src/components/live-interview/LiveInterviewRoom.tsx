'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LiveInterviewConfig, 
  ConversationTurn, 
  LiveInterviewEvaluation 
} from '@/types';
import { InterviewerVoiceService } from '@/lib/speech/interviewer-voice';
import { LiveSpeechRecognitionService, LiveTranscriptUpdate } from '@/lib/speech/recognition';
import { AudioRecorderService } from '@/lib/speech/recorder';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  HelpCircle, 
  Send, 
  Edit3, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Check, 
  X,
  Bot,
  User,
  Radio,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface LiveInterviewRoomProps {
  config: LiveInterviewConfig;
  onFinishInterview: (turns: ConversationTurn[], durationSeconds: number) => void;
  onCancelInterview: () => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({
  config,
  onFinishInterview,
  onCancelInterview
}) => {
  // Conversational turns
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string>('');

  // Audio / Speech Synthesis state
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Candidate Recording / Recognition state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [isTextFallbackOpen, setIsTextFallbackOpen] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [editableTranscript, setEditableTranscript] = useState<string>('');

  // Timing state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const totalDurationSeconds = config.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  // References
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const voiceService = useRef(InterviewerVoiceService.getInstance());
  const recognitionService = useRef<LiveSpeechRecognitionService | null>(null);
  const audioRecorder = useRef<AudioRecorderService | null>(null);
  const turnStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll transcript container
  const scrollToBottom = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [turns, liveTranscript, interimText, aiThinking, scrollToBottom]);

  // Clean cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      voiceService.current.stop();
      if (recognitionService.current) {
        recognitionService.current.stopListening();
      }
      if (audioRecorder.current) {
        audioRecorder.current.stopRecording().catch(() => {});
      }
    };
  }, []);

  // Main Session Elapsed Timer
  useEffect(() => {
    if (isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDurationSeconds && prev < totalDurationSeconds) {
          // Time expired alert or auto-prompt
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPaused, totalDurationSeconds]);

  // Speak AI text aloud helper
  const speakAiResponse = useCallback(async (text: string) => {
    if (isMuted) return;

    setIsAiSpeaking(true);
    await voiceService.current.speak(text, {
      voiceURI: config.voiceURI,
      rate: config.speakingRate,
      isMuted,
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => setIsAiSpeaking(false),
      onError: () => setIsAiSpeaking(false)
    });
  }, [config.voiceURI, config.speakingRate, isMuted]);

  // Initialize Interview with Greeting & Question 1
  useEffect(() => {
    let isMounted = true;

    async function initInterview() {
      setAiThinking(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/live-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            config
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to initialize AI Interview (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          const firstAiTurn: ConversationTurn = {
            id: `turn-ai-0`,
            speaker: 'ai',
            text: data.text,
            timestamp: new Date().toISOString(),
            questionIndex: 1
          };

          setTurns([firstAiTurn]);
          setCurrentAiQuestion(data.text);
          setAiThinking(false);

          // Speak initial greeting aloud
          speakAiResponse(data.text);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Initialization error:', err);
          setAiThinking(false);
          setErrorMessage(err.message || 'Could not connect to AI interviewer. Click retry to try again.');
        }
      }
    }

    initInterview();

    return () => {
      isMounted = false;
    };
  }, [config, speakAiResponse]);

  // Replay Current AI Question
  const handleReplayQuestion = () => {
    if (isRecording) return;
    if (currentAiQuestion) {
      speakAiResponse(currentAiQuestion);
    }
  };

  // Request Clarification / Simplification
  const handleRequestClarification = async () => {
    if (isRecording || aiThinking || !currentAiQuestion) return;

    voiceService.current.stop();
    setIsAiSpeaking(false);
    setAiThinking(true);

    try {
      const res = await fetch('/api/live-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clarify',
          config,
          turns,
          lastQuestion: currentAiQuestion
        })
      });

      if (!res.ok) throw new Error('Clarification request failed');

      const data = await res.json();
      const clarifyTurn: ConversationTurn = {
        id: `turn-ai-clarify-${Date.now()}`,
        speaker: 'ai',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      setTurns((prev) => [...prev, clarifyTurn]);
      setCurrentAiQuestion(data.text);
      setAiThinking(false);
      speakAiResponse(data.text);
    } catch (err: any) {
      setAiThinking(false);
      setErrorMessage('Could not clarify question. Please try asking in text or respond directly.');
    }
  };

  // Toggle Mute AI Audio
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        voiceService.current.stop();
        setIsAiSpeaking(false);
      }
      return next;
    });
  };

  // Toggle Pause Session
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (recognitionService.current && isRecording) {
      if (nextPaused) {
        recognitionService.current.pauseListening();
      } else {
        recognitionService.current.resumeListening();
      }
    }
  };

  // START Recording Candidate Answer
  const handleStartRecording = async () => {
    // 1. Critical rule: Immediately stop any AI speech before recording
    voiceService.current.stop();
    setIsAiSpeaking(false);
    setErrorMessage(null);

    // 2. Clear interim state
    setLiveTranscript('');
    setInterimText('');
    turnStartTimeRef.current = Date.now();

    // 3. Start Live Speech Recognition
    if (LiveSpeechRecognitionService.isSupported()) {
      if (!recognitionService.current) {
        recognitionService.current = new LiveSpeechRecognitionService();
      }

      const started = recognitionService.current.startListening((update: LiveTranscriptUpdate) => {
        setLiveTranscript(update.transcript);
        setInterimText(update.interimTranscript);
      });

      if (started) {
        setIsRecording(true);
        setMicPermissionGranted(true);
      } else {
        setIsRecording(false);
        setIsTextFallbackOpen(true);
        setErrorMessage('Could not start speech recognition. You can type your answer below.');
      }
    } else {
      setIsTextFallbackOpen(true);
      setErrorMessage('Speech recognition is not supported in this browser. Please use text answer input.');
    }
  };

  // STOP Recording Candidate Answer
  const handleStopRecording = () => {
    if (!isRecording) return;

    let finalSpoken = liveTranscript;
    if (recognitionService.current) {
      finalSpoken = recognitionService.current.stopListening();
    }

    setIsRecording(false);
    const resolvedText = (finalSpoken || liveTranscript || interimText).trim();

    if (resolvedText) {
      setEditableTranscript(resolvedText);
      setReviewModalOpen(true);
    } else {
      setErrorMessage('No speech detected. Please speak clearly into your mic or type your answer.');
    }
  };

  // Submit Answer to AI Engine
  const handleSubmitAnswer = async (answerText: string) => {
    const cleaned = answerText.trim();
    if (!cleaned) return;

    setReviewModalOpen(false);
    setLiveTranscript('');
    setInterimText('');
    setManualText('');
    setIsTextFallbackOpen(false);
    setErrorMessage(null);

    const answerDuration = Math.max(1, Math.round((Date.now() - turnStartTimeRef.current) / 1000));
    const wordsCount = cleaned.split(/\s+/).filter(Boolean).length;

    // Add user turn
    const userTurn: ConversationTurn = {
      id: `turn-user-${Date.now()}`,
      speaker: 'user',
      text: cleaned,
      timestamp: new Date().toISOString(),
      durationSeconds: answerDuration,
      wordCount: wordsCount
    };

    const updatedTurns = [...turns, userTurn];
    setTurns(updatedTurns);
    setAiThinking(true);

    try {
      const res = await fetch('/api/live-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          config,
          turns: updatedTurns,
          userAnswer: cleaned
        })
      });

      if (!res.ok) {
        throw new Error(`AI response failed (${res.status})`);
      }

      const data = await res.json();
      const nextAiTurn: ConversationTurn = {
        id: `turn-ai-${Date.now()}`,
        speaker: 'ai',
        text: data.text,
        timestamp: new Date().toISOString(),
        questionIndex: updatedTurns.filter(t => t.speaker === 'ai').length + 1
      };

      setTurns((prev) => [...prev, nextAiTurn]);
      setCurrentAiQuestion(data.text);
      setAiThinking(false);

      // Speak next question aloud
      speakAiResponse(data.text);
    } catch (err: any) {
      console.error('Follow-up error:', err);
      setAiThinking(false);
      setErrorMessage(err.message || 'Failed to generate next interview question. You can retry or end session.');
    }
  };

  // Manual text submission fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      handleSubmitAnswer(manualText);
    }
  };

  // End Interview and proceed to evaluation
  const handleEndInterview = () => {
    voiceService.current.stop();
    if (recognitionService.current) recognitionService.current.stopListening();
    setIsRecording(false);
    setIsAiSpeaking(false);

    onFinishInterview(turns, elapsedSeconds);
  };

  // Formatting helpers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplayedText = (liveTranscript + ' ' + interimText).trim();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Session Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className={`w-4 h-4 ${isRecording ? 'animate-pulse text-red-400' : isAiSpeaking ? 'animate-pulse text-cyan-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100 line-clamp-1">{config.topic}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-400 capitalize">
                {config.difficulty}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Persona: <span className="text-zinc-300 capitalize">{config.personality.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Remaining Time Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className={remainingSeconds < 60 ? 'text-red-400 font-bold' : 'text-zinc-200'}>
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Pause / Resume */}
          <button
            onClick={handleTogglePause}
            className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06] hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={isPaused ? 'Resume Session' : 'Pause Session'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Mute/Unmute Audio */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-red-950/40 border-red-800/50 text-red-300'
                : 'bg-zinc-900 border-white/[0.06] hover:bg-zinc-800 text-zinc-300'
            }`}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* End Interview */}
          <button
            onClick={handleEndInterview}
            disabled={turns.length < 2}
            className="px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-xs font-medium text-red-200 transition-colors cursor-pointer disabled:opacity-40"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Database or Runtime Error banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded text-red-400 hover:text-red-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Conversation Transcript Box */}
      <div className="minimal-card p-4 sm:p-6 bg-zinc-950/70 border border-white/[0.08] min-h-[420px] max-h-[500px] overflow-y-auto space-y-4 rounded-2xl">
        {turns.length === 0 && aiThinking && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-zinc-500 text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>AI Interviewer is preparing your opening question...</span>
          </div>
        )}

        {turns.map((turn, index) => {
          const isAi = turn.speaker === 'ai';
          return (
            <div
              key={turn.id || index}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-zinc-900/90 border border-white/[0.08] text-zinc-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-cyan-900/60 to-indigo-900/60 border border-cyan-700/40 text-cyan-50 rounded-tr-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-white/[0.06] text-[10px] font-mono text-zinc-400">
                  <span className="font-semibold">{isAi ? 'AI Interviewer' : 'You (Candidate)'}</span>
                  <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="whitespace-pre-wrap">{turn.text}</p>

                {/* Per-turn audio replay button for AI */}
                {isAi && index === turns.length - 1 && (
                  <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center gap-2">
                    <button
                      onClick={handleReplayQuestion}
                      disabled={isAiSpeaking || isRecording}
                      className="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>{isAiSpeaking ? 'Speaking...' : 'Replay Audio'}</span>
                    </button>

                    <button
                      onClick={handleRequestClarification}
                      disabled={isAiSpeaking || isRecording || aiThinking}
                      className="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      <span>Clarify Question</span>
                    </button>
                  </div>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live recognition interim bubble while user is recording */}
        {isRecording && (
          <div className="flex items-start justify-end gap-3">
            <div className="max-w-[75%] p-4 rounded-2xl bg-zinc-900 border border-cyan-500/50 text-cyan-200 text-xs sm:text-sm rounded-tr-sm animate-pulse">
              <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-cyan-500/20 text-[10px] font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Listening Live...</span>
              </div>
              <p className="italic">
                {currentDisplayedText || 'Speak your answer clearly into the microphone...'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0 mt-0.5 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* AI is thinking bubble */}
        {aiThinking && turns.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/[0.08] text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Interviewer is analyzing your response and formulating a follow-up...</span>
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Interaction & Mic Controls Dock */}
      <div className="minimal-card p-6 bg-zinc-950 border border-white/[0.08] space-y-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
              {isRecording ? 'Recording active' : isAiSpeaking ? 'AI Speaking aloud' : 'Your Turn to Respond'}
            </span>
            <p className="text-xs text-zinc-400">
              {isRecording 
                ? 'Speak naturally. Click Stop when finished to review or submit.' 
                : isAiSpeaking 
                ? 'Listening to interviewer... Mic starts automatically when ready or click below.'
                : 'Click Record to speak your answer, or open the text box.'}
            </p>
          </div>

          {/* Big Action Buttons */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={aiThinking || isPaused}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-zinc-950 font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-4 h-4 text-zinc-950" />
                <span>Record Answer</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-red-500/20 transition-all flex items-center gap-2.5 cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </button>
            )}

            {/* Text Input Drawer Toggle */}
            <button
              onClick={() => setIsTextFallbackOpen(!isTextFallbackOpen)}
              disabled={isRecording || aiThinking}
              className="p-3 rounded-xl bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Type answer instead"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Text Input Fallback */}
        {isTextFallbackOpen && !isRecording && (
          <form onSubmit={handleManualSubmit} className="pt-3 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Text Answer Input</span>
              <button
                type="button"
                onClick={() => setIsTextFallbackOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-[11px]"
              >
                Hide
              </button>
            </div>
            <div className="flex items-center gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your response directly if microphone is unavailable..."
                rows={2}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500 resize-none"
              />
              <button
                type="submit"
                disabled={!manualText.trim() || aiThinking}
                className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Review / Edit Transcript Modal before Submitting */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg minimal-card p-6 bg-zinc-950 border border-zinc-800 space-y-4 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Review Your Spoken Answer</h3>
                <p className="text-[11px] text-zinc-400">
                  Verify or edit the transcribed text before submitting to the interviewer.
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 outline-none focus:border-cyan-500 transition-all leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleStartRecording}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitAnswer(editableTranscript)}
                  disabled={!editableTranscript.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
