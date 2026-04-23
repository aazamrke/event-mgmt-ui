import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TripInfo, RouteStop, Incident } from './driver.models';

@Component({
  selector: 'app-driver-right-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule],
  template: `
    <div class="right-panel">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab==='route'" (click)="activeTab='route'">
          <mat-icon>route</mat-icon> Route
        </button>
        <button class="tab" [class.active]="activeTab==='incidents'" (click)="activeTab='incidents'">
          <mat-icon>warning_amber</mat-icon> Incidents
          <span class="tab-badge" *ngIf="openIncidentCount>0">{{openIncidentCount}}</span>
        </button>
        <button class="tab" [class.active]="activeTab==='vehicle'" (click)="activeTab='vehicle'">
          <mat-icon>directions_car</mat-icon> Vehicle
        </button>
      </div>

      <div class="panel-body">

        <!-- ROUTE -->
        <ng-container *ngIf="activeTab==='route'">
          <div class="section-header">
            <span>Route Stops</span>
            <span class="progress-chip" *ngIf="trip">{{trip.completedStops}}/{{trip.totalStops}} done</span>
          </div>

          <div class="empty-state" *ngIf="!trip || trip.stops.length===0">
            <mat-icon>map</mat-icon>
            <p>No active route</p>
          </div>

          <ng-container *ngIf="trip && trip.stops.length>0">
            <div class="progress-row">
              <span class="progress-label">{{routeProgress | number:'1.0-0'}}% complete</span>
              <span class="dist-label"><mat-icon>straighten</mat-icon>{{trip.distanceKm}} km</span>
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
                    <mat-icon *ngIf="stop.status==='completed'" class="icon-green">check_circle</mat-icon>
                    <mat-icon *ngIf="stop.status==='skipped'" class="icon-grey">skip_next</mat-icon>
                    <mat-icon *ngIf="stop.status==='arrived'" class="icon-blue">location_on</mat-icon>
                    <span *ngIf="stop.status==='pending'" class="stop-num">{{i+1}}</span>
                  </div>
                  <div class="stop-info">
                    <div class="stop-address">{{stop.address}}</div>
                    <div class="stop-eta"><mat-icon>schedule</mat-icon>ETA: {{stop.eta}}</div>
                    <div class="stop-notes" *ngIf="stop.notes">📝 {{stop.notes}}</div>
                  </div>
                </div>
                <div class="stop-actions" *ngIf="stop.status==='arrived' || stop.status==='pending'">
                  <button class="btn-primary-sm" (click)="completeStop.emit(stop)">
                    <mat-icon>check</mat-icon> Complete
                  </button>
                  <button class="btn-ghost-sm" (click)="skipStop.emit(stop)">
                    <mat-icon>skip_next</mat-icon> Skip
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>

        <!-- INCIDENTS -->
        <ng-container *ngIf="activeTab==='incidents'">
          <div class="section-header">
            <span>Incidents</span>
            <button class="icon-btn" (click)="reportIncident.emit()" matTooltip="Report new incident">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="incidents.length===0">
            <mat-icon class="icon-green">check_circle</mat-icon>
            <p>No incidents reported</p>
          </div>

          <div class="incident-list">
            <div *ngFor="let inc of incidents" class="incident-card" [class]="'sev-'+inc.severity">
              <div class="inc-top">
                <span class="sev-badge" [class]="'sev-'+inc.severity">{{inc.severity}}</span>
                <span class="status-chip" [class]="'st-'+inc.status">{{inc.status}}</span>
                <span class="inc-time">{{inc.reportedAt | date:'h:mm a'}}</span>
              </div>
              <div class="inc-title">{{inc.title}}</div>
              <div class="inc-location"><mat-icon>place</mat-icon>{{inc.location}}</div>
              <div class="inc-actions">
                <button class="btn-primary-sm" *ngIf="inc.status==='open'"
                        (click)="acknowledgeIncident.emit(inc.id)">
                  <mat-icon>thumb_up</mat-icon> Acknowledge
                </button>
                <button class="btn-ghost-sm" *ngIf="inc.status==='acknowledged'"
                        (click)="resolveIncident.emit(inc.id)">
                  <mat-icon>check</mat-icon> Resolve
                </button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- VEHICLE -->
        <ng-container *ngIf="activeTab==='vehicle'">
          <div class="section-header">
            <span>Vehicle Status</span>
            <button class="icon-btn" (click)="refreshVehicle.emit()" matTooltip="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <div class="empty-state" *ngIf="!trip">
            <mat-icon>hourglass_empty</mat-icon><p>Loading...</p>
          </div>

          <div class="status-grid" *ngIf="trip">
            <div class="stat-card">
              <div class="stat-label"><mat-icon>badge</mat-icon>Vehicle ID</div>
              <span class="stat-value mono">{{trip.vehicleId}}</span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>speed</mat-icon>Speed</div>
              <span class="stat-value"
                    [class.val-green]="trip.speedKmh<=80"
                    [class.val-yellow]="trip.speedKmh>80&&trip.speedKmh<=100"
                    [class.val-red]="trip.speedKmh>100">
                {{trip.speedKmh}} km/h
              </span>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>local_gas_station</mat-icon>Fuel Level</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill"
                       [class.fill-green]="trip.fuelLevel>50"
                       [class.fill-yellow]="trip.fuelLevel<=50&&trip.fuelLevel>20"
                       [class.fill-red]="trip.fuelLevel<=20"
                       [style.width.%]="trip.fuelLevel"></div>
                </div>
                <span class="bar-val">{{trip.fuelLevel}}%</span>
              </div>
            </div>
            <div class="stat-card full">
              <div class="stat-label"><mat-icon>thermostat</mat-icon>Engine Temp</div>
              <div class="bar-row">
                <div class="mini-bar">
                  <div class="mini-fill"
                       [class.fill-green]="trip.engineTemp<=90"
                       [class.fill-yellow]="trip.engineTemp>90&&trip.engineTemp<=110"
                       [class.fill-red]="trip.engineTemp>110"
                       [style.width.%]="(trip.engineTemp/150)*100"></div>
                </div>
                <span class="bar-val">{{trip.engineTemp}}°C</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>person</mat-icon>Driver</div>
              <span class="stat-value small">{{trip.driverName}}</span>
            </div>
            <div class="stat-card">
              <div class="stat-label"><mat-icon>schedule</mat-icon>Started</div>
              <span class="stat-value small">{{trip.startTime | date:'h:mm a'}}</span>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .right-panel {
      display:flex; flex-direction:column; height:100%;
      background:#f8f9fa; font-family:'Google Sans','Roboto',sans-serif;
    }

    /* Tab bar */
    .tab-bar {
      display:flex; background:#fff;
      border-bottom:1px solid #dadce0;
      box-shadow:0 1px 3px rgba(60,64,67,.08); flex-shrink:0;
    }
    .tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
      padding:14px 8px; background:transparent; border:none;
      border-bottom:3px solid transparent;
      color:#5f6368; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s; white-space:nowrap;
      font-family:inherit;
    }
    .tab mat-icon { font-size:16px; width:16px; height:16px; }
    .tab:hover { color:#1a73e8; background:#f8f9fa; }
    .tab.active { color:#1a73e8; border-bottom-color:#1a73e8; }
    .tab-badge {
      background:#ea4335; color:#fff; border-radius:10px;
      padding:1px 6px; font-size:10px; font-weight:700;
    }

    /* Panel body */
    .panel-body { flex:1; overflow-y:auto; padding:16px; }
    .panel-body::-webkit-scrollbar { width:6px; }
    .panel-body::-webkit-scrollbar-thumb { background:#dadce0; border-radius:3px; }

    .section-header {
      display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;
    }
    .section-header > span {
      font-size:13px; font-weight:500; color:#5f6368;
      text-transform:uppercase; letter-spacing:0.06em;
    }
    .progress-chip {
      font-size:12px; font-weight:500; color:#1a73e8;
      background:#e8f0fe; padding:3px 10px; border-radius:12px;
    }
    .icon-btn {
      background:transparent; border:none; cursor:pointer; color:#5f6368;
      padding:4px; border-radius:50%; display:flex; align-items:center;
      transition:all 0.15s;
    }
    .icon-btn:hover { color:#1a73e8; background:#e8f0fe; }
    .icon-btn mat-icon { font-size:18px; width:18px; height:18px; }

    /* Empty state */
    .empty-state { text-align:center; padding:48px 20px; color:#9aa0a6; }
    .empty-state mat-icon { font-size:40px; width:40px; height:40px; display:block; margin:0 auto 12px; color:#dadce0; }
    .empty-state p { margin:0; font-size:14px; color:#5f6368; }

    /* Route */
    .progress-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#5f6368; margin-bottom:6px; }
    .progress-label { font-weight:500; color:#1a73e8; }
    .dist-label { display:flex; align-items:center; gap:3px; color:#80868b; }
    .dist-label mat-icon { font-size:13px; width:13px; height:13px; }
    .route-bar { border-radius:4px; margin-bottom:16px; }
    ::ng-deep .route-bar .mdc-linear-progress__bar-inner { border-color:#1a73e8 !important; }
    ::ng-deep .route-bar .mdc-linear-progress__buffer-bar { background:#e8f0fe !important; }

    .stops-list { display:flex; flex-direction:column; gap:8px; }
    .stop-card {
      background:#fff; border:1px solid #dadce0; border-radius:8px;
      padding:12px; transition:box-shadow 0.2s;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .stop-card:hover { box-shadow:0 2px 6px rgba(60,64,67,.15); }
    .stop-card.stop-active { border-color:#1a73e8; border-left:3px solid #1a73e8; }
    .stop-card.stop-done   { border-color:#34a853; border-left:3px solid #34a853; opacity:0.8; }
    .stop-card.stop-skipped { border-color:#dadce0; opacity:0.55; }

    .stop-row { display:flex; gap:10px; }
    .stop-icon {
      width:28px; height:28px; border-radius:50%; background:#f1f3f4;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .stop-card.stop-active .stop-icon { background:#e8f0fe; }
    .stop-card.stop-done   .stop-icon { background:#e6f4ea; }
    .icon-green { color:#34a853; font-size:16px; width:16px; height:16px; }
    .icon-blue  { color:#1a73e8; font-size:16px; width:16px; height:16px; }
    .icon-grey  { color:#9aa0a6; font-size:16px; width:16px; height:16px; }
    .stop-num { font-size:12px; font-weight:700; color:#5f6368; }
    .stop-info { flex:1; }
    .stop-address { font-size:13px; font-weight:500; color:#202124; margin-bottom:3px; }
    .stop-eta { display:flex; align-items:center; gap:4px; font-size:11px; color:#5f6368; }
    .stop-eta mat-icon { font-size:12px; width:12px; height:12px; }
    .stop-notes { font-size:11px; color:#80868b; margin-top:3px; }

    .stop-actions { display:flex; gap:8px; margin-top:10px; }

    /* Buttons */
    .btn-primary-sm {
      display:flex; align-items:center; gap:4px; padding:6px 14px;
      border-radius:4px; border:none; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit;
      background:#1a73e8; color:#fff;
    }
    .btn-primary-sm:hover { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .btn-primary-sm mat-icon { font-size:14px; width:14px; height:14px; }
    .btn-ghost-sm {
      display:flex; align-items:center; gap:4px; padding:6px 14px;
      border-radius:4px; border:1px solid #dadce0; font-size:13px; font-weight:500;
      cursor:pointer; transition:all 0.15s; font-family:inherit;
      background:#fff; color:#5f6368;
    }
    .btn-ghost-sm:hover { background:#f8f9fa; border-color:#1a73e8; color:#1a73e8; }
    .btn-ghost-sm mat-icon { font-size:14px; width:14px; height:14px; }

    /* Incidents */
    .incident-list { display:flex; flex-direction:column; gap:8px; }
    .incident-card {
      background:#fff; border:1px solid #dadce0; border-left:4px solid #dadce0;
      border-radius:8px; padding:12px;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .incident-card.sev-low      { border-left-color:#34a853; }
    .incident-card.sev-medium   { border-left-color:#fbbc04; }
    .incident-card.sev-high     { border-left-color:#ea4335; }
    .incident-card.sev-critical { border-left-color:#9334e6; }

    .inc-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
    .sev-badge {
      font-size:10px; font-weight:700; padding:2px 8px;
      border-radius:12px; text-transform:uppercase; letter-spacing:0.04em;
    }
    .sev-badge.sev-low      { background:#e6f4ea; color:#137333; }
    .sev-badge.sev-medium   { background:#fef7e0; color:#b06000; }
    .sev-badge.sev-high     { background:#fce8e6; color:#c5221f; }
    .sev-badge.sev-critical { background:#f3e8fd; color:#7627bb; }
    .status-chip {
      font-size:10px; font-weight:600; padding:2px 8px;
      border-radius:12px; text-transform:uppercase;
    }
    .st-open         { background:#e8f0fe; color:#1a73e8; }
    .st-acknowledged { background:#fef7e0; color:#b06000; }
    .st-resolved     { background:#e6f4ea; color:#137333; }
    .inc-time { font-size:11px; color:#80868b; margin-left:auto; }
    .inc-title { font-size:13px; font-weight:500; color:#202124; margin-bottom:4px; }
    .inc-location {
      display:flex; align-items:center; gap:4px;
      font-size:11px; color:#5f6368; margin-bottom:8px;
    }
    .inc-location mat-icon { font-size:13px; width:13px; height:13px; color:#ea4335; }
    .inc-actions { display:flex; gap:8px; }

    /* Vehicle status grid */
    .status-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .stat-card {
      background:#fff; border:1px solid #dadce0; border-radius:8px; padding:12px;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .stat-card.full { grid-column:1/-1; }
    .stat-label {
      display:flex; align-items:center; gap:6px;
      font-size:11px; color:#5f6368; margin-bottom:6px;
      text-transform:uppercase; letter-spacing:0.05em;
    }
    .stat-label mat-icon { font-size:14px; width:14px; height:14px; color:#1a73e8; }
    .stat-value { font-size:14px; font-weight:500; color:#202124; }
    .stat-value.mono { font-family:'Roboto Mono',monospace; font-size:12px; }
    .stat-value.small { font-size:12px; }
    .val-green  { color:#34a853; }
    .val-yellow { color:#f9ab00; }
    .val-red    { color:#ea4335; }

    .bar-row { display:flex; align-items:center; gap:8px; }
    .mini-bar { flex:1; height:6px; background:#f1f3f4; border-radius:3px; overflow:hidden; }
    .mini-fill { height:100%; border-radius:3px; transition:width 0.4s ease; }
    .fill-green  { background:#34a853; }
    .fill-yellow { background:#fbbc04; }
    .fill-red    { background:#ea4335; }
    .bar-val { font-size:12px; font-weight:500; color:#5f6368; min-width:40px; text-align:right; }
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
