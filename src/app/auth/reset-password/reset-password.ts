import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../auth/auth.css'
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly code = this.route.snapshot.queryParamMap.get('oobCode') ?? '';
  readonly hasResetCode = Boolean(this.code);

  isSending = false;
  isResetEmailSent = false;
  isUpdatingPassword = false;
  isVerifyingCode = Boolean(this.code);
  isCodeValid = false;
  message = '';
  messageType: 'error' | 'success' = 'error';
  showPassword = false;
  showConfirmPassword = false;

  readonly requestForm = this.fb.nonNullable.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      [Validators.required, Validators.email]
    ]
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  constructor() {
    this.isResetEmailSent = this.route.snapshot.queryParamMap.get('sent') === 'true';
    if (this.code) void this.validateCode();
  }

  async sendResetEmail(): Promise<void> {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSending = true;
    this.message = '';
    const email = this.requestForm.controls.email.value.trim();

    try {
      await this.auth.resetPassword(email);
      console.info('Password reset request succeeded:', email);
      this.messageType = 'success';
      this.message = `Password reset email has been sent to ${email}.`;
      this.isResetEmailSent = true;
      this.snackBar.open(
        `Password reset email has been sent to ${email}.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['success-snackbar', 'multiline-snackbar']
        }
      );
      setTimeout(() => {
        void this.router.navigate(['/reset-password'], {
          queryParams: { email, sent: true }
        });
      }, 1000);
    } catch (error) {
      console.error('Password reset request failed:', error);
      this.messageType = 'error';
      this.message = this.errorMessage(error);
      this.snackBar.open(this.message, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    } finally {
      this.isSending = false;
    }
  }

  async saveNewPassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.passwordForm.getRawValue();
    if (password !== confirmPassword) {
      this.passwordForm.controls.confirmPassword.setErrors({ passwordMismatch: true });
      this.passwordForm.controls.confirmPassword.markAsTouched();
      this.messageType = 'error';
      this.message = 'Passwords do not match.';
      return;
    }

    this.isUpdatingPassword = true;
    this.message = '';

    try {
      await this.auth.confirmResetPassword(this.code, password);
      this.messageType = 'success';
      this.message = 'Your password has been updated successfully.';
      this.snackBar.open(this.message, 'Close', {
        duration: 4000,
        panelClass: 'success-snackbar'
      });
      setTimeout(() => void this.router.navigateByUrl('/login'), 2000);
    } catch (error) {
      this.messageType = 'error';
      this.message = this.errorMessage(error);
      this.snackBar.open(this.message, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    } finally {
      this.isUpdatingPassword = false;
    }
  }

  resendResetEmail(): void {
    this.isResetEmailSent = false;
    this.message = '';
    void this.router.navigate(['/forgot-password'], {
      queryParams: { email: this.requestForm.controls.email.value }
    });
  }

  private async validateCode(): Promise<void> {
    try {
      await this.auth.verifyResetCode(this.code);
      this.isCodeValid = true;
    } catch {
      this.messageType = 'error';
      this.message = 'This password reset link is invalid or expired.';
    } finally {
      this.isVerifyingCode = false;
    }
  }

  private errorMessage(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

    const messages: Record<string, string> = {
      'auth/expired-action-code': 'This password reset link is invalid or expired.',
      'auth/invalid-action-code': 'This password reset link is invalid or expired.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/user-not-found': 'No account was found for this email.',
      'auth/weak-password': 'Password must contain at least 6 characters.',
      'auth/too-many-requests': 'Too many requests. Please try again later.'
    };

    return messages[code] ?? (error instanceof Error
      ? error.message
      : 'Unable to reset the password. Please try again.');
  }
}
