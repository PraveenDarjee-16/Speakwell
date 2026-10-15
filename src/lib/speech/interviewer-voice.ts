/**
 * Interviewer Voice Service (Browser SpeechSynthesis Wrapper)
 * 
 * Provides voice output for the Live AI Interviewer.
 * 
 * Capabilities:
 * - Asynchronous voice discovery with fallback to system default
 * - Rate and pitch modulation
 * - Instant cancellation on user interrupt (e.g. mic activation)
 * - Mute/unmute state management
 * - Event callbacks: onStart, onEnd, onError
 * 
 * Limitation Notice:
 * Browser SpeechSynthesis provides spoken audio using client-side platform voices.
 * It does not require external paid API keys or streaming infrastructure, but voice
 * naturalness depends on the user's browser, OS, and installed speech synthesizer.
 */

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isNatural: boolean;
}

export interface SpeakOptions {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  isMuted?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class InterviewerVoiceService {
  private static instance: InterviewerVoiceService | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingActive: boolean = false;

  private constructor() {}

  public static getInstance(): InterviewerVoiceService {
    if (!InterviewerVoiceService.instance) {
      InterviewerVoiceService.instance = new InterviewerVoiceService();
    }
    return InterviewerVoiceService.instance;
  }

  /**
   * Checks if browser supports SpeechSynthesis
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  /**
   * Retrieves available voices from browser, filtering for English where possible
   */
  public async getVoices(): Promise<VoiceOption[]> {
    if (!this.isSupported()) return [];

    return new Promise((resolve) => {
      const fetchAndFormat = () => {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        if (!voices || voices.length === 0) {
          return [];
        }

        // Prioritize English voices, but fallback to all if none found
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        const targetList = englishVoices.length > 0 ? englishVoices : voices;

        return targetList.map(v => {
          const isNatural = 
            v.name.includes('Natural') || 
            v.name.includes('Google') || 
            v.name.includes('Neural') || 
            v.name.includes('Samantha') || 
            v.name.includes('Daniel') || 
            v.name.includes('Microsoft');

          return {
            voiceURI: v.voiceURI,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
            isNatural
          };
        });
      };

      const initial = fetchAndFormat();
      if (initial.length > 0) {
        return resolve(initial);
      }

      // Voice list loads asynchronously in Chrome/Blink
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(fetchAndFormat());
        };
      }

      // Safety timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        resolve(fetchAndFormat());
      }, 500);
    });
  }

  /**
   * Speaks the provided text using the browser synthesizer.
   * Cancels any prior ongoing audio to prevent echo or overlap.
   */
  public speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        console.warn('SpeechSynthesis is not supported on this browser.');
        options.onEnd?.();
        return resolve();
      }

      // If muted, skip speaking but still trigger lifecycle callbacks so UI remains in sync
      if (options.isMuted) {
        this.stop();
        options.onStart?.();
        setTimeout(() => {
          options.onEnd?.();
          resolve();
        }, 120);
        return;
      }

      // Clean text: strip markdown symbols or excessive punctuation for natural speech flow
      const cleanedText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[\r\n]+/g, ' ')
        .trim();

      if (!cleanedText) {
        options.onEnd?.();
        return resolve();
      }

      // Cancel prior speech
      this.stop();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.rate = Math.max(0.7, Math.min(1.4, options.rate || 0.95));
        utterance.pitch = Math.max(0.8, Math.min(1.2, options.pitch || 1.0));
        utterance.lang = 'en-US';

        const synth = window.speechSynthesis;
        const voices = synth.getVoices();

        if (voices.length > 0) {
          if (options.voiceURI) {
            const chosen = voices.find(v => v.voiceURI === options.voiceURI);
            if (chosen) utterance.voice = chosen;
          }

          // If no voice explicitly matched, pick a smooth English voice
          if (!utterance.voice) {
            const preferred = voices.find(v => 
              v.lang.startsWith('en') && 
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
            );
            if (preferred) utterance.voice = preferred;
          }
        }

        utterance.onstart = () => {
          this.isSpeakingActive = true;
          options.onStart?.();
        };

        utterance.onend = () => {
          this.isSpeakingActive = false;
          this.currentUtterance = null;
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (e) => {
          // Cancelled errors are expected when user interrupts
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('Speech synthesis utterance notice:', e.error);
          }
          this.isSpeakingActive = false;
          this.currentUtterance = null;
          options.onError?.(e);
          options.onEnd?.();
          resolve();
        };

        this.currentUtterance = utterance;
        synth.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis exception:', err);
        this.isSpeakingActive = false;
        options.onError?.(err);
        options.onEnd?.();
        resolve();
      }
    });
  }

  /**
   * Immediately stops any active speech.
   * Essential before candidate begins microphone recording.
   */
  public stop(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
    }
    this.isSpeakingActive = false;
    this.currentUtterance = null;
  }

  /**
   * Returns whether the AI interviewer is actively speaking audio.
   */
  public isSpeaking(): boolean {
    return this.isSpeakingActive && this.isSupported() && window.speechSynthesis.speaking;
  }
}
