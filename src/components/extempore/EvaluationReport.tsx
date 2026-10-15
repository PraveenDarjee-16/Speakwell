'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  RotateCcw, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Clock, 
  Gauge, 
  FileText, 
  Volume2, 
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { EvaluationResult } from '@/types';
import { savePracticeSession } from '@/lib/data/sessions-service';
import { formatDuration, formatTimerDisplay } from '@/lib/speech/metrics';

interface EvaluationReportProps {
  result: EvaluationResult;
  onPracticeAgain: () => void;
  onTryAnotherTopic: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({
  result,
  onPracticeAgain,
  onTryAnotherTopic,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(result.durationSeconds || 0);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [savedLocally, setSavedLocally] = useState<boolean>(false);
  const [showFullTranscript, setShowFullTranscript] = useState<boolean>(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Stop audio immediately when component unmounts to prevent background sound or double audio
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback error:', err);
      });
      setIsPlayingAudio(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDuration = audioDuration || audioRef.current.duration || result.durationSeconds;
    const newTime = newPercent * targetDuration;
    audioRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
    setAudioProgress(newPercent * 100);
  };

  const formatAudioTime = (sec: number) => {
    return formatTimerDisplay(sec);
  };

  const handleCopyTranscript = () => {
    if (!result.transcript) return;
    navigator.clipboard.writeText(result.transcript);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSaveToNotebook = () => {
    savePracticeSession(result);
    setSavedLocally(true);
    setTimeout(() => setSavedLocally(false), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `speakwell-evaluation-${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getScoreTier = (score: number) => {
    if (score < 30) return { label: 'Disqualified / Incomplete', color: 'text-red-400 border-red-500/30 bg-red-500/10' };
    if (score < 50) return { label: 'Needs Critical Work', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    if (score < 65) return { label: 'Developing / Halting', color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10' };
    if (score < 78) return { label: 'Competent Baseline', color: 'text-zinc-300 border-white/10 bg-zinc-800/80' };
    if (score < 88) return { label: 'Strong / Placement Ready', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
    return { label: 'Exceptional / Executive', color: 'text-zinc-100 border-white/20 bg-zinc-800' };
  };

  const tier = getScoreTier(result.overallScore);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Disqualification / Low Content Notice */}
      {result.overallScore < 30 && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-red-200 text-sm">Incomplete / Disqualified Attempt</p>
            <p className="text-red-300/80 leading-relaxed">
              Only {result.wordCount} words detected across {formatDuration(result.durationSeconds)}. In an extempore round, silence or quitting after a few seconds leads to immediate disqualification. Practice holding the floor for at least 45 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner / Topic Details */}
      <div className="minimal-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            <span>Evaluation Completed</span>
            <span>•</span>
            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight">
            "{result.topicTitle}"
          </h1>
          <p className="text-xs text-zinc-400">
            Speech analyzed across fluency, vocabulary, grammar, and delivery.
          </p>
        </div>

        {/* Overall Score */}
        <div className="text-right shrink-0 space-y-1.5">
          <div className="text-4xl font-semibold font-mono text-zinc-100 leading-none">
            {result.overallScore}
            <span className="text-base text-zinc-500 font-normal ml-1">/100</span>
          </div>
          <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${tier.color}`}>
            {tier.label}
          </div>
        </div>
      </div>

      {/* Speaking Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="minimal-card p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Duration
          </span>
          <p className="text-base font-semibold font-mono text-zinc-200">
            {formatDuration(result.durationSeconds)}
          </p>
        </div>

        <div className="minimal-card p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Words
          </span>
          <p className="text-base font-semibold font-mono text-zinc-200">
            {result.wordCount}
          </p>
        </div>

        <div className="minimal-card p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
            <Gauge className="w-3 h-3" /> Pace
          </span>
          <p className="text-base font-semibold font-mono text-zinc-200">
            {result.wordsPerMinute} <span className="text-xs text-zinc-500 font-normal">wpm</span>
          </p>
        </div>

        <div className="minimal-card p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Fillers
          </span>
          <p className="text-base font-semibold font-mono text-zinc-200">
            {result.fillerWordPercentage}%
          </p>
        </div>
      </div>

      {/* Audio Playback Bar */}
      {result.audioUrl && (
        <div className="minimal-card p-4 space-y-2.5 text-xs">
          <audio
            ref={audioRef}
            src={result.audioUrl}
            preload="metadata"
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              setAudioCurrentTime(el.currentTime);
              const total = el.duration || audioDuration || result.durationSeconds;
              if (total > 0) {
                setAudioProgress((el.currentTime / total) * 100);
              }
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (el.duration && !isNaN(el.duration) && el.duration > 0) {
                setAudioDuration(el.duration);
              }
            }}
            onEnded={() => {
              setIsPlayingAudio(false);
              setAudioProgress(0);
              setAudioCurrentTime(0);
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
            }}
            onPause={() => setIsPlayingAudio(false)}
            onPlay={() => setIsPlayingAudio(true)}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                title={isPlayingAudio ? 'Pause' : 'Play'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4 fill-zinc-950" />
                ) : (
                  <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
                )}
              </button>

              <div>
                <span className="text-zinc-200 font-medium block">Audio Playback</span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration || result.durationSeconds)}
                </span>
              </div>
            </div>

