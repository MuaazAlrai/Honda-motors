import { computed, inject, Injectable } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import { SaleService as LocalSaleService } from '../../core/services/sale.service';
import { CustomerSalesView, NewSaleRequest, Sale, SaleUpdate } from './sales.model';
import { PaymentService } from '../../core/services/payment.service';
import { AddPaymentResult } from '../../shared/dialogs/add-payment-dialog.component';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly localSales = inject(LocalSaleService);
  private readonly inventory = inject(InventoryService);
  private readonly paymentService = inject(PaymentService);

  readonly sales = this.localSales.sales;
  readonly saleViews = this.localSales.saleViews;
  readonly payments = this.paymentService.payments;
  readonly customerSales = computed<CustomerSalesView[]>(() => {
    const customers = new Map<string, CustomerSalesView>();

    for (const sale of this.saleViews()) {
      const key = this.customerKey(sale.customerName, sale.customerContact);
      const existing = customers.get(key);
      const paid = sale.paidAmount ?? sale.totalRevenue;
      const remaining = sale.remainingAmount ?? 0;

      if (!existing) {
        customers.set(key, {
          customerKey: key,
          customerName: sale.customerName,
          customerContact: sale.customerContact,
          sales: [sale],
          totalInvoices: 1,
          totalBikes: sale.quantity,
          totalAmount: sale.totalRevenue,
          totalPaid: paid,
          totalRemaining: remaining,
          paymentStatus: remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'CREDIT',
          lastSaleDate: sale.saleDate
        });
        continue;
      }

      existing.sales.push(sale);
      existing.totalInvoices += 1;
      existing.totalBikes += sale.quantity;
      existing.totalAmount += sale.totalRevenue;
      existing.totalPaid += paid;
      existing.totalRemaining += remaining;
      existing.lastSaleDate = sale.saleDate > existing.lastSaleDate
        ? sale.saleDate
        : existing.lastSaleDate;
      existing.paymentStatus = existing.totalRemaining === 0
        ? 'PAID'
        : existing.totalPaid > 0 ? 'PARTIAL' : 'CREDIT';
    }

    return [...customers.values()]
      .map((customer) => ({
        ...customer,
        sales: [...customer.sales].sort((a, b) =>
          b.saleDate.localeCompare(a.saleDate) || b.createdAt.localeCompare(a.createdAt)
        )
      }))
      .sort((a, b) => b.lastSaleDate.localeCompare(a.lastSaleDate));
  });
  readonly stock = computed(() =>
    this.inventory.stock().filter((bike) => bike.availableStock > 0)
  );
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

  private customerKey(name: string, contact: string): string {
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
    return `${normalize(name)}|${normalize(contact)}`;
  }
}
