import { CurrencyPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Sale } from '../../features/sales/sales.model';

export interface AddPaymentResult {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

@Component({
  selector: 'app-add-payment-dialog',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Add Customer Payment</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="balance">
          <span>Invoice {{ data.invoiceNumber }}</span>
          <strong>{{ remainingAmount | currency:'PKR ':'symbol':'1.0-0' }} remaining</strong>
        </div>
        <mat-form-field appearance="outline"><mat-label>Payment Amount</mat-label><input matInput type="number" formControlName="amount" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Payment Date</mat-label><input matInput type="date" formControlName="paymentDate" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Notes</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit">Save Payment</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-dialog-content{display:grid;gap:8px;padding-top:12px}.balance{display:flex;justify-content:space-between;gap:20px;margin-bottom:8px;padding:14px;border-radius:12px;background:rgba(229,57,53,.08)}.balance span{color:#aaa}.balance strong{color:#ef5350}mat-form-field{width:100%}
  `]
})
export class AddPaymentDialogComponent {
  readonly remainingAmount: number;
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    private readonly ref: MatDialogRef<AddPaymentDialogComponent, AddPaymentResult>,
    @Inject(MAT_DIALOG_DATA) readonly data: Sale
  ) {
    this.remainingAmount = data.remainingAmount ?? 0;
    this.form = formBuilder.nonNullable.group({
      amount: [this.remainingAmount, [Validators.required, Validators.min(1), Validators.max(this.remainingAmount)]],
      paymentMethod: ['Cash', Validators.required],
      paymentDate: [new Date().toISOString().slice(0, 10), Validators.required],
      notes: ['']
    });
  }

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.ref.close(this.form.getRawValue());
  }
}
