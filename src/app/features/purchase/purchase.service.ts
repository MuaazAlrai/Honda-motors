import { computed, inject, Injectable } from '@angular/core';
import { BikeService } from '../../core/services/bike.service';
import { PurchaseService as LocalPurchaseService } from '../../core/services/purchase.service';
import { SaleService } from '../../core/services/sale.service';
import { NewPurchaseRequest, Purchase, PurchaseUpdate } from './purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private readonly localPurchases = inject(LocalPurchaseService);
  private readonly bikeService = inject(BikeService);
  private readonly sales = inject(SaleService);

  readonly purchases = this.localPurchases.purchases;
  readonly purchaseViews = this.localPurchases.purchaseViews;
  readonly bikes = this.bikeService.bikes;

  readonly todayPurchases = computed(() => {
    const today = this.toLocalDate(new Date());
    return this.localPurchases
      .purchaseViews()
      .filter((purchase) => purchase.purchaseDate === today);
  });

  readonly todayTotal = computed(() =>
    this.todayPurchases().reduce((total, purchase) => total + purchase.totalCost, 0)
  );

  savePurchase(request: NewPurchaseRequest): Purchase {
    return this.localPurchases.create({
      ...request,
      invoiceNumber: `PUR-${Date.now()}`,
      purchaseDate: this.toLocalDate(new Date()),
      notes: ''
    });
  }

  updatePurchase(id: string, input: PurchaseUpdate): Purchase {
    const existing = this.localPurchases.purchases().find((purchase) => purchase.id === id);
    if (!existing) throw new Error('Purchase record not found.');
    const allocated = this.sales.allocatedQuantityForBatch(id);
    if (allocated > 0 && input.bikeId !== existing.bikeId) {
      throw new Error('Bike cannot be changed because this purchase batch has related sales.');
    }
    if (input.quantity < allocated) {
      throw new Error(`Quantity cannot be less than ${allocated}; those units have already been sold.`);
    }
    const purchase = this.localPurchases.update(id, {
      ...input,
      invoiceNumber: existing.invoiceNumber
    });
    this.sales.repriceBatch(id, input.purchasePricePerBike);
    return purchase;
  }

  hasRelatedSales(id: string): boolean {
    return this.sales.allocatedQuantityForBatch(id) > 0;
  }

  deletePurchase(id: string): void {
    if (this.hasRelatedSales(id)) {
      throw new Error('This purchase batch has related sales and cannot be deleted.');
    }
    this.localPurchases.delete(id);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
