import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DriverChatComponent } from './driver-chat.component';
import { DriverRightPanelComponent } from './driver-right-panel.component';
import { DriverMessage, TripInfo, Incident, RouteStop } from './driver.models';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../streetview-troubleshoot/services/ticket.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { User } from '../../models';

@Component({
  selector: 'app-driver',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule,
    DriverChatComponent, DriverRightPanelComponent
  ],
  template: `
    <div class="driver-page">

      <!-- ── Header ── -->
      <header class="portal-header">

        <!-- Left: branding -->
        <div class="header-brand">
          <div class="brand-icon">
            <mat-icon>directions_car</mat-icon>
          </div>
          <div class="brand-text">
            <span class="brand-title">Driver Portal</span>
            <span class="brand-sub">Professional Camera Support System</span>
          </div>
        </div>

        <!-- Centre: trip status pill -->
        <div class="header-centre">
          <div class="status-pill" [class]="'trip-' + (trip?.status || 'idle')">
            <span class="status-dot"></span>
            {{ tripStatusLabel }}
          </div>
          <span class="trip-id" *ngIf="trip">{{ trip.tripId }}</span>
        </div>

        <!-- Right: actions + user -->
        <div class="header-right">
          <button class="hdr-btn" (click)="refreshTrip()" matTooltip="Refresh trip">
            <mat-icon>refresh</mat-icon>
          </button>
          <button class="hdr-btn" (click)="toggleTripStatus()"
                  [matTooltip]="trip?.status === 'en-route' ? 'Pause trip' : 'Resume trip'">
            <mat-icon>{{ trip?.status === 'en-route' ? 'pause_circle' : 'play_circle' }}</mat-icon>
          </button>
          <button class="hdr-btn warn" (click)="openChatbot()" matTooltip="Report issue">
            <mat-icon>add_alert</mat-icon>
          </button>

          <div class="divider-v"></div>

          <!-- User avatar -->
          <div class="user-chip">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Welcome Card ── -->
      <div class="welcome-card">
        <div class="welcome-left">
          <div class="welcome-icon">
            <mat-icon>waving_hand</mat-icon>
          </div>
          <div class="welcome-text">
            <h2 class="welcome-heading">Welcome back, {{ userName }}!</h2>
            <p class="welcome-desc">Ready to manage your camera system? Report issues or check your recent tickets below.</p>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="wa-btn primary" (click)="openChatbot()">
            <mat-icon>support_agent</mat-icon> Get AI Help
          </button>
          <button class="wa-btn outline" (click)="openChatbot()">
            <mat-icon>add_alert</mat-icon> Report Issue
          </button>
        </div>
      </div>


      <!-- ── Quick Actions + Support Info row ── -->
      <div class="mid-row">

        <!-- 75%: Quick Actions -->
        <div class="mid-left">
          <div class="section-heading">
            <mat-icon>bolt</mat-icon> Quick Actions
          </div>
          <div class="qa-grid">

            <!-- Report Issue card -->
            <div class="qa-card" (click)="openChatbot()">
              <div class="qa-icon" style="background:#fce8e6">
                <mat-icon style="color:#ea4335">add_alert</mat-icon>
              </div>
              <div class="qa-body">
                <div class="qa-title">Report Issue</div>
                <div class="qa-desc">Log a new incident or camera problem for immediate attention.</div>
              </div>
              <mat-icon class="qa-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Quick Status card -->
            <div class="qa-card" (click)="activePanel='vehicle'">
              <div class="qa-icon" style="background:#e8f0fe">
                <mat-icon style="color:#1a73e8">speed</mat-icon>
              </div>
              <div class="qa-body">
                <div class="qa-title">Quick Status</div>
                <div class="qa-desc">View vehicle health, fuel level, engine temp and current speed.</div>
              </div>
              <mat-icon class="qa-arrow">arrow_forward</mat-icon>
            </div>

          </div>
        </div>

        <!-- 25%: Support Information -->
        <div class="mid-right">
          <div class="section-heading">
            <mat-icon>info</mat-icon> Support Information
          </div>

          <!-- Emergency Contact -->
          <div class="sup-card emergency">
            <div class="sup-card-head">
              <div class="sup-icon" style="background:#fce8e6">
                <mat-icon style="color:#ea4335">phone_in_talk</mat-icon>
              </div>
              <span class="sup-title">Emergency Contact</span>
            </div>
            <p class="sup-text">For urgent issues, call:</p>
            <a class="sup-phone" href="tel:18007877678">1-800-SUPPORT</a>
            <p class="sup-avail">Available 24 / 7</p>
          </div>

          <!-- System Status -->
          <div class="sup-card status">
            <div class="sup-card-head">
              <div class="sup-icon" style="background:#e6f4ea">
                <mat-icon style="color:#34a853">check_circle</mat-icon>
              </div>
              <span class="sup-title">System Status</span>
            </div>
            <div class="sys-status-row">
              <span class="sys-dot"></span>
              <span class="sys-label">All systems operational</span>
            </div>
            <div class="sys-items">
              <div class="sys-item"><span class="material-icons">videocam</span>Camera API<span class="sys-ok">OK</span></div>
              <div class="sys-item"><span class="material-icons">cloud</span>Cloud Sync<span class="sys-ok">OK</span></div>
              <div class="sys-item"><span class="material-icons">gps_fixed</span>GPS Service<span class="sys-ok">OK</span></div>
            </div>
          </div>

          <!-- Quick Tips -->
          <div class="sup-card tips">
            <div class="sup-card-head">
              <div class="sup-icon" style="background:#fef7e0">
                <mat-icon style="color:#f9ab00">lightbulb</mat-icon>
              </div>
              <span class="sup-title">Quick Tips</span>
            </div>
            <ul class="tips-list">
              <li><mat-icon>check</mat-icon>Always check power connections first</li>
              <li><mat-icon>check</mat-icon>Ensure SD card has sufficient space</li>
              <li><mat-icon>check</mat-icon>Keep camera lens clean</li>
              <li><mat-icon>check</mat-icon>Update software regularly</li>
            </ul>
          </div>

        </div>
      </div>

      <!-- ── Content area ── -->
      <div class="content-area">
        <app-driver-chat
          class="chat-area"
          [messages]="messages"
          [isTyping]="isTyping"
          (sendMessage)="handleUserMessage($event)"
          (actionClicked)="handleAction($event)">
        </app-driver-chat>

        <app-driver-right-panel
          class="right-area"
          [trip]="trip"
          [incidents]="incidents"
          [activeTab]="activePanel"
          (completeStop)="handleCompleteStop($event)"
          (skipStop)="handleSkipStop($event)"
          (reportIncident)="reportIncident()"
          (acknowledgeIncident)="handleAcknowledge($event)"
          (resolveIncident)="handleResolve($event)"
          (refreshVehicle)="refreshTrip()">
        </app-driver-right-panel>
      </div>

    </div>

    <!-- AI Chatbot Popup -->
    <div class="chat-backdrop" *ngIf="showChatbot" (click)="showChatbot=false">
      <div class="chatbot-popup" (click)="$event.stopPropagation()">

        <!-- Chat header -->
        <div class="cb-header">
          <div class="cb-agent">
            <div class="cb-avatar"><mat-icon>support_agent</mat-icon><span class="cb-dot"></span></div>
            <div>
              <div class="cb-name">Driver AI Assistant</div>
              <div class="cb-status">{{cbTyping ? 'Typing...' : cbListening ? 'Listening...' : 'Online · Voice + Chat'}}</div>
            </div>
          </div>
          <button class="cb-close" (click)="closeChatbot()"><mat-icon>close</mat-icon></button>
        </div>

        <!-- Messages -->
        <div class="cb-messages" #cbContainer>
          <div *ngFor="let m of cbMessages" class="cb-msg" [class.cb-user]="m.role==='user'" [class.cb-agent]="m.role==='agent'">
            <div class="cb-bubble">{{m.text}}</div>
            <div class="cb-time">{{m.time | date:'shortTime'}}</div>
          </div>
          <div class="cb-msg cb-agent" *ngIf="cbTyping">
            <div class="cb-bubble typing-bubble"><span></span><span></span><span></span></div>
          </div>
        </div>

        <!-- Voice orb -->
        <div class="cb-voice-section">
          <div class="voice-orb" [class.listening]="cbListening" [class.speaking]="cbSpeaking" (click)="toggleCbVoice()">
            <mat-icon>{{cbSpeaking ? 'volume_up' : cbListening ? 'mic' : 'mic_none'}}</mat-icon>
            <div class="orb-ring"></div>
          </div>
          <div class="voice-label">{{cbSpeaking ? 'Speaking...' : cbListening ? 'Listening — speak now' : 'Tap to speak'}}</div>
          <div class="cb-transcript" *ngIf="cbLiveTranscript">{{cbLiveTranscript}}</div>
        </div>

        <!-- Optional chat input -->
        <div class="cb-input-bar">
          <input class="cb-input" [(ngModel)]="cbInput" (keyup.enter)="cbSendText(cbInput)"
                 placeholder="Or type a message...">
          <button class="cb-send" (click)="cbSendText(cbInput)" [disabled]="!cbInput.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </div>

        <!-- Raise ticket action -->
        <div class="cb-actions" *ngIf="cbMessages.length > 1">
          <button class="cb-ticket-btn" (click)="closeChatbot(); showModal=true">
            <mat-icon>confirmation_number</mat-icon> Raise a Support Ticket
          </button>
        </div>
      </div>
    </div>

    <!-- Step 1: Category -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeAll()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div class="modal-title"><span class="material-icons">build_circle</span> Select Category</div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Choose the issue category to begin AI-guided troubleshooting</p>
        <div class="cat-grid">
          <button *ngFor="let c of categories" class="cat-card" (click)="selectCategory(c)">
            <div class="cat-icon" [style.background]="c.color+'18'"><span class="material-icons" [style.color]="c.color">{{c.icon}}</span></div>
            <div class="cat-name">{{c.label}}</div>
            <div class="cat-desc">{{c.desc}}</div>
            <span class="material-icons cat-arrow">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Vehicle & Contact Details -->
    <div class="modal-backdrop" *ngIf="showDetailsModal" (click)="closeAll()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <button class="back-btn" (click)="showDetailsModal=false; showModal=true"><span class="material-icons">arrow_back</span></button>
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'"><span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span></div>
            Vehicle &amp; Contact Details
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Provide details for <strong>{{selectedCategory?.label}}</strong> troubleshooting</p>
        <form class="details-form" (ngSubmit)="submitDetails()">
          <div class="field-group">
            <label>Vehicle ID <span class="req">*</span></label>
            <div class="input-wrap" [class.err]="submitted && !form.vehicleId">
              <span class="material-icons fi">directions_car</span>
              <input type="text" [(ngModel)]="form.vehicleId" name="vehicleId" placeholder="e.g. VH-TRK-007">
            </div>
            <span class="field-err" *ngIf="submitted && !form.vehicleId">Vehicle ID is required</span>
          </div>
          <div class="field-group">
            <label>Country <span class="req">*</span></label>
            <div class="select-wrap" [class.err]="submitted && !form.country">
              <span class="material-icons fi">public</span>
              <select [(ngModel)]="form.country" name="country">
                <option value="">Select country...</option>
                <option *ngFor="let c of countryList" [value]="c">{{c}}</option>
              </select>
              <span class="material-icons sa">expand_more</span>
            </div>
            <span class="field-err" *ngIf="submitted && !form.country">Country is required</span>
          </div>
          <div class="field-group">
            <label>Contact Number <span class="req">*</span></label>
            <div class="input-wrap" [class.err]="submitted && !form.contactNo">
              <span class="material-icons fi">phone</span>
              <input type="tel" [(ngModel)]="form.contactNo" name="contactNo" placeholder="e.g. +1 555 000 0000">
            </div>
            <span class="field-err" *ngIf="submitted && !form.contactNo">Contact number is required</span>
          </div>
          <div class="field-group">
            <label>Complete Address <span class="req">*</span></label>
            <div class="textarea-wrap" [class.err]="submitted && !form.address">
              <span class="material-icons fi ta-icon">location_on</span>
              <textarea [(ngModel)]="form.address" name="address" rows="3" placeholder="Street, City, State, ZIP"></textarea>
            </div>
            <span class="field-err" *ngIf="submitted && !form.address">Address is required</span>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="showDetailsModal=false; showModal=true">Back</button>
            <button type="submit" class="btn-primary"><span class="material-icons">arrow_forward</span> Next: Describe Issue</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Step 3: Describe Issue -->
    <div class="modal-backdrop" *ngIf="showDescribeModal" (click)="closeAll()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <button class="back-btn" (click)="showDescribeModal=false; showDetailsModal=true"><span class="material-icons">arrow_back</span></button>
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'"><span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span></div>
            Describe the Issue
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Tell us what's happening with <strong>{{selectedCategory?.label}}</strong></p>
        <div class="steps-bar">
          <div class="step done"><span class="material-icons">check_circle</span> Category</div>
          <div class="step-line"></div>
          <div class="step done"><span class="material-icons">check_circle</span> Details</div>
          <div class="step-line"></div>
          <div class="step active"><span class="step-num">3</span> Describe</div>
        </div>
        <div class="input-tabs">
          <button class="itab" [class.active]="describeTab==='text'" (click)="describeTab='text'"><span class="material-icons">edit_note</span> Type</button>
          <button class="itab" [class.active]="describeTab==='voice'" (click)="switchToVoice()"><span class="material-icons">mic</span> Voice</button>
          <button class="itab" [class.active]="describeTab==='image'" (click)="describeTab='image'"><span class="material-icons">add_photo_alternate</span> Image</button>
        </div>
        <div *ngIf="describeTab==='text'" class="describe-body">
          <div class="textarea-wrap" [class.err]="descSubmitted && !issueDescription">
            <span class="material-icons fi ta-icon">description</span>
            <textarea [(ngModel)]="issueDescription" name="issueDescription" rows="5" placeholder="Describe the issue in detail — what happened, when it started, any error messages..."></textarea>
          </div>
          <span class="field-err" *ngIf="descSubmitted && !issueDescription">Please describe the issue</span>
          <div class="char-count">{{issueDescription.length}} / 1000</div>
        </div>
        <div *ngIf="describeTab==='voice'" class="describe-body voice-body">
          <div class="voice-orb" [class.listening]="isListening" (click)="isListening ? stopVoice() : startVoice()">
            <mat-icon>{{isListening ? 'mic' : 'mic_none'}}</mat-icon>
            <div class="orb-ring"></div>
          </div>
          <p class="voice-status">{{isListening ? 'Listening — speak your issue now' : voiceTranscript ? 'Recording complete — tap to re-record' : 'Tap the mic to start'}}</p>
          <div class="voice-transcript" *ngIf="voiceTranscript"><span class="material-icons">format_quote</span>{{voiceTranscript}}</div>
          <div class="voice-actions" *ngIf="voiceTranscript && !isListening">
            <button class="btn-outline" (click)="startVoice()"><span class="material-icons">mic</span> Re-record</button>
            <button class="btn-primary" (click)="useTranscript(); submitIssue()"><span class="material-icons">send</span> Submit</button>
          </div>
        </div>
        <div *ngIf="describeTab==='image'" class="describe-body image-body">
          <div class="drop-zone" [class.has-image]="uploadedImages.length>0" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
            <input #fileInput type="file" accept="image/*" multiple hidden (change)="onFileChange($event)">
            <ng-container *ngIf="uploadedImages.length===0">
              <span class="material-icons dz-icon">cloud_upload</span>
              <p class="dz-text">Drag & drop images here or <span class="dz-link">browse</span></p>
              <p class="dz-hint">PNG, JPG, WEBP up to 10MB each</p>
            </ng-container>
            <div class="img-previews" *ngIf="uploadedImages.length>0" (click)="$event.stopPropagation()">
              <div *ngFor="let img of uploadedImages; let i=index" class="img-thumb">
                <img [src]="img.url" [alt]="img.name">
                <button class="img-remove" (click)="removeImage(i)"><span class="material-icons">close</span></button>
                <span class="img-name">{{img.name}}</span>
              </div>
              <div class="img-add" (click)="fileInput.click()"><span class="material-icons">add</span></div>
            </div>
          </div>
          <div class="textarea-wrap" style="margin-top:12px; align-items:flex-start">
            <span class="material-icons fi ta-icon">edit_note</span>
            <textarea [(ngModel)]="issueDescription" name="imgNote" rows="2" placeholder="Add a note about the images (optional)"></textarea>
          </div>
        </div>
        <div class="form-actions" style="margin-top:20px">
          <button class="btn-outline" (click)="showDescribeModal=false; showDetailsModal=true">Back</button>
          <button class="btn-primary" (click)="submitIssue()"><span class="material-icons">send</span> Start Troubleshooting</button>
        </div>
      </div>
    </div>

    <!-- Step 4: AI Conversation -->
    <div class="modal-backdrop" *ngIf="showStepsModal" (click)="$event.stopPropagation()">
      <div class="modal-box steps-modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'"><span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span></div>
            AI Troubleshooting Assistant
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>

        <!-- Conversation messages -->
        <div class="ai-messages">
          <div class="ts-loading" *ngIf="stepsLoading && aiConversation.length === 0">
            <div class="spinner"></div><p>Analysing issue with knowledge base...</p>
          </div>
          <ng-container *ngFor="let m of aiConversation">
            <div class="ai-msg" [class.ai-user]="m.role==='user'" [class.ai-agent]="m.role==='agent'">
              <div class="ai-avatar" *ngIf="m.role==='agent'">
                <span class="material-icons">support_agent</span>
              </div>
              <div class="ai-bubble">{{m.text}}</div>
              <div class="ai-avatar user-av" *ngIf="m.role==='user'">
                <span class="material-icons">person</span>
              </div>
            </div>
          </ng-container>
          <div class="ai-msg ai-agent" *ngIf="stepsLoading && aiConversation.length > 0">
            <div class="ai-avatar"><span class="material-icons">support_agent</span></div>
            <div class="ai-bubble typing-bubble"><span></span><span></span><span></span></div>
          </div>
        </div>

        <!-- Follow-up input -->
        <div class="ai-input-bar" *ngIf="!stepsLoading || aiConversation.length > 0">
          <div class="ai-voice-orb" [class.listening]="aiListening" (click)="toggleAiVoice()">
            <mat-icon>{{aiListening ? 'mic' : 'mic_none'}}</mat-icon>
          </div>
          <input class="ai-input" [(ngModel)]="aiInput" (keyup.enter)="aiSend(aiInput)"
                 placeholder="Or type a follow-up...">
          <button class="ai-send" (click)="aiSend(aiInput)" [disabled]="!aiInput.trim() || stepsLoading">
            <span class="material-icons">send</span>
          </button>
        </div>

        <!-- Actions -->
        <div class="form-actions" style="margin-top:12px" *ngIf="aiConversation.length > 0">
          <button class="btn-success" (click)="stepResolved()" *ngIf="!issueResolved">
            <span class="material-icons">check_circle</span> Issue Resolved
          </button>
          <button class="btn-outline" (click)="openRaiseTicket()" *ngIf="!issueResolved">
            <span class="material-icons">confirmation_number</span> Raise a Ticket
          </button>
        </div>

        <div class="ts-resolved" *ngIf="issueResolved">
          <span class="material-icons">celebration</span>
          <h3>Issue Resolved! 🎉</h3>
          <p>Great! The issue with <strong>{{selectedCategory?.label}}</strong> has been resolved.</p>
          <button class="btn-success" (click)="closeAll()"><span class="material-icons">check</span> Close</button>
        </div>
      </div>
    </div>

    <!-- Step 5: Raise Ticket -->
    <div class="modal-backdrop" *ngIf="showTicketModal" (click)="$event.stopPropagation()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <button class="back-btn" (click)="showTicketModal=false; showStepsModal=true"><span class="material-icons">arrow_back</span></button>
          <div class="modal-title"><span class="material-icons" style="color:#ea4335">confirmation_number</span> Raise Support Ticket</div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">All troubleshooting steps failed. We'll create a ticket for <strong>{{selectedCategory?.label}}</strong>.</p>
        <form class="details-form" (ngSubmit)="submitTicket()">
          <div class="field-group">
            <label>Ticket Title <span class="req">*</span></label>
            <div class="input-wrap" [class.err]="ticketSubmitted && !ticket.title">
              <span class="material-icons fi">title</span>
              <input type="text" [(ngModel)]="ticket.title" name="tTitle" placeholder="Brief summary of the issue">
            </div>
            <span class="field-err" *ngIf="ticketSubmitted && !ticket.title">Title is required</span>
          </div>
          <div class="field-group">
            <label>Priority</label>
            <div class="select-wrap">
              <span class="material-icons fi">flag</span>
              <select [(ngModel)]="ticket.priority" name="tPriority">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="critical">🟣 Critical</option>
              </select>
              <span class="material-icons sa">expand_more</span>
            </div>
          </div>
          <div class="field-group">
            <label>Description</label>
            <div class="textarea-wrap">
              <span class="material-icons fi ta-icon">description</span>
              <textarea [(ngModel)]="ticket.description" name="tDesc" rows="4" placeholder="Full description of the issue and steps already tried..."></textarea>
            </div>
          </div>
          <div class="ticket-meta-row">
            <div class="ticket-meta-item"><span class="material-icons">directions_car</span> {{form.vehicleId}}</div>
            <div class="ticket-meta-item"><span class="material-icons">public</span> {{form.country}}</div>
            <div class="ticket-meta-item"><span class="material-icons">phone</span> {{form.contactNo}}</div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="showTicketModal=false; showStepsModal=true">Back</button>
            <button type="submit" class="btn-primary"><span class="material-icons">send</span> Submit Ticket</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Ticket Success -->
    <div class="modal-backdrop" *ngIf="showTicketSuccess" (click)="$event.stopPropagation()">
      <div class="modal-box success-box" (click)="$event.stopPropagation()">
        <span class="material-icons success-icon">check_circle</span>
        <h3>Ticket Raised Successfully!</h3>
        <p>Your support ticket <strong>{{createdTicketId}}</strong> has been created.</p>
        <p class="success-sub">Our team will contact you at <strong>{{form.contactNo}}</strong> shortly.</p>
        <div class="success-actions">
          <button class="btn-outline" (click)="closeAll()">Close</button>
          <button class="btn-primary" (click)="goToTickets()"><span class="material-icons">confirmation_number</span> View Tickets</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; }

    .driver-page {
      display:flex; flex-direction:column; height:100%; overflow:hidden;
      background:#f8f9fa; font-family:'Google Sans','Roboto',sans-serif;
    }

    /* ── Header ── */
    .portal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:0 24px; height:64px; flex-shrink:0;
      background:#fff; border-bottom:1px solid #dadce0;
      box-shadow:0 1px 4px rgba(60,64,67,.12);
    }

    /* Brand */
    .header-brand { display:flex; align-items:center; gap:12px; }
    .brand-icon {
      width:42px; height:42px; border-radius:10px;
      background:linear-gradient(135deg,#1a73e8,#0d47a1);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 6px rgba(26,115,232,.35);
    }
    .brand-icon mat-icon { color:#fff; font-size:24px; }
    .brand-text { display:flex; flex-direction:column; }
    .brand-title {
      font-size:17px; font-weight:700; color:#202124;
      font-family:'Google Sans',sans-serif; line-height:1.2;
      letter-spacing:-0.2px;
    }
    .brand-sub { font-size:11px; color:#5f6368; font-weight:400; letter-spacing:0.1px; }

    /* Centre */
    .header-centre { display:flex; align-items:center; gap:10px; }
    .status-pill {
      display:flex; align-items:center; gap:6px;
      padding:5px 14px; border-radius:20px;
      background:#f1f3f4; font-size:13px; font-weight:500; color:#5f6368;
      border:1px solid #dadce0;
    }
    .status-pill.trip-en-route  { background:#e8f0fe; color:#1a73e8; border-color:#c5d8fb; }
    .status-pill.trip-on-site   { background:#e6f4ea; color:#137333; border-color:#a8d5b5; }
    .status-pill.trip-completed { background:#e6f4ea; color:#137333; border-color:#a8d5b5; }
    .status-pill.trip-delayed   { background:#fce8e6; color:#c5221f; border-color:#f5c6c2; }
    .status-dot {
      width:7px; height:7px; border-radius:50%; background:currentColor;
      animation:pulse-dot 2s infinite;
    }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
    .trip-id { font-size:12px; color:#80868b; font-family:'Roboto Mono',monospace; }

    /* Right */
    .header-right { display:flex; align-items:center; gap:6px; }
    .hdr-btn {
      width:36px; height:36px; border-radius:50%; border:none;
      background:transparent; color:#5f6368; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:all 0.15s;
    }
    .hdr-btn:hover { background:#f1f3f4; color:#202124; }
    .hdr-btn.warn:hover { background:#fce8e6; color:#ea4335; }
    .hdr-btn mat-icon { font-size:20px; }
    .divider-v { width:1px; height:28px; background:#dadce0; margin:0 6px; }

    .user-chip { display:flex; align-items:center; gap:10px; padding:6px 12px 6px 6px; border-radius:24px; border:1px solid #dadce0; background:#f8f9fa; cursor:default; }
    .user-avatar {
      width:32px; height:32px; border-radius:50%;
      background:#1a73e8; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:700; flex-shrink:0;
    }
    .user-info { display:flex; flex-direction:column; }
    .user-name { font-size:13px; font-weight:500; color:#202124; line-height:1.2; }
    .user-role { font-size:11px; color:#5f6368; }

    /* ── Welcome Card ── */
    .welcome-card {
      display:flex; align-items:center; justify-content:space-between; gap:20px;
      margin:16px 20px 0; padding:18px 24px;
      background:#fff; border:1px solid #dadce0; border-radius:12px;
      box-shadow:0 1px 4px rgba(60,64,67,.1); border-left:4px solid #1a73e8;
      flex-shrink:0;
    }
    .welcome-left { display:flex; align-items:center; gap:16px; }
    .welcome-icon {
      width:48px; height:48px; border-radius:12px;
      background:linear-gradient(135deg,#e8f0fe,#c5d8fb);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .welcome-icon mat-icon { font-size:26px; color:#1a73e8; }
    .welcome-heading { font-size:17px; font-weight:600; color:#202124; margin:0 0 4px; font-family:'Google Sans',sans-serif; }
    .welcome-desc { font-size:13px; color:#5f6368; margin:0; line-height:1.5; max-width:480px; }
    .welcome-actions { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .wa-btn {
      display:flex; align-items:center; gap:6px; padding:9px 18px;
      border-radius:6px; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit; white-space:nowrap;
    }
    .wa-btn mat-icon { font-size:16px; }
    .wa-btn.primary { background:#1a73e8; color:#fff; border:none; }
    .wa-btn.primary:hover { background:#1557b0; box-shadow:0 1px 4px rgba(0,0,0,.2); }
    .wa-btn.outline { background:#fff; color:#1a73e8; border:1px solid #dadce0; }
    .wa-btn.outline:hover { background:#e8f0fe; border-color:#1a73e8; }


    /* ── Mid row ── */
    .mid-row {
      display:grid; grid-template-columns:3fr 1fr; gap:16px;
      padding:16px 20px 0; flex-shrink:0;
    }
    .section-heading {
      display:flex; align-items:center; gap:8px;
      font-size:14px; font-weight:600; color:#202124;
      font-family:'Google Sans',sans-serif; margin-bottom:12px;
    }
    .section-heading mat-icon { font-size:18px; color:#1a73e8; }

    /* Quick Actions */
    .qa-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .qa-card {
      display:flex; align-items:center; gap:14px; padding:16px;
      background:#fff; border:1px solid #dadce0; border-radius:10px;
      cursor:pointer; transition:all 0.15s;
      box-shadow:0 1px 3px rgba(60,64,67,.08);
    }
    .qa-card:hover { border-color:#1a73e8; box-shadow:0 2px 8px rgba(26,115,232,.15); transform:translateY(-1px); }
    .qa-icon { width:44px; height:44px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .qa-icon mat-icon { font-size:24px; }
    .qa-body { flex:1; }
    .qa-title { font-size:14px; font-weight:600; color:#202124; margin-bottom:3px; }
    .qa-desc  { font-size:12px; color:#5f6368; line-height:1.4; }
    .qa-arrow { font-size:18px !important; color:#dadce0; transition:color 0.15s; flex-shrink:0; }
    .qa-card:hover .qa-arrow { color:#1a73e8; }

    /* Support Info */
    .mid-right { display:flex; flex-direction:column; gap:10px; }
    .sup-card { background:#fff; border:1px solid #dadce0; border-radius:10px; padding:14px 16px; box-shadow:0 1px 3px rgba(60,64,67,.08); }
    .sup-card-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .sup-icon { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .sup-icon mat-icon { font-size:18px; }
    .sup-title { font-size:13px; font-weight:600; color:#202124; }
    .sup-card.emergency { border-left:3px solid #ea4335; }
    .sup-text  { font-size:12px; color:#5f6368; margin:0 0 4px; }
    .sup-phone { display:block; font-size:15px; font-weight:700; color:#ea4335; text-decoration:none; margin-bottom:3px; }
    .sup-phone:hover { text-decoration:underline; }
    .sup-avail { font-size:11px; color:#80868b; margin:0; }
    .sup-card.status { border-left:3px solid #34a853; }
    .sys-status-row { display:flex; align-items:center; gap:7px; margin-bottom:8px; }
    .sys-dot { width:8px; height:8px; border-radius:50%; background:#34a853; animation:pulse-dot 2s infinite; flex-shrink:0; }
    .sys-label { font-size:12px; font-weight:500; color:#137333; }
    .sys-items { display:flex; flex-direction:column; gap:4px; }
    .sys-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#5f6368; }
    .sys-item .material-icons { font-size:13px; color:#9aa0a6; }
    .sys-ok { margin-left:auto; font-size:11px; font-weight:600; color:#34a853; }
    .sup-card.tips { border-left:3px solid #fbbc04; }
    .tips-list { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
    .tips-list li { display:flex; align-items:flex-start; gap:6px; font-size:12px; color:#5f6368; line-height:1.4; }
    .tips-list li mat-icon { font-size:14px; color:#34a853; flex-shrink:0; margin-top:1px; }

    /* ── Content ── */
    .content-area {
      flex:1; display:grid; grid-template-columns:1fr 400px;
      overflow:hidden; min-height:0;
    }
    .chat-area  { overflow:hidden; border-right:1px solid #dadce0; }
    .right-area { overflow:hidden; }

    @media (max-width:1024px) {
      .content-area { grid-template-columns:1fr; }
      .right-area { display:none; }
      .header-centre { display:none; }
    }

    /* ── Chatbot Popup ── */
    .chat-backdrop {
      position:fixed; inset:0; background:rgba(32,33,36,.4);
      display:flex; align-items:flex-end; justify-content:flex-end;
      padding:20px; z-index:2000; animation:bdin 0.15s ease;
    }
    .chatbot-popup {
      width:380px; height:600px; background:#fff; border-radius:16px;
      box-shadow:0 8px 32px rgba(60,64,67,.3); display:flex; flex-direction:column;
      animation:mup 0.2s ease; overflow:hidden;
    }
    .cb-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px; background:#1a73e8; flex-shrink:0;
    }
    .cb-agent { display:flex; align-items:center; gap:10px; }
    .cb-avatar {
      position:relative; width:38px; height:38px; border-radius:50%;
      background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center;
    }
    .cb-avatar mat-icon { color:#fff; font-size:22px; }
    .cb-dot {
      position:absolute; bottom:1px; right:1px; width:9px; height:9px;
      border-radius:50%; background:#34a853; border:2px solid #1a73e8;
    }
    .cb-name   { font-size:14px; font-weight:600; color:#fff; }
    .cb-status { font-size:11px; color:rgba(255,255,255,.8); }
    .cb-close  { background:rgba(255,255,255,.15); border:none; cursor:pointer; color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
    .cb-close:hover { background:rgba(255,255,255,.3); }
    .cb-close mat-icon { font-size:18px; }

    .cb-messages {
      flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:#f8f9fa;
    }
    .cb-messages::-webkit-scrollbar { width:4px; }
    .cb-messages::-webkit-scrollbar-thumb { background:#dadce0; border-radius:2px; }
    .cb-msg { display:flex; flex-direction:column; gap:3px; animation:fadeUp 0.2s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .cb-user { align-items:flex-end; }
    .cb-agent { align-items:flex-start; }
    .cb-bubble {
      max-width:80%; padding:10px 14px; border-radius:16px;
      font-size:13px; line-height:1.5; word-break:break-word;
    }
    .cb-user .cb-bubble  { background:#1a73e8; color:#fff; border-bottom-right-radius:4px; }
    .cb-agent .cb-bubble { background:#fff; color:#202124; border:1px solid #dadce0; border-bottom-left-radius:4px; box-shadow:0 1px 2px rgba(60,64,67,.08); }
    .cb-time { font-size:10px; color:#9aa0a6; padding:0 4px; }
    .typing-bubble { display:flex; align-items:center; gap:4px; padding:12px 16px; }
    .typing-bubble span { width:7px; height:7px; border-radius:50%; background:#1a73e8; animation:bounce 1.2s infinite; display:block; }
    .typing-bubble span:nth-child(2) { animation-delay:0.2s; }
    .typing-bubble span:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    .cb-suggestions { display:flex; flex-wrap:wrap; gap:6px; padding:8px 12px; background:#fff; border-top:1px solid #f1f3f4; flex-shrink:0; }
    .cb-chip {
      padding:5px 12px; border-radius:16px; border:1px solid #dadce0;
      background:#fff; color:#1a73e8; font-size:12px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit;
    }
    .cb-chip:hover { background:#e8f0fe; border-color:#1a73e8; }

    .cb-input-bar {
      display:flex; align-items:center; gap:8px; padding:10px 12px;
      background:#fff; border-top:1px solid #dadce0; flex-shrink:0;
    }
    .cb-input {
      flex:1; border:1px solid #dadce0; border-radius:20px; padding:8px 14px;
      font-size:13px; color:#202124; outline:none; font-family:inherit;
      transition:border-color 0.15s;
    }
    .cb-input:focus { border-color:#1a73e8; }
    .cb-input::placeholder { color:#9aa0a6; }
    .cb-send {
      width:34px; height:34px; border-radius:50%; border:none;
      background:#1a73e8; color:#fff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background 0.15s; flex-shrink:0;
    }
    .cb-actions { padding:8px 12px; background:#fff; border-top:1px solid #f1f3f4; flex-shrink:0; }
    .cb-ticket-btn {
      display:flex; align-items:center; gap:6px; width:100%;
      padding:8px 14px; border-radius:6px; border:1px solid #dadce0;
      background:#fff; color:#ea4335; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit;
    }
    .cb-ticket-btn:hover { background:#fce8e6; border-color:#ea4335; }
    .cb-ticket-btn mat-icon { font-size:16px; }

    /* Voice orb */
    .cb-voice-section { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 0 8px; flex-shrink:0; }
    .voice-orb {
      width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,#1a73e8,#0d47a1);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; position:relative; transition:transform 0.15s;
      box-shadow:0 4px 16px rgba(26,115,232,.4);
    }
    .voice-orb:hover { transform:scale(1.05); }
    .voice-orb mat-icon { color:#fff; font-size:32px; z-index:1; }
    .voice-orb.listening { background:linear-gradient(135deg,#ea4335,#c5221f); box-shadow:0 4px 20px rgba(234,67,53,.5); }
    .voice-orb.speaking  { background:linear-gradient(135deg,#34a853,#137333); box-shadow:0 4px 20px rgba(52,168,83,.5); }
    .orb-ring {
      position:absolute; inset:-6px; border-radius:50%;
      border:2px solid rgba(26,115,232,.3);
      animation:none;
    }
    .voice-orb.listening .orb-ring { border-color:rgba(234,67,53,.4); animation:pulse-orb 1s infinite; }
    .voice-orb.speaking  .orb-ring { border-color:rgba(52,168,83,.4);  animation:pulse-orb 1.5s infinite; }
    @keyframes pulse-orb { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.4} }
    .voice-label { font-size:12px; color:#5f6368; font-weight:500; }
    .cb-transcript { font-size:12px; color:#1a73e8; font-style:italic; max-width:280px; text-align:center; }

    /* ── Modals (same as dashboard) ── */
    .modal-backdrop { position:fixed; inset:0; background:rgba(32,33,36,.5); display:flex; align-items:center; justify-content:center; z-index:1000; animation:bdin 0.15s ease; }
    @keyframes bdin { from{opacity:0} to{opacity:1} }
    .modal-box { background:#fff; border-radius:12px; padding:28px; width:660px; max-width:95vw; max-height:90vh; overflow-y:auto; box-shadow:0 8px 32px rgba(60,64,67,.3); animation:mup 0.2s ease; }
    @keyframes mup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .modal-title { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:500; color:#202124; font-family:'Google Sans',sans-serif; }
    .modal-title .material-icons { color:#1a73e8; font-size:22px; }
    .close-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; }
    .close-btn:hover { background:#f1f3f4; color:#202124; }
    .close-btn .material-icons { font-size:20px; }
    .modal-sub { font-size:14px; color:#5f6368; margin:0 0 20px; }
    .modal-sub strong { color:#202124; }
    .cat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .cat-card { display:flex; flex-direction:column; gap:6px; padding:16px 16px 14px; background:#fff; border:1px solid #dadce0; border-radius:8px; cursor:pointer; text-align:left; transition:all 0.15s; box-shadow:0 1px 2px rgba(60,64,67,.06); position:relative; font-family:'Google Sans',sans-serif; }
    .cat-card:hover { border-color:#1a73e8; box-shadow:0 2px 8px rgba(26,115,232,.15); transform:translateY(-1px); }
    .cat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:4px; flex-shrink:0; }
    .cat-icon .material-icons { font-size:24px; }
    .cat-name { font-size:14px; font-weight:500; color:#202124; }
    .cat-desc { font-size:12px; color:#5f6368; line-height:1.4; padding-right:20px; }
    .cat-arrow { position:absolute; bottom:14px; right:12px; font-size:16px !important; color:#dadce0; transition:color 0.15s; }
    .cat-card:hover .cat-arrow { color:#1a73e8; }
    .details-box { width:520px; }
    .back-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; margin-right:4px; }
    .back-btn:hover { background:#f1f3f4; color:#202124; }
    .back-btn .material-icons { font-size:20px; }
    .cat-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:8px; flex-shrink:0; }
    .cat-badge .material-icons { font-size:18px; }
    .details-form { display:flex; flex-direction:column; gap:18px; }
    .field-group { display:flex; flex-direction:column; gap:5px; }
    label { font-size:13px; font-weight:500; color:#5f6368; }
    .req { color:#ea4335; }
    .input-wrap, .select-wrap, .textarea-wrap { display:flex; align-items:center; background:#fff; border:1px solid #dadce0; border-radius:4px; transition:border-color 0.15s, box-shadow 0.15s; box-shadow:0 1px 2px rgba(60,64,67,.06); }
    .input-wrap:focus-within, .select-wrap:focus-within, .textarea-wrap:focus-within { border-color:#1a73e8; box-shadow:0 0 0 2px #e8f0fe; }
    .input-wrap.err, .select-wrap.err, .textarea-wrap.err { border-color:#ea4335; }
    .fi { color:#9aa0a6; font-size:18px; padding:0 10px; flex-shrink:0; }
    .ta-icon { align-self:flex-start; padding-top:10px; }
    .input-wrap input, .textarea-wrap textarea { flex:1; border:none; outline:none; background:transparent; color:#202124; font-size:14px; padding:11px 10px 11px 0; font-family:'Google Sans','Roboto',sans-serif; resize:none; }
    .input-wrap input::placeholder, .textarea-wrap textarea::placeholder { color:#9aa0a6; }
    .select-wrap { position:relative; }
    .select-wrap select { flex:1; border:none; outline:none; background:transparent; color:#202124; font-size:14px; padding:11px 32px 11px 0; font-family:'Google Sans','Roboto',sans-serif; appearance:none; cursor:pointer; }
    .sa { position:absolute; right:8px; color:#5f6368; font-size:18px; pointer-events:none; }
    .field-err { font-size:12px; color:#ea4335; }
    .form-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }
    .btn-outline { padding:9px 20px; border-radius:4px; border:1px solid #dadce0; background:#fff; color:#1a73e8; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:inherit; }
    .btn-outline:hover { background:#e8f0fe; border-color:#1a73e8; }
    .btn-primary { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:4px; border:none; background:#1a73e8; color:#fff; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s, box-shadow 0.15s; font-family:inherit; }
    .btn-primary:hover { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .btn-primary .material-icons { font-size:16px; }
    .steps-bar { display:flex; align-items:center; margin-bottom:20px; background:#f8f9fa; border-radius:8px; padding:10px 16px; }
    .step { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:#9aa0a6; white-space:nowrap; }
    .step.done { color:#34a853; } .step.done .material-icons { font-size:16px; }
    .step.active { color:#1a73e8; }
    .step-num { width:18px; height:18px; border-radius:50%; background:#1a73e8; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .step-line { flex:1; height:2px; background:#dadce0; margin:0 8px; min-width:20px; }
    .input-tabs { display:flex; gap:8px; margin-bottom:16px; }
    .itab { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:20px; border:1px solid #dadce0; background:#fff; color:#5f6368; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:inherit; }
    .itab .material-icons { font-size:16px; }
    .itab:hover, .itab.active { border-color:#1a73e8; background:#e8f0fe; color:#1a73e8; }
    .describe-body { animation:mup 0.15s ease; }
    .char-count { font-size:11px; color:#9aa0a6; text-align:right; margin-top:4px; }
    .voice-body { display:flex; flex-direction:column; align-items:center; gap:16px; padding:16px 0; }
    .voice-ring { width:80px; height:80px; border-radius:50%; background:#e8f0fe; border:3px solid #dadce0; display:flex; align-items:center; justify-content:center; transition:all 0.3s; cursor:pointer; }
    .voice-ring.listening { background:#fce8e6; border-color:#ea4335; animation:pulse-ring 1.2s infinite; }
    @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(234,67,53,.3)} 50%{box-shadow:0 0 0 12px rgba(234,67,53,0)} }
    .voice-ring .material-icons { font-size:36px; color:#1a73e8; }
    .voice-ring.listening .material-icons { color:#ea4335; }
    .voice-status { font-size:14px; color:#5f6368; margin:0; }
    .voice-transcript { display:flex; align-items:flex-start; gap:8px; background:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #1a73e8; border-radius:4px; padding:12px 14px; font-size:14px; color:#202124; width:100%; line-height:1.5; }
    .voice-transcript .material-icons { color:#1a73e8; font-size:18px; flex-shrink:0; margin-top:1px; }
    .voice-actions { display:flex; gap:8px; }
    .btn-danger { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:4px; border:none; background:#ea4335; color:#fff; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s; font-family:inherit; }
    .btn-danger:hover { background:#c5221f; }
    .btn-danger .material-icons { font-size:16px; }
    .image-body { display:flex; flex-direction:column; }
    .drop-zone { border:2px dashed #dadce0; border-radius:8px; padding:32px 20px; text-align:center; cursor:pointer; transition:all 0.15s; background:#fafafa; }
    .drop-zone:hover { border-color:#1a73e8; background:#e8f0fe; }
    .drop-zone.has-image { padding:16px; border-style:solid; border-color:#1a73e8; }
    .dz-icon { font-size:40px !important; color:#dadce0; display:block; margin:0 auto 8px; }
    .dz-text { font-size:14px; color:#5f6368; margin:0 0 4px; }
    .dz-link { color:#1a73e8; font-weight:500; }
    .dz-hint { font-size:12px; color:#9aa0a6; margin:0; }
    .img-previews { display:flex; flex-wrap:wrap; gap:10px; }
    .img-thumb { position:relative; width:90px; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .img-thumb img { width:90px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #dadce0; }
    .img-remove { position:absolute; top:-6px; right:-6px; width:20px; height:20px; border-radius:50%; border:none; background:#ea4335; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .img-remove .material-icons { font-size:12px; }
    .img-name { font-size:10px; color:#5f6368; text-align:center; width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .img-add { width:90px; height:70px; border-radius:6px; border:2px dashed #dadce0; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#9aa0a6; transition:all 0.15s; }
    .img-add:hover { border-color:#1a73e8; color:#1a73e8; background:#e8f0fe; }
    .img-add .material-icons { font-size:24px; }
    .img-note-wrap { align-items:flex-start; margin-top:12px; }
    .steps-modal { width:580px; }
    /* AI Conversation */
    .ai-messages { display:flex; flex-direction:column; gap:12px; max-height:340px; overflow-y:auto; padding:4px 0 8px; margin-bottom:8px; }
    .ai-messages::-webkit-scrollbar { width:4px; }
    .ai-messages::-webkit-scrollbar-thumb { background:#dadce0; border-radius:2px; }
    .ai-msg { display:flex; align-items:flex-end; gap:8px; animation:fadeUp 0.2s ease; }
    .ai-user  { flex-direction:row-reverse; }
    .ai-avatar { width:30px; height:30px; border-radius:50%; background:#1a73e8; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ai-avatar .material-icons { font-size:16px; color:#fff; }
    .ai-avatar.user-av { background:#e8f0fe; }
    .ai-avatar.user-av .material-icons { color:#1a73e8; }
    .ai-bubble { max-width:82%; padding:10px 14px; border-radius:16px; font-size:13px; line-height:1.6; word-break:break-word; }
    .ai-agent .ai-bubble { background:#f8f9fa; border:1px solid #dadce0; border-bottom-left-radius:4px; color:#202124; }
    .ai-user  .ai-bubble { background:#1a73e8; color:#fff; border-bottom-right-radius:4px; }
    .typing-bubble { display:flex; align-items:center; gap:4px; padding:12px 16px; }
    .typing-bubble span { width:7px; height:7px; border-radius:50%; background:#1a73e8; animation:bounce 1.2s infinite; display:block; }
    .typing-bubble span:nth-child(2) { animation-delay:0.2s; }
    .typing-bubble span:nth-child(3) { animation-delay:0.4s; }
    .ai-input-bar { display:flex; align-items:center; gap:8px; padding:8px 0 0; border-top:1px solid #dadce0; }
    .ai-voice-orb {
      width:36px; height:36px; border-radius:50%; background:#1a73e8;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex-shrink:0; transition:background 0.15s;
    }
    .ai-voice-orb.listening { background:#ea4335; animation:pulse-orb 1s infinite; }
    .ai-voice-orb .material-icons { font-size:18px; color:#fff; }
    .ai-input { flex:1; border:1px solid #dadce0; border-radius:20px; padding:8px 14px; font-size:13px; color:#202124; outline:none; font-family:inherit; transition:border-color 0.15s; }
    .ai-input:focus { border-color:#1a73e8; }
    .ai-input::placeholder { color:#9aa0a6; }
    .ai-send { width:34px; height:34px; border-radius:50%; border:none; background:#1a73e8; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ai-send:disabled { background:#dadce0; cursor:not-allowed; }
    .ai-send .material-icons { font-size:16px; }
    .ts-loading { display:flex; flex-direction:column; align-items:center; gap:16px; padding:40px 0; color:#5f6368; font-size:14px; }
    .spinner { width:32px; height:32px; border-radius:50%; border:3px solid #dadce0; border-top-color:#1a73e8; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .ts-step-card { display:flex; gap:16px; padding:20px; background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; margin-bottom:20px; animation:mup 0.2s ease; }
    .ts-step-num { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; }
    .ts-step-body { flex:1; }
    .ts-step-title { font-size:16px; font-weight:500; color:#202124; margin-bottom:6px; }
    .ts-step-desc  { font-size:14px; color:#5f6368; line-height:1.6; margin-bottom:8px; }
    .ts-step-tip { display:flex; align-items:flex-start; gap:6px; font-size:12px; color:#b06000; background:#fef7e0; border-radius:4px; padding:8px 10px; }
    .ts-step-tip .material-icons { font-size:14px; color:#fbbc04; flex-shrink:0; margin-top:1px; }
    .ts-question { margin-bottom:16px; }
    .ts-q-label { font-size:14px; font-weight:500; color:#202124; margin:0 0 12px; }
    .ts-q-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .btn-success { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:4px; border:none; background:#34a853; color:#fff; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s; font-family:inherit; }
    .btn-success:hover { background:#2d9249; }
    .btn-success .material-icons { font-size:16px; }
    .ts-done-list { border-top:1px solid #dadce0; padding-top:12px; }
    .ts-done-label { font-size:11px; font-weight:600; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
    .ts-done-item { display:flex; align-items:center; gap:6px; font-size:13px; color:#80868b; padding:3px 0; }
    .ts-done-item .material-icons { font-size:14px; color:#dadce0; }
    .ts-exhausted, .ts-resolved { text-align:center; padding:32px 20px; animation:mup 0.2s ease; }
    .ts-exhausted .material-icons { font-size:48px; color:#ea4335; display:block; margin:0 auto 12px; }
    .ts-resolved  .material-icons { font-size:48px; color:#34a853; display:block; margin:0 auto 12px; }
    .ts-exhausted h3, .ts-resolved h3 { font-size:18px; font-weight:500; color:#202124; margin:0 0 8px; }
    .ts-exhausted p, .ts-resolved p { font-size:14px; color:#5f6368; margin:0 0 20px; }
    .ts-resolved p strong { color:#202124; }
    .ticket-meta-row { display:flex; gap:16px; flex-wrap:wrap; background:#f8f9fa; border-radius:6px; padding:10px 14px; font-size:13px; color:#5f6368; }
    .ticket-meta-item { display:flex; align-items:center; gap:6px; }
    .ticket-meta-item .material-icons { font-size:15px; color:#1a73e8; }
    .success-box { width:420px; text-align:center; padding:40px 32px; }
    .success-icon { font-size:64px !important; color:#34a853; display:block; margin:0 auto 16px; }
    .success-box h3 { font-size:20px; font-weight:500; color:#202124; margin:0 0 10px; }
    .success-box p { font-size:14px; color:#5f6368; margin:0 0 6px; }
    .success-sub { font-size:13px; color:#80868b; margin-bottom:24px !important; }
    .success-box p strong { color:#202124; }
    .success-actions { display:flex; justify-content:center; gap:10px; }
  `]
})
export class DriverComponent implements OnInit, AfterViewChecked {
  @ViewChild('cbContainer') cbContainer!: ElementRef;
  private cbShouldScroll = false;
  messages: DriverMessage[] = [];
  trip: TripInfo | null = null;
  incidents: Incident[] = [];
  activePanel = 'route';
  isTyping = false;
  currentUser: User | null = null;

