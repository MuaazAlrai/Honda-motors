import { computed, inject, Injectable } from '@angular/core';
import { ExpenseService as LocalExpenseService } from '../../core/services/expense.service';
import { Expense, ExpenseInput, NewExpenseRequest } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly localExpenses = inject(LocalExpenseService);

  readonly expenses = this.localExpenses.expenses;

  readonly todayExpenses = computed(() => {
    const today = this.toLocalDate(new Date());
    return this.expenses().filter((expense) => expense.date === today);
  });

  readonly todayTotal = computed(() =>
    this.todayExpenses().reduce((total, expense) => total + expense.amount, 0)
  );

  readonly allTimeTotal = computed(() =>
    this.expenses().reduce((total, expense) => total + expense.amount, 0)
  );

  saveExpense(request: NewExpenseRequest): Expense {
    return this.localExpenses.create({
      ...request,
      date: this.toLocalDate(new Date()),
      notes: ''
    });
  }

  deleteExpense(id: string): void {
    this.localExpenses.delete(id);
  }

  updateExpense(id: string, input: ExpenseInput): Expense {
    if (input.amount <= 0) throw new Error('Expense amount must be greater than zero.');
    return this.localExpenses.update(id, input);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
