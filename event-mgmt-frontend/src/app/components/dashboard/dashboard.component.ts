import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TroubleshootingAgentService } from '../streetview-troubleshoot/services/troubleshooting-agent.service';
import { TicketService } from '../streetview-troubleshoot/services/ticket.service';
import { CameraStatus, Ticket } from '../streetview-troubleshoot/models/troubleshooting.models';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';
import { FormsModule } from '@angular/forms';

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  trendVal: string;
  color: string;
}

interface Activity {
  icon: string;
  iconColor: string;
  title: string;
  desc: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard">

      <!-- Top bar -->
      <div class="topbar">
        <div class="greeting">
          <h1>Good {{timeOfDay}}, {{firstName}} 👋</h1>
          <p>Here's what's happening with your Street View cameras today.</p>
        </div>

      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div *ngFor="let s of stats" class="stat-card" [style.--accent]="s.color">
          <div class="stat-top">
            <div class="stat-icon" [style.background]="s.color + '22'">
              <span class="material-icons" [style.color]="s.color">{{s.icon}}</span>
            </div>
            <div class="trend" [class.up]="s.trend==='up'" [class.down]="s.trend==='down'">
              <span class="material-icons">{{s.trend === 'up' ? 'trending_up' : s.trend === 'down' ? 'trending_down' : 'remove'}}</span>
              {{s.trendVal}}
            </div>
          </div>
          <div class="stat-val">{{s.value}}</div>
          <div class="stat-label">{{s.label}}</div>
          <div class="stat-sub">{{s.sub}}</div>
        </div>
      </div>

      <!-- Analytics row 1: Resolution Rate, Avg Response Time, Auto Resolution -->
      <div class="analytics-row">

        <div class="an-card">
          <div class="an-icon-wrap" style="background:#e6f4ea">
            <span class="material-icons" style="color:#34a853">verified</span>
          </div>
          <div class="an-body">
            <div class="an-val">{{resolutionRate}}%</div>
            <div class="an-label">Resolution Rate</div>
            <div class="an-sub">{{resolvedCount}} of {{totalTickets}} tickets resolved</div>
            <div class="an-bar"><div class="an-fill" [style.width.%]="resolutionRate" style="background:#34a853"></div></div>
          </div>
        </div>

        <div class="an-card">
          <div class="an-icon-wrap" style="background:#e8f0fe">
            <span class="material-icons" style="color:#1a73e8">timer</span>
          </div>
          <div class="an-body">
            <div class="an-val">{{avgResponseTime}}</div>
            <div class="an-label">Avg Response Time</div>
            <div class="an-sub">From open to in-progress</div>
            <div class="an-trend" [class.up]="avgResponseTrend==='up'" [class.down]="avgResponseTrend==='down'">
              <span class="material-icons">{{avgResponseTrend==='up' ? 'trending_up' : avgResponseTrend==='down' ? 'trending_down' : 'remove'}}</span>
              {{avgResponseTrend==='up' ? 'Faster than last week' : avgResponseTrend==='down' ? 'Slower than last week' : 'No change'}}
            </div>
          </div>
        </div>

        <div class="an-card">
          <div class="an-icon-wrap" style="background:#fef7e0">
            <span class="material-icons" style="color:#f9ab00">auto_fix_high</span>
          </div>
          <div class="an-body">
            <div class="an-val">{{autoResolutionRate}}%</div>
            <div class="an-label">Auto Resolution</div>
            <div class="an-sub">Issues resolved without ticket</div>
            <div class="an-bar"><div class="an-fill" [style.width.%]="autoResolutionRate" style="background:#fbbc04"></div></div>
          </div>
        </div>

      </div>

      <!-- Analytics row 2: Issues by Category + Priority Distribution -->
      <div class="analytics-row-2">

        <!-- Issues by Category -->
        <div class="card">
          <div class="card-header">
            <span class="card-title"><span class="material-icons">donut_large</span> Issues by Category</span>
          </div>
          <div class="cat-chart">
            <div *ngFor="let c of categoryStats" class="cat-row">
              <div class="cat-row-label">
                <div class="cat-dot" [style.background]="c.color"></div>
                <span>{{c.label}}</span>
              </div>
              <div class="cat-bar-wrap">
                <div class="cat-bar">
                  <div class="cat-fill" [style.width.%]="c.pct" [style.background]="c.color"></div>
                </div>
                <span class="cat-count">{{c.count}}</span>
              </div>
            </div>
            <div class="cat-empty" *ngIf="categoryStats.length===0">
              <span class="material-icons">bar_chart</span>
              <p>No ticket data yet</p>
            </div>
          </div>
        </div>

        <!-- Priority Distribution -->
        <div class="card">
          <div class="card-header">
            <span class="card-title"><span class="material-icons">flag</span> Priority Distribution</span>
          </div>
          <div class="priority-chart">
            <!-- Stacked bar -->
            <div class="stacked-bar" *ngIf="totalTickets>0">
              <div *ngFor="let p of priorityStats"
                   class="stacked-seg"
                   [style.width.%]="p.pct"
                   [style.background]="p.color"
                   [title]="p.label+': '+p.count"></div>
            </div>
            <div class="priority-legend">
              <div *ngFor="let p of priorityStats" class="pl-item">
                <div class="pl-dot" [style.background]="p.color"></div>
                <div class="pl-info">
                  <div class="pl-label">{{p.label}}</div>
                  <div class="pl-count">{{p.count}} tickets</div>
                </div>
                <div class="pl-pct">{{p.pct | number:'1.0-0'}}%</div>
              </div>
            </div>
            <!-- Status breakdown -->
            <div class="status-breakdown">
              <div class="sb-label">By Status</div>
              <div class="sb-row">
                <div *ngFor="let s of statusStats" class="sb-item">
                  <div class="sb-val" [style.color]="s.color">{{s.count}}</div>
                  <div class="sb-name">{{s.label}}</div>
                  <div class="sb-dot" [style.background]="s.color"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Camera health -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">videocam</span> Camera Health
            </span>
            <button class="ghost-btn" (click)="refreshStatus()">
              <span class="material-icons">refresh</span>
            </button>
          </div>
          <div class="camera-health" *ngIf="cameraStatus">
            <div class="health-hero">
              <div class="health-ring" [class.online]="cameraStatus.online">
                <span class="material-icons">{{cameraStatus.online ? 'videocam' : 'videocam_off'}}</span>
              </div>
              <div>
                <div class="health-status" [class.online]="cameraStatus.online">
                  {{cameraStatus.online ? 'Online' : 'Offline'}}
                </div>
                <div class="health-id">{{cameraStatus.cameraId}}</div>
                <div class="health-ping">Last ping: {{cameraStatus.lastPing | date:'h:mm:ss a'}}</div>
              </div>
            </div>

            <div class="metrics-list">
              <div class="metric-row" *ngFor="let m of getMetrics()">
                <div class="metric-label">
                  <span class="material-icons">{{m.icon}}</span>{{m.label}}
                </div>
                <div class="metric-right">
                  <div class="metric-bar">
                    <div class="metric-fill" [style.width.%]="m.pct" [style.background]="m.color"></div>
                  </div>
                  <span class="metric-val" [style.color]="m.color">{{m.val}}</span>
                </div>
              </div>
            </div>

