'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  Square, 
  ArrowRight, 
  Lightbulb,
  Check
} from 'lucide-react';
import { InterviewQuestion, EvaluationResult } from '@/types';
import { INTERVIEW_QUESTIONS } from '@/data/interview-bank';
import { AudioRecorderService } from '@/lib/speech/recorder';
import { LiveSpeechRecognitionService } from '@/lib/speech/recognition';
import { countWords, calculateWpm } from '@/lib/speech/metrics';
import { savePracticeSession } from '@/lib/data/sessions-service';

type InterviewStep = 'setup' | 'interview' | 'report';

export default function MockInterviewPage() {
  const [step, setStep] = useState<InterviewStep>('setup');

  // Setup configuration
  const [targetRole, setTargetRole] = useState<string>('Associate Software Engineer');
  const [industry, setIndustry] = useState<string>('Technology & Software');
  const [experienceLevel, setExperienceLevel] = useState<'Entry Level / Fresher' | 'Mid Level' | 'Senior'>('Entry Level / Fresher');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Active session state
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answerInputType, setAnswerInputType] = useState<'voice' | 'type'>('voice');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  // Results collection
  const [completedAnswers, setCompletedAnswers] = useState<{
    questionId: string;
    question: string;
    transcript: string;
    feedback: string;
    starAdherenceScore: number;
    improvedModelAnswer: string;
  }[]>([]);

  // Services
  const recorderRef = React.useRef<AudioRecorderService | null>(null);
  const recognitionRef = React.useRef<LiveSpeechRecognitionService | null>(null);

  const startInterview = () => {
    let pool = INTERVIEW_QUESTIONS;
    if (selectedCategory !== 'All') {
      pool = pool.filter((q) => q.category === selectedCategory);
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount);
    setActiveQuestions(shuffled);
    setCurrentQIndex(0);
    setCompletedAnswers([]);
    setStep('interview');
  };

  const handleStartVoice = async () => {
    try {
      recorderRef.current = new AudioRecorderService();
      recognitionRef.current = new LiveSpeechRecognitionService();

      await recorderRef.current.startRecording();
      if (LiveSpeechRecognitionService.isSupported()) {
        recognitionRef.current.startListening((update) => {
          setLiveTranscript(update.transcript);
        });
      }
      setIsRecording(true);
    } catch (e) {
      console.warn('Microphone error:', e);
      setAnswerInputType('type');
    }
  };

  const handleStopVoice = async () => {
    setIsRecording(false);
    if (recorderRef.current) recorderRef.current.stopRecording().catch(() => {});
    if (recognitionRef.current) recognitionRef.current.stopListening();
  };

  const handleSubmitAnswer = async () => {
    const finalAnswer = answerInputType === 'voice' ? liveTranscript : typedAnswer;
    if (!finalAnswer || finalAnswer.trim().length < 15) return;

    setIsSubmitting(true);
    const activeQ = activeQuestions[currentQIndex];

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ.question,
          transcript: finalAnswer,
          targetRole,
          experienceLevel,
        }),
      });

      const data = await res.json();
      const answerRecord = {
        questionId: activeQ.id,
        question: activeQ.question,
        transcript: finalAnswer,
        feedback: data.feedback || 'Good structured response.',
        starAdherenceScore: data.starAdherenceScore || 80,
        improvedModelAnswer: data.improvedModelAnswer || activeQ.sampleGoodAnswer,
      };

      const allAnswers = [...completedAnswers, answerRecord];
      setCompletedAnswers(allAnswers);

      if (currentQIndex + 1 < activeQuestions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setTypedAnswer('');
        setLiveTranscript('');
      } else {
        setStep('report');
        const totalWords = allAnswers.reduce((sum, a) => sum + countWords(a.transcript), 0);
        const avgScore = Math.round(allAnswers.reduce((sum, a) => sum + a.starAdherenceScore, 0) / allAnswers.length);
        const estimatedDurationSeconds = Math.max(30, Math.round(totalWords / 2.2));
        const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `interview-${Date.now()}`;
        
        const interviewEvaluation: EvaluationResult = {
          id: sessionId,
          topicTitle: `Mock Interview: ${targetRole}`,
          sessionType: 'interview',
          durationSeconds: estimatedDurationSeconds,
          wordCount: totalWords,
          wordsPerMinute: calculateWpm(totalWords, estimatedDurationSeconds),
          overallScore: avgScore,
          criteria: [
            { criterion: 'Fluency', score: avgScore, weight: 25, status: 'evaluated', feedback: 'Structured interview communication.' },
            { criterion: 'Organization', score: avgScore, weight: 35, status: 'evaluated', feedback: 'STAR method response framing.' },
            { criterion: 'Clarity', score: avgScore, weight: 20, status: 'evaluated', feedback: 'Articulation of key technical and behavioral outcomes.' },
            { criterion: 'Topic Relevance', score: avgScore, weight: 20, status: 'evaluated', feedback: 'Direct relevance to target role requirements.' },
          ],
          strengths: [`Completed structured mock interview for ${targetRole}`],
          areasForImprovement: ['Continue refining STAR structure delivery'],
          priorityImprovements: [
            'Emphasize concrete results and metrics in answers',
            'Keep pauses deliberate and silent',
            'Vary vocabulary with role-specific keywords'
          ],
          strongestPart: allAnswers[0]?.transcript ? `"${allAnswers[0].transcript.slice(0, 100)}..."` : 'Interview responses',
          fillerWords: [],
          fillerWordPercentage: 0,
          repeatedPhrases: [],
          sentenceCorrections: [],
          vocabularyUpgrades: [],
          recommendedNextExercise: {
            title: 'Behavioral Impact & STAR Delivery',
            type: 'Interview Drill',
            reason: 'Strengthen metric-driven STAR responses.'
          },
          transcript: allAnswers.map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.transcript}`).join('\n\n'),
          createdAt: new Date().toISOString()
        };

        savePracticeSession(interviewEvaluation).catch((err) => console.warn('Could not save interview session:', err));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = activeQuestions[currentQIndex];
  const overallAvgScore = completedAnswers.length > 0
    ? Math.round(completedAnswers.reduce((sum, a) => sum + a.starAdherenceScore, 0) / completedAnswers.length)
    : 80;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* 1. SETUP STEP */}
      {step === 'setup' && (
        <div className="space-y-6 animate-fade-in">
          <div className="pb-2 border-b border-white/[0.06]">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
              Mock Interview Studio
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select your target role and simulate behavioral and technical interview questions with STAR method evaluation.
            </p>
          </div>

          <div className="minimal-card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Product Manager"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="Technology & Software">Technology & Software</option>
                  <option value="Consulting & Analytics">Consulting & Analytics</option>
                  <option value="Banking & Finance">Banking & Finance</option>
                  <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                  Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="Entry Level / Fresher">Entry Level / Fresher</option>
                  <option value="Mid Level">Mid Level (2-5 Years)</option>
                  <option value="Senior">Senior / Lead</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        questionCount === count
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {count} {count === 1 ? 'Question' : 'Questions'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STAR explanation banner */}
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] text-xs text-zinc-400 space-y-1">
              <span className="font-mono text-[11px] text-zinc-300 uppercase block">STAR Evaluation Framework</span>
              <p className="leading-relaxed">
                Answers will be evaluated for Situation (context), Task (your goal), Action (what you specifically did), and Result (tangible outcome).
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={startInterview}
                className="px-5 py-2.5 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Begin Mock Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE INTERVIEW STEP */}
      {step === 'interview' && currentQ && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Question {currentQIndex + 1} of {activeQuestions.length}</span>
            <span>{targetRole}</span>
          </div>

          <div className="minimal-card p-6 space-y-4">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              {currentQ.category}
            </span>
            <h2 className="text-xl font-medium text-zinc-100 leading-snug">
              "{currentQ.question}"
            </h2>

            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.04] text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
                <span>STAR Prompt Hints</span>
              </div>
              <ul className="space-y-1 text-zinc-400 pl-1 text-[11px] font-mono">
                <li><span className="text-zinc-500">S:</span> {currentQ.starContext.situationHint}</li>
                <li><span className="text-zinc-500">T:</span> {currentQ.starContext.taskHint}</li>
                <li><span className="text-zinc-500">A:</span> {currentQ.starContext.actionHint}</li>
                <li><span className="text-zinc-500">R:</span> {currentQ.starContext.resultHint}</li>
              </ul>
            </div>
          </div>

          {/* Answering Area */}
          <div className="minimal-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Response</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAnswerInputType('voice')}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    answerInputType === 'voice'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Mic
                </button>
                <button
                  onClick={() => setAnswerInputType('type')}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    answerInputType === 'type'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Type
                </button>
              </div>
            </div>

            {answerInputType === 'voice' ? (
              <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 text-center space-y-3">
                {!isRecording ? (
                  <button
                    onClick={handleStartVoice}
                    className="px-5 py-2.5 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Voice Answer</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-zinc-300 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Recording...</span>
                    </div>

                    <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 text-left min-h-[50px]">
                      {liveTranscript || 'Listening... Speak clearly.'}
                    </div>

                    <button
                      onClick={handleStopVoice}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-zinc-300" />
                      <span>Stop Recording</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your response using the STAR method..."
                rows={4}
                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || (answerInputType === 'voice' ? !liveTranscript.trim() : !typedAnswer.trim())}
                className="px-5 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isSubmitting ? 'Evaluating...' : currentQIndex + 1 < activeQuestions.length ? 'Next Question' : 'Complete Interview'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REPORT STEP */}
      {step === 'report' && (
        <div className="space-y-6 animate-fade-in">
          <div className="minimal-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Completed</span>
              <h2 className="text-xl font-medium text-zinc-100 mt-0.5">
                Interview Performance Summary
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                {targetRole} • {completedAnswers.length} Questions Evaluated
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-medium font-mono text-zinc-100">
                {overallAvgScore}
              </span>
              <span className="text-xs text-zinc-500 block font-mono">/ 100 STAR Score</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Evaluations & Model Answers
            </h3>

            {completedAnswers.map((ans, idx) => (
              <div key={idx} className="minimal-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/[0.04]">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-500">Question {idx + 1}</span>
                    <h4 className="text-sm font-medium text-zinc-200 mt-0.5">"{ans.question}"</h4>
                  </div>
                  <span className="font-mono text-xs text-zinc-300">
                    {ans.starAdherenceScore} / 100
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04] text-xs space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Your Answer:</span>
                  <p className="text-zinc-300 italic">"{ans.transcript}"</p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04] text-xs space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Interviewer Feedback:</span>
                  <p className="text-zinc-300">{ans.feedback}</p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04] text-xs space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Model STAR Response:</span>
                  <p className="text-zinc-400 italic">"{ans.improvedModelAnswer}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setStep('setup')}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              Practice Again
            </button>

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
