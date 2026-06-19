import { computed, inject, Injectable } from '@angular/core';
import { BikeService } from '../../core/services/bike.service';
import { PurchaseService as LocalPurchaseService } from '../../core/services/purchase.service';
import { NewPurchaseRequest, Purchase } from './purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private readonly localPurchases = inject(LocalPurchaseService);
  private readonly bikeService = inject(BikeService);

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

  deletePurchase(id: string): void {
    this.localPurchases.delete(id);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