            <div class="gps-row">
              <span class="material-icons">gps_fixed</span>
              GPS Signal:
              <span class="gps-badge" [class]="'gps-'+cameraStatus.gpsSignal">
                {{cameraStatus.gpsSignal | uppercase}}
              </span>
            </div>
          </div>
          <div class="loading-state" *ngIf="!cameraStatus">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- Recent tickets -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">confirmation_number</span> Recent Tickets
            </span>
            <a routerLink="/troubleshoot" class="view-all">View all</a>
          </div>
          <div class="empty-mini" *ngIf="recentTickets.length === 0">
            <span class="material-icons">inbox</span>
            <p>No tickets yet</p>
            <a routerLink="/troubleshoot" class="mini-link">Start troubleshooting →</a>
          </div>
          <div class="ticket-mini-list" *ngIf="recentTickets.length > 0">
            <div *ngFor="let t of recentTickets" class="ticket-mini" [class]="'p-'+t.priority">
              <div class="tm-left">
                <div class="tm-title">{{t.title}}</div>
                <div class="tm-meta">
                  <span class="tm-id">{{t.id}}</span>
                  <span class="tm-cat">{{t.category}}</span>
                </div>
              </div>
              <div class="tm-right">
                <span class="status-dot-badge" [class]="'s-'+t.status">{{t.status}}</span>
                <span class="tm-time">{{t.createdAt | date:'MMM d'}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">bolt</span> Quick Actions
            </span>
          </div>
          <div class="actions-grid">
            <a *ngFor="let a of quickActions" [routerLink]="a.route" class="action-tile">
              <div class="action-icon" [style.background]="a.color + '22'">
                <span class="material-icons" [style.color]="a.color">{{a.icon}}</span>
              </div>
              <div class="action-label">{{a.label}}</div>
              <div class="action-desc">{{a.desc}}</div>
            </a>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card activity-card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">history</span> Recent Activity
            </span>
          </div>
          <div class="activity-list">
            <div *ngFor="let a of activities; let last = last" class="activity-item">
              <div class="activity-line" *ngIf="!last"></div>
              <div class="activity-dot" [style.background]="a.iconColor">
                <span class="material-icons">{{a.icon}}</span>
              </div>
              <div class="activity-body">
                <div class="activity-title">{{a.title}}</div>
                <div class="activity-desc">{{a.desc}}</div>
                <div class="activity-time">{{a.time}}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Step 1: Category Modal -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeAll()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div class="modal-title"><span class="material-icons">build_circle</span> Select Category</div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Choose the issue category to begin AI-guided troubleshooting</p>
        <div class="cat-grid">
          <button *ngFor="let c of categories" class="cat-card" (click)="selectCategory(c)">
            <div class="cat-icon" [style.background]="c.color+'18'">
              <span class="material-icons" [style.color]="c.color">{{c.icon}}</span>
            </div>
            <div class="cat-name">{{c.label}}</div>
            <div class="cat-desc">{{c.desc}}</div>
            <span class="material-icons cat-arrow">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Vehicle & Contact Details Modal -->
    <div class="modal-backdrop" *ngIf="showDetailsModal" (click)="closeAll()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <button class="back-btn" (click)="showDetailsModal=false; showModal=true">
            <span class="material-icons">arrow_back</span>
          </button>
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'">
              <span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span>
            </div>
            Vehicle &amp; Contact Details
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Provide details for <strong>{{selectedCategory?.label}}</strong> troubleshooting</p>

        <form class="details-form" (ngSubmit)="submitDetails()">
          <!-- Vehicle ID -->
          <div class="field-group">
            <label>Vehicle ID <span class="req">*</span></label>
            <div class="input-wrap" [class.err]="submitted && !form.vehicleId">
              <span class="material-icons fi">directions_car</span>
              <input type="text" [(ngModel)]="form.vehicleId" name="vehicleId" placeholder="e.g. VH-TRK-007">
            </div>
            <span class="field-err" *ngIf="submitted && !form.vehicleId">Vehicle ID is required</span>
          </div>

          <!-- Country -->
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

          <!-- Contact No -->
          <div class="field-group">
            <label>Contact Number <span class="req">*</span></label>
            <div class="input-wrap" [class.err]="submitted && !form.contactNo">
              <span class="material-icons fi">phone</span>
              <input type="tel" [(ngModel)]="form.contactNo" name="contactNo" placeholder="e.g. +1 555 000 0000">
            </div>
            <span class="field-err" *ngIf="submitted && !form.contactNo">Contact number is required</span>
          </div>

          <!-- Address -->
          <div class="field-group">
            <label>Complete Address <span class="req">*</span></label>
            <div class="textarea-wrap" [class.err]="submitted && !form.address">
              <span class="material-icons fi ta-icon">location_on</span>
              <textarea [(ngModel)]="form.address" name="address" rows="3"
                        placeholder="Street, City, State, ZIP"></textarea>
            </div>
            <span class="field-err" *ngIf="submitted && !form.address">Address is required</span>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="showDetailsModal=false; showModal=true">Back</button>
            <button type="submit" class="btn-primary">
              <span class="material-icons">arrow_forward</span>
              Next: Describe Issue
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Step 3: Describe Issue Modal -->
    <div class="modal-backdrop" *ngIf="showDescribeModal" (click)="closeAll()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-head">
          <button class="back-btn" (click)="showDescribeModal=false; showDetailsModal=true">
            <span class="material-icons">arrow_back</span>
          </button>
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'">
              <span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span>
            </div>
            Describe the Issue
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>
        <p class="modal-sub">Tell us what's happening with <strong>{{selectedCategory?.label}}</strong></p>

        <!-- Step indicator -->
        <div class="steps-bar">
          <div class="step done"><span class="material-icons">check_circle</span> Category</div>
          <div class="step-line"></div>
          <div class="step done"><span class="material-icons">check_circle</span> Details</div>
          <div class="step-line"></div>
          <div class="step active"><span class="step-num">3</span> Describe</div>
        </div>

        <!-- Input methods tabs -->
        <div class="input-tabs">
          <button class="itab" [class.active]="describeTab==='text'"   (click)="describeTab='text'">
            <span class="material-icons">edit_note</span> Type
          </button>
          <button class="itab" [class.active]="describeTab==='voice'"  (click)="describeTab='voice'; startVoice()">
            <span class="material-icons">mic</span> Voice
          </button>
          <button class="itab" [class.active]="describeTab==='image'"  (click)="describeTab='image'">
            <span class="material-icons">add_photo_alternate</span> Image
          </button>
        </div>

        <!-- TYPE tab -->
        <div *ngIf="describeTab==='text'" class="describe-body">
          <div class="textarea-wrap" [class.err]="descSubmitted && !issueDescription">
            <span class="material-icons fi ta-icon">description</span>
            <textarea [(ngModel)]="issueDescription" name="issueDescription" rows="5"
                      placeholder="Describe the issue in detail — what happened, when it started, any error messages..."></textarea>
          </div>
          <span class="field-err" *ngIf="descSubmitted && !issueDescription">Please describe the issue</span>
          <div class="char-count">{{issueDescription.length}} / 1000</div>
        </div>

        <!-- VOICE tab -->
        <div *ngIf="describeTab==='voice'" class="describe-body voice-body">
          <div class="voice-ring" [class.listening]="isListening">
            <span class="material-icons">{{isListening ? 'mic' : 'mic_none'}}</span>
          </div>
          <p class="voice-status">{{isListening ? 'Listening... speak now' : voiceTranscript ? 'Recording complete' : 'Click the mic to start'}}</p>
          <div class="voice-transcript" *ngIf="voiceTranscript">
            <span class="material-icons">format_quote</span>
            {{voiceTranscript}}
          </div>
          <div class="voice-actions">
            <button class="btn-outline" *ngIf="!isListening" (click)="startVoice()">
              <span class="material-icons">mic</span> {{voiceTranscript ? 'Re-record' : 'Start Recording'}}
            </button>
            <button class="btn-danger" *ngIf="isListening" (click)="stopVoice()">
              <span class="material-icons">stop</span> Stop
            </button>
            <button class="btn-outline" *ngIf="voiceTranscript" (click)="useTranscript()">
              <span class="material-icons">check</span> Use This
            </button>
          </div>
        </div>

        <!-- IMAGE tab -->
        <div *ngIf="describeTab==='image'" class="describe-body image-body">
          <div class="drop-zone" [class.has-image]="uploadedImages.length>0"
               (click)="fileInput.click()"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)">
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
              <div class="img-add" (click)="fileInput.click()">
                <span class="material-icons">add</span>
              </div>
            </div>
          </div>
          <div class="textarea-wrap img-note-wrap" style="margin-top:12px">
            <span class="material-icons fi ta-icon">edit_note</span>
            <textarea [(ngModel)]="issueDescription" name="imgNote" rows="2"
                      placeholder="Add a note about the images (optional)"></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions" style="margin-top:20px">
          <button class="btn-outline" (click)="showDescribeModal=false; showDetailsModal=true">Back</button>
          <button class="btn-primary" (click)="submitIssue()">
            <span class="material-icons">send</span>
            Start Troubleshooting
          </button>
        </div>
      </div>
    </div>

