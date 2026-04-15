import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private stateSubject = new BehaviorSubject<VoiceState>('idle');
  public state$ = this.stateSubject.asObservable();

  private transcriptSubject = new BehaviorSubject<string>('');
  public transcript$ = this.transcriptSubject.asObservable();

  private recognition: any = null;
  private synthesis = window.speechSynthesis;
  private isSpeechSupported = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSpeechSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.setupRecognitionHandlers();
    }
  }

  get isSupported(): boolean {
    return this.isSpeechSupported;
  }

  get currentState(): VoiceState {
    return this.stateSubject.value;
  }

  startListening(): void {
    if (!this.isSpeechSupported || this.stateSubject.value !== 'idle') return;
    this.transcriptSubject.next('');
    this.stateSubject.next('listening');
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.stateSubject.value === 'listening') {
      this.recognition.stop();
    }
  }

  speak(text: string): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = this.synthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
      || voices.find(v => v.lang === 'en-US')
      || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => this.stateSubject.next('speaking');
    utterance.onend = () => this.stateSubject.next('idle');
    utterance.onerror = () => this.stateSubject.next('idle');

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
    this.stateSubject.next('idle');
  }

  private setupRecognitionHandlers(): void {
    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      this.transcriptSubject.next(final || interim);
    };

    this.recognition.onend = () => {
      if (this.stateSubject.value === 'listening') {
        this.stateSubject.next('processing');
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.stateSubject.next('idle');
    };
  }
}