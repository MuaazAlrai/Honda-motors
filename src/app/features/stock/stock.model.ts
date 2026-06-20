import { Bike } from '../../core/models/bike.model';

export interface StockItem extends Bike {
  sourceBikeIds: string[];
  purchasedQuantity: number;
  soldQuantity: number;
  availableStock: number;
  averagePurchasePrice: number;
  inventoryValue: number;
}
