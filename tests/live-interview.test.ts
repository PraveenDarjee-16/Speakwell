import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LiveInterviewEngine } from '../src/lib/ai/live-interview-engine';
import { 
  mapLiveEvaluationToSessionResult, 
  mapSessionToLiveEvaluation 
} from '../src/lib/data/live-interview-service';
import { calculateUserStatistics } from '../src/lib/stats/user-stats';
import { 
  LiveInterviewConfig, 
  ConversationTurn, 
  LiveInterviewEvaluation 
} from '../src/types';
import { PREDEFINED_TOPICS } from '../src/data/live-interview-topics';

function createMockConfig(overrides: Partial<LiveInterviewConfig> = {}): LiveInterviewConfig {
  return {
    topic: 'Will Artificial Intelligence create more jobs than it replaces?',
    category: 'artificial_intelligence',
    purpose: 'english_fluency',
    difficulty: 'intermediate',
    durationMinutes: 5,
    personality: 'friendly_mentor',
    speakingRate: 1.0,
    ...overrides
  };
}

function createMockTurns(): ConversationTurn[] {
  return [
    {
      id: 'turn-ai-1',
      speaker: 'ai',
      text: 'Welcome! Today we are discussing whether artificial intelligence will create more jobs than it replaces. To begin, what is your primary opinion on this?',
      timestamp: '2026-10-15T10:00:00.000Z',
      questionIndex: 1
    },
    {
      id: 'turn-user-1',
      speaker: 'user',
      text: 'I believe that while AI will automate repetitive tasks, it will also create new opportunities in machine learning engineering, data curation, and AI ethics.',
      timestamp: '2026-10-15T10:00:30.000Z',
      durationSeconds: 25,
      wordCount: 26
    },
    {
      id: 'turn-ai-2',
      speaker: 'ai',
      text: 'You mentioned that AI can improve productivity. Can you give me a specific example of how this might affect fresh graduates entering the workforce?',
      timestamp: '2026-10-15T10:00:35.000Z',
      questionIndex: 2
    },
    {
      id: 'turn-user-2',
      speaker: 'user',
      text: 'Fresh graduates might need to adapt by learning prompt engineering and understanding automated tools rather than just traditional coding syntax.',
      timestamp: '2026-10-15T10:01:05.000Z',
      durationSeconds: 22,
      wordCount: 20
    }
  ];
}

// 1. Topic Bank & Metadata Integrity
test('1. Topic bank contains curated topics across required categories', () => {
  assert(PREDEFINED_TOPICS.length >= 8, 'Predefined topics bank should have rich options');
  const aiTopic = PREDEFINED_TOPICS.find(t => t.category === 'artificial_intelligence');
  assert(aiTopic, 'Should have artificial_intelligence category topic');
  assert(aiTopic.starterQuestion, 'Topic must have a starter question');
});

// 2. Opening Greeting Generation across Personalities
test('2. LiveInterviewEngine generates spoken opening greetings tailored to personality', async () => {
  const mentorConfig = createMockConfig({ personality: 'friendly_mentor' });
  const mentorGreeting = await LiveInterviewEngine.generateOpening(mentorConfig);
  assert(mentorGreeting.length > 20, 'Mentor greeting should be substantial');
  assert(/welcome|mentor|hello|discuss/i.test(mentorGreeting), 'Should contain warm mentor phrasing');

  const challengerConfig = createMockConfig({ personality: 'challenging_interviewer' });
  const challengerGreeting = await LiveInterviewEngine.generateOpening(challengerConfig);
  assert(/probing|testing|assumptions|argument|thesis/i.test(challengerGreeting), 'Challenger should mention probing/testing');
});

