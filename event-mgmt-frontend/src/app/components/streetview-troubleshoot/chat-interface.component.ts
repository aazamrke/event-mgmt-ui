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
        <!-- Voice listening overlay -->
        <div class="voice-overlay" *ngIf="voiceState === 'listening' || voiceState === 'processing'">
          <div class="waveform">
            <span *ngFor="let b of waveformBars" class="bar" [class.active]="voiceState === 'listening'"></span>
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
      transition: height 0.1s;
    }
    .bar:nth-child(1)  { animation: wave 1.0s ease-in-out infinite; }
    .bar:nth-child(2)  { animation: wave 1.1s ease-in-out infinite; }
    .bar:nth-child(3)  { animation: wave 0.9s ease-in-out infinite; }
    .bar:nth-child(4)  { animation: wave 1.2s ease-in-out infinite; }
    .bar:nth-child(5)  { animation: wave 0.8s ease-in-out infinite; }
    .bar:nth-child(6)  { animation: wave 1.3s ease-in-out infinite; }
    .bar:nth-child(7)  { animation: wave 0.9s ease-in-out infinite; }
    .bar:nth-child(8)  { animation: wave 1.0s ease-in-out infinite; }
    .bar:nth-child(9)  { animation: wave 1.1s ease-in-out infinite; }
    .bar:nth-child(10) { animation: wave 0.8s ease-in-out infinite; }
    .bar.active { animation-play-state: running; }
    .bar:not(.active) { animation-play-state: paused; }

    @keyframes wave {
      0%, 100% { height: 8px; }
      50% { height: 48px; }
    }

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
  waveformBars = Array(10);

  private shouldScroll = false;
  private subs = new Subscription();

  constructor(private voiceService: VoiceService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.voiceSupported = this.voiceService.isSupported;

    this.subs.add(
      this.voiceService.state$.subscribe(state => {
        this.voiceState = state;
        // When processing is done, send the transcript
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
    if (!this.voiceSupported) return 'Voice not supported in this browser';
    if (this.voiceState === 'listening') return 'Stop listening';
    return 'Start voice input';
  }

  toggleVoice(): void {
    if (!this.voiceSupported) {
      this.snackBar.open('Voice recognition is not supported in this browser', 'Close', { duration: 3000 });
      return;
    }
    if (this.voiceState === 'listening') {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
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

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}