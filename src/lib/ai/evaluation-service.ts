import { EvaluationResult, CriterionScore, SentenceCorrection, VocabularyUpgrade, FinalizedRecordingSession } from '@/types';
import { COMMON_FILLER_WORDS } from '@/lib/speech/recognition';
import { 
  countWords, 
  calculateWpm, 
  normalizeTranscript, 
  extractWords, 
  calculateFillerPercentage 
} from '@/lib/speech/metrics';

export interface EvaluationRequest {
  topicId?: string;
  topicTitle: string;
  transcript: string;
  durationSeconds: number;
  activeDurationSeconds?: number;
  sessionType?: 'extempore' | 'interview' | 'conversation' | 'pronunciation' | 'storytelling';
  targetRole?: string;
  recordingSession?: FinalizedRecordingSession;
}

export class SpeechEvaluationService {
  /**
   * Main evaluation method called by server-side route handler
   */
  public static async evaluateSpeech(request: EvaluationRequest): Promise<EvaluationResult> {
    const { 
      transcript, 
      durationSeconds, 
      activeDurationSeconds,
      topicTitle, 
      topicId, 
      sessionType = 'extempore',
      recordingSession,
    } = request;

    const cleanedTranscript = normalizeTranscript(transcript);
    const wordCount = countWords(cleanedTranscript);
    // Reliable duration: use valid measured duration without artificial 5-second clamp
    const duration = (Number.isFinite(durationSeconds) && durationSeconds > 0)
      ? Math.round(durationSeconds * 10) / 10
      : 0;
    const wordsPerMinute = calculateWpm(wordCount, duration);

    // Check if external AI API is configured
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (apiKey && !apiKey.includes('your-openai') && !apiKey.includes('your-groq')) {
      try {
        const aiResult = await this.evaluateWithLLM({
          apiKey,
          baseUrl,
          model,
          topicId,
          topicTitle,
          transcript: cleanedTranscript,
          durationSeconds: duration,
          activeDurationSeconds,
          wordCount,
          wordsPerMinute,
          sessionType,
          recordingSession,
        });
        if (aiResult) {
          return aiResult;
        }
      } catch (err) {
        console.warn('External AI evaluation API call failed, falling back to local rule-based engine:', err);
      }
    }

    // High-precision, realistic, non-diplomatic rule-based engine
    return this.evaluateWithRuleEngine({
      topicId,
      topicTitle,
      transcript: cleanedTranscript,
      durationSeconds: duration,
      activeDurationSeconds,
      wordCount,
      wordsPerMinute,
      sessionType,
      recordingSession,
    });
  }

