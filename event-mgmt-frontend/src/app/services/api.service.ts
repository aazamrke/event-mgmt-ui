import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Category, TimeSlot, Booking, UserPreferences } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(() => of([
        { id: 1, name: 'Cat 1' },
        { id: 2, name: 'Cat 2' },
        { id: 3, name: 'Cat 3' }
      ])));
  }

  getSlots(categoryIds?: number[]): Observable<TimeSlot[]> {
    let params = new HttpParams();
    if (categoryIds?.length) {
      params = params.set('categories', categoryIds.join(','));
    }
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/slots`, { params });
  }

  updateUserPreferences(preferences: UserPreferences): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/preferences`, preferences, {
      headers: this.getHeaders()
    });
  }

  createBooking(timeSlotId: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/bookings`, 
      { time_slot_id: timeSlotId }, 
      { headers: this.getHeaders() }
    );
  }

  cancelBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}`, {
      headers: this.getHeaders()
    });
  }

  // Admin endpoints
  createSlot(slot: Partial<TimeSlot>): Observable<TimeSlot> {
    return this.http.post<TimeSlot>(`${this.apiUrl}/admin/slots`, slot, {
      headers: this.getHeaders()
    });
  }

  updateSlot(slotId: number, updates: Partial<TimeSlot>): Observable<TimeSlot> {
    return this.http.put<TimeSlot>(`${this.apiUrl}/admin/slots/${slotId}`, updates, {
      headers: this.getHeaders()
    });
  }

  deleteSlot(slotId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/slots/${slotId}`, {
      headers: this.getHeaders()
    });
  }
}