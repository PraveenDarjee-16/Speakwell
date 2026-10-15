import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required for transcription.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.WHISPER_API_KEY || process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';

    // If external Whisper API is configured
    if (apiKey && !apiKey.includes('your-openai') && !apiKey.includes('your-whisper')) {
      const whisperFormData = new FormData();
      whisperFormData.append('file', audioFile, 'audio.webm');
      whisperFormData.append('model', 'whisper-1');
      whisperFormData.append('language', 'en');

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          transcript: data.text || '',
          source: 'whisper-api',
          status: 'success'
        });
      }
    }

    // If external STT is not configured, inform client to use browser Web Speech API
    return NextResponse.json({
      transcript: '',
      source: 'client-speech-api',
      status: 'fallback-to-browser',
      message: 'Server Whisper STT API key not configured. Using high-precision browser Web Speech API transcription.'
    });
  } catch (err: any) {
    console.error('Error in /api/transcribe:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process audio transcription.' },
      { status: 500 }
    );
  }
}
