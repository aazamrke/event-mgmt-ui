import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Ticket, TicketPriority, TicketStatus, TroubleshootingStep } from '../models/troubleshooting.models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private ticketsSubject = new BehaviorSubject<Ticket[]>(this.loadFromStorage());
  public tickets$ = this.ticketsSubject.asObservable();

  createTicket(data: Partial<Ticket>, steps: TroubleshootingStep[]): Observable<Ticket> {
    const ticket: Ticket = {
      id: 'TKT-' + Date.now(),
      title: data.title || '',
      description: data.description || '',
      priority: data.priority || 'medium',
      status: 'open',
      category: data.category || '',
      cameraId: data.cameraId || 'SV-CAM-001',
      reportedBy: data.reportedBy || 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      stepsSnapshot: steps,
      tags: data.tags || [],
      resolution: ''
    };
    const updated = [ticket, ...this.ticketsSubject.value];
    this.ticketsSubject.next(updated);
    this.saveToStorage(updated);
    return of(ticket).pipe(delay(400));
  }

  updateTicket(id: string, changes: Partial<Ticket>): Observable<Ticket> {
    const tickets = this.ticketsSubject.value.map(t =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date() } : t
    );
    this.ticketsSubject.next(tickets);
    this.saveToStorage(tickets);
    const updated = tickets.find(t => t.id === id)!;
    return of(updated).pipe(delay(300));
  }

  deleteTicket(id: string): Observable<void> {
    const tickets = this.ticketsSubject.value.filter(t => t.id !== id);
    this.ticketsSubject.next(tickets);
    this.saveToStorage(tickets);
    return of(undefined).pipe(delay(300));
  }

  getTickets(): Ticket[] {
    return this.ticketsSubject.value;
  }

  private saveToStorage(tickets: Ticket[]): void {
    localStorage.setItem('sv_tickets', JSON.stringify(tickets));
  }

  private loadFromStorage(): Ticket[] {
    try {
      const raw = localStorage.getItem('sv_tickets');
      if (!raw) return [];
      return JSON.parse(raw).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
    } catch {
      return [];
    }
  }
}