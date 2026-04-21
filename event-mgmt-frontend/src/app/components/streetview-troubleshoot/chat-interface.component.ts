import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AIAgentMessage } from './models/troubleshooting.models';
import { VoiceService, VoiceState } from './services/voice.service';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="chat-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>smart_toy</mat-icon>
          AI Assistant
        </mat-card-title>
        <div class="header-controls">
          <button mat-icon-button
                  [color]="ttsEnabled ? 'primary' : ''"
                  (click)="toggleTts()"
                  [matTooltip]="ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'">
            <mat-icon>{{ttsEnabled ? 'volume_up' : 'volume_off'}}</mat-icon>
          </button>
          <div class="voice-status-dot" [class]="'dot-' + voiceState"></div>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Linux/Ubuntu voice warning -->
        <div class="voice-warning" *ngIf="showLinuxWarning">
          <mat-icon>info</mat-icon>
          <span>On Linux, voice recognition requires <strong>Google Chrome</strong> and microphone permission. <a href="https://support.google.com/chrome/answer/2693767" target="_blank">How to allow mic</a></span>
          <button mat-icon-button (click)="dismissLinuxWarning()"><mat-icon>close</mat-icon></button>
        </div>

        <!-- Voice listening overlay -->
        <div class="voice-overlay" *ngIf="voiceState === 'listening' || voiceState === 'processing'">
          <div class="waveform">
            <span *ngFor="let b of waveformBars; let i = index"
                  class="bar"
                  [style.height.px]="voiceState === 'listening' ? getBarHeight(i) : 8"
                  [class.active]="voiceState === 'listening'"></span>
          </div>
          <p class="voice-label" *ngIf="voiceState === 'listening'">
            Listening... <span class="transcript-preview">{{liveTranscript}}</span>
          </p>
          <p class="voice-label" *ngIf="voiceState === 'processing'">Processing...</p>
          <button mat-stroked-button color="warn" (click)="cancelVoice()">Cancel</button>
        </div>

        <!-- Speaking indicator -->
        <div class="speaking-banner" *ngIf="voiceState === 'speaking'">
          <mat-icon class="pulse">record_voice_over</mat-icon>
          <span>AI is speaking...</span>
          <button mat-icon-button (click)="stopSpeaking()" matTooltip="Stop speaking">
            <mat-icon>stop</mat-icon>
          </button>
        </div>

        <div class="chat-messages" #chatContainer>
          <div *ngFor="let message of messages"
               [class]="'message message-' + message.type">
            <div class="message-avatar">
              <mat-icon>{{message.type === 'agent' ? 'smart_toy' : 'person'}}</mat-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{message.content}}</div>
              <div class="message-meta">
                <span class="message-time">{{message.timestamp | date:'shortTime'}}</span>
                <button mat-icon-button class="speak-btn"
                        *ngIf="message.type === 'agent'"
                        (click)="speakMessage(message.content)"
                        matTooltip="Read aloud">
                  <mat-icon>play_circle_outline</mat-icon>
                </button>
              </div>
              <div class="message-actions" *ngIf="message.actions?.length">
                <mat-chip-set>
                  <mat-chip *ngFor="let action of message.actions"
                            (click)="onActionClick(action.action)"
                            class="action-chip">
                    {{action.label}}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions class="chat-input-area">
        <mat-form-field appearance="outline" class="chat-input">
          <mat-label>Type or speak your message...</mat-label>
          <input matInput
                 [(ngModel)]="userInput"
                 (keyup.enter)="onSendMessage()"
                 [placeholder]="voiceState === 'listening' ? 'Listening...' : 'Describe the issue...'">
        </mat-form-field>

        <!-- Voice mic button -->
        <button mat-fab
                [color]="voiceState === 'listening' ? 'warn' : 'accent'"
                (click)="toggleVoice()"
                [disabled]="!voiceSupported || voiceState === 'processing' || voiceState === 'speaking'"
                [matTooltip]="voiceTooltip"
                class="mic-btn"
                [class.listening]="voiceState === 'listening'">
          <mat-icon>{{voiceState === 'listening' ? 'mic_off' : 'mic'}}</mat-icon>
        </button>

        <!-- Send button -->
        <button mat-fab color="primary"
                (click)="onSendMessage()"
                [disabled]="!userInput.trim()"
                matTooltip="Send message">
          <mat-icon>send</mat-icon>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .chat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .voice-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ccc;
      transition: background 0.3s;
    }
    .dot-idle { background: #ccc; }
    .dot-listening { background: #f44336; animation: blink 1s infinite; }
    .dot-processing { background: #ff9800; animation: blink 0.5s infinite; }
    .dot-speaking { background: #4caf50; animation: blink 1.5s infinite; }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .voice-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.95);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      border-radius: 8px;
    }
    .waveform {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 60px;
    }
    .bar {
      width: 6px;
      background: #1976d2;
      border-radius: 3px;
      height: 8px;
      transition: height 0.08s ease;
    }
    .bar.active { background: #1976d2; }
    .bar:not(.active) { background: #ccc; }

    .voice-label {
      font-size: 16px;
      color: #333;
      text-align: center;
    }
    .transcript-preview {
      font-style: italic;
      color: #1976d2;
    }

    .speaking-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e8f5e9;
      padding: 8px 16px;
      border-radius: 4px;
      margin-bottom: 8px;
      color: #388e3c;
      font-size: 14px;
    }
    .pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    .chat-messages {
      overflow-y: auto;
      padding: 16px;
      max-height: calc(100vh - 380px);
      position: relative;
    }
    .message {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .message-agent .message-avatar { background: #e3f2fd; color: #1976d2; }
    .message-user  .message-avatar { background: #f3e5f5; color: #7b1fa2; }
    .message-content { flex: 1; max-width: 80%; }
    .message-text {
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 4px;
      line-height: 1.5;
    }
    .message-user .message-content { margin-left: auto; }
    .message-user .message-text { background: #e3f2fd; }
    .message-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 4px;
    }
    .message-time { font-size: 11px; color: #999; }
    .speak-btn { width: 24px; height: 24px; line-height: 24px; }
    .speak-btn mat-icon { font-size: 16px; width: 16px; height: 16px; color: #999; }
    .message-actions { margin-top: 8px; }
    .action-chip { cursor: pointer; margin: 4px; }

    .chat-input-area {
      display: flex;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      align-items: center;
    }
    .chat-input { flex: 1; }
    .mic-btn { transition: transform 0.2s; }
    .mic-btn.listening { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(244,67,54,0.2); }
    .voice-warning {
      display: flex; align-items: center; gap: 8px;
      background: #fff8e1; border-left: 4px solid #ff9800;
      padding: 10px 12px; border-radius: 4px; margin-bottom: 8px;
      font-size: 13px; color: #5d4037;
    }
    .voice-warning mat-icon { color: #ff9800; flex-shrink: 0; }
    .voice-warning a { color: #1976d2; }
    .voice-warning button { margin-left: auto; }
  `]
})
export class ChatInterfaceComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() messages: AIAgentMessage[] = [];
  @Output() sendMessage = new EventEmitter<string>();
  @Output() actionClicked = new EventEmitter<string>();
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  userInput = '';
  voiceState: VoiceState = 'idle';
  liveTranscript = '';
  ttsEnabled = true;
  voiceSupported = false;
  voiceError = '';
  showLinuxWarning = false;
  waveformBars = Array(10);
  volume = 0;

  private shouldScroll = false;
  private subs = new Subscription();

  constructor(private voiceService: VoiceService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.voiceSupported = this.voiceService.isSupported;

    this.subs.add(
      this.voiceService.state$.subscribe(state => {
        this.voiceState = state;
        if (state === 'processing' && this.liveTranscript.trim()) {
          this.userInput = this.liveTranscript;
          this.liveTranscript = '';
          setTimeout(() => this.onSendMessage(), 300);
        }
      })
    );

    this.subs.add(
      this.voiceService.transcript$.subscribe(t => {
        this.liveTranscript = t;
      })
    );

    this.subs.add(
      this.voiceService.volume$.subscribe(v => {
        this.volume = v;
      })
    );

    // Show voice errors via snackbar
    this.subs.add(
      this.voiceService.error$.subscribe(err => {
        if (err) {
          this.voiceError = err;
          this.snackBar.open(err, 'Close', { duration: 6000, panelClass: 'error-snack' });
        }
      })
    );

    // Show OS-specific hint if on Linux
    const caps = this.voiceService.capabilities;
    if (caps.os === 'Linux') {
      this.showLinuxWarning = true;
      console.info('Voice on Linux: ensure Chrome is used and microphone is permitted.');
    }
  }

  dismissLinuxWarning(): void {
    this.showLinuxWarning = false;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.voiceService.stopListening();
    this.voiceService.stopSpeaking();
  }

  get voiceTooltip(): string {
    const caps = this.voiceService.capabilities;
    if (!this.voiceSupported) {
      return caps.os === 'Linux'
        ? 'Voice requires Google Chrome on Linux. Firefox is not supported.'
        : 'Voice recognition not supported. Use Chrome.';
    }
    if (!caps.isSecureContext) return 'Voice requires HTTPS or localhost';
    if (this.voiceState === 'listening') return 'Stop listening (click to stop)';
    return `Start voice input (${caps.browser} on ${caps.os})`;
  }

  toggleVoice(): void {
    const caps = this.voiceService.capabilities;
    if (!caps.isSecureContext) {
      this.snackBar.open('Microphone requires HTTPS or localhost.', 'Close', { duration: 5000 });
      return;
    }
    if (this.voiceState === 'listening') {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening().catch(err => {
        console.error('startListening error:', err);
      });
    }
  }

  cancelVoice(): void {
    this.voiceService.stopListening();
    this.liveTranscript = '';
  }

  toggleTts(): void {
    this.ttsEnabled = !this.ttsEnabled;
    if (!this.ttsEnabled) this.voiceService.stopSpeaking();
  }

  speakMessage(text: string): void {
    if (this.ttsEnabled) this.voiceService.speak(text);
  }

  stopSpeaking(): void {
    this.voiceService.stopSpeaking();
  }

  onSendMessage(): void {
    if (this.userInput.trim()) {
      this.sendMessage.emit(this.userInput.trim());
      this.userInput = '';
      this.shouldScroll = true;
    }
  }

  onActionClick(action: string): void {
    this.actionClicked.emit(action);
    this.shouldScroll = true;
  }

  getBarHeight(index: number): number {
    // Each bar gets a slightly different multiplier for a natural wave look
    const multipliers = [0.4, 0.7, 1.0, 0.8, 1.2, 0.9, 1.1, 0.6, 0.8, 0.5];
    const base = 8;
    const max  = 48;
    const height = base + (this.volume / 100) * (max - base) * multipliers[index];
    return Math.min(max, Math.max(base, height));
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}