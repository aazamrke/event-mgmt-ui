import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TroubleshootingStep } from './models/troubleshooting.models';

@Component({
  selector: 'app-step-guidance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="guidance-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>checklist</mat-icon>
          Troubleshooting Steps
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="progress-section" *ngIf="steps.length > 0">
          <div class="progress-info">
            <span>Progress: {{completedSteps}}/{{steps.length}}</span>
            <span>{{progressPercentage | number:'1.0-0'}}%</span>
          </div>
          <mat-progress-bar mode="determinate" [value]="progressPercentage"></mat-progress-bar>
        </div>

        <div class="steps-list" *ngIf="steps.length > 0">
          <div *ngFor="let step of steps; let i = index"
               class="step-item"
               [class.active]="i === currentStepIndex"
               [class.completed]="step.status === 'completed'"
               [class.failed]="step.status === 'failed'"
               [class.skipped]="step.status === 'skipped'">

            <div class="step-header">
              <div class="step-number">
                <mat-icon *ngIf="step.status === 'completed'">check_circle</mat-icon>
                <mat-icon *ngIf="step.status === 'failed'">error</mat-icon>
                <mat-icon *ngIf="step.status === 'in-progress'">pending</mat-icon>
                <mat-icon *ngIf="step.status === 'skipped'">skip_next</mat-icon>
                <span *ngIf="step.status === 'pending'">{{i + 1}}</span>
              </div>
              <div class="step-info">
                <h4>{{step.title}}</h4>
                <p>{{step.description}}</p>
                <mat-chip [class]="'chip-' + step.type">{{step.type}}</mat-chip>
              </div>
            </div>

            <div class="step-actions" *ngIf="i === currentStepIndex && step.status === 'pending'">
              <button mat-raised-button color="primary" (click)="completeStep(step)">
                <mat-icon>check</mat-icon> Mark Complete
              </button>
              <button mat-raised-button color="warn" (click)="failStep(step)">
                <mat-icon>close</mat-icon> Mark Failed
              </button>
              <button mat-button (click)="skipStep(step)">
                <mat-icon>skip_next</mat-icon> Skip
              </button>
            </div>

            <div class="step-result" *ngIf="step.result">
              <mat-icon>info</mat-icon>
              <span>{{step.result}}</span>
            </div>
          </div>
        </div>

        <!-- All steps done banner -->
        <div class="all-done" *ngIf="steps.length > 0 && allDone">
          <mat-icon>{{hasFailures ? 'warning' : 'celebration'}}</mat-icon>
          <p>{{hasFailures ? 'Some steps failed. Consider raising a ticket.' : 'All steps completed!'}}</p>
          <button mat-raised-button color="{{hasFailures ? 'warn' : 'primary'}}"
                  (click)="createTicket.emit()">
            <mat-icon>confirmation_number</mat-icon>
            {{hasFailures ? 'Raise Support Ticket' : 'Create Summary Ticket'}}
          </button>
        </div>

        <!-- Create ticket shortcut while in progress -->
        <div class="ticket-shortcut" *ngIf="steps.length > 0 && !allDone">
          <button mat-stroked-button color="primary" (click)="createTicket.emit()">
            <mat-icon>confirmation_number</mat-icon>
            Raise Ticket Now
          </button>
        </div>

        <div class="no-steps" *ngIf="steps.length === 0">
          <mat-icon>info</mat-icon>
          <p>Select an issue type to begin troubleshooting</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .guidance-card { height: 100%; display: flex; flex-direction: column; }
    .progress-section { margin-bottom: 20px; }
    .progress-info {
      display: flex; justify-content: space-between;
      margin-bottom: 8px; font-size: 14px; color: #666;
    }
    .steps-list { overflow-y: auto; max-height: calc(100vh - 460px); }
    .step-item {
      border: 2px solid #e0e0e0; border-radius: 8px;
      padding: 16px; margin-bottom: 12px; transition: all 0.3s ease;
    }
    .step-item.active    { border-color: #1976d2; background: #e3f2fd; }
    .step-item.completed { border-color: #4caf50; background: #f1f8f4; }
    .step-item.failed    { border-color: #f44336; background: #ffebee; }
    .step-item.skipped   { border-color: #ff9800; background: #fff8e1; opacity: 0.8; }
    .step-header { display: flex; gap: 12px; }
    .step-number {
      width: 40px; height: 40px; border-radius: 50%;
      background: #e0e0e0; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; font-weight: bold;
    }
    .step-item.active    .step-number { background: #1976d2; color: white; }
    .step-item.completed .step-number { background: #4caf50; color: white; }
    .step-item.failed    .step-number { background: #f44336; color: white; }
    .step-item.skipped   .step-number { background: #ff9800; color: white; }
    .step-info h4 { margin: 0 0 6px 0; font-size: 15px; }
    .step-info p  { margin: 0 0 8px 0; color: #666; font-size: 13px; }
    .chip-check      { background: #e3f2fd; color: #1976d2; }
    .chip-action     { background: #fff3e0; color: #f57c00; }
    .chip-diagnostic { background: #f3e5f5; color: #7b1fa2; }
    .chip-solution   { background: #e8f5e9; color: #388e3c; }
    .step-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .step-result {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding: 8px; background: #fff;
      border-radius: 4px; font-size: 13px;
    }
    .all-done {
      text-align: center; padding: 24px 16px;
      border: 2px dashed #ccc; border-radius: 8px; margin-top: 16px;
    }
    .all-done mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
    .all-done p { margin: 0 0 16px 0; color: #555; }
    .ticket-shortcut { padding: 12px 0 4px; text-align: right; }
    .no-steps { text-align: center; padding: 40px; color: #999; }
    .no-steps mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
  `]
})
export class StepGuidanceComponent {
  @Input() steps: TroubleshootingStep[] = [];
  @Input() currentStepIndex = 0;
  @Output() stepCompleted = new EventEmitter<TroubleshootingStep>();
  @Output() stepFailed    = new EventEmitter<TroubleshootingStep>();
  @Output() stepSkipped   = new EventEmitter<TroubleshootingStep>();
  @Output() createTicket  = new EventEmitter<void>();

  get completedSteps(): number {
    return this.steps.filter(s => s.status === 'completed').length;
  }

  get progressPercentage(): number {
    const done = this.steps.filter(s => ['completed','failed','skipped'].includes(s.status)).length;
    return this.steps.length > 0 ? (done / this.steps.length) * 100 : 0;
  }

  get allDone(): boolean {
    return this.steps.length > 0 && this.steps.every(s => s.status !== 'pending' && s.status !== 'in-progress');
  }

  get hasFailures(): boolean {
    return this.steps.some(s => s.status === 'failed');
  }

  completeStep(step: TroubleshootingStep): void { this.stepCompleted.emit(step); }
  failStep(step: TroubleshootingStep): void     { this.stepFailed.emit(step); }
  skipStep(step: TroubleshootingStep): void     { this.stepSkipped.emit(step); }
}