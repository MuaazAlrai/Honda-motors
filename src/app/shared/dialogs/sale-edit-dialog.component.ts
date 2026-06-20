import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Sale, SaleUpdate } from '../../features/sales/sales.model';

@Component({
  selector: 'app-sale-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Edit sale</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-grid">
        <mat-form-field appearance="outline"><mat-label>Customer Name</mat-label><input matInput formControlName="customerName" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Sale Date</mat-label><input matInput type="date" formControlName="saleDate" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Total Quantity</mat-label><input matInput type="number" formControlName="quantity" /><mat-hint>{{ isMultiItem ? 'Invoice items cannot be changed from this dialog' : '' }}</mat-hint></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Average Sale Price</mat-label><input matInput type="number" formControlName="salePricePerBike" /></mat-form-field>
        <mat-form-field appearance="outline" class="full-span"><mat-label>Payment Method</mat-label><mat-select formControlName="paymentMethod">
          @for (method of paymentMethods; track method) { <mat-option [value]="method">{{ method }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="full-span"><mat-label>Notes</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit">Save sale</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 14px; padding-top:12px; }
    .full-span { grid-column:1 / -1; }
    @media(max-width:600px){ .dialog-grid { grid-template-columns:1fr; } .full-span { grid-column:auto; } }
  `]
})
export class SaleEditDialogComponent {
  readonly paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'Installment', 'Other'];
  readonly isMultiItem: boolean;
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    private readonly ref: MatDialogRef<SaleEditDialogComponent, SaleUpdate>,
    @Inject(MAT_DIALOG_DATA) readonly data: Sale
  ) {
    this.isMultiItem = (data.items?.length ?? 0) > 1;
    this.form = formBuilder.nonNullable.group({
      customerName: [data.customerName, Validators.required],
      saleDate: [data.saleDate, Validators.required],
      quantity: [data.quantity, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      salePricePerBike: [data.salePricePerBike, [Validators.required, Validators.min(0)]],
      paymentMethod: [data.paymentMethod ?? 'Cash', Validators.required],
      notes: [data.notes ?? '']
    });
    if (this.isMultiItem) {
      this.form.controls.quantity.disable();
      this.form.controls.salePricePerBike.disable();
    }
  }

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.ref.close(this.form.getRawValue());
  }
}
