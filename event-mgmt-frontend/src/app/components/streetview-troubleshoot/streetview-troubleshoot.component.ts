import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TroubleshootingAgentService } from './services/troubleshooting-agent.service';
import { TicketService } from './services/ticket.service';
import { AIAgentMessage, TroubleshootingStep, CameraStatus, Ticket, TicketStatus } from './models/troubleshooting.models';
import { ChatPanelComponent } from './chat-panel.component';
import { RightPanelComponent } from './right-panel.component';
import { TicketDialogComponent, TicketDialogData } from './ticket-dialog.component';

@Component({
  selector: 'app-streetview-troubleshoot',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    ChatPanelComponent,
    RightPanelComponent
  ],
  template: `
    <div class="app-shell">

      <!-- ── Sidebar ── -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <mat-icon class="logo-icon">camera_alt</mat-icon>
          <span class="logo-text" *ngIf="!sidebarCollapsed">StreetView AI</span>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-item" [class.active]="activePanel === 'chat'"
                  (click)="activePanel = 'chat'" matTooltip="AI Chat" matTooltipPosition="right">
            <mat-icon>smart_toy</mat-icon>
            <span *ngIf="!sidebarCollapsed">AI Assistant</span>
          </button>
          <button class="nav-item" [class.active]="activePanel === 'steps'"
                  (click)="activePanel = 'steps'" matTooltip="Steps" matTooltipPosition="right">
            <mat-icon>checklist</mat-icon>
            <span *ngIf="!sidebarCollapsed">Steps</span>
          </button>
          <button class="nav-item" [class.active]="activePanel === 'tickets'"
                  (click)="activePanel = 'tickets'" matTooltip="Tickets" matTooltipPosition="right">
            <mat-icon>confirmation_number</mat-icon>
            <span *ngIf="!sidebarCollapsed">Tickets</span>
            <span class="nav-badge" *ngIf="openTicketCount > 0 && !sidebarCollapsed">{{openTicketCount}}</span>
            <span class="nav-badge-dot" *ngIf="openTicketCount > 0 && sidebarCollapsed"></span>
          </button>
          <button class="nav-item" [class.active]="activePanel === 'status'"
                  (click)="activePanel = 'status'" matTooltip="Camera Status" matTooltipPosition="right">
            <mat-icon>videocam</mat-icon>
            <span *ngIf="!sidebarCollapsed">Camera Status</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" (click)="openCreateTicketDialog()"
                  matTooltip="New Ticket" matTooltipPosition="right">
            <mat-icon>add_circle_outline</mat-icon>
            <span *ngIf="!sidebarCollapsed">New Ticket</span>
          </button>
          <button class="nav-item" (click)="exportReport()"
                  matTooltip="Export Report" matTooltipPosition="right">
            <mat-icon>download</mat-icon>
            <span *ngIf="!sidebarCollapsed">Export</span>
          </button>
          <button class="nav-item collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed"
                  [matTooltip]="sidebarCollapsed ? 'Expand' : 'Collapse'" matTooltipPosition="right">
            <mat-icon>{{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}}</mat-icon>
          </button>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <div class="main-content">

        <!-- Top bar -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="status-pill" [class.online]="cameraStatus?.online">
              <span class="status-dot"></span>
              {{cameraStatus?.online ? 'Camera Online' : 'Camera Offline'}}
            </div>
            <span class="camera-id">{{cameraStatus?.cameraId || 'Loading...'}}</span>
          </div>
          <div class="topbar-right">
            <button mat-icon-button (click)="refreshCameraStatus()" matTooltip="Refresh status">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-icon-button (click)="runFullDiagnostic()" matTooltip="Run diagnostics">
              <mat-icon>search</mat-icon>
            </button>
            <button mat-icon-button (click)="restartCamera()" matTooltip="Restart camera">
              <mat-icon>restart_alt</mat-icon>
            </button>
          </div>
        </header>

        <!-- Content area -->
        <div class="content-area">
          <!-- Chat always visible in center -->
          <app-chat-panel
            class="chat-area"
            [messages]="messages"
            [isTyping]="isTyping"
            (sendMessage)="handleUserMessage($event)"
            (actionClicked)="handleAgentAction($event)">
          </app-chat-panel>

          <!-- Right panel -->
          <app-right-panel
            class="right-area"
            [activeTab]="activePanel"
            [steps]="troubleshootingSteps"
            [currentStepIndex]="currentStepIndex"
            [cameraStatus]="cameraStatus"
            [tickets]="tickets"
            (stepCompleted)="handleStepCompleted($event)"
            (stepFailed)="handleStepFailed($event)"
            (stepSkipped)="handleStepSkipped($event)"
            (createTicket)="openCreateTicketDialog()"
            (editTicket)="openEditTicketDialog($event)"
            (deleteTicket)="handleDeleteTicket($event)"
            (statusChanged)="handleStatusChange($event)"
            (refreshStatus)="refreshCameraStatus()">
          </app-right-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: calc(100vh - 64px); }

    .app-shell {
      display: flex;
      height: 100%;
      background: #0f1117;
      color: #e2e8f0;
      font-family: 'Inter', 'Roboto', sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: #1a1d27;
      border-right: 1px solid #2d3148;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease, min-width 0.2s ease;
      overflow: hidden;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid #2d3148;
    }
    .logo-icon {
      color: #6366f1;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .logo-text {
      font-size: 16px;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    }
    .sidebar-nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s ease;
      white-space: nowrap;
      width: 100%;
      text-align: left;
      position: relative;
    }
    .nav-item:hover { background: #2d3148; color: #e2e8f0; }
    .nav-item.active { background: #2d3148; color: #6366f1; }
    .nav-item.active mat-icon { color: #6366f1; }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      background: #ef4444;
      color: white;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
      font-weight: 600;
    }
    .nav-badge-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
    }
    .sidebar-footer {
      padding: 8px;
      border-top: 1px solid #2d3148;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .collapse-btn { color: #64748b; }

    /* ── Main ── */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Topbar ── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #1a1d27;
      border-bottom: 1px solid #2d3148;
      flex-shrink: 0;
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-right { display: flex; align-items: center; gap: 4px; }
    .topbar-right button { color: #94a3b8; }
    .topbar-right button:hover { color: #e2e8f0; }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      background: #2d3148;
      font-size: 13px;
      font-weight: 500;
      color: #ef4444;
    }
    .status-pill.online { color: #22c55e; }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .camera-id { font-size: 13px; color: #64748b; font-family: monospace; }

    /* ── Content area ── */
    .content-area {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 380px;
      overflow: hidden;
    }
    .chat-area { overflow: hidden; }
    .right-area { border-left: 1px solid #2d3148; overflow: hidden; }

    @media (max-width: 1024px) {
      .content-area { grid-template-columns: 1fr; }
      .right-area { display: none; }
    }
  `]
})
export class StreetviewTroubleshootComponent implements OnInit {
  messages: AIAgentMessage[]       = [];
  troubleshootingSteps: TroubleshootingStep[] = [];
  currentStepIndex = 0;
  cameraStatus: CameraStatus | null = null;
  tickets: Ticket[]                = [];
  activePanel = 'chat';
  sidebarCollapsed = false;
  isTyping = false;

