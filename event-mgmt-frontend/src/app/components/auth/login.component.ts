import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatSnackBarModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <div class="brand-icon"><span class="material-icons">camera_alt</span></div>
          <span class="brand-name">StreetView AI</span>
        </div>
        <h1 class="hero-title">Intelligent Camera<br>Troubleshooting</h1>
        <p class="hero-sub">AI-powered diagnostics, real-time monitoring, and smart ticket management for Google Maps Street View cameras.</p>
        <div class="feature-list">
          <div class="feature"><span class="material-icons">smart_toy</span> AI-guided troubleshooting</div>
          <div class="feature"><span class="material-icons">confirmation_number</span> Automated ticket creation</div>
          <div class="feature"><span class="material-icons">mic</span> Voice assistant support</div>
          <div class="feature"><span class="material-icons">videocam</span> Real-time camera monitoring</div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <div class="demo-banner">
            <span class="material-icons">info</span>
            <div>
              <strong>Demo mode</strong> — any credentials work<br>
              <small>Use <code>admin&#64;</code> email for admin access</small>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
            <div class="field-group">
              <label>Email address</label>
              <div class="input-wrap" [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
                <span class="material-icons input-icon">mail_outline</span>
                <input type="email" formControlName="email" placeholder="you@example.com">
              </div>
              <span class="field-error" *ngIf="form.get('email')?.hasError('required') && form.get('email')?.touched">Email is required</span>
              <span class="field-error" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">Enter a valid email</span>
            </div>

            <div class="field-group">
              <label>Password</label>
              <div class="input-wrap" [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
                <span class="material-icons input-icon">lock_outline</span>
                <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
                <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
                  <span class="material-icons">{{showPassword ? 'visibility_off' : 'visibility'}}</span>
                </button>
              </div>
              <span class="field-error" *ngIf="form.get('password')?.hasError('required') && form.get('password')?.touched">Password is required</span>
            </div>

            <button type="submit" class="submit-btn" [disabled]="form.invalid || loading">
              <span *ngIf="!loading">Sign in</span>
              <span *ngIf="loading" class="loading-dots">
                <span></span><span></span><span></span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex; height: 100vh;
      background: #0f1117;
    }

    /* Left */
    .login-left {
      flex: 1;
      background: linear-gradient(135deg, #1a1d27 0%, #0f1117 100%);
      border-right: 1px solid #2d3148;
      padding: 48px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .brand {
      display: flex; align-items: center; gap: 10px; margin-bottom: 48px;
    }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon .material-icons { color: white; font-size: 22px; }
    .brand-name { font-size: 18px; font-weight: 700; color: #e2e8f0; }
    .hero-title {
      font-size: 40px; font-weight: 800; line-height: 1.2;
      color: #f1f5f9; margin: 0 0 16px;
    }
    .hero-sub { font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 40px; max-width: 420px; }
    .feature-list { display: flex; flex-direction: column; gap: 14px; }
    .feature {
      display: flex; align-items: center; gap: 12px;
      font-size: 15px; color: #94a3b8;
    }
    .feature .material-icons { color: #6366f1; font-size: 20px; }

    /* Right */
    .login-right {
      width: 480px; display: flex; align-items: center; justify-content: center;
      padding: 40px;
    }
    .login-card { width: 100%; }
    .card-header { margin-bottom: 24px; }
    .card-header h2 { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px; }
    .card-header p  { font-size: 14px; color: #64748b; margin: 0; }

    .demo-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: #1e2235; border: 1px solid #2d3148;
      border-left: 3px solid #6366f1;
      border-radius: 8px; padding: 12px 14px;
      font-size: 13px; color: #94a3b8; margin-bottom: 24px;
    }
    .demo-banner .material-icons { color: #6366f1; font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    .demo-banner strong { color: #e2e8f0; }
    .demo-banner code { background: #2d3148; padding: 1px 5px; border-radius: 4px; color: #818cf8; }

    .login-form { display: flex; flex-direction: column; gap: 18px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #94a3b8; }
    .input-wrap {
      display: flex; align-items: center;
      background: #1a1d27; border: 1px solid #2d3148;
      border-radius: 8px; overflow: hidden;
      transition: border-color 0.15s;
    }
    .input-wrap:focus-within { border-color: #6366f1; }
    .input-wrap.error { border-color: #ef4444; }
    .input-icon { color: #475569; font-size: 18px; padding: 0 12px; flex-shrink: 0; }
    input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: 14px; padding: 12px 0;
    }
    input::placeholder { color: #475569; }
    .toggle-pw {
      background: none; border: none; cursor: pointer;
      color: #475569; padding: 0 12px; display: flex; align-items: center;
    }
    .toggle-pw:hover { color: #94a3b8; }
    .toggle-pw .material-icons { font-size: 18px; }
    .field-error { font-size: 12px; color: #ef4444; }

    .submit-btn {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; border-radius: 8px;
      color: white; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s, transform 0.15s;
      margin-top: 4px;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .loading-dots { display: flex; align-items: center; justify-content: center; gap: 5px; }
    .loading-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: white;
      animation: bounce 1.2s infinite;
    }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    @media (max-width: 768px) {
      .login-left { display: none; }
      .login-right { width: 100%; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService,
              private router: Router, private snackBar: MatSnackBar) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: () => {
        this.loading = false;
        const user = { id: Math.floor(Math.random() * 9000) + 1000, email, is_admin: email.toLowerCase().includes('admin') };
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(user));
        (this.authService as any).currentUserSubject.next(user);
        this.router.navigate(['/dashboard']);
        this.snackBar.open('Signed in (demo mode)', 'Close', { duration: 3000 });
      }
    });
  }
}
