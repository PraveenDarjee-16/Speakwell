export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  error: string | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

/**
 * Encodes an AudioBuffer into a universally compatible 16-bit PCM WAV Blob
 * with valid RIFF header. Supported on all operating systems (Windows, Mac, iOS, Android).
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // Mono: eliminates dual-mic phase delay and double-sound echo
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = uncompressed PCM
  const bitDepth = 16;

  // Extract mono channel data (if stereo, downmix both channels to mono)
  let channelData: Float32Array;
  if (buffer.numberOfChannels === 1) {
    channelData = buffer.getChannelData(0);
  } else {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    channelData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      channelData[i] = (left[i] + right[i]) / 2;
    }
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = channelData.length * bytesPerSample;
  const totalSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');

  // "fmt " Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample (16-bit)

  // "data" Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write 16-bit linear PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    // Clamp sample between -1.0 and 1.0
    const s = Math.max(-1, Math.min(1, channelData[i]));
    // Convert float to 16-bit signed integer (-32768 to 32767)
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export interface RecordedAudioResult {
  audioBlob: Blob;
  audioUrl: string;
  durationSeconds: number; // Final authoritative duration from audio metadata or monotonic clock
  activeDurationSeconds: number; // Active recording duration excluding paused intervals
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isCleaningUp: boolean = false;

  // Monotonic timer state (using performance.now() to prevent drift or closure bugs)
  private startTime: number = 0;
  private totalPausedMs: number = 0;
  private pausedAt: number | null = null;

  public async startRecording(onVolumeChange?: (volume: number) => void): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio recording is not supported on this browser.');
      }

      // Reset monotonic timer
      this.startTime = 0;
      this.totalPausedMs = 0;
      this.pausedAt = null;

      // Force single mono channel to eliminate laptop dual-microphone array phase delay & echo
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Single mono channel
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up Web Audio API Analyser for real-time waveform visualizer (isolated from audio output)
      if (onVolumeChange) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
          // Only connect to analyser, NEVER connect to audioContext.destination (which would cause live echo!)
          this.sourceNode.connect(this.analyser);

          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          const updateVolume = () => {
            if (this.analyser && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const normalized = Math.min(100, Math.round((average / 128) * 100));
              onVolumeChange(normalized);
              requestAnimationFrame(updateVolume);
            }
          };
          requestAnimationFrame(updateVolume);
        }
      }

      this.audioChunks = [];
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(
        this.stream,
        selectedMimeType ? { mimeType: selectedMimeType } : undefined
      );

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Record start timestamp ONLY when mediaRecorder successfully starts
      this.mediaRecorder.start(250); // Capture chunks every 250ms
      this.startTime = performance.now();
      this.totalPausedMs = 0;
      this.pausedAt = null;
    } catch (err: unknown) {
      this.cleanup();
      const errName = (err instanceof Error) ? err.name : '';
      const errMsg = (err instanceof Error) ? err.message : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        throw new Error('Microphone permission was denied. Please allow microphone access in your browser settings to practice.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        throw new Error('No microphone device was detected on your computer.');
      } else {
        throw new Error(errMsg || 'Unable to access your microphone.');
      }
    }
  }

  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.pausedAt = performance.now();
      this.mediaRecorder.pause();
    }
  }

  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      if (this.pausedAt !== null) {
        this.totalPausedMs += performance.now() - this.pausedAt;
        this.pausedAt = null;
      }
      this.mediaRecorder.resume();
    }
  }

  public stopRecording(): Promise<RecordedAudioResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder has not been initialized.'));
      }

      // Calculate elapsed active recording duration using monotonic clock
      const stopNow = performance.now();
      const extraPaused = this.pausedAt !== null ? (stopNow - this.pausedAt) : 0;
      const totalPaused = this.totalPausedMs + extraPaused;
      const monotonicActiveSeconds = this.startTime > 0
        ? Math.max(0, (stopNow - this.startTime - totalPaused) / 1000)
        : 0;

      this.mediaRecorder.onstop = async () => {
        try {
          if (this.audioChunks.length === 0) {
            this.cleanup();
            return reject(new Error('No audio was captured. Please speak into the microphone and try again.'));
          }

          const rawMimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const rawBlob = new Blob(this.audioChunks, { type: rawMimeType });

          // Convert raw recording into standard 16-bit PCM WAV for 100% universal playback and download
          let finalBlob: Blob = rawBlob;
          let audioMetadataDuration: number | null = null;

          try {
            const arrayBuffer = await rawBlob.arrayBuffer();
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
              const decodeCtx = new AudioCtx();
              const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
              if (Number.isFinite(audioBuffer.duration) && audioBuffer.duration > 0.1) {
                audioMetadataDuration = audioBuffer.duration;
              }
              finalBlob = audioBufferToWav(audioBuffer);
              if (decodeCtx.state !== 'closed') {
                await decodeCtx.close();
              }
            }
          } catch (wavErr) {
            console.warn('WAV conversion notice (falling back to raw audio blob):', wavErr);
            finalBlob = rawBlob;
          }

          // Authoritative duration: use audio metadata if valid (> 0.2s), else fallback to monotonic timer
          const finalDurationSeconds = (audioMetadataDuration !== null && audioMetadataDuration > 0.2)
            ? Math.round(audioMetadataDuration * 10) / 10
            : Math.round(monotonicActiveSeconds * 10) / 10;

          const audioUrl = URL.createObjectURL(finalBlob);
          this.cleanup();

          resolve({
            audioBlob: finalBlob,
            audioUrl,
            durationSeconds: finalDurationSeconds,
            activeDurationSeconds: Math.round(monotonicActiveSeconds * 10) / 10,
          });
        } catch (err: unknown) {
          this.cleanup();
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  public discardRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.isCleaningUp) return;
    this.isCleaningUp = true;

    try {
      if (this.stream) {
        this.stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        this.stream = null;
      }
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch {}
        this.sourceNode = null;
      }
      if (this.analyser) {
        try {
          this.analyser.disconnect();
        } catch {}
        this.analyser = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          this.audioContext.close();
        } catch {}
        this.audioContext = null;
      }
      this.mediaRecorder = null;
      this.audioChunks = [];
    } finally {
      this.isCleaningUp = false;
    }
  }
}
