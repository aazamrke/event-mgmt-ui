import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CameraStatus } from './models/troubleshooting.models';

@Component({
  selector: 'app-camera-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="status-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>videocam</mat-icon>
          Camera Status
        </mat-card-title>
        <button mat-icon-button (click)="refresh()" matTooltip="Refresh">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content *ngIf="cameraStatus">
        <div class="status-item">
          <div class="status-label">
            <mat-icon>badge</mat-icon>
            Camera ID
          </div>
          <div class="status-value">{{cameraStatus.cameraId}}</div>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>wifi</mat-icon>
            Connection
          </div>
          <mat-chip [class]="cameraStatus.online ? 'chip-online' : 'chip-offline'">
            {{cameraStatus.online ? 'Online' : 'Offline'}}
          </mat-chip>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>battery_charging_full</mat-icon>
            Battery
          </div>
          <div class="status-value">
            <mat-progress-bar 
              mode="determinate" 
              [value]="cameraStatus.batteryLevel"
              [class]="getBatteryClass()">
            </mat-progress-bar>
            <span>{{cameraStatus.batteryLevel}}%</span>
          </div>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>storage</mat-icon>
            Storage
          </div>
          <div class="status-value">
            <mat-progress-bar 
              mode="determinate" 
              [value]="cameraStatus.storageUsed">
            </mat-progress-bar>
            <span>{{cameraStatus.storageUsed}}%</span>
          </div>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>gps_fixed</mat-icon>
            GPS Signal
          </div>
          <mat-chip [class]="'chip-gps-' + cameraStatus.gpsSignal">
            {{cameraStatus.gpsSignal | uppercase}}
          </mat-chip>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>photo_camera</mat-icon>
            Image Quality
          </div>
          <div class="status-value">
            <mat-progress-bar 
              mode="determinate" 
              [value]="cameraStatus.imageQuality"
              class="quality-bar">
            </mat-progress-bar>
            <span>{{cameraStatus.imageQuality}}%</span>
          </div>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>thermostat</mat-icon>
            Temperature
          </div>
          <div class="status-value">
            <span [class]="getTempClass()">{{cameraStatus.temperature}}°C</span>
          </div>
        </div>

        <div class="status-item">
          <div class="status-label">
            <mat-icon>schedule</mat-icon>
            Last Ping
          </div>
          <div class="status-value">{{cameraStatus.lastPing | date:'short'}}</div>
        </div>

        <div class="errors-section" *ngIf="cameraStatus.errors.length > 0">
          <div class="errors-header">
            <mat-icon>error</mat-icon>
            <span>Active Errors ({{cameraStatus.errors.length}})</span>
          </div>
          <div class="error-item" *ngFor="let error of cameraStatus.errors">
            {{error}}
          </div>
        </div>
      </mat-card-content>

      <div class="loading" *ngIf="!cameraStatus">
        <mat-icon>hourglass_empty</mat-icon>
        <p>Loading camera status...</p>
      </div>
    </mat-card>
  `,
  styles: [`
    .status-card {
      height: fit-content;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .status-item:last-child {
      border-bottom: none;
    }
    .status-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }
    .status-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .status-value {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .status-value mat-progress-bar {
      width: 80px;
    }
    .chip-online {
      background: #4caf50;
      color: white;
    }
    .chip-offline {
      background: #f44336;
      color: white;
    }
    .chip-gps-excellent {
      background: #4caf50;
      color: white;
    }
    .chip-gps-good {
      background: #8bc34a;
      color: white;
    }
    .chip-gps-weak {
      background: #ff9800;
      color: white;
    }
    .chip-gps-none {
      background: #f44336;
      color: white;
    }
    .battery-low {
      color: #f44336;
    }
    .battery-medium {
      color: #ff9800;
    }
    .battery-high {
      color: #4caf50;
    }
    .temp-normal {
      color: #4caf50;
    }
    .temp-warning {
      color: #ff9800;
    }
    .temp-critical {
      color: #f44336;
    }
    .errors-section {
      margin-top: 16px;
      padding: 12px;
      background: #ffebee;
      border-radius: 4px;
    }
    .errors-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .error-item {
      padding: 4px 0;
      font-size: 13px;
      color: #c62828;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    .loading mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class CameraStatusComponent {
  @Input() cameraStatus: CameraStatus | null = null;
  @Output() refreshStatus = new EventEmitter<void>();

  refresh(): void {
    this.refreshStatus.emit();
  }

  getBatteryClass(): string {
    if (!this.cameraStatus) return '';
    if (this.cameraStatus.batteryLevel < 20) return 'battery-low';
    if (this.cameraStatus.batteryLevel < 50) return 'battery-medium';
    return 'battery-high';
  }

  getTempClass(): string {
    if (!this.cameraStatus) return '';
    if (this.cameraStatus.temperature > 60) return 'temp-critical';
    if (this.cameraStatus.temperature > 45) return 'temp-warning';
    return 'temp-normal';
  }
}