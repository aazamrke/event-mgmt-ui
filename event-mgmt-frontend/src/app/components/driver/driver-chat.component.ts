import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DriverMessage } from './driver.models';

@Component({
  selector: 'app-driver-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="chat-panel">

      <!-- Header -->
      <div class="chat-header">
        <div class="agent-info">
          <div class="agent-avatar">
            <mat-icon>local_shipping</mat-icon>
            <span class="online-dot"></span>
          </div>
          <div>
            <div class="agent-name">Driver AI Assistant</div>
            <div class="agent-status">{{ isTyping ? 'Typing...' : 'Online · Ready to help' }}</div>
          </div>
        </div>
        <div class="g-logo">
          <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #chatContainer>

        <div class="message agent-msg" *ngIf="isTyping">
          <div class="avatar agent-av"><mat-icon>local_shipping</mat-icon></div>
          <div class="bubble agent-bubble typing-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>

        <ng-container *ngFor="let msg of messages">
          <div class="message agent-msg" *ngIf="msg.type === 'agent'">
            <div class="avatar agent-av"><mat-icon>local_shipping</mat-icon></div>
            <div class="msg-body">
              <div class="bubble agent-bubble">{{ msg.content }}</div>
              <div class="msg-meta"><span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span></div>
              <div class="action-chips" *ngIf="msg.actions?.length">
                <button *ngFor="let a of msg.actions" class="chip-btn" (click)="actionClicked.emit(a.action)">
                  {{ a.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="message user-msg" *ngIf="msg.type === 'user'">
            <div class="msg-body user-body">
              <div class="bubble user-bubble">{{ msg.content }}</div>
              <div class="msg-meta user-meta"><span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span></div>
            </div>
            <div class="avatar user-av"><mat-icon>person</mat-icon></div>
          </div>

          <div class="system-msg" *ngIf="msg.type === 'system'">
            <mat-icon>info</mat-icon> {{ msg.content }}
          </div>
        </ng-container>
      </div>

      <!-- Input bar -->
      <div class="input-bar">
        <div class="input-wrap">
          <mat-icon class="input-icon">search</mat-icon>
          <input class="msg-input" [(ngModel)]="userInput" (keyup.enter)="send()"
                 placeholder="Ask the driver assistant...">
          <button class="send-btn" (click)="send()" [disabled]="!userInput.trim()" matTooltip="Send">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; }

    .chat-panel {
      display:flex; flex-direction:column; height:100%;
      background:#f8f9fa; font-family:'Google Sans','Roboto',sans-serif;
    }

    /* Header */
    .chat-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 20px; background:#fff;
      border-bottom:1px solid #dadce0; flex-shrink:0;
      box-shadow:0 1px 3px rgba(60,64,67,.08);
    }
    .agent-info { display:flex; align-items:center; gap:12px; }
    .agent-avatar {
      position:relative; width:40px; height:40px; border-radius:50%;
      background:#1a73e8; display:flex; align-items:center; justify-content:center;
    }
    .agent-avatar mat-icon { color:#fff; font-size:22px; }
    .online-dot {
      position:absolute; bottom:1px; right:1px; width:10px; height:10px;
      border-radius:50%; background:#34a853; border:2px solid #fff;
    }
    .agent-name { font-size:15px; font-weight:500; color:#202124; }
    .agent-status { font-size:12px; color:#5f6368; }

    /* Google logo text */
    .g-logo { font-size:18px; font-weight:700; letter-spacing:-0.5px; }
    .g-blue   { color:#4285f4; }
    .g-red    { color:#ea4335; }
    .g-yellow { color:#fbbc04; }
    .g-green  { color:#34a853; }

    /* Messages */
    .messages-area {
      flex:1; overflow-y:auto; padding:20px 24px;
      display:flex; flex-direction:column; gap:16px;
    }
    .messages-area::-webkit-scrollbar { width:6px; }
    .messages-area::-webkit-scrollbar-thumb { background:#dadce0; border-radius:3px; }

    .message { display:flex; align-items:flex-end; gap:10px; animation:fadeUp 0.2s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .user-msg { flex-direction:row-reverse; }

    .avatar {
      width:32px; height:32px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .agent-av { background:#1a73e8; }
    .agent-av mat-icon { color:#fff; font-size:18px; }
    .user-av { background:#e8f0fe; }
    .user-av mat-icon { color:#1a73e8; font-size:18px; }

    .msg-body { display:flex; flex-direction:column; gap:4px; max-width:72%; }
    .user-body { align-items:flex-end; }

    .bubble {
      padding:10px 16px; border-radius:18px;
      font-size:14px; line-height:1.6; word-break:break-word;
    }
    .agent-bubble {
      background:#fff; color:#202124;
      border-bottom-left-radius:4px;
      border:1px solid #dadce0;
      box-shadow:0 1px 2px rgba(60,64,67,.1);
    }
    .user-bubble {
      background:#1a73e8; color:#fff;
      border-bottom-right-radius:4px;
    }

    .typing-bubble { display:flex; align-items:center; gap:5px; padding:14px 18px; }
    .typing-bubble .dot {
      width:7px; height:7px; border-radius:50%; background:#1a73e8;
      animation:bounce 1.2s infinite;
    }
    .typing-bubble .dot:nth-child(2) { animation-delay:0.2s; }
    .typing-bubble .dot:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .msg-meta { display:flex; align-items:center; gap:6px; padding:0 4px; }
    .user-meta { justify-content:flex-end; }
    .msg-time { font-size:11px; color:#80868b; }

    /* Action chips — Google chip style */
    .action-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .chip-btn {
      padding:6px 16px; border-radius:16px;
      border:1px solid #dadce0; background:#fff;
      color:#1a73e8; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s;
      box-shadow:0 1px 2px rgba(60,64,67,.1);
    }
    .chip-btn:hover { background:#e8f0fe; border-color:#1a73e8; }

    /* System message */
    .system-msg {
      display:flex; align-items:center; gap:8px;
      font-size:12px; color:#5f6368;
      background:#fff; border:1px solid #dadce0;
      border-left:3px solid #fbbc04;
      border-radius:8px; padding:8px 14px;
    }
    .system-msg mat-icon { font-size:14px; width:14px; height:14px; color:#fbbc04; }

    /* Input bar — Google Search style */
    .input-bar {
      padding:12px 20px 16px; background:#f8f9fa;
      border-top:1px solid #dadce0; flex-shrink:0;
    }
    .input-wrap {
      display:flex; align-items:center; gap:8px;
      background:#fff; border:1px solid #dadce0;
      border-radius:24px; padding:8px 16px;
      box-shadow:0 1px 6px rgba(32,33,36,.1);
      transition:box-shadow 0.2s, border-color 0.2s;
    }
    .input-wrap:focus-within {
      box-shadow:0 1px 6px rgba(32,33,36,.28);
      border-color:#1a73e8;
    }
    .input-icon { color:#9aa0a6; font-size:20px; flex-shrink:0; }
    .msg-input {
      flex:1; border:none; outline:none; background:transparent;
      color:#202124; font-size:14px; font-family:inherit;
    }
    .msg-input::placeholder { color:#9aa0a6; }
    .send-btn {
      width:36px; height:36px; border-radius:50%; border:none;
      background:#1a73e8; color:#fff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background 0.15s, box-shadow 0.15s;
      flex-shrink:0;
    }
    .send-btn:hover { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .send-btn:disabled { background:#dadce0; color:#9aa0a6; cursor:not-allowed; }
    .send-btn mat-icon { font-size:18px; width:18px; height:18px; }
  `]
})
export class DriverChatComponent implements AfterViewChecked {
  @Input() messages: DriverMessage[] = [];
  @Input() isTyping = false;
  @Output() sendMessage   = new EventEmitter<string>();
  @Output() actionClicked = new EventEmitter<string>();
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  userInput = '';
  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      const el = this.chatContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  send(): void {
    if (this.userInput.trim()) {
      this.sendMessage.emit(this.userInput.trim());
      this.userInput = '';
      this.shouldScroll = true;
    }
  }
}
