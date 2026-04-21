import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { TroubleshootingStep, CameraStatus, Ticket, TicketStatus } from './models/troubleshooting.models';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressBarModule, MatSelectModule, MatFormFieldModule,
    MatExpansionModule
  ],
  template: `
    <div class="right-panel">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab === 'steps'"    (click)="activeTab = 'steps'">
          <mat-icon>checklist</mat-icon> Steps
        </button>
        <button class="tab" [class.active]="activeTab === 'tickets'"  (click)="activeTab = 'tickets'">
          <mat-icon>confirmation_number</mat-icon> Tickets
          <span class="tab-badge" *ngIf="openCount > 0">{{openCount}}</span>
        </button>
        <button class="tab" [class.active]="activeTab === 'status'"   (click)="activeTab = 'status'">
          <mat-icon>videocam</mat-icon> Status
        </button>
      </div>

      <div class="panel-body">

        <!-- ── STEPS ── -->
        <ng-container *ngIf="activeTab === 'steps'">
          <div class="section-header">
            <span>Troubleshooting Steps</span>
            <button class="ghost-btn" (click)="createTicket.emit()" matTooltip="Raise ticket">
              <mat-icon>confirmation_number</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="steps.length === 0">
            <mat-icon>search</mat-icon>
            <p>Select an issue in the chat to begin</p>
          </div>

          <ng-container *ngIf="steps.length > 0">
            <div class="progress-row">
              <span class="progress-label">{{completedCount}}/{{steps.length}} completed</span>
              <span class="progress-pct">{{progressPct | number:'1.0-0'}}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="progressPct" class="steps-bar"></mat-progress-bar>

            <div class="steps-list">
              <div *ngFor="let step of steps; let i = index"
                   class="step-card"
                   [class.active]="i === currentStepIndex && step.status === 'pending'"
                   [class.done]="step.status === 'completed'"
                   [class.failed]="step.status === 'failed'"
                   [class.skipped]="step.status === 'skipped'">

                <div class="step-row">
                  <div class="step-icon">
                    <mat-icon *ngIf="step.status === 'completed'">check_circle</mat-icon>
                    <mat-icon *ngIf="step.status === 'failed'">cancel</mat-icon>
                    <mat-icon *ngIf="step.status === 'skipped'">skip_next</mat-icon>
                    <mat-icon *ngIf="step.status === 'in-progress'">pending</mat-icon>
                    <span *ngIf="step.status === 'pending'" class="step-num">{{i+1}}</span>
                  </div>
                  <div class="step-info">
                    <div class="step-title">{{step.title}}</div>
                    <div class="step-desc">{{step.description}}</div>
                    <span class="step-type" [class]="'type-'+step.type">{{step.type}}</span>
                  </div>
                </div>

                <div class="step-actions" *ngIf="i === currentStepIndex && step.status === 'pending'">
                  <button class="action-btn success" (click)="stepCompleted.emit(step)">
                    <mat-icon>check</mat-icon> Done
                  </button>
                  <button class="action-btn danger" (click)="stepFailed.emit(step)">
                    <mat-icon>close</mat-icon> Failed
                  </button>
                  <button class="action-btn ghost" (click)="stepSkipped.emit(step)">
                    <mat-icon>skip_next</mat-icon>
                  </button>
                </div>

                <div class="step-result" *ngIf="step.result">
                  <mat-icon>info</mat-icon> {{step.result}}
                </div>
              </div>
            </div>

            <!-- All done -->
            <div class="all-done" *ngIf="allDone">
              <mat-icon>{{hasFailures ? 'warning' : 'celebration'}}</mat-icon>
              <p>{{hasFailures ? 'Some steps failed.' : 'All steps completed!'}}</p>
              <button class="action-btn" [class.danger]="hasFailures" [class.success]="!hasFailures"
                      (click)="createTicket.emit()">
                <mat-icon>confirmation_number</mat-icon>
                {{hasFailures ? 'Raise Ticket' : 'Create Summary'}}
              </button>
            </div>
          </ng-container>
        </ng-container>

        <!-- ── TICKETS ── -->
        <ng-container *ngIf="activeTab === 'tickets'">
          <div class="section-header">
            <span>Support Tickets</span>
            <div class="header-right">
              <select class="mini-select" [(ngModel)]="ticketFilter" (ngModelChange)="applyFilter()">
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button class="ghost-btn" (click)="createTicket.emit()" matTooltip="New ticket">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <div class="empty-state" *ngIf="filteredTickets.length === 0">
            <mat-icon>inbox</mat-icon>
            <p>No tickets found</p>
          </div>

          <div class="ticket-list">
            <div *ngFor="let t of filteredTickets" class="ticket-card"
                 [class]="'priority-'+t.priority">
              <div class="ticket-top">
                <span class="ticket-id">{{t.id}}</span>
                <span class="priority-badge" [class]="'p-'+t.priority">{{t.priority}}</span>
                <span class="status-badge" [class]="'s-'+t.status">{{t.status}}</span>
              </div>
              <div class="ticket-title">{{t.title}}</div>
              <div class="ticket-meta">
                <mat-icon>videocam</mat-icon>{{t.cameraId}}
                <mat-icon>schedule</mat-icon>{{t.createdAt | date:'MMM d, h:mm a'}}
              </div>
              <div class="ticket-steps" *ngIf="t.stepsSnapshot.length > 0">
                <span *ngFor="let s of t.stepsSnapshot" class="mini-step" [class]="'ms-'+s.status"
                      [matTooltip]="s.title">
                </span>
              </div>
              <div class="ticket-actions">
                <select class="mini-select" [value]="t.status"
                        (change)="onStatusChange(t.id, $any($event.target).value)">
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button class="ghost-btn" (click)="editTicket.emit(t)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="ghost-btn danger-hover" (click)="deleteTicket.emit(t.id)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- ── STATUS ── -->
        <ng-container *ngIf="activeTab === 'status'">
          <div class="section-header">
            <span>Camera Status</span>
            <button class="ghost-btn" (click)="refreshStatus.emit()" matTooltip="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="!cameraStatus">
            <mat-icon>hourglass_empty</mat-icon>
            <p>Loading...</p>
          </div>

          <div class="status-grid" *ngIf="cameraStatus">
            <div class="stat-card">
              <div class="stat-label"><mat-icon>wifi</mat-icon> Connection</div>
              <span class="stat-value" [class.green]="cameraStatus.online" [class.red]="!cameraStatus.online">
                {{cameraStatus.online ? 'Online' : 'Offline'}}
              </span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>badge</mat-icon> Camera ID</div>
              <span class="stat-value mono">{{cameraStatus.cameraId}}</span>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>battery_charging_full</mat-icon> Battery</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill" [style.width.%]="cameraStatus.batteryLevel"
                       [class.bar-green]="cameraStatus.batteryLevel > 50"
                       [class.bar-yellow]="cameraStatus.batteryLevel <= 50 && cameraStatus.batteryLevel > 20"
                       [class.bar-red]="cameraStatus.batteryLevel <= 20"></div>
                </div>
                <span class="bar-val">{{cameraStatus.batteryLevel}}%</span>
              </div>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>storage</mat-icon> Storage Used</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill bar-indigo" [style.width.%]="cameraStatus.storageUsed"></div>
                </div>
                <span class="bar-val">{{cameraStatus.storageUsed}}%</span>
              </div>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>photo_camera</mat-icon> Image Quality</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill bar-green" [style.width.%]="cameraStatus.imageQuality"></div>
                </div>
                <span class="bar-val">{{cameraStatus.imageQuality}}%</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>gps_fixed</mat-icon> GPS</div>
              <span class="stat-value" [class.green]="cameraStatus.gpsSignal === 'excellent' || cameraStatus.gpsSignal === 'good'"
                    [class.yellow]="cameraStatus.gpsSignal === 'weak'"
                    [class.red]="cameraStatus.gpsSignal === 'none'">
                {{cameraStatus.gpsSignal | uppercase}}
              </span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>thermostat</mat-icon> Temp</div>
              <span class="stat-value"
                    [class.green]="cameraStatus.temperature <= 45"
                    [class.yellow]="cameraStatus.temperature > 45 && cameraStatus.temperature <= 60"
                    [class.red]="cameraStatus.temperature > 60">
                {{cameraStatus.temperature}}°C
              </span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>schedule</mat-icon> Last Ping</div>
              <span class="stat-value small">{{cameraStatus.lastPing | date:'h:mm:ss a'}}</span>
            </div>
            <div class="stat-card full errors-card" *ngIf="cameraStatus.errors.length > 0">
              <div class="stat-label red"><mat-icon>error</mat-icon> Errors ({{cameraStatus.errors.length}})</div>
              <div *ngFor="let e of cameraStatus.errors" class="error-item">{{e}}</div>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .right-panel {
      display: flex; flex-direction: column;
      height: 100%; background: #0f1117; color: #e2e8f0;
    }

    /* Tab bar */
    .tab-bar {
      display: flex; border-bottom: 1px solid #2d3148;
      background: #1a1d27; flex-shrink: 0;
    }
    .tab {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 6px; padding: 12px 8px;
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer;
      transition: all 0.15s; white-space: nowrap;
    }
    .tab mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tab:hover { color: #94a3b8; background: #1e2235; }
    .tab.active { color: #6366f1; border-bottom-color: #6366f1; }
    .tab-badge {
      background: #ef4444; color: white; border-radius: 10px;
      padding: 1px 6px; font-size: 10px; font-weight: 700;
    }

    /* Panel body */
    .panel-body { flex: 1; overflow-y: auto; padding: 16px; }
    .panel-body::-webkit-scrollbar { width: 4px; }
    .panel-body::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 2px; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-header span { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .header-right { display: flex; align-items: center; gap: 6px; }

    .ghost-btn {
      background: transparent; border: none; cursor: pointer;
      color: #64748b; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: all 0.15s;
    }
    .ghost-btn:hover { color: #6366f1; background: #1e2235; }
    .ghost-btn.danger-hover:hover { color: #ef4444; }
    .ghost-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .empty-state {
      text-align: center; padding: 48px 20px; color: #475569;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; display: block; margin: 0 auto 12px; }
    .empty-state p { margin: 0; font-size: 14px; }

    /* Steps */
    .progress-row {
      display: flex; justify-content: space-between;
      font-size: 12px; color: #64748b; margin-bottom: 6px;
    }
    .progress-pct { color: #6366f1; font-weight: 600; }
    .steps-bar { border-radius: 4px; margin-bottom: 16px; }
    ::ng-deep .steps-bar .mdc-linear-progress__bar-inner { border-color: #6366f1 !important; }
    ::ng-deep .steps-bar .mdc-linear-progress__buffer-bar { background: #2d3148 !important; }

    .steps-list { display: flex; flex-direction: column; gap: 8px; }
    .step-card {
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 10px; padding: 12px; transition: all 0.2s;
    }
    .step-card.active  { border-color: #6366f1; background: #1e2235; }
    .step-card.done    { border-color: #166534; background: #0d1f12; }
    .step-card.failed  { border-color: #7f1d1d; background: #1c0f0f; }
    .step-card.skipped { border-color: #78350f; background: #1c1508; opacity: 0.7; }

    .step-row { display: flex; gap: 10px; }
    .step-icon {
      width: 28px; height: 28px; border-radius: 50%;
      background: #2d3148; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .step-card.active  .step-icon { background: #6366f1; }
    .step-card.done    .step-icon { background: #166534; }
    .step-card.failed  .step-icon { background: #7f1d1d; }
    .step-icon mat-icon { font-size: 16px; width: 16px; height: 16px; color: white; }
    .step-num { font-size: 12px; font-weight: 700; color: #94a3b8; }
    .step-info { flex: 1; }
    .step-title { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px; }
    .step-desc  { font-size: 12px; color: #64748b; margin-bottom: 6px; }
    .step-type {
      font-size: 10px; font-weight: 600; padding: 2px 8px;
      border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .type-check      { background: #1e3a5f; color: #60a5fa; }
    .type-action     { background: #3d2000; color: #fb923c; }
    .type-diagnostic { background: #2e1065; color: #a78bfa; }
    .type-solution   { background: #052e16; color: #4ade80; }

    .step-actions { display: flex; gap: 6px; margin-top: 10px; }
    .action-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 6px 12px; border-radius: 7px; border: none;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .action-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .action-btn.success { background: #166534; color: #4ade80; }
    .action-btn.success:hover { background: #15803d; }
    .action-btn.danger  { background: #7f1d1d; color: #f87171; }
    .action-btn.danger:hover  { background: #991b1b; }
    .action-btn.ghost   { background: #2d3148; color: #94a3b8; }
    .action-btn.ghost:hover   { background: #374151; }

    .step-result {
      display: flex; align-items: center; gap: 6px;
      margin-top: 8px; font-size: 12px; color: #64748b;
    }
    .step-result mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .all-done {
      text-align: center; padding: 20px;
      border: 1px dashed #2d3148; border-radius: 10px; margin-top: 12px;
    }
    .all-done mat-icon { font-size: 32px; width: 32px; height: 32px; display: block; margin: 0 auto 8px; }
    .all-done p { font-size: 13px; color: #64748b; margin: 0 0 12px; }

    /* Tickets */
    .mini-select {
      background: #1a1d27; border: 1px solid #2d3148;
      color: #94a3b8; border-radius: 6px; padding: 4px 8px;
      font-size: 12px; cursor: pointer; outline: none;
    }
    .ticket-list { display: flex; flex-direction: column; gap: 8px; }
    .ticket-card {
      background: #1a1d27; border: 1px solid #2d3148;
      border-left: 3px solid #2d3148;
      border-radius: 10px; padding: 12px; transition: border-color 0.2s;
    }
    .ticket-card.priority-low      { border-left-color: #22c55e; }
    .ticket-card.priority-medium   { border-left-color: #f59e0b; }
    .ticket-card.priority-high     { border-left-color: #ef4444; }
    .ticket-card.priority-critical { border-left-color: #a855f7; }

    .ticket-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .ticket-id  { font-size: 11px; color: #475569; font-family: monospace; }
    .priority-badge, .status-badge {
      font-size: 10px; font-weight: 700; padding: 2px 7px;
      border-radius: 10px; text-transform: uppercase;
    }
    .p-low      { background: #052e16; color: #4ade80; }
    .p-medium   { background: #3d2000; color: #fb923c; }
    .p-high     { background: #450a0a; color: #f87171; }
    .p-critical { background: #2e1065; color: #c084fc; }
    .s-open        { background: #1e3a5f; color: #60a5fa; }
    .s-in-progress { background: #3d2000; color: #fb923c; }
    .s-resolved    { background: #052e16; color: #4ade80; }
    .s-closed      { background: #1e293b; color: #64748b; }

    .ticket-title { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }
    .ticket-meta {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: #475569; margin-bottom: 8px;
    }
    .ticket-meta mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .ticket-steps { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
    .mini-step {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .ms-completed  { background: #22c55e; }
    .ms-pending    { background: #334155; }
    .ms-failed     { background: #ef4444; }
    .ms-skipped    { background: #f59e0b; }
    .ms-in-progress{ background: #6366f1; }

    .ticket-actions { display: flex; align-items: center; gap: 6px; }

    /* Status */
    .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat-card {
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 10px; padding: 12px;
    }
    .stat-card.full { grid-column: 1 / -1; }
    .stat-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .stat-label mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .stat-label.red { color: #ef4444; }
    .stat-value { font-size: 14px; font-weight: 600; color: #e2e8f0; }
    .stat-value.mono { font-family: monospace; font-size: 12px; }
    .stat-value.small { font-size: 12px; }
    .stat-value.green  { color: #22c55e; }
    .stat-value.yellow { color: #f59e0b; }
    .stat-value.red    { color: #ef4444; }

    .bar-row { display: flex; align-items: center; gap: 8px; }
    .mini-bar { flex: 1; height: 6px; background: #2d3148; border-radius: 3px; overflow: hidden; }
    .mini-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .bar-green  { background: #22c55e; }
    .bar-yellow { background: #f59e0b; }
    .bar-red    { background: #ef4444; }
    .bar-indigo { background: #6366f1; }
    .bar-val { font-size: 12px; font-weight: 600; color: #94a3b8; min-width: 32px; text-align: right; }

    .errors-card { border-color: #7f1d1d; }
    .error-item { font-size: 12px; color: #f87171; padding: 3px 0; }
  `]
})
export class RightPanelComponent implements OnChanges {
  @Input() activeTab = 'steps';
  @Input() steps: TroubleshootingStep[] = [];
  @Input() currentStepIndex = 0;
  @Input() cameraStatus: CameraStatus | null = null;
  @Input() tickets: Ticket[] = [];

