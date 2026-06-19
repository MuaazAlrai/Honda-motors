import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { UiService } from '../../shared/services/ui.service';
import { EXPENSE_CATEGORIES } from './expense.model';
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
    private readonly ui: UiService
  ) {
    this.form = formBuilder.nonNullable.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      category: [EXPENSE_CATEGORIES.at(-1)!, Validators.required]
    });
  }

  saveExpense(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.expensesService.saveExpense(this.form.getRawValue());
      this.form.reset({ title: '', amount: 0, category: 'Other' });
      this.ui.success('Expense saved successfully.');
    } catch (error) {
      this.ui.error((error as Error).message);
    }
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
      Utilities: 'bolt',
      Salaries: 'groups',
      Transport: 'local_shipping',
      Marketing: 'campaign',
      Maintenance: 'build',
      Other: 'receipt_long'
    };
    return icons[category] ?? 'receipt_long';
  }
}
