import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Booking } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private userBookingsSubject = new BehaviorSubject<Booking[]>([]);
  public userBookings$ = this.userBookingsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  createBooking(timeSlotId: number): Observable<Booking> {
    return this.apiService.createBooking(timeSlotId)
      .pipe(tap(booking => {
        const currentBookings = this.userBookingsSubject.value;
        this.userBookingsSubject.next([...currentBookings, booking]);
      }));
  }

  cancelBooking(bookingId: number): Observable<any> {
    return this.apiService.cancelBooking(bookingId)
      .pipe(tap(() => {
        const currentBookings = this.userBookingsSubject.value;
        const updatedBookings = currentBookings.filter(b => b.id !== bookingId);
        this.userBookingsSubject.next(updatedBookings);
      }));
  }

  getUserBookings(): Booking[] {
    return this.userBookingsSubject.value;
  }

  isSlotBooked(timeSlotId: number): boolean {
    return this.userBookingsSubject.value.some(b => b.time_slot_id === timeSlotId);
  }

  getBookingForSlot(timeSlotId: number): Booking | undefined {
    return this.userBookingsSubject.value.find(b => b.time_slot_id === timeSlotId);
  }
}