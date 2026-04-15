import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { Ticket, TicketStatus } from './models/troubleshooting.models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatBadgeModule
  ],
  template: `
    <mat-card class="ticket-list-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>confirmation_number</mat-icon>
          Support Tickets
          <span class="badge" *ngIf="openCount > 0">{{openCount}}</span>
        </mat-card-title>
        <div class="list-controls">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Filter</mat-label>
            <mat-select [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()">
              <mat-option value="all">All</mat-option>
              <mat-option value="open">Open</mat-option>
              <mat-option value="in-progress">In Progress</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
              <mat-option value="closed">Closed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div class="empty-state" *ngIf="filteredTickets.length === 0">
          <mat-icon>inbox</mat-icon>
          <p>No tickets found</p>
        </div>

        <mat-accordion>
          <mat-expansion-panel *ngFor="let ticket of filteredTickets"
                               class="ticket-panel"
                               [class]="'priority-border-' + ticket.priority">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <div class="ticket-header-row">
                  <span class="ticket-id">{{ticket.id}}</span>
                  <span class="ticket-title">{{ticket.title}}</span>
                </div>
              </mat-panel-title>
              <mat-panel-description>
                <span class="priority-chip" [class]="'priority-' + ticket.priority">
                  {{ticket.priority | uppercase}}
                </span>
                <span class="status-chip" [class]="'status-' + ticket.status">
                  {{ticket.status | uppercase}}
                </span>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <!-- Ticket body -->
            <div class="ticket-body">
              <div class="ticket-meta">
                <span><mat-icon>videocam</mat-icon> {{ticket.cameraId}}</span>
                <span><mat-icon>person</mat-icon> {{ticket.reportedBy}}</span>
                <span><mat-icon>schedule</mat-icon> {{ticket.createdAt | date:'medium'}}</span>
                <span><mat-icon>category</mat-icon> {{ticket.category}}</span>
              </div>

              <p class="ticket-description">{{ticket.description}}</p>

              <div class="ticket-tags" *ngIf="ticket.tags.length > 0">
                <mat-chip-set>
                  <mat-chip *ngFor="let tag of ticket.tags" class="tag-chip">{{tag}}</mat-chip>
                </mat-chip-set>
              </div>

              <!-- Steps snapshot -->
              <div class="steps-snapshot" *ngIf="ticket.stepsSnapshot.length > 0">
                <p class="snapshot-label">
                  <mat-icon>checklist</mat-icon>
                  Troubleshooting Steps ({{getCompletedCount(ticket)}}/{{ticket.stepsSnapshot.length}})
                </p>
                <div class="snapshot-steps">
                  <div *ngFor="let step of ticket.stepsSnapshot" class="snapshot-step"
                       [class]="'snap-' + step.status">
                    <mat-icon>{{getStepIcon(step.status)}}</mat-icon>
                    <span>{{step.title}}</span>
                    <small *ngIf="step.result"> — {{step.result}}</small>
                  </div>
                </div>
              </div>

              <div class="resolution-note" *ngIf="ticket.resolution">
                <mat-icon>check_circle</mat-icon>
                <span>{{ticket.resolution}}</span>
              </div>

              <mat-divider></mat-divider>

              <!-- Actions -->
              <div class="ticket-actions">
                <mat-form-field appearance="outline" class="status-select">
                  <mat-label>Status</mat-label>
                  <mat-select [value]="ticket.status"
                              (selectionChange)="changeStatus(ticket, $event.value)">
                    <mat-option value="open">Open</mat-option>
                    <mat-option value="in-progress">In Progress</mat-option>
                    <mat-option value="resolved">Resolved</mat-option>
                    <mat-option value="closed">Closed</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-stroked-button color="primary"
                        (click)="editTicket.emit(ticket)"
                        matTooltip="Edit ticket">
                  <mat-icon>edit</mat-icon> Edit
                </button>
                <button mat-stroked-button color="warn"
                        (click)="deleteTicket.emit(ticket.id)"
                        matTooltip="Delete ticket">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ticket-list-card { height: 100%; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #f44336; color: white; border-radius: 50%;
      width: 20px; height: 20px; font-size: 11px; margin-left: 8px;
    }
    .list-controls { margin-left: auto; }
    .filter-field { width: 130px; }

    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }

    .ticket-panel { margin-bottom: 8px; border-left: 4px solid transparent; }
    .priority-border-low      { border-left-color: #4caf50; }
    .priority-border-medium   { border-left-color: #ff9800; }
    .priority-border-high     { border-left-color: #f44336; }
    .priority-border-critical { border-left-color: #9c27b0; }

    .ticket-header-row { display: flex; align-items: center; gap: 8px; overflow: hidden; }
    .ticket-id { font-size: 11px; color: #999; white-space: nowrap; }
    .ticket-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .priority-chip, .status-chip {
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; margin-left: 4px;
    }
    .priority-low      { background: #e8f5e9; color: #388e3c; }
    .priority-medium   { background: #fff3e0; color: #e65100; }
    .priority-high     { background: #ffebee; color: #c62828; }
    .priority-critical { background: #f3e5f5; color: #6a1b9a; }
    .status-open        { background: #e3f2fd; color: #1565c0; }
    .status-in-progress { background: #fff8e1; color: #f57f17; }
    .status-resolved    { background: #e8f5e9; color: #2e7d32; }
    .status-closed      { background: #f5f5f5; color: #616161; }

    .ticket-body { padding-top: 8px; }
    .ticket-meta {
      display: flex; flex-wrap: wrap; gap: 16px;
      font-size: 13px; color: #666; margin-bottom: 12px;
    }
    .ticket-meta span { display: flex; align-items: center; gap: 4px; }
    .ticket-meta mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .ticket-description { color: #333; margin-bottom: 12px; line-height: 1.5; }
    .ticket-tags { margin-bottom: 12px; }
    .tag-chip { font-size: 12px; }

    .steps-snapshot { margin-bottom: 12px; }
    .snapshot-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500; color: #555; margin-bottom: 8px;
    }
    .snapshot-steps { display: flex; flex-direction: column; gap: 4px; }
    .snapshot-step {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; padding: 4px 8px; border-radius: 4px;
    }
    .snapshot-step mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .snapshot-step small { color: #888; }
    .snap-completed  { background: #f1f8f4; color: #2e7d32; }
    .snap-pending    { background: #fafafa; color: #555; }
    .snap-skipped    { background: #fffde7; color: #f57f17; }
    .snap-failed     { background: #ffebee; color: #c62828; }
    .snap-in-progress{ background: #e3f2fd; color: #1565c0; }

    .resolution-note {
      display: flex; align-items: flex-start; gap: 8px;
      background: #e8f5e9; padding: 10px 12px; border-radius: 4px;
      color: #2e7d32; font-size: 13px; margin-bottom: 12px;
    }

    .ticket-actions {
      display: flex; align-items: center; gap: 12px; padding-top: 12px; flex-wrap: wrap;
    }
    .status-select { width: 150px; }
  `]
})
export class TicketListComponent implements OnInit {
  @Input() tickets: Ticket[] = [];
  @Output() editTicket   = new EventEmitter<Ticket>();
  @Output() deleteTicket = new EventEmitter<string>();
  @Output() statusChanged = new EventEmitter<{ id: string; status: TicketStatus }>();

  filterStatus = 'all';
  filteredTickets: Ticket[] = [];

  ngOnInit(): void { this.applyFilter(); }

  ngOnChanges(): void { this.applyFilter(); }

  applyFilter(): void {
    this.filteredTickets = this.filterStatus === 'all'
      ? [...this.tickets]
      : this.tickets.filter(t => t.status === this.filterStatus);
  }

  get openCount(): number {
    return this.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  }

  changeStatus(ticket: Ticket, status: TicketStatus): void {
    this.statusChanged.emit({ id: ticket.id, status });
  }

  getCompletedCount(ticket: Ticket): number {
    return ticket.stepsSnapshot.filter(s => s.status === 'completed').length;
  }

  getStepIcon(status: string): string {
    const icons: Record<string, string> = {
      completed: 'check_circle', failed: 'error',
      skipped: 'skip_next', 'in-progress': 'pending', pending: 'radio_button_unchecked'
    };
    return icons[status] || 'radio_button_unchecked';
  }
}