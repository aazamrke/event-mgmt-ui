import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferencesSubject = new BehaviorSubject<number[]>([]);
  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadPreferences();
  }

  updatePreferences(categoryIds: number[]): Observable<any> {
    return this.apiService.updateUserPreferences({ preferred_categories: categoryIds })
      .pipe(
        tap(() => {
          this.preferencesSubject.next(categoryIds);
          localStorage.setItem('preferences', JSON.stringify(categoryIds));
        }),
        catchError((error) => {
          // Save locally even if API fails
          this.preferencesSubject.next(categoryIds);
          localStorage.setItem('preferences', JSON.stringify(categoryIds));
          throw error;
        })
      );
  }

  getPreferences(): number[] {
    return this.preferencesSubject.value;
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem('preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      this.preferencesSubject.next(prefs);
    }
  }
}