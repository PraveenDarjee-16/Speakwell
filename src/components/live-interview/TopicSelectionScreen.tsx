'use client';

import React, { useState, useEffect } from 'react';
import { 
  LiveInterviewCategory, 
  LiveInterviewPurpose, 
  LiveInterviewDifficulty, 
  LiveInterviewPersonality, 
  LiveInterviewConfig 
} from '@/types';
import { 
  CATEGORY_METADATA, 
  PURPOSE_METADATA, 
  PERSONALITY_METADATA, 
  PREDEFINED_TOPICS,
  PredefinedTopic 
} from '@/data/live-interview-topics';
import { InterviewerVoiceService, VoiceOption } from '@/lib/speech/interviewer-voice';
import { 
  Sparkles, 
  Mic, 
  Clock, 
  Gauge, 
  Volume2, 
  Sliders, 
  ChevronRight, 
  Layers, 
  Target, 
  MessageSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface TopicSelectionScreenProps {
  onStartInterview: (config: LiveInterviewConfig) => void;
  onViewHistory: () => void;
}

export const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({
  onStartInterview,
  onViewHistory
}) => {
  // Config state
  const [category, setCategory] = useState<LiveInterviewCategory>('artificial_intelligence');
  const [topic, setTopic] = useState<string>('Will Artificial Intelligence create more jobs than it replaces?');
  const [purpose, setPurpose] = useState<LiveInterviewPurpose>('english_fluency');
  const [difficulty, setDifficulty] = useState<LiveInterviewDifficulty>('intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [customDuration, setCustomDuration] = useState<string>('5');
  const [personality, setPersonality] = useState<LiveInterviewPersonality>('friendly_mentor');

  // Speech voice settings
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);

  // Load browser voices
  useEffect(() => {
    const voiceService = InterviewerVoiceService.getInstance();
    setVoiceSupported(voiceService.isSupported());

    async function loadVoices() {
      const available = await voiceService.getVoices();
      setVoices(available);
      if (available.length > 0) {
        // Default to a natural or first voice
        const preferred = available.find(v => v.isNatural) || available[0];
        setSelectedVoiceURI(preferred.voiceURI);
      }
    }
    loadVoices();
  }, []);

  // Update selected topic when category changes
  const handleCategoryChange = (cat: LiveInterviewCategory) => {
    setCategory(cat);
    if (cat === 'custom') {
      setTopic('');
    } else {
      const matched = PREDEFINED_TOPICS.find(t => t.category === cat);
      if (matched) {
        setTopic(matched.title);
        setPurpose(matched.defaultPurpose);
        setDifficulty(matched.recommendedDifficulty);
      }
    }
  };

  const handleSelectTopicPreset = (preset: PredefinedTopic) => {
    setTopic(preset.title);
    setCategory(preset.category);
    setPurpose(preset.defaultPurpose);
    setDifficulty(preset.recommendedDifficulty);
  };

  // Test speaking audio
  const handleTestVoice = async () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    const voiceService = InterviewerVoiceService.getInstance();

    const sampleGreeting = personality === 'friendly_mentor'
      ? "Hello there! I am your AI mentor. I'm ready whenever you are!"
      : personality === 'challenging_interviewer'
      ? "Welcome. I will be probing your arguments and testing your assumptions today."
      : "Good day. Welcome to your professional live interview session.";

    await voiceService.speak(sampleGreeting, {
      voiceURI: selectedVoiceURI,
      rate: speakingRate,
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false)
    });
  };

  const handleStart = () => {
    const finalDuration = durationMinutes === -1 ? Math.max(1, parseInt(customDuration) || 5) : durationMinutes;
    const finalTopic = topic.trim() || 'General Spoken Communication Practice';

    const chosenVoice = voices.find(v => v.voiceURI === selectedVoiceURI);

    onStartInterview({
      topic: finalTopic,
      category,
      purpose,
      difficulty,
      durationMinutes: finalDuration,
      personality,
      voiceURI: selectedVoiceURI,
      voiceName: chosenVoice?.name,
      speakingRate
    });
  };

  const filteredPresets = PREDEFINED_TOPICS.filter(t => t.category === category);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice-Driven Conversational AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Live AI Interview Studio
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Experience an interactive, voice-driven mock interview. The AI speaks aloud, listens to your reasoning, and asks dynamic follow-up questions tailored to your answers.
            </p>
          </div>

          <button
            onClick={onViewHistory}
            className="px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Interview History</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topic & Objective (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Topic Category Selection */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">1</span>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Select Topic Category
                </h2>
              </div>
              <span className="text-xs text-zinc-500">{CATEGORY_METADATA[category]?.label}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_METADATA) as LiveInterviewCategory[]).map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-zinc-900/40 hover:bg-zinc-800/40 border-white/[0.05] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="block text-xs font-medium text-zinc-100">{meta.label}</span>
                    <span className="block text-[10px] text-zinc-500 truncate mt-0.5">{meta.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Discussion Topic Prompt */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">2</span>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Discussion Subject / Topic
                </h2>
              </div>
              <span className="text-xs text-zinc-500">
                {category === 'custom' ? 'Custom prompt' : 'Curated topic'}
              </span>
            </div>

            {/* Topic Input Field */}
            <div className="space-y-2">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Enter discussion prompt, behavioral interview question, or debate motion..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/[0.08] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all resize-none"
              />
            </div>

            {/* Topic Presets for current category */}
            {filteredPresets.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-zinc-500 block uppercase">Suggested Prompts in this Category:</span>
                <div className="space-y-1.5">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectTopicPreset(preset)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                        topic === preset.title
                          ? 'bg-cyan-950/40 border-cyan-600/50 text-cyan-200'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/60 border-white/[0.04] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium line-clamp-1">{preset.title}</span>
                        {topic === preset.title && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Interview Purpose & Goal */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">3</span>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Interview Purpose & Objective
                </h2>
              </div>
              <Target className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(PURPOSE_METADATA) as LiveInterviewPurpose[]).map((purp) => {
                const meta = PURPOSE_METADATA[purp];
                const isSelected = purpose === purp;
                return (
                  <button
                    key={purp}
                    onClick={() => setPurpose(purp)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-cyan-500/50 text-white ring-1 ring-cyan-500/30'
                        : 'bg-zinc-900/40 hover:bg-zinc-800/40 border-white/[0.05] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="block text-xs font-medium text-zinc-100">{meta.label}</span>
                    <span className="block text-[11px] text-zinc-400 mt-1 line-clamp-2">{meta.objective}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Personality, Voice & Duration Controls */}
        <div className="space-y-6">
          {/* Step 4: AI Interviewer Personality */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">4</span>
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Interviewer Persona
              </h2>
            </div>

            <div className="space-y-2.5">
              {(Object.keys(PERSONALITY_METADATA) as LiveInterviewPersonality[]).map((pKey) => {
                const p = PERSONALITY_METADATA[pKey];
                const isSelected = personality === pKey;
                return (
                  <button
                    key={pKey}
                    onClick={() => setPersonality(pKey)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-cyan-500/50 text-white ring-1 ring-cyan-500/30'
                        : 'bg-zinc-900/40 hover:bg-zinc-800/40 border-white/[0.05] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100">{p.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-zinc-400">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Difficulty & Duration */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">5</span>
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Pacing & Difficulty
              </h2>
            </div>

            {/* Difficulty Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-500">Proficiency Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as LiveInterviewDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                      difficulty === diff
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                        : 'bg-zinc-900/70 text-zinc-400 border-white/[0.05] hover:text-zinc-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Pills */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-mono uppercase text-zinc-500">Interview Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                        : 'bg-zinc-900/70 text-zinc-400 border-white/[0.05] hover:text-zinc-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 6: Spoken Voice Settings */}
          <div className="minimal-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">6</span>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Spoken AI Voice
                </h2>
              </div>
              <Volume2 className="w-4 h-4 text-cyan-400" />
            </div>

            {!voiceSupported && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
                Browser SpeechSynthesis is not supported on this browser. Responses will be displayed in text.
              </div>
            )}

            {/* Voice Dropdown */}
            {voices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-500">Synthesizer Voice</label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-zinc-200 outline-none focus:border-cyan-500"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){v.isNatural ? ' [Natural]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speed Rate Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono uppercase text-zinc-500">Speaking Speed</span>
                <span className="font-mono text-zinc-300 font-semibold">{speakingRate.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-2">
                {[0.8, 0.9, 1.0, 1.1, 1.2].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSpeakingRate(r)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                      Math.abs(speakingRate - r) < 0.05
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                        : 'bg-zinc-900 border-white/[0.04] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Preview Button */}
            <div className="pt-2">
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice || !voiceSupported}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isTestingVoice ? 'text-cyan-400 animate-pulse' : ''}`} />
                <span>{isTestingVoice ? 'Speaking voice sample...' : 'Test Interviewer Voice'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] text-[10px] text-zinc-500 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>Speech is synthesized client-side using browser voices with zero latency. No paid API keys required.</span>
            </div>
          </div>

          {/* Prominent Start Interview CTA */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              disabled={!topic.trim()}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-zinc-950 font-semibold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Mic className="w-4 h-4 text-zinc-950 group-hover:scale-110 transition-transform" />
              <span>Start Live Interview</span>
              <ChevronRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] text-center text-zinc-500 mt-2 font-mono">
              Microphone permission will be requested inside the interview room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