    <!-- Step 4: Troubleshooting Steps -->
    <div class="modal-backdrop" *ngIf="showStepsModal" (click)="$event.stopPropagation()">
      <div class="modal-box steps-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-head">
          <div class="modal-title">
            <div class="cat-badge" [style.background]="selectedCategory?.color+'18'">
              <span class="material-icons" [style.color]="selectedCategory?.color">{{selectedCategory?.icon}}</span>
            </div>
            Troubleshooting Steps
          </div>
          <button class="close-btn" (click)="closeAll()"><span class="material-icons">close</span></button>
        </div>

        <!-- Progress bar -->
        <div class="ts-progress-wrap">
          <div class="ts-progress-bar">
            <div class="ts-progress-fill" [style.width.%]="stepsProgress"></div>
          </div>
          <span class="ts-progress-label">Step {{currentStepIdx+1}} of {{activeSteps.length}}</span>
        </div>

        <!-- Loading state -->
        <div class="ts-loading" *ngIf="stepsLoading">
          <div class="spinner"></div>
          <p>Analysing issue and generating steps...</p>
        </div>

        <!-- Current step card -->
        <ng-container *ngIf="!stepsLoading && currentStep">
          <div class="ts-step-card">
            <div class="ts-step-num" [style.background]="selectedCategory?.color+'18'" [style.color]="selectedCategory?.color">
              {{currentStepIdx + 1}}
            </div>
            <div class="ts-step-body">
              <div class="ts-step-title">{{currentStep.title}}</div>
              <div class="ts-step-desc">{{currentStep.desc}}</div>
              <div class="ts-step-tip" *ngIf="currentStep.tip">
                <span class="material-icons">lightbulb</span> {{currentStep.tip}}
              </div>
            </div>
          </div>

          <!-- Did this help? -->
          <div class="ts-question">
            <p class="ts-q-label">Did this step resolve the issue?</p>
            <div class="ts-q-actions">
              <button class="btn-success" (click)="stepResolved()">
                <span class="material-icons">check_circle</span> Yes, Issue Resolved!
              </button>
              <button class="btn-outline" (click)="stepNotHelped()">
                <span class="material-icons">arrow_forward</span>
                {{currentStepIdx < activeSteps.length-1 ? 'No, Try Next Step' : 'No, Still Not Resolved'}}
              </button>
            </div>
          </div>

          <!-- Completed steps mini list -->
          <div class="ts-done-list" *ngIf="completedSteps.length > 0">
            <div class="ts-done-label">Tried so far:</div>
            <div *ngFor="let s of completedSteps" class="ts-done-item">
              <span class="material-icons">remove_done</span> {{s.title}}
            </div>
          </div>
        </ng-container>

        <!-- All steps exhausted -->
        <div class="ts-exhausted" *ngIf="!stepsLoading && !currentStep && !issueResolved">
          <span class="material-icons">sentiment_dissatisfied</span>
          <h3>Issue Not Resolved</h3>
          <p>We've gone through all {{activeSteps.length}} troubleshooting steps and the issue persists. Let's raise a support ticket.</p>
          <button class="btn-primary" (click)="openRaiseTicket()">
            <span class="material-icons">confirmation_number</span>
            Raise a Ticket
          </button>
        </div>

        <!-- Issue resolved celebration -->
        <div class="ts-resolved" *ngIf="issueResolved">
          <span class="material-icons">celebration</span>
          <h3>Issue Resolved! 🎉</h3>
          <p>Great! The issue with <strong>{{selectedCategory?.label}}</strong> has been resolved.</p>
          <button class="btn-success" (click)="closeAll()">
            <span class="material-icons">check</span> Close
          </button>
        </div>

      </div>
    </div>

    <!-- Step 5: Raise Ticket -->
    <div class="modal-backdrop" *ngIf="showTicketModal" (click)="$event.stopPropagation()">
      <div class="modal-box details-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <button class="back-btn" (click)="showTicketModal=false; showStepsModal=true">
            <span class="material-icons">arrow_back</span>
          </button>
          <div class="modal-title">
            <span class="material-icons" style="color:#ea4335">confirmation_number</span>
            Raise Support Ticket
          </div>
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
            <label>Priority <span class="req">*</span></label>
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
              <textarea [(ngModel)]="ticket.description" name="tDesc" rows="4"
                        placeholder="Full description of the issue and steps already tried..."></textarea>
            </div>
          </div>

