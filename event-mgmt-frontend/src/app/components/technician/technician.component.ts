import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
        <div>
          <h1 class="title">Technician Dashboard</h1>
          <p class="sub">Welcome! Manage camera systems, tickets and knowledge base from here.</p>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e8f0fe">
            <span class="material-icons" style="color:#1a73e8">confirmation_number</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">—</div>
            <div class="stat-label">Open Tickets</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e6f4ea">
            <span class="material-icons" style="color:#34a853">check_circle</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">—</div>
            <div class="stat-label">Resolved Today</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef7e0">
            <span class="material-icons" style="color:#f9ab00">menu_book</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">—</div>
            <div class="stat-label">KB Documents</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce8e6">
            <span class="material-icons" style="color:#ea4335">local_shipping</span>
          </div>
          <div class="stat-body">
            <div class="stat-val">—</div>
            <div class="stat-label">Active Drivers</div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="links-grid">
        <a routerLink="/tickets" class="link-card">
          <div class="link-icon" style="background:#e8f0fe">
            <span class="material-icons" style="color:#1a73e8">confirmation_number</span>
          </div>
          <div class="link-body">
            <div class="link-title">Tickets</div>
            <div class="link-desc">View and manage all support tickets</div>
          </div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/driver" class="link-card">
          <div class="link-icon" style="background:#e6f4ea">
            <span class="material-icons" style="color:#34a853">local_shipping</span>
          </div>
          <div class="link-body">
            <div class="link-title">Driver Portal</div>
            <div class="link-desc">Monitor driver trips and incidents</div>
          </div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/knowledge-base" class="link-card">
          <div class="link-icon" style="background:#fef7e0">
            <span class="material-icons" style="color:#f9ab00">menu_book</span>
          </div>
          <div class="link-body">
            <div class="link-title">Knowledge Base</div>
            <div class="link-desc">Upload documents and manage vector DB</div>
          </div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
        <a routerLink="/calendar" class="link-card">
          <div class="link-icon" style="background:#f3e8fd">
            <span class="material-icons" style="color:#9334e6">calendar_month</span>
          </div>
          <div class="link-body">
            <div class="link-title">Calendar</div>
            <div class="link-desc">View and book available time slots</div>
          </div>
          <span class="material-icons link-arrow">arrow_forward</span>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .page { padding:28px 32px; background:#f8f9fa; height:100%; overflow-y:auto; font-family:'Google Sans','Roboto',sans-serif; }

    .header-card {
      display:flex; align-items:center; gap:16px;
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      padding:20px 24px; box-shadow:0 1px 3px rgba(60,64,67,.1);
      border-left:4px solid #1a73e8; margin-bottom:20px;
    }
    .header-icon { width:48px; height:48px; border-radius:12px; background:#e8f0fe; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .header-icon .material-icons { font-size:26px; color:#1a73e8; }
    .title { font-size:20px; font-weight:600; color:#202124; margin:0 0 4px; }
    .sub   { font-size:14px; color:#5f6368; margin:0; }

    /* Stats */
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
    .stat-card { background:#fff; border:1px solid #dadce0; border-radius:8px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 2px rgba(60,64,67,.06); }
    .stat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon .material-icons { font-size:22px; }
    .stat-val   { font-size:22px; font-weight:600; color:#202124; }
    .stat-label { font-size:12px; color:#5f6368; margin-top:2px; }

    /* Quick links */
    .links-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
    .link-card {
      display:flex; align-items:center; gap:14px; padding:18px;
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      text-decoration:none; transition:all 0.15s;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .link-card:hover { border-color:#1a73e8; box-shadow:0 2px 8px rgba(26,115,232,.15); transform:translateY(-1px); }
    .link-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .link-icon .material-icons { font-size:22px; }
    .link-body { flex:1; }
    .link-title { font-size:14px; font-weight:600; color:#202124; margin-bottom:3px; }
    .link-desc  { font-size:12px; color:#5f6368; }
    .link-arrow { font-size:18px !important; color:#dadce0; transition:color 0.15s; }
    .link-card:hover .link-arrow { color:#1a73e8; }

    @media (max-width:900px) { .stats-row { grid-template-columns:repeat(2,1fr); } .links-grid { grid-template-columns:1fr; } }
  `]
})
export class TechnicianComponent {}
