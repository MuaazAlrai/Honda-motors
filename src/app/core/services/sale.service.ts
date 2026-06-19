import { computed, Injectable, signal } from '@angular/core';
import { Sale, SaleInput, SaleView } from '../../features/sales/sales.model';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';
import { BikeService } from './bike.service';
import { PurchaseService } from './purchase.service';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly repository;
  private readonly state = signal<Sale[]>([]);
  readonly sales = this.state.asReadonly();
  readonly saleViews = computed<SaleView[]>(() =>
    this.state().map((item) => ({
      ...item,
      bikeName: this.bikes.getById(item.bikeId)?.bikeName ?? 'Deleted bike'
    }))
  );

  constructor(
    repositoryFactory: LocalStorageRepository,
    private readonly bikes: BikeService,
    private readonly purchases: PurchaseService
  ) {
    this.repository = repositoryFactory.collection<Sale>('bike-sales');
    this.refresh();
  }

  create(input: SaleInput): Sale {
    this.assertStock(input);
    const costPerBike = this.averagePurchasePrice(input.bikeId);
    const entity = this.repository.create({
      ...input,
      totalRevenue: input.quantity * input.salePricePerBike,
      costPerBike,
      profit: (input.salePricePerBike - costPerBike) * input.quantity
    });
    this.refresh();
    return entity;
  }

  delete(id: string): void {
    this.repository.delete(id);
    this.refresh();
  }

  availableStock(bikeId: string): number {
    const bike = this.bikes.getById(bikeId);
    if (!bike) return 0;
    const purchased = this.purchases.purchases()
      .filter((item) => item.bikeId === bikeId)
      .reduce((sum, item) => sum + item.quantity, 0);
    const sold = this.state()
      .filter((item) => item.bikeId === bikeId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return bike.openingQuantity + purchased - sold;
  }

  averagePurchasePrice(bikeId: string): number {
    const bike = this.bikes.getById(bikeId);
    if (!bike) return 0;
    const purchases = this.purchases.purchases().filter((item) => item.bikeId === bikeId);
    const quantity = bike.openingQuantity + purchases.reduce((sum, item) => sum + item.quantity, 0);
    const cost =
      bike.openingQuantity * bike.purchasePrice +
      purchases.reduce((sum, item) => sum + item.totalCost, 0);
    return quantity > 0 ? cost / quantity : bike.purchasePrice;
  }

  refresh(): void {
    this.state.set(this.repository.getAll());
  }

  private assertStock(input: SaleInput): void {
    if (!this.bikes.getById(input.bikeId)) throw new Error('Bike model not found.');
    if (input.quantity > this.availableStock(input.bikeId)) {
      throw new Error('Insufficient bike stock.');
    }
  }
}