  @Output() stepCompleted  = new EventEmitter<TroubleshootingStep>();
  @Output() stepFailed     = new EventEmitter<TroubleshootingStep>();
  @Output() stepSkipped    = new EventEmitter<TroubleshootingStep>();
  @Output() createTicket   = new EventEmitter<void>();
  @Output() editTicket     = new EventEmitter<Ticket>();
  @Output() deleteTicket   = new EventEmitter<string>();
  @Output() statusChanged  = new EventEmitter<{ id: string; status: TicketStatus }>();
  @Output() refreshStatus  = new EventEmitter<void>();

  ticketFilter    = 'all';
  filteredTickets: Ticket[] = [];

  ngOnChanges(): void { this.applyFilter(); }

  applyFilter(): void {
    this.filteredTickets = this.ticketFilter === 'all'
      ? [...this.tickets]
      : this.tickets.filter(t => t.status === this.ticketFilter);
  }

  get openCount(): number {
    return this.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  }

  get completedCount(): number {
    return this.steps.filter(s => s.status === 'completed').length;
  }

  get progressPct(): number {
    if (!this.steps.length) return 0;
    const done = this.steps.filter(s => ['completed','failed','skipped'].includes(s.status)).length;
    return (done / this.steps.length) * 100;
  }

  get allDone(): boolean {
    return this.steps.length > 0 &&
      this.steps.every(s => s.status !== 'pending' && s.status !== 'in-progress');
  }

  get hasFailures(): boolean {
    return this.steps.some(s => s.status === 'failed');
  }

  onStatusChange(id: string, status: TicketStatus): void {
    this.statusChanged.emit({ id, status });
  }
}