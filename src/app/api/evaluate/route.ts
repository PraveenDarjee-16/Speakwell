import { NextRequest, NextResponse } from 'next/server';
import { SpeechEvaluationService, EvaluationRequest } from '@/lib/ai/evaluation-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body: EvaluationRequest = await req.json();

    if (!body || body.transcript === undefined || body.transcript === null) {
      return NextResponse.json(
        { error: 'Transcript data is required for speech evaluation.' },
        { status: 400 }
      );
    }

    // Run the server-side evaluation service
    const evaluation = await SpeechEvaluationService.evaluateSpeech(body);

    // If Supabase is configured and a user session exists, persist to database
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evaluation.id);
          let alreadyExists = false;

          if (isValidUUID) {
            const { data: existing } = await supabase
              .from('practice_sessions')
              .select('id')
              .eq('id', evaluation.id)
              .maybeSingle();

            if (existing) {
              alreadyExists = true;
            }
          }

          if (!alreadyExists) {
            await supabase.from('practice_sessions').insert({
              ...(isValidUUID ? { id: evaluation.id } : {}),
              user_id: user.id,
              topic_id: body.topicId || null,
              topic_title: evaluation.topicTitle,
              session_type: evaluation.sessionType,
              duration_seconds: evaluation.durationSeconds,
              word_count: evaluation.wordCount,
              words_per_minute: evaluation.wordsPerMinute,
              overall_score: evaluation.overallScore,
              criteria_scores: evaluation.criteria,
              strengths: evaluation.strengths,
              areas_for_improvement: evaluation.areasForImprovement,
              priority_improvements: evaluation.priorityImprovements,
              strongest_part: evaluation.strongestPart,
              filler_words: evaluation.fillerWords,
              filler_percentage: evaluation.fillerWordPercentage,
              repeated_phrases: evaluation.repeatedPhrases,
              transcript: evaluation.transcript,
              sentence_corrections: evaluation.sentenceCorrections,
              vocabulary_upgrades: evaluation.vocabularyUpgrades,
              recommended_next_exercise: evaluation.recommendedNextExercise,
            });
          }
        }
      }
    } catch (dbError) {
      console.warn('Could not save session to Supabase, client demo mode will persist locally:', dbError);
    }

    return NextResponse.json(evaluation, { status: 200 });
  } catch (err: unknown) {
    console.error('Error in /api/evaluate:', err);
    const message = err instanceof Error ? err.message : 'An error occurred during speech evaluation.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
