export const EXPENSE_CATEGORIES = [
  'Rent',
  'Workshop Expense',
  'Spare Parts',
  'Staff Salary',
  'Electricity',
  'Other'
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface NewExpenseRequest {
  title: string;
  amount: number;
  category: ExpenseCategory;
}