  private incidentCounter = 0;

  // ── Troubleshooting flow state ──
  showChatbot = false;
  cbInput = '';
  cbTyping = false;
  cbListening = false;
  cbSpeaking = false;
  cbLiveTranscript = '';
  private cbRecognition: any = null;
  private cbSynthesis: SpeechSynthesisUtterance | null = null;
  showModal         = false;
  showDetailsModal  = false;
  showDescribeModal = false;
  showStepsModal    = false;
  showTicketModal   = false;
  showTicketSuccess = false;
  cbMessages: { role: 'user'|'agent'; text: string; time: Date }[] = [
    { role: 'agent', text: 'Hi! I\'m your Driver AI Assistant. Describe your issue by voice or text and I\'ll help you troubleshoot it right away.', time: new Date() }
  ];
  cbSuggestions = ['Camera not connecting', 'GPS signal lost', 'SD card full', 'Software update failed', 'Power issue'];

  private kbResponses: Record<string, string> = {
    'camera': 'For camera connection issues: 1) Check all cables are firmly connected. 2) Verify power supply voltage (12V DC). 3) Restart the camera service: sudo systemctl restart camera-service. 4) Check logs for errors.',
    'gps': 'For GPS signal issues: 1) Ensure the antenna has a clear view of the sky. 2) Check the antenna cable connection. 3) Restart GPS daemon: sudo systemctl restart gpsd. 4) Run calibration from Admin > GPS > Calibrate.',
    'sd card': 'For SD card / storage issues: 1) Check available space with: df -h. 2) Run health check: sudo badblocks -v /dev/mmcblk0. 3) Verify mount: mount | grep /data. 4) Replace card if errors found.',
    'storage': 'For storage issues: 1) Delete old footage if disk >90% full. 2) Check SD card health. 3) Verify mount points are correct. 4) Run fsck to repair file system errors.',
    'software': 'For software issues: 1) Restart the application: sudo systemctl restart streetview-agent. 2) Clear cache: sudo rm -rf /var/cache/streetview/*. 3) Check for updates: sudo apt update && sudo apt upgrade.',
    'power': 'For power issues: 1) Check power supply voltage with a multimeter (should be 12V DC ±5%). 2) Inspect cables for damage. 3) Check battery level in admin panel. 4) Connect to mains if battery <15%.',
    'update': 'For software update issues: 1) Run: sudo apt update && sudo apt upgrade. 2) Check internet connectivity first. 3) If update fails, try: sudo apt --fix-broken install. 4) Restart after update.',
    'connect': 'For connectivity issues: 1) Check physical cables. 2) Verify IP configuration. 3) Test with: ping 8.8.8.8. 4) Check firewall rules: sudo ufw status. 5) Restart network: sudo ifdown eth0 && sudo ifup eth0.',
    'lens': 'For lens/image quality issues: 1) Clean lens with microfibre cloth. 2) Check auto-focus settings. 3) Reset exposure to default. 4) Enable HDR mode for bright conditions.',
    'default': 'I can help with camera system issues, GPS problems, connectivity, storage, software updates, and power issues. Please describe your problem in more detail and I\'ll guide you through the solution.'
  };

