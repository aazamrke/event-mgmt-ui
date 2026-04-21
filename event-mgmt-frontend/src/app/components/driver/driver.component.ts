import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DriverChatComponent } from './driver-chat.component';
import { DriverRightPanelComponent } from './driver-right-panel.component';
import { DriverMessage, TripInfo, Incident, RouteStop } from './driver.models';

@Component({
  selector: 'app-driver',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule,
    DriverChatComponent, DriverRightPanelComponent
  ],
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-logo">
          <mat-icon class="logo-icon">local_shipping</mat-icon>
          <span class="logo-text" *ngIf="!sidebarCollapsed">Driver Hub</span>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-item" [class.active]="activePanel==='chat'"
                  (click)="activePanel='chat'" matTooltip="AI Assistant" matTooltipPosition="right">
            <mat-icon>support_agent</mat-icon>
            <span *ngIf="!sidebarCollapsed">AI Assistant</span>
          </button>
          <button class="nav-item" [class.active]="activePanel==='route'"
                  (click)="activePanel='route'" matTooltip="Route" matTooltipPosition="right">
            <mat-icon>route</mat-icon>
            <span *ngIf="!sidebarCollapsed">Route</span>
          </button>
          <button class="nav-item" [class.active]="activePanel==='incidents'"
                  (click)="activePanel='incidents'" matTooltip="Incidents" matTooltipPosition="right">
            <mat-icon>warning</mat-icon>
            <span *ngIf="!sidebarCollapsed">Incidents</span>
            <span class="nav-badge" *ngIf="openIncidentCount>0 && !sidebarCollapsed">{{openIncidentCount}}</span>
            <span class="nav-badge-dot" *ngIf="openIncidentCount>0 && sidebarCollapsed"></span>
          </button>
          <button class="nav-item" [class.active]="activePanel==='vehicle'"
                  (click)="activePanel='vehicle'" matTooltip="Vehicle" matTooltipPosition="right">
            <mat-icon>directions_car</mat-icon>
            <span *ngIf="!sidebarCollapsed">Vehicle</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" (click)="reportIncident()"
                  matTooltip="Report Incident" matTooltipPosition="right">
            <mat-icon>add_alert</mat-icon>
            <span *ngIf="!sidebarCollapsed">Report Incident</span>
          </button>
          <button class="nav-item collapse-btn" (click)="sidebarCollapsed=!sidebarCollapsed"
                  [matTooltip]="sidebarCollapsed?'Expand':'Collapse'" matTooltipPosition="right">
            <mat-icon>{{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}}</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">

        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="status-pill" [class]="'trip-'+trip?.status">
              <span class="status-dot"></span>
              {{ tripStatusLabel }}
            </div>
            <span class="trip-id">{{ trip?.tripId || 'Loading...' }}</span>
            <span class="driver-name" *ngIf="trip">
              <mat-icon>person</mat-icon>{{ trip.driverName }}
            </span>
          </div>
          <div class="topbar-right">
            <button mat-icon-button (click)="refreshTrip()" matTooltip="Refresh trip">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleTripStatus()" matTooltip="Toggle trip status">
              <mat-icon>{{ trip?.status === 'en-route' ? 'pause_circle' : 'play_circle' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="reportIncident()" matTooltip="Report incident">
              <mat-icon>add_alert</mat-icon>
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="content-area">
          <app-driver-chat
            class="chat-area"
            [messages]="messages"
            [isTyping]="isTyping"
            (sendMessage)="handleUserMessage($event)"
            (actionClicked)="handleAction($event)">
          </app-driver-chat>

          <app-driver-right-panel
            class="right-area"
            [trip]="trip"
            [incidents]="incidents"
            [activeTab]="activePanel"
            (completeStop)="handleCompleteStop($event)"
            (skipStop)="handleSkipStop($event)"
            (reportIncident)="reportIncident()"
            (acknowledgeIncident)="handleAcknowledge($event)"
            (resolveIncident)="handleResolve($event)"
            (refreshVehicle)="refreshTrip()">
          </app-driver-right-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; height:calc(100vh - 64px); }

    .app-shell {
      display:flex; height:100%;
      background:#0f1117; color:#e2e8f0;
      font-family:'Inter','Roboto',sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width:220px; min-width:220px; background:#1a1d27;
      border-right:1px solid #2d3148; display:flex; flex-direction:column;
      transition:width 0.2s ease,min-width 0.2s ease; overflow:hidden;
    }
    .sidebar.collapsed { width:56px; min-width:56px; }
    .sidebar-logo {
      display:flex; align-items:center; gap:10px;
      padding:20px 16px 16px; border-bottom:1px solid #2d3148;
    }
    .logo-icon { color:#10b981; font-size:28px; width:28px; height:28px; }
    .logo-text {
      font-size:16px; font-weight:700; white-space:nowrap;
      background:linear-gradient(135deg,#10b981,#059669);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .sidebar-nav { flex:1; padding:12px 8px; display:flex; flex-direction:column; gap:4px; }
    .nav-item {
      display:flex; align-items:center; gap:10px; padding:10px 12px;
      border-radius:8px; border:none; background:transparent; color:#94a3b8;
      cursor:pointer; font-size:14px; font-weight:500; transition:all 0.15s;
      white-space:nowrap; width:100%; text-align:left; position:relative;
    }
    .nav-item:hover { background:#2d3148; color:#e2e8f0; }
    .nav-item.active { background:#2d3148; color:#10b981; }
    .nav-item.active mat-icon { color:#10b981; }
    .nav-item mat-icon { font-size:20px; width:20px; height:20px; flex-shrink:0; }
    .nav-badge { margin-left:auto; background:#ef4444; color:white; border-radius:10px; padding:1px 7px; font-size:11px; font-weight:600; }
    .nav-badge-dot { position:absolute; top:8px; right:8px; width:8px; height:8px; background:#ef4444; border-radius:50%; }
    .sidebar-footer { padding:8px; border-top:1px solid #2d3148; display:flex; flex-direction:column; gap:4px; }
    .collapse-btn { color:#64748b; }

    /* Main */
    .main-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }

    /* Topbar */
    .topbar {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 20px; background:#1a1d27; border-bottom:1px solid #2d3148; flex-shrink:0;
    }
    .topbar-left { display:flex; align-items:center; gap:12px; }
    .topbar-right { display:flex; align-items:center; gap:4px; }
    .topbar-right button { color:#94a3b8; }
    .topbar-right button:hover { color:#e2e8f0; }

    .status-pill {
      display:flex; align-items:center; gap:6px; padding:4px 12px;
      border-radius:20px; background:#2d3148; font-size:13px; font-weight:500; color:#64748b;
    }
    .status-pill.trip-en-route  { color:#10b981; }
    .status-pill.trip-on-site   { color:#6366f1; }
    .status-pill.trip-completed { color:#22c55e; }
    .status-pill.trip-delayed   { color:#ef4444; }
    .status-dot {
      width:7px; height:7px; border-radius:50%; background:currentColor;
      animation:pulse-dot 2s infinite;
    }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .trip-id { font-size:13px; color:#64748b; font-family:monospace; }
    .driver-name { display:flex; align-items:center; gap:4px; font-size:13px; color:#94a3b8; }
    .driver-name mat-icon { font-size:15px; width:15px; height:15px; }

    /* Content */
    .content-area { flex:1; display:grid; grid-template-columns:1fr 380px; overflow:hidden; }
    .chat-area { overflow:hidden; }
    .right-area { border-left:1px solid #2d3148; overflow:hidden; }

    @media (max-width:1024px) {
      .content-area { grid-template-columns:1fr; }
      .right-area { display:none; }
    }
  `]
})
export class DriverComponent implements OnInit {
  messages: DriverMessage[] = [];
  trip: TripInfo | null = null;
  incidents: Incident[] = [];
  activePanel = 'route';
  sidebarCollapsed = false;
  isTyping = false;

  private incidentCounter = 0;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadTrip();
    this.addMessage('agent', `Hello! I'm your Driver AI Assistant. I can help with navigation, vehicle issues, and incident reporting. How can I help?`, [
      { id: 'a1', label: 'Navigation Help',    action: 'nav_help' },
      { id: 'a2', label: 'Vehicle Issue',      action: 'vehicle_issue' },
      { id: 'a3', label: 'Report Delay',       action: 'report_delay' },
      { id: 'a4', label: 'Emergency Support',  action: 'emergency' }
    ]);
  }

  get tripStatusLabel(): string {
    const map: Record<string, string> = {
      idle: 'Idle', 'en-route': 'En Route', 'on-site': 'On Site',
      completed: 'Completed', delayed: 'Delayed'
    };
    return map[this.trip?.status || 'idle'] || 'Unknown';
  }

  get openIncidentCount(): number {
    return this.incidents.filter(i => i.status === 'open').length;
  }

  handleUserMessage(text: string): void {
    this.addMessage('user', text);
    this.isTyping = true;
    of(null).pipe(delay(1200)).subscribe(() => {
      this.isTyping = false;
      this.addMessage('agent', `I received your message: "${text}". Let me assist you with that right away.`);
    });
  }

  handleAction(action: string): void {
    const responses: Record<string, string> = {
      nav_help:      'I can help with navigation. Please share your current location or destination.',
      vehicle_issue: 'Describe the vehicle issue and I\'ll guide you through diagnostics.',
      report_delay:  'I\'ll log a delay report. What is the reason and estimated delay time?',
      emergency:     '🚨 Emergency mode activated. Dispatching support to your location. Stay safe!'
    };
    this.isTyping = true;
    of(null).pipe(delay(800)).subscribe(() => {
      this.isTyping = false;
      this.addMessage('agent', responses[action] || 'How can I assist you?');
    });
  }

  handleCompleteStop(stop: RouteStop): void {
    if (!this.trip) return;
    this.trip = {
      ...this.trip,
      completedStops: this.trip.completedStops + 1,
      stops: this.trip.stops.map(s => s.id === stop.id ? { ...s, status: 'completed' } : s)
    };
    this.addMessage('system', `Stop completed: ${stop.address}`);
    this.snackBar.open(`Stop ${stop.id} completed!`, 'Close', { duration: 3000 });
  }

  handleSkipStop(stop: RouteStop): void {
    if (!this.trip) return;
    this.trip = {
      ...this.trip,
      stops: this.trip.stops.map(s => s.id === stop.id ? { ...s, status: 'skipped' } : s)
    };
    this.snackBar.open(`Stop ${stop.id} skipped`, 'Close', { duration: 2000 });
  }

  reportIncident(): void {
    this.incidentCounter++;
    const incident: Incident = {
      id: 'INC-' + Date.now(),
      title: `Incident #${this.incidentCounter} Reported`,
      description: 'Incident reported by driver.',
      severity: (['low','medium','high'] as const)[this.incidentCounter % 3],
      status: 'open',
      location: this.trip?.stops.find(s => s.status === 'arrived')?.address || 'Current Location',
      reportedAt: new Date()
    };
    this.incidents = [incident, ...this.incidents];
    this.activePanel = 'incidents';
    this.addMessage('system', `Incident reported: ${incident.title}`);
    this.snackBar.open('Incident reported!', 'View', { duration: 3000 });
  }

  handleAcknowledge(id: string): void {
    this.incidents = this.incidents.map(i => i.id === id ? { ...i, status: 'acknowledged' } : i);
    this.snackBar.open('Incident acknowledged', 'Close', { duration: 2000 });
  }

  handleResolve(id: string): void {
    this.incidents = this.incidents.map(i => i.id === id ? { ...i, status: 'resolved' } : i);
    this.snackBar.open('Incident resolved', 'Close', { duration: 2000 });
  }

  refreshTrip(): void {
    this.loadTrip();
    this.snackBar.open('Trip data refreshed', 'Close', { duration: 2000 });
  }

  toggleTripStatus(): void {
    if (!this.trip) return;
    const next = this.trip.status === 'en-route' ? 'on-site' : 'en-route';
    this.trip = { ...this.trip, status: next };
    this.addMessage('system', `Trip status changed to: ${next}`);
  }

  private loadTrip(): void {
    this.trip = {
      tripId: 'TRIP-2024-0042',
      driverName: 'Alex Johnson',
      vehicleId: 'VH-TRK-007',
      status: 'en-route',
      startTime: new Date(Date.now() - 3600000),
      totalStops: 5,
      completedStops: 1,
      distanceKm: 142,
      fuelLevel: 68,
      speedKmh: 72,
      engineTemp: 88,
      stops: [
        { id: 1, address: '123 Main St, Downtown',       eta: '10:30 AM', status: 'completed' },
        { id: 2, address: '456 Oak Ave, Midtown',         eta: '11:15 AM', status: 'arrived',  notes: 'Ring doorbell twice' },
        { id: 3, address: '789 Pine Rd, Uptown',          eta: '12:00 PM', status: 'pending' },
        { id: 4, address: '321 Elm Blvd, Westside',       eta: '01:30 PM', status: 'pending' },
        { id: 5, address: '654 Maple Dr, Northgate',      eta: '02:45 PM', status: 'pending' }
      ]
    };
  }

  private addMessage(type: DriverMessage['type'], content: string, actions?: DriverMessage['actions']): void {
    this.messages = [...this.messages, {
      id: Date.now().toString(),
      type, content, timestamp: new Date(), actions
    }];
  }
}
