import { computed, inject, Injectable } from '@angular/core';
import { LOW_STOCK_LIMIT } from '../../core/config/inventory.constants';
import { BikeService } from '../../core/services/bike.service';
import { InventoryService } from '../../core/services/inventory.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SaleService } from '../../core/services/sale.service';

@Injectable({ providedIn: 'root' })
export class StockService {
  readonly lowStockLimit = LOW_STOCK_LIMIT;
  private readonly inventory = inject(InventoryService);
  private readonly bikes = inject(BikeService);
  private readonly purchases = inject(PurchaseService);
  private readonly sales = inject(SaleService);
  readonly stock = this.inventory.stock;
  readonly totalUnits = computed(() => this.stock().reduce((total, item) => total + item.availableStock, 0));
  readonly totalValue = computed(() => this.stock().reduce((total, item) => total + item.inventoryValue, 0));
  readonly lowStockCount = computed(() => this.stock().filter((item) => this.isLowStock(item.availableStock)).length);

  isLowStock(stock: number): boolean {
    return stock < this.lowStockLimit;
  }

  canDeleteBike(id: string): boolean {
    return !this.purchases.purchases().some((item) => item.bikeId === id) &&
      !this.sales.sales().some((item) => item.bikeId === id);
  }

  deleteBike(id: string): void {
    if (!this.canDeleteBike(id)) throw new Error('Bikes with transaction history cannot be deleted.');
    this.bikes.delete(id);
  }
}
