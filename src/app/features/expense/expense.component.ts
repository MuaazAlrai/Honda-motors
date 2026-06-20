import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseDialogComponent } from '../../shared/dialogs/expense-dialog.component';
import { UiService } from '../../shared/services/ui.service';
import { Expense, EXPENSE_CATEGORIES } from './expense.model';
import { ExpensesService } from './expense.service';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent {
  readonly categories = EXPENSE_CATEGORIES;
  readonly displayedColumns = ['date', 'title', 'category', 'amount', 'actions'];
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    readonly expensesService: ExpensesService,
    private readonly ui: UiService,
    private readonly dialog: MatDialog
  ) {
    this.form = formBuilder.nonNullable.group({
      title: ['Other', [Validators.required, Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      category: [EXPENSE_CATEGORIES.at(-1)!, Validators.required]
    });
    this.form.controls.category.valueChanges.subscribe((category) => {
      this.form.patchValue({ title: category }, { emitEvent: false });
    });
  }

  saveExpense(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.expensesService.saveExpense(this.form.getRawValue());
      this.form.reset({ title: 'Other', amount: 0, category: 'Other' });
      this.ui.success('Expense saved successfully.');
    } catch (error) {
      this.ui.error((error as Error).message);
    }
  }

  editExpense(expense: Expense): void {
    this.dialog.open(ExpenseDialogComponent, {
      data: expense,
      width: '640px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((input) => {
      if (!input) return;
      try {
        this.expensesService.updateExpense(expense.id, input);
        this.ui.success('Expense updated.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }

  deleteExpense(id: string, title: string): void {
    this.ui
      .confirm({
        title: 'Delete expense?',
        message: `${title} will be permanently removed from your expense ledger.`
      })
      .subscribe(() => {
        this.expensesService.deleteExpense(id);
        this.ui.success('Expense deleted.');
      });
  }

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Rent: 'home',
      Salary: 'groups',
      Electricity: 'bolt',
      Maintenance: 'build',
      Other: 'receipt_long'
    };
    return icons[category] ?? 'receipt_long';
  }
}
