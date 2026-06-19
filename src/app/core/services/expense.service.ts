import { Injectable, signal } from '@angular/core';
import { Expense, ExpenseInput } from '../models';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly repository;
  private readonly state = signal<Expense[]>([]);
  readonly expenses = this.state.asReadonly();

  constructor(repositoryFactory: LocalStorageRepository) {
    this.repository = repositoryFactory.collection<Expense>('expenses');
    this.refresh();
  }

  create(input: ExpenseInput): Expense {
    const entity = this.repository.create(input);
    this.refresh();
    return entity;
  }

  update(id: string, input: ExpenseInput): Expense {
    const entity = this.repository.update(id, input);
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
