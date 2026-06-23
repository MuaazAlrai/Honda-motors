import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-confirm-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Confirm Delete</h2>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <mat-dialog-content>
        <div class="warning-box">
          <mat-icon>warning</mat-icon>
          <span>This action cannot be undone. All bikes in this invoice will be returned to inventory.</span>
        </div>
        <p class="instruction">Enter your login password to proceed:</p>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password" />
          <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>
        @if (errorMessage()) {
          <div class="error-box">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage() }}
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="loading()">Cancel</button>
        <button mat-flat-button class="delete-btn" type="submit" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <ng-container>
              <mat-icon>delete_outline</mat-icon> Delete
            </ng-container>
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-dialog-content { display: grid; gap: 12px; padding-top: 14px; min-width: 340px; }
    mat-form-field { width: 100%; }
    .warning-box {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 13px 14px; border-radius: 10px;
      background: rgba(229,57,53,.12); color: #ef9a9a; font-size: 13px;
    }
    .warning-box mat-icon { color: #ef5350; flex-shrink: 0; margin-top: 1px; }
    .instruction { margin: 2px 0 0; color: #AFAFAF; font-size: 13px; }
    .error-box {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 12px; border-radius: 8px;
      background: rgba(229,57,53,.1); color: #ef5350;
      font-size: 12px; font-weight: 600;
    }
    .error-box mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .delete-btn { background: #c62828 !important; color: white !important; }
    .delete-btn mat-spinner { display: inline-block; }
    mat-dialog-actions { padding: 12px 24px 16px; gap: 8px; }
  `]
})
export class PasswordConfirmDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef<PasswordConfirmDialogComponent, boolean>);
  private readonly fb = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required]
  });

  async confirm(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.reauthenticateWithPassword(this.form.controls.password.value);
      this.ref.close(true);
    } catch (error: any) {
      const code: string = error?.code ?? '';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        this.errorMessage.set('Incorrect password. Please try again.');
      } else if (code.includes('too-many-requests')) {
        this.errorMessage.set('Too many attempts. Please wait a moment and try again.');
      } else {
        this.errorMessage.set('Verification failed. Please try again.');
      }
      this.loading.set(false);
    }
  }
}
