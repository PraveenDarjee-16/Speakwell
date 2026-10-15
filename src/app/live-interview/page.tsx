'use client';

import React, { useState } from 'react';
import { 
  LiveInterviewConfig, 
  ConversationTurn, 
  LiveInterviewEvaluation 
} from '@/types';
import { TopicSelectionScreen } from '@/components/live-interview/TopicSelectionScreen';
import { LiveInterviewRoom } from '@/components/live-interview/LiveInterviewRoom';
import { LiveInterviewReport } from '@/components/live-interview/LiveInterviewReport';
import { LiveInterviewHistory } from '@/components/live-interview/LiveInterviewHistory';
import { saveLiveInterview } from '@/lib/data/live-interview-service';
import { Loader2 } from 'lucide-react';

export default function LiveInterviewPage() {
  const [view, setView] = useState<'config' | 'interview' | 'evaluating' | 'report' | 'history'>('config');
  const [config, setConfig] = useState<LiveInterviewConfig | null>(null);
  const [evaluation, setEvaluation] = useState<LiveInterviewEvaluation | null>(null);
  const [evaluatingError, setEvaluatingError] = useState<string | null>(null);

  // Start interview from configuration screen
  const handleStartInterview = (newConfig: LiveInterviewConfig) => {
    setConfig(newConfig);
    setView('interview');
  };

  // Finish interview and trigger multi-turn evaluation
  const handleFinishInterview = async (turns: ConversationTurn[], durationSeconds: number) => {
    if (!config) return;

    setView('evaluating');
    setEvaluatingError(null);

    try {
      const res = await fetch('/api/live-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          config,
          turns,
          durationSeconds
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate evaluation (${res.status})`);
      }

      const evalData: LiveInterviewEvaluation = await res.json();
      setEvaluation(evalData);

      // Persist to Supabase / local demo storage
      await saveLiveInterview(evalData);

      setView('report');
    } catch (err: any) {
      console.error('Interview evaluation error:', err);
      setEvaluatingError(err.message || 'Evaluation generation failed. Please retry.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* 1. Configuration Screen */}
      {view === 'config' && (
        <TopicSelectionScreen
          onStartInterview={handleStartInterview}
          onViewHistory={() => setView('history')}
        />
      )}

      {/* 2. Conversational Live Room */}
      {view === 'interview' && config && (
        <LiveInterviewRoom
          config={config}
          onFinishInterview={handleFinishInterview}
          onCancelInterview={() => setView('config')}
        />
      )}

      {/* 3. Evaluating State */}
      {view === 'evaluating' && (
        <div className="max-w-xl mx-auto py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center mx-auto text-cyan-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-100">Analyzing Your Live Interview</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Evaluating your multi-turn conversation across 8 competencies, checking question relevance, grammar constructions, and pacing metrics...
            </p>
          </div>

          {evaluatingError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 space-y-2">
              <p>{evaluatingError}</p>
              <button
                onClick={() => setView('interview')}
                className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 cursor-pointer"
              >
                Back to Interview
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Post-Interview Comprehensive Report */}
      {view === 'report' && evaluation && (
        <LiveInterviewReport
          evaluation={evaluation}
          onRestart={() => setView('config')}
          onViewHistory={() => setView('history')}
        />
      )}

      {/* 5. Live Interview History Archive */}
      {view === 'history' && (
        <LiveInterviewHistory
          onSelectInterview={(selected) => {
            setEvaluation(selected);
            setView('report');
          }}
          onNewInterview={() => setView('config')}
        />
      )}
    </div>
  );
}
