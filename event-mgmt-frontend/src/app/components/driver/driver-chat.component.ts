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
            <div class="agent-status">{{ isTyping ? 'Typing...' : 'Online' }}</div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #chatContainer>

        <!-- Typing indicator -->
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
        <input class="msg-input" [(ngModel)]="userInput" (keyup.enter)="send()"
               placeholder="Ask the driver assistant...">
        <button class="send-btn" (click)="send()" [disabled]="!userInput.trim()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-panel { display:flex; flex-direction:column; height:100%; background:#0f1117; }

    .chat-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 20px; background:#1a1d27; border-bottom:1px solid #2d3148; flex-shrink:0;
    }
    .agent-info { display:flex; align-items:center; gap:12px; }
    .agent-avatar {
      position:relative; width:40px; height:40px; border-radius:50%;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);
      display:flex; align-items:center; justify-content:center;
    }
    .agent-avatar mat-icon { color:white; font-size:22px; }
    .online-dot {
      position:absolute; bottom:1px; right:1px; width:10px; height:10px;
      border-radius:50%; background:#22c55e; border:2px solid #1a1d27;
    }
    .agent-name { font-size:15px; font-weight:600; color:#e2e8f0; }
    .agent-status { font-size:12px; color:#64748b; }

    .messages-area {
      flex:1; overflow-y:auto; padding:20px;
      display:flex; flex-direction:column; gap:16px; scroll-behavior:smooth;
    }
    .messages-area::-webkit-scrollbar { width:4px; }
    .messages-area::-webkit-scrollbar-thumb { background:#2d3148; border-radius:2px; }

    .message { display:flex; align-items:flex-end; gap:10px; animation:fadeUp 0.25s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .user-msg { flex-direction:row-reverse; }

    .avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .agent-av { background:linear-gradient(135deg,#6366f1,#8b5cf6); }
    .agent-av mat-icon { color:white; font-size:18px; }
    .user-av { background:#2d3148; }
    .user-av mat-icon { color:#94a3b8; font-size:18px; }

    .msg-body { display:flex; flex-direction:column; gap:4px; max-width:72%; }
    .user-body { align-items:flex-end; }

    .bubble { padding:12px 16px; border-radius:16px; font-size:14px; line-height:1.6; word-break:break-word; }
    .agent-bubble { background:#1e2235; color:#e2e8f0; border-bottom-left-radius:4px; border:1px solid #2d3148; }
    .user-bubble { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; border-bottom-right-radius:4px; }

    .typing-bubble { display:flex; align-items:center; gap:5px; padding:14px 18px; }
    .typing-bubble .dot { width:7px; height:7px; border-radius:50%; background:#6366f1; animation:bounce 1.2s infinite; }
    .typing-bubble .dot:nth-child(2) { animation-delay:0.2s; }
    .typing-bubble .dot:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .msg-meta { display:flex; align-items:center; gap:6px; padding:0 4px; }
    .user-meta { justify-content:flex-end; }
    .msg-time { font-size:11px; color:#475569; }

    .action-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .chip-btn {
      padding:6px 14px; border-radius:20px; border:1px solid #6366f1;
      background:transparent; color:#818cf8; font-size:13px; cursor:pointer; transition:all 0.15s;
    }
    .chip-btn:hover { background:#6366f1; color:white; }

    .system-msg {
      display:flex; align-items:center; gap:6px; font-size:12px; color:#64748b;
      background:#1a1d27; border:1px solid #2d3148; border-radius:8px; padding:8px 12px;
    }
    .system-msg mat-icon { font-size:14px; width:14px; height:14px; color:#6366f1; }

    .input-bar {
      display:flex; align-items:center; gap:8px;
      padding:14px 16px; background:#1a1d27; border-top:1px solid #2d3148; flex-shrink:0;
    }
    .msg-input {
      flex:1; background:#0f1117; border:1px solid #2d3148; border-radius:10px;
      padding:10px 16px; color:#e2e8f0; font-size:14px; outline:none; transition:border-color 0.15s;
    }
    .msg-input::placeholder { color:#475569; }
    .msg-input:focus { border-color:#6366f1; }
    .send-btn {
      width:40px; height:40px; border-radius:10px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white;
      display:flex; align-items:center; justify-content:center; transition:all 0.15s;
    }
    .send-btn:hover { opacity:0.9; transform:scale(1.05); }
    .send-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
    .send-btn mat-icon { font-size:20px; width:20px; height:20px; }
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
