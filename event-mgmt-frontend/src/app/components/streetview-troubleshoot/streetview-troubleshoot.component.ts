import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TroubleshootingAgentService } from './services/troubleshooting-agent.service';
import { TicketService } from './services/ticket.service';
import { AIAgentMessage, TroubleshootingStep, CameraStatus, Ticket, TicketStatus } from './models/troubleshooting.models';
import { ChatInterfaceComponent } from './chat-interface.component';
import { StepGuidanceComponent } from './step-guidance.component';
import { CameraStatusComponent } from './camera-status.component';
import { TicketListComponent } from './ticket-list.component';
import { TicketDialogComponent, TicketDialogData } from './ticket-dialog.component';

@Component({
  selector: 'app-streetview-troubleshoot',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
    ChatInterfaceComponent,
    StepGuidanceComponent,
    CameraStatusComponent,
    TicketListComponent
  ],
  template: `
    <div class="troubleshoot-container">
      <div class="header">
        <h1>
          <mat-icon>camera_alt</mat-icon>
          Street View Camera Troubleshooting
        </h1>
        <p class="subtitle">AI-Powered Diagnostic Assistant</p>
      </div>

      <div class="main-layout">
        <!-- Left Panel -->
        <div class="left-panel">
          <app-camera-status
            [cameraStatus]="cameraStatus"
            (refreshStatus)="refreshCameraStatus()">
          </app-camera-status>

          <mat-card class="quick-actions">
            <mat-card-header>
              <mat-card-title>Quick Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <button mat-raised-button color="primary" class="action-btn" (click)="runFullDiagnostic()">
                <mat-icon>search</mat-icon> Run Full Diagnostic
              </button>
              <button mat-raised-button class="action-btn" (click)="openCreateTicketDialog()">
                <mat-icon>confirmation_number</mat-icon>
                Create Ticket
                <span class="open-badge" *ngIf="openTicketCount > 0">{{openTicketCount}}</span>
              </button>
              <button mat-raised-button class="action-btn" (click)="restartCamera()">
                <mat-icon>restart_alt</mat-icon> Restart Camera
              </button>
              <button mat-raised-button class="action-btn" (click)="exportReport()">
                <mat-icon>download</mat-icon> Export Report
              </button>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Center Panel: Tabs for Chat + Tickets -->
        <div class="center-panel">
          <mat-tab-group animationDuration="200ms" class="center-tabs">
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>smart_toy</mat-icon>&nbsp;AI Assistant
              </ng-template>
              <app-chat-interface
                [messages]="messages"
                (sendMessage)="handleUserMessage($event)"
                (actionClicked)="handleAgentAction($event)">
              </app-chat-interface>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>confirmation_number</mat-icon>&nbsp;Tickets
                <span class="tab-badge" *ngIf="openTicketCount > 0">{{openTicketCount}}</span>
              </ng-template>
              <app-ticket-list
                [tickets]="tickets"
                (editTicket)="openEditTicketDialog($event)"
                (deleteTicket)="handleDeleteTicket($event)"
                (statusChanged)="handleStatusChange($event)">
              </app-ticket-list>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Right Panel: Steps -->
        <div class="right-panel">
          <app-step-guidance
            [steps]="troubleshootingSteps"
            [currentStepIndex]="currentStepIndex"
            (stepCompleted)="handleStepCompleted($event)"
            (stepFailed)="handleStepFailed($event)"
            (stepSkipped)="handleStepSkipped($event)"
            (createTicket)="openCreateTicketDialog()">
          </app-step-guidance>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .troubleshoot-container {
      padding: 20px;
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .header { text-align: center; margin-bottom: 16px; }
    .header h1 {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; margin: 0; color: #1976d2;
    }
    .subtitle { color: #666; margin: 6px 0 0 0; }
    .main-layout {
      display: grid;
      grid-template-columns: 280px 1fr 340px;
      gap: 16px;
      flex: 1;
      overflow: hidden;
    }
    .left-panel, .center-panel, .right-panel {
      display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
    }
    .quick-actions mat-card-content { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
    .action-btn { justify-content: flex-start; position: relative; }
    .open-badge {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: #f44336; color: white; border-radius: 50%;
      width: 18px; height: 18px; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
    }
    .center-tabs { height: 100%; }
    .tab-badge {
      background: #f44336; color: white; border-radius: 50%;
      width: 18px; height: 18px; font-size: 11px;
      display: inline-flex; align-items: center; justify-content: center;
      margin-left: 4px;
    }
    @media (max-width: 1200px) {
      .main-layout { grid-template-columns: 1fr; }
      .left-panel, .right-panel { display: none; }
    }
  `]
})
export class StreetviewTroubleshootComponent implements OnInit {
  messages: AIAgentMessage[] = [];
  troubleshootingSteps: TroubleshootingStep[] = [];
  currentStepIndex = 0;
  cameraStatus: CameraStatus | null = null;
  tickets: Ticket[] = [];

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
    this.agentService.sendMessage(message, true).subscribe();
  }

  handleAgentAction(action: string): void {
    this.agentService.startDiagnostic(action).subscribe();
  }

  handleStepCompleted(step: TroubleshootingStep): void {
    this.agentService.updateStepStatus(step.id, 'completed', 'Step completed successfully');
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
            this.snackBar.open(`Ticket ${ticket.id} created successfully!`, 'View', { duration: 4000 });
          });
        }
      });
  }

  openEditTicketDialog(ticket: Ticket): void {
    const data: TicketDialogData = {
      ticket,
      steps: ticket.stepsSnapshot,
      cameraId: ticket.cameraId
    };
    this.dialog.open(TicketDialogComponent, { data, width: '600px', disableClose: true })
      .afterClosed().subscribe(result => {
        if (result) {
          this.ticketService.updateTicket(ticket.id, result).subscribe(() => {
            this.snackBar.open('Ticket updated successfully!', 'Close', { duration: 3000 });
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
      this.snackBar.open(`Ticket status updated to ${event.status}`, 'Close', { duration: 2000 });
    });
  }

  runFullDiagnostic(): void {
    this.agentService.startDiagnostic('diagnose_connection').subscribe();
  }

  restartCamera(): void {
    this.snackBar.open('Camera restart initiated...', 'Close', { duration: 3000 });
  }

  exportReport(): void {
    const report = {
      generatedAt: new Date(),
      cameraStatus: this.cameraStatus,
      steps: this.troubleshootingSteps,
      tickets: this.tickets
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sv-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Report exported!', 'Close', { duration: 3000 });
  }
}