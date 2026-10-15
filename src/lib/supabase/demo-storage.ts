import { UserProfile, EvaluationResult, MistakeItem, UserVocabProgress, InterviewSession } from '@/types';
import { calculateUserStatistics } from '@/lib/stats/user-stats';

const PROFILE_KEY = 'speakwell_demo_profile';
const SESSIONS_KEY = 'speakwell_demo_sessions';
const MISTAKES_KEY = 'speakwell_demo_mistakes';
const VOCAB_PROGRESS_KEY = 'speakwell_demo_vocab_progress';
const INTERVIEW_SESSIONS_KEY = 'speakwell_demo_interviews';
const DEMO_MODE_ACTIVE_KEY = 'speakwell_demo_active';

export const INITIAL_DEMO_PROFILE: UserProfile = {
  id: 'demo-user-123',
  email: 'learner.demo@speakwell.ai',
  fullName: 'Praveen Sharma',
  proficiencyLevel: 'Intermediate',
  primaryGoal: 'Campus Placements & Job Interviews',
  targetRole: 'Associate Software Engineer',
  dailyTargetMinutes: 20,
  streakDays: 0,
  totalSpeakingMinutes: 0,
  totalSessions: 0,
  averageScore: 0,
  createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
};

export const INITIAL_DEMO_SESSIONS: EvaluationResult[] = [
  {
    id: 'demo-session-1',
    topicId: 'tech-1',
    topicTitle: 'The Impact of Generative AI on Entry-Level Tech Careers',
    sessionType: 'extempore',
    durationSeconds: 118,
    wordCount: 242,
    wordsPerMinute: 123,
    overallScore: 82,
    criteria: [
      { criterion: 'Fluency', score: 84, weight: 15, status: 'evaluated', feedback: 'Natural cadence with steady flow; minor pauses during the conclusion.' },
      { criterion: 'Grammar', score: 80, weight: 20, status: 'evaluated', feedback: 'Strong complex sentence structures. Watch subject-verb agreement with collective nouns.' },
      { criterion: 'Vocabulary', score: 85, weight: 15, status: 'evaluated', feedback: 'Effective use of domain terminology like "orchestration" and "paradigm shift".' },
      { criterion: 'Pronunciation & Intelligibility', score: 80, weight: 15, status: 'estimated', feedback: 'Clear diction throughout; careful with /θ/ sound in "thinking".' },
      { criterion: 'Clarity', score: 86, weight: 10, status: 'evaluated', feedback: 'Points were delivered crisply with easy-to-follow logic.' },
      { criterion: 'Topic Relevance', score: 88, weight: 10, status: 'evaluated', feedback: 'Addressed the core thesis directly without veering off-topic.' },
      { criterion: 'Organization', score: 82, weight: 10, status: 'evaluated', feedback: 'Introduction, two supportive arguments, and a structured concluding remark.' },
      { criterion: 'Delivery', score: 78, weight: 5, status: 'evaluated', feedback: 'Confident volume and energetic opening.' }
    ],
    strengths: [
      'Strong opening hook establishing the transition from syntax to system design',
      'Articulate use of professional vocabulary such as "orchestration" and "automation"',
      'Maintained consistent speaking pace of 123 WPM without rushing'
    ],
    areasForImprovement: [
      'Reduce hesitation fillers ("um", "you know") during mid-speech transitions',
      'Ensure every introduced problem has a paired actionable solution',
      'Strengthen the closing sentence with a memorable parting takeaway'
    ],
    priorityImprovements: [
      'Replace filler phrases with deliberate, silent two-second pauses',
      'Double-check singular vs plural verb agreements when summarizing collective groups',
      'Vary vocal inflection when moving between contrasting viewpoints'
    ],
    strongestPart: 'Your analysis of how AI shifts junior responsibilities from writing boilerplate to validating architectural correctness was deeply compelling.',
    fillerWords: [
      { word: 'um', count: 4 },
      { word: 'like', count: 3 },
      { word: 'you know', count: 2 }
    ],
    fillerWordPercentage: 3.7,
    repeatedPhrases: ['in terms of', 'as we know'],
    sentenceCorrections: [
      {
        original: 'Every junior engineers must learns how to verify code.',
        corrected: 'Every junior engineer must learn how to verify code.',
        explanation: '"Every" precedes a singular noun ("engineer") and a modal auxiliary takes base verb ("must learn").',
        category: 'Subject-Verb Agreement'
      },
      {
        original: 'We need to discuss about the impact of artificial intelligence.',
        corrected: 'We need to discuss the impact of artificial intelligence.',
        explanation: '"Discuss" is a transitive verb that directly takes an object without the preposition "about".',
        category: 'Preposition'
      }
    ],
    vocabularyUpgrades: [
      {
        originalWord: 'big change',
        suggestedAlternatives: ['paradigm shift', 'fundamental transformation', 'seismic disruption'],
        contextSentence: 'This technological shift is not merely a change; it is a seismic disruption.'
      },
      {
        originalWord: 'good at',
        suggestedAlternatives: ['proficient in', 'adept at', 'skilled in'],
        contextSentence: 'Engineers who are adept at system architecture will thrive.'
      }
    ],
    recommendedNextExercise: {
      title: 'Data Privacy vs Convenience in the Age of Smart Devices',
      type: 'Extempore Practice',
      reason: 'Reinforces tech ethics argumentation while targeting your filler-reduction goal.'
    },
    transcript: 'In today’s world, generative AI is having a huge impact on entry-level tech careers. Ten years ago, junior engineers were evaluated on basic syntax, but today tools can write boilerplate code in seconds. Every junior engineer must learn how to verify code rather than just generating it. We need to discuss the impact of artificial intelligence openly. In my view, human judgment, communication, and domain understanding remain irreplaceable. Therefore, rather than fearing automation, learners must embrace these tools to become multi-dimensional problem solvers.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isDemoData: true
  },
  {
    id: 'demo-session-2',
    topicId: 'col-2',
    topicTitle: 'The College Placement Season: Handling Peer Comparison and Rejection',
    sessionType: 'extempore',
    durationSeconds: 95,
    wordCount: 198,
    wordsPerMinute: 125,
    overallScore: 76,
    criteria: [
      { criterion: 'Fluency', score: 75, weight: 15, status: 'evaluated', feedback: 'Good flow but occasional pauses when recalling points.' },
      { criterion: 'Grammar', score: 78, weight: 20, status: 'evaluated', feedback: 'Clear sentences with minor preposition slips.' },
      { criterion: 'Vocabulary', score: 76, weight: 15, status: 'evaluated', feedback: 'Relatable vocabulary; could include more nuanced emotional descriptors.' },
      { criterion: 'Pronunciation & Intelligibility', score: 77, weight: 15, status: 'estimated', feedback: 'Easily intelligible with appropriate stress on key points.' },
      { criterion: 'Clarity', score: 80, weight: 10, status: 'evaluated', feedback: 'Core message on resilience came across clearly.' },
      { criterion: 'Topic Relevance', score: 85, weight: 10, status: 'evaluated', feedback: 'Directly addressed the emotional stakes of campus placement.' },
      { criterion: 'Organization', score: 74, weight: 10, status: 'evaluated', feedback: 'Body paragraphs flowed well, but conclusion was slightly rushed.' },
      { criterion: 'Delivery', score: 72, weight: 5, status: 'evaluated', feedback: 'Warm, empathetic tone.' }
    ],
    strengths: [
      'Empathetic and relatable storytelling',
      'Clear definition of rejection as feedback rather than a final verdict',
      'Strong connection with the college student experience'
    ],
    areasForImprovement: [
      'Allocate at least 15 seconds to wrap up with a strong concluding thought',
      'Reduce conversational filler words like "basically" and "actually"'
    ],
    priorityImprovements: [
      'Structure the final 20 seconds before starting to record',
      'Use contrast words like "Conversely" or "On the other hand"',
      'Practice deep breathing to maintain consistent vocal projection'
    ],
    strongestPart: 'The insight that your career is a 40-year marathon rather than a sprint decided in your eighth semester was inspiring.',
    fillerWords: [
      { word: 'basically', count: 5 },
      { word: 'um', count: 3 }
    ],
    fillerWordPercentage: 4.0,
    repeatedPhrases: ['at the end of the day'],
    sentenceCorrections: [
      {
        original: 'Students are preparing since six months for campus drives.',
        corrected: 'Students have been preparing for six months for campus drives.',
        explanation: 'Durations require the present perfect continuous ("have been preparing") and "for" instead of "since".',
        category: 'Verb Tense'
      }
    ],
    vocabularyUpgrades: [
      {
        originalWord: 'bad feeling',
        suggestedAlternatives: ['demoralization', 'discouragement', 'disillusionment'],
        contextSentence: 'Rejection often breeds demoralization among qualified students.'
      }
    ],
    recommendedNextExercise: {
      title: 'Navigating the Transition from High School to College',
      type: 'Extempore Practice',
      reason: 'Helps practice narrative storytelling and structured speech timing.'
    },
    transcript: 'Campus placement season is one of the most intense periods of a student’s life. When your peers receive job offers and you face rejection, it is easy to fall into despair. Students have been preparing for six months for campus drives, so emotions run high. But we must remember that an interview rejection is merely feedback on a single thirty-minute conversation, not a verdict on our potential. Supporting our friends costs us nothing, and maintaining endurance will lead us to the right opportunity.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isDemoData: true
  }
];

