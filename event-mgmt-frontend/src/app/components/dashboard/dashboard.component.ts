import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TroubleshootingAgentService } from '../streetview-troubleshoot/services/troubleshooting-agent.service';
import { TicketService } from '../streetview-troubleshoot/services/ticket.service';
import { CameraStatus, Ticket } from '../streetview-troubleshoot/models/troubleshooting.models';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  trendVal: string;
  color: string;
}

interface Activity {
  icon: string;
  iconColor: string;
  title: string;
  desc: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">

      <!-- Top bar -->
      <div class="topbar">
        <div class="greeting">
          <h1>Good {{timeOfDay}}, {{firstName}} 👋</h1>
          <p>Here's what's happening with your Street View cameras today.</p>
        </div>
        <div class="topbar-actions">
          <a routerLink="/troubleshoot" class="primary-btn">
            <span class="material-icons">build_circle</span>
            Start Troubleshooting
          </a>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div *ngFor="let s of stats" class="stat-card" [style.--accent]="s.color">
          <div class="stat-top">
            <div class="stat-icon" [style.background]="s.color + '22'">
              <span class="material-icons" [style.color]="s.color">{{s.icon}}</span>
            </div>
            <div class="trend" [class.up]="s.trend==='up'" [class.down]="s.trend==='down'">
              <span class="material-icons">{{s.trend === 'up' ? 'trending_up' : s.trend === 'down' ? 'trending_down' : 'remove'}}</span>
              {{s.trendVal}}
            </div>
          </div>
          <div class="stat-val">{{s.value}}</div>
          <div class="stat-label">{{s.label}}</div>
          <div class="stat-sub">{{s.sub}}</div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Camera health -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">videocam</span> Camera Health
            </span>
            <button class="ghost-btn" (click)="refreshStatus()">
              <span class="material-icons">refresh</span>
            </button>
          </div>
          <div class="camera-health" *ngIf="cameraStatus">
            <div class="health-hero">
              <div class="health-ring" [class.online]="cameraStatus.online">
                <span class="material-icons">{{cameraStatus.online ? 'videocam' : 'videocam_off'}}</span>
              </div>
              <div>
                <div class="health-status" [class.online]="cameraStatus.online">
                  {{cameraStatus.online ? 'Online' : 'Offline'}}
                </div>
                <div class="health-id">{{cameraStatus.cameraId}}</div>
                <div class="health-ping">Last ping: {{cameraStatus.lastPing | date:'h:mm:ss a'}}</div>
              </div>
            </div>

            <div class="metrics-list">
              <div class="metric-row" *ngFor="let m of getMetrics()">
                <div class="metric-label">
                  <span class="material-icons">{{m.icon}}</span>{{m.label}}
                </div>
                <div class="metric-right">
                  <div class="metric-bar">
                    <div class="metric-fill" [style.width.%]="m.pct" [style.background]="m.color"></div>
                  </div>
                  <span class="metric-val" [style.color]="m.color">{{m.val}}</span>
                </div>
              </div>
            </div>

