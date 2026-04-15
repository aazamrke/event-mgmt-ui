import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { Ticket, TroubleshootingStep, TicketPriority } from './models/troubleshooting.models';

export interface TicketDialogData {
  ticket?: Ticket;
  steps: TroubleshootingStep[];
  cameraId: string;
}

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{isEdit ? 'edit' : 'confirmation_number'}}</mat-icon>
      {{isEdit ? 'Update Ticket' : 'Create Support Ticket'}}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="ticket-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Brief summary of the issue">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4"
                    placeholder="Detailed description of the issue..."></textarea>
          <mat-error *ngIf="form.get('description')?.hasError('required')">Description is required</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="low">
                <span class="priority-option low">● Low</span>
              </mat-option>
              <mat-option value="medium">
                <span class="priority-option medium">● Medium</span>
              </mat-option>
              <mat-option value="high">
                <span class="priority-option high">● High</span>
              </mat-option>
              <mat-option value="critical">
                <span class="priority-option critical">● Critical</span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option value="connection">Connection</mat-option>
              <mat-option value="image-quality">Image Quality</mat-option>
              <mat-option value="gps">GPS</mat-option>
              <mat-option value="hardware">Hardware</mat-option>
              <mat-option value="software">Software</mat-option>
              <mat-option value="calibration">Calibration</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="isEdit">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="open">Open</mat-option>
              <mat-option value="in-progress">In Progress</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
              <mat-option value="closed">Closed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Camera ID</mat-label>
            <input matInput formControlName="cameraId">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width" *ngIf="isEdit">
          <mat-label>Resolution Notes</mat-label>
          <textarea matInput formControlName="resolution" rows="3"
                    placeholder="Describe how the issue was resolved..."></textarea>
        </mat-form-field>

        <!-- Tags -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid>
            <mat-chip-row *ngFor="let tag of tags" (removed)="removeTag(tag)">
              {{tag}}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip-row>
            <input placeholder="Add tag..."
                   [matChipInputFor]="chipGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeys"
                   (matChipInputTokenEnd)="addTag($event)">
          </mat-chip-grid>
        </mat-form-field>

        <!-- Steps snapshot preview -->
        <mat-divider></mat-divider>
        <div class="steps-preview" *ngIf="data.steps.length > 0">
          <p class="steps-label">
            <mat-icon>checklist</mat-icon>
            Attaching {{data.steps.length}} troubleshooting steps
            ({{completedCount}} completed)
          </p>
          <div class="step-chips">
            <span *ngFor="let step of data.steps"
                  class="step-chip"
                  [class]="'step-chip-' + step.status">
              {{step.title}}
            </span>
          </div>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid"
              (click)="submit()">
        <mat-icon>{{isEdit ? 'save' : 'add_circle'}}</mat-icon>
        {{isEdit ? 'Update Ticket' : 'Create Ticket'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .ticket-form { display: flex; flex-direction: column; gap: 12px; min-width: 520px; padding-top: 8px; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    h2 mat-icon { vertical-align: middle; margin-right: 8px; }
    .priority-option { font-weight: 500; }
    .priority-option.low      { color: #4caf50; }
    .priority-option.medium   { color: #ff9800; }
    .priority-option.high     { color: #f44336; }
    .priority-option.critical { color: #9c27b0; }
    .steps-preview { padding: 12px 0; }
    .steps-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #555; margin-bottom: 8px;
    }
    .step-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .step-chip {
      padding: 4px 10px; border-radius: 12px;
      font-size: 12px; border: 1px solid #ddd;
    }
    .step-chip-completed  { background: #e8f5e9; color: #388e3c; border-color: #a5d6a7; }
    .step-chip-pending    { background: #f5f5f5; color: #666; }
    .step-chip-skipped    { background: #fff8e1; color: #f57f17; border-color: #ffe082; }
    .step-chip-failed     { background: #ffebee; color: #c62828; border-color: #ef9a9a; }
    .step-chip-in-progress{ background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
  `]
})
export class TicketDialogComponent implements OnInit {
  form!: FormGroup;
  tags: string[] = [];
  separatorKeys = [ENTER, COMMA];
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TicketDialogData
  ) {
    this.isEdit = !!data.ticket;
  }

  ngOnInit(): void {
    const t = this.data.ticket;
    this.tags = t ? [...t.tags] : [];
    this.form = this.fb.group({
      title:       [t?.title || this.suggestTitle(), Validators.required],
      description: [t?.description || '', Validators.required],
      priority:    [t?.priority || this.suggestPriority()],
      category:    [t?.category || ''],
      status:      [t?.status || 'open'],
      cameraId:    [t?.cameraId || this.data.cameraId],
      resolution:  [t?.resolution || '']
    });
  }

  get completedCount(): number {
    return this.data.steps.filter(s => s.status === 'completed').length;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value)) this.tags.push(value);
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close({ ...this.form.value, tags: this.tags });
    }
  }

  private suggestTitle(): string {
    const failed = this.data.steps.find(s => s.status === 'failed');
    if (failed) return `Issue: ${failed.title}`;
    const pending = this.data.steps.find(s => s.status === 'pending');
    if (pending) return `Unresolved: ${pending.title}`;
    return `Camera Issue - ${this.data.cameraId}`;
  }

  private suggestPriority(): TicketPriority {
    const failedCount = this.data.steps.filter(s => s.status === 'failed').length;
    if (failedCount >= 3) return 'critical';
    if (failedCount >= 2) return 'high';
    if (failedCount >= 1) return 'medium';
    return 'low';
  }
}