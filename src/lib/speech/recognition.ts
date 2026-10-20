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
  private isExplicitlyStopped: boolean = true;
  private isStarting: boolean = false;

  // Multi-session persistent accumulation (persists across Chrome 45-60s timeouts)
  private accumulatedTranscript: string = '';
  private currentSessionFinal: string = '';
  private currentSessionInterim: string = '';

  private onUpdateCallback?: (update: LiveTranscriptUpdate) => void;
  private language: string = 'en-US';
  private restartTimer: any = null;
  private watchdogTimer: any = null;
  private consecutiveErrors: number = 0;
  private lastResultTimestamp: number = 0;

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
    this.isExplicitlyStopped = false;
    this.accumulatedTranscript = '';
    this.currentSessionFinal = '';
    this.currentSessionInterim = '';
    this.onUpdateCallback = onUpdate;
    this.language = language;
    this.consecutiveErrors = 0;
    this.lastResultTimestamp = Date.now();

    this.startWatchdog();
    return this.createAndStartSession();
  }

  private createAndStartSession(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.isListening || this.isPaused || this.isExplicitlyStopped) {
      return false;
    }

    if (this.isStarting) {
      return false;
    }

    this.isStarting = true;
    this.cleanupCurrentInstance();

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        this.isStarting = false;
        return false;
      }

      const rec = new SpeechRecognitionConstructor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = this.language;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.isStarting = false;
        this.consecutiveErrors = 0;
        this.lastResultTimestamp = Date.now();
      };

      rec.onresult = (event: any) => {
        this.consecutiveErrors = 0;
        this.lastResultTimestamp = Date.now();

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            sessionFinal += item[0].transcript + ' ';
          } else {
            sessionInterim += item[0].transcript;
          }
        }

        this.currentSessionFinal = sessionFinal.trim();
        this.currentSessionInterim = sessionInterim.trim();

        this.emitUpdate();
      };

      rec.onerror = (event: any) => {
        this.isStarting = false;
        const error = event.error;
        console.warn('Speech recognition notice:', error);

        // Expected notices during user pauses, natural silence, or instance cleanup
        if (error === 'no-speech' || error === 'audio-capture' || error === 'aborted') {
          return;
        }

        // 'network' occurs when Chrome's 45-60s Google Speech socket drops.
        // It will trigger onend immediately after, where we seamlessly reconnect.
        if (error === 'network') {
          this.consecutiveErrors++;
          return;
        }

        // Permission errors
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          // If we had already been listening or have transcribed speech, treat as temporary contention
          if (this.accumulatedTranscript || this.currentSessionFinal) {
            this.consecutiveErrors++;
            return;
          }
          // Genuine initial permission rejection
          this.isListening = false;
          this.isExplicitlyStopped = true;
          this.stopWatchdog();
          return;
        }

        this.consecutiveErrors++;
      };

      rec.onend = () => {
        this.isStarting = false;

        // 1. Commit whatever was in this session before it ended into persistent accumulation
        this.commitCurrentSession();

        // 2. Auto-reconnect if session is active (handles Chrome's 45-60s limit and drops)
        if (this.isListening && !this.isPaused && !this.isExplicitlyStopped) {
          this.scheduleRestart();
        }
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (e) {
      this.isStarting = false;
      console.warn('Speech recognition start failed, scheduling retry:', e);
      if (this.isListening && !this.isPaused && !this.isExplicitlyStopped) {
        this.scheduleRestart(300);
      }
      return false;
    }
  }

  private commitCurrentSession(): void {
    const parts: string[] = [];
    if (this.accumulatedTranscript) {
      parts.push(this.accumulatedTranscript);
    }
    if (this.currentSessionFinal) {
      parts.push(this.currentSessionFinal);
    }
    if (this.currentSessionInterim) {
      // If session closed mid-utterance, retain interim speech so trailing words are never dropped
      parts.push(this.currentSessionInterim);
    }

    const merged = parts.join(' ').replace(/\s+/g, ' ').trim();
    this.accumulatedTranscript = merged;
    this.currentSessionFinal = '';
    this.currentSessionInterim = '';

    // Broadcast update so UI maintains complete transcript display without stutter
    this.emitUpdate();
  }

  private scheduleRestart(forcedDelayMs?: number): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (!this.isListening || this.isPaused || this.isExplicitlyStopped) {
      return;
    }

    // Exponential backoff:
    // First reconnection attempt runs at 200ms for seamless continuation.
    // Repeated consecutive errors escalate: 450ms, 700ms, capped at 2500ms.
    const delay = forcedDelayMs !== undefined
      ? forcedDelayMs
      : Math.min(2500, 200 + Math.max(0, this.consecutiveErrors - 1) * 250);

    this.restartTimer = setTimeout(() => {
      if (this.isListening && !this.isPaused && !this.isExplicitlyStopped) {
        this.createAndStartSession();
      }
    }, delay);
  }

  private startWatchdog(): void {
    this.stopWatchdog();
    // Heartbeat check every 6 seconds
    this.watchdogTimer = setInterval(() => {
      if (!this.isListening || this.isPaused || this.isExplicitlyStopped) {
        return;
      }

      // If speech was active but no event has arrived for 40 seconds,
      // Chrome's recognition socket may have frozen silently without firing onend.
      const silentMs = Date.now() - this.lastResultTimestamp;
      if (silentMs > 40000) {
        console.log('[LiveSpeechRecognitionService] Watchdog reviving silent session.');
        this.commitCurrentSession();
        this.lastResultTimestamp = Date.now();
        this.createAndStartSession();
      }
    }, 6000);
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private cleanupCurrentInstance(): void {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        try {
          this.recognition.abort();
        } catch {}
      } catch {}
      this.recognition = null;
    }
  }

  private emitUpdate(): void {
    const fullText = this.getCurrentTranscript();
    const interim = this.currentSessionInterim;
    const update = this.analyzeTranscript(fullText, interim);
    if (this.onUpdateCallback) {
      this.onUpdateCallback(update);
    }
  }

  public pauseListening(): void {
    this.isPaused = true;
    this.stopWatchdog();

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.commitCurrentSession();
    this.cleanupCurrentInstance();
  }

  public resumeListening(): void {
    if (!this.isListening) return;
    this.isPaused = false;
    this.isExplicitlyStopped = false;
    this.consecutiveErrors = 0;
    this.lastResultTimestamp = Date.now();
    this.startWatchdog();
    this.createAndStartSession();
  }

  public stopListening(): string {
    this.isListening = false;
    this.isPaused = false;
    this.isExplicitlyStopped = true;
    this.isStarting = false;
    this.stopWatchdog();

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.commitCurrentSession();
    this.cleanupCurrentInstance();

    return this.accumulatedTranscript.trim();
  }

  public getCurrentTranscript(): string {
    const parts: string[] = [];
    if (this.accumulatedTranscript) parts.push(this.accumulatedTranscript);
    if (this.currentSessionFinal) parts.push(this.currentSessionFinal);
    if (this.currentSessionInterim) parts.push(this.currentSessionInterim);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
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