export const INITIAL_DEMO_MISTAKES: MistakeItem[] = [
  {
    id: 'mistake-1',
    sessionId: 'demo-session-1',
    category: 'Subject-Verb Agreement',
    originalSentence: 'Every junior engineers must learns how to verify code.',
    correctedSentence: 'Every junior engineer must learn how to verify code.',
    ruleExplanation: '"Every" modifies singular count nouns ("engineer"). Modal verbs like "must" take base verbs ("learn").',
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewed: false
  },
  {
    id: 'mistake-2',
    sessionId: 'demo-session-1',
    category: 'Prepositions',
    originalSentence: 'We need to discuss about the impact of artificial intelligence.',
    correctedSentence: 'We need to discuss the impact of artificial intelligence.',
    ruleExplanation: 'The verb "discuss" is transitive and takes a direct object without "about".',
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewed: true,
    improvedInSubsequentAttempt: true
  },
  {
    id: 'mistake-3',
    sessionId: 'demo-session-2',
    category: 'Verb Tense',
    originalSentence: 'Students are preparing since six months for campus drives.',
    correctedSentence: 'Students have been preparing for six months for campus drives.',
    ruleExplanation: 'Actions continuing from the past to the present require present perfect continuous ("have been preparing") and "for" for duration.',
    occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed: false
  }
];

