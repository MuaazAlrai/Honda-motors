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

  delete(id: string): void {
    this.repository.delete(id);
    this.refresh();
  }

  refresh(): void {
    this.state.set(this.repository.getAll());
  }
}