            <a
              href={result.audioUrl}
              download={`speakwell-speech-${result.id}.wav`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer"
              title="Download high-quality 16-bit PCM WAV audio"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download (.wav)</span>
            </a>
          </div>

          {/* Interactive seek bar */}
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden cursor-pointer group relative border border-white/[0.04]"
          >
            <div
              style={{ width: `${Math.min(100, Math.max(0, audioProgress))}%` }}
              className="h-full bg-zinc-200 group-hover:bg-white transition-all duration-100"
            />
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="minimal-card p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Priority Focus</span>
          <ul className="space-y-1.5">
            {result.priorityImprovements?.map((p, idx) => (
              <li key={idx} className="text-zinc-300 leading-relaxed flex items-start gap-1.5">
                <span className="text-zinc-600 font-mono">{idx + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="minimal-card p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Strongest Part</span>
          <p className="text-zinc-300 italic leading-relaxed pt-0.5">
            "{result.strongestPart}"
          </p>
        </div>
      </div>

      {/* Rubric Breakdown */}
      <div className="minimal-card p-5 space-y-4">
        <span className="text-xs font-medium text-zinc-200 block">8-Criterion Breakdown</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.criteria?.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-300">{item.criterion}</span>
                  {item.status === 'estimated' && (
                    <span 
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]"
                      title="Estimated from speech recognition transcription"
                    >
                      Estimated
                    </span>
                  )}
                </div>
                <span className="font-mono text-zinc-400">{item.score}/100</span>
              </div>

              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${item.score}%` }}
                  className={`h-full ${
                    item.score < 35
                      ? 'bg-red-400'
                      : item.score < 60
                      ? 'bg-amber-400'
                      : 'bg-zinc-200'
                  }`}
                />
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed pt-0.5">
                {item.feedback}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Sentence Corrections */}
      {result.sentenceCorrections && result.sentenceCorrections.length > 0 && (
        <div className="minimal-card p-5 space-y-3">
          <span className="text-xs font-medium text-zinc-200 block">Grammar & Phrasing Corrections</span>

          <div className="space-y-2.5">
            {result.sentenceCorrections.map((corr, idx) => (
              <div key={idx} className="rounded-lg border border-white/[0.04] bg-zinc-900/50 p-3 space-y-2 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-zinc-900 border border-red-500/10">
                    <span className="text-[10px] font-mono text-red-400 uppercase block mb-0.5">Spoken:</span>
                    <p className="text-zinc-300">"{corr.original}"</p>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-emerald-500/15">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-0.5">Polished:</span>
                    <p className="text-zinc-200">"{corr.corrected}"</p>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {corr.category}: {corr.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Transcript */}
      <div className="minimal-card p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            <span>Transcript</span>
            {showFullTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopyTranscript}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{hasCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {showFullTranscript && (
          <div className="p-3 rounded bg-zinc-900 text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-line border border-white/[0.04]">
            {result.transcript}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="minimal-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToNotebook}
            className="px-3 py-1.5 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            {savedLocally ? 'Saved' : 'Save Session'}
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 rounded-md text-zinc-500 hover:text-zinc-300 cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPracticeAgain}
            className="px-3 py-1.5 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </button>

          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded-md font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
