import { CriterionScore, SentenceCorrection, VocabularyUpgrade } from './index';

export type LiveInterviewCategory =
  | 'technology'
  | 'artificial_intelligence'
  | 'education'
  | 'college_life'
  | 'current_affairs'
  | 'business'
  | 'social_issues'
  | 'environment'
  | 'personal_development'
  | 'custom';

export type LiveInterviewPurpose =
  | 'english_fluency'
  | 'campus_placement'
  | 'hr_interview'
  | 'technical_discussion'
  | 'group_discussion'
  | 'general_knowledge';

export type LiveInterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type LiveInterviewPersonality =
  | 'friendly_mentor'
  | 'professional_interviewer'
  | 'challenging_interviewer';

export interface ConversationTurn {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: string;
  durationSeconds?: number;
  wordCount?: number;
  questionIndex?: number;
}

export interface LiveInterviewConfig {
  topic: string;
  category: LiveInterviewCategory;
  purpose: LiveInterviewPurpose;
  difficulty: LiveInterviewDifficulty;
  durationMinutes: number;
  personality: LiveInterviewPersonality;
  voiceURI?: string;
  voiceName?: string;
  speakingRate: number; // 0.8 - 1.2
}

export interface TurnRelevanceFeedback {
  question: string;
  answer: string;
  isDirectlyAddressed: boolean;
  score: number; // 0-100
  notes: string;
  improvedAnswer?: string;
}

export interface LiveInterviewEvaluation {
  id: string;
  topicTitle: string;
  category: LiveInterviewCategory;
  purpose: LiveInterviewPurpose;
  difficulty: LiveInterviewDifficulty;
  personality: LiveInterviewPersonality;
  overallScore: number; // 0-100
  durationSeconds: number;
  totalTurns: number;
  userTurns: number;
  totalUserWords: number;
  averageWpm: number;
  criteria: CriterionScore[];
  strengths: string[];
  priorityImprovements: [string, string, string];
  grammarCorrections: SentenceCorrection[];
  fillerWords: { word: string; count: number }[];
  fillerWordPercentage: number;
  vocabularyUpgrades: VocabularyUpgrade[];
  turnFeedback: TurnRelevanceFeedback[];
  summary: string;
  practiceRecommendations: string[];
  turns: ConversationTurn[];
  createdAt: string;
  isDemoData?: boolean;
}
