import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TicketService } from '../streetview-troubleshoot/services/ticket.service';
import { Ticket, TicketStatus, TicketPriority } from '../streetview-troubleshoot/models/troubleshooting.models';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Tickets</h1>
          <p class="page-sub">{{ filtered.length }} ticket{{ filtered.length !== 1 ? 's' : '' }} found</p>
        </div>
        <button class="btn-primary" (click)="clearFilters()">
          <span class="material-icons">filter_alt_off</span> Clear Filters
        </button>
      </div>

      <!-- Search + Filters bar -->
      <div class="filter-bar">

        <!-- Search -->
        <div class="search-wrap">
          <span class="material-icons si">search</span>
          <input class="search-input" [(ngModel)]="search" (ngModelChange)="applyFilters()"
                 placeholder="Search by vehicle ID, ticket ID or description...">
          <button class="clear-search" *ngIf="search" (click)="search=''; applyFilters()">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Status filter -->
        <div class="filter-group">
          <label>Status</label>
          <div class="chip-row">
            <button *ngFor="let s of statusOptions"
                    class="filter-chip"
                    [class.active]="filterStatus===s.value"
                    (click)="toggleFilter('status', s.value)">
              <span class="chip-dot" [class]="'dot-'+s.value"></span>{{ s.label }}
            </button>
          </div>
        </div>

        <!-- Priority filter -->
        <div class="filter-group">
          <label>Priority</label>
          <div class="chip-row">
            <button *ngFor="let p of priorityOptions"
                    class="filter-chip"
                    [class.active]="filterPriority===p.value"
                    (click)="toggleFilter('priority', p.value)">
              <span class="chip-dot" [class]="'dot-p-'+p.value"></span>{{ p.label }}
            </button>
          </div>
        </div>

        <!-- Category filter -->
        <div class="filter-group">
          <label>Category</label>
          <div class="chip-row">
            <button *ngFor="let c of categoryOptions"
                    class="filter-chip"
                    [class.active]="filterCategory===c"
                    (click)="toggleFilter('category', c)">
              {{ c }}
            </button>
          </div>
        </div>

      </div>

      <!-- Main layout: list + detail -->
      <div class="main-layout" [class.has-detail]="selected">

        <!-- Ticket list -->
        <div class="ticket-list">

          <!-- Empty state -->
          <div class="empty-state" *ngIf="filtered.length === 0">
            <span class="material-icons">inbox</span>
            <h3>No tickets found</h3>
            <p>Try adjusting your search or filters</p>
            <button class="btn-outline" (click)="clearFilters()">Clear all filters</button>
          </div>

          <!-- Ticket cards -->
          <div *ngFor="let t of filtered"
               class="ticket-card"
               [class.active]="selected?.id === t.id"
               [class]="'ticket-card pri-'+t.priority"
               (click)="select(t)">

            <div class="tc-top">
              <span class="tc-id">{{ t.id }}</span>
              <span class="priority-badge" [class]="'pb-'+t.priority">{{ t.priority }}</span>
              <span class="status-badge"   [class]="'sb-'+t.status">{{ t.status }}</span>
            </div>

            <div class="tc-title">{{ t.title }}</div>

            <div class="tc-meta">
              <span><span class="material-icons">directions_car</span>{{ t.cameraId }}</span>
              <span><span class="material-icons">category</span>{{ formatCategory(t.category) }}</span>
              <span><span class="material-icons">schedule</span>{{ t.createdAt | date:'MMM d, y' }}</span>
            </div>

            <div class="tc-desc">{{ t.description | slice:0:100 }}{{ t.description.length > 100 ? '...' : '' }}</div>

          </div>
        </div>

        <!-- Detail panel -->
        <div class="detail-panel" *ngIf="selected">

          <div class="dp-header">
            <div class="dp-title-row">
              <span class="dp-id">{{ selected.id }}</span>
              <button class="icon-btn" (click)="selected=null" matTooltip="Close">
                <span class="material-icons">close</span>
              </button>
            </div>
            <h2 class="dp-title">{{ selected.title }}</h2>
            <div class="dp-badges">
              <span class="priority-badge" [class]="'pb-'+selected.priority">{{ selected.priority }}</span>
              <span class="status-badge"   [class]="'sb-'+selected.status">{{ selected.status }}</span>
              <span class="cat-badge">{{ formatCategory(selected.category) }}</span>
            </div>
          </div>

          <!-- Status update -->
          <div class="dp-section">
            <div class="dp-section-label">Update Status</div>
            <div class="status-btn-row">
              <button *ngFor="let s of statusOptions"
                      class="status-btn"
                      [class.active]="selected.status === s.value"
                      [class]="'status-btn sb-btn-'+s.value"
                      (click)="updateStatus(s.value)">
                <span class="chip-dot" [class]="'dot-'+s.value"></span>{{ s.label }}
              </button>
            </div>
          </div>

          <!-- Details grid -->
          <div class="dp-section">
            <div class="dp-section-label">Details</div>
            <div class="dp-grid">
              <div class="dp-item">
                <span class="material-icons">directions_car</span>
                <div><div class="dp-item-label">Vehicle ID</div><div class="dp-item-val">{{ selected.cameraId }}</div></div>
              </div>
              <div class="dp-item">
                <span class="material-icons">person</span>
                <div><div class="dp-item-label">Reported By</div><div class="dp-item-val">{{ selected.reportedBy }}</div></div>
              </div>
              <div class="dp-item">
                <span class="material-icons">calendar_today</span>
                <div><div class="dp-item-label">Created</div><div class="dp-item-val">{{ selected.createdAt | date:'MMM d, y, h:mm a' }}</div></div>
              </div>
              <div class="dp-item">
                <span class="material-icons">update</span>
                <div><div class="dp-item-label">Updated</div><div class="dp-item-val">{{ selected.updatedAt | date:'MMM d, y, h:mm a' }}</div></div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="dp-section">
            <div class="dp-section-label">Description</div>
            <p class="dp-desc">{{ selected.description || 'No description provided.' }}</p>
          </div>

          <!-- Tags -->
          <div class="dp-section" *ngIf="selected.tags?.length">
            <div class="dp-section-label">Tags</div>
            <div class="tag-row">
              <span *ngFor="let tag of selected.tags" class="tag">{{ tag }}</span>
            </div>
          </div>

          <!-- Resolution -->
          <div class="dp-section">
            <div class="dp-section-label">Resolution Notes</div>
            <textarea class="resolution-input"
                      [(ngModel)]="resolutionText"
                      rows="3"
                      placeholder="Add resolution notes..."></textarea>
            <button class="btn-primary" style="margin-top:8px" (click)="saveResolution()">
              <span class="material-icons">save</span> Save Notes
            </button>
          </div>

          <!-- Delete -->
          <div class="dp-section">
            <button class="btn-delete" (click)="deleteTicket(selected.id)">
              <span class="material-icons">delete</span> Delete Ticket
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 24px 28px; height: 100%; overflow-y: auto;
      background: #f8f9fa; font-family: 'Google Sans','Roboto',sans-serif;
      display: flex; flex-direction: column; gap: 0;
    }

    /* Header */
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
    .page-title  { font-size:22px; font-weight:500; color:#202124; margin:0 0 4px; }
    .page-sub    { font-size:14px; color:#5f6368; margin:0; }
    .btn-primary {
      display:flex; align-items:center; gap:6px; padding:9px 18px;
      border-radius:4px; border:none; background:#1a73e8; color:#fff;
      font-size:13px; font-weight:500; cursor:pointer; font-family:inherit;
      transition:background 0.15s; white-space:nowrap;
    }
    .btn-primary:hover { background:#1557b0; }
    .btn-primary .material-icons { font-size:16px; }
    .btn-outline {
      display:flex; align-items:center; gap:6px; padding:9px 18px;
      border-radius:4px; border:1px solid #dadce0; background:#fff;
      color:#1a73e8; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit;
      transition:all 0.15s;
    }
    .btn-outline:hover { background:#e8f0fe; border-color:#1a73e8; }

    /* Filter bar */
    .filter-bar {
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      padding:16px 20px; margin-bottom:16px;
      display:flex; flex-direction:column; gap:14px;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .search-wrap {
      display:flex; align-items:center; gap:8px;
      background:#f8f9fa; border:1px solid #dadce0; border-radius:24px;
      padding:8px 16px; transition:all 0.15s;
    }
    .search-wrap:focus-within { border-color:#1a73e8; background:#fff; box-shadow:0 0 0 2px #e8f0fe; }
    .si { color:#9aa0a6; font-size:18px; flex-shrink:0; }
    .search-input { flex:1; border:none; outline:none; background:transparent; font-size:14px; color:#202124; font-family:inherit; }
    .search-input::placeholder { color:#9aa0a6; }
    .clear-search { background:none; border:none; cursor:pointer; color:#9aa0a6; display:flex; align-items:center; padding:0; }
    .clear-search:hover { color:#5f6368; }
    .clear-search .material-icons { font-size:16px; }

    .filter-group { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .filter-group label { font-size:12px; font-weight:600; color:#5f6368; text-transform:uppercase; letter-spacing:0.05em; min-width:64px; }
    .chip-row { display:flex; gap:6px; flex-wrap:wrap; }
    .filter-chip {
      display:flex; align-items:center; gap:5px; padding:5px 12px;
      border-radius:16px; border:1px solid #dadce0; background:#fff;
      color:#5f6368; font-size:12px; font-weight:500; cursor:pointer;
      transition:all 0.15s; font-family:inherit;
    }
    .filter-chip:hover { border-color:#1a73e8; color:#1a73e8; background:#e8f0fe; }
    .filter-chip.active { border-color:#1a73e8; background:#e8f0fe; color:#1a73e8; font-weight:600; }
    .chip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dot-open        { background:#1a73e8; }
    .dot-in-progress { background:#fbbc04; }
    .dot-resolved    { background:#34a853; }
    .dot-closed      { background:#9aa0a6; }
    .dot-p-low       { background:#34a853; }
    .dot-p-medium    { background:#fbbc04; }
    .dot-p-high      { background:#ea4335; }
    .dot-p-critical  { background:#9334e6; }

    /* Main layout */
    .main-layout { display:grid; grid-template-columns:1fr; gap:16px; flex:1; min-height:0; }
    .main-layout.has-detail { grid-template-columns:1fr 400px; }

    /* Ticket list */
    .ticket-list { display:flex; flex-direction:column; gap:8px; overflow-y:auto; }
    .empty-state { text-align:center; padding:60px 20px; color:#9aa0a6; }
    .empty-state .material-icons { font-size:48px; display:block; margin:0 auto 12px; color:#dadce0; }
    .empty-state h3 { font-size:18px; font-weight:500; color:#5f6368; margin:0 0 8px; }
    .empty-state p  { font-size:14px; margin:0 0 20px; }

    .ticket-card {
      background:#fff; border:1px solid #dadce0; border-left:4px solid #dadce0;
      border-radius:8px; padding:14px 16px; cursor:pointer;
      transition:all 0.15s; box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .ticket-card:hover { box-shadow:0 2px 8px rgba(60,64,67,.15); transform:translateY(-1px); }
    .ticket-card.active { border-color:#1a73e8; border-left-color:#1a73e8; background:#f8fbff; box-shadow:0 2px 8px rgba(26,115,232,.15); }
    .ticket-card.pri-low      { border-left-color:#34a853; }
    .ticket-card.pri-medium   { border-left-color:#fbbc04; }
    .ticket-card.pri-high     { border-left-color:#ea4335; }
    .ticket-card.pri-critical { border-left-color:#9334e6; }
    .ticket-card.active.pri-low      { border-color:#34a853; }
    .ticket-card.active.pri-medium   { border-color:#fbbc04; }
    .ticket-card.active.pri-high     { border-color:#ea4335; }
    .ticket-card.active.pri-critical { border-color:#9334e6; }

    .tc-top { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .tc-id  { font-size:11px; color:#80868b; font-family:'Roboto Mono',monospace; }
    .tc-title { font-size:14px; font-weight:500; color:#202124; margin-bottom:6px; }
    .tc-meta {
      display:flex; align-items:center; gap:14px; flex-wrap:wrap;
      font-size:11px; color:#5f6368; margin-bottom:6px;
    }
    .tc-meta span { display:flex; align-items:center; gap:3px; }
    .tc-meta .material-icons { font-size:13px; color:#9aa0a6; }
    .tc-desc { font-size:12px; color:#80868b; line-height:1.4; }

    /* Badges */
    .priority-badge, .status-badge, .cat-badge {
      font-size:10px; font-weight:700; padding:2px 8px;
      border-radius:12px; text-transform:uppercase; letter-spacing:0.04em;
    }
    .pb-low      { background:#e6f4ea; color:#137333; }
    .pb-medium   { background:#fef7e0; color:#b06000; }
    .pb-high     { background:#fce8e6; color:#c5221f; }
    .pb-critical { background:#f3e8fd; color:#7627bb; }
    .sb-open        { background:#e8f0fe; color:#1a73e8; }
    .sb-in-progress { background:#fef7e0; color:#b06000; }
    .sb-resolved    { background:#e6f4ea; color:#137333; }
    .sb-closed      { background:#f1f3f4; color:#5f6368; }
    .cat-badge { background:#f1f3f4; color:#5f6368; }

    /* Detail panel */
    .detail-panel {
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      overflow-y:auto; box-shadow:0 1px 2px rgba(60,64,67,.06);
      display:flex; flex-direction:column;
    }
    .dp-header { padding:20px 20px 16px; border-bottom:1px solid #dadce0; }
    .dp-title-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .dp-id { font-size:12px; color:#80868b; font-family:'Roboto Mono',monospace; }
    .icon-btn { background:transparent; border:none; cursor:pointer; color:#5f6368; padding:4px; border-radius:50%; display:flex; align-items:center; transition:all 0.15s; }
    .icon-btn:hover { background:#f1f3f4; color:#202124; }
    .icon-btn .material-icons { font-size:18px; }
    .dp-title { font-size:16px; font-weight:500; color:#202124; margin:0 0 10px; line-height:1.4; }
    .dp-badges { display:flex; gap:6px; flex-wrap:wrap; }

    .dp-section { padding:16px 20px; border-bottom:1px solid #f1f3f4; }
    .dp-section:last-child { border-bottom:none; }
    .dp-section-label { font-size:11px; font-weight:700; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; }

    .status-btn-row { display:flex; gap:6px; flex-wrap:wrap; }
    .status-btn {
      display:flex; align-items:center; gap:5px; padding:6px 12px;
      border-radius:16px; border:1px solid #dadce0; background:#fff;
      font-size:12px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s;
      color:#5f6368;
    }
    .status-btn:hover { border-color:#1a73e8; color:#1a73e8; }
    .status-btn.active.sb-btn-open        { background:#e8f0fe; border-color:#1a73e8; color:#1a73e8; }
    .status-btn.active.sb-btn-in-progress { background:#fef7e0; border-color:#fbbc04; color:#b06000; }
    .status-btn.active.sb-btn-resolved    { background:#e6f4ea; border-color:#34a853; color:#137333; }
    .status-btn.active.sb-btn-closed      { background:#f1f3f4; border-color:#9aa0a6; color:#5f6368; }

    .dp-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .dp-item { display:flex; align-items:flex-start; gap:10px; }
    .dp-item .material-icons { font-size:16px; color:#1a73e8; margin-top:2px; flex-shrink:0; }
    .dp-item-label { font-size:11px; color:#9aa0a6; margin-bottom:2px; }
    .dp-item-val   { font-size:13px; font-weight:500; color:#202124; }

    .dp-desc { font-size:14px; color:#5f6368; line-height:1.6; margin:0; }

    .tag-row { display:flex; gap:6px; flex-wrap:wrap; }
    .tag { padding:3px 10px; border-radius:12px; background:#f1f3f4; color:#5f6368; font-size:12px; }

    .resolution-input {
      width:100%; border:1px solid #dadce0; border-radius:4px;
      padding:10px 12px; font-size:14px; color:#202124; font-family:inherit;
      resize:vertical; outline:none; transition:border-color 0.15s; box-sizing:border-box;
    }
    .resolution-input:focus { border-color:#1a73e8; box-shadow:0 0 0 2px #e8f0fe; }
    .resolution-input::placeholder { color:#9aa0a6; }

    .btn-delete {
      display:flex; align-items:center; gap:6px; padding:8px 16px;
      border-radius:4px; border:1px solid #fce8e6; background:#fff;
      color:#ea4335; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit;
      transition:all 0.15s;
    }
    .btn-delete:hover { background:#fce8e6; }
    .btn-delete .material-icons { font-size:16px; }
  `]
})
export class TicketsComponent implements OnInit {

  all:      Ticket[] = [];
  filtered: Ticket[] = [];
  selected: Ticket | null = null;
  resolutionText = '';

  search         = '';
  filterStatus   = '';
  filterPriority = '';
  filterCategory = '';

  statusOptions   = [
    { label: 'Open',        value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved',    value: 'resolved' },
    { label: 'Closed',      value: 'closed' }
  ];
  priorityOptions = [
    { label: 'Low',      value: 'low' },
    { label: 'Medium',   value: 'medium' },
    { label: 'High',     value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];
  categoryOptions: string[] = [];

  constructor(private ticketService: TicketService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.ticketService.tickets$.subscribe(tickets => {
      this.all = tickets;
      this.categoryOptions = [...new Set(tickets.map(t => this.formatCategory(t.category)).filter(Boolean))];
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const q = this.search.toLowerCase().trim();
    this.filtered = this.all.filter(t => {
      const matchSearch = !q || [t.id, t.cameraId, t.title, t.description]
        .some(f => f?.toLowerCase().includes(q));
      const matchStatus   = !this.filterStatus   || t.status   === this.filterStatus;
      const matchPriority = !this.filterPriority || t.priority === this.filterPriority;
      const matchCategory = !this.filterCategory || this.formatCategory(t.category) === this.filterCategory;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
    // keep selected in sync
    if (this.selected) {
      this.selected = this.all.find(t => t.id === this.selected!.id) || null;
    }
  }

  toggleFilter(type: 'status' | 'priority' | 'category', value: string): void {
    if (type === 'status')   this.filterStatus   = this.filterStatus   === value ? '' : value;
    if (type === 'priority') this.filterPriority = this.filterPriority === value ? '' : value;
    if (type === 'category') this.filterCategory = this.filterCategory === value ? '' : value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.search = ''; this.filterStatus = ''; this.filterPriority = ''; this.filterCategory = '';
    this.applyFilters();
  }

  select(t: Ticket): void {
    this.selected = t;
    this.resolutionText = t.resolution || '';
  }

  updateStatus(status: string): void {
    if (!this.selected) return;
    this.ticketService.updateTicket(this.selected.id, { status: status as TicketStatus }).subscribe(() => {
      this.snackBar.open(`Status updated to ${status}`, 'Close', { duration: 2500 });
      this.applyFilters();
    });
  }

  saveResolution(): void {
    if (!this.selected) return;
    this.ticketService.updateTicket(this.selected.id, { resolution: this.resolutionText }).subscribe(() => {
      this.snackBar.open('Resolution notes saved', 'Close', { duration: 2500 });
    });
  }

  deleteTicket(id: string): void {
    if (!confirm('Delete this ticket?')) return;
    this.ticketService.deleteTicket(id).subscribe(() => {
      this.selected = null;
      this.snackBar.open('Ticket deleted', 'Close', { duration: 2500 });
    });
  }

  formatCategory(cat: string): string {
    const map: Record<string, string> = {
      diagnose_quality:    'Camera System',
      diagnose_connection: 'Connectivity',
      diagnose_hardware:   'Power & Hardware',
      diagnose_software:   'Software Issues',
      diagnose_storage:    'Storage & Data',
      diagnose_gps:        'GPS & Location'
    };
    return map[cat] || cat || 'General';
  }
}
