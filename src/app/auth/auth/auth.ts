import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent implements OnInit, AfterViewInit {
  isLogin = true;
  isSubmitting = false;
  message = '';
  messageType: 'error' | 'success' = 'error';
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  readonly loginForm: FormGroup;
  readonly registerForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.resetLoginState();
    void this.redirectAuthenticatedUser();
  }

  ngOnInit(): void {
    this.resetLoginState();
  }

  ngAfterViewInit(): void {
    // Run once after browser form restoration/autofill has had a chance to populate.
    setTimeout(() => this.resetLoginState());
  }

  switchMode(): void {
    this.isLogin = !this.isLogin;
    this.message = '';
    if (this.isLogin) this.resetLoginState();
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    await this.submit(async () => {
      const { email, password, rememberMe } = this.loginForm.getRawValue();
      await this.auth.login(email, password, rememberMe);
      await this.router.navigateByUrl(this.safeReturnUrl());
    });
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (
      this.registerForm.value.password !==
      this.registerForm.value.confirmPassword
    ) {
      this.registerForm.controls['confirmPassword'].setErrors({ passwordMismatch: true });
      this.registerForm.controls['confirmPassword'].markAsTouched();
      this.messageType = 'error';
      this.message = 'Passwords do not match.';
      return;
    }

    await this.submit(async () => {
      const { email, password } = this.registerForm.getRawValue();
      await this.auth.register(email, password);
      this.isLogin = true;
      this.resetLoginState();
      this.registerForm.reset({ email: '', password: '', confirmPassword: '' });
      this.messageType = 'success';
      this.message = 'Account created successfully. Sign in to continue.';
      await this.router.navigateByUrl('/login');
    }, false);
  }

  async resetPassword(): Promise<void> {
    const email = this.loginForm.controls['email'].valid
      ? this.loginForm.controls['email'].value
      : '';
    await this.router.navigate(['/forgot-password'], {
      queryParams: email ? { email } : undefined
    });
  }

  private async submit(action: () => Promise<void>, clearMessage = true): Promise<void> {
    this.isSubmitting = true;
    if (clearMessage) this.message = '';

    try {
      await action();
    } catch (error) {
      this.messageType = 'error';
      this.message = this.authErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetLoginState(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });
    this.showLoginPassword = false;
    this.isSubmitting = false;
  }

  private async redirectAuthenticatedUser(): Promise<void> {
    const user = await this.auth.waitForCurrentUser();
    if (user) {
      await this.auth.prepareUserData(user);
      await this.router.navigateByUrl('/dashboard');
    }
  }

  private authErrorMessage(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/user-not-found': 'No account was found for this email.',
      'auth/weak-password': 'Password must contain at least 6 characters.',
      'auth/requires-recent-login': 'Please sign in again before updating your credentials.',
      'permission-denied': 'Your account was created, but the user profile could not be saved.'
    };

    return messages[code] ?? (error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.');
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
  }
}
