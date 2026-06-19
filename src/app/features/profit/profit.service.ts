import { computed, inject, Injectable } from '@angular/core';
import { ExpenseService } from '../../core/services/expense.service';
import { SaleService } from '../../core/services/sale.service';
import { ProfitPeriodSummary } from './profit.model';

@Injectable({ providedIn: 'root' })
export class ProfitService {
  private readonly saleService = inject(SaleService);
  private readonly expenseService = inject(ExpenseService);

  readonly today = computed(() => {
    const date = this.toLocalDate(new Date());
    return this.createSummary(date, 'day');
  });

  readonly thisMonth = computed(() => {
    const month = this.toLocalDate(new Date()).slice(0, 7);
    return this.createSummary(month, 'month');
  });

  readonly allTime = computed<ProfitPeriodSummary>(() => {
    const sales = this.saleService.sales();
    const expenses = this.expenseService.expenses();
    return this.summarize(sales, expenses);
  });

  readonly recentDailyPerformance = computed(() => {
    const sales = this.saleService.sales();
    const expenses = this.expenseService.expenses();
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = this.toLocalDate(date);
      return {
        date: key,
        summary: this.summarize(
          sales.filter((sale) => sale.saleDate === key),
          expenses.filter((expense) => expense.date === key)
        )
      };
    });
  });

  private createSummary(period: string, type: 'day' | 'month'): ProfitPeriodSummary {
    const matches = (date: string) => type === 'day' ? date === period : date.startsWith(period);
    return this.summarize(
      this.saleService.sales().filter((sale) => matches(sale.saleDate)),
      this.expenseService.expenses().filter((expense) => matches(expense.date))
    );
  }

  private summarize(
    sales: ReturnType<SaleService['sales']>,
    expenses: ReturnType<ExpenseService['expenses']>
  ): ProfitPeriodSummary {
    const grossProfit = sales.reduce((total, sale) => total + sale.profit, 0);
    const expenseTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
    return {
      grossProfit,
      expenses: expenseTotal,
      netProfit: grossProfit - expenseTotal,
      salesRevenue: sales.reduce((total, sale) => total + sale.totalRevenue, 0),
      saleCount: sales.length,
      expenseCount: expenses.length
    };
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