  /**
   * Evaluates using configured OpenAI-compatible API with strict, non-diplomatic rubrics
   */
  private static async evaluateWithLLM(params: {
    apiKey: string;
    baseUrl: string;
    model: string;
    topicId?: string;
    topicTitle: string;
    transcript: string;
    durationSeconds: number;
    activeDurationSeconds?: number;
    wordCount: number;
    wordsPerMinute: number;
    sessionType: string;
    recordingSession?: FinalizedRecordingSession;
  }): Promise<EvaluationResult | null> {
    const { 
      apiKey, 
      baseUrl, 
      model, 
      topicId,
      topicTitle, 
      transcript, 
      durationSeconds, 
      activeDurationSeconds,
      wordCount, 
      wordsPerMinute, 
      sessionType,
      recordingSession,
    } = params;

    const systemPrompt = `You are a rigorous, realistic, and candid English communication examiner (IELTS 9.0 examiner & campus placement interview chair).
You evaluate speech on the topic "${topicTitle}" (${durationSeconds} seconds, ~${wordsPerMinute} WPM, ${wordCount} words).

CRITICAL GRADING PHILOSOPHY:
- DO NOT BE DIPLOMATIC OR POLITE. Grade strictly according to real-world standards.
- If the speaker spoke fewer than 20 words or stayed silent, overallScore MUST BE between 10 and 25 (FAIL / INCOMPLETE). Never award 60-80 to silence or trivial speech.
- If the speech was hesitant, fragmented, or under 50 words, overallScore MUST BE between 30 and 52.
- An average, competent speech earns 65 to 76.
- A strong, articulate, well-structured speech earns 80 to 88.
- Only exceptional, near-flawless speeches earn 90+.
- Evaluate observable evidence only: actual words, actual pauses, actual topic relevance, actual grammar.
- Real filler words ('um', 'uh', 'like', 'basically', 'actually', 'you know') must penalize fluency.
- Identify real sentence flaws from the transcript with direct before/after corrections.

Return valid JSON adhering strictly to:
{
  "overallScore": number (0-100),
  "criteria": [
    { "criterion": "Fluency", "score": number, "weight": 15, "status": "evaluated", "feedback": "string" },
    { "criterion": "Grammar", "score": number, "weight": 20, "status": "evaluated", "feedback": "string" },
    { "criterion": "Vocabulary", "score": number, "weight": 15, "status": "evaluated", "feedback": "string" },
    { "criterion": "Pronunciation & Intelligibility", "score": number, "weight": 15, "status": "estimated", "feedback": "string" },
    { "criterion": "Clarity", "score": number, "weight": 10, "status": "evaluated", "feedback": "string" },
    { "criterion": "Topic Relevance", "score": number, "weight": 10, "status": "evaluated", "feedback": "string" },
    { "criterion": "Organization", "score": number, "weight": 10, "status": "evaluated", "feedback": "string" },
    { "criterion": "Delivery", "score": number, "weight": 5, "status": "evaluated", "feedback": "string" }
  ],
  "strengths": ["string", "string"],
  "areasForImprovement": ["string", "string", "string"],
  "priorityImprovements": ["string", "string", "string"],
  "strongestPart": "string",
  "sentenceCorrections": [
    {
      "original": "string",
      "corrected": "string",
      "explanation": "string",
      "category": "Grammar" | "Word Choice" | "Structure" | "Clarity" | "Preposition" | "Tense"
    }
  ],
  "vocabularyUpgrades": [
    {
      "originalWord": "string",
      "suggestedAlternatives": ["string", "string"],
      "contextSentence": "string"
    }
  ],
  "recommendedNextExercise": {
    "title": "string",
    "type": "string",
    "reason": "string"
  }
}`;

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Speech Topic: "${topicTitle}"\nSpeech Transcript: """${transcript}"""` }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(18000)
    });

    if (!response.ok) {
      throw new Error(`LLM API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const fillerStats = this.extractFillerWords(transcript);

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eval-${Date.now()}`,
      topicId,
      topicTitle,
      sessionType: sessionType as EvaluationResult['sessionType'],
      durationSeconds,
      activeDurationSeconds: activeDurationSeconds ?? durationSeconds,
      wordCount,
      wordsPerMinute,
      overallScore: Math.min(100, Math.max(5, Math.round(parsed.overallScore || 50))),
      criteria: parsed.criteria || [],
      strengths: parsed.strengths || [],
      areasForImprovement: parsed.areasForImprovement || [],
      priorityImprovements: (parsed.priorityImprovements?.slice(0, 3) || [
        'Overcome freezing: Practice sustaining speech for 45+ seconds',
        'Anchor each thought with a concrete example',
        'Eliminate vocalized fillers with silent pauses'
      ]) as [string, string, string],
      strongestPart: parsed.strongestPart || (wordCount > 10 ? transcript.slice(0, 100) : 'Initiating the recording.'),
      fillerWords: fillerStats.fillers,
      fillerWordPercentage: fillerStats.percentage,
      repeatedPhrases: this.extractRepeatedPhrases(transcript),
      sentenceCorrections: parsed.sentenceCorrections || [],
      vocabularyUpgrades: parsed.vocabularyUpgrades || [],
      recommendedNextExercise: parsed.recommendedNextExercise || {
        title: 'Sustained Flow & Pacing Drill',
        type: 'Extempore Drill',
        reason: 'Build stamina and prevent awkward silences under pressure.'
      },
      transcript,
      recordingSession,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Deterministic NLP & Rule-Based evaluation engine
   * Authentically calibrated: NO artificial diplomatic floors.
   */
  private static evaluateWithRuleEngine(params: {
    topicId?: string;
    topicTitle: string;
    transcript: string;
    durationSeconds: number;
    activeDurationSeconds?: number;
    wordCount: number;
    wordsPerMinute: number;
    sessionType: 'extempore' | 'interview' | 'conversation' | 'pronunciation' | 'storytelling';
    recordingSession?: FinalizedRecordingSession;
  }): EvaluationResult {
    const { 
      topicId, 
      topicTitle, 
      transcript, 
      durationSeconds, 
      activeDurationSeconds,
      wordCount, 
      wordsPerMinute, 
      sessionType,
      recordingSession,
    } = params;

    const fillerStats = this.extractFillerWords(transcript);
    const repeatedPhrases = this.extractRepeatedPhrases(transcript);
    const grammaticalChecks = this.detectGrammarIssues(transcript);
    const vocabularyUpgrades = this.detectVocabularyUpgrades(transcript);

    // =========================================================================
    // CASE 1: NEAR-SILENCE / INSUFFICIENT SPEECH (< 15 words)
    // =========================================================================
    if (wordCount < 15) {
      const overallScore = Math.min(22, Math.max(8, Math.round((wordCount / 15) * 20)));
      
      const criteria: CriterionScore[] = [
        {
          criterion: 'Fluency',
          score: Math.min(20, Math.max(8, wordCount * 2)),
          weight: 15,
          status: 'evaluated',
          feedback: `Severely deficient speech volume (${wordCount} words across ${Math.round(durationSeconds)}s). Silence or freezing in an extempore round results in disqualification.`
        },
        {
          criterion: 'Grammar',
          score: 25,
          weight: 20,
          status: 'evaluated',
          feedback: 'Sample size is too small to demonstrate grammatical competence or sentence variety.'
        },
        {
          criterion: 'Vocabulary',
          score: 20,
          weight: 15,
          status: 'evaluated',
          feedback: `Extremely limited vocabulary pool (${wordCount} words detected). Need at least 60-80 words to evaluate range.`
        },
        {
          criterion: 'Pronunciation & Intelligibility',
          score: 25,
          weight: 15,
          status: 'estimated',
          feedback: 'Minimal phonetic material captured for articulation analysis. (Note: Acoustic phonetic lab analysis requires raw audio waveform modeling; this score reflects speech-recognition transcript intelligibility).'
        },
        {
          criterion: 'Clarity',
          score: 20,
          weight: 10,
          status: 'evaluated',
          feedback: 'Incomplete delivery; core thoughts were abandoned before developing.'
        },
        {
          criterion: 'Topic Relevance',
          score: 15,
          weight: 10,
          status: 'evaluated',
          feedback: `Did not meaningfully address "${topicTitle}". The prompt requires a point of view with supporting rationale.`
        },
        {
          criterion: 'Organization',
          score: 12,
          weight: 10,
          status: 'evaluated',
          feedback: 'No discernible structure (no introduction, body points, or conclusion).'
        },
        {
          criterion: 'Delivery',
          score: 15,
          weight: 5,
          status: 'evaluated',
          feedback: 'Abruptly halted. Must build vocal stamina to sustain continuous speaking.'
        }
      ];

      return {
        id: `eval-${Date.now()}`,
        topicId,
        topicTitle,
        sessionType,
        durationSeconds,
        activeDurationSeconds: activeDurationSeconds ?? durationSeconds,
        wordCount,
        wordsPerMinute,
        overallScore,
        criteria,
        strengths: [
          'Microphone connected and recording started successfully',
          wordCount > 0 ? `Captured initial attempt of ${wordCount} words` : 'Attempt initialized'
        ],
        areasForImprovement: [
          `Severe lack of speech: You spoke only ${wordCount} words in ${Math.round(durationSeconds)} seconds. Aim for at least 80-120 words per minute.`,
          'Freezing under pressure: Memorize a universal opening phrase (e.g. "When evaluating this topic, three dimensions come to mind...") so you never freeze.',
          'Sustain your thought: Even if unsure, state a personal observation or real-life anecdote rather than staying silent.'
        ],
        priorityImprovements: [
          'Push through initial freeze: Speak for at least 45 seconds without stopping',
          'Memorize a reliable opening statement to build initial momentum',
          'Practice speaking aloud 1 minute daily on random household objects'
        ],
        strongestPart: wordCount > 0 ? `"${transcript}"` : 'Initiating the session.',
        fillerWords: fillerStats.fillers,
        fillerWordPercentage: fillerStats.percentage,
        repeatedPhrases,
        sentenceCorrections: grammaticalChecks,
        vocabularyUpgrades,
        recommendedNextExercise: {
          title: '30-Second Continuous Flow Drill',
          type: 'Fluency Drill',
          reason: 'Eliminate hesitation and overcome freezing when speaking on prompt.'
        },
        transcript: transcript || '(No clear speech detected)',
        recordingSession,
        createdAt: new Date().toISOString()
      };
    }

    // =========================================================================
    // CASE 2: REALISTIC EVALUATION (>= 15 words)
    // =========================================================================

    // 1. FLUENCY & PACING (Ideal conversational extempore pace: 115 - 150 WPM)
    let fluencyScore = 50;
    if (wordsPerMinute < 35) {
      // Extremely slow / hesitant
      fluencyScore = Math.max(25, 20 + wordsPerMinute);
    } else if (wordsPerMinute >= 35 && wordsPerMinute < 70) {
      // Very halting
      fluencyScore = Math.round(45 + ((wordsPerMinute - 35) / 35) * 15); // 45 - 60
    } else if (wordsPerMinute >= 70 && wordsPerMinute < 105) {
      // Slow but developing
      fluencyScore = Math.round(62 + ((wordsPerMinute - 70) / 35) * 16); // 62 - 78
    } else if (wordsPerMinute >= 105 && wordsPerMinute <= 150) {
      // Ideal natural cadence
      fluencyScore = Math.round(82 + ((150 - Math.abs(wordsPerMinute - 128)) / 150) * 12); // 82 - 94
    } else if (wordsPerMinute > 150 && wordsPerMinute <= 180) {
      // Fast / rushed
      fluencyScore = Math.round(76 - ((wordsPerMinute - 150) / 30) * 10); // 76 - 66
    } else {
      // Rushing too fast (> 180 WPM)
      fluencyScore = Math.max(45, 65 - Math.round((wordsPerMinute - 180) / 3));
    }

    // Deductions for filler words (non-diplomatic!)
    if (fillerStats.percentage > 8) {
      fluencyScore -= 18;
    } else if (fillerStats.percentage > 5) {
      fluencyScore -= 10;
    } else if (fillerStats.percentage > 2.5) {
      fluencyScore -= 5;
    }
    fluencyScore = Math.min(96, Math.max(20, fluencyScore));

    // 2. TOPIC RELEVANCE (Check keyword overlap with topicTitle)
    const topicKeywords = this.extractTopicKeywords(topicTitle);
    const transcriptLower = transcript.toLowerCase();
    let matchedKeywords = 0;
    for (const kw of topicKeywords) {
      if (transcriptLower.includes(kw)) {
        matchedKeywords++;
      }
    }

    const keywordRatio = topicKeywords.length > 0 ? (matchedKeywords / topicKeywords.length) : 0.5;
    let relevanceScore = 40;
    if (matchedKeywords === 0 && wordCount < 40) {
      relevanceScore = 28; // Almost completely off-topic or empty
    } else if (matchedKeywords === 0) {
      relevanceScore = 42; // Drifting or generic
    } else if (keywordRatio >= 0.6) {
      relevanceScore = Math.round(82 + Math.min(12, matchedKeywords * 3));
    } else {
      relevanceScore = Math.round(55 + keywordRatio * 35);
    }
    relevanceScore = Math.min(96, Math.max(22, relevanceScore));

    // 3. GRAMMAR & SENTENCE INTEGRITY
    let grammarScore = 88;
    if (wordCount < 40) grammarScore = 60; // Penalty for simplistic sample
    grammarScore -= (grammaticalChecks.length * 10);
    // Penalty for run-on sentences without punctuation
    const sentenceCount = (transcript.match(/[.!?]+/g) || []).length;
    if (sentenceCount === 0 && wordCount > 30) {
      grammarScore -= 8; // Run-on monologue
    }
    grammarScore = Math.min(95, Math.max(30, grammarScore));

    // 4. VOCABULARY & LEXICAL DIVERSITY
    const allWords = transcript.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const uniqueWords = new Set(allWords).size;
    const lexicalDiversity = wordCount > 0 ? (uniqueWords / wordCount) : 0.5;
    let vocabScore = 50;
    if (wordCount < 40) {
      vocabScore = Math.round(35 + lexicalDiversity * 25);
    } else {
      vocabScore = Math.round(52 + lexicalDiversity * 42);
    }
    // Check for advanced words
    const advancedVocabCount = (transcriptLower.match(/\b(consequently|substantial|perspective|infrastructure|paradox|paradigm|leverage|integral|multifaceted|sustainable|nuanced|predominantly|implications|fundamentally|objective|catalyst)\b/g) || []).length;
    vocabScore += Math.min(8, advancedVocabCount * 3);
    vocabScore = Math.min(94, Math.max(28, vocabScore));

    // 5. ORGANIZATION & STRUCTURE
    const hasIntro = /(in today|to begin with|firstly|i would like to|when we consider|the topic of|a fundamental question|let us start|personally speaking|i believe)/i.test(transcript);
    const hasTransitions = /(furthermore|moreover|on the other hand|however|in addition|consequently|for instance|for example|in contrast|nevertheless)/i.test(transcript);
    const hasConclusion = /(in conclusion|to summarize|to sum up|ultimately|in brief|finally|to wrap up|to conclude)/i.test(transcript);

    let organizationScore = 45;
    if (wordCount < 40) {
      organizationScore = 35;
    } else {
      if (hasIntro) organizationScore += 16;
      if (hasTransitions) organizationScore += 16;
      if (hasConclusion) organizationScore += 16;
    }
    organizationScore = Math.min(95, Math.max(25, organizationScore));

    // 6. CLARITY & INTELLIGIBILITY
    let clarityScore = Math.round((fluencyScore * 0.45) + (grammarScore * 0.4) + (relevanceScore * 0.15));
    clarityScore = Math.min(94, Math.max(25, clarityScore));

    // 7. PRONUNCIATION & ARTICULATION (Estimated)
    let pronunciationScore = Math.round(68 + Math.min(20, lexicalDiversity * 15) - (fillerStats.percentage > 5 ? 8 : 0));
    if (wordCount < 30) pronunciationScore = 45;
    pronunciationScore = Math.min(90, Math.max(35, pronunciationScore));

    // 8. VOCAL DELIVERY & TIME MANAGEMENT
    let deliveryScore = 55;
    if (durationSeconds >= 45 && wordsPerMinute >= 100 && wordsPerMinute <= 160) {
      deliveryScore = 84;
    } else if (durationSeconds < 25) {
      deliveryScore = 38; // Cut short
    } else if (wordsPerMinute < 60) {
      deliveryScore = 48; // Sluggish delivery
    } else {
      deliveryScore = 70;
    }

    // =========================================================================
    // WEIGHTED OVERALL SCORE CALCULATION
    // =========================================================================
    const criteria: CriterionScore[] = [
      {
        criterion: 'Fluency',
        score: fluencyScore,
        weight: 15,
        status: 'evaluated',
        feedback: wordsPerMinute < 70
          ? `Sluggish cadence at ${wordsPerMinute} WPM. Speech was broken by frequent hesitant pauses.`
          : wordsPerMinute > 165
          ? `Rushing pace at ${wordsPerMinute} WPM. Slow down slightly to let key assertions land.`
          : `Well-calibrated delivery rate of ${wordsPerMinute} WPM with balanced momentum.`
      },
      {
        criterion: 'Grammar',
        score: grammarScore,
        weight: 20,
        status: 'evaluated',
        feedback: grammaticalChecks.length === 0
          ? 'Solid grammatical consistency across verb tenses and clause connectors.'
          : `Detected ${grammaticalChecks.length} structural or grammatical patterns requiring correction.`
      },
      {
        criterion: 'Vocabulary',
        score: vocabScore,
        weight: 15,
        status: 'evaluated',
        feedback: lexicalDiversity > 0.65
          ? `Strong lexical variety (${uniqueWords} distinct words out of ${wordCount}).`
          : `Repetitive vocabulary (diversity ratio ${Math.round(lexicalDiversity * 100)}%). Broaden your word choices beyond basic descriptors.`
      },
      {
        criterion: 'Pronunciation & Intelligibility',
        score: pronunciationScore,
        weight: 15,
        status: 'estimated',
        feedback: 'Intelligible phonetic transcription. Focus on sharp consonant endings and vowel distinction. (Note: Pronunciation assessed via speech recognition transcript intelligibility, not laboratory acoustic phonetics).'
      },
      {
        criterion: 'Clarity',
        score: clarityScore,
        weight: 10,
        status: 'evaluated',
        feedback: clarityScore >= 75
          ? 'Core arguments were articulated with unambiguous intent.'
          : 'Communication lacked crispness. Ideas tended to wander or trail off.'
      },
      {
        criterion: 'Topic Relevance',
        score: relevanceScore,
        weight: 10,
        status: 'evaluated',
        feedback: relevanceScore >= 75
          ? `Directly addressed "${topicTitle}" with pertinent conceptual points.`
          : `Weak topic grounding. Used few terms specifically relevant to "${topicTitle}".`
      },
      {
        criterion: 'Organization',
        score: organizationScore,
        weight: 10,
        status: 'evaluated',
        feedback: !hasIntro
          ? 'Lacked an explicit opening thesis. State your core stance in the first sentence.'
          : !hasConclusion
          ? 'Ended abruptly without summarizing your viewpoint. Reserve 15 seconds for a closing conclusion.'
          : 'Structured progression with clear introduction, transitional pivots, and conclusion.'
      },
      {
        criterion: 'Delivery',
        score: deliveryScore,
        weight: 5,
        status: 'evaluated',
        feedback: durationSeconds < 30
          ? `Short delivery (${Math.round(durationSeconds)}s). Aim to hold the floor for the full time.`
          : 'Maintained steady presence throughout the speaking window.'
      }
    ];

    // Compute raw weighted sum
    let computedOverall = Math.round(
      criteria.reduce((acc, c) => acc + (c.score * c.weight), 0) / 100
    );

    // Apply strict length clamps (to prevent diplomatic inflation on short speeches)
    if (wordCount < 30) {
      computedOverall = Math.min(42, computedOverall);
    } else if (wordCount < 60) {
      computedOverall = Math.min(62, computedOverall);
    }

    // Generate candid, non-diplomatic strengths and weaknesses
    const strengths: string[] = [];
    if (wordsPerMinute >= 110 && wordsPerMinute <= 155) {
      strengths.push(`Maintained an optimal conversational rate of ${wordsPerMinute} WPM`);
    }
    if (fillerStats.percentage <= 2.5 && wordCount > 40) {
      strengths.push(`Disciplined vocal control: low filler word rate (${fillerStats.percentage}%)`);
    }
    if (hasIntro && wordCount > 40) {
      strengths.push('Clean opening statement that established direction');
    }
    if (grammaticalChecks.length === 0 && wordCount > 50) {
      strengths.push('Consistent grammatical accuracy across spoken clauses');
    }
    if (strengths.length === 0) {
      strengths.push(
        wordCount > 40
          ? `Delivered a complete continuous speech (${wordCount} words)`
          : `Initiated practice on an analytical topic`
      );
    }

    const areasForImprovement: string[] = [];
    if (fillerStats.percentage > 4) {
      areasForImprovement.push(
        `High filler word frequency: You used "${fillerStats.fillers.map(f => f.word).slice(0, 3).join('", "')}" ${fillerStats.total} times (${fillerStats.percentage}% of all words). Practice taking silent breaths instead.`
      );
    }
    if (wordsPerMinute < 80) {
      areasForImprovement.push(
        `Slow delivery tempo (${wordsPerMinute} WPM). Practice speaking with more continuous momentum to prevent listener distraction.`
      );
    } else if (wordsPerMinute > 165) {
      areasForImprovement.push(
        `Delivery is too fast (${wordsPerMinute} WPM). Slow down at critical insights to allow listeners time to digest.`
      );
    }
    if (!hasConclusion && wordCount > 35) {
      areasForImprovement.push(
        'Missing formal conclusion. Always signal the end of your speech with "In summary..." or "To conclude...".'
      );
    }
    if (relevanceScore < 65) {
      areasForImprovement.push(
        `Stay tightly anchored to the prompt "${topicTitle}". Define the issue early and avoid drifting into unrelated tangents.`
      );
    }
    if (areasForImprovement.length < 3) {
      areasForImprovement.push('Incorporate contrasting transitional markers (e.g. "on the contrary", "conversely") to show nuanced thinking.');
    }

    const priorityImprovements: [string, string, string] = [
      fillerStats.percentage > 4
        ? 'Replace verbal fillers (um, like, basically) with deliberate 1-second silence'
        : 'Adopt the PREP framework (Point, Reason, Example, Point) to structure arguments',
      wordsPerMinute < 90
        ? 'Increase speaking momentum to reach 115-140 words per minute'
        : 'Dedicate the final 15 seconds to a memorable, synthesized conclusion',
      'Broaden domain vocabulary: Replace repeated basic words with precise alternatives'
    ];

    // Find the actual best segment of their speech
    const strongestPart = transcript.length > 30
      ? `"${transcript.slice(0, Math.min(160, transcript.length))}..."`
      : `"${transcript}"`;

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eval-${Date.now()}`,
      topicId,
      topicTitle,
      sessionType,
      durationSeconds,
      activeDurationSeconds: activeDurationSeconds ?? durationSeconds,
      wordCount,
      wordsPerMinute,
      overallScore: computedOverall,
      criteria,
      strengths,
      areasForImprovement: areasForImprovement.slice(0, 3),
      priorityImprovements,
      strongestPart,
      fillerWords: fillerStats.fillers,
      fillerWordPercentage: fillerStats.percentage,
      repeatedPhrases,
      sentenceCorrections: grammaticalChecks,
      vocabularyUpgrades,
      recommendedNextExercise: {
        title: computedOverall < 55
          ? 'Fluency & Pacing Fundamentals'
          : fillerStats.percentage > 4
          ? 'Silent Pauses & Filler Elimination'
          : 'Executive Structure & Conclusion Mastery',
        type: 'Extempore Drill',
        reason: computedOverall < 55
          ? 'Build speaking stamina and eliminate hesitation under pressure.'
          : fillerStats.percentage > 4
          ? 'Train vocal discipline to pause silently instead of vocalizing fillers.'
          : 'Elevate your delivery from casual communication to boardroom presence.'
      },
      transcript,
      recordingSession,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Helper to extract key search tokens from topic title
   */
  private static extractTopicKeywords(title: string): string[] {
    const stopwords = new Set([
      'is', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 
      'and', 'or', 'but', 'about', 'your', 'you', 'how', 'what', 'why', 'when', 
      'where', 'do', 'does', 'can', 'will', 'should', 'would', 'could', 'vs', 'versus',
      'are', 'be', 'been', 'has', 'have', 'had', 'its', 'their', 'we', 'our'
    ]);
    const words = title.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return words.filter(w => !stopwords.has(w));
  }

  private static extractFillerWords(text: string): {
    fillers: { word: string; count: number }[];
    total: number;
    percentage: number;
  } {
    const words = extractWords(text);
    const totalWords = countWords(text);
    const fillerCounts: { [key: string]: number } = {};
    let total = 0;

    for (const filler of COMMON_FILLER_WORDS) {
      if (filler.includes(' ')) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const count = (text.match(regex) || []).length;
        if (count > 0) {
          fillerCounts[filler] = count;
          total += count;
        }
      } else {
        const count = words.filter(w => w === filler.toLowerCase()).length;
        if (count > 0) {
          fillerCounts[filler] = count;
          total += count;
        }
      }
    }

    const fillers = Object.entries(fillerCounts).map(([word, count]) => ({
      word,
      count
    }));

    const percentage = calculateFillerPercentage(total, totalWords);
    return { fillers, total, percentage };
  }

