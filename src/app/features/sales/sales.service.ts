import { computed, inject, Injectable } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import { SaleService as LocalSaleService } from '../../core/services/sale.service';
import { NewSaleRequest, Sale, SaleUpdate } from './sales.model';
import { StockItem } from '../stock/stock.model';
import { bikeNameKey } from '../../core/models';
import { PaymentService } from '../../core/services/payment.service';
import { AddPaymentResult } from '../../shared/dialogs/add-payment-dialog.component';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly localSales = inject(LocalSaleService);
  private readonly inventory = inject(InventoryService);
  private readonly paymentService = inject(PaymentService);

  readonly sales = this.localSales.sales;
  readonly saleViews = this.localSales.saleViews;
  readonly colorStock = computed(() =>
    this.inventory.stock().filter((bike) => bike.availableStock > 0)
  );
  readonly stock = computed(() => {
    const models = new Map<string, StockItem>();
    for (const stock of this.colorStock()) {
      const key = bikeNameKey(stock.bikeName);
      const existing = models.get(key);
      if (!existing) {
        models.set(key, { ...stock, sourceBikeIds: [...stock.sourceBikeIds], color: 'All colors' });
        continue;
      }
      existing.sourceBikeIds.push(...stock.sourceBikeIds);
      existing.openingQuantity += stock.openingQuantity;
      existing.purchasedQuantity += stock.purchasedQuantity;
      existing.soldQuantity += stock.soldQuantity;
      existing.availableStock += stock.availableStock;
      existing.inventoryValue += stock.inventoryValue;
      existing.averagePurchasePrice = existing.availableStock > 0
        ? existing.inventoryValue / existing.availableStock
        : existing.purchasePrice;
    }
    return [...models.values()];
  });
  readonly availableModels = this.stock;

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
    const sale = this.localSales.createInvoice({
      ...request,
      invoiceNumber: `SALE-${Date.now()}`,
      saleDate: this.toLocalDate(new Date())
    });
    this.paymentService.recordSale(sale, request.paymentMethod);
    return sale;
  }

  updateSale(id: string, input: SaleUpdate): Sale {
    return this.localSales.update(id, input);
  }

  getAvailableStock(bikeId: string): number {
    return this.localSales.availableStock(bikeId);
  }

  deleteSale(id: string): void {
    this.localSales.delete(id);
  }

  addPayment(id: string, payment: AddPaymentResult): Sale {
    const sale = this.localSales.addPayment(id, payment.amount, payment.paymentMethod);
    this.paymentService.recordPayment(
      sale,
      payment.amount,
      payment.paymentMethod,
      payment.paymentDate,
      payment.notes
    );
    return sale;
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