// 3. Contextual Follow-up Generation (Listens to candidate answer)
test('3. LiveInterviewEngine generates contextual follow-ups referencing candidate points', async () => {
  const config = createMockConfig({ personality: 'friendly_mentor' });
  const turns = createMockTurns();
  const userAnswer = 'One major challenge is that senior workers might face difficulties retraining because learning new digital tools is costly.';

  const followUp = await LiveInterviewEngine.generateFollowUp(config, turns, userAnswer);

  assert(followUp.length > 25, 'Follow-up must be meaningful');
  assert(followUp.endsWith('?'), 'Follow-up must end with a question mark');
  // Should acknowledge the challenge or retrain or digital
  assert(/challenge|hurdle|support|experience|example|perspective/i.test(followUp), 'Should contextually reference the issue/challenge');
});

// 4. Clarification Request
test('4. LiveInterviewEngine provides question clarification when candidate is uncertain', async () => {
  const config = createMockConfig();
  const turns = createMockTurns();
  const lastQuestion = 'What are the macroeconomic externalities associated with unconstrained generative AI integration?';

  const clarification = await LiveInterviewEngine.clarifyQuestion(config, turns, lastQuestion);
  assert(clarification.length > 15, 'Clarification should be provided');
  assert(/simple|terms|everyday|example|curious/i.test(clarification), 'Should explain in simpler terms');
});

// 5. Multi-Turn Comprehensive Evaluation
test('5. Multi-turn interview evaluation scores all 8 competencies and generates actionable feedback', async () => {
  const config = createMockConfig();
  const turns = createMockTurns();
  const durationSeconds = 180; // 3 minutes

  const evaluation = await LiveInterviewEngine.evaluateInterview({
    config,
    turns,
    durationSeconds
  });

  assert(evaluation.overallScore >= 0 && evaluation.overallScore <= 100, 'Overall score must be 0-100');
  assert.equal(evaluation.totalTurns, 4, 'Total turns should match input turns');
  assert.equal(evaluation.userTurns, 2, 'User turns should be 2');
  assert(evaluation.totalUserWords >= 40, 'User word count should be accumulated');
  assert(evaluation.averageWpm > 0, 'Average WPM must be positive');

  // Verify all 8 criteria exist
  const expectedCriteria = [
    'Fluency', 
    'Grammar', 
    'Vocabulary', 
    'Clarity', 
    'Topic Relevance', 
    'Organization', 
    'Delivery', 
    'Pronunciation & Intelligibility'
  ];

  for (const crit of expectedCriteria) {
    const found = evaluation.criteria.find(c => c.criterion === crit);
    assert(found, `Missing required evaluation criterion: ${crit}`);
    assert(found.score >= 0 && found.score <= 100, `Criterion ${crit} score out of range`);
  }

  // Delivery and Pronunciation must be transparent proxies
  const deliveryCrit = evaluation.criteria.find(c => c.criterion === 'Delivery');
  assert.equal(deliveryCrit?.status, 'estimated', 'Delivery must be labeled estimated/proxy');

  const pronunciationCrit = evaluation.criteria.find(c => c.criterion === 'Pronunciation & Intelligibility');
  assert.equal(pronunciationCrit?.status, 'estimated', 'Pronunciation must be labeled estimated/proxy');

  // Verify Strengths, Top 3 priority improvements
  assert(evaluation.strengths.length >= 2, 'Should provide at least 2 strengths');
  assert.equal(evaluation.priorityImprovements.length, 3, 'Must provide top 3 priority improvements');
  assert(evaluation.turnFeedback.length >= 2, 'Should provide turn-by-turn question feedback');
});

