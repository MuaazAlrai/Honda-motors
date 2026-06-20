import { computed, Injectable, signal } from '@angular/core';
import { Purchase, PurchaseInput, PurchaseView } from '../../features/purchase/purchase.model';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';
import { BikeService } from './bike.service';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly repository;
  private readonly state = signal<Purchase[]>([]);
  readonly purchases = this.state.asReadonly();
  readonly purchaseViews = computed<PurchaseView[]>(() =>
    this.state().map((item) => ({
      ...item,
      bikeName: this.bikes.getById(item.bikeId)?.bikeName ?? 'Deleted bike'
    }))
  );

  constructor(repositoryFactory: LocalStorageRepository, private readonly bikes: BikeService) {
    this.repository = repositoryFactory.collection<Purchase>('bike-purchases');
    this.refresh();
  }

  create(input: PurchaseInput): Purchase {
    const entity = this.repository.create({
      ...input,
      totalCost: input.quantity * input.purchasePricePerBike
    });
    this.refresh();
    return entity;
  }

  update(id: string, input: PurchaseInput): Purchase {
    if (!this.bikes.getById(input.bikeId)) throw new Error('Bike model not found.');
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new Error('Purchase quantity must be a whole number greater than zero.');
    }
    if (input.purchasePricePerBike < 0) throw new Error('Purchase price cannot be negative.');
    const entity = this.repository.update(id, {
      ...input,
      totalCost: input.quantity * input.purchasePricePerBike
    });
    this.refresh();
    return entity;
  }

  delete(id: string): void {
    this.repository.delete(id);
    this.refresh();
  }

  refresh(): void {
    this.state.set(this.repository.getAll());
  }
}
