import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { TimeSlot, Category } from '../../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Panel</h1>
          <p class="page-sub">Manage time slots for event categories</p>
        </div>
        <div class="stats-row">
          <div class="stat"><span class="stat-val">{{timeSlots.length}}</span><span class="stat-lbl">Total Slots</span></div>
          <div class="stat"><span class="stat-val">{{categories.length}}</span><span class="stat-lbl">Categories</span></div>
        </div>
      </div>

      <div class="admin-layout">
        <!-- Create form -->
        <div class="form-panel">
          <div class="panel-title">
            <span class="material-icons">add_circle_outline</span>
            Add New Time Slot
          </div>

          <form [formGroup]="slotForm" (ngSubmit)="onSubmit()" class="slot-form">
            <div class="field-group">
              <label>Category</label>
              <select formControlName="category_id" class="dark-select">
                <option value="" disabled>Select category</option>
                <option *ngFor="let c of categories" [value]="c.id">{{c.name}}</option>
              </select>
              <span class="field-error" *ngIf="slotForm.get('category_id')?.invalid && slotForm.get('category_id')?.touched">Required</span>
            </div>

            <div class="field-group">
              <label>Date</label>
              <mat-form-field appearance="outline" class="date-field">
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="Pick a date">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="time-row">
              <div class="field-group">
                <label>Start Time</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">schedule</span>
                  <input type="time" formControlName="start_time">
                </div>
              </div>
              <div class="field-group">
                <label>End Time</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">schedule</span>
                  <input type="time" formControlName="end_time">
                </div>
              </div>
            </div>

            <div class="field-group">
              <label>Capacity</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">people</span>
                <input type="number" formControlName="max_capacity" min="1" placeholder="10">
              </div>
            </div>

            <div class="overlap-warn" *ngIf="overlapError">
              <span class="material-icons">warning</span>
              Overlapping slot detected for this category and time range.
            </div>

            <button type="submit" class="submit-btn" [disabled]="slotForm.invalid || loading">
              <span class="material-icons">add</span>
              {{loading ? 'Creating...' : 'Create Slot'}}
            </button>
          </form>
        </div>

        <!-- Slots table -->
        <div class="table-panel">
          <div class="panel-title">
            <span class="material-icons">table_rows</span>
            Existing Slots
            <span class="count-badge">{{timeSlots.length}}</span>
          </div>

          <div class="empty-state" *ngIf="timeSlots.length === 0">
            <span class="material-icons">event_note</span>
            <p>No slots created yet</p>
          </div>

          <div class="slots-table" *ngIf="timeSlots.length > 0">
            <div class="table-head">
              <span>Category</span>
              <span>Date</span>
              <span>Time</span>
              <span>Capacity</span>
              <span></span>
            </div>
            <div *ngFor="let slot of timeSlots" class="table-row">
              <span class="cat-pill">{{getCategoryName(slot.category_id)}}</span>
              <span class="cell-date">{{formatDate(slot.start_time)}}</span>
              <span class="cell-time">{{formatTime(slot.start_time)}} – {{formatTime(slot.end_time)}}</span>
              <span class="cell-cap">
                <span class="cap-num">{{slot.available_spots}}</span>/{{slot.max_capacity}}
              </span>
              <button class="del-btn" (click)="deleteSlot(slot.id)">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; height: 100%; overflow-y: auto; background: #0f1117; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub   { font-size: 14px; color: #64748b; margin: 0; }

    .stats-row { display: flex; gap: 16px; }
    .stat {
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 10px; padding: 12px 20px; text-align: center;
    }
    .stat-val { display: block; font-size: 22px; font-weight: 700; color: #818cf8; }
    .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .admin-layout { display: grid; grid-template-columns: 360px 1fr; gap: 20px; }

    .form-panel, .table-panel {
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 12px; padding: 20px;
    }
    .panel-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: #94a3b8;
      margin-bottom: 20px;
    }
    .panel-title .material-icons { color: #6366f1; font-size: 20px; }
    .count-badge {
      margin-left: auto; background: #2d3148; color: #64748b;
      border-radius: 10px; padding: 2px 10px; font-size: 12px;
    }

    .slot-form { display: flex; flex-direction: column; gap: 16px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .dark-select {
      background: #0f1117; border: 1px solid #2d3148;
      border-radius: 8px; padding: 10px 12px;
      color: #e2e8f0; font-size: 14px; outline: none;
      cursor: pointer; transition: border-color 0.15s; width: 100%;
    }
    .dark-select:focus { border-color: #6366f1; }

    .date-field { width: 100%; }
    ::ng-deep .date-field .mat-mdc-text-field-wrapper { background: #0f1117 !important; }

    .time-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .input-wrap {
      display: flex; align-items: center;
      background: #0f1117; border: 1px solid #2d3148;
      border-radius: 8px; overflow: hidden; transition: border-color 0.15s;
    }
    .input-wrap:focus-within { border-color: #6366f1; }
    .input-icon { color: #475569; font-size: 18px; padding: 0 10px; flex-shrink: 0; }
    input[type="time"], input[type="number"] {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: 14px; padding: 10px 10px 10px 0;
    }
    input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }

    .field-error { font-size: 12px; color: #ef4444; }
    .overlap-warn {
      display: flex; align-items: center; gap: 8px;
      background: #2d1515; border: 1px solid #7f1d1d;
      border-radius: 8px; padding: 10px 14px;
      font-size: 13px; color: #f87171;
    }
    .overlap-warn .material-icons { font-size: 18px; }

    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 11px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.9; }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .submit-btn .material-icons { font-size: 18px; }

    /* Table */
    .empty-state { text-align: center; padding: 48px; color: #475569; }
    .empty-state .material-icons { font-size: 40px; display: block; margin: 0 auto 12px; }
    .empty-state p { margin: 0; font-size: 14px; }

    .table-head {
      display: grid; grid-template-columns: 100px 1fr 1fr 80px 40px;
      padding: 8px 12px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em; color: #475569;
      border-bottom: 1px solid #2d3148; margin-bottom: 4px;
    }
    .table-row {
      display: grid; grid-template-columns: 100px 1fr 1fr 80px 40px;
      align-items: center; padding: 10px 12px;
      border-radius: 8px; transition: background 0.15s;
    }
    .table-row:hover { background: #1e2235; }

    .cat-pill {
      font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: 10px; background: #1e2235; color: #818cf8;
      border: 1px solid #2d3148; white-space: nowrap;
    }
    .cell-date { font-size: 13px; color: #94a3b8; }
    .cell-time { font-size: 13px; color: #64748b; }
    .cell-cap  { font-size: 13px; color: #64748b; }
    .cap-num   { color: #22c55e; font-weight: 600; }

    .del-btn {
      background: transparent; border: none; cursor: pointer;
      color: #475569; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: all 0.15s;
    }
    .del-btn:hover { color: #ef4444; background: #2d1515; }
    .del-btn .material-icons { font-size: 18px; }

    @media (max-width: 900px) {
      .admin-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminComponent implements OnInit {
  slotForm: FormGroup;
  timeSlots: TimeSlot[] = [];
  categories: Category[] = [];
  loading = false;
  overlapError = false;

  constructor(private fb: FormBuilder, private apiService: ApiService, private snackBar: MatSnackBar) {
    this.slotForm = this.fb.group({
      category_id:  ['', Validators.required],
      date:         ['', Validators.required],
      start_time:   ['', Validators.required],
      end_time:     ['', Validators.required],
      max_capacity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: c => this.categories = c,
      error: () => this.categories = [{ id: 1, name: 'Cat 1' }, { id: 2, name: 'Cat 2' }, { id: 3, name: 'Cat 3' }]
    });
    this.apiService.getSlots().subscribe({
      next: s => this.timeSlots = s,
      error: () => this.timeSlots = []
    });
  }

  onSubmit(): void {
    if (this.slotForm.invalid) return;
    const v = this.slotForm.value;
    const start = this.combineDateTime(v.date, v.start_time);
    const end   = this.combineDateTime(v.date, v.end_time);

    if (this.hasOverlap(+v.category_id, start, end)) {
      this.overlapError = true; return;
    }
    this.overlapError = false;
    this.loading = true;

    this.apiService.createSlot({ category_id: +v.category_id, start_time: start, end_time: end, max_capacity: +v.max_capacity }).subscribe({
      next: slot => {
        this.timeSlots = [slot, ...this.timeSlots];
        this.slotForm.reset(); this.loading = false;
        this.snackBar.open('Slot created!', 'Close', { duration: 3000 });
      },
      error: () => { this.loading = false; this.snackBar.open('Failed to create slot', 'Close', { duration: 3000 }); }
    });
  }

  deleteSlot(id: number): void {
    if (!confirm('Delete this slot?')) return;
    this.apiService.deleteSlot(id).subscribe({
      next: () => { this.timeSlots = this.timeSlots.filter(s => s.id !== id); this.snackBar.open('Slot deleted', 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
    });
  }

  private combineDateTime(date: Date, time: string): string {
    const [h, m] = time.split(':');
    const d = new Date(date); d.setHours(+h, +m, 0, 0);
    return d.toISOString();
  }

  private hasOverlap(catId: number, start: string, end: string): boolean {
    return this.timeSlots.some(s => {
      if (s.category_id !== catId) return false;
      return new Date(start) < new Date(s.end_time) && new Date(end) > new Date(s.start_time);
    });
  }

  getCategoryName(id: number): string { return this.categories.find(c => c.id === id)?.name || 'Unknown'; }
  formatDate(dt: string): string { return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  formatTime(dt: string): string { return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
}
