import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  isSecureContext: boolean;
  browser: string;
  os: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private stateSubject      = new BehaviorSubject<VoiceState>('idle');
  private transcriptSubject = new BehaviorSubject<string>('');
  private errorSubject      = new BehaviorSubject<string>('');

  public state$      = this.stateSubject.asObservable();
  public transcript$ = this.transcriptSubject.asObservable();
  public error$      = this.errorSubject.asObservable();

  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private recognitionSupported = false;
  private synthesisSupported   = false;

  // Ubuntu/Linux: Chrome restarts recognition after each result — track manually
  private manualStop = false;

  constructor() {
    this.detectCapabilities();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get isSupported(): boolean        { return this.recognitionSupported; }
  get isTtsSupported(): boolean     { return this.synthesisSupported; }
  get currentState(): VoiceState    { return this.stateSubject.value; }
  get capabilities(): VoiceCapabilities {
    return {
      speechRecognition: this.recognitionSupported,
      speechSynthesis:   this.synthesisSupported,
      isSecureContext:   window.isSecureContext,
      browser:           this.detectBrowser(),
      os:                this.detectOS()
    };
  }

  startListening(): void {
    if (!this.recognitionSupported) {
      this.errorSubject.next(this.getUnsupportedMessage());
      return;
    }
    if (this.stateSubject.value !== 'idle') return;

    // Ubuntu Chrome requires HTTPS or localhost for microphone
    if (!window.isSecureContext) {
      this.errorSubject.next('Microphone requires HTTPS. Please use https:// or localhost.');
      return;
    }

    this.manualStop = false;
    this.transcriptSubject.next('');
    this.errorSubject.next('');

    try {
      this.stateSubject.next('listening');
      this.recognition.start();
    } catch (e: any) {
      // Already started — ignore InvalidStateError
      if (e?.name !== 'InvalidStateError') {
        this.stateSubject.next('idle');
        this.errorSubject.next('Could not start microphone: ' + e?.message);
      }
    }
  }

  stopListening(): void {
    if (!this.recognition) return;
    this.manualStop = true;
    try { this.recognition.stop(); } catch {}
  }

  speak(text: string): void {
    if (!this.synthesisSupported || !this.synthesis) return;

    // Ubuntu: cancel any ongoing speech first
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.95;
    utterance.pitch  = 1;
    utterance.volume = 1;
    utterance.lang   = 'en-US';

    // Ubuntu voices load asynchronously — use loaded voices or wait
    const voice = this.pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => this.stateSubject.next('speaking');
    utterance.onend   = () => this.stateSubject.next('idle');
    utterance.onerror = (e) => {
      // 'interrupted' is normal on Ubuntu when cancel() is called
      if (e.error !== 'interrupted') {
        console.warn('TTS error:', e.error);
      }
      this.stateSubject.next('idle');
    };

    // Ubuntu Chrome bug: speechSynthesis sometimes freezes — resume it
    this.synthesis.speak(utterance);
    this.resumeSynthesisIfFrozen();
  }

  stopSpeaking(): void {
    if (this.synthesis) this.synthesis.cancel();
    this.stateSubject.next('idle');
  }

  // ─── Setup ─────────────────────────────────────────────────────────────────

  private detectCapabilities(): void {
    // Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      this.recognitionSupported = true;
      this.recognition = new SpeechRecognition();
      // Ubuntu: continuous=true causes issues; use false + restart loop
      this.recognition.continuous      = false;
      this.recognition.interimResults  = true;
      this.recognition.lang            = 'en-US';
      this.recognition.maxAlternatives = 1;
      this.setupRecognitionHandlers();
    }

    // Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesisSupported = true;
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private setupRecognitionHandlers(): void {
    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final   = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      this.transcriptSubject.next(final || interim);
    };

    this.recognition.onend = () => {
      if (this.manualStop || this.stateSubject.value !== 'listening') {
        // User stopped or already moved on
        if (this.stateSubject.value === 'listening') {
          this.stateSubject.next('processing');
        }
        return;
      }
      // Ubuntu Chrome fires onend after each interim result — restart if still listening
      if (this.stateSubject.value === 'listening') {
        try {
          this.recognition.start();
        } catch {
          this.stateSubject.next('processing');
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error as string;

      if (error === 'aborted' || error === 'no-speech') {
        // Normal on Ubuntu — treat no-speech as end of input
        if (this.stateSubject.value === 'listening') {
          this.stateSubject.next('processing');
        }
        return;
      }

      if (error === 'not-allowed') {
        this.errorSubject.next(
          'Microphone access denied. Allow microphone in browser settings and ensure you are on localhost or HTTPS.'
        );
      } else if (error === 'network') {
        this.errorSubject.next(
          'Network error: Speech recognition requires an internet connection (uses Google servers).'
        );
      } else if (error === 'service-not-allowed') {
        this.errorSubject.next(
          'Speech service not allowed. On Ubuntu, use Google Chrome and ensure microphone permissions are granted.'
        );
      } else {
        this.errorSubject.next(`Speech recognition error: ${error}`);
      }

      this.stateSubject.next('idle');
    };

    this.recognition.onnomatch = () => {
      this.stateSubject.next('processing');
    };
  }

  private loadVoices(): void {
    const load = () => {
      this.voices = this.synthesis!.getVoices();
    };
    load();
    // Ubuntu: voices load asynchronously
    if (this.synthesis!.onvoiceschanged !== undefined) {
      this.synthesis!.onvoiceschanged = load;
    }
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.voices = this.synthesis!.getVoices();
    return (
      this.voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
      this.voices.find(v => v.lang === 'en-US' && !v.localService) ||
      this.voices.find(v => v.lang === 'en-US') ||
      this.voices.find(v => v.lang.startsWith('en')) ||
      this.voices[0] ||
      null
    );
  }

  // Ubuntu Chrome bug: synthesis can freeze after a few utterances
  private resumeSynthesisIfFrozen(): void {
    if (!this.synthesis) return;
    setTimeout(() => {
      if (this.synthesis!.speaking && this.synthesis!.paused) {
        this.synthesis!.resume();
      }
    }, 500);
  }

  private getUnsupportedMessage(): string {
    const os = this.detectOS();
    if (os === 'Linux') {
      return 'Voice recognition requires Google Chrome on Linux/Ubuntu. Firefox does not support the Web Speech API.';
    }
    return 'Voice recognition is not supported in this browser. Please use Google Chrome.';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox'))  return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg'))      return 'Edge';
    return 'Unknown';
  }

  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac'))     return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }
}