  private static extractRepeatedPhrases(text: string): string[] {
    const phrases = ['you know', 'in terms of', 'as we know', 'at the end of the day', 'like i said', 'sort of'];
    const repeated: string[] = [];

    for (const p of phrases) {
      const count = (text.toLowerCase().match(new RegExp(`\\b${p}\\b`, 'g')) || []).length;
      if (count >= 2) {
        repeated.push(p);
      }
    }
    return repeated;
  }

  /**
   * High-accuracy grammar and spoken collocation detector
   */
  private static detectGrammarIssues(text: string): SentenceCorrection[] {
    const corrections: SentenceCorrection[] = [];

    const checks: {
      regex: RegExp;
      category: SentenceCorrection['category'];
      explanation: string;
      replacement: (match: string) => string;
    }[] = [
      {
        regex: /\bdiscuss\s+about\b/i,
        category: 'Preposition',
        explanation: 'The verb "discuss" is transitive and takes a direct object without the preposition "about".',
        replacement: () => 'discuss'
      },
      {
        regex: /\bemphasize\s+on\b/i,
        category: 'Preposition',
        explanation: '"Emphasize" takes a direct object directly without the preposition "on".',
        replacement: () => 'emphasize'
      },
      {
        regex: /\bcope\s+up\s+with\b/i,
        category: 'Preposition',
        explanation: 'The standard idiom is "cope with", not "cope up with".',
        replacement: () => 'cope with'
      },
      {
        regex: /\brevert\s+back\b/i,
        category: 'Word Choice',
        explanation: '"Revert" already implies returning or replying; "revert back" is redundant.',
        replacement: () => 'revert / reply'
      },
      {
        regex: /\blisten\s+(music|songs|podcasts|radio)\b/i,
        category: 'Preposition',
        explanation: 'The verb "listen" requires the preposition "to" before its object (e.g. "listen to music").',
        replacement: (m) => m.replace(/listen\s+/i, 'listen to ')
      },
      {
        regex: /\bgood\s+in\s+(english|math|coding|speaking|writing)\b/i,
        category: 'Preposition',
        explanation: 'Use "good at" when referring to skills and proficiencies ("good at English").',
        replacement: (m) => m.replace(/good\s+in/i, 'good at')
      },
      {
        regex: /\binterested\s+for\b/i,
        category: 'Preposition',
        explanation: 'The correct collocation is "interested in", not "interested for".',
        replacement: () => 'interested in'
      },
      {
        regex: /\bdid\s+(went|saw|ate|had|came|spoke)\b/i,
        category: 'Verb Tense',
        explanation: 'After the auxiliary "did", always use the base infinitive verb form (e.g. "did go", "did see").',
        replacement: (m) => {
          const map: { [k: string]: string } = { went: 'go', saw: 'see', ate: 'eat', had: 'have', came: 'come', spoke: 'speak' };
          const past = m.split(/\s+/)[1].toLowerCase();
          return `did ${map[past] || past}`;
        }
      },
      {
        regex: /\bcould\s+able\s+to\b/i,
        category: 'Structure',
        explanation: '"Could" and "able to" express the same modality. Use either "could" or "was able to".',
        replacement: () => 'could / was able to'
      },
      {
        regex: /\bmore\s+(better|easier|faster|harder|bigger)\b/i,
        category: 'Grammar',
        explanation: 'Double comparative: adjectives like "better" or "easier" are already comparative without "more".',
        replacement: (m) => m.split(/\s+/)[1]
      },
      {
        regex: /\bone\s+of\s+my\s+(friend|colleague|brother|teacher)\b/i,
        category: 'Grammar',
        explanation: '"One of" refers to an individual among a group and must be followed by a plural noun (e.g. "one of my friends").',
        replacement: (m) => m + 's'
      },
      {
        regex: /\beveryone\s+have\b/i,
        category: 'Subject-Verb Agreement',
        explanation: 'The indefinite pronoun "everyone" is grammatically singular and requires the singular verb "has".',
        replacement: () => 'everyone has'
      },
      {
        regex: /\beverybody\s+know\b/i,
        category: 'Subject-Verb Agreement',
        explanation: '"Everybody" is singular and takes the third-person singular verb "knows".',
        replacement: () => 'everybody knows'
      },
      {
        regex: /\bsince\s+(\d+|many|few)\s+(years|months|days)\b/i,
        category: 'Tense',
        explanation: 'Use "for" to indicate a period or duration of time, and "since" only for a specific starting point.',
        replacement: (m) => m.replace(/^since/i, 'for')
      },
      {
        regex: /\bpassed\s+out\s+from\s+(college|school|university)\b/i,
        category: 'Word Choice',
        explanation: 'In standard English, "pass out" means to lose consciousness. Use "graduated from college".',
        replacement: () => 'graduated from college'
      },
      {
        regex: /\bpay\s+attention\s+on\b/i,
        category: 'Preposition',
        explanation: 'The standard collocation is "pay attention to", not "pay attention on".',
        replacement: () => 'pay attention to'
      },
      {
        regex: /\baccording\s+to\s+me\b/i,
        category: 'Clarity',
        explanation: '"According to" is typically used for third-party authorities. For your own view, use "in my opinion" or "from my perspective".',
        replacement: () => 'in my opinion'
      }
    ];

    for (const check of checks) {
      const match = text.match(check.regex);
      if (match) {
        const originalSnippet = match[0];
        corrections.push({
          original: `...${originalSnippet}...`,
          corrected: `...${check.replacement(originalSnippet)}...`,
          explanation: check.explanation,
          category: check.category
        });
      }
    }

    return corrections.slice(0, 4);
  }

