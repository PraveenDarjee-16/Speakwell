export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type UserGoal = 
  | 'Campus Placements & Job Interviews'
  | 'Public Speaking & Presentations'
  | 'Everyday Fluency & Confidence'
  | 'Workplace & Professional Communication'
  | 'Exams (IELTS / TOEFL / Extempore)';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  proficiencyLevel: ProficiencyLevel;
  primaryGoal: UserGoal;
  targetRole?: string;
  dailyTargetMinutes: number;
  streakDays: number;
  totalSpeakingMinutes: number;
  totalSessions: number;
  averageScore: number;
  createdAt: string;
}

export type ExtemporeCategory =
  | 'Technology'
  | 'Artificial Intelligence'
  | 'Education'
  | 'College Life'
  | 'Society & Culture'
  | 'Environment'
  | 'Business & Economy'
  | 'Entrepreneurship'
  | 'Leadership'
  | 'Health & Lifestyle'
  | 'Social Media'
  | 'Ethics & Philosophy'
  | 'Current Affairs'
  | 'Abstract'
  | 'Personal Experiences';

export type TopicDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ExtemporeTopic {
  id: string;
  title: string;
  category: ExtemporeCategory;
  difficulty: TopicDifficulty;
  background: string;
  whyItMatters: string;
  talkingPoints: string[];
  vocabulary: { word: string; meaning: string }[];
  usefulPhrases: string[];
  possibleOpenings: string[];
  suggestedStructure: {
    introduction: string;
    bodyParagraphs: string[];
    conclusion: string;
  };
}

export interface CriterionScore {
  criterion: 'Fluency' | 'Grammar' | 'Vocabulary' | 'Pronunciation & Intelligibility' | 'Clarity' | 'Topic Relevance' | 'Organization' | 'Delivery';
  score: number; // 0 - 100
  weight: number; // percentage
  status: 'evaluated' | 'estimated' | 'unavailable';
  feedback: string;
}

export interface SentenceCorrection {
  original: string;
  corrected: string;
  explanation: string;
  category: 'Grammar' | 'Word Choice' | 'Structure' | 'Clarity' | 'Preposition' | 'Tense' | 'Subject-Verb Agreement' | 'Verb Tense';
}

export interface VocabularyUpgrade {
  originalWord: string;
  suggestedAlternatives: string[];
  contextSentence: string;
}

export interface FinalizedRecordingSession {
  sessionId: string;
  topicId?: string;
  topicTitle: string;
  transcript: string;
  wordCount: number;
  durationSeconds: number; // Final authoritative duration from audio metadata or monotonic clock
  activeDurationSeconds: number; // Active duration excluding paused periods
  wordsPerMinute: number; // Gross speaking rate
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  startedAt: string;
  endedAt: string;
}

export interface EvaluationResult {
  id: string;
  topicId?: string;
  topicTitle: string;
  sessionType: 'extempore' | 'interview' | 'conversation' | 'pronunciation' | 'storytelling';
  durationSeconds: number;
  activeDurationSeconds?: number;
  wordCount: number;
  wordsPerMinute: number;
  overallScore: number; // 0 - 100
  criteria: CriterionScore[];
  strengths: string[];
  areasForImprovement: string[];
  priorityImprovements: [string, string, string]; // Top 3
  strongestPart: string;
  fillerWords: { word: string; count: number }[];
  fillerWordPercentage: number;
  repeatedPhrases: string[];
  sentenceCorrections: SentenceCorrection[];
  vocabularyUpgrades: VocabularyUpgrade[];
  recommendedNextExercise: {
    title: string;
    type: string;
    reason: string;
  };
  transcript: string;
  audioUrl?: string;
  recordingSession?: FinalizedRecordingSession;
  createdAt: string;
  isDemoData?: boolean;
}

export interface MistakeItem {
  id: string;
  userId?: string;
  sessionId: string;
  category: 'Verb Tense' | 'Subject-Verb Agreement' | 'Articles' | 'Prepositions' | 'Sentence Structure' | 'Vocabulary Misuse' | 'Pronunciation' | 'Filler Words';
  originalSentence: string;
  correctedSentence: string;
  ruleExplanation: string;
  occurredAt: string;
  reviewed: boolean;
  improvedInSubsequentAttempt?: boolean;
}

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  level: ProficiencyLevel;
  category: string;
  synonyms: string[];
  antonyms: string[];
  exampleSentences: string[];
  commonMistake: string;
  practicalTip: string;
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface UserVocabProgress {
  wordId: string;
  status: 'new' | 'learning' | 'mastered';
  bookmarked: boolean;
  timesPracticed: number;
  lastReviewed: string;
  nextReviewDate: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'HR' | 'Campus Placement' | 'Technical' | 'Behavioral' | 'Leadership';
  starContext: {
    situationHint: string;
    taskHint: string;
    actionHint: string;
    resultHint: string;
  };
  sampleGoodAnswer: string;
  keyLookouts: string[];
}

export interface InterviewSession {
  id: string;
  role: string;
  industry: string;
  experienceLevel: 'Entry Level / Fresher' | 'Mid Level' | 'Senior';
  overallScore: number;
  date: string;
  answers: {
    questionId: string;
    question: string;
    transcript: string;
    feedback: string;
    starAdherenceScore: number;
    improvedModelAnswer: string;
  }[];
  summary: {
    strengths: string[];
    missedOpportunities: string[];
    preparationPlan: string[];
  };
}

export * from './live-interview';