  constructor(
    private agentService: TroubleshootingAgentService,
    private ticketService: TicketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.agentService.messages$.subscribe(m => this.messages = m);
    this.agentService.currentSteps$.subscribe(steps => {
      this.troubleshootingSteps = steps;
      this.currentStepIndex = steps.findIndex(s => s.status === 'pending');
      if (steps.length > 0) this.activePanel = 'steps';
    });
    this.ticketService.tickets$.subscribe(t => this.tickets = t);
    this.refreshCameraStatus();
  }

  get openTicketCount(): number {
    return this.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  }

  refreshCameraStatus(): void {
    this.agentService.getCameraStatus().subscribe(s => this.cameraStatus = s);
  }

  handleUserMessage(message: string): void {
    this.isTyping = true;
    this.agentService.sendMessage(message, true).subscribe(() => {
      this.isTyping = false;
    });
  }

  handleAgentAction(action: string): void {
    this.isTyping = true;
    this.agentService.startDiagnostic(action).subscribe(() => {
      this.isTyping = false;
    });
  }

  handleStepCompleted(step: TroubleshootingStep): void {
    this.agentService.updateStepStatus(step.id, 'completed', 'Completed successfully');
    this.currentStepIndex++;
  }

  handleStepFailed(step: TroubleshootingStep): void {
    this.agentService.updateStepStatus(step.id, 'failed', 'Step failed — manual intervention required');
    this.currentStepIndex++;
  }

  handleStepSkipped(step: TroubleshootingStep): void {
    this.agentService.updateStepStatus(step.id, 'skipped');
    this.currentStepIndex++;
  }

  openCreateTicketDialog(): void {
    const data: TicketDialogData = {
      steps: this.troubleshootingSteps,
      cameraId: this.cameraStatus?.cameraId || 'SV-CAM-001'
    };
    this.dialog.open(TicketDialogComponent, { data, width: '600px', disableClose: true })
      .afterClosed().subscribe(result => {
        if (result) {
          this.ticketService.createTicket(result, this.troubleshootingSteps).subscribe(ticket => {
            this.snackBar.open(`Ticket ${ticket.id} created!`, 'View', { duration: 4000 });
            this.activePanel = 'tickets';
          });
        }
      });
  }

  openEditTicketDialog(ticket: Ticket): void {
    const data: TicketDialogData = { ticket, steps: ticket.stepsSnapshot, cameraId: ticket.cameraId };
    this.dialog.open(TicketDialogComponent, { data, width: '600px', disableClose: true })
      .afterClosed().subscribe(result => {
        if (result) {
          this.ticketService.updateTicket(ticket.id, result).subscribe(() => {
            this.snackBar.open('Ticket updated!', 'Close', { duration: 3000 });
          });
        }
      });
  }

  handleDeleteTicket(id: string): void {
    this.ticketService.deleteTicket(id).subscribe(() => {
      this.snackBar.open('Ticket deleted', 'Close', { duration: 3000 });
    });
  }

  handleStatusChange(event: { id: string; status: TicketStatus }): void {
    this.ticketService.updateTicket(event.id, { status: event.status }).subscribe(() => {
      this.snackBar.open(`Status → ${event.status}`, 'Close', { duration: 2000 });
    });
  }

  runFullDiagnostic(): void {
    this.agentService.startDiagnostic('diagnose_connection').subscribe();
  }

  restartCamera(): void {
    this.snackBar.open('Camera restart initiated...', 'Close', { duration: 3000 });
  }

  exportReport(): void {
    const report = { generatedAt: new Date(), cameraStatus: this.cameraStatus, steps: this.troubleshootingSteps, tickets: this.tickets };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sv-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Report exported!', 'Close', { duration: 3000 });
  }
}