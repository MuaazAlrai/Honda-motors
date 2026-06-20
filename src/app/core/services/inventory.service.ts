import { computed, Injectable } from '@angular/core';
import { StockItem } from '../../features/stock/stock.model';
import { BikeService } from './bike.service';
import { PurchaseService } from './purchase.service';
import { SaleService } from './sale.service';
import { bikeModelKey } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  readonly stock = computed<StockItem[]>(() => {
    const merged = new Map<string, StockItem>();

    for (const bike of this.bikes.bikes()) {
      const purchasedQuantity = this.purchases.purchases()
        .filter((item) => item.bikeId === bike.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const acquiredQuantity = bike.openingQuantity + purchasedQuantity;
      const availableStock = this.sales.availableStockForBatch(bike.id);
      const soldQuantity = acquiredQuantity - availableStock;
      const averagePurchasePrice = this.sales.averagePurchasePrice(bike.id);
      const batch: StockItem = {
        ...bike,
        sourceBikeIds: [bike.id],
        purchasedQuantity,
        soldQuantity,
        availableStock,
        averagePurchasePrice,
        inventoryValue: this.sales.inventoryValue(bike.id)
      };
      const key = bikeModelKey(bike);
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, batch);
        continue;
      }

      existing.sourceBikeIds.push(bike.id);
      existing.openingQuantity += batch.openingQuantity;
      existing.purchasedQuantity += batch.purchasedQuantity;
      existing.soldQuantity += batch.soldQuantity;
      existing.availableStock += batch.availableStock;
      existing.inventoryValue += batch.inventoryValue;
      existing.averagePurchasePrice = existing.availableStock > 0
        ? existing.inventoryValue / existing.availableStock
        : existing.purchasePrice;
    }

    return [...merged.values()];
  });

  constructor(
    private readonly bikes: BikeService,
    private readonly purchases: PurchaseService,
    private readonly sales: SaleService
  ) {}
}
