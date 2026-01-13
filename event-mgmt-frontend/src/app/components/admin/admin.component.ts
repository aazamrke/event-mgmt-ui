import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { TimeSlot, Category } from '../../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="admin-container">
      <h2>Admin Panel</h2>
      
      <!-- Add New Slot Form -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Add New Time Slot</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="slotForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category_id" required>
                  <mat-option *ngFor="let category of categories" [value]="category.id">
                    {{category.name}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="slotForm.get('category_id')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="slotForm.get('date')?.hasError('required')">
                  Date is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Start Time</mat-label>
                <input matInput type="time" formControlName="start_time" required>
                <mat-error *ngIf="slotForm.get('start_time')?.hasError('required')">
                  Start time is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Time</mat-label>
                <input matInput type="time" formControlName="end_time" required>
                <mat-error *ngIf="slotForm.get('end_time')?.hasError('required')">
                  End time is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Capacity</mat-label>
                <input matInput type="number" formControlName="max_capacity" min="1" required>
                <mat-error *ngIf="slotForm.get('max_capacity')?.hasError('required')">
                  Capacity is required
                </mat-error>
              </mat-form-field>
            </div>

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="slotForm.invalid || loading">
              {{loading ? 'Creating...' : 'Create Slot'}}
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Existing Slots Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Existing Time Slots</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="timeSlots" class="slots-table">
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let slot">{{getCategoryName(slot.category_id)}}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let slot">{{formatDate(slot.start_time)}}</td>
            </ng-container>

            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef>Time</th>
              <td mat-cell *matCellDef="let slot">
                {{formatTime(slot.start_time)}} - {{formatTime(slot.end_time)}}
              </td>
            </ng-container>

            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let slot">{{slot.available_spots}} / {{slot.max_capacity}}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let slot">
                <button mat-icon-button color="warn" (click)="deleteSlot(slot.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .form-card, .table-card {
      margin-bottom: 24px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .slots-table {
      width: 100%;
    }
  `]
})
export class AdminComponent implements OnInit {
  slotForm: FormGroup;
  timeSlots: TimeSlot[] = [];
  categories: Category[] = [];
  loading = false;
  displayedColumns = ['category', 'date', 'time', 'capacity', 'actions'];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.slotForm = this.fb.group({
      category_id: ['', Validators.required],
      date: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      max_capacity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTimeSlots();
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }

  private loadTimeSlots(): void {
    this.apiService.getSlots().subscribe({
      next: (slots) => {
        this.timeSlots = slots;
      },
      error: () => {
        this.snackBar.open('Failed to load time slots', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.slotForm.valid) {
      this.loading = true;
      const formValue = this.slotForm.value;
      
      // Combine date and time
      const startDateTime = this.combineDateTime(formValue.date, formValue.start_time);
      const endDateTime = this.combineDateTime(formValue.date, formValue.end_time);

      // Check for overlapping slots
      if (this.hasOverlappingSlot(formValue.category_id, startDateTime, endDateTime)) {
        this.loading = false;
        this.snackBar.open('Overlapping slot detected for this category', 'Close', { duration: 3000 });
        return;
      }

      const newSlot = {
        category_id: formValue.category_id,
        start_time: startDateTime,
        end_time: endDateTime,
        max_capacity: formValue.max_capacity
      };

      this.apiService.createSlot(newSlot).subscribe({
        next: () => {
          this.loading = false;
          this.slotForm.reset();
          this.loadTimeSlots();
          this.snackBar.open('Time slot created successfully!', 'Close', { duration: 3000 });
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to create time slot', 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteSlot(slotId: number): void {
    if (confirm('Are you sure you want to delete this time slot?')) {
      this.apiService.deleteSlot(slotId).subscribe({
        next: () => {
          this.loadTimeSlots();
          this.snackBar.open('Time slot deleted successfully!', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete time slot', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private combineDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime.toISOString();
  }

  private hasOverlappingSlot(categoryId: number, startTime: string, endTime: string): boolean {
    return this.timeSlots.some(slot => {
      if (slot.category_id !== categoryId) return false;
      
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);
      const newStart = new Date(startTime);
      const newEnd = new Date(endTime);
      
      return (newStart < slotEnd && newEnd > slotStart);
    });
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString();
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}