            <div class="gps-row">
              <span class="material-icons">gps_fixed</span>
              GPS Signal:
              <span class="gps-badge" [class]="'gps-'+cameraStatus.gpsSignal">
                {{cameraStatus.gpsSignal | uppercase}}
              </span>
            </div>
          </div>
          <div class="loading-state" *ngIf="!cameraStatus">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- Recent tickets -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">confirmation_number</span> Recent Tickets
            </span>
            <a routerLink="/troubleshoot" class="view-all">View all</a>
          </div>
          <div class="empty-mini" *ngIf="recentTickets.length === 0">
            <span class="material-icons">inbox</span>
            <p>No tickets yet</p>
            <a routerLink="/troubleshoot" class="mini-link">Start troubleshooting →</a>
          </div>
          <div class="ticket-mini-list" *ngIf="recentTickets.length > 0">
            <div *ngFor="let t of recentTickets" class="ticket-mini" [class]="'p-'+t.priority">
              <div class="tm-left">
                <div class="tm-title">{{t.title}}</div>
                <div class="tm-meta">
                  <span class="tm-id">{{t.id}}</span>
                  <span class="tm-cat">{{t.category}}</span>
                </div>
              </div>
              <div class="tm-right">
                <span class="status-dot-badge" [class]="'s-'+t.status">{{t.status}}</span>
                <span class="tm-time">{{t.createdAt | date:'MMM d'}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">bolt</span> Quick Actions
            </span>
          </div>
          <div class="actions-grid">
            <a *ngFor="let a of quickActions" [routerLink]="a.route" class="action-tile">
              <div class="action-icon" [style.background]="a.color + '22'">
                <span class="material-icons" [style.color]="a.color">{{a.icon}}</span>
              </div>
              <div class="action-label">{{a.label}}</div>
              <div class="action-desc">{{a.desc}}</div>
            </a>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card activity-card">
          <div class="card-header">
            <span class="card-title">
              <span class="material-icons">history</span> Recent Activity
            </span>
          </div>
          <div class="activity-list">
            <div *ngFor="let a of activities; let last = last" class="activity-item">
              <div class="activity-line" *ngIf="!last"></div>
              <div class="activity-dot" [style.background]="a.iconColor">
                <span class="material-icons">{{a.icon}}</span>
              </div>
              <div class="activity-body">
                <div class="activity-title">{{a.title}}</div>
                <div class="activity-desc">{{a.desc}}</div>
                <div class="activity-time">{{a.time}}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 24px 28px;
      height: 100%;
      overflow-y: auto;
      background: #0f1117;
    }
    .dashboard::-webkit-scrollbar { width: 5px; }
    .dashboard::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 3px; }

    /* Topbar */
    .topbar {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px;
    }
    .greeting h1 {
      font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px;
    }
    .greeting p { font-size: 14px; color: #64748b; margin: 0; }
    .primary-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 14px; font-weight: 600;
      text-decoration: none; transition: opacity 0.15s, transform 0.15s;
    }
    .primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .primary-btn .material-icons { font-size: 18px; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #1a1d27;
      border: 1px solid #2d3148;
      border-radius: 12px;
      padding: 18px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .stat-card:hover { border-color: var(--accent, #6366f1); transform: translateY(-2px); }
    .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon .material-icons { font-size: 22px; }
    .trend {
      display: flex; align-items: center; gap: 3px;
      font-size: 12px; font-weight: 600; color: #64748b;
    }
    .trend .material-icons { font-size: 14px; }
    .trend.up   { color: #22c55e; }
    .trend.down { color: #ef4444; }
    .stat-val   { font-size: 28px; font-weight: 800; color: #f1f5f9; margin-bottom: 2px; }
    .stat-label { font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 2px; }
    .stat-sub   { font-size: 11px; color: #475569; }

    /* Main grid */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 16px;
    }
    .card {
      background: #1a1d27;
      border: 1px solid #2d3148;
      border-radius: 12px;
      padding: 20px;
    }
    .activity-card { grid-column: 1 / -1; }

    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: #e2e8f0;
    }
    .card-title .material-icons { font-size: 18px; color: #6366f1; }
    .ghost-btn {
      background: transparent; border: none; cursor: pointer;
      color: #475569; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: all 0.15s;
    }
    .ghost-btn:hover { color: #94a3b8; background: #2d3148; }
    .ghost-btn .material-icons { font-size: 18px; }
    .view-all {
      font-size: 13px; color: #6366f1; text-decoration: none; font-weight: 500;
    }
    .view-all:hover { color: #818cf8; }

    /* Camera health */
    .health-hero {
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
    }
    .health-ring {
      width: 56px; height: 56px; border-radius: 50%;
      background: #2d1515; border: 2px solid #7f1d1d;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .health-ring.online { background: #0d1f12; border-color: #166534; }
    .health-ring .material-icons { font-size: 26px; color: #ef4444; }
    .health-ring.online .material-icons { color: #22c55e; }
    .health-status { font-size: 16px; font-weight: 700; color: #ef4444; }
    .health-status.online { color: #22c55e; }
    .health-id   { font-size: 13px; color: #64748b; font-family: monospace; }
    .health-ping { font-size: 12px; color: #475569; margin-top: 2px; }

    .metrics-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
    .metric-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .metric-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #64748b; min-width: 110px;
    }
    .metric-label .material-icons { font-size: 14px; }
    .metric-right { display: flex; align-items: center; gap: 8px; flex: 1; }
    .metric-bar { flex: 1; height: 5px; background: #2d3148; border-radius: 3px; overflow: hidden; }
    .metric-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .metric-val { font-size: 12px; font-weight: 600; min-width: 36px; text-align: right; }

    .gps-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #64748b;
    }
    .gps-row .material-icons { font-size: 16px; color: #6366f1; }
    .gps-badge {
      padding: 2px 10px; border-radius: 10px;
      font-size: 11px; font-weight: 700;
    }
    .gps-excellent, .gps-good { background: #052e16; color: #4ade80; }
    .gps-weak    { background: #3d2000; color: #fb923c; }
    .gps-none    { background: #450a0a; color: #f87171; }

    /* Tickets mini */
    .empty-mini { text-align: center; padding: 32px 16px; color: #475569; }
    .empty-mini .material-icons { font-size: 36px; display: block; margin: 0 auto 8px; }
    .empty-mini p { margin: 0 0 10px; font-size: 13px; }
    .mini-link { font-size: 13px; color: #6366f1; text-decoration: none; }

    .ticket-mini-list { display: flex; flex-direction: column; gap: 8px; }
    .ticket-mini {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-radius: 8px;
      background: #0f1117; border-left: 3px solid #2d3148;
      transition: background 0.15s;
    }
    .ticket-mini:hover { background: #1e2235; }
    .ticket-mini.p-low      { border-left-color: #22c55e; }
    .ticket-mini.p-medium   { border-left-color: #f59e0b; }
    .ticket-mini.p-high     { border-left-color: #ef4444; }
    .ticket-mini.p-critical { border-left-color: #a855f7; }
    .tm-left { flex: 1; overflow: hidden; }
    .tm-title { font-size: 13px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-meta  { display: flex; gap: 8px; margin-top: 3px; }
    .tm-id    { font-size: 11px; color: #475569; font-family: monospace; }
    .tm-cat   { font-size: 11px; color: #64748b; }
    .tm-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; margin-left: 12px; }
    .status-dot-badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px;
      border-radius: 10px; text-transform: uppercase;
    }
    .s-open        { background: #1e3a5f; color: #60a5fa; }
    .s-in-progress { background: #3d2000; color: #fb923c; }
    .s-resolved    { background: #052e16; color: #4ade80; }
    .s-closed      { background: #1e293b; color: #64748b; }
    .tm-time { font-size: 11px; color: #475569; }

    /* Quick actions */
    .actions-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .action-tile {
      display: flex; flex-direction: column; gap: 8px;
      padding: 14px; border-radius: 10px;
      background: #0f1117; border: 1px solid #2d3148;
      text-decoration: none; transition: all 0.15s; cursor: pointer;
    }
    .action-tile:hover { border-color: #6366f1; background: #1e2235; transform: translateY(-1px); }
    .action-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .action-icon .material-icons { font-size: 20px; }
    .action-label { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .action-desc  { font-size: 11px; color: #64748b; }

    /* Activity */
    .activity-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .activity-item { display: flex; gap: 12px; position: relative; }
    .activity-dot {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .activity-dot .material-icons { font-size: 16px; color: white; }
    .activity-body { flex: 1; }
    .activity-title { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px; }
    .activity-desc  { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .activity-time  { font-size: 11px; color: #475569; }

    /* Loading */
    .loading-state { display: flex; justify-content: center; padding: 40px; }
    .spinner {
      width: 32px; height: 32px; border-radius: 50%;
      border: 3px solid #2d3148; border-top-color: #6366f1;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1100px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .main-grid  { grid-template-columns: 1fr; }
      .activity-card { grid-column: 1; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  cameraStatus: CameraStatus | null = null;
  recentTickets: Ticket[] = [];
  currentUser: User | null = null;
  stats: StatCard[] = [];

  quickActions = [
    { label: 'AI Troubleshoot', desc: 'Diagnose camera issues', icon: 'smart_toy',        color: '#6366f1', route: '/troubleshoot' },
    { label: 'Calendar',        desc: 'View event slots',       icon: 'calendar_month',   color: '#22c55e', route: '/calendar' },
    { label: 'Preferences',     desc: 'Set your categories',    icon: 'tune',             color: '#f59e0b', route: '/preferences' },
    { label: 'Admin Panel',     desc: 'Manage time slots',      icon: 'admin_panel_settings', color: '#a855f7', route: '/admin' }
  ];

  activities: Activity[] = [
    { icon: 'smart_toy',          iconColor: '#6366f1', title: 'AI Agent Ready',        desc: 'Troubleshooting assistant initialized',  time: 'Just now' },
    { icon: 'videocam',           iconColor: '#22c55e', title: 'Camera Connected',      desc: 'SV-CAM-001 came online',                 time: '2 min ago' },
    { icon: 'gps_fixed',          iconColor: '#f59e0b', title: 'GPS Signal Good',       desc: 'Satellite lock acquired',                time: '5 min ago' },
    { icon: 'confirmation_number',iconColor: '#a855f7', title: 'System Ready',          desc: 'All services operational',               time: '10 min ago' },
    { icon: 'security_update_good',iconColor: '#06b6d4',title: 'Diagnostics Passed',    desc: 'Hardware check completed',               time: '15 min ago' },
    { icon: 'cloud_done',         iconColor: '#84cc16', title: 'Sync Complete',         desc: 'Data synced to cloud',                   time: '20 min ago' }
  ];

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  get firstName(): string {
    if (!this.currentUser) return 'there';
    return this.currentUser.email.split('@')[0];
  }

  constructor(
    private agentService: TroubleshootingAgentService,
    private ticketService: TicketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.buildStats();
    });
    this.ticketService.tickets$.subscribe(tickets => {
      this.recentTickets = tickets.slice(0, 5);
      this.buildStats();
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.agentService.getCameraStatus().subscribe(s => {
      this.cameraStatus = s;
      this.buildStats();
    });
  }

  private buildStats(): void {
    const tickets = this.ticketService.getTickets();
    const open    = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
    const resolved= tickets.filter(t => t.status === 'resolved').length;

    this.stats = [
      {
        label: 'Camera Status', value: this.cameraStatus?.online ? 'Online' : 'Offline',
        sub: `Last ping: ${this.cameraStatus ? new Date(this.cameraStatus.lastPing).toLocaleTimeString() : '—'}`,
        icon: 'videocam', trend: this.cameraStatus?.online ? 'up' : 'down',
        trendVal: this.cameraStatus?.online ? 'Live' : 'Down', color: this.cameraStatus?.online ? '#22c55e' : '#ef4444'
      },
      {
        label: 'Open Tickets', value: open,
        sub: `${resolved} resolved total`,
        icon: 'confirmation_number', trend: open > 3 ? 'down' : 'neutral',
        trendVal: open > 0 ? `${open} active` : 'All clear', color: open > 0 ? '#f59e0b' : '#22c55e'
      },
      {
        label: 'Image Quality', value: `${this.cameraStatus?.imageQuality ?? '—'}%`,
        sub: 'Current capture quality',
        icon: 'photo_camera', trend: (this.cameraStatus?.imageQuality ?? 0) > 80 ? 'up' : 'down',
        trendVal: (this.cameraStatus?.imageQuality ?? 0) > 80 ? 'Good' : 'Low', color: '#6366f1'
      },
      {
        label: 'GPS Signal', value: (this.cameraStatus?.gpsSignal ?? '—').toUpperCase(),
        sub: `Temp: ${this.cameraStatus?.temperature ?? '—'}°C`,
        icon: 'gps_fixed', trend: ['good','excellent'].includes(this.cameraStatus?.gpsSignal ?? '') ? 'up' : 'down',
        trendVal: this.cameraStatus?.gpsSignal ?? '—', color: '#a855f7'
      }
    ];
  }

  getMetrics() {
    if (!this.cameraStatus) return [];
    return [
      { label: 'Battery',       icon: 'battery_charging_full', pct: this.cameraStatus.batteryLevel,  val: `${this.cameraStatus.batteryLevel}%`,  color: this.cameraStatus.batteryLevel > 50 ? '#22c55e' : this.cameraStatus.batteryLevel > 20 ? '#f59e0b' : '#ef4444' },
      { label: 'Storage Used',  icon: 'storage',               pct: this.cameraStatus.storageUsed,   val: `${this.cameraStatus.storageUsed}%`,   color: '#6366f1' },
      { label: 'Image Quality', icon: 'photo_camera',          pct: this.cameraStatus.imageQuality,  val: `${this.cameraStatus.imageQuality}%`,  color: '#22c55e' },
      { label: 'Temperature',   icon: 'thermostat',            pct: (this.cameraStatus.temperature / 80) * 100, val: `${this.cameraStatus.temperature}°C`, color: this.cameraStatus.temperature > 60 ? '#ef4444' : this.cameraStatus.temperature > 45 ? '#f59e0b' : '#22c55e' }
    ];
  }
}
