import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { PreferencesService } from '../../services/preferences.service';
import { Category } from '../../models';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Preferences</h1>
          <p class="page-sub">Select the event categories you want to see in your calendar</p>
        </div>
        <button class="save-btn" (click)="save()" [disabled]="loading || !dirty">
          <span class="material-icons">save</span>
          {{loading ? 'Saving...' : 'Save Preferences'}}
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="fetching">
        <div class="spinner"></div>
      </div>

      <div class="content" *ngIf="!fetching">
        <div class="section-label">Available Categories</div>

        <div class="categories-grid">
          <div *ngFor="let cat of categories"
               class="cat-card"
               [class.selected]="isSelected(cat.id)"
               (click)="toggle(cat.id)">
            <div class="cat-icon">
              <span class="material-icons">{{getCatIcon(cat.name)}}</span>
            </div>
            <div class="cat-info">
              <div class="cat-name">{{cat.name}}</div>
              <div class="cat-desc">{{getCatDesc(cat.name)}}</div>
            </div>
            <div class="cat-check" *ngIf="isSelected(cat.id)">
              <span class="material-icons">check_circle</span>
            </div>
          </div>
        </div>

        <div class="summary" *ngIf="selected.length > 0">
          <span class="material-icons">info_outline</span>
          <span>{{selected.length}} categor{{selected.length === 1 ? 'y' : 'ies'}} selected — your calendar will show slots for these categories.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; height: 100%; overflow-y: auto; background: #0f1117; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 32px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub   { font-size: 14px; color: #64748b; margin: 0; }

    .save-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s;
    }
    .save-btn:hover:not(:disabled) { opacity: 0.9; }
    .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .save-btn .material-icons { font-size: 18px; }

    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #2d3148; border-top-color: #6366f1;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .section-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #475569; margin-bottom: 16px;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .cat-card {
      display: flex; align-items: center; gap: 14px;
      background: #1a1d27; border: 2px solid #2d3148;
      border-radius: 12px; padding: 16px;
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .cat-card:hover { border-color: #6366f1; background: #1e2235; }
    .cat-card.selected { border-color: #6366f1; background: #1e2235; }

    .cat-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: #2d3148; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.2s;
    }
    .cat-card.selected .cat-icon { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .cat-icon .material-icons { font-size: 22px; color: #64748b; }
    .cat-card.selected .cat-icon .material-icons { color: white; }

    .cat-info { flex: 1; }
    .cat-name { font-size: 15px; font-weight: 600; color: #e2e8f0; margin-bottom: 3px; }
    .cat-desc { font-size: 12px; color: #64748b; }

    .cat-check { color: #6366f1; }
    .cat-check .material-icons { font-size: 22px; }

    .summary {
      display: flex; align-items: center; gap: 10px;
      background: #1e2235; border: 1px solid #2d3148;
      border-left: 3px solid #6366f1;
      border-radius: 8px; padding: 12px 16px;
      font-size: 13px; color: #94a3b8;
    }
    .summary .material-icons { color: #6366f1; flex-shrink: 0; }
  `]
})
export class PreferencesComponent implements OnInit {
  categories: Category[] = [];
  selected: number[] = [];
  fetching = true;
  loading = false;
  dirty = false;

  constructor(
    private apiService: ApiService,
    private preferencesService: PreferencesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.selected = [...this.preferencesService.getPreferences()];
    this.apiService.getCategories().subscribe({
      next: cats => { this.categories = cats; this.fetching = false; },
      error: () => {
        this.categories = [{ id: 1, name: 'Cat 1' }, { id: 2, name: 'Cat 2' }, { id: 3, name: 'Cat 3' }];
        this.fetching = false;
      }
    });
  }

  isSelected(id: number): boolean { return this.selected.includes(id); }

  toggle(id: number): void {
    const idx = this.selected.indexOf(id);
    if (idx > -1) this.selected.splice(idx, 1);
    else this.selected.push(id);
    this.dirty = true;
  }

  save(): void {
    this.loading = true;
    this.preferencesService.updatePreferences([...this.selected]).subscribe({
      next: () => { this.loading = false; this.dirty = false; this.snackBar.open('Preferences saved!', 'Close', { duration: 3000 }); },
      error: () => { this.loading = false; this.dirty = false; this.snackBar.open('Saved locally', 'Close', { duration: 3000 }); }
    });
  }

  getCatIcon(name: string): string {
    const map: Record<string, string> = { 'Cat 1': 'event', 'Cat 2': 'sports_esports', 'Cat 3': 'music_note' };
    return map[name] || 'category';
  }

  getCatDesc(name: string): string {
    const map: Record<string, string> = { 'Cat 1': 'General events and meetups', 'Cat 2': 'Gaming and esports events', 'Cat 3': 'Music and entertainment' };
    return map[name] || 'Event category';
  }
}
