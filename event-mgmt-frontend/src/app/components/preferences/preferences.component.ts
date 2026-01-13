import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { PreferencesService } from '../../services/preferences.service';
import { Category } from '../../models';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="preferences-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Event Preferences</mat-card-title>
          <mat-card-subtitle>Select categories you're interested in</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="preferencesForm" (ngSubmit)="onSubmit()">
            <div class="categories-list">
              <mat-checkbox 
                *ngFor="let category of categories" 
                [formControlName]="'category_' + category.id"
                class="category-checkbox">
                {{category.name}}
              </mat-checkbox>
            </div>
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="loading" class="save-button">
              {{loading ? 'Saving...' : 'Save Preferences'}}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .preferences-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    .category-checkbox {
      margin-bottom: 8px;
    }
    .save-button {
      width: 100%;
    }
  `]
})
export class PreferencesComponent implements OnInit {
  preferencesForm: FormGroup;
  categories: Category[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private preferencesService: PreferencesService,
    private snackBar: MatSnackBar
  ) {
    this.preferencesForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCurrentPreferences();
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.setupForm();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories. Using default categories.', 'Close', { duration: 3000 });
        // Set mock categories for development
        this.categories = [
          { id: 1, name: 'Cat 1' },
          { id: 2, name: 'Cat 2' },
          { id: 3, name: 'Cat 3' }
        ];
        this.setupForm();
      }
    });
  }

  private setupForm(): void {
    const controls: any = {};
    this.categories.forEach(category => {
      controls[`category_${category.id}`] = [false];
    });
    this.preferencesForm = this.fb.group(controls);
  }

  private loadCurrentPreferences(): void {
    const currentPrefs = this.preferencesService.getPreferences();
    currentPrefs.forEach(categoryId => {
      const controlName = `category_${categoryId}`;
      if (this.preferencesForm.get(controlName)) {
        this.preferencesForm.get(controlName)?.setValue(true);
      }
    });
  }

  onSubmit(): void {
    this.loading = true;
    const selectedCategories: number[] = [];
    
    Object.keys(this.preferencesForm.value).forEach(key => {
      if (this.preferencesForm.value[key]) {
        const categoryId = parseInt(key.replace('category_', ''));
        selectedCategories.push(categoryId);
      }
    });

    this.preferencesService.updatePreferences(selectedCategories).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Preferences saved successfully!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error saving preferences:', error);
        this.loading = false;
        // Still save locally even if API fails
        localStorage.setItem('preferences', JSON.stringify(selectedCategories));
        this.snackBar.open('Preferences saved locally (backend unavailable)', 'Close', { duration: 3000 });
      }
    });
  }
}