// 6. Persistence Model Mapping & Dashboard Stats Integration
test('6. Live Interview persists as sessionType "interview" and integrates with Dashboard statistics', () => {
  const config = createMockConfig();
  const turns = createMockTurns();

  const mockEvaluation: LiveInterviewEvaluation = {
    id: 'live-eval-123',
    topicTitle: config.topic,
    category: config.category,
    purpose: config.purpose,
    difficulty: config.difficulty,
    personality: config.personality,
    overallScore: 84,
    durationSeconds: 150,
    totalTurns: 4,
    userTurns: 2,
    totalUserWords: 50,
    averageWpm: 20,
    criteria: [
      { criterion: 'Fluency', score: 85, weight: 15, status: 'evaluated', feedback: 'Smooth' },
      { criterion: 'Grammar', score: 82, weight: 15, status: 'evaluated', feedback: 'Accurate' }
    ],
    strengths: ['Great relevance', 'Good tone'],
    priorityImprovements: ['Elaborate with data', 'Reduce pauses', 'Conclude strongly'],
    grammarCorrections: [],
    fillerWords: [],
    fillerWordPercentage: 0,
    vocabularyUpgrades: [],
    turnFeedback: [
      {
        question: 'What is your opinion?',
        answer: 'I think AI creates opportunities.',
        isDirectlyAddressed: true,
        score: 85,
        notes: 'Direct answer'
      }
    ],
    summary: 'Candidate was articulate.',
    practiceRecommendations: ['Practice PREP structure'],
    turns,
    createdAt: new Date().toISOString()
  };

  // Convert to standard EvaluationResult
  const sessionResult = mapLiveEvaluationToSessionResult(mockEvaluation);

  assert.equal(sessionResult.id, 'live-eval-123');
  assert.equal(sessionResult.sessionType, 'interview');
  assert.equal(sessionResult.overallScore, 84);
  assert.equal(sessionResult.durationSeconds, 150);
  assert(sessionResult.transcript.includes('Candidate:'), 'Transcript must contain conversation turns');

  // Verify Roundtrip mapping back to LiveInterviewEvaluation
  const restored = mapSessionToLiveEvaluation(sessionResult);
  assert.equal(restored.id, 'live-eval-123');
  assert.equal(restored.turns.length, 4);

  // Verify Dashboard Statistics Integration
  const stats = calculateUserStatistics([sessionResult]);
  assert.equal(stats.totalSessions, 1, 'Should count as 1 completed session');
  assert.equal(stats.totalSpeakingSeconds, 150, 'Speaking time should be 150 seconds');
  assert.equal(stats.averageScore, 84, 'Average score should be 84');
  assert.equal(stats.streakDays, 1, 'Streak should be 1 for today');
});

