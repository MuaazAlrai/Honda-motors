import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Bike, BikeInput } from '../../core/models';

@Component({
  selector: 'app-stock-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Edit stock</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-grid">
        <mat-form-field appearance="outline"><mat-label>Bike Name</mat-label><input matInput formControlName="bikeName" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Model</mat-label><input matInput type="number" formControlName="modelYear" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Purchase Price</mat-label><input matInput type="number" formControlName="purchasePrice" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Sale Price</mat-label><input matInput type="number" formControlName="salePrice" /></mat-form-field>
        <mat-form-field appearance="outline" class="full-span"><mat-label>Quantity</mat-label><input matInput type="number" formControlName="openingQuantity" /></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit">Save stock</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 14px; padding-top:12px; }
    .full-span { grid-column:1 / -1; }
    @media(max-width:600px){ .dialog-grid { grid-template-columns:1fr; } .full-span { grid-column:auto; } }
  `]
})
export class StockEditDialogComponent {
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    private readonly ref: MatDialogRef<StockEditDialogComponent, BikeInput>,
    @Inject(MAT_DIALOG_DATA) readonly data: Bike
  ) {
    this.form = formBuilder.nonNullable.group({
      bikeName: [data.bikeName, [Validators.required, Validators.maxLength(100)]],
      modelYear: [data.modelYear, [Validators.required, Validators.min(1950)]],
      engineCc: [data.engineCc],
      purchasePrice: [data.purchasePrice, [Validators.required, Validators.min(0)]],
      salePrice: [data.salePrice, [Validators.required, Validators.min(0)]],
      openingQuantity: [data.openingQuantity, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    });
  }

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.ref.close({ ...this.data, ...this.form.getRawValue() });
  }
}
