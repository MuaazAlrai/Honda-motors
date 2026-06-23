import { Component, computed, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseDialogComponent } from '../../shared/dialogs/expense-dialog.component';
import { UiService } from '../../shared/services/ui.service';
import { Expense } from './expense.model';

interface GroupedExpense {
  titleKey: string;
  title: string;
  totalAmount: number;
  count: number;
  latestDate: string;
  transactions: Expense[];
}

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly ui = inject(UiService);
  readonly expenseService = inject(ExpenseService);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    amount: [0, [Validators.required, Validators.min(0.01)]]
  });

  private readonly expandedGroups = signal<Set<string>>(new Set());

  readonly groupedExpenses = computed<GroupedExpense[]>(() => {
    const map = new Map<string, GroupedExpense>();
    for (const expense of this.expenseService.expenses()) {
      const key = expense.title.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          titleKey: key,
          title: expense.title,
          totalAmount: expense.amount,
          count: 1,
          latestDate: expense.date,
          transactions: [expense]
        });
      } else {
        existing.totalAmount += expense.amount;
        existing.count += 1;
        existing.transactions.push(expense);
        if (expense.date > existing.latestDate) {
          existing.latestDate = expense.date;
          existing.title = expense.title;
        }
      }
    }
    for (const group of map.values()) {
      group.transactions.sort((a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    }
    return [...map.values()].sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  });

  readonly grandTotal = computed(() =>
    this.expenseService.expenses().reduce((sum, e) => sum + e.amount, 0)
  );

  isExpanded(key: string): boolean {
    return this.expandedGroups().has(key);
  }

  toggleGroup(key: string): void {
    const next = new Set(this.expandedGroups());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.expandedGroups.set(next);
  }

  saveExpense(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.expenseService.saveExpense(this.form.getRawValue());
    this.form.reset({ title: '', amount: 0 });
    this.ui.success('Expense saved successfully.');
  }

  editExpense(expense: Expense, event: Event): void {
    event.stopPropagation();
    this.dialog.open(ExpenseDialogComponent, {
      data: expense,
      width: '480px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((input) => {
      if (!input) return;
      this.expenseService.update(expense.id, input);
      this.ui.success('Expense updated successfully.');
    });
  }

  deleteExpense(id: string, event: Event): void {
    event.stopPropagation();
    this.expenseService.deleteExpense(id);
  }
}