export const getDemoProfile = (): UserProfile => {
  let baseProfile = INITIAL_DEMO_PROFILE;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        baseProfile = { ...baseProfile, ...JSON.parse(raw) };
      }
    } catch {
      baseProfile = INITIAL_DEMO_PROFILE;
    }
  }

  // Derive all statistics dynamically from stored demo sessions
  const sessions = getDemoSessions();
  const stats = calculateUserStatistics(sessions, undefined, undefined, baseProfile.dailyTargetMinutes);

  return {
    ...baseProfile,
    totalSessions: stats.totalSessions,
    totalSpeakingMinutes: Math.round((stats.totalSpeakingSeconds / 60) * 10) / 10,
    averageScore: stats.averageScore ?? 0,
    streakDays: stats.streakDays,
  };
};

export const saveDemoProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save demo profile to localStorage', e);
  }
};

export const getDemoSessions = (): EvaluationResult[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_SESSIONS;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_DEMO_SESSIONS));
      return INITIAL_DEMO_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_SESSIONS;
  }
};

export const saveDemoSession = (session: EvaluationResult): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getDemoSessions();
    // Prevent duplicate records caused by repeated submissions, retries, or React effects
    if (existing.some((s) => s.id === session.id)) {
      return;
    }
    const updated = [session, ...existing];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));

    // Also auto-save any sentence corrections to mistakes
    if (session.sentenceCorrections && session.sentenceCorrections.length > 0) {
      const existingMistakes = getDemoMistakes();
      const newMistakes: MistakeItem[] = session.sentenceCorrections.map((sc, idx) => ({
        id: `mistake-${session.id}-${idx}`,
        sessionId: session.id,
        category: (sc.category === 'Grammar' ? 'Sentence Structure' : sc.category as any) || 'Sentence Structure',
        originalSentence: sc.original,
        correctedSentence: sc.corrected,
        ruleExplanation: sc.explanation,
        occurredAt: session.createdAt || new Date().toISOString(),
        reviewed: false
      }));
      const existingIds = new Set(existingMistakes.map(m => m.id));
      const filteredNew = newMistakes.filter(m => !existingIds.has(m.id));
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([...filteredNew, ...existingMistakes]));
    }
  } catch (e) {
    console.error('Failed to save demo session', e);
  }
};

export const deleteDemoSession = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getDemoSessions();
    const filtered = existing.filter(s => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete demo session', e);
  }
};

export const getDemoMistakes = (): MistakeItem[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_MISTAKES;
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (!raw) {
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(INITIAL_DEMO_MISTAKES));
      return INITIAL_DEMO_MISTAKES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_MISTAKES;
  }
};

export const updateDemoMistake = (id: string, updates: Partial<MistakeItem>): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getDemoMistakes();
    const updated = existing.map(m => m.id === id ? { ...m, ...updates } : m);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update demo mistake', e);
  }
};

export const deleteDemoMistake = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getDemoMistakes();
    const filtered = existing.filter(m => m.id !== id);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete demo mistake', e);
  }
};

export const isDemoModeActive = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(DEMO_MODE_ACTIVE_KEY);
  return stored !== 'false'; // Default to true if unconfigured
};

export const setDemoModeActive = (active: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_MODE_ACTIVE_KEY, active ? 'true' : 'false');
};
