import { computed, inject, Injectable } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import { SaleService as LocalSaleService } from '../../core/services/sale.service';
import { NewSaleRequest, Sale } from './sales.model';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly localSales = inject(LocalSaleService);
  private readonly inventory = inject(InventoryService);

  readonly sales = this.localSales.sales;
  readonly saleViews = this.localSales.saleViews;
  readonly stock = this.inventory.stock;

  readonly todaySales = computed(() => {
    const today = this.toLocalDate(new Date());
    return this.localSales.sales().filter((sale) => sale.saleDate === today);
  });

  readonly todayTotalSales = computed(() =>
    this.todaySales().reduce((total, sale) => total + sale.totalRevenue, 0)
  );

  readonly todayTotalProfit = computed(() =>
    this.todaySales().reduce((total, sale) => total + sale.profit, 0)
  );

  saveSale(request: NewSaleRequest): Sale {
    return this.localSales.create({
      ...request,
      invoiceNumber: `SALE-${Date.now()}`,
      saleDate: this.toLocalDate(new Date()),
      notes: ''
    });
  }

  getAvailableStock(bikeId: string): number {
    return this.localSales.availableStock(bikeId);
  }

  deleteSale(id: string): void {
    this.localSales.delete(id);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
