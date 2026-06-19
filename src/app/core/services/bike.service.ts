import { Injectable, signal } from '@angular/core';
import { Bike, BikeInput } from '../models';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';

@Injectable({ providedIn: 'root' })
export class BikeService {
  private readonly repository;
  private readonly state = signal<Bike[]>([]);
  readonly bikes = this.state.asReadonly();

  constructor(repositoryFactory: LocalStorageRepository) {
    this.repository = repositoryFactory.collection<Bike>('bikes');
    this.refresh();
  }

  getById(id: string): Bike | undefined {
    return this.state().find((bike) => bike.id === id);
  }

  create(input: BikeInput): Bike {
    const bike = this.repository.create(input);
    this.refresh();
    return bike;
  }

  update(id: string, input: BikeInput): Bike {
    const bike = this.repository.update(id, input);
    this.refresh();
    return bike;
  }

  delete(id: string): void {
    this.repository.delete(id);
    this.refresh();
  }

  refresh(): void {
    this.state.set(this.repository.getAll());
  }
}
