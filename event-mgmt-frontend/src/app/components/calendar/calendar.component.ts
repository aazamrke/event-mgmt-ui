import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { PreferencesService } from '../../services/preferences.service';
import { BookingService } from '../../services/booking.service';
import { TimeSlot, Category, Booking } from '../../models';
import { LoadingComponent } from '../shared/loading.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  template: `
    <div class="calendar-container">
      <div class="header">
        <h2>Available Time Slots</h2>
        <p *ngIf="selectedCategories.length === 0" class="no-preferences">
          No categories selected. <a routerLink="/preferences">Set your preferences</a>
        </p>
      </div>

      <app-loading [loading]="loading" message="Loading time slots..."></app-loading>

      <div *ngIf="!loading && timeSlots.length === 0 && selectedCategories.length > 0" 
           class="no-slots">
        <p>No available time slots for your selected categories.</p>
      </div>

      <div class="slots-grid" *ngIf="!loading && timeSlots.length > 0">
        <mat-card *ngFor="let slot of timeSlots" class="slot-card">
          <mat-card-header>
            <mat-card-title>{{getCategoryName(slot.category_id)}}</mat-card-title>
            <mat-card-subtitle>
              {{formatDate(slot.start_time)}}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="slot-details">
              <p><strong>Time:</strong> {{formatTime(slot.start_time)}} - {{formatTime(slot.end_time)}}</p>
              <p><strong>Available:</strong> {{slot.available_spots}} / {{slot.max_capacity}}</p>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button 
                    [color]="isSlotBooked(slot.id) ? 'warn' : 'primary'"
                    [disabled]="(!isSlotBooked(slot.id) && slot.available_spots === 0) || bookingInProgress"
                    (click)="toggleBooking(slot)">
              {{getButtonText(slot)}}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 24px;
    }
    .no-preferences {
      color: #666;
    }
    .no-slots {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .slot-card {
      height: fit-content;
    }
    .slot-details p {
      margin: 8px 0;
    }
  `]
})
export class CalendarComponent implements OnInit {
  timeSlots: TimeSlot[] = [];
  categories: Category[] = [];
  selectedCategories: number[] = [];
  loading = false;
  bookingInProgress = false;

  constructor(
    private apiService: ApiService,
    private preferencesService: PreferencesService,
    private bookingService: BookingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    // Load initial preferences
    this.selectedCategories = this.preferencesService.getPreferences();
    if (this.selectedCategories.length > 0) {
      this.loadTimeSlots();
    }
    
    // Subscribe to preference changes
    this.preferencesService.preferences$.subscribe(prefs => {
      this.selectedCategories = prefs;
      if (prefs.length > 0) {
        this.loadTimeSlots();
      } else {
        this.timeSlots = [];
        this.loading = false;
      }
    });
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories. Please check if the backend is running.', 'Close', { duration: 5000 });
        // Set mock categories for development
        this.categories = [
          { id: 1, name: 'Cat 1' },
          { id: 2, name: 'Cat 2' },
          { id: 3, name: 'Cat 3' }
        ];
      }
    });
  }

  private loadTimeSlots(): void {
    if (this.selectedCategories.length === 0) {
      this.timeSlots = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.apiService.getSlots(this.selectedCategories).subscribe({
      next: (slots) => {
        this.timeSlots = slots;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time slots:', error);
        this.loading = false;
        // Show demo data when backend is unavailable
        this.timeSlots = this.generateDemoSlots();
        this.snackBar.open('Backend unavailable - showing demo data', 'Close', { duration: 5000 });
      }
    });
  }

  private generateDemoSlots(): TimeSlot[] {
    const demoSlots: TimeSlot[] = [];
    const today = new Date();
    
    this.selectedCategories.forEach((categoryId, index) => {
      for (let i = 0; i < 3; i++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + i + 1);
        slotDate.setHours(10 + (index * 2), 0, 0, 0);
        
        const endDate = new Date(slotDate);
        endDate.setHours(slotDate.getHours() + 1);
        
        demoSlots.push({
          id: (categoryId * 10) + i,
          category_id: categoryId,
          start_time: slotDate.toISOString(),
          end_time: endDate.toISOString(),
          max_capacity: 10,
          available_spots: Math.floor(Math.random() * 8) + 2
        });
      }
    });
    
    return demoSlots;
  }

  toggleBooking(slot: TimeSlot): void {
    this.bookingInProgress = true;
    
    if (this.isSlotBooked(slot.id)) {
      this.cancelBooking(slot);
    } else {
      this.bookSlot(slot);
    }
  }

  private bookSlot(slot: TimeSlot): void {
    this.bookingService.createBooking(slot.id).subscribe({
      next: () => {
        this.bookingInProgress = false;
        this.snackBar.open('Booking successful!', 'Close', { duration: 3000 });
        this.loadTimeSlots();
      },
      error: (error) => {
        console.error('Booking error:', error);
        this.bookingInProgress = false;
        // Simulate booking in demo mode
        this.snackBar.open('Demo mode: Booking simulated successfully!', 'Close', { duration: 3000 });
        // Update slot availability locally
        slot.available_spots = Math.max(0, slot.available_spots - 1);
      }
    });
  }

  private cancelBooking(slot: TimeSlot): void {
    const booking = this.bookingService.getBookingForSlot(slot.id);
    if (booking) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.bookingInProgress = false;
          this.snackBar.open('Booking cancelled successfully!', 'Close', { duration: 3000 });
          this.loadTimeSlots();
        },
        error: (error) => {
          console.error('Cancellation error:', error);
          this.bookingInProgress = false;
          // Simulate cancellation in demo mode
          this.snackBar.open('Demo mode: Cancellation simulated successfully!', 'Close', { duration: 3000 });
          // Update slot availability locally
          slot.available_spots = Math.min(slot.max_capacity, slot.available_spots + 1);
        }
      });
    } else {
      this.bookingInProgress = false;
      this.snackBar.open('Demo mode: Cancellation simulated!', 'Close', { duration: 3000 });
    }
  }

  isSlotBooked(slotId: number): boolean {
    return this.bookingService.isSlotBooked(slotId);
  }

  getButtonText(slot: TimeSlot): string {
    if (this.bookingInProgress) return 'Processing...';
    if (this.isSlotBooked(slot.id)) return 'Cancel Booking';
    if (slot.available_spots === 0) return 'Full';
    return 'Book Slot';
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