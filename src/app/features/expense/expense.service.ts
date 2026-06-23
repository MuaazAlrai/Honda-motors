import { Injectable } from '@angular/core';
import { Expense, ExpenseInput, NewExpenseRequest } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {

  private data: Expense[] = [];

  expenses = () => this.data;

  // ✅ MAIN CREATE METHOD
  create(request: NewExpenseRequest): Expense {
    const now = new Date().toISOString();

    const expense: Expense = {
      id: crypto.randomUUID(),
      title: request.title,
      amount: request.amount,
      category: request.category ?? 'Other',
      notes: '',
      date: this.toDate(new Date()),
      createdAt: now,
      updatedAt: now
    };

    this.data = [expense, ...this.data];
    return expense;
  }

  // ✅ MAIN UPDATE METHOD
  update(id: string, input: ExpenseInput): Expense {
    const index = this.data.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Expense not found');

    const updated: Expense = {
      ...this.data[index],
      ...input,
      updatedAt: new Date().toISOString()
    };

    this.data[index] = updated;
    return updated;
  }

  // ✅ MAIN DELETE METHOD
  delete(id: string): void {
    this.data = this.data.filter(x => x.id !== id);
  }

  // =========================
  // ✅ WRAPPER METHODS (FIX FOR YOUR COMPONENT)
  // =========================

  saveExpense(request: NewExpenseRequest): Expense {
    return this.create(request);
  }

  deleteExpense(id: string): void {
    this.delete(id);
  }

  // =========================

  private toDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}