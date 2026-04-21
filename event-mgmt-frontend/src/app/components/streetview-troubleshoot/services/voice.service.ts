import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaRecorder: boolean;
  isSecureContext: boolean;
  browser: string;
  os: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private stateSubject      = new BehaviorSubject<VoiceState>('idle');
  private transcriptSubject = new BehaviorSubject<string>('');
  private errorSubject      = new BehaviorSubject<string>('');
  private volumeSubject     = new BehaviorSubject<number>(0);

  public state$      = this.stateSubject.asObservable();
  public transcript$ = this.transcriptSubject.asObservable();
  public error$      = this.errorSubject.asObservable();
  public volume$     = this.volumeSubject.asObservable();

  private recognition: any       = null;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[]    = [];

  private mediaStream: MediaStream | null   = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null     = null;
  private volumeTimer: any                  = null;

  private recognitionSupported = false;
  private synthesisSupported   = false;
  private mediaRecorderSupported = false;
  private manualStop = false;
  private finalTranscript = '';

  constructor(private zone: NgZone) {
    this.detectCapabilities();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  get isSupported(): boolean           { return this.recognitionSupported || this.mediaRecorderSupported; }
  get isTtsSupported(): boolean        { return this.synthesisSupported; }
  get currentState(): VoiceState       { return this.stateSubject.value; }

  get capabilities(): VoiceCapabilities {
    return {
      speechRecognition:  this.recognitionSupported,
      speechSynthesis:    this.synthesisSupported,
      mediaRecorder:      this.mediaRecorderSupported,
      isSecureContext:    typeof window !== 'undefined' ? window.isSecureContext : false,
      browser:            this.detectBrowser(),
      os:                 this.detectOS()
    };
  }

  async startListening(): Promise<void> {
    if (this.stateSubject.value !== 'idle') return;

    if (!window.isSecureContext) {
      this.emitError('Microphone requires HTTPS or localhost.');
      return;
    }

    this.manualStop      = false;
    this.finalTranscript = '';
    this.transcriptSubject.next('');
    this.errorSubject.next('');

    // Always request mic permission first via getUserMedia
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.emitError('Microphone access denied. Click the 🔒 icon in the address bar and allow microphone.');
      } else if (err.name === 'NotFoundError') {
        this.emitError('No microphone found. Please connect a microphone and try again.');
      } else {
        this.emitError(`Microphone error: ${err.message}`);
      }
      return;
    }

    this.startVolumeMonitor(this.mediaStream);
    this.stateSubject.next('listening');

    if (this.recognitionSupported) {
      this.startWebSpeech();
    } else {
      // Fallback: MediaRecorder only — no transcript, just visual feedback
      this.startMediaRecorderFallback(this.mediaStream);
    }
  }

  stopListening(): void {
    this.manualStop = true;
    this.stopVolumeMonitor();

    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
    this.releaseMediaStream();

    if (this.stateSubject.value === 'listening') {
      this.stateSubject.next(this.finalTranscript.trim() ? 'processing' : 'idle');
    }
  }

  speak(text: string): void {
    if (!this.synthesisSupported || !this.synthesis) return;
    this.synthesis.cancel();

    const utterance    = new SpeechSynthesisUtterance(text);
    utterance.rate     = 0.95;
    utterance.pitch    = 1;
    utterance.volume   = 1;
    utterance.lang     = 'en-US';

    const voice = this.pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => this.zone.run(() => this.stateSubject.next('speaking'));
    utterance.onend   = () => this.zone.run(() => this.stateSubject.next('idle'));
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('TTS error:', e.error);
      }
      this.zone.run(() => this.stateSubject.next('idle'));
    };

    this.synthesis.speak(utterance);
    this.resumeSynthesisIfFrozen();
  }

  stopSpeaking(): void {
    if (this.synthesis) this.synthesis.cancel();
    this.stateSubject.next('idle');
  }

  // ── Web Speech API ──────────────────────────────────────────────────────────

  private startWebSpeech(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    // Re-create each time — avoids stale state on Ubuntu
    this.recognition                    = new SpeechRecognition();
    this.recognition.continuous         = false;
    this.recognition.interimResults     = true;
    this.recognition.lang               = 'en-US';
    this.recognition.maxAlternatives    = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final   = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) this.finalTranscript += final;
      this.zone.run(() => this.transcriptSubject.next(this.finalTranscript || interim));
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        if (this.manualStop) {
          this.stateSubject.next(this.finalTranscript.trim() ? 'processing' : 'idle');
          return;
        }
        // Ubuntu: onend fires after each utterance — restart to keep listening
        if (this.stateSubject.value === 'listening') {
          try {
            this.recognition.start();
          } catch {
            this.stateSubject.next(this.finalTranscript.trim() ? 'processing' : 'idle');
          }
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      this.zone.run(() => {
        const error: string = event.error;

        if (error === 'aborted') return; // triggered by our own stop()

        if (error === 'no-speech') {
          // Ubuntu: no-speech is common — just restart
          if (!this.manualStop && this.stateSubject.value === 'listening') {
            try { this.recognition.start(); } catch {
              this.stateSubject.next('idle');
            }
          }
          return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.emitError(
            'Microphone blocked. On Ubuntu: open Chrome Settings → Privacy → Microphone → allow localhost.'
          );
        } else if (error === 'network') {
          this.emitError(
            'Network error: Chrome Speech API needs internet. Check your connection or try again.'
          );
        } else {
          this.emitError(`Speech error: ${error}`);
        }

        this.stopVolumeMonitor();
        this.releaseMediaStream();
        this.stateSubject.next('idle');
      });
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      if (e?.name !== 'InvalidStateError') {
        this.emitError('Could not start speech recognition: ' + e?.message);
        this.stateSubject.next('idle');
      }
    }
  }

  // ── MediaRecorder fallback (visual only — no transcript) ───────────────────

  private startMediaRecorderFallback(stream: MediaStream): void {
    // No transcript available without a speech-to-text backend
    // Just keep the visual waveform alive until user stops
    this.transcriptSubject.next('');
  }

  // ── Volume monitor (drives waveform animation) ──────────────────────────────

  private startVolumeMonitor(stream: MediaStream): void {
    try {
      this.audioContext = new AudioContext();
      const source      = this.audioContext.createMediaStreamSource(stream);
      this.analyser     = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const data = new Uint8Array(this.analyser.frequencyBinCount);
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        this.zone.run(() => this.volumeSubject.next(Math.min(100, avg * 2)));
        this.volumeTimer = requestAnimationFrame(tick);
      };
      this.volumeTimer = requestAnimationFrame(tick);
    } catch {
      // AudioContext not available — skip volume monitoring
    }
  }

  private stopVolumeMonitor(): void {
    if (this.volumeTimer) {
      cancelAnimationFrame(this.volumeTimer);
      this.volumeTimer = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
      this.analyser     = null;
    }
    this.volumeSubject.next(0);
  }

  private releaseMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  // ── TTS helpers ─────────────────────────────────────────────────────────────

  private loadVoices(): void {
    const load = () => { this.voices = this.synthesis!.getVoices(); };
    load();
    if ('onvoiceschanged' in this.synthesis!) {
      (this.synthesis as any).onvoiceschanged = load;
    }
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.voices = this.synthesis!.getVoices();
    return (
      this.voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ||
      this.voices.find(v => v.lang === 'en-US' && !v.localService) ||
      this.voices.find(v => v.lang === 'en-US') ||
      this.voices.find(v => v.lang.startsWith('en')) ||
      this.voices[0] || null
    );
  }

  private resumeSynthesisIfFrozen(): void {
    if (!this.synthesis) return;
    const check = () => {
      if (this.synthesis!.speaking && this.synthesis!.paused) {
        this.synthesis!.resume();
      }
    };
    setTimeout(check, 500);
    setTimeout(check, 1500);
  }

  // ── Detection ───────────────────────────────────────────────────────────────

  private detectCapabilities(): void {
    if (typeof window === 'undefined') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognitionSupported = !!SR;

    this.mediaRecorderSupported =
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined';

    if ('speechSynthesis' in window) {
      this.synthesisSupported = true;
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private emitError(msg: string): void {
    this.zone.run(() => this.errorSubject.next(msg));
  }

  detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) return 'Chrome';
    if (ua.includes('Firefox'))  return 'Firefox';
    if (ua.includes('Edg'))      return 'Edge';
    if (ua.includes('OPR'))      return 'Opera';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Unknown';
  }

  detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac'))     return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }
}