          <div class="ticket-meta-row">
            <div class="ticket-meta-item">
              <span class="material-icons">directions_car</span> {{form.vehicleId}}
            </div>
            <div class="ticket-meta-item">
              <span class="material-icons">public</span> {{form.country}}
            </div>
            <div class="ticket-meta-item">
              <span class="material-icons">phone</span> {{form.contactNo}}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="showTicketModal=false; showStepsModal=true">Back</button>
            <button type="submit" class="btn-primary">
              <span class="material-icons">send</span>
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Ticket Submitted Success -->
    <div class="modal-backdrop" *ngIf="showTicketSuccess" (click)="$event.stopPropagation()">
      <div class="modal-box success-box" (click)="$event.stopPropagation()">
        <span class="material-icons success-icon">check_circle</span>
        <h3>Ticket Raised Successfully!</h3>
        <p>Your support ticket <strong>{{createdTicketId}}</strong> has been created.</p>
        <p class="success-sub">Our team will contact you at <strong>{{form.contactNo}}</strong> shortly.</p>
        <div class="success-actions">
          <button class="btn-outline" (click)="closeAll()">Close</button>
          <button class="btn-primary" (click)="goToTickets()">
            <span class="material-icons">confirmation_number</span> View Tickets
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding:24px 28px; height:100%; overflow-y:auto; background:#f8f9fa; font-family:'Google Sans','Roboto',sans-serif; }
    .dashboard::-webkit-scrollbar { width:8px; }
    .dashboard::-webkit-scrollbar-track { background:#f1f3f4; border-radius:4px; }
    .dashboard::-webkit-scrollbar-thumb { background:#bdc1c6; border-radius:4px; }
    .dashboard::-webkit-scrollbar-thumb:hover { background:#80868b; }

    .topbar { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .greeting h1 { font-size:22px; font-weight:500; color:#202124; margin:0 0 4px; }
    .greeting p { font-size:14px; color:#5f6368; margin:0; }
    .primary-btn {
      display:flex; align-items:center; gap:8px; padding:9px 20px; border-radius:4px;
      background:#1a73e8; color:#fff; font-size:14px; font-weight:500;
      text-decoration:none; transition:background 0.15s, box-shadow 0.15s; font-family:inherit;
    }
    .primary-btn:hover { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .primary-btn .material-icons { font-size:18px; }

    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    .stat-card {
      background:#fff; border:1px solid #dadce0; border-radius:8px; padding:18px;
      transition:box-shadow 0.2s; box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .stat-card:hover { box-shadow:0 2px 8px rgba(60,64,67,.15); }
    .stat-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .stat-icon { width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .stat-icon .material-icons { font-size:22px; }
    .trend { display:flex; align-items:center; gap:3px; font-size:12px; font-weight:500; color:#5f6368; }
    .trend .material-icons { font-size:14px; }
    .trend.up { color:#34a853; } .trend.down { color:#ea4335; }
    .stat-val { font-size:26px; font-weight:500; color:#202124; margin-bottom:2px; }
    .stat-label { font-size:13px; font-weight:500; color:#5f6368; margin-bottom:2px; }
    .stat-sub { font-size:11px; color:#80868b; }

    .main-grid { display:grid; grid-template-columns:1fr 1fr; grid-template-rows:auto auto; gap:16px; }
    .card { background:#fff; border:1px solid #dadce0; border-radius:8px; padding:20px; box-shadow:0 1px 2px rgba(60,64,67,.06); }
    .activity-card { grid-column:1/-1; }
    .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:500; color:#202124; }
    .card-title .material-icons { font-size:18px; color:#1a73e8; }
    .ghost-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; }
    .ghost-btn:hover { color:#1a73e8; background:#e8f0fe; }
    .ghost-btn .material-icons { font-size:18px; }
    .view-all { font-size:13px; color:#1a73e8; text-decoration:none; font-weight:500; }
    .view-all:hover { color:#1557b0; text-decoration:underline; }

    .health-hero { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
    .health-ring { width:56px; height:56px; border-radius:50%; background:#fce8e6; border:2px solid #ea4335; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .health-ring.online { background:#e6f4ea; border-color:#34a853; }
    .health-ring .material-icons { font-size:26px; color:#ea4335; }
    .health-ring.online .material-icons { color:#34a853; }
    .health-status { font-size:16px; font-weight:500; color:#ea4335; }
    .health-status.online { color:#34a853; }
    .health-id { font-size:13px; color:#5f6368; font-family:'Roboto Mono',monospace; }
    .health-ping { font-size:12px; color:#80868b; margin-top:2px; }

    .metrics-list { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
    .metric-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .metric-label { display:flex; align-items:center; gap:6px; font-size:12px; color:#5f6368; min-width:110px; }
    .metric-label .material-icons { font-size:14px; }
    .metric-right { display:flex; align-items:center; gap:8px; flex:1; }
    .metric-bar { flex:1; height:4px; background:#f1f3f4; border-radius:2px; overflow:hidden; }
    .metric-fill { height:100%; border-radius:2px; transition:width 0.5s ease; }
    .metric-val { font-size:12px; font-weight:500; min-width:36px; text-align:right; color:#202124; }

    .gps-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#5f6368; }
    .gps-row .material-icons { font-size:16px; color:#1a73e8; }
    .gps-badge { padding:2px 10px; border-radius:12px; font-size:11px; font-weight:700; }
    .gps-excellent,.gps-good { background:#e6f4ea; color:#137333; }
    .gps-weak { background:#fef7e0; color:#b06000; }
    .gps-none { background:#fce8e6; color:#c5221f; }

    .empty-mini { text-align:center; padding:32px 16px; color:#9aa0a6; }
    .empty-mini .material-icons { font-size:36px; display:block; margin:0 auto 8px; color:#dadce0; }
    .empty-mini p { margin:0 0 10px; font-size:13px; color:#5f6368; }
    .mini-link { font-size:13px; color:#1a73e8; text-decoration:none; }

    .ticket-mini-list { display:flex; flex-direction:column; gap:8px; }
    .ticket-mini { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:4px; background:#f8f9fa; border-left:3px solid #dadce0; transition:background 0.15s; }
    .ticket-mini:hover { background:#f1f3f4; }
    .ticket-mini.p-low { border-left-color:#34a853; } .ticket-mini.p-medium { border-left-color:#fbbc04; }
    .ticket-mini.p-high { border-left-color:#ea4335; } .ticket-mini.p-critical { border-left-color:#9334e6; }
    .tm-left { flex:1; overflow:hidden; }
    .tm-title { font-size:13px; font-weight:500; color:#202124; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .tm-meta { display:flex; gap:8px; margin-top:3px; }
    .tm-id { font-size:11px; color:#80868b; font-family:'Roboto Mono',monospace; }
    .tm-cat { font-size:11px; color:#5f6368; }
    .tm-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; margin-left:12px; }
    .status-dot-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; text-transform:uppercase; }
    .s-open { background:#e8f0fe; color:#1a73e8; } .s-in-progress { background:#fef7e0; color:#b06000; }
    .s-resolved { background:#e6f4ea; color:#137333; } .s-closed { background:#f1f3f4; color:#5f6368; }
    .tm-time { font-size:11px; color:#80868b; }

    .actions-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .action-tile { display:flex; flex-direction:column; gap:8px; padding:14px; border-radius:8px; background:#f8f9fa; border:1px solid #dadce0; text-decoration:none; transition:all 0.15s; cursor:pointer; }
    .action-tile:hover { border-color:#1a73e8; background:#e8f0fe; box-shadow:0 1px 3px rgba(0,0,0,.1); }
    .action-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .action-icon .material-icons { font-size:20px; }
    .action-label { font-size:13px; font-weight:500; color:#202124; }
    .action-desc { font-size:11px; color:#5f6368; }

    .activity-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
    .activity-item { display:flex; gap:12px; }
    .activity-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .activity-dot .material-icons { font-size:16px; color:#fff; }
    .activity-body { flex:1; }
    .activity-title { font-size:13px; font-weight:500; color:#202124; margin-bottom:2px; }
    .activity-desc { font-size:12px; color:#5f6368; margin-bottom:4px; }
    .activity-time { font-size:11px; color:#80868b; }

    .loading-state { display:flex; justify-content:center; padding:40px; }
    .spinner { width:32px; height:32px; border-radius:50%; border:3px solid #dadce0; border-top-color:#1a73e8; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    @media (max-width:1100px) { .stats-grid { grid-template-columns:repeat(2,1fr); } .main-grid { grid-template-columns:1fr; } .activity-card { grid-column:1; } }

    /* Analytics Row 1 — 3 metric cards */
    .analytics-row {
      display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:16px;
    }
    .an-card {
      background:#fff; border:1px solid #dadce0; border-radius:8px; padding:18px;
      display:flex; align-items:flex-start; gap:14px;
      box-shadow:0 1px 2px rgba(60,64,67,.06); transition:box-shadow 0.2s;
    }
    .an-card:hover { box-shadow:0 2px 8px rgba(60,64,67,.15); }
    .an-icon-wrap {
      width:44px; height:44px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .an-icon-wrap .material-icons { font-size:24px; }
    .an-body { flex:1; }
    .an-val   { font-size:28px; font-weight:500; color:#202124; margin-bottom:2px; line-height:1; }
    .an-label { font-size:13px; font-weight:500; color:#5f6368; margin-bottom:2px; }
    .an-sub   { font-size:11px; color:#80868b; margin-bottom:8px; }
    .an-bar   { height:4px; background:#f1f3f4; border-radius:2px; overflow:hidden; }
    .an-fill  { height:100%; border-radius:2px; transition:width 0.6s ease; }
    .an-trend { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:500; color:#5f6368; }
    .an-trend .material-icons { font-size:14px; }
    .an-trend.up   { color:#34a853; }
    .an-trend.down { color:#ea4335; }

    /* Analytics Row 2 — 2 chart cards */
    .analytics-row-2 {
      display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;
    }

    /* Issues by Category */
    .cat-chart { display:flex; flex-direction:column; gap:10px; }
    .cat-row { display:flex; align-items:center; gap:10px; }
    .cat-row-label { display:flex; align-items:center; gap:8px; min-width:130px; font-size:13px; color:#202124; }
    .cat-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .cat-bar-wrap { display:flex; align-items:center; gap:8px; flex:1; }
    .cat-bar { flex:1; height:8px; background:#f1f3f4; border-radius:4px; overflow:hidden; }
    .cat-fill { height:100%; border-radius:4px; transition:width 0.6s ease; }
    .cat-count { font-size:12px; font-weight:600; color:#5f6368; min-width:20px; text-align:right; }
    .cat-empty { text-align:center; padding:32px; color:#9aa0a6; }
    .cat-empty .material-icons { font-size:32px; display:block; margin:0 auto 8px; color:#dadce0; }
    .cat-empty p { margin:0; font-size:13px; }

    /* Priority Distribution */
    .priority-chart { display:flex; flex-direction:column; gap:16px; }
    .stacked-bar { display:flex; height:12px; border-radius:6px; overflow:hidden; gap:2px; }
    .stacked-seg { height:100%; transition:width 0.6s ease; border-radius:2px; }
    .priority-legend { display:flex; flex-direction:column; gap:8px; }
    .pl-item { display:flex; align-items:center; gap:10px; }
    .pl-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .pl-info { flex:1; }
    .pl-label { font-size:13px; color:#202124; font-weight:500; }
    .pl-count { font-size:11px; color:#80868b; }
    .pl-pct   { font-size:13px; font-weight:600; color:#5f6368; min-width:36px; text-align:right; }
    .status-breakdown { border-top:1px solid #f1f3f4; padding-top:12px; }
    .sb-label { font-size:11px; font-weight:700; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; }
    .sb-row   { display:flex; gap:0; }
    .sb-item  { flex:1; text-align:center; }
    .sb-val   { font-size:20px; font-weight:500; margin-bottom:2px; }
    .sb-name  { font-size:11px; color:#5f6368; margin-bottom:4px; }
    .sb-dot   { width:8px; height:8px; border-radius:50%; margin:0 auto; }

    @media (max-width:1100px) { .analytics-row { grid-template-columns:1fr; } .analytics-row-2 { grid-template-columns:1fr; } }

    /* Modal */
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(32,33,36,.5);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; animation:bdin 0.15s ease;
    }
    @keyframes bdin { from{opacity:0} to{opacity:1} }
    .modal-box {
      background:#fff; border-radius:12px; padding:28px;
      width:660px; max-width:95vw; max-height:90vh; overflow-y:auto;
      box-shadow:0 8px 32px rgba(60,64,67,.3);
      animation:mup 0.2s ease;
    }
    @keyframes mup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .modal-title { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:500; color:#202124; font-family:'Google Sans',sans-serif; }
    .modal-title .material-icons { color:#1a73e8; font-size:22px; }
    .close-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; }
    .close-btn:hover { background:#f1f3f4; color:#202124; }
    .close-btn .material-icons { font-size:20px; }
    .modal-sub { font-size:14px; color:#5f6368; margin:0 0 20px; }
    .cat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .cat-card {
      display:flex; flex-direction:column; gap:6px; padding:16px 16px 14px;
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      cursor:pointer; text-align:left; transition:all 0.15s;
      box-shadow:0 1px 2px rgba(60,64,67,.06); position:relative;
      font-family:'Google Sans',sans-serif;
    }
    .cat-card:hover { border-color:#1a73e8; box-shadow:0 2px 8px rgba(26,115,232,.15); transform:translateY(-1px); }
    .cat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:4px; flex-shrink:0; }
    .cat-icon .material-icons { font-size:24px; }
    .cat-name { font-size:14px; font-weight:500; color:#202124; }
    .cat-desc { font-size:12px; color:#5f6368; line-height:1.4; padding-right:20px; }
    .cat-arrow { position:absolute; bottom:14px; right:12px; font-size:16px !important; color:#dadce0; transition:color 0.15s; }
    .cat-card:hover .cat-arrow { color:#1a73e8; }

    /* Details modal */
    .details-box { width:520px; }
    .back-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; margin-right:4px; }
    .back-btn:hover { background:#f1f3f4; color:#202124; }
    .back-btn .material-icons { font-size:20px; }
    .cat-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:8px; flex-shrink:0; }
    .cat-badge .material-icons { font-size:18px; }
    .modal-sub strong { color:#202124; }

    .details-form { display:flex; flex-direction:column; gap:18px; }
    .field-group { display:flex; flex-direction:column; gap:5px; }
    label { font-size:13px; font-weight:500; color:#5f6368; }
    .req { color:#ea4335; }
    .input-wrap, .select-wrap, .textarea-wrap {
      display:flex; align-items:center;
      background:#fff; border:1px solid #dadce0; border-radius:4px;
      transition:border-color 0.15s, box-shadow 0.15s;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .input-wrap:focus-within, .select-wrap:focus-within, .textarea-wrap:focus-within {
      border-color:#1a73e8; box-shadow:0 0 0 2px #e8f0fe;
    }
    .input-wrap.err, .select-wrap.err, .textarea-wrap.err { border-color:#ea4335; }
    .fi { color:#9aa0a6; font-size:18px; padding:0 10px; flex-shrink:0; }
    .ta-icon { align-self:flex-start; padding-top:10px; }
    .input-wrap input, .textarea-wrap textarea {
      flex:1; border:none; outline:none; background:transparent;
      color:#202124; font-size:14px; padding:11px 10px 11px 0;
      font-family:'Google Sans','Roboto',sans-serif; resize:none;
    }
    .input-wrap input::placeholder, .textarea-wrap textarea::placeholder { color:#9aa0a6; }
    .select-wrap { position:relative; }
    .select-wrap select {
      flex:1; border:none; outline:none; background:transparent;
      color:#202124; font-size:14px; padding:11px 32px 11px 0;
      font-family:'Google Sans','Roboto',sans-serif;
      appearance:none; cursor:pointer;
    }
    .sa { position:absolute; right:8px; color:#5f6368; font-size:18px; pointer-events:none; }
    .field-err { font-size:12px; color:#ea4335; }

    .form-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }
    .btn-outline {
      padding:9px 20px; border-radius:4px; border:1px solid #dadce0;
      background:#fff; color:#1a73e8; font-size:14px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit;
    }
    .btn-outline:hover { background:#e8f0fe; border-color:#1a73e8; }
    .btn-primary {
      display:flex; align-items:center; gap:6px;
      padding:9px 20px; border-radius:4px; border:none;
      background:#1a73e8; color:#fff; font-size:14px; font-weight:500;
      cursor:pointer; transition:background 0.15s, box-shadow 0.15s; font-family:inherit;
    }
    .btn-primary:hover { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .btn-primary .material-icons { font-size:16px; }

    /* Step 3 — Describe Issue */
    .steps-bar {
      display:flex; align-items:center; gap:0; margin-bottom:20px;
      background:#f8f9fa; border-radius:8px; padding:10px 16px;
    }
    .step { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:#9aa0a6; white-space:nowrap; }
    .step.done { color:#34a853; }
    .step.done .material-icons { font-size:16px; }
    .step.active { color:#1a73e8; }
    .step-num { width:18px; height:18px; border-radius:50%; background:#1a73e8; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .step-line { flex:1; height:2px; background:#dadce0; margin:0 8px; min-width:20px; }

    .input-tabs { display:flex; gap:8px; margin-bottom:16px; }
    .itab {
      display:flex; align-items:center; gap:6px; padding:8px 16px;
      border-radius:20px; border:1px solid #dadce0; background:#fff;
      color:#5f6368; font-size:13px; font-weight:500; cursor:pointer;
      transition:all 0.15s; font-family:inherit;
    }
    .itab .material-icons { font-size:16px; }
    .itab:hover { border-color:#1a73e8; color:#1a73e8; background:#e8f0fe; }
    .itab.active { border-color:#1a73e8; background:#e8f0fe; color:#1a73e8; }

    .describe-body { animation:mup 0.15s ease; }
    .char-count { font-size:11px; color:#9aa0a6; text-align:right; margin-top:4px; }

    /* Voice */
    .voice-body { display:flex; flex-direction:column; align-items:center; gap:16px; padding:16px 0; }
    .voice-ring {
      width:80px; height:80px; border-radius:50%;
      background:#e8f0fe; border:3px solid #dadce0;
      display:flex; align-items:center; justify-content:center;
      transition:all 0.3s; cursor:pointer;
    }
    .voice-ring.listening {
      background:#fce8e6; border-color:#ea4335;
      animation:pulse-ring 1.2s infinite;
    }
    @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(234,67,53,.3)} 50%{box-shadow:0 0 0 12px rgba(234,67,53,0)} }
    .voice-ring .material-icons { font-size:36px; color:#1a73e8; }
    .voice-ring.listening .material-icons { color:#ea4335; }
    .voice-status { font-size:14px; color:#5f6368; margin:0; }
    .voice-transcript {
      display:flex; align-items:flex-start; gap:8px;
      background:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #1a73e8;
      border-radius:4px; padding:12px 14px; font-size:14px; color:#202124;
      width:100%; line-height:1.5;
    }
    .voice-transcript .material-icons { color:#1a73e8; font-size:18px; flex-shrink:0; margin-top:1px; }
    .voice-actions { display:flex; gap:8px; }
    .btn-danger {
      display:flex; align-items:center; gap:6px; padding:9px 20px;
      border-radius:4px; border:none; background:#ea4335; color:#fff;
      font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s; font-family:inherit;
    }
    .btn-danger:hover { background:#c5221f; }
    .btn-danger .material-icons { font-size:16px; }

    /* Image upload */
    .image-body { display:flex; flex-direction:column; gap:0; }
    .drop-zone {
      border:2px dashed #dadce0; border-radius:8px; padding:32px 20px;
      text-align:center; cursor:pointer; transition:all 0.15s; background:#fafafa;
    }
    .drop-zone:hover { border-color:#1a73e8; background:#e8f0fe; }
    .drop-zone.has-image { padding:16px; border-style:solid; border-color:#1a73e8; }
    .dz-icon { font-size:40px !important; color:#dadce0; display:block; margin:0 auto 8px; }
    .dz-text { font-size:14px; color:#5f6368; margin:0 0 4px; }
    .dz-link { color:#1a73e8; font-weight:500; }
    .dz-hint { font-size:12px; color:#9aa0a6; margin:0; }
    .img-previews { display:flex; flex-wrap:wrap; gap:10px; }
    .img-thumb {
      position:relative; width:90px;
      display:flex; flex-direction:column; align-items:center; gap:4px;
    }
    .img-thumb img { width:90px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #dadce0; }
    .img-remove {
      position:absolute; top:-6px; right:-6px;
      width:20px; height:20px; border-radius:50%; border:none;
      background:#ea4335; color:#fff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .img-remove .material-icons { font-size:12px; }
    .img-name { font-size:10px; color:#5f6368; text-align:center; width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .img-add {
      width:90px; height:70px; border-radius:6px; border:2px dashed #dadce0;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#9aa0a6; transition:all 0.15s;
    }
    .img-add:hover { border-color:#1a73e8; color:#1a73e8; background:#e8f0fe; }
    .img-add .material-icons { font-size:24px; }
    .img-note-wrap { align-items:flex-start; }

    /* Step 4 — Troubleshooting Steps */
    .steps-modal { width:580px; }
    .ts-progress-wrap { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
    .ts-progress-bar { flex:1; height:6px; background:#f1f3f4; border-radius:3px; overflow:hidden; }
    .ts-progress-fill { height:100%; background:#1a73e8; border-radius:3px; transition:width 0.4s ease; }
    .ts-progress-label { font-size:12px; color:#5f6368; white-space:nowrap; font-weight:500; }

    .ts-loading { display:flex; flex-direction:column; align-items:center; gap:16px; padding:40px 0; color:#5f6368; font-size:14px; }

    .ts-step-card {
      display:flex; gap:16px; padding:20px;
      background:#f8f9fa; border:1px solid #dadce0; border-radius:8px;
      margin-bottom:20px; animation:mup 0.2s ease;
    }
    .ts-step-num {
      width:36px; height:36px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:16px; font-weight:700;
    }
    .ts-step-body { flex:1; }
    .ts-step-title { font-size:16px; font-weight:500; color:#202124; margin-bottom:6px; }
    .ts-step-desc  { font-size:14px; color:#5f6368; line-height:1.6; margin-bottom:8px; }
    .ts-step-tip {
      display:flex; align-items:flex-start; gap:6px;
      font-size:12px; color:#b06000; background:#fef7e0;
      border-radius:4px; padding:8px 10px;
    }
    .ts-step-tip .material-icons { font-size:14px; color:#fbbc04; flex-shrink:0; margin-top:1px; }

    .ts-question { margin-bottom:16px; }
    .ts-q-label { font-size:14px; font-weight:500; color:#202124; margin:0 0 12px; }
    .ts-q-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .btn-success {
      display:flex; align-items:center; gap:6px; padding:9px 20px;
      border-radius:4px; border:none; background:#34a853; color:#fff;
      font-size:14px; font-weight:500; cursor:pointer;
      transition:background 0.15s; font-family:inherit;
    }
    .btn-success:hover { background:#2d9249; }
    .btn-success .material-icons { font-size:16px; }

    .ts-done-list { border-top:1px solid #dadce0; padding-top:12px; }
    .ts-done-label { font-size:11px; font-weight:600; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
    .ts-done-item { display:flex; align-items:center; gap:6px; font-size:13px; color:#80868b; padding:3px 0; }
    .ts-done-item .material-icons { font-size:14px; color:#dadce0; }

    .ts-exhausted, .ts-resolved {
      text-align:center; padding:32px 20px; animation:mup 0.2s ease;
    }
    .ts-exhausted .material-icons { font-size:48px; color:#ea4335; display:block; margin:0 auto 12px; }
    .ts-resolved  .material-icons { font-size:48px; color:#34a853; display:block; margin:0 auto 12px; }
    .ts-exhausted h3, .ts-resolved h3 { font-size:18px; font-weight:500; color:#202124; margin:0 0 8px; }
    .ts-exhausted p,  .ts-resolved p  { font-size:14px; color:#5f6368; margin:0 0 20px; }
    .ts-resolved p strong { color:#202124; }

    /* Step 5 — Ticket */
    .ticket-meta-row {
      display:flex; gap:16px; flex-wrap:wrap;
      background:#f8f9fa; border-radius:6px; padding:10px 14px;
      font-size:13px; color:#5f6368;
    }
    .ticket-meta-item { display:flex; align-items:center; gap:6px; }
    .ticket-meta-item .material-icons { font-size:15px; color:#1a73e8; }

    /* Success screen */
    .success-box { width:420px; text-align:center; padding:40px 32px; }
    .success-icon { font-size:64px !important; color:#34a853; display:block; margin:0 auto 16px; }
    .success-box h3 { font-size:20px; font-weight:500; color:#202124; margin:0 0 10px; }
    .success-box p  { font-size:14px; color:#5f6368; margin:0 0 6px; }
    .success-sub    { font-size:13px; color:#80868b; margin-bottom:24px !important; }
    .success-box p strong { color:#202124; }
    .success-actions { display:flex; justify-content:center; gap:10px; }
  `]
})
export class DashboardComponent implements OnInit {
  cameraStatus: CameraStatus | null = null;
  recentTickets: Ticket[] = [];
  currentUser: User | null = null;
  stats: StatCard[] = [];

  quickActions = [
    { label: 'AI Troubleshoot', desc: 'Diagnose camera issues', icon: 'smart_toy',        color: '#6366f1', route: '/troubleshoot' },
    { label: 'Calendar',        desc: 'View event slots',       icon: 'calendar_month',   color: '#22c55e', route: '/calendar' },
    { label: 'Preferences',     desc: 'Set your categories',    icon: 'tune',             color: '#f59e0b', route: '/preferences' },
    { label: 'Admin Panel',     desc: 'Manage time slots',      icon: 'admin_panel_settings', color: '#a855f7', route: '/admin' }
  ];

  activities: Activity[] = [
    { icon: 'smart_toy',          iconColor: '#6366f1', title: 'AI Agent Ready',        desc: 'Troubleshooting assistant initialized',  time: 'Just now' },
    { icon: 'videocam',           iconColor: '#22c55e', title: 'Camera Connected',      desc: 'SV-CAM-001 came online',                 time: '2 min ago' },
    { icon: 'gps_fixed',          iconColor: '#f59e0b', title: 'GPS Signal Good',       desc: 'Satellite lock acquired',                time: '5 min ago' },
    { icon: 'confirmation_number',iconColor: '#a855f7', title: 'System Ready',          desc: 'All services operational',               time: '10 min ago' },
    { icon: 'security_update_good',iconColor: '#06b6d4',title: 'Diagnostics Passed',    desc: 'Hardware check completed',               time: '15 min ago' },
    { icon: 'cloud_done',         iconColor: '#84cc16', title: 'Sync Complete',         desc: 'Data synced to cloud',                   time: '20 min ago' }
  ];

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  get firstName(): string {
    if (!this.currentUser) return 'there';
    return this.currentUser.email.split('@')[0];
  }

  showModal         = false;
  showDetailsModal  = false;
  showDescribeModal = false;
  showStepsModal    = false;
  showTicketModal   = false;
  showTicketSuccess = false;
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

  // Step 4
  stepsLoading    = false;
  activeSteps:    { title:string; desc:string; tip?:string }[] = [];
  completedSteps: { title:string }[] = [];
  currentStepIdx  = 0;
  issueResolved   = false;

  // Step 5
  ticket = { title: '', priority: 'medium', description: '' };
  createdTicketId = '';

  private stepBank: Record<string, { title:string; desc:string; tip?:string }[]> = {
    diagnose_quality: [
      { title: 'Clean the Camera Lens', desc: 'Use a microfibre cloth to gently clean the lens surface. Dust and smudges are the most common cause of poor image quality.', tip: 'Avoid using paper towels — they can scratch the lens coating.' },
      { title: 'Check Focus Settings', desc: 'Navigate to camera settings and verify auto-focus is enabled. Try toggling it off and back on.', tip: 'Manual focus override can sometimes get stuck after a firmware update.' },
      { title: 'Adjust Exposure & Brightness', desc: 'Open the camera configuration panel and reset exposure to default (0). Increase brightness by +10 and test.', tip: 'Overexposure in direct sunlight is common — try enabling HDR mode.' },
      { title: 'Restart Camera Service', desc: 'SSH into the device and run: sudo systemctl restart camera-service. Wait 30 seconds for the service to reinitialise.', tip: 'Check logs with: journalctl -u camera-service -n 50' },
      { title: 'Update Camera Firmware', desc: 'Check the manufacturer portal for the latest firmware. Download and apply via the admin panel under Settings > Firmware Update.' }
    ],
    diagnose_connection: [
      { title: 'Check Physical Cables', desc: 'Inspect all ethernet and power cables for damage or loose connections. Re-seat each connector firmly.', tip: 'A partially seated RJ45 connector is a very common cause of intermittent drops.' },
      { title: 'Verify Network Configuration', desc: 'Confirm the device IP, subnet mask, and gateway are correctly configured. Run: ping 8.8.8.8 to test internet connectivity.' },
      { title: 'Restart Network Interface', desc: 'Run: sudo ifdown eth0 && sudo ifup eth0 to reset the network interface. Check link lights on the switch port.', tip: 'If using WiFi, try moving closer to the access point to rule out signal issues.' },
      { title: 'Check Firewall Rules', desc: 'Ensure ports 80, 443, and 8554 (RTSP) are open. Run: sudo ufw status to review active rules.' },
      { title: 'Power Cycle the Router/Switch', desc: 'Unplug the network switch or router for 30 seconds, then reconnect. Wait 2 minutes for full reinitialisation.' }
    ],
    diagnose_hardware: [
      { title: 'Inspect for Physical Damage', desc: 'Visually check the device for cracks, corrosion, or burn marks. Pay special attention to the power input port.', tip: 'Water ingress is a common cause of hardware failure in outdoor units.' },
      { title: 'Check Power Supply Voltage', desc: 'Use a multimeter to verify the power supply is delivering the correct voltage (typically 12V DC). Replace if outside ±5% tolerance.' },
      { title: 'Verify Battery Level', desc: 'Check the battery status in the admin panel. If below 15%, connect to mains power and allow 2 hours to charge before retesting.' },
      { title: 'Run Built-in Hardware Diagnostics', desc: 'Navigate to Admin > Diagnostics > Run Hardware Test. This checks sensors, storage, and connectivity modules.' },
      { title: 'Reseat Internal Components', desc: 'If safe to open, reseat the SD card, SIM card, and any internal connectors. Ensure no debris is present.' }
    ],
    diagnose_software: [
      { title: 'Restart the Application', desc: 'Run: sudo systemctl restart streetview-agent to restart the main application process.', tip: 'Check for crash logs at /var/log/streetview/error.log' },
      { title: 'Clear Application Cache', desc: 'Delete the cache directory: sudo rm -rf /var/cache/streetview/* and restart the service.' },
      { title: 'Check for Pending Updates', desc: 'Run: sudo apt update && sudo apt upgrade to apply all pending system and application updates.' },
      { title: 'Reinstall the Application', desc: 'Run: sudo apt remove streetview-agent && sudo apt install streetview-agent to perform a clean reinstall.' },
      { title: 'Restore Factory Settings', desc: 'Navigate to Admin > System > Factory Reset. Note: this will erase all local configuration — backup first.' }
    ],
    diagnose_storage: [
      { title: 'Check Storage Usage', desc: 'Run: df -h to check disk usage. If above 90%, delete old footage: sudo find /data/footage -mtime +7 -delete', tip: 'Set up automatic cleanup in Admin > Storage > Auto-purge.' },
      { title: 'Test SD Card Health', desc: 'Run: sudo badblocks -v /dev/mmcblk0 to check for bad sectors. Replace the SD card if errors are found.' },
      { title: 'Verify Mount Points', desc: 'Run: mount | grep /data to confirm the storage volume is correctly mounted. Remount if missing: sudo mount -a' },
      { title: 'Check File System Integrity', desc: 'Unmount the volume and run: sudo fsck /dev/mmcblk0p1 to repair any file system errors.' },
      { title: 'Replace Storage Media', desc: 'If all checks fail, replace the SD card or SSD with a new unit and reformat using the admin panel.' }
    ],
    diagnose_gps: [
      { title: 'Check GPS Antenna Connection', desc: 'Verify the GPS antenna cable is firmly connected to the module. Inspect for kinks or damage along the cable run.', tip: 'The antenna must have a clear view of the sky — avoid metal enclosures.' },
      { title: 'Verify Sky Visibility', desc: 'Ensure the device is positioned with an unobstructed view of the sky. Buildings and trees can block satellite signals.' },
      { title: 'Restart GPS Module', desc: 'Run: sudo systemctl restart gpsd to restart the GPS daemon. Check status: sudo systemctl status gpsd' },
      { title: 'Update GPS Firmware', desc: 'Check the GPS module manufacturer site for firmware updates. Apply via the serial interface using the provided update tool.' },
      { title: 'Run GPS Calibration', desc: 'Navigate to Admin > GPS > Calibrate. Drive the vehicle in a figure-8 pattern at low speed to complete calibration.' }
    ]
  };

  form = { vehicleId: '', country: '', contactNo: '', address: '' };

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
    { label: 'Camera System',    desc: 'Lens, image quality, focus issues',    icon: 'videocam',  color: '#1a73e8', action: 'diagnose_quality' },
    { label: 'Connectivity',     desc: 'Network, WiFi, streaming problems',     icon: 'wifi',      color: '#34a853', action: 'diagnose_connection' },
    { label: 'Power & Hardware', desc: 'Battery, cables, physical components',  icon: 'power',     color: '#fbbc04', action: 'diagnose_hardware' },
    { label: 'Software Issues',  desc: 'Firmware, app crashes, updates',        icon: 'code',      color: '#ea4335', action: 'diagnose_software' },
    { label: 'Storage & Data',   desc: 'SD card, memory, data sync errors',     icon: 'storage',   color: '#9334e6', action: 'diagnose_storage' },
    { label: 'GPS & Location',   desc: 'Signal loss, calibration, accuracy',    icon: 'gps_fixed', color: '#00897b', action: 'diagnose_gps' },
  ];

  constructor(
    private agentService: TroubleshootingAgentService,
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.buildStats();
    });
    this.ticketService.tickets$.subscribe(tickets => {
      this.recentTickets = tickets.slice(0, 5);
      this.buildStats();
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.agentService.getCameraStatus().subscribe(s => {
      this.cameraStatus = s;
      this.buildStats();
    });
  }

  private buildStats(): void {
    const tickets = this.ticketService.getTickets();
    const open    = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
    const resolved= tickets.filter(t => t.status === 'resolved').length;

    this.stats = [
      {
        label: 'Camera Status', value: this.cameraStatus?.online ? 'Online' : 'Offline',
        sub: `Last ping: ${this.cameraStatus ? new Date(this.cameraStatus.lastPing).toLocaleTimeString() : '—'}`,
        icon: 'videocam', trend: this.cameraStatus?.online ? 'up' : 'down',
        trendVal: this.cameraStatus?.online ? 'Live' : 'Down', color: this.cameraStatus?.online ? '#22c55e' : '#ef4444'
      },
      {
        label: 'Open Tickets', value: open,
        sub: `${resolved} resolved total`,
        icon: 'confirmation_number', trend: open > 3 ? 'down' : 'neutral',
        trendVal: open > 0 ? `${open} active` : 'All clear', color: open > 0 ? '#f59e0b' : '#22c55e'
      },

      {
        label: 'GPS Signal', value: (this.cameraStatus?.gpsSignal ?? '—').toUpperCase(),
        sub: `Temp: ${this.cameraStatus?.temperature ?? '—'}°C`,
        icon: 'gps_fixed', trend: ['good','excellent'].includes(this.cameraStatus?.gpsSignal ?? '') ? 'up' : 'down',
        trendVal: this.cameraStatus?.gpsSignal ?? '—', color: '#a855f7'
      }
    ];
  }

  // ── Analytics computed properties ──────────────────────────────────────────

  get totalTickets(): number { return this.ticketService.getTickets().length; }
  get resolvedCount(): number { return this.ticketService.getTickets().filter(t => t.status === 'resolved' || t.status === 'closed').length; }

  get resolutionRate(): number {
    if (!this.totalTickets) return 0;
    return Math.round((this.resolvedCount / this.totalTickets) * 100);
  }

  get avgResponseTime(): string {
    const t = this.ticketService.getTickets();
    if (!t.length) return '—';
    return `${2 + (t.length % 5)}h avg`;
  }

  get avgResponseTrend(): 'up' | 'down' | 'neutral' {
    return this.totalTickets > 3 ? 'up' : 'neutral';
  }

  get autoResolutionRate(): number {
    if (!this.totalTickets) return 0;
    return Math.round((this.ticketService.getTickets().filter(t => t.status === 'resolved').length / this.totalTickets) * 100);
  }

  get categoryStats(): { label:string; count:number; pct:number; color:string }[] {
    const tickets = this.ticketService.getTickets();
    if (!tickets.length) return [];
    const catMap: Record<string,string> = {
      diagnose_quality:'Camera System', diagnose_connection:'Connectivity',
      diagnose_hardware:'Power & Hardware', diagnose_software:'Software Issues',
      diagnose_storage:'Storage & Data', diagnose_gps:'GPS & Location'
    };
    const colors: Record<string,string> = {
      'Camera System':'#1a73e8','Connectivity':'#34a853','Power & Hardware':'#fbbc04',
      'Software Issues':'#ea4335','Storage & Data':'#9334e6','GPS & Location':'#00897b'
    };
    const counts: Record<string,number> = {};
    tickets.forEach(t => { const l = catMap[t.category] || t.category || 'General'; counts[l] = (counts[l]||0)+1; });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])
      .map(([label,count]) => ({ label, count, pct:(count/max)*100, color:colors[label]||'#9aa0a6' }));
  }

  get priorityStats(): { label:string; count:number; pct:number; color:string }[] {
    const tickets = this.ticketService.getTickets();
    return [
      { label:'Critical', count:tickets.filter(t=>t.priority==='critical').length, color:'#9334e6', pct:0 },
      { label:'High',     count:tickets.filter(t=>t.priority==='high').length,     color:'#ea4335', pct:0 },
      { label:'Medium',   count:tickets.filter(t=>t.priority==='medium').length,   color:'#fbbc04', pct:0 },
      { label:'Low',      count:tickets.filter(t=>t.priority==='low').length,      color:'#34a853', pct:0 }
    ].map(p => ({ ...p, pct: tickets.length ? (p.count/tickets.length)*100 : 0 }));
  }

  get statusStats(): { label:string; count:number; color:string }[] {
    const tickets = this.ticketService.getTickets();
    return [
      { label:'Open',        count:tickets.filter(t=>t.status==='open').length,        color:'#1a73e8' },
      { label:'In Progress', count:tickets.filter(t=>t.status==='in-progress').length, color:'#fbbc04' },
      { label:'Resolved',    count:tickets.filter(t=>t.status==='resolved').length,    color:'#34a853' },
      { label:'Closed',      count:tickets.filter(t=>t.status==='closed').length,      color:'#9aa0a6' }
    ];
  }

  selectCategory(cat: { label:string; icon:string; color:string; action:string }): void {
    this.selectedCategory = cat;
    this.showModal = false;
    this.showDetailsModal = true;
    this.submitted = false;
    this.form = { vehicleId: '', country: '', contactNo: '', address: '' };
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
    this.showDescribeModal = false;
    this.showStepsModal    = true;
    this.stepsLoading      = true;
    this.issueResolved     = false;
    this.completedSteps    = [];
    this.currentStepIdx    = 0;
    const key = this.selectedCategory?.action || 'diagnose_connection';
    this.activeSteps = [...(this.stepBank[key] || this.stepBank['diagnose_connection'])];
    setTimeout(() => { this.stepsLoading = false; }, 1800);
  }

  get currentStep() { return this.activeSteps[this.currentStepIdx] ?? null; }

  get stepsProgress(): number {
    if (!this.activeSteps.length) return 0;
    return ((this.currentStepIdx) / this.activeSteps.length) * 100;
  }

  stepResolved(): void {
    this.issueResolved = true;
  }

  stepNotHelped(): void {
    this.completedSteps.push({ title: this.activeSteps[this.currentStepIdx].title });
    if (this.currentStepIdx < this.activeSteps.length - 1) {
      this.currentStepIdx++;
    } else {
      this.currentStepIdx = this.activeSteps.length; // exhausted
    }
  }

  openRaiseTicket(): void {
    this.showStepsModal  = false;
    this.showTicketModal = true;
    this.ticketSubmitted = false;
    this.ticket = {
      title: `${this.selectedCategory?.label} issue — ${this.form.vehicleId}`,
      priority: 'medium',
      description: this.issueDescription || `Issue reported for vehicle ${this.form.vehicleId}. All ${this.activeSteps.length} troubleshooting steps attempted without resolution.`
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
      reportedBy: this.currentUser?.email || 'User',
      tags: [this.selectedCategory?.label || '']
    }, []).subscribe();
    this.showTicketModal   = false;
    this.showTicketSuccess = true;
  }

  goToTickets(): void {
    this.closeAll();
    this.router.navigate(['/tickets']);
  }

  startVoice(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.onresult = (e: any) => {
      this.voiceTranscript = e.results[0][0].transcript;
      this.issueDescription = this.voiceTranscript;
      this.isListening = false;
    };
    this.recognition.onerror = () => { this.isListening = false; };
    this.recognition.onend   = () => { this.isListening = false; };
    this.recognition.start();
    this.isListening = true;
  }

  stopVoice(): void {
    this.recognition?.stop();
    this.isListening = false;
  }

  useTranscript(): void {
    this.issueDescription = this.voiceTranscript;
    this.describeTab = 'text';
  }

  onFileChange(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (files) this.addFiles(Array.from(files));
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer?.files) this.addFiles(Array.from(e.dataTransfer.files));
  }

  private addFiles(files: File[]): void {
    files.filter(f => f.type.startsWith('image/')).forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => this.uploadedImages.push({ url: ev.target!.result as string, name: f.name });
      reader.readAsDataURL(f);
    });
  }

  removeImage(i: number): void { this.uploadedImages.splice(i, 1); }

  closeAll(): void {
    this.showModal = false;
    this.showDetailsModal = false;
    this.showDescribeModal = false;
    this.showStepsModal = false;
    this.showTicketModal = false;
    this.showTicketSuccess = false;
    this.submitted = false;
    this.descSubmitted = false;
    this.ticketSubmitted = false;
    this.issueResolved = false;
    this.isListening = false;
    this.recognition?.stop();
  }

  getMetrics() {
    if (!this.cameraStatus) return [];
    return [
      { label: 'Battery',       icon: 'battery_charging_full', pct: this.cameraStatus.batteryLevel,  val: `${this.cameraStatus.batteryLevel}%`,  color: this.cameraStatus.batteryLevel > 50 ? '#22c55e' : this.cameraStatus.batteryLevel > 20 ? '#f59e0b' : '#ef4444' },
      { label: 'Storage Used',  icon: 'storage',               pct: this.cameraStatus.storageUsed,   val: `${this.cameraStatus.storageUsed}%`,   color: '#6366f1' },
      { label: 'Image Quality', icon: 'photo_camera',          pct: this.cameraStatus.imageQuality,  val: `${this.cameraStatus.imageQuality}%`,  color: '#22c55e' },
      { label: 'Temperature',   icon: 'thermostat',            pct: (this.cameraStatus.temperature / 80) * 100, val: `${this.cameraStatus.temperature}°C`, color: this.cameraStatus.temperature > 60 ? '#ef4444' : this.cameraStatus.temperature > 45 ? '#f59e0b' : '#22c55e' }
    ];
  }
}
