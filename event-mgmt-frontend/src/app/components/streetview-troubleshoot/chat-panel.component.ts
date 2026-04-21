import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AIAgentMessage } from './models/troubleshooting.models';
import { VoiceService, VoiceState } from './services/voice.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule
  ],
  template: `
    <div class="chat-panel">

      <!-- Header -->
      <div class="chat-header">
        <div class="agent-info">
          <div class="agent-avatar">
            <mat-icon>smart_toy</mat-icon>
            <span class="online-dot"></span>
          </div>
          <div>
            <div class="agent-name">StreetView AI Agent</div>
            <div class="agent-status">{{isTyping ? 'Typing...' : 'Online'}}</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" [class.active]="ttsEnabled"
                  (click)="toggleTts()"
                  [matTooltip]="ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'">
            <mat-icon>{{ttsEnabled ? 'volume_up' : 'volume_off'}}</mat-icon>
          </button>
          <div class="voice-dot" [class]="'dot-' + voiceState" matTooltip="Voice state"></div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #chatContainer>

        <!-- Typing indicator -->
        <div class="message agent-msg" *ngIf="isTyping">
          <div class="avatar agent-av"><mat-icon>smart_toy</mat-icon></div>
          <div class="bubble agent-bubble typing-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>

        <ng-container *ngFor="let msg of messages">
          <!-- Agent message -->
          <div class="message agent-msg" *ngIf="msg.type === 'agent'">
            <div class="avatar agent-av"><mat-icon>smart_toy</mat-icon></div>
            <div class="msg-body">
              <div class="bubble agent-bubble">{{msg.content}}</div>
              <div class="msg-meta">
                <span class="msg-time">{{msg.timestamp | date:'shortTime'}}</span>
                <button class="speak-btn" (click)="speakMessage(msg.content)"
                        *ngIf="ttsEnabled" matTooltip="Read aloud">
                  <mat-icon>play_circle_outline</mat-icon>
                </button>
              </div>
              <!-- Quick action chips -->
              <div class="action-chips" *ngIf="msg.actions?.length">
                <button *ngFor="let action of msg.actions"
                        class="chip-btn"
                        (click)="onActionClick(action.action)">
                  {{action.label}}
                </button>
              </div>
            </div>
          </div>

          <!-- User message -->
          <div class="message user-msg" *ngIf="msg.type === 'user'">
            <div class="msg-body user-body">
              <div class="bubble user-bubble">{{msg.content}}</div>
              <div class="msg-meta user-meta">
                <span class="msg-time">{{msg.timestamp | date:'shortTime'}}</span>
              </div>
            </div>
            <div class="avatar user-av"><mat-icon>person</mat-icon></div>
          </div>
        </ng-container>
      </div>

      <!-- Voice overlay -->
      <div class="voice-overlay" *ngIf="voiceState === 'listening' || voiceState === 'processing'">
        <div class="voice-modal">
          <div class="waveform">
            <span *ngFor="let b of bars; let i = index"
                  class="bar"
                  [style.height.px]="getBarHeight(i)"></span>
          </div>
          <p class="voice-hint" *ngIf="voiceState === 'listening'">
            Listening<span class="ellipsis">...</span>
            <span class="live-text" *ngIf="liveTranscript">{{liveTranscript}}</span>
          </p>
          <p class="voice-hint" *ngIf="voiceState === 'processing'">Processing speech...</p>
          <button class="cancel-voice" (click)="cancelVoice()">
            <mat-icon>close</mat-icon> Cancel
          </button>
        </div>
      </div>

      <!-- Speaking banner -->
      <div class="speaking-bar" *ngIf="voiceState === 'speaking'">
        <mat-icon class="pulse-icon">record_voice_over</mat-icon>
        <span>AI is speaking</span>
        <button class="icon-btn" (click)="stopSpeaking()"><mat-icon>stop</mat-icon></button>
      </div>

      <!-- Linux warning -->
      <div class="linux-warn" *ngIf="showLinuxWarning">
        <mat-icon>info_outline</mat-icon>
        <span>On Linux, voice requires <strong>Google Chrome</strong> + mic permission.
          <a href="https://support.google.com/chrome/answer/2693767" target="_blank">Learn more</a>
        </span>
        <button class="icon-btn" (click)="showLinuxWarning = false"><mat-icon>close</mat-icon></button>
      </div>

      <!-- Input bar -->
      <div class="input-bar">
        <input class="msg-input"
               [(ngModel)]="userInput"
               (keyup.enter)="onSendMessage()"
               [placeholder]="voiceState === 'listening' ? 'Listening...' : 'Ask the AI agent...'">
        <button class="mic-btn" [class.listening]="voiceState === 'listening'"
                (click)="toggleVoice()"
                [disabled]="voiceState === 'processing' || voiceState === 'speaking'"
                [matTooltip]="voiceTooltip">
          <mat-icon>{{voiceState === 'listening' ? 'mic_off' : 'mic'}}</mat-icon>
        </button>
        <button class="send-btn" (click)="onSendMessage()" [disabled]="!userInput.trim()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0f1117;
      position: relative;
    }

    /* Header */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: #1a1d27;
      border-bottom: 1px solid #2d3148;
      flex-shrink: 0;
    }
    .agent-info { display: flex; align-items: center; gap: 12px; }
    .agent-avatar {
      position: relative;
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
    }
    .agent-avatar mat-icon { color: white; font-size: 22px; }
    .online-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #22c55e; border: 2px solid #1a1d27;
    }
    .agent-name { font-size: 15px; font-weight: 600; color: #e2e8f0; }
    .agent-status { font-size: 12px; color: #64748b; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .icon-btn {
      background: transparent; border: none; cursor: pointer;
      color: #64748b; padding: 6px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .icon-btn:hover { color: #e2e8f0; background: #2d3148; }
    .icon-btn.active { color: #6366f1; }
    .icon-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .voice-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #334155;
    }
    .dot-listening  { background: #ef4444; animation: blink 0.8s infinite; }
    .dot-processing { background: #f59e0b; animation: blink 0.4s infinite; }
    .dot-speaking   { background: #22c55e; animation: blink 1.2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

    /* Messages */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }
    .messages-area::-webkit-scrollbar { width: 4px; }
    .messages-area::-webkit-scrollbar-track { background: transparent; }
    .messages-area::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 2px; }

    .message { display: flex; align-items: flex-end; gap: 10px; animation: fadeUp 0.25s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    .user-msg { flex-direction: row-reverse; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .agent-av { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .agent-av mat-icon { color: white; font-size: 18px; }
    .user-av  { background: #2d3148; }
    .user-av mat-icon  { color: #94a3b8; font-size: 18px; }

    .msg-body { display: flex; flex-direction: column; gap: 4px; max-width: 72%; }
    .user-body { align-items: flex-end; }

    .bubble {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;
    }
    .agent-bubble {
      background: #1e2235;
      color: #e2e8f0;
      border-bottom-left-radius: 4px;
      border: 1px solid #2d3148;
    }
    .user-bubble {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border-bottom-right-radius: 4px;
    }

    /* Typing */
    .typing-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 14px 18px;
    }
    .typing-bubble .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #6366f1; animation: bounce 1.2s infinite;
    }
    .typing-bubble .dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-bubble .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .msg-meta { display: flex; align-items: center; gap: 6px; padding: 0 4px; }
    .user-meta { justify-content: flex-end; }
    .msg-time { font-size: 11px; color: #475569; }
    .speak-btn {
      background: none; border: none; cursor: pointer;
      color: #475569; padding: 0; display: flex; align-items: center;
    }
    .speak-btn:hover { color: #6366f1; }
    .speak-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Action chips */
    .action-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .chip-btn {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #6366f1;
      background: transparent;
      color: #818cf8;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip-btn:hover { background: #6366f1; color: white; }

    /* Voice overlay */
    .voice-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15,17,23,0.92);
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .voice-modal {
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      background: #1a1d27;
      border: 1px solid #2d3148;
      border-radius: 16px;
      padding: 32px 40px;
    }
    .waveform { display: flex; align-items: center; gap: 5px; height: 56px; }
    .bar {
      width: 5px; background: #6366f1; border-radius: 3px;
      transition: height 0.08s ease; min-height: 6px;
    }
    .voice-hint { color: #94a3b8; font-size: 15px; text-align: center; margin: 0; }
    .ellipsis { color: #6366f1; }
    .live-text {
      display: block; margin-top: 6px;
      color: #818cf8; font-style: italic; font-size: 14px;
    }
    .cancel-voice {
      display: flex; align-items: center; gap: 6px;
      background: #2d3148; border: none; color: #94a3b8;
      padding: 8px 20px; border-radius: 8px; cursor: pointer;
      font-size: 14px; transition: all 0.15s;
    }
    .cancel-voice:hover { background: #ef4444; color: white; }
    .cancel-voice mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Speaking bar */
    .speaking-bar {
      display: flex; align-items: center; gap: 10px;
      background: #1a2e1a; border-top: 1px solid #166534;
      padding: 8px 20px; color: #22c55e; font-size: 13px;
    }
    .pulse-icon { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

    /* Linux warning */
    .linux-warn {
      display: flex; align-items: center; gap: 10px;
      background: #1c1a0f; border-top: 1px solid #854d0e;
      padding: 10px 20px; color: #fbbf24; font-size: 13px;
    }
    .linux-warn mat-icon { color: #f59e0b; flex-shrink: 0; }
    .linux-warn a { color: #6366f1; }
    .linux-warn button { margin-left: auto; }

    /* Input bar */
    .input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      background: #1a1d27;
      border-top: 1px solid #2d3148;
      flex-shrink: 0;
    }
    .msg-input {
      flex: 1;
      background: #0f1117;
      border: 1px solid #2d3148;
      border-radius: 10px;
      padding: 10px 16px;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    .msg-input::placeholder { color: #475569; }
    .msg-input:focus { border-color: #6366f1; }
    .mic-btn, .send-btn {
      width: 40px; height: 40px; border-radius: 10px;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .mic-btn {
      background: #2d3148; color: #94a3b8;
    }
    .mic-btn:hover { background: #6366f1; color: white; }
    .mic-btn.listening { background: #ef4444; color: white; animation: mic-pulse 1s infinite; }
    .mic-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
    .send-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .send-btn:hover { opacity: 0.9; transform: scale(1.05); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .mic-btn mat-icon, .send-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `]
})
export class ChatPanelComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() messages: AIAgentMessage[] = [];
  @Input() isTyping = false;
  @Output() sendMessage   = new EventEmitter<string>();
  @Output() actionClicked = new EventEmitter<string>();
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  userInput        = '';
  voiceState: VoiceState = 'idle';
  liveTranscript   = '';
  ttsEnabled       = true;
  showLinuxWarning = false;
  volume           = 0;
  bars             = Array(12);

  private shouldScroll = false;
  private subs         = new Subscription();

  constructor(private voiceService: VoiceService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.subs.add(this.voiceService.state$.subscribe(state => {
      this.voiceState = state;
      if (state === 'processing' && this.liveTranscript.trim()) {
        this.userInput = this.liveTranscript;
        this.liveTranscript = '';
        setTimeout(() => this.onSendMessage(), 300);
      }
    }));
    this.subs.add(this.voiceService.transcript$.subscribe(t => this.liveTranscript = t));
    this.subs.add(this.voiceService.volume$.subscribe(v => this.volume = v));
    this.subs.add(this.voiceService.error$.subscribe(err => {
      if (err) this.snackBar.open(err, 'Close', { duration: 6000 });
    }));

    const caps = this.voiceService.capabilities;
    if (caps.os === 'Linux') this.showLinuxWarning = true;
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
    if (caps.os === 'Linux' && !caps.speechRecognition) return 'Requires Google Chrome on Linux';
    if (!caps.isSecureContext) return 'Requires HTTPS or localhost';
    return this.voiceState === 'listening' ? 'Stop listening' : 'Start voice input';
  }

  toggleVoice(): void {
    if (!this.voiceService.capabilities.isSecureContext) {
      this.snackBar.open('Microphone requires HTTPS or localhost.', 'Close', { duration: 4000 });
      return;
    }
    if (this.voiceState === 'listening') {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening().catch(err => console.error(err));
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

  stopSpeaking(): void { this.voiceService.stopSpeaking(); }

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

  getBarHeight(i: number): number {
    const m = [0.4,0.7,1.0,0.85,1.2,0.95,1.1,0.75,1.0,0.6,0.8,0.5];
    return Math.max(6, Math.min(48, 6 + (this.volume / 100) * 42 * m[i]));
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}