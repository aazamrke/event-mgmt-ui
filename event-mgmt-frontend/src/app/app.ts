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
  roles?: ('driver' | 'technician' | 'admin')[];
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
            <a *ngIf="(!item.adminOnly || currentUser.is_admin) && canSee(item)"
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
              <div class="user-role">{{currentUser.role | titlecase}} · ID {{currentUser.id}}</div>
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
      background: #f8f9fa;
    }

    /* Sidebar */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: #fff;
      border-right: 1px solid #dadce0;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease, min-width 0.2s ease;
      overflow: hidden;
      z-index: 100;
      box-shadow: 1px 0 3px rgba(60,64,67,.08);
    }
    .sidebar.collapsed { width: 60px; min-width: 60px; }

    /* Logo */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 14px;
      border-bottom: 1px solid #dadce0;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 34px; height: 34px; border-radius: 8px;
      background: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon mat-icon { color: white; font-size: 20px; }
    .logo-text {
      font-size: 15px; font-weight: 700; white-space: nowrap; color: #202124;
      font-family: 'Google Sans', sans-serif;
    }

    /* Nav */
    .nav {
      flex: 1;
      padding: 8px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 24px;
      color: #5f6368;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      transition: all 0.15s;
      white-space: nowrap;
      width: 100%;
      font-family: 'Google Sans', sans-serif;
    }
    .nav-link mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; color: #5f6368; }
    .nav-link:hover { background: #f1f3f4; color: #202124; }
    .nav-link:hover mat-icon { color: #202124; }
    .nav-link.active { background: #e8f0fe; color: #1a73e8; font-weight: 600; }
    .nav-link.active mat-icon { color: #1a73e8; }

    /* Footer */
    .sidebar-footer {
      padding: 8px;
      border-top: 1px solid #dadce0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 24px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .user-row:hover { background: #f1f3f4; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .user-info { flex: 1; overflow: hidden; }
    .user-email { font-size: 13px; font-weight: 500; color: #202124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role  { font-size: 11px; color: #5f6368; }
    .chevron    { font-size: 16px; width: 16px; height: 16px; color: #5f6368; }
    .collapse-btn { color: #5f6368; }

    /* Menu */
    .menu-user-info { padding: 12px 16px; }
    .menu-email { font-size: 13px; font-weight: 500; color: #202124; }
    .menu-role  { font-size: 11px; color: #5f6368; margin-top: 2px; }

    /* Page */
    .page-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class App implements OnInit {
  currentUser: User | null = null;
  collapsed = false;

  navItems: NavItem[] = [
    { label: 'Calendar',      icon: 'calendar_month',       route: '/calendar' },
    { label: 'Preferences',   icon: 'tune',                 route: '/preferences' },
    { label: 'Tickets',       icon: 'confirmation_number',  route: '/tickets' },
    { label: 'Knowledge Base',icon: 'menu_book',            route: '/knowledge-base',  roles: ['technician', 'admin'] },
    { label: 'Driver',        icon: 'local_shipping',       route: '/driver',          roles: ['driver'] },
    { label: 'Technician',    icon: 'engineering',          route: '/technician',      roles: ['technician', 'admin'] },
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

  canSee(item: NavItem): boolean {
    if (!item.roles) return true;
    const role = (this.currentUser as any)?.role || 'technician';
    return item.roles.includes(role);
  }
}
