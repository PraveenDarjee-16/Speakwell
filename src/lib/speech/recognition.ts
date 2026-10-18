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
  private isPaused: boolean = false;
  private fullTranscript: string = '';
  private lastInterim: string = '';
  private onUpdateCallback?: (update: LiveTranscriptUpdate) => void;
  private language: string = 'en-US';
  private restartTimer: any = null;
  private consecutiveErrors: number = 0;

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

    this.isListening = true;
    this.isPaused = false;
    this.fullTranscript = '';
    this.lastInterim = '';
    this.onUpdateCallback = onUpdate;
    this.language = language;
    this.consecutiveErrors = 0;

    return this.initAndStart();
  }

  private initAndStart(): boolean {
    if (!this.isListening || this.isPaused) return false;

    try {
      // Abort and unbind previous instance to avoid duplicate listeners or state collision
      if (this.recognition) {
        try {
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
          this.recognition.abort();
        } catch {}
        this.recognition = null;
      }

      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      const rec = new SpeechRecognitionConstructor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = this.language;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        this.consecutiveErrors = 0;
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
          const combinedFull = (this.fullTranscript + ' ' + finalSegment).replace(/\s+/g, ' ').trim();
          this.fullTranscript = combinedFull ? combinedFull + ' ' : '';
        }

        this.lastInterim = interim.trim();
        const combined = (this.fullTranscript + ' ' + interim).replace(/\s+/g, ' ').trim();
        const update = this.analyzeTranscript(combined, interim);
        if (this.onUpdateCallback) {
          this.onUpdateCallback(update);
        }
      };

      rec.onerror = (event: any) => {
        const error = event.error;
        console.warn('Speech recognition notice:', error);

        // 'no-speech' happens when the user takes a natural breath or pause to think
        if (error === 'no-speech' || error === 'audio-capture') {
          return;
        }

        // Permission denied
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.isListening = false;
          return;
        }

        this.consecutiveErrors++;
      };

      rec.onend = () => {
        // Commit any trailing interim text so speech uttered right before cut is never lost
        if (this.lastInterim) {
          this.fullTranscript = (this.fullTranscript + ' ' + this.lastInterim).replace(/\s+/g, ' ').trim() + ' ';
          this.lastInterim = '';
        }

        // Auto-reconnect if session is still active (handles Chrome's 45-60s limit and silence drops)
        if (this.isListening && !this.isPaused) {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          const backoff = Math.min(1000, 50 * Math.max(1, this.consecutiveErrors));
          this.restartTimer = setTimeout(() => {
            if (this.isListening && !this.isPaused) {
              this.initAndStart();
            }
          }, backoff);
        }
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (e) {
      console.warn('Failed to start SpeechRecognition session:', e);
      if (this.isListening && !this.isPaused) {
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isListening && !this.isPaused) {
            this.initAndStart();
          }
        }, 200);
      }
      return false;
    }
  }

  public pauseListening(): void {
    this.isPaused = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    if (this.lastInterim) {
      this.fullTranscript = (this.fullTranscript + ' ' + this.lastInterim).replace(/\s+/g, ' ').trim() + ' ';
      this.lastInterim = '';
    }
  }

  public resumeListening(): void {
    if (!this.isListening) return;
    this.isPaused = false;
    this.initAndStart();
  }

  public stopListening(): string {
    this.isListening = false;
    this.isPaused = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
      this.recognition = null;
    }
    // Include any trailing interim speech before finalizing
    if (this.lastInterim) {
      this.fullTranscript = (this.fullTranscript + ' ' + this.lastInterim).replace(/\s+/g, ' ').trim();
      this.lastInterim = '';
    }
    return this.fullTranscript.trim();
  }

  public getCurrentTranscript(): string {
    return (this.fullTranscript + ' ' + this.lastInterim).replace(/\s+/g, ' ').trim();
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
