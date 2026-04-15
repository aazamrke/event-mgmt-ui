import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { AdminComponent } from './components/admin/admin.component';
import { StreetviewTroubleshootComponent } from './components/streetview-troubleshoot/streetview-troubleshoot.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard] },
  { path: 'preferences', component: PreferencesComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'troubleshoot', component: StreetviewTroubleshootComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