  // Open chatbot and auto-start voice
  openChatbot(): void {
    this.showChatbot = true;
    this.cbShouldScroll = true;
    this.cbMessages = [{ role: 'agent', text: 'Hi! I\'m your Driver AI Assistant. Describe your issue by voice or text and I\'ll help you troubleshoot it right away.', time: new Date() }];
    this.cbInput = '';
    this.cbLiveTranscript = '';
    setTimeout(() => this.startCbVoice(), 400);
  }

  closeChatbot(): void {
    this.stopCbVoice();
    this.stopCbSpeech();
    this.showChatbot = false;
  }

  toggleCbVoice(): void {
    if (this.cbListening) this.stopCbVoice();
    else this.startCbVoice();
  }

  private startCbVoice(): void {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      this.cbMessages = [...this.cbMessages, {
        role: 'agent',
        text: 'Voice not supported in this browser. Please use Google Chrome or Chromium.',
        time: new Date()
      }];
      return;
    }
    if (this.cbRecognition) { try { this.cbRecognition.abort(); } catch {} }

    const doStart = () => {
      try {
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        let final = '';
        rec.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += t;
            else interim += t;
          }
          this.cbLiveTranscript = final || interim;
        };
        rec.onerror = (e: any) => {
          this.cbListening = false;
          this.cbLiveTranscript = '';
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            this.cbMessages = [...this.cbMessages, {
              role: 'agent',
              text: 'Microphone blocked. On Linux server: run Chromium with --use-fake-ui-for-media-stream flag, or use the text input below.',
              time: new Date()
            }];
          }
        };
        rec.onend = () => {
          this.cbListening = false;
          if (final.trim()) {
            this.cbLiveTranscript = '';
            this.cbSendMessage(final.trim());
          }
        };
        rec.start();
        this.cbRecognition = rec;
        this.cbListening = true;
        this.cbLiveTranscript = '';
      } catch (err) {
        this.cbListening = false;
        console.warn('SpeechRecognition start failed:', err);
      }
    };

    // On remote server HTTP is not secure context — skip getUserMedia and try directly
    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => doStart())
        .catch(() => doStart()); // try anyway even if getUserMedia fails
    } else {
      doStart();
    }
  }

  private stopCbVoice(): void {
    this.cbListening = false;
    this.cbLiveTranscript = '';
    try { this.cbRecognition?.stop(); } catch {}
  }

  private stopCbSpeech(): void {
    this.cbSpeaking = false;
    window.speechSynthesis?.cancel();
  }

  private speakReply(text: string): void {
    if (!window.speechSynthesis) return;
    this.stopCbSpeech();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 1.0;
    utt.onstart = () => { this.cbSpeaking = true; };
    utt.onend = () => {
      this.cbSpeaking = false;
      // Auto-restart listening after speaking
      setTimeout(() => { if (this.showChatbot) this.startCbVoice(); }, 300);
    };
    utt.onerror = () => { this.cbSpeaking = false; };
    window.speechSynthesis.speak(utt);
  }

  cbSendText(text: string): void {
    if (!text?.trim()) return;
    this.cbInput = '';
    this.cbSendMessage(text.trim());
  }

  private cbSendMessage(text: string): void {
    this.stopCbVoice();
    this.cbMessages = [...this.cbMessages, { role: 'user', text, time: new Date() }];
    this.cbTyping = true;
    this.cbShouldScroll = true;

    this.kbService.search(text, 3).subscribe(results => {
      let reply = '';
      if (results.length > 0) {
        reply = this.extractRelevant(results.map(r => r.content).join(' '), text);
      }
      if (!reply) reply = this.getKbResponse(text);
      this.cbMessages = [...this.cbMessages, { role: 'agent', text: reply, time: new Date() }];
      this.cbTyping = false;
      this.cbShouldScroll = true;
      this.speakReply(reply);
    });
  }

  private extractRelevant(raw: string, query: string): string {
    // Split into sentences and score by keyword overlap with query
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sentences = raw.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
    if (!sentences.length) return raw.substring(0, 300);

    const scored = sentences.map(s => ({
      s,
      score: keywords.filter(k => s.toLowerCase().includes(k)).length
    }));
    scored.sort((a, b) => b.score - a.score);

    // Return top 3 most relevant sentences
    const top = scored.slice(0, 3).map(x => x.s.trim()).join(' ');
    return top || sentences.slice(0, 2).join(' ');
  }

  private getKbResponse(query: string): string {
    const q = query.toLowerCase();
    for (const key of Object.keys(this.kbResponses)) {
      if (key !== 'default' && q.includes(key)) return this.kbResponses[key];
    }
    return this.kbResponses['default'];
  }
  submitted         = false;
  descSubmitted     = false;
  ticketSubmitted   = false;
  describeTab       = 'text';
  issueDescription  = '';
  isListening       = false;
  voiceTranscript   = '';
  uploadedImages: { url: string; name: string }[] = [];
  private recognition: any = null;
  selectedCategory: { label:string; icon:string; color:string; action:string } | null = null;
  stepsLoading    = false;
  activeSteps:    { title:string; desc:string; tip?:string }[] = [];
  completedSteps: { title:string }[] = [];
  currentStepIdx  = 0;
  issueResolved   = false;
  aiConversation: { role: 'user'|'agent'; text: string; time: Date }[] = [];
  aiInput = '';
  aiListening = false;
  private aiRecognition: any = null;
  ticket = { title: '', priority: 'medium', description: '' };
  createdTicketId = '';
  form = { vehicleId: '', country: '', contactNo: '', address: '' };

  mockLocation = {
    country: 'United States',
    contactNo: '+1 555 000 0042',
    address: '456 Oak Ave, Midtown, New York, NY 10001'
  };

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.loadTrip();
    this.detectLocation();
    this.addMessage('agent', `Hello! I'm your Driver AI Assistant. I can help with navigation, vehicle issues, and incident reporting. How can I help?`, [
      { id: 'a1', label: 'Navigation Help',   action: 'nav_help' },
      { id: 'a2', label: 'Vehicle Issue',     action: 'vehicle_issue' },
      { id: 'a3', label: 'Report Delay',      action: 'report_delay' },
      { id: 'a4', label: 'Emergency Support', action: 'emergency' }
    ]);
  }

  private detectLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          .then(r => r.json())
          .then(data => {
            const a = data.address || {};
            this.mockLocation = {
              country: a.country || this.mockLocation.country,
              contactNo: this.mockLocation.contactNo,
              address: [
                a.road || a.pedestrian || '',
                a.city || a.town || a.village || '',
                a.state || '',
                a.postcode || ''
              ].filter(Boolean).join(', ') || this.mockLocation.address
            };
          })
          .catch(() => {});
      },
      () => {} // silently ignore if denied
    );
  }

  countryList = [
    'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh','Belgium',
    'Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Egypt',
    'Ethiopia','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia',
    'Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kenya','Malaysia','Mexico',
    'Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines',
    'Poland','Portugal','Romania','Russia','Saudi Arabia','South Africa','South Korea','Spain',
    'Sri Lanka','Sweden','Switzerland','Thailand','Turkey','Ukraine','United Arab Emirates',
    'United Kingdom','United States','Vietnam','Zimbabwe'
  ];

  categories = [
    { label: 'Camera System',    desc: 'Lens, image quality, focus issues',   icon: 'videocam',  color: '#1a73e8', action: 'diagnose_quality' },
    { label: 'Connectivity',     desc: 'Network, WiFi, streaming problems',    icon: 'wifi',      color: '#34a853', action: 'diagnose_connection' },
    { label: 'Power & Hardware', desc: 'Battery, cables, physical components', icon: 'power',     color: '#fbbc04', action: 'diagnose_hardware' },
    { label: 'Software Issues',  desc: 'Firmware, app crashes, updates',       icon: 'code',      color: '#ea4335', action: 'diagnose_software' },
    { label: 'Storage & Data',   desc: 'SD card, memory, data sync errors',    icon: 'storage',   color: '#9334e6', action: 'diagnose_storage' },
    { label: 'GPS & Location',   desc: 'Signal loss, calibration, accuracy',   icon: 'gps_fixed', color: '#00897b', action: 'diagnose_gps' },
  ];

  private stepBank: Record<string, { title:string; desc:string; tip?:string }[]> = {
    diagnose_quality: [
      { title: 'Clean the Camera Lens', desc: 'Use a microfibre cloth to gently clean the lens surface.', tip: 'Avoid paper towels — they scratch the lens coating.' },
      { title: 'Check Focus Settings', desc: 'Verify auto-focus is enabled. Try toggling it off and back on.', tip: 'Manual focus override can get stuck after a firmware update.' },
      { title: 'Adjust Exposure & Brightness', desc: 'Reset exposure to default (0) and increase brightness by +10.', tip: 'Try enabling HDR mode in direct sunlight.' },
      { title: 'Restart Camera Service', desc: 'Run: sudo systemctl restart camera-service. Wait 30 seconds.', tip: 'Check logs: journalctl -u camera-service -n 50' },
      { title: 'Update Camera Firmware', desc: 'Check the manufacturer portal for the latest firmware and apply via admin panel.' }
    ],
    diagnose_connection: [
      { title: 'Check Physical Cables', desc: 'Inspect all ethernet and power cables. Re-seat each connector firmly.', tip: 'A partially seated RJ45 is a very common cause of drops.' },
      { title: 'Verify Network Configuration', desc: 'Confirm IP, subnet mask, and gateway. Run: ping 8.8.8.8' },
      { title: 'Restart Network Interface', desc: 'Run: sudo ifdown eth0 && sudo ifup eth0', tip: 'If using WiFi, move closer to the access point.' },
      { title: 'Check Firewall Rules', desc: 'Ensure ports 80, 443, and 8554 are open. Run: sudo ufw status' },
      { title: 'Power Cycle the Router/Switch', desc: 'Unplug for 30 seconds, reconnect. Wait 2 minutes.' }
    ],
    diagnose_hardware: [
      { title: 'Inspect for Physical Damage', desc: 'Check for cracks, corrosion, or burn marks.', tip: 'Water ingress is common in outdoor units.' },
      { title: 'Check Power Supply Voltage', desc: 'Verify the supply delivers correct voltage (12V DC). Replace if outside ±5%.' },
      { title: 'Verify Battery Level', desc: 'If below 15%, connect to mains and charge for 2 hours before retesting.' },
      { title: 'Run Built-in Hardware Diagnostics', desc: 'Navigate to Admin > Diagnostics > Run Hardware Test.' },
      { title: 'Reseat Internal Components', desc: 'Reseat the SD card, SIM card, and internal connectors.' }
    ],
    diagnose_software: [
      { title: 'Restart the Application', desc: 'Run: sudo systemctl restart streetview-agent', tip: 'Check logs at /var/log/streetview/error.log' },
      { title: 'Clear Application Cache', desc: 'Run: sudo rm -rf /var/cache/streetview/* then restart.' },
      { title: 'Check for Pending Updates', desc: 'Run: sudo apt update && sudo apt upgrade' },
      { title: 'Reinstall the Application', desc: 'Run: sudo apt remove streetview-agent && sudo apt install streetview-agent' },
      { title: 'Restore Factory Settings', desc: 'Navigate to Admin > System > Factory Reset. Backup first.' }
    ],
    diagnose_storage: [
      { title: 'Check Storage Usage', desc: 'Run: df -h. If above 90%, delete old footage.', tip: 'Set up auto-purge in Admin > Storage.' },
      { title: 'Test SD Card Health', desc: 'Run: sudo badblocks -v /dev/mmcblk0. Replace if errors found.' },
      { title: 'Verify Mount Points', desc: 'Run: mount | grep /data. Remount if missing: sudo mount -a' },
      { title: 'Check File System Integrity', desc: 'Run: sudo fsck /dev/mmcblk0p1 to repair errors.' },
      { title: 'Replace Storage Media', desc: 'Replace the SD card or SSD and reformat via admin panel.' }
    ],
    diagnose_gps: [
      { title: 'Check GPS Antenna Connection', desc: 'Verify the antenna cable is firmly connected.', tip: 'Antenna must have clear sky view.' },
      { title: 'Verify Sky Visibility', desc: 'Ensure unobstructed view of the sky. Buildings block signals.' },
      { title: 'Restart GPS Module', desc: 'Run: sudo systemctl restart gpsd' },
      { title: 'Update GPS Firmware', desc: 'Check manufacturer site for firmware updates.' },
      { title: 'Run GPS Calibration', desc: 'Navigate to Admin > GPS > Calibrate. Drive in a figure-8 pattern.' }
    ]
  };

  constructor(private snackBar: MatSnackBar, private authService: AuthService, private ticketService: TicketService, private router: Router, private kbService: KnowledgeBaseService) {}

  ngAfterViewChecked(): void {
    if (this.cbShouldScroll && this.cbContainer) {
      const el = this.cbContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.cbShouldScroll = false;
    }
  }

  get tripStatusLabel(): string {
    const map: Record<string, string> = {
      idle: 'Idle', 'en-route': 'En Route', 'on-site': 'On Site',
      completed: 'Completed', delayed: 'Delayed'
    };
    return map[this.trip?.status || 'idle'] || 'Unknown';
  }

  get openIncidentCount(): number {
    return this.incidents.filter(i => i.status === 'open').length;
  }

  get userName(): string {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.email.split('@')[0];
  }

  get userRole(): string {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.is_admin ? 'Administrator' : 'Driver';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  handleUserMessage(text: string): void {
    this.addMessage('user', text);
    this.isTyping = true;
    of(null).pipe(delay(1200)).subscribe(() => {
      this.isTyping = false;
      this.addMessage('agent', `I received your message: "${text}". Let me assist you with that right away.`);
    });
  }

  handleAction(action: string): void {
    const responses: Record<string, string> = {
      nav_help:      'I can help with navigation. Please share your current location or destination.',
      vehicle_issue: "Describe the vehicle issue and I'll guide you through diagnostics.",
      report_delay:  "I'll log a delay report. What is the reason and estimated delay time?",
      emergency:     '🚨 Emergency mode activated. Dispatching support to your location. Stay safe!'
    };
    this.isTyping = true;
    of(null).pipe(delay(800)).subscribe(() => {
      this.isTyping = false;
      this.addMessage('agent', responses[action] || 'How can I assist you?');
    });
  }

  handleCompleteStop(stop: RouteStop): void {
    if (!this.trip) return;
    this.trip = {
      ...this.trip,
      completedStops: this.trip.completedStops + 1,
      stops: this.trip.stops.map(s => s.id === stop.id ? { ...s, status: 'completed' } : s)
    };
    this.addMessage('system', `Stop completed: ${stop.address}`);
    this.snackBar.open(`Stop ${stop.id} completed!`, 'Close', { duration: 3000 });
  }

  handleSkipStop(stop: RouteStop): void {
    if (!this.trip) return;
    this.trip = {
      ...this.trip,
      stops: this.trip.stops.map(s => s.id === stop.id ? { ...s, status: 'skipped' } : s)
    };
    this.snackBar.open(`Stop ${stop.id} skipped`, 'Close', { duration: 2000 });
  }

  reportIncident(): void {
    this.incidentCounter++;
    const incident: Incident = {
      id: 'INC-' + Date.now(),
      title: `Incident #${this.incidentCounter} Reported`,
      description: 'Incident reported by driver.',
      severity: (['low', 'medium', 'high'] as const)[this.incidentCounter % 3],
      status: 'open',
      location: this.trip?.stops.find(s => s.status === 'arrived')?.address || 'Current Location',
      reportedAt: new Date()
    };
    this.incidents = [incident, ...this.incidents];
    this.activePanel = 'incidents';
    this.addMessage('system', `Incident reported: ${incident.title}`);
    this.snackBar.open('Incident reported!', 'View', { duration: 3000 });
  }

  handleAcknowledge(id: string): void {
    this.incidents = this.incidents.map(i => i.id === id ? { ...i, status: 'acknowledged' } : i);
    this.snackBar.open('Incident acknowledged', 'Close', { duration: 2000 });
  }

  handleResolve(id: string): void {
    this.incidents = this.incidents.map(i => i.id === id ? { ...i, status: 'resolved' } : i);
    this.snackBar.open('Incident resolved', 'Close', { duration: 2000 });
  }

  refreshTrip(): void {
    this.loadTrip();
    this.snackBar.open('Trip data refreshed', 'Close', { duration: 2000 });
  }

  toggleTripStatus(): void {
    if (!this.trip) return;
    const next = this.trip.status === 'en-route' ? 'on-site' : 'en-route';
    this.trip = { ...this.trip, status: next };
    this.addMessage('system', `Trip status changed to: ${next}`);
  }

  // ── Troubleshooting flow methods ──
  selectCategory(cat: { label:string; icon:string; color:string; action:string }): void {
    this.selectedCategory = cat;
    this.showModal = false;
    this.showDetailsModal = true;
    this.submitted = false;
    // Pre-fill from trip data and mock location
    this.form = {
      vehicleId: this.trip?.vehicleId || 'VH-TRK-007',
      country: this.mockLocation.country,
      contactNo: this.mockLocation.contactNo,
      address: this.mockLocation.address
    };
  }

  submitDetails(): void {
    this.submitted = true;
    if (!this.form.vehicleId || !this.form.country || !this.form.contactNo || !this.form.address) return;
    this.showDetailsModal = false;
    this.showDescribeModal = true;
    this.descSubmitted = false;
    this.issueDescription = '';
    this.voiceTranscript = '';
    this.uploadedImages = [];
    this.describeTab = 'text';
  }

  submitIssue(): void {
    this.descSubmitted = true;
    const hasContent = this.issueDescription.trim() || this.voiceTranscript.trim() || this.uploadedImages.length > 0;
    if (!hasContent) return;
    const description = this.issueDescription.trim() || this.voiceTranscript.trim() || 'Issue reported via image';
    this.showDescribeModal = false;
    this.showStepsModal = true;
    this.stepsLoading = true;
    this.issueResolved = false;
    this.aiConversation = [];
    this.aiInput = '';

    // Query KB with the issue description
    const query = `${this.selectedCategory?.label}: ${description}`;
    this.kbService.search(query, 5).subscribe(results => {
      let reply = '';
      if (results.length > 0) {
        const combined = results.map(r => r.content).join(' ');
        reply = this.extractRelevant(combined, query);
      }
      if (!reply) reply = this.getKbResponse(description);
      this.aiConversation = [{ role: 'agent', text: reply, time: new Date() }];
      this.stepsLoading = false;
      this.speakAndListen(reply);
    });
  }

  get currentStep() { return this.activeSteps[this.currentStepIdx] ?? null; }

  get stepsProgress(): number {
    if (!this.activeSteps.length) return 0;
    return (this.currentStepIdx / this.activeSteps.length) * 100;
  }

  stepResolved(): void { this.issueResolved = true; }

  aiSend(text: string): void {
    if (!text?.trim()) return;
    this.aiInput = '';
    this.aiListening = false;
    try { this.aiRecognition?.stop(); } catch {}
    this.aiConversation = [...this.aiConversation, { role: 'user', text: text.trim(), time: new Date() }];
    this.stepsLoading = true;
    const query = `${this.selectedCategory?.label}: ${text.trim()}`;
    this.kbService.search(query, 5).subscribe(results => {
      let reply = '';
      if (results.length > 0) {
        const combined = results.map(r => r.content).join(' ');
        reply = this.extractRelevant(combined, text.trim());
      }
      if (!reply) reply = this.getKbResponse(text.trim());
      this.aiConversation = [...this.aiConversation, { role: 'agent', text: reply, time: new Date() }];
      this.stepsLoading = false;
      this.speakAndListen(reply);
    });
  }

  toggleAiVoice(): void {
    if (this.aiListening) {
      this.aiListening = false;
      try { this.aiRecognition?.abort(); } catch {}
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const doStart = () => {
      try {
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = true;
        let final = '';
        rec.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += t;
            else interim += t;
          }
          this.aiInput = final || interim;
        };
        rec.onerror = () => { this.aiListening = false; };
        rec.onend = () => {
          this.aiListening = false;
          if (final.trim()) { this.aiSend(final.trim()); }
        };
        rec.start();
        this.aiRecognition = rec;
        this.aiListening = true;
      } catch { this.aiListening = false; }
    };
    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => doStart()).catch(() => doStart());
    } else { doStart(); }
  }

  private speakAndListen(text: string): void {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 1.0;
    utt.onend = () => {
      if (this.showStepsModal) setTimeout(() => this.toggleAiVoice(), 300);
    };
    window.speechSynthesis.speak(utt);
  }

  stepNotHelped(): void {
    this.completedSteps.push({ title: this.activeSteps[this.currentStepIdx].title });
    if (this.currentStepIdx < this.activeSteps.length - 1) this.currentStepIdx++;
    else this.currentStepIdx = this.activeSteps.length;
  }

  openRaiseTicket(): void {
    this.showStepsModal = false;
    this.showTicketModal = true;
    this.ticketSubmitted = false;
    this.ticket = {
      title: `${this.selectedCategory?.label} issue — ${this.form.vehicleId}`,
      priority: 'medium',
      description: this.issueDescription || `Issue reported for vehicle ${this.form.vehicleId}. All ${this.activeSteps.length} steps attempted.`
    };
  }

  submitTicket(): void {
    this.ticketSubmitted = true;
    if (!this.ticket.title) return;
    this.createdTicketId = 'TKT-' + Date.now().toString().slice(-6);
    this.ticketService.createTicket({
      title: this.ticket.title,
      description: this.ticket.description,
      priority: this.ticket.priority as any,
      category: this.selectedCategory?.action || '',
      cameraId: this.form.vehicleId,
      reportedBy: this.currentUser?.email || 'Driver',
      tags: [this.selectedCategory?.label || '']
    }, []).subscribe();
    this.showTicketModal = false;
    this.showTicketSuccess = true;
  }

  goToTickets(): void { this.closeAll(); this.router.navigate(['/tickets']); }

  closeAll(): void {
    this.showModal = false; this.showDetailsModal = false; this.showDescribeModal = false;
    this.showStepsModal = false; this.showTicketModal = false; this.showTicketSuccess = false;
    this.submitted = false; this.descSubmitted = false; this.ticketSubmitted = false;
    this.issueResolved = false;
    this.isListening = false;
    this.aiListening = false;
    try { this.recognition?.stop(); } catch {}
    try { this.aiRecognition?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }

  switchToVoice(): void {
    this.describeTab = 'voice';
    setTimeout(() => this.startVoice(), 300);
  }

  startVoice(): void {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported. Please use Chromium or Google Chrome.');
      return;
    }
    if (this.recognition) { try { this.recognition.abort(); } catch {} }
    this.voiceTranscript = '';

    const doStart = () => {
      try {
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        let finalText = '';
        rec.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t;
            else interim += t;
          }
          this.voiceTranscript = finalText || interim;
        };
        rec.onerror = (e: any) => {
          this.isListening = false;
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            alert('Microphone blocked.\nOn Linux server run Chromium with:\n--use-fake-ui-for-media-stream\nor access via HTTPS.');
          }
        };
        rec.onend = () => {
          this.isListening = false;
          if (finalText.trim()) this.voiceTranscript = finalText.trim();
        };
        rec.start();
        this.recognition = rec;
        this.isListening = true;
      } catch (err) {
        this.isListening = false;
        console.warn('Voice start failed:', err);
      }
    };

    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => doStart())
        .catch(() => doStart());
    } else {
      doStart();
    }
  }

  stopVoice(): void {
    this.isListening = false; // set first so onend doesn't restart
    try { this.recognition?.stop(); } catch {}
  }
  useTranscript(): void { this.issueDescription = this.voiceTranscript; this.describeTab = 'text'; }

  onFileChange(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (files) this.addFiles(Array.from(files));
  }
  onDrop(e: DragEvent): void { e.preventDefault(); if (e.dataTransfer?.files) this.addFiles(Array.from(e.dataTransfer.files)); }
  private addFiles(files: File[]): void {
    files.filter(f => f.type.startsWith('image/')).forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => this.uploadedImages.push({ url: ev.target!.result as string, name: f.name });
      reader.readAsDataURL(f);
    });
  }
  removeImage(i: number): void { this.uploadedImages.splice(i, 1); }

  private loadTrip(): void {
    this.trip = {
      tripId: 'TRIP-2024-0042',
      driverName: 'Alex Johnson',
      vehicleId: 'VH-TRK-007',
      status: 'en-route',
      startTime: new Date(Date.now() - 3600000),
      totalStops: 5,
      completedStops: 1,
      distanceKm: 142,
      fuelLevel: 68,
      speedKmh: 72,
      engineTemp: 88,
      stops: [
        { id: 1, address: '123 Main St, Downtown',  eta: '10:30 AM', status: 'completed' },
        { id: 2, address: '456 Oak Ave, Midtown',    eta: '11:15 AM', status: 'arrived', notes: 'Ring doorbell twice' },
        { id: 3, address: '789 Pine Rd, Uptown',     eta: '12:00 PM', status: 'pending' },
        { id: 4, address: '321 Elm Blvd, Westside',  eta: '01:30 PM', status: 'pending' },
        { id: 5, address: '654 Maple Dr, Northgate', eta: '02:45 PM', status: 'pending' }
      ]
    };
  }

  private addMessage(type: DriverMessage['type'], content: string, actions?: DriverMessage['actions']): void {
    this.messages = [...this.messages, {
      id: Date.now().toString(),
      type, content, timestamp: new Date(), actions
    }];
  }
}
