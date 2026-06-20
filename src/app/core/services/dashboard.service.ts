import { computed, Injectable } from '@angular/core';
import { ActivityItem, DashboardMetrics, Sale } from '../models';
import { LOW_STOCK_LIMIT } from '../config/inventory.constants';
import { BikeService } from './bike.service';
import { ExpenseService } from './expense.service';
import { InventoryService } from './inventory.service';
import { PurchaseService } from './purchase.service';
import { SaleService } from './sale.service';
import { bikeNameKey } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly metrics = computed<DashboardMetrics>(() => {
    const sales = this.sales.sales();
    const expenses = this.expenses.expenses();
    const stock = this.inventory.stock();
    const totalProfit = sales.reduce((sum, item) => sum + item.profit, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const cashInHand = sales.reduce(
      (sum, item) => sum + (item.paidAmount ?? item.totalRevenue),
      0
    );
    const outstandingCredit = sales.reduce(
      (sum, item) => sum + (item.remainingAmount ?? 0),
      0
    );
    return {
      totalBikesPurchased: this.purchases.purchases().reduce((sum, item) => sum + item.quantity, 0),
      totalBikesSold: sales.reduce((sum, item) => sum + item.quantity, 0),
      totalProfit,
      totalExpenses,
      netProfit: totalProfit - totalExpenses,
      inventoryValue: stock.reduce((sum, item) => sum + item.inventoryValue, 0),
      lowStockCount: stock.filter((item) => item.availableStock < LOW_STOCK_LIMIT).length,
      bikeModelCount: stock.length,
      bestSellingBike: this.bestSeller(sales),
      cashInHand,
      outstandingCredit
    };
  });

  readonly recentActivity = computed<ActivityItem[]>(() =>
    [
      ...this.purchases.purchaseViews().map((item) => ({ type: 'Purchase' as const, description: `${item.bikeName} · ${item.supplierName}`, amount: item.totalCost, date: item.purchaseDate })),
      ...this.sales.saleViews().map((item) => ({ type: 'Sale' as const, description: `${item.itemsSummary} · ${item.customerName}`, amount: item.totalRevenue, date: item.saleDate })),
      ...this.expenses.expenses().map((item) => ({ type: 'Expense' as const, description: `${item.title} · ${item.category}`, amount: item.amount, date: item.date }))
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  );

  readonly monthlySales = computed(() => {
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    return Array.from({ length: 6 }, (_, offset) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - offset));
      const revenue = this.sales.sales()
        .filter((sale) => {
          const sold = new Date(`${sale.saleDate}T00:00:00`);
          return sold.getMonth() === date.getMonth() && sold.getFullYear() === date.getFullYear();
        })
        .reduce((sum, sale) => sum + sale.totalRevenue, 0);
      return { label: formatter.format(date), revenue };
    });
  });

  readonly maxMonthlyRevenue = computed(() => Math.max(1, ...this.monthlySales().map((item) => item.revenue)));
  readonly lowStockAlerts = computed(() => this.inventory.stock().filter((item) => item.availableStock < LOW_STOCK_LIMIT));

  constructor(
    private readonly bikes: BikeService,
    private readonly purchases: PurchaseService,
    private readonly sales: SaleService,
    private readonly expenses: ExpenseService,
    private readonly inventory: InventoryService
  ) {}

  private bestSeller(sales: Sale[]): string {
    const totals = new Map<string, number>();
    sales.forEach((sale) => {
      this.sales.itemsFor(sale).forEach((item) => {
        const key = bikeNameKey(item.bikeName);
        totals.set(key, (totals.get(key) ?? 0) + item.quantity);
      });
    });
    const winner = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!winner) return 'No sales yet';
    return this.bikes.bikes().find(
      (bike) => bikeNameKey(bike.bikeName) === winner[0]
    )?.bikeName ?? 'Unknown model';
  }
}
