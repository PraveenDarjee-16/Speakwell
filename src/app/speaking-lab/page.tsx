'use client';

import React, { useState } from 'react';
import { 
  Volume2
} from 'lucide-react';
import { 
  CONVERSATION_SCENARIOS, 
  GROUP_DISCUSSION_TOPICS, 
  PRONUNCIATION_ITEMS, 
  GRAMMAR_PATTERNS 
} from '@/data/speaking-modules';
import { playPronunciation } from '@/lib/speech/tts';

type LabTab = 'conversations' | 'group-discussion' | 'pronunciation' | 'grammar';

export default function SpeakingLabPage() {
  const [activeTab, setActiveTab] = useState<LabTab>('conversations');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(CONVERSATION_SCENARIOS[0].id);
  const [selectedGDId, setSelectedGDId] = useState<string>(GROUP_DISCUSSION_TOPICS[0].id);
  const [playingPronunId, setPlayingPronunId] = useState<string | null>(null);

  // Grammar drill interactive state
  const [grammarAnswers, setGrammarAnswers] = useState<{ [key: string]: number }>({});
  const [grammarFeedback, setGrammarFeedback] = useState<{ [key: string]: boolean }>({});

  const handlePlayAudio = async (id: string, text: string) => {
    setPlayingPronunId(id);
    await playPronunciation(text);
    setPlayingPronunId(null);
  };

  const handleSelectGrammarOption = (patternId: string, optionIdx: number, correctIdx: number) => {
    setGrammarAnswers((prev) => ({ ...prev, [patternId]: optionIdx }));
    setGrammarFeedback((prev) => ({ ...prev, [patternId]: optionIdx === correctIdx }));
  };

  const selectedScenario = CONVERSATION_SCENARIOS.find((s) => s.id === selectedScenarioId) || CONVERSATION_SCENARIOS[0];
  const selectedGD = GROUP_DISCUSSION_TOPICS.find((g) => g.id === selectedGDId) || GROUP_DISCUSSION_TOPICS[0];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
          Speaking Lab & Drills
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Targeted micro-drills for roleplay conversations, group discussions, phonetics, and speech grammar.
        </p>
      </div>

      {/* Segmented Navigation */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'conversations'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Conversations
        </button>

        <button
          onClick={() => setActiveTab('group-discussion')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'group-discussion'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Group Discussion
        </button>

        <button
          onClick={() => setActiveTab('pronunciation')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'pronunciation'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Pronunciation Lab
        </button>

        <button
          onClick={() => setActiveTab('grammar')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'grammar'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Grammar in Speech
        </button>
      </div>

      {/* TAB 1: CONVERSATIONS */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-zinc-500 block">Scenarios</span>
            <div className="space-y-1.5">
              {CONVERSATION_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer text-xs ${
                    sc.id === selectedScenario.id
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                      : 'bg-zinc-900/40 border-white/[0.04] text-zinc-400 hover:bg-zinc-900/80'
                  }`}
                >
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-0.5">{sc.category}</span>
                  <p className="font-medium text-zinc-200">{sc.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 minimal-card p-6 space-y-5">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase block mb-1">
                {selectedScenario.category}
              </span>
              <h2 className="text-xl font-medium text-zinc-100">{selectedScenario.title}</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{selectedScenario.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04]">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Partner Role</span>
                <p className="font-medium text-zinc-200 mt-0.5">{selectedScenario.partnerRole}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04]">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Your Role</span>
                <p className="font-medium text-zinc-200 mt-0.5">{selectedScenario.userRole}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-white/[0.04] space-y-1 text-xs">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Partner Starter Line</span>
              <p className="text-zinc-200 italic leading-relaxed">"{selectedScenario.starterPrompt}"</p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase block">Recommended Phrases</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedScenario.keyPhrasesToUse.map((phrase, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-zinc-900/60 border border-white/[0.04] text-zinc-300">
                    "{phrase}"
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUP DISCUSSION */}
      {activeTab === 'group-discussion' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="minimal-card p-6 space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Solo GD Simulation</span>
            <h2 className="text-xl font-medium text-zinc-100">"{selectedGD.topic}"</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{selectedGD.background}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedGD.perspectives.map((p, idx) => (
              <div key={idx} className="minimal-card p-5 space-y-2 text-xs">
                <span className="font-mono text-zinc-500 uppercase block">{p.role}</span>
                <p className="text-zinc-300 leading-relaxed">{p.viewpoint}</p>
                <div className="p-2.5 rounded bg-zinc-900 border border-white/[0.04] text-zinc-400 italic font-mono text-[11px]">
                  "{p.keyArgument}"
                </div>
              </div>
            ))}
          </div>

          <div className="minimal-card p-5 space-y-3">
            <span className="text-xs font-medium text-zinc-200 block">Discussion Tactics</span>
            <div className="space-y-3 text-xs">
              {selectedGD.discussionPhases.map((phase, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1">
                  <span className="font-mono text-[11px] text-zinc-400 uppercase block">{phase.phase}</span>
                  <p className="text-zinc-300">{phase.suggestedAction}</p>
                  <p className="text-zinc-400 italic pt-1 font-mono text-[11px]">"{phase.sampleOpening}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRONUNCIATION */}
      {activeTab === 'pronunciation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRONUNCIATION_ITEMS.map((item) => (
            <div key={item.id} className="minimal-card p-5 space-y-3 flex flex-col justify-between text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{item.type}</span>
                  <span>{item.focusSound}</span>
                </div>

                <h3 className="text-base font-medium text-zinc-100">{item.title}</h3>

                <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04] font-mono text-sm text-zinc-200">
                  {item.content}
                </div>

                <p className="text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300 font-medium">Tip:</strong> {item.audioGuideTip}
                </p>

                <p className="text-zinc-500 leading-relaxed text-[11px]">
                  Avoid: {item.commonMistake}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handlePlayAudio(item.id, item.content)}
                  className="w-full py-2 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen to Reference</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: GRAMMAR IN SPEECH */}
      {activeTab === 'grammar' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {GRAMMAR_PATTERNS.map((pattern) => {
            const currentSelected = grammarAnswers[pattern.id];
            const isAnswered = currentSelected !== undefined;
            const isCorrect = grammarFeedback[pattern.id];

            return (
              <div key={pattern.id} className="minimal-card p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{pattern.category}</span>
                </div>

                <h3 className="text-base font-medium text-zinc-100">{pattern.ruleTitle}</h3>
                <p className="text-zinc-400 leading-relaxed">{pattern.explanation}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-zinc-900 border border-red-500/10 text-zinc-400">
                    <span className="text-[10px] font-mono text-red-400 block mb-0.5">Spoken Slip:</span>
                    "{pattern.incorrectExample}"
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900 border border-emerald-500/15 text-zinc-200">
                    <span className="text-[10px] font-mono text-emerald-400 block mb-0.5">Standard Form:</span>
                    "{pattern.correctExample}"
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">Drill Question</span>
                  <p className="text-zinc-200 font-medium">{pattern.practiceDrill.prompt}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {pattern.practiceDrill.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectGrammarOption(pattern.id, oIdx, pattern.practiceDrill.correctIndex)}
                        className={`p-2 rounded text-xs border transition-colors cursor-pointer ${
                          currentSelected === oIdx
                            ? oIdx === pattern.practiceDrill.correctIndex
                              ? 'bg-zinc-800 border-emerald-500 text-emerald-300 font-medium'
                              : 'bg-zinc-800 border-red-500 text-red-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {isAnswered && (
                    <p className={`text-[11px] pt-1 ${isCorrect ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {pattern.practiceDrill.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
