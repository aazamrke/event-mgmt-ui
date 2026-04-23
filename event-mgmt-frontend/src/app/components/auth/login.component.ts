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
    .login-page { display:flex; height:100vh; background:#f8f9fa; font-family:'Google Sans','Roboto',sans-serif; }

    .login-left {
      flex:1; background:#fff; border-right:1px solid #dadce0;
      padding:48px; display:flex; flex-direction:column; justify-content:center;
    }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:48px; }
    .brand-icon {
      width:40px; height:40px; border-radius:8px; background:#1a73e8;
      display:flex; align-items:center; justify-content:center;
    }
    .brand-icon .material-icons { color:#fff; font-size:22px; }
    .brand-name { font-size:18px; font-weight:700; color:#202124; }
    .hero-title { font-size:38px; font-weight:700; line-height:1.25; color:#202124; margin:0 0 16px; }
    .hero-sub { font-size:16px; color:#5f6368; line-height:1.6; margin:0 0 40px; max-width:420px; }
    .feature-list { display:flex; flex-direction:column; gap:14px; }
    .feature { display:flex; align-items:center; gap:12px; font-size:15px; color:#5f6368; }
    .feature .material-icons { color:#1a73e8; font-size:20px; }

    .login-right { width:480px; display:flex; align-items:center; justify-content:center; padding:40px; background:#f8f9fa; }
    .login-card { width:100%; }
    .card-header { margin-bottom:24px; }
    .card-header h2 { font-size:24px; font-weight:500; color:#202124; margin:0 0 6px; }
    .card-header p { font-size:14px; color:#5f6368; margin:0; }

    .demo-banner {
      display:flex; align-items:flex-start; gap:10px;
      background:#e8f0fe; border:1px solid #c5d8fb; border-left:3px solid #1a73e8;
      border-radius:4px; padding:12px 14px; font-size:13px; color:#1a73e8; margin-bottom:24px;
    }
    .demo-banner .material-icons { font-size:18px; flex-shrink:0; margin-top:1px; }
    .demo-banner strong { color:#1557b0; }
    .demo-banner code { background:#c5d8fb; padding:1px 5px; border-radius:3px; color:#1557b0; }

    .login-form { display:flex; flex-direction:column; gap:18px; }
    .field-group { display:flex; flex-direction:column; gap:6px; }
    label { font-size:13px; font-weight:500; color:#5f6368; }
    .input-wrap {
      display:flex; align-items:center; background:#fff;
      border:1px solid #dadce0; border-radius:4px; overflow:hidden; transition:border-color 0.15s;
      box-shadow:0 1px 2px rgba(60,64,67,.06);
    }
    .input-wrap:focus-within { border-color:#1a73e8; box-shadow:0 0 0 2px #e8f0fe; }
    .input-wrap.error { border-color:#ea4335; }
    .input-icon { color:#9aa0a6; font-size:18px; padding:0 12px; flex-shrink:0; }
    input { flex:1; background:transparent; border:none; outline:none; color:#202124; font-size:14px; padding:12px 0; font-family:inherit; }
    input::placeholder { color:#9aa0a6; }
    .toggle-pw { background:none; border:none; cursor:pointer; color:#9aa0a6; padding:0 12px; display:flex; align-items:center; }
    .toggle-pw:hover { color:#5f6368; }
    .toggle-pw .material-icons { font-size:18px; }
    .field-error { font-size:12px; color:#ea4335; }

    .submit-btn {
      width:100%; padding:12px; background:#1a73e8; border:none; border-radius:4px;
      color:#fff; font-size:14px; font-weight:500; font-family:inherit;
      cursor:pointer; transition:background 0.15s, box-shadow 0.15s; margin-top:4px;
    }
    .submit-btn:hover:not(:disabled) { background:#1557b0; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .submit-btn:disabled { background:#dadce0; color:#9aa0a6; cursor:not-allowed; }

    .loading-dots { display:flex; align-items:center; justify-content:center; gap:5px; }
    .loading-dots span { width:6px; height:6px; border-radius:50%; background:#fff; animation:bounce 1.2s infinite; }
    .loading-dots span:nth-child(2) { animation-delay:0.2s; }
    .loading-dots span:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    @media (max-width:768px) { .login-left { display:none; } .login-right { width:100%; } }
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
