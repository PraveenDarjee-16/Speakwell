import { NextRequest, NextResponse } from 'next/server';
import { LiveInterviewEngine } from '@/lib/ai/live-interview-engine';
import { LiveInterviewConfig, ConversationTurn } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'Action is required ("start", "respond", "clarify", or "evaluate").' },
        { status: 400 }
      );
    }

    // 1. Action: Start Live Interview
    if (action === 'start') {
      const config: LiveInterviewConfig = body.config;
      if (!config || !config.topic || config.topic.trim().length === 0) {
        return NextResponse.json(
          { error: 'Valid interview configuration with topic is required.' },
          { status: 400 }
        );
      }

      // Limit topic length to avoid prompt injection or abuse
      config.topic = config.topic.slice(0, 300);

      const openingText = await LiveInterviewEngine.generateOpening(config);
      return NextResponse.json({
        text: openingText,
        speaker: 'ai',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Action: Respond to Candidate Answer
    if (action === 'respond') {
      const { config, turns, userAnswer } = body as {
        config: LiveInterviewConfig;
        turns: ConversationTurn[];
        userAnswer: string;
      };

      if (!config || !userAnswer || userAnswer.trim().length === 0) {
        return NextResponse.json(
          { error: 'User answer and configuration are required.' },
          { status: 400 }
        );
      }

      // Input size limits
      const sanitizedAnswer = userAnswer.slice(0, 3000);
      const safeTurns = Array.isArray(turns) ? turns.slice(-12) : [];

      const followUpText = await LiveInterviewEngine.generateFollowUp(config, safeTurns, sanitizedAnswer);
      return NextResponse.json({
        text: followUpText,
        speaker: 'ai',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Action: Clarify or simplify last question
    if (action === 'clarify') {
      const { config, turns, lastQuestion } = body as {
        config: LiveInterviewConfig;
        turns: ConversationTurn[];
        lastQuestion: string;
      };

      if (!config || !lastQuestion) {
        return NextResponse.json(
          { error: 'Last question is required for clarification.' },
          { status: 400 }
        );
      }

      const safeTurns = Array.isArray(turns) ? turns.slice(-12) : [];
      const clarification = await LiveInterviewEngine.clarifyQuestion(config, safeTurns, lastQuestion.slice(0, 500));

      return NextResponse.json({
        text: clarification,
        speaker: 'ai',
        timestamp: new Date().toISOString(),
        isClarification: true
      });
    }

    // 4. Action: Evaluate Full Interview
    if (action === 'evaluate') {
      const { config, turns, durationSeconds } = body as {
        config: LiveInterviewConfig;
        turns: ConversationTurn[];
        durationSeconds: number;
      };

      if (!config || !Array.isArray(turns) || turns.length === 0) {
        return NextResponse.json(
          { error: 'Interview turns and configuration are required for evaluation.' },
          { status: 400 }
        );
      }

      const evaluation = await LiveInterviewEngine.evaluateInterview({
        config,
        turns,
        durationSeconds: Math.max(1, Number(durationSeconds) || 1)
      });

      return NextResponse.json(evaluation);
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}"` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in /api/live-interview:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing live interview request.' },
      { status: 500 }
    );
  }
}