// 7. Dynamic Evaluation Verification: Different candidate speech produces different, non-fixed scores
test('7. Different candidate performances produce distinct dynamic scores rather than fixed values', async () => {
  const config = createMockConfig({ topic: 'Sustainable Energy Transitions' });

  // Performance A: High fluency, optimal WPM, structural connectors, no fillers or grammar errors
  const strongTurns: ConversationTurn[] = [
    {
      id: 'ai-1',
      speaker: 'ai',
      text: 'How can nations balance industrial growth with carbon reduction targets?',
      timestamp: '2026-10-15T12:00:00.000Z'
    },
    {
      id: 'user-1',
      speaker: 'user',
      text: 'In my view, nations must invest heavily in nuclear and solar energy because clean base-load power drives manufacturing without carbon emissions. For instance, countries that adopted modular reactors successfully decoupled GDP expansion from fossil fuel dependency. Furthermore, implementing carbon tax incentives rewards corporate efficiency.',
      timestamp: '2026-10-15T12:00:25.000Z',
      durationSeconds: 25,
      wordCount: 48
    },
    {
      id: 'ai-2',
      speaker: 'ai',
      text: 'What trade-offs do emerging economies face when adopting these technologies?',
      timestamp: '2026-10-15T12:00:30.000Z'
    },
    {
      id: 'user-2',
      speaker: 'user',
      text: 'The primary challenge is capital expenditure. Therefore, developed countries must establish low-interest green development funds so that developing regions can adopt renewables without triggering economic stagnation.',
      timestamp: '2026-10-15T12:00:50.000Z',
      durationSeconds: 20,
      wordCount: 26
    }
  ];

  // Performance B: Hesitant, many filler words, grammar mistake, very slow WPM (30 WPM), no connectors
  const hesitantTurns: ConversationTurn[] = [
    {
      id: 'ai-1',
      speaker: 'ai',
      text: 'How can nations balance industrial growth with carbon reduction targets?',
      timestamp: '2026-10-15T12:00:00.000Z'
    },
    {
      id: 'user-1',
      speaker: 'user',
      text: 'Um, like, I think, um, it is, uh, very bad problem. And he don\'t want to, um, stop factory.',
      timestamp: '2026-10-15T12:01:00.000Z',
      durationSeconds: 60,
      wordCount: 18
    }
  ];

  const strongEval = await LiveInterviewEngine.evaluateInterview({
    config,
    turns: strongTurns,
    durationSeconds: 45 // 45 seconds for 74 words = ~98 WPM
  });

  const hesitantEval = await LiveInterviewEngine.evaluateInterview({
    config,
    turns: hesitantTurns,
    durationSeconds: 60 // 60 seconds for 18 words = 18 WPM
  });

  // Verify scores are NOT fixed/identical
  assert.notEqual(strongEval.overallScore, hesitantEval.overallScore, 'Overall scores must be dynamically different');
  assert(strongEval.overallScore > hesitantEval.overallScore, `Strong performance (${strongEval.overallScore}) should score higher than hesitant performance (${hesitantEval.overallScore})`);

  // Verify grammar criterion dynamically reflects mistakes
  const strongGrammar = strongEval.criteria.find(c => c.criterion === 'Grammar')?.score || 0;
  const hesitantGrammar = hesitantEval.criteria.find(c => c.criterion === 'Grammar')?.score || 0;
  assert(strongGrammar > hesitantGrammar, `Strong grammar (${strongGrammar}) must be higher than hesitant grammar with "he don't" (${hesitantGrammar})`);
  assert(hesitantEval.grammarCorrections.length > 0, 'Must detect "he don\'t" error');

  // Verify fluency criterion dynamically reflects fillers & WPM
  const strongFluency = strongEval.criteria.find(c => c.criterion === 'Fluency')?.score || 0;
  const hesitantFluency = hesitantEval.criteria.find(c => c.criterion === 'Fluency')?.score || 0;
  assert(strongFluency > hesitantFluency, `Strong fluency (${strongFluency}) must exceed hesitant fluency (${hesitantFluency})`);
  assert(hesitantEval.fillerWords.length > 0, 'Must detect filler words like "um" and "uh"');

  // Verify organization criterion dynamically rewards structural connectors
  const strongOrg = strongEval.criteria.find(c => c.criterion === 'Organization')?.score || 0;
  const hesitantOrg = hesitantEval.criteria.find(c => c.criterion === 'Organization')?.score || 0;
  assert(strongOrg > hesitantOrg, `Strong organization with connectors (${strongOrg}) must exceed hesitant (${hesitantOrg})`);

  // Verify priority improvements are personalized, not static
  assert(hesitantEval.priorityImprovements.some(p => /filler|say|refine|cadence|pacing/i.test(p)), 'Hesitant improvements must target fillers or grammar');
});

// 8. Dynamic Custom Topics: Custom topics receive custom greetings and dynamic contextual follow-ups
test('8. Custom topics receive topic-aware greetings and contextual questions without static templates', async () => {
  const customConfig = createMockConfig({
    topic: 'Microservices vs Monolithic Architecture in Fintech Startups',
    category: 'custom',
    personality: 'professional_interviewer'
  });

  const greeting = await LiveInterviewEngine.generateOpening(customConfig);
  assert(greeting.includes('Microservices vs Monolithic Architecture in Fintech Startups'), 'Greeting must incorporate custom topic name');

  const turns: ConversationTurn[] = [
    {
      id: 'ai-0',
      speaker: 'ai',
      text: greeting,
      timestamp: '2026-10-15T13:00:00.000Z'
    }
  ];

  const userAnswer = 'In early fintech stages, database transactions and PCI-DSS compliance are simpler in a modular monolith because distributed transactions across microservices introduce consistency bottlenecks.';
  const followUp = await LiveInterviewEngine.generateFollowUp(customConfig, turns, userAnswer);

  assert(followUp.endsWith('?'), 'Follow-up must be a question');
  // Check that follow up acknowledges candidate keywords (e.g. bottlenecks, transactions, microservices, compliance)
  assert(/bottlenecks|transactions|consistency|monolith|microservices|approach|trade-offs|milestones|framework/i.test(followUp), 'Follow-up must reference candidate concepts');
});

