import { computed, inject, Injectable } from '@angular/core';
import { LOW_STOCK_LIMIT } from '../../core/config/inventory.constants';
import { BikeService } from '../../core/services/bike.service';
import { InventoryService } from '../../core/services/inventory.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SaleService } from '../../core/services/sale.service';
import { BikeInput } from '../../core/models';
import { StockItem } from './stock.model';

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
    return this.inventory.stock().find((item) => item.id === id)?.availableStock === 0;
  }

  updateBike(item: StockItem, input: BikeInput): void {
    const allocatedByBike = item.sourceBikeIds.map((id) => ({
      id,
      allocated: this.sales.allocatedQuantityForBatch(`opening:${id}`)
    }));
    const allocatedOpeningStock = allocatedByBike.reduce(
      (total, source) => total + source.allocated,
      0
    );
    if (input.openingQuantity < allocatedOpeningStock) {
      throw new Error(`Quantity cannot be less than ${allocatedOpeningStock}; those units have already been sold.`);
    }

    let unallocatedQuantity = input.openingQuantity - allocatedOpeningStock;
    allocatedByBike.forEach((source, index) => {
      const openingQuantity = source.allocated + (index === 0 ? unallocatedQuantity : 0);
      this.bikes.update(source.id, { ...input, openingQuantity });
      this.sales.repriceBatch(`opening:${source.id}`, input.purchasePrice);
      unallocatedQuantity = 0;
    });
  }

  deleteBike(id: string): void {
    if (!this.canDeleteBike(id)) {
      throw new Error('This stock still contains inventory and cannot be deleted.');
    }
    const item = this.inventory.stock().find((stock) => stock.id === id);
    item?.sourceBikeIds.forEach((sourceId) => this.bikes.delete(sourceId));
  }
}
