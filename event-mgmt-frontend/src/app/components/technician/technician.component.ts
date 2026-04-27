import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '../streetview-troubleshoot/services/ticket.service';
import { Ticket } from '../streetview-troubleshoot/models/troubleshooting.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-technician',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="header-card">
        <div class="header-icon">
          <span class="material-icons">engineering</span>
        </div>
        <div class="header-text">
          <h1 class="title">Good {{timeOfDay}}, {{userName}} 👋</h1>
          <p class="sub">Here's what's happening with your camera systems today.</p>
        </div>
        <a routerLink="/tickets" class="header-btn">
          <span class="material-icons">confirmation_number</span> View All Tickets
        </a>
      </div>

      <!-- Stat cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e8f0fe">
            <span class="material-icons" style="color:#1a73e8">inbox</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">{{openCount}}</div>
            <div class="stat-label">Open Tickets</div>
            <div class="stat-sub">{{inProgressCount}} in progress</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e6f4ea">
            <span class="material-icons" style="color:#34a853">check_circle</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">{{resolvedCount}}</div>
            <div class="stat-label">Resolved</div>
            <div class="stat-sub">{{closedCount}} closed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce8e6">
            <span class="material-icons" style="color:#ea4335">flag</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">{{criticalCount}}</div>
            <div class="stat-label">Critical / High</div>
            <div class="stat-sub">Needs immediate attention</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f3e8fd">
            <span class="material-icons" style="color:#9334e6">bar_chart</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">{{resolutionRate}}%</div>
            <div class="stat-label">Resolution Rate</div>
            <div class="stat-sub">{{totalTickets}} total tickets</div>
          </div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Open Tickets list -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <span class="material-icons">inbox</span> Open Tickets
              <span class="count-badge">{{openTickets.length}}</span>
            </div>
            <a routerLink="/tickets" class="view-all">View all →</a>
          </div>

          <div class="empty-state" *ngIf="openTickets.length === 0">
            <span class="material-icons">check_circle</span>
            <p>No open tickets — all clear!</p>
          </div>

          <div class="ticket-list" *ngIf="openTickets.length > 0">
            <div *ngFor="let t of openTickets.slice(0,6)" class="ticket-row" [class]="'pri-'+t.priority">
              <div class="ticket-left">
                <div class="ticket-title">{{t.title}}</div>
                <div class="ticket-meta">
                  <span class="t-id">{{t.id}}</span>
                  <span class="t-cat">{{formatCategory(t.category)}}</span>
                  <span class="t-vehicle"><span class="material-icons">directions_car</span>{{t.cameraId}}</span>
                </div>
              </div>
              <div class="ticket-right">
                <span class="pri-badge" [class]="'pb-'+t.priority">{{t.priority}}</span>
                <span class="status-badge" [class]="'sb-'+t.status">{{t.status}}</span>
                <span class="t-date">{{t.createdAt | date:'MMM d'}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority Distribution -->
        <div class="card">
          <div class="card-head">
            <div class="card-title"><span class="material-icons">flag</span> Priority Distribution</div>
          </div>

          <div class="empty-state" *ngIf="totalTickets === 0">
            <span class="material-icons">bar_chart</span>
            <p>No ticket data yet</p>
          </div>

          <div *ngIf="totalTickets > 0">
            <!-- Stacked bar -->
            <div class="stacked-bar">
              <div *ngFor="let p of priorityStats" class="stacked-seg"
                   [style.width.%]="p.pct" [style.background]="p.color"
                   [title]="p.label+': '+p.count"></div>
            </div>

            <div class="pri-legend">
              <div *ngFor="let p of priorityStats" class="pl-row">
                <div class="pl-dot" [style.background]="p.color"></div>
                <span class="pl-label">{{p.label}}</span>
                <div class="pl-bar-wrap">
                  <div class="pl-bar">
                    <div class="pl-fill" [style.width.%]="p.pct" [style.background]="p.color"></div>
                  </div>
                </div>
                <span class="pl-count">{{p.count}}</span>
                <span class="pl-pct">{{p.pct | number:'1.0-0'}}%</span>
              </div>
            </div>

            <!-- Status breakdown -->
            <div class="status-row">
              <div *ngFor="let s of statusStats" class="status-item">
                <div class="si-val" [style.color]="s.color">{{s.count}}</div>
                <div class="si-dot" [style.background]="s.color"></div>
                <div class="si-label">{{s.label}}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="card">
          <div class="card-head">
            <div class="card-title"><span class="material-icons">donut_large</span> Issues by Category</div>
          </div>
          <div class="empty-state" *ngIf="categoryStats.length === 0">
            <span class="material-icons">bar_chart</span><p>No data yet</p>
          </div>
          <div class="cat-list" *ngIf="categoryStats.length > 0">
            <div *ngFor="let c of categoryStats" class="cat-row">
              <div class="cat-dot" [style.background]="c.color"></div>
              <span class="cat-label">{{c.label}}</span>
              <div class="cat-bar-wrap">
                <div class="cat-bar">
                  <div class="cat-fill" [style.width.%]="c.pct" [style.background]="c.color"></div>
                </div>
              </div>
              <span class="cat-count">{{c.count}}</span>
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card">
          <div class="card-head">
            <div class="card-title"><span class="material-icons">history</span> Recent Tickets</div>
          </div>
          <div class="empty-state" *ngIf="allTickets.length === 0">
            <span class="material-icons">inbox</span><p>No tickets yet</p>
          </div>
          <div class="recent-list" *ngIf="allTickets.length > 0">
            <div *ngFor="let t of allTickets.slice(0,5)" class="recent-row">
              <div class="recent-icon" [style.background]="getPriorityColor(t.priority)+'18'">
                <span class="material-icons" [style.color]="getPriorityColor(t.priority)">confirmation_number</span>
              </div>
              <div class="recent-body">
                <div class="recent-title">{{t.title}}</div>
                <div class="recent-meta">{{t.cameraId}} · {{formatCategory(t.category)}}</div>
              </div>
              <div class="recent-right">
                <span class="status-badge" [class]="'sb-'+t.status">{{t.status}}</span>
                <span class="recent-date">{{t.createdAt | date:'MMM d, h:mm a'}}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Quick links -->
      <div class="links-grid">
        <a routerLink="/tickets" class="link-card">
          <div class="link-icon" style="background:#e8f0fe"><span class="material-icons" style="color:#1a73e8">confirmation_number</span></div>
          <div class="link-body"><div class="link-title">Tickets</div><div class="link-desc">View and manage all support tickets</div></div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/knowledge-base" class="link-card">
          <div class="link-icon" style="background:#fef7e0"><span class="material-icons" style="color:#f9ab00">menu_book</span></div>
          <div class="link-body"><div class="link-title">Knowledge Base</div><div class="link-desc">Upload documents and manage vector DB</div></div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/calendar" class="link-card">
          <div class="link-icon" style="background:#f3e8fd"><span class="material-icons" style="color:#9334e6">calendar_month</span></div>
          <div class="link-body"><div class="link-title">Calendar</div><div class="link-desc">View and book available time slots</div></div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/admin" class="link-card">
          <div class="link-icon" style="background:#fce8e6"><span class="material-icons" style="color:#ea4335">admin_panel_settings</span></div>
          <div class="link-body"><div class="link-title">Admin Panel</div><div class="link-desc">Manage time slots and categories</div></div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .page { padding:24px 28px; background:#f8f9fa; height:100%; overflow-y:auto; font-family:'Google Sans','Roboto',sans-serif; }
    .page::-webkit-scrollbar { width:6px; }
    .page::-webkit-scrollbar-thumb { background:#dadce0; border-radius:3px; }

    /* Header */
    .header-card { display:flex; align-items:center; gap:16px; background:#fff; border:1px solid #dadce0; border-radius:8px; padding:20px 24px; box-shadow:0 1px 3px rgba(60,64,67,.1); border-left:4px solid #1a73e8; margin-bottom:20px; }
    .header-icon { width:48px; height:48px; border-radius:12px; background:#e8f0fe; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .header-icon .material-icons { font-size:26px; color:#1a73e8; }
    .header-text { flex:1; }
    .title { font-size:20px; font-weight:600; color:#202124; margin:0 0 4px; }
    .sub   { font-size:14px; color:#5f6368; margin:0; }
    .header-btn { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:4px; background:#1a73e8; color:#fff; font-size:13px; font-weight:500; text-decoration:none; transition:background 0.15s; white-space:nowrap; }
    .header-btn:hover { background:#1557b0; }
    .header-btn .material-icons { font-size:16px; }

    /* Stats */
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
    .stat-card { background:#fff; border:1px solid #dadce0; border-radius:8px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 2px rgba(60,64,67,.06); transition:box-shadow 0.2s; }
    .stat-card:hover { box-shadow:0 2px 8px rgba(60,64,67,.15); }
    .stat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon .material-icons { font-size:22px; }
    .stat-val   { font-size:24px; font-weight:600; color:#202124; }
    .stat-label { font-size:12px; font-weight:500; color:#5f6368; margin-top:2px; }
    .stat-sub   { font-size:11px; color:#80868b; margin-top:1px; }

    /* Main grid */
    .main-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .card { background:#fff; border:1px solid #dadce0; border-radius:8px; padding:20px; box-shadow:0 1px 2px rgba(60,64,67,.06); }
    .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:#202124; }
    .card-title .material-icons { font-size:18px; color:#1a73e8; }
    .count-badge { background:#e8f0fe; color:#1a73e8; border-radius:12px; padding:1px 8px; font-size:12px; font-weight:600; }
    .view-all { font-size:13px; color:#1a73e8; text-decoration:none; font-weight:500; }
    .view-all:hover { text-decoration:underline; }

    /* Empty state */
    .empty-state { text-align:center; padding:32px 16px; color:#9aa0a6; }
    .empty-state .material-icons { font-size:36px; display:block; margin:0 auto 8px; color:#dadce0; }
    .empty-state p { margin:0; font-size:13px; color:#5f6368; }

    /* Ticket list */
    .ticket-list { display:flex; flex-direction:column; gap:6px; }
    .ticket-row { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:6px; background:#f8f9fa; border-left:3px solid #dadce0; transition:background 0.15s; }
    .ticket-row:hover { background:#f1f3f4; }
    .ticket-row.pri-low      { border-left-color:#34a853; }
    .ticket-row.pri-medium   { border-left-color:#fbbc04; }
    .ticket-row.pri-high     { border-left-color:#ea4335; }
    .ticket-row.pri-critical { border-left-color:#9334e6; }
    .ticket-left { flex:1; overflow:hidden; }
    .ticket-title { font-size:13px; font-weight:500; color:#202124; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
    .ticket-meta { display:flex; align-items:center; gap:8px; font-size:11px; color:#5f6368; }
    .t-id { font-family:'Roboto Mono',monospace; color:#80868b; }
    .t-vehicle { display:flex; align-items:center; gap:2px; }
    .t-vehicle .material-icons { font-size:12px; }
    .ticket-right { display:flex; align-items:center; gap:6px; flex-shrink:0; margin-left:10px; }
    .t-date { font-size:11px; color:#80868b; }

    /* Badges */
    .pri-badge, .status-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; text-transform:uppercase; }
    .pb-low      { background:#e6f4ea; color:#137333; }
    .pb-medium   { background:#fef7e0; color:#b06000; }
    .pb-high     { background:#fce8e6; color:#c5221f; }
    .pb-critical { background:#f3e8fd; color:#7627bb; }
    .sb-open        { background:#e8f0fe; color:#1a73e8; }
    .sb-in-progress { background:#fef7e0; color:#b06000; }
    .sb-resolved    { background:#e6f4ea; color:#137333; }
    .sb-closed      { background:#f1f3f4; color:#5f6368; }

    /* Priority distribution */
    .stacked-bar { display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; margin-bottom:16px; }
    .stacked-seg { height:100%; border-radius:2px; transition:width 0.5s ease; min-width:2px; }
    .pri-legend { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .pl-row { display:flex; align-items:center; gap:8px; }
    .pl-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .pl-label { font-size:13px; color:#202124; font-weight:500; min-width:60px; }
    .pl-bar-wrap { flex:1; }
    .pl-bar { height:6px; background:#f1f3f4; border-radius:3px; overflow:hidden; }
    .pl-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }
    .pl-count { font-size:13px; font-weight:600; color:#202124; min-width:20px; text-align:right; }
    .pl-pct { font-size:12px; color:#5f6368; min-width:32px; text-align:right; }
    .status-row { display:flex; border-top:1px solid #f1f3f4; padding-top:12px; }
    .status-item { flex:1; text-align:center; }
    .si-val { font-size:20px; font-weight:600; margin-bottom:3px; }
    .si-dot { width:8px; height:8px; border-radius:50%; margin:0 auto 3px; }
    .si-label { font-size:11px; color:#5f6368; }

    /* Category */
    .cat-list { display:flex; flex-direction:column; gap:10px; }
    .cat-row { display:flex; align-items:center; gap:8px; }
    .cat-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .cat-label { font-size:13px; color:#202124; min-width:120px; }
    .cat-bar-wrap { flex:1; }
    .cat-bar { height:8px; background:#f1f3f4; border-radius:4px; overflow:hidden; }
    .cat-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .cat-count { font-size:12px; font-weight:600; color:#5f6368; min-width:20px; text-align:right; }

    /* Recent */
    .recent-list { display:flex; flex-direction:column; gap:10px; }
    .recent-row { display:flex; align-items:center; gap:12px; }
    .recent-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .recent-icon .material-icons { font-size:18px; }
    .recent-body { flex:1; overflow:hidden; }
    .recent-title { font-size:13px; font-weight:500; color:#202124; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .recent-meta  { font-size:11px; color:#5f6368; margin-top:2px; }
    .recent-right { display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0; }
    .recent-date  { font-size:11px; color:#80868b; }

    /* Quick links */
    .links-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .link-card { display:flex; align-items:center; gap:12px; padding:16px; background:#fff; border:1px solid #dadce0; border-radius:8px; text-decoration:none; transition:all 0.15s; box-shadow:0 1px 2px rgba(60,64,67,.06); }
    .link-card:hover { border-color:#1a73e8; box-shadow:0 2px 8px rgba(26,115,232,.15); transform:translateY(-1px); }
    .link-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .link-icon .material-icons { font-size:20px; }
    .link-body { flex:1; }
    .link-title { font-size:13px; font-weight:600; color:#202124; margin-bottom:2px; }
    .link-desc  { font-size:11px; color:#5f6368; }
    .link-arrow { font-size:16px !important; color:#dadce0; transition:color 0.15s; }
    .link-card:hover .link-arrow { color:#1a73e8; }

    @media (max-width:1100px) { .stats-row { grid-template-columns:repeat(2,1fr); } .main-grid { grid-template-columns:1fr; } .links-grid { grid-template-columns:repeat(2,1fr); } }
  `]
})
export class TechnicianComponent implements OnInit {
  allTickets: Ticket[] = [];
  currentUser: any = null;

  constructor(private ticketService: TicketService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.ticketService.tickets$.subscribe(t => this.allTickets = t);
  }

  get userName(): string { return this.currentUser?.email?.split('@')[0] || 'Technician'; }
  get timeOfDay(): string { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  get totalTickets(): number { return this.allTickets.length; }
  get openTickets(): Ticket[] { return this.allTickets.filter(t => t.status === 'open' || t.status === 'in-progress'); }
  get openCount(): number { return this.allTickets.filter(t => t.status === 'open').length; }
  get inProgressCount(): number { return this.allTickets.filter(t => t.status === 'in-progress').length; }
  get resolvedCount(): number { return this.allTickets.filter(t => t.status === 'resolved').length; }
  get closedCount(): number { return this.allTickets.filter(t => t.status === 'closed').length; }
  get criticalCount(): number { return this.allTickets.filter(t => t.priority === 'critical' || t.priority === 'high').length; }
  get resolutionRate(): number {
    if (!this.totalTickets) return 0;
    return Math.round(((this.resolvedCount + this.closedCount) / this.totalTickets) * 100);
  }

  get priorityStats() {
    const defs = [
      { label: 'Critical', key: 'critical', color: '#9334e6' },
      { label: 'High',     key: 'high',     color: '#ea4335' },
      { label: 'Medium',   key: 'medium',   color: '#fbbc04' },
      { label: 'Low',      key: 'low',      color: '#34a853' }
    ];
    return defs.map(d => ({
      ...d,
      count: this.allTickets.filter(t => t.priority === d.key).length,
      pct: this.totalTickets ? (this.allTickets.filter(t => t.priority === d.key).length / this.totalTickets) * 100 : 0
    }));
  }

  get statusStats() {
    return [
      { label: 'Open',        count: this.openCount,        color: '#1a73e8' },
      { label: 'In Progress', count: this.inProgressCount,  color: '#fbbc04' },
      { label: 'Resolved',    count: this.resolvedCount,    color: '#34a853' },
      { label: 'Closed',      count: this.closedCount,      color: '#9aa0a6' }
    ];
  }

  get categoryStats() {
    const catMap: Record<string, string> = {
      diagnose_quality: 'Camera System', diagnose_connection: 'Connectivity',
      diagnose_hardware: 'Power & HW', diagnose_software: 'Software',
      diagnose_storage: 'Storage', diagnose_gps: 'GPS'
    };
    const colors: Record<string, string> = {
      'Camera System': '#1a73e8', 'Connectivity': '#34a853', 'Power & HW': '#fbbc04',
      'Software': '#ea4335', 'Storage': '#9334e6', 'GPS': '#00897b'
    };
    const counts: Record<string, number> = {};
    this.allTickets.forEach(t => {
      const l = catMap[t.category] || t.category || 'General';
      counts[l] = (counts[l] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, pct: (count / max) * 100, color: colors[label] || '#9aa0a6' }));
  }

  formatCategory(cat: string): string {
    const map: Record<string, string> = {
      diagnose_quality: 'Camera System', diagnose_connection: 'Connectivity',
      diagnose_hardware: 'Power & Hardware', diagnose_software: 'Software Issues',
      diagnose_storage: 'Storage & Data', diagnose_gps: 'GPS & Location'
    };
    return map[cat] || cat || 'General';
  }

  getPriorityColor(p: string): string {
    const m: Record<string, string> = { critical: '#9334e6', high: '#ea4335', medium: '#fbbc04', low: '#34a853' };
    return m[p] || '#9aa0a6';
  }
}
