import { computed, Injectable } from '@angular/core';
import { StockItem } from '../../features/stock/stock.model';
import { BikeService } from './bike.service';
import { PurchaseService } from './purchase.service';
import { SaleService } from './sale.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  readonly stock = computed<StockItem[]>(() =>
    this.bikes.bikes().map((bike) => {
      const purchasedQuantity = this.purchases.purchases()
        .filter((item) => item.bikeId === bike.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const soldQuantity = this.sales.sales()
        .filter((item) => item.bikeId === bike.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const availableStock = bike.openingQuantity + purchasedQuantity - soldQuantity;
      const averagePurchasePrice = this.sales.averagePurchasePrice(bike.id);
      return {
        ...bike,
        purchasedQuantity,
        soldQuantity,
        availableStock,
        averagePurchasePrice,
        inventoryValue: availableStock * averagePurchasePrice
      };
    })
  );

  constructor(
    private readonly bikes: BikeService,
    private readonly purchases: PurchaseService,
    private readonly sales: SaleService
  ) {}
}
