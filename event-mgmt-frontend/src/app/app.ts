import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './services/auth.service';
import { User } from './models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterModule,
    MatIconModule, MatTooltipModule, MatMenuModule, MatButtonModule, MatDividerModule
  ],
  template: `
    <!-- Auth pages: no sidebar -->
    <router-outlet *ngIf="!currentUser"></router-outlet>

    <!-- App shell with sidebar -->
    <div class="shell" *ngIf="currentUser">

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed">
        <!-- Logo -->
        <div class="logo">
          <div class="logo-icon"><mat-icon>camera_alt</mat-icon></div>
          <span class="logo-text" *ngIf="!collapsed">StreetView AI</span>
        </div>

        <!-- Nav -->
        <nav class="nav">
          <ng-container *ngFor="let item of navItems">
            <a *ngIf="!item.adminOnly || currentUser.is_admin"
               class="nav-link"
               [routerLink]="item.route"
               routerLinkActive="active"
               [matTooltip]="collapsed ? item.label : ''"
               matTooltipPosition="right">
              <mat-icon>{{item.icon}}</mat-icon>
              <span *ngIf="!collapsed">{{item.label}}</span>
            </a>
          </ng-container>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div class="user-row" *ngIf="!collapsed" [matMenuTriggerFor]="userMenu">
            <div class="user-avatar">{{currentUser.email[0].toUpperCase()}}</div>
            <div class="user-info">
              <div class="user-email">{{currentUser.email}}</div>
              <div class="user-role">{{currentUser.is_admin ? 'Admin' : 'User'}} · ID {{currentUser.id}}</div>
            </div>
            <mat-icon class="chevron">expand_more</mat-icon>
          </div>
          <button *ngIf="collapsed" class="nav-link" [matMenuTriggerFor]="userMenu"
                  matTooltip="Account" matTooltipPosition="right">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu" class="dark-menu">
            <div class="menu-user-info">
              <div class="menu-email">{{currentUser.email}}</div>
              <div class="menu-role">{{currentUser.is_admin ? 'Administrator' : 'User'}} · ID {{currentUser.id}}</div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sign out
            </button>
          </mat-menu>

          <button class="nav-link collapse-btn" (click)="collapsed = !collapsed"
                  [matTooltip]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                  matTooltipPosition="right">
            <mat-icon>{{collapsed ? 'chevron_right' : 'chevron_left'}}</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Page content -->
      <div class="page-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    /* Auth pages */
    router-outlet + * { display: block; }

    /* Shell */
    .shell {
      display: flex;
      height: 100vh;
      background: #0f1117;
    }

    /* Sidebar */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: #1a1d27;
      border-right: 1px solid #2d3148;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease, min-width 0.2s ease;
      overflow: hidden;
      z-index: 100;
    }
    .sidebar.collapsed { width: 60px; min-width: 60px; }

    /* Logo */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid #2d3148;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon mat-icon { color: white; font-size: 20px; }
    .logo-text {
      font-size: 15px; font-weight: 700; white-space: nowrap;
      background: linear-gradient(135deg, #818cf8, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    /* Nav */
    .nav {
      flex: 1;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 10px;
      border-radius: 8px;
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      transition: all 0.15s;
      white-space: nowrap;
      width: 100%;
    }
    .nav-link mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .nav-link:hover { background: #2d3148; color: #e2e8f0; }
    .nav-link.active { background: #1e2235; color: #818cf8; }
    .nav-link.active mat-icon { color: #6366f1; }

    /* Footer */
    .sidebar-footer {
      padding: 8px;
      border-top: 1px solid #2d3148;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .user-row:hover { background: #2d3148; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .user-info { flex: 1; overflow: hidden; }
    .user-email { font-size: 13px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role  { font-size: 11px; color: #64748b; }
    .chevron    { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
    .collapse-btn { color: #475569; }

    /* Menu */
    .menu-user-info { padding: 12px 16px; }
    .menu-email { font-size: 13px; font-weight: 500; color: #e2e8f0; }
    .menu-role  { font-size: 11px; color: #64748b; margin-top: 2px; }

    /* Page */
    .page-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class App implements OnInit {
  currentUser: User | null = null;
  collapsed = false;

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',            route: '/dashboard' },
    { label: 'Calendar',      icon: 'calendar_month',       route: '/calendar' },
    { label: 'Preferences',   icon: 'tune',                 route: '/preferences' },
    { label: 'Troubleshoot',  icon: 'build_circle',         route: '/troubleshoot' },
    { label: 'Driver',        icon: 'local_shipping',       route: '/driver' },
    { label: 'Technician',    icon: 'engineering',          route: '/technician' },
    { label: 'Admin',         icon: 'admin_panel_settings', route: '/admin', adminOnly: true }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