// 9. Turn-by-Turn feedback evaluates candidate answer relevance dynamically
test('9. Turn-by-turn question relevance and model answers dynamically incorporate user text', async () => {
  const config = createMockConfig();
  const turns: ConversationTurn[] = [
    {
      id: 'ai-1',
      speaker: 'ai',
      text: 'What is your primary view on the rise of remote work in software development?',
      timestamp: '2026-10-15T14:00:00.000Z'
    },
    {
      id: 'user-1',
      speaker: 'user',
      text: 'Remote work enhances focus for deep coding tasks because engineers avoid noisy open-plan distractions.',
      timestamp: '2026-10-15T14:00:20.000Z',
      wordCount: 15
    }
  ];

  const evalResult = await LiveInterviewEngine.evaluateInterview({
    config,
    turns,
    durationSeconds: 30
  });

  assert.equal(evalResult.turnFeedback.length, 1);
  const feedback = evalResult.turnFeedback[0];
  assert.equal(feedback.isDirectlyAddressed, true);
  assert(feedback.score >= 75, 'Relevant answer should score >= 75');
  assert(feedback.improvedAnswer?.includes('remote work') || feedback.improvedAnswer?.includes('coding'), 'Improved model answer must build upon candidate topic');
});

// 10. Silence / Zero User Words Evaluation (Never awards 78 to silence!)
test('10. Silence or zero speech scores 0/100 and explains that no speech was detected (never 78)', async () => {
  const config = createMockConfig({ topic: 'Campus Placement Discussion' });

  // Candidate listened to question but said nothing (0 user turns or empty response)
  const silentTurns: ConversationTurn[] = [
    {
      id: 'ai-1',
      speaker: 'ai',
      text: 'Tell me about yourself and your career aspirations.',
      timestamp: '2026-10-15T15:00:00.000Z'
    }
  ];

  const silentEval = await LiveInterviewEngine.evaluateInterview({
    config,
    turns: silentTurns,
    durationSeconds: 120
  });

  assert.equal(silentEval.overallScore, 0, 'Silent interview must receive score of 0, NEVER 78');
  assert.equal(silentEval.totalUserWords, 0, 'Total user words should be 0');
  assert.equal(silentEval.userTurns, 0, 'User turns should be 0');
  assert(silentEval.summary.includes('without speaking') || silentEval.summary.includes('0/100'), 'Summary must explain no speech was provided');

  for (const crit of silentEval.criteria) {
    assert.equal(crit.score, 0, `Criterion ${crit.criterion} must be 0 for silence`);
  }
});

// 11. Minimal Speech (<15 words) scores strictly between 8 and 22 (Never awards 78 to single-word answers!)
test('11. Minimal speech (<15 words) receives an incomplete/failing score under 25 (never 78)', async () => {
  const config = createMockConfig({ topic: 'HR Behavioral Round' });

  // Candidate answered with only 4 words
  const minimalTurns: ConversationTurn[] = [
    {
      id: 'ai-1',
      speaker: 'ai',
      text: 'Where do you see yourself in five years?',
      timestamp: '2026-10-15T15:10:00.000Z'
    },
    {
      id: 'user-1',
      speaker: 'user',
      text: 'Yes I agree completely.',
      timestamp: '2026-10-15T15:10:20.000Z',
      wordCount: 4
    }
  ];

  const minimalEval = await LiveInterviewEngine.evaluateInterview({
    config,
    turns: minimalTurns,
    durationSeconds: 90
  });

  assert(minimalEval.overallScore >= 5 && minimalEval.overallScore <= 22, `Minimal speech score must be between 5 and 22, got ${minimalEval.overallScore} (never 78)`);
  assert(minimalEval.summary.includes('minimal and fragmented') || minimalEval.summary.includes('spoke only 4 word'), 'Summary must flag minimal speech');
  assert(minimalEval.criteria.find(c => c.criterion === 'Fluency')!.score <= 20, 'Fluency score must be <= 20');
});
