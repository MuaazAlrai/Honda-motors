import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface ResetDataConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-reset-data-confirm-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <form [formGroup]="form" (ngSubmit)="confirm()" novalidate>
      <mat-dialog-content>
        <p>{{ data.message }}</p>

        <mat-form-field appearance="outline">
          <mat-label>Current password</mat-label>
          <input
            matInput
            [type]="showPassword ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
            autofocus
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
            (click)="showPassword = !showPassword"
          >
            <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>Enter your login password to reset data.</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="null">
          {{ data.cancelText || 'No' }}
        </button>
        <button mat-raised-button color="warn" type="submit" [disabled]="form.invalid">
          {{ data.confirmText || 'Yes, reset data' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      mat-dialog-content {
        display: grid;
        gap: 18px;
        margin: 16px 0 4px;
      }

      p {
        margin: 0;
        color: #e0cecd;
      }

      mat-form-field {
        width: 100%;
      }
    `
  ]
})
export class ResetDataConfirmDialogComponent {
  private readonly fb = inject(FormBuilder);

  showPassword = false;

  readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ResetDataConfirmDialogData,
    private readonly ref: MatDialogRef<ResetDataConfirmDialogComponent, string | null>
  ) {}

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ref.close(this.form.getRawValue().password);
  }
}
