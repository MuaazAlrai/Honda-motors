import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Bike } from '../../core/models';
import { Purchase, PurchaseUpdate } from '../../features/purchase/purchase.model';

export interface PurchaseEditDialogData {
  purchase: Purchase;
  bikes: Bike[];
  bikeLocked: boolean;
}

@Component({
  selector: 'app-purchase-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Edit purchase</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-grid">
        <mat-form-field appearance="outline"><mat-label>Bike</mat-label><mat-select formControlName="bikeId">
          @for (bike of data.bikes; track bike.id) { <mat-option [value]="bike.id">{{ bike.bikeName }} · {{ bike.modelYear }}</mat-option> }
        </mat-select><mat-hint>{{ data.bikeLocked ? 'Bike cannot change after stock from this batch is sold' : '' }}</mat-hint></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Quantity</mat-label><input matInput type="number" formControlName="quantity" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Purchase Price</mat-label><input matInput type="number" formControlName="purchasePricePerBike" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Purchase Date</mat-label><input matInput type="date" formControlName="purchaseDate" /></mat-form-field>
        <mat-form-field appearance="outline" class="full-span"><mat-label>Notes</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit">Save purchase</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 14px; padding-top:12px; }
    .full-span { grid-column:1 / -1; }
    @media(max-width:600px){ .dialog-grid { grid-template-columns:1fr; } .full-span { grid-column:auto; } }
  `]
})
export class PurchaseEditDialogComponent {
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    private readonly ref: MatDialogRef<PurchaseEditDialogComponent, PurchaseUpdate>,
    @Inject(MAT_DIALOG_DATA) readonly data: PurchaseEditDialogData
  ) {
    const purchase = data.purchase;
    this.form = formBuilder.nonNullable.group({
      bikeId: [{ value: purchase.bikeId, disabled: data.bikeLocked }, Validators.required],
      supplierName: [purchase.supplierName, Validators.required],
      quantity: [purchase.quantity, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      purchasePricePerBike: [purchase.purchasePricePerBike, [Validators.required, Validators.min(0)]],
      purchaseDate: [purchase.purchaseDate, Validators.required],
      notes: [purchase.notes ?? '']
    });
  }

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.ref.close(this.form.getRawValue());
  }
}