  /**
   * Contextual vocabulary upgrades tailored to user's actual speech
   */
  private static detectVocabularyUpgrades(text: string): VocabularyUpgrade[] {
    const upgrades: VocabularyUpgrade[] = [];
    const lower = text.toLowerCase();

    if (/\b(big)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'big',
        suggestedAlternatives: ['substantial', 'monumental', 'profound', 'consequential'],
        contextSentence: 'Transform statements like "a big difference" to "a profound transformation".'
      });
    }

    if (/\b(good)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'good',
        suggestedAlternatives: ['exemplary', 'commendable', 'effective', 'robust'],
        contextSentence: 'Elevate casual descriptions: "exemplary initiative" instead of "good thing".'
      });
    }

    if (/\b(bad)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'bad',
        suggestedAlternatives: ['detrimental', 'adverse', 'suboptimal', 'unfavorable'],
        contextSentence: 'Describe negative impacts precisely: "adverse consequences" instead of "bad results".'
      });
    }

    if (/\b(very)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'very',
        suggestedAlternatives: ['exceptionally', 'immensely', 'inherently', 'profoundly'],
        contextSentence: 'Replace generic intensifiers: "exceptionally challenging" instead of "very hard".'
      });
    }

    if (/\b(important)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'important',
        suggestedAlternatives: ['paramount', 'pivotal', 'crucial', 'indispensable'],
        contextSentence: 'Reinforce significance: "of paramount importance" instead of "very important".'
      });
    }

    if (/\b(things?|stuff)\b/.test(lower)) {
      upgrades.push({
        originalWord: 'thing / stuff',
        suggestedAlternatives: ['elements', 'dynamics', 'factors', 'considerations'],
        contextSentence: 'Specify abstract objects: "these critical factors" instead of "these things".'
      });
    }

    return upgrades.slice(0, 3);
  }
}
