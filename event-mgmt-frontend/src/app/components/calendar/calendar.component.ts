import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { PreferencesService } from '../../services/preferences.service';
import { BookingService } from '../../services/booking.service';
import { TimeSlot, Category } from '../../models';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule],
  template: `
    <div class="page">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendar</h1>
          <p class="page-sub">Available time slots for your selected categories</p>
        </div>
        <a routerLink="/preferences" class="header-btn" *ngIf="selectedCategories.length === 0">
          <span class="material-icons">tune</span> Set Preferences
        </a>
      </div>

      <!-- Category filter pills -->
      <div class="filter-bar" *ngIf="categories.length > 0">
        <button class="pill" [class.active]="selectedCategories.includes(c.id)"
                *ngFor="let c of categories" (click)="toggleCategory(c.id)">
          {{c.name}}
        </button>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="selectedCategories.length === 0 && !loading">
        <span class="material-icons">calendar_month</span>
        <h3>No categories selected</h3>
        <p>Go to Preferences to select event categories you're interested in.</p>
        <a routerLink="/preferences" class="cta-btn">Set Preferences</a>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading time slots...</p>
      </div>

      <!-- No slots -->
      <div class="empty-state" *ngIf="!loading && timeSlots.length === 0 && selectedCategories.length > 0">
        <span class="material-icons">event_busy</span>
        <h3>No slots available</h3>
        <p>No time slots found for your selected categories.</p>
      </div>

      <!-- Slots grid -->
      <div class="slots-grid" *ngIf="!loading && timeSlots.length > 0">
        <div *ngFor="let slot of timeSlots" class="slot-card"
             [class.booked]="isBooked(slot.id)"
             [class.full]="slot.available_spots === 0 && !isBooked(slot.id)">

          <div class="slot-top">
            <span class="category-tag">{{getCategoryName(slot.category_id)}}</span>
            <span class="availability" [class.low]="slot.available_spots <= 2 && slot.available_spots > 0">
              {{slot.available_spots === 0 ? 'Full' : slot.available_spots + ' spots'}}
            </span>
          </div>

          <div class="slot-date">{{formatDate(slot.start_time)}}</div>

          <div class="slot-time">
            <span class="material-icons">schedule</span>
            {{formatTime(slot.start_time)}} – {{formatTime(slot.end_time)}}
          </div>

          <div class="slot-capacity">
            <div class="cap-bar">
              <div class="cap-fill" [style.width.%]="getCapacityPct(slot)"
                   [class.cap-low]="getCapacityPct(slot) > 80"></div>
            </div>
            <span>{{slot.available_spots}}/{{slot.max_capacity}}</span>
          </div>

          <button class="slot-btn"
                  [class.cancel-btn]="isBooked(slot.id)"
                  [disabled]="(slot.available_spots === 0 && !isBooked(slot.id)) || bookingInProgress"
                  (click)="toggleBooking(slot)">
            <span class="material-icons">{{isBooked(slot.id) ? 'event_busy' : 'event_available'}}</span>
            {{getButtonLabel(slot)}}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; height: 100%; overflow-y: auto; background: #0f1117; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub   { font-size: 14px; color: #64748b; margin: 0; }
    .header-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 8px;
      background: #1e2235; border: 1px solid #2d3148;
      color: #818cf8; font-size: 14px; font-weight: 500;
      text-decoration: none; transition: all 0.15s;
    }
    .header-btn:hover { background: #2d3148; }
    .header-btn .material-icons { font-size: 18px; }

    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .pill {
      padding: 6px 16px; border-radius: 20px;
      border: 1px solid #2d3148; background: transparent;
      color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .pill:hover { border-color: #6366f1; color: #818cf8; }
    .pill.active { background: #1e2235; border-color: #6366f1; color: #818cf8; }

    .empty-state {
      text-align: center; padding: 80px 20px; color: #475569;
    }
    .empty-state .material-icons { font-size: 56px; display: block; margin: 0 auto 16px; color: #2d3148; }
    .empty-state h3 { font-size: 20px; color: #64748b; margin: 0 0 8px; }
    .empty-state p  { font-size: 14px; margin: 0 0 24px; }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 24px; border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 14px; font-weight: 600;
      text-decoration: none; transition: opacity 0.15s;
    }
    .cta-btn:hover { opacity: 0.9; }

    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px; color: #475569; }
    .spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #2d3148; border-top-color: #6366f1;
      animation: spin 0.8s linear infinite; margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .slot-card {
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 12px; padding: 18px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .slot-card:hover { border-color: #6366f1; transform: translateY(-2px); }
    .slot-card.booked { border-color: #166534; background: #0d1f12; }
    .slot-card.full   { opacity: 0.5; }

    .slot-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .category-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 3px 10px; border-radius: 10px;
      background: #1e2235; color: #818cf8; border: 1px solid #2d3148;
    }
    .availability { font-size: 12px; font-weight: 600; color: #22c55e; }
    .availability.low { color: #f59e0b; }

    .slot-date { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
    .slot-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #64748b; margin-bottom: 14px;
    }
    .slot-time .material-icons { font-size: 16px; }

    .slot-capacity { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .cap-bar { flex: 1; height: 4px; background: #2d3148; border-radius: 2px; overflow: hidden; }
    .cap-fill { height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.3s; }
    .cap-fill.cap-low { background: #f59e0b; }
    .slot-capacity span { font-size: 12px; color: #64748b; white-space: nowrap; }

    .slot-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s;
    }
    .slot-btn:hover:not(:disabled) { opacity: 0.85; }
    .slot-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .slot-btn.cancel-btn { background: #1c2a1c; border: 1px solid #166534; color: #4ade80; }
    .slot-btn .material-icons { font-size: 16px; }
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
    this.selectedCategories = this.preferencesService.getPreferences();
    this.loadCategories();
    this.preferencesService.preferences$.subscribe(prefs => {
      this.selectedCategories = prefs;
      if (prefs.length > 0) this.loadTimeSlots();
      else this.timeSlots = [];
    });
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: c => { this.categories = c; if (this.selectedCategories.length) this.loadTimeSlots(); },
      error: () => {
        this.categories = [{ id: 1, name: 'Cat 1' }, { id: 2, name: 'Cat 2' }, { id: 3, name: 'Cat 3' }];
        if (this.selectedCategories.length) this.loadTimeSlots();
      }
    });
  }

  private loadTimeSlots(): void {
    if (!this.selectedCategories.length) { this.timeSlots = []; return; }
    this.loading = true;
    this.apiService.getSlots(this.selectedCategories).subscribe({
      next: s => { this.timeSlots = s; this.loading = false; },
      error: () => { this.timeSlots = this.generateDemoSlots(); this.loading = false; }
    });
  }

  toggleCategory(id: number): void {
    const idx = this.selectedCategories.indexOf(id);
    if (idx > -1) this.selectedCategories.splice(idx, 1);
    else this.selectedCategories.push(id);
    if (this.selectedCategories.length) this.loadTimeSlots();
    else this.timeSlots = [];
  }

  toggleBooking(slot: TimeSlot): void {
    this.bookingInProgress = true;
    if (this.isBooked(slot.id)) {
      const booking = this.bookingService.getBookingForSlot(slot.id);
      if (booking) {
        this.bookingService.cancelBooking(booking.id).subscribe({
          next: () => { this.bookingInProgress = false; this.snackBar.open('Booking cancelled', 'Close', { duration: 3000 }); slot.available_spots++; },
          error: () => { this.bookingInProgress = false; this.snackBar.open('Cancelled (demo)', 'Close', { duration: 3000 }); slot.available_spots++; }
        });
      } else { this.bookingInProgress = false; }
    } else {
      this.bookingService.createBooking(slot.id).subscribe({
        next: () => { this.bookingInProgress = false; this.snackBar.open('Booked!', 'Close', { duration: 3000 }); slot.available_spots--; },
        error: () => { this.bookingInProgress = false; this.snackBar.open('Booked (demo)', 'Close', { duration: 3000 }); slot.available_spots--; }
      });
    }
  }

  isBooked(slotId: number): boolean { return this.bookingService.isSlotBooked(slotId); }
  getCategoryName(id: number): string { return this.categories.find(c => c.id === id)?.name || 'Unknown'; }
  formatDate(dt: string): string { return new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  formatTime(dt: string): string { return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  getCapacityPct(slot: TimeSlot): number { return ((slot.max_capacity - slot.available_spots) / slot.max_capacity) * 100; }
  getButtonLabel(slot: TimeSlot): string {
    if (this.bookingInProgress) return 'Processing...';
    if (this.isBooked(slot.id)) return 'Cancel Booking';
    if (slot.available_spots === 0) return 'Full';
    return 'Book Slot';
  }

  private generateDemoSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();
    this.selectedCategories.forEach((catId, ci) => {
      for (let i = 0; i < 4; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i + 1); d.setHours(9 + ci * 3, 0, 0, 0);
        const e = new Date(d); e.setHours(d.getHours() + 1);
        slots.push({ id: catId * 10 + i, category_id: catId, start_time: d.toISOString(), end_time: e.toISOString(), max_capacity: 10, available_spots: Math.floor(Math.random() * 8) + 1 });
      }
    });
    return slots;
  }
}
