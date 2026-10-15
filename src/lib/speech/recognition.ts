export interface LiveTranscriptUpdate {
  transcript: string;
  interimTranscript: string;
  wordCount: number;
  fillerCount: number;
  detectedFillers: { word: string; count: number }[];
}

export const COMMON_FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'basically', 'actually', 
  'literally', 'you know', 'sort of', 'kind of', 'i mean', 'right'
];

export class LiveSpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private fullTranscript: string = '';
  private lastInterim: string = '';
  private onUpdateCallback?: (update: LiveTranscriptUpdate) => void;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }

  public startListening(
    onUpdate: (update: LiveTranscriptUpdate) => void,
    language: string = 'en-US'
  ): boolean {
    if (!LiveSpeechRecognitionService.isSupported()) {
      return false;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.fullTranscript = '';
      this.lastInterim = '';
      this.onUpdateCallback = onUpdate;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalSegment += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalSegment) {
          this.fullTranscript += finalSegment;
        }

        this.lastInterim = interim.trim();
        const combined = (this.fullTranscript + ' ' + interim).trim();
        const update = this.analyzeTranscript(combined, interim);
        if (this.onUpdateCallback) {
          this.onUpdateCallback(update);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Restart if continuous stopped unexpectedly
          }
        }
      };

      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start SpeechRecognition', e);
      return false;
    }
  }

  public stopListening(): string {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
      this.recognition = null;
    }
    // Include any trailing interim speech before finalizing
    if (this.lastInterim) {
      this.fullTranscript = (this.fullTranscript + ' ' + this.lastInterim).trim();
      this.lastInterim = '';
    }
    return this.fullTranscript.trim();
  }

  public getCurrentTranscript(): string {
    return (this.fullTranscript + ' ' + this.lastInterim).trim();
  }

  private analyzeTranscript(text: string, interimText: string): LiveTranscriptUpdate {
    const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const wordCount = words.length;

    const detectedFillers: { [key: string]: number } = {};
    let fillerCount = 0;

    for (const filler of COMMON_FILLER_WORDS) {
      if (filler.includes(' ')) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          detectedFillers[filler] = matches.length;
          fillerCount += matches.length;
        }
      } else {
        const count = words.filter(w => w === filler).length;
        if (count > 0) {
          detectedFillers[filler] = count;
          fillerCount += count;
        }
      }
    }

    const fillerList = Object.entries(detectedFillers).map(([word, count]) => ({
      word,
      count
    }));

    return {
      transcript: text.trim(),
      interimTranscript: interimText.trim(),
      wordCount,
      fillerCount,
      detectedFillers: fillerList
    };
  }
}
