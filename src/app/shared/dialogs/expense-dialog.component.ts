import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EXPENSE_CATEGORIES, Expense, ExpenseInput } from '../../core/models';

@Component({
  selector: 'app-expense-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit expense' : 'New expense' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-grid">
        <mat-form-field appearance="outline" floatLabel="always"><mat-label>Title</mat-label><input matInput formControlName="title" /></mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always"><mat-label>Category</mat-label><mat-select formControlName="category">
          @for (category of categories; track category) { <mat-option [value]="category">{{ category }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always"><mat-label>Amount</mat-label><input matInput type="number" formControlName="amount" /></mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always"><mat-label>Date</mat-label><input matInput type="date" formControlName="date" /></mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always" class="full-span"><mat-label>Notes</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button mat-button type="button" mat-dialog-close>Cancel</button><button mat-flat-button color="primary">Save expense</button></mat-dialog-actions>
    </form>
  `
})
export class ExpenseDialogComponent {
  readonly categories = EXPENSE_CATEGORIES;
  readonly form;
  constructor(
    fb: FormBuilder,
    private readonly ref: MatDialogRef<ExpenseDialogComponent, ExpenseInput>,
    @Inject(MAT_DIALOG_DATA) readonly data: Expense | null
  ) {
    this.form = fb.nonNullable.group({
      title: [data?.title ?? '', Validators.required],
      category: [data?.category ?? EXPENSE_CATEGORIES[0], Validators.required],
      amount: [data?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
      date: [data?.date ?? new Date().toISOString().slice(0, 10), Validators.required],
      notes: [data?.notes ?? '']
    });
  }
  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.ref.close(this.form.getRawValue());
  }
}
