import { 
  LiveInterviewEvaluation, 
  EvaluationResult, 
  ConversationTurn,
  CriterionScore,
  LiveInterviewCategory,
  LiveInterviewPurpose,
  LiveInterviewDifficulty,
  LiveInterviewPersonality
} from '@/types';
import { 
  savePracticeSession, 
  fetchUserSessionsAndStats, 
  deletePracticeSession 
} from '@/lib/data/sessions-service';

/**
 * Maps a full LiveInterviewEvaluation into the standard EvaluationResult model
 * for unified storage and dashboard statistics aggregation.
 */
export function mapLiveEvaluationToSessionResult(evaluation: LiveInterviewEvaluation): EvaluationResult {
  const formattedTranscript = evaluation.turns
    .map(t => `${t.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
    .join('\n\n');

  return {
    id: evaluation.id,
    topicTitle: evaluation.topicTitle,
    sessionType: 'interview',
    durationSeconds: evaluation.durationSeconds,
    activeDurationSeconds: evaluation.durationSeconds,
    wordCount: evaluation.totalUserWords,
    wordsPerMinute: evaluation.averageWpm,
    overallScore: evaluation.overallScore,
    criteria: evaluation.criteria,
    strengths: evaluation.strengths,
    areasForImprovement: evaluation.priorityImprovements,
    priorityImprovements: evaluation.priorityImprovements,
    strongestPart: evaluation.summary,
    fillerWords: evaluation.fillerWords,
    fillerWordPercentage: evaluation.fillerWordPercentage,
    repeatedPhrases: [],
    sentenceCorrections: evaluation.grammarCorrections,
    vocabularyUpgrades: evaluation.vocabularyUpgrades,
    recommendedNextExercise: {
      title: evaluation.practiceRecommendations[0] || 'Live Interview Follow-up Drill',
      type: 'Live AI Interview',
      reason: 'Reinforce conversational flow and question responsiveness'
    },
    transcript: formattedTranscript,
    createdAt: evaluation.createdAt,
    isDemoData: evaluation.isDemoData || false,
    // Embed live interview metadata cleanly
    ...(evaluation as any)
  };
}

/**
 * Reconstructs a LiveInterviewEvaluation from a saved session
 */
export function mapSessionToLiveEvaluation(session: EvaluationResult): LiveInterviewEvaluation {
  // If full live interview metadata was preserved
  if ((session as any).turns && Array.isArray((session as any).turns)) {
    return session as unknown as LiveInterviewEvaluation;
  }

  // Otherwise parse dialogue turns from transcript
  const turns: ConversationTurn[] = [];
  const lines = session.transcript.split('\n\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('Interviewer:')) {
      turns.push({
        id: `turn-ai-${i}`,
        speaker: 'ai',
        text: line.replace(/^Interviewer:\s*/, '').trim(),
        timestamp: session.createdAt
      });
    } else if (line.startsWith('Candidate:')) {
      turns.push({
        id: `turn-user-${i}`,
        speaker: 'user',
        text: line.replace(/^Candidate:\s*/, '').trim(),
        timestamp: session.createdAt
      });
    } else {
      // Unspecified speaker
      turns.push({
        id: `turn-${i}`,
        speaker: i % 2 === 0 ? 'ai' : 'user',
        text: line,
        timestamp: session.createdAt
      });
    }
  }

  return {
    id: session.id,
    topicTitle: session.topicTitle,
    category: ((session as any).category as LiveInterviewCategory) || 'custom',
    purpose: ((session as any).purpose as LiveInterviewPurpose) || 'english_fluency',
    difficulty: ((session as any).difficulty as LiveInterviewDifficulty) || 'intermediate',
    personality: ((session as any).personality as LiveInterviewPersonality) || 'professional_interviewer',
    overallScore: session.overallScore,
    durationSeconds: session.durationSeconds,
    totalTurns: turns.length,
    userTurns: turns.filter(t => t.speaker === 'user').length,
    totalUserWords: session.wordCount,
    averageWpm: session.wordsPerMinute,
    criteria: session.criteria,
    strengths: session.strengths,
    priorityImprovements: session.priorityImprovements,
    grammarCorrections: session.sentenceCorrections,
    fillerWords: session.fillerWords,
    fillerWordPercentage: session.fillerWordPercentage,
    vocabularyUpgrades: session.vocabularyUpgrades,
    turnFeedback: (session as any).turnFeedback || [],
    summary: session.strongestPart || 'Interview session completed.',
    practiceRecommendations: (session as any).practiceRecommendations || [session.recommendedNextExercise?.title || 'Conversational practice'],
    turns,
    createdAt: session.createdAt,
    isDemoData: session.isDemoData
  };
}

/**
 * Saves a Live AI Interview session to Supabase or Demo storage
 */
export async function saveLiveInterview(evaluation: LiveInterviewEvaluation): Promise<{ success: boolean; error?: string }> {
  const sessionResult = mapLiveEvaluationToSessionResult(evaluation);
  return await savePracticeSession(sessionResult);
}

/**
 * Fetches all past live interview sessions for the current user
 */
export async function fetchLiveInterviewHistory(): Promise<{
  interviews: LiveInterviewEvaluation[];
  isDemo: boolean;
  error: string | null;
}> {
  const result = await fetchUserSessionsAndStats();
  
  if (result.error) {
    return {
      interviews: [],
      isDemo: result.isDemo,
      error: result.error
    };
  }

  const interviewSessions = result.sessions.filter(s => s.sessionType === 'interview');
  const mapped = interviewSessions.map(mapSessionToLiveEvaluation);

  return {
    interviews: mapped,
    isDemo: result.isDemo,
    error: null
  };
}

/**
 * Deletes a live interview session
 */
export async function deleteLiveInterview(sessionId: string): Promise<{ success: boolean; error?: string }> {
  return await deletePracticeSession(sessionId);
}
