import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TripInfo, RouteStop, Incident, IncidentStatus } from './driver.models';

@Component({
  selector: 'app-driver-right-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule],
  template: `
    <div class="right-panel">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab==='route'"    (click)="activeTab='route'">
          <mat-icon>route</mat-icon> Route
        </button>
        <button class="tab" [class.active]="activeTab==='incidents'" (click)="activeTab='incidents'">
          <mat-icon>warning</mat-icon> Incidents
          <span class="tab-badge" *ngIf="openIncidentCount>0">{{openIncidentCount}}</span>
        </button>
        <button class="tab" [class.active]="activeTab==='vehicle'"  (click)="activeTab='vehicle'">
          <mat-icon>directions_car</mat-icon> Vehicle
        </button>
      </div>

      <div class="panel-body">

        <!-- ── ROUTE ── -->
        <ng-container *ngIf="activeTab==='route'">
          <div class="section-header">
            <span>Route Stops</span>
            <span class="progress-text" *ngIf="trip">{{trip.completedStops}}/{{trip.totalStops}}</span>
          </div>

          <div class="empty-state" *ngIf="!trip || trip.stops.length===0">
            <mat-icon>map</mat-icon>
            <p>No active route</p>
          </div>

          <ng-container *ngIf="trip && trip.stops.length>0">
            <div class="progress-row">
              <span class="progress-label">{{routeProgress | number:'1.0-0'}}% complete</span>
              <span class="dist-label">{{trip.distanceKm}} km total</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="routeProgress" class="route-bar"></mat-progress-bar>

            <div class="stops-list">
              <div *ngFor="let stop of trip.stops; let i=index"
                   class="stop-card"
                   [class.stop-active]="stop.status==='arrived'"
                   [class.stop-done]="stop.status==='completed'"
                   [class.stop-skipped]="stop.status==='skipped'">
                <div class="stop-row">
                  <div class="stop-icon">
                    <mat-icon *ngIf="stop.status==='completed'">check_circle</mat-icon>
                    <mat-icon *ngIf="stop.status==='skipped'">skip_next</mat-icon>
                    <mat-icon *ngIf="stop.status==='arrived'">location_on</mat-icon>
                    <span *ngIf="stop.status==='pending'" class="stop-num">{{i+1}}</span>
                  </div>
                  <div class="stop-info">
                    <div class="stop-address">{{stop.address}}</div>
                    <div class="stop-eta"><mat-icon>schedule</mat-icon> ETA: {{stop.eta}}</div>
                    <div class="stop-notes" *ngIf="stop.notes">{{stop.notes}}</div>
                  </div>
                </div>
                <div class="stop-actions" *ngIf="stop.status==='arrived' || stop.status==='pending'">
                  <button class="action-btn success" (click)="completeStop.emit(stop)">
                    <mat-icon>check</mat-icon> Complete
                  </button>
                  <button class="action-btn ghost" (click)="skipStop.emit(stop)">
                    <mat-icon>skip_next</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>

        <!-- ── INCIDENTS ── -->
        <ng-container *ngIf="activeTab==='incidents'">
          <div class="section-header">
            <span>Incidents</span>
            <button class="ghost-btn" (click)="reportIncident.emit()" matTooltip="Report incident">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="incidents.length===0">
            <mat-icon>check_circle</mat-icon>
            <p>No incidents reported</p>
          </div>

          <div class="incident-list">
            <div *ngFor="let inc of incidents" class="incident-card" [class]="'sev-'+inc.severity">
              <div class="inc-top">
                <span class="sev-badge" [class]="'sev-badge-'+inc.severity">{{inc.severity}}</span>
                <span class="inc-status" [class]="'ist-'+inc.status">{{inc.status}}</span>
                <span class="inc-time">{{inc.reportedAt | date:'h:mm a'}}</span>
              </div>
              <div class="inc-title">{{inc.title}}</div>
              <div class="inc-location"><mat-icon>place</mat-icon>{{inc.location}}</div>
              <div class="inc-actions">
                <button class="action-btn success" *ngIf="inc.status==='open'"
                        (click)="acknowledgeIncident.emit(inc.id)">
                  <mat-icon>thumb_up</mat-icon> Acknowledge
                </button>
                <button class="action-btn ghost" *ngIf="inc.status==='acknowledged'"
                        (click)="resolveIncident.emit(inc.id)">
                  <mat-icon>check</mat-icon> Resolve
                </button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- ── VEHICLE ── -->
        <ng-container *ngIf="activeTab==='vehicle'">
          <div class="section-header">
            <span>Vehicle Status</span>
            <button class="ghost-btn" (click)="refreshVehicle.emit()" matTooltip="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="!trip">
            <mat-icon>hourglass_empty</mat-icon><p>Loading...</p>
          </div>

          <div class="status-grid" *ngIf="trip">
            <div class="stat-card">
              <div class="stat-label"><mat-icon>badge</mat-icon> Vehicle ID</div>
              <span class="stat-value mono">{{trip.vehicleId}}</span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>speed</mat-icon> Speed</div>
              <span class="stat-value" [class.green]="trip.speedKmh<=80" [class.yellow]="trip.speedKmh>80&&trip.speedKmh<=100" [class.red]="trip.speedKmh>100">
                {{trip.speedKmh}} km/h
              </span>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>local_gas_station</mat-icon> Fuel Level</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill"
                       [class.bar-green]="trip.fuelLevel>50"
                       [class.bar-yellow]="trip.fuelLevel<=50&&trip.fuelLevel>20"
                       [class.bar-red]="trip.fuelLevel<=20"
                       [style.width.%]="trip.fuelLevel"></div>
                </div>
                <span class="bar-val">{{trip.fuelLevel}}%</span>
              </div>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>thermostat</mat-icon> Engine Temp</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill"
                       [class.bar-green]="trip.engineTemp<=90"
                       [class.bar-yellow]="trip.engineTemp>90&&trip.engineTemp<=110"
                       [class.bar-red]="trip.engineTemp>110"
                       [style.width.%]="(trip.engineTemp/150)*100"></div>
                </div>
                <span class="bar-val">{{trip.engineTemp}}°C</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>person</mat-icon> Driver</div>
              <span class="stat-value small">{{trip.driverName}}</span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>schedule</mat-icon> Started</div>
              <span class="stat-value small">{{trip.startTime | date:'h:mm a'}}</span>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .right-panel { display:flex; flex-direction:column; height:100%; background:#0f1117; color:#e2e8f0; }

    .tab-bar { display:flex; border-bottom:1px solid #2d3148; background:#1a1d27; flex-shrink:0; }
    .tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:12px 8px;
      background:transparent; border:none; border-bottom:2px solid transparent;
      color:#64748b; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; white-space:nowrap;
    }
    .tab mat-icon { font-size:16px; width:16px; height:16px; }
    .tab:hover { color:#94a3b8; background:#1e2235; }
    .tab.active { color:#10b981; border-bottom-color:#10b981; }
    .tab-badge { background:#ef4444; color:white; border-radius:10px; padding:1px 6px; font-size:10px; font-weight:700; }

    .panel-body { flex:1; overflow-y:auto; padding:16px; }
    .panel-body::-webkit-scrollbar { width:4px; }
    .panel-body::-webkit-scrollbar-thumb { background:#2d3148; border-radius:2px; }

    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .section-header span { font-size:14px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; }
    .progress-text { font-size:13px; color:#10b981; font-weight:600; }
    .ghost-btn {
      background:transparent; border:none; cursor:pointer; color:#64748b;
      padding:4px; border-radius:6px; display:flex; align-items:center; transition:all 0.15s;
    }
    .ghost-btn:hover { color:#10b981; background:#1e2235; }
    .ghost-btn mat-icon { font-size:18px; width:18px; height:18px; }

    .empty-state { text-align:center; padding:48px 20px; color:#475569; }
    .empty-state mat-icon { font-size:40px; width:40px; height:40px; display:block; margin:0 auto 12px; }
    .empty-state p { margin:0; font-size:14px; }

    /* Route */
    .progress-row { display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:6px; }
    .dist-label { color:#94a3b8; }
    .route-bar { border-radius:4px; margin-bottom:16px; }
    ::ng-deep .route-bar .mdc-linear-progress__bar-inner { border-color:#10b981 !important; }
    ::ng-deep .route-bar .mdc-linear-progress__buffer-bar { background:#2d3148 !important; }

    .stops-list { display:flex; flex-direction:column; gap:8px; }
    .stop-card { background:#1a1d27; border:1px solid #2d3148; border-radius:10px; padding:12px; transition:all 0.2s; }
    .stop-card.stop-active  { border-color:#10b981; background:#0d1f18; }
    .stop-card.stop-done    { border-color:#166534; background:#0d1f12; opacity:0.75; }
    .stop-card.stop-skipped { border-color:#78350f; background:#1c1508; opacity:0.6; }

    .stop-row { display:flex; gap:10px; }
    .stop-icon {
      width:28px; height:28px; border-radius:50%; background:#2d3148;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .stop-card.stop-active .stop-icon { background:#10b981; }
    .stop-card.stop-done   .stop-icon { background:#166534; }
    .stop-icon mat-icon { font-size:16px; width:16px; height:16px; color:white; }
    .stop-num { font-size:12px; font-weight:700; color:#94a3b8; }
    .stop-info { flex:1; }
    .stop-address { font-size:13px; font-weight:600; color:#e2e8f0; margin-bottom:3px; }
    .stop-eta { display:flex; align-items:center; gap:4px; font-size:11px; color:#64748b; }
    .stop-eta mat-icon { font-size:12px; width:12px; height:12px; }
    .stop-notes { font-size:11px; color:#475569; margin-top:3px; font-style:italic; }

    .stop-actions { display:flex; gap:6px; margin-top:10px; }
    .action-btn {
      display:flex; align-items:center; gap:4px; padding:6px 12px;
      border-radius:7px; border:none; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s;
    }
    .action-btn mat-icon { font-size:14px; width:14px; height:14px; }
    .action-btn.success { background:#166534; color:#4ade80; }
    .action-btn.success:hover { background:#15803d; }
    .action-btn.ghost { background:#2d3148; color:#94a3b8; }
    .action-btn.ghost:hover { background:#374151; }

    /* Incidents */
    .incident-list { display:flex; flex-direction:column; gap:8px; }
    .incident-card { background:#1a1d27; border:1px solid #2d3148; border-left:3px solid #2d3148; border-radius:10px; padding:12px; }
    .incident-card.sev-low      { border-left-color:#22c55e; }
    .incident-card.sev-medium   { border-left-color:#f59e0b; }
    .incident-card.sev-high     { border-left-color:#ef4444; }
    .incident-card.sev-critical { border-left-color:#a855f7; }

    .inc-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
    .sev-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; text-transform:uppercase; }
    .sev-badge-low      { background:#052e16; color:#4ade80; }
    .sev-badge-medium   { background:#3d2000; color:#fb923c; }
    .sev-badge-high     { background:#450a0a; color:#f87171; }
    .sev-badge-critical { background:#2e1065; color:#c084fc; }
    .inc-status { font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; text-transform:uppercase; }
    .ist-open         { background:#1e3a5f; color:#60a5fa; }
    .ist-acknowledged { background:#3d2000; color:#fb923c; }
    .ist-resolved     { background:#052e16; color:#4ade80; }
    .inc-time { font-size:11px; color:#475569; margin-left:auto; }
    .inc-title { font-size:13px; font-weight:600; color:#e2e8f0; margin-bottom:4px; }
    .inc-location { display:flex; align-items:center; gap:4px; font-size:11px; color:#64748b; margin-bottom:8px; }
    .inc-location mat-icon { font-size:13px; width:13px; height:13px; }
    .inc-actions { display:flex; gap:6px; }

    /* Vehicle */
    .status-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .stat-card { background:#1a1d27; border:1px solid #2d3148; border-radius:10px; padding:12px; }
    .stat-card.full { grid-column:1/-1; }
    .stat-label { display:flex; align-items:center; gap:6px; font-size:11px; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em; }
    .stat-label mat-icon { font-size:14px; width:14px; height:14px; }
    .stat-value { font-size:14px; font-weight:600; color:#e2e8f0; }
    .stat-value.mono { font-family:monospace; font-size:12px; }
    .stat-value.small { font-size:12px; }
    .stat-value.green  { color:#22c55e; }
    .stat-value.yellow { color:#f59e0b; }
    .stat-value.red    { color:#ef4444; }
    .bar-row { display:flex; align-items:center; gap:8px; }
    .mini-bar { flex:1; height:6px; background:#2d3148; border-radius:3px; overflow:hidden; }
    .mini-fill { height:100%; border-radius:3px; transition:width 0.4s ease; }
    .bar-green  { background:#22c55e; }
    .bar-yellow { background:#f59e0b; }
    .bar-red    { background:#ef4444; }
    .bar-val { font-size:12px; font-weight:600; color:#94a3b8; min-width:40px; text-align:right; }
  `]
})
export class DriverRightPanelComponent implements OnChanges {
  @Input() trip: TripInfo | null = null;
  @Input() incidents: Incident[] = [];
  @Input() activeTab = 'route';

  @Output() completeStop        = new EventEmitter<RouteStop>();
  @Output() skipStop            = new EventEmitter<RouteStop>();
  @Output() reportIncident      = new EventEmitter<void>();
  @Output() acknowledgeIncident = new EventEmitter<string>();
  @Output() resolveIncident     = new EventEmitter<string>();
  @Output() refreshVehicle      = new EventEmitter<void>();

  ngOnChanges(): void {}

  get routeProgress(): number {
    if (!this.trip || !this.trip.totalStops) return 0;
    return (this.trip.completedStops / this.trip.totalStops) * 100;
  }

  get openIncidentCount(): number {
    return this.incidents.filter(i => i.status === 'open').length;
  }
}
