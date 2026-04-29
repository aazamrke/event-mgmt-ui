import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get apiUrl(): string {
    return (window as any)['__API_URL__'] || `${location.protocol}//${location.hostname}:8000`;
  }
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string, selectedRole?: 'driver' | 'technician' | 'admin'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap(response => {
        this.setToken(response.access_token);
        this.fetchUserInfo(email, selectedRole);
      }));
  }

  private fetchUserInfo(email: string, selectedRole?: 'driver' | 'technician' | 'admin'): void {
    const role: 'driver' | 'technician' | 'admin' = selectedRole ||
      (email.toLowerCase().includes('admin') ? 'admin' :
      email.toLowerCase().includes('driver') ? 'driver' : 'technician');
    const user: User = {
      id: Math.floor(Math.random() * 1000) + 1,
      email,
      is_admin: role === 'admin',
      role
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getRole(): 'driver' | 'technician' | 'admin' {
    return this.currentUserSubject.value?.role || 'technician';
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password })
      .pipe(tap(response => this.setToken(response.access_token)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_admin || false;
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
  }
}