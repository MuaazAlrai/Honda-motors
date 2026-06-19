import { Injectable } from '@angular/core';
import { Entity } from '../core/models';
import { StorageService } from '../core/storage/storage.service';
import { Repository } from './repository';

@Injectable({ providedIn: 'root' })
export class LocalStorageRepository {
  constructor(private readonly storage: StorageService) {}

  collection<T extends Entity>(key: string): Repository<T> {
    return {
      getAll: () => this.storage.read<T[]>(key, []),
      getById: (id) => this.storage.read<T[]>(key, []).find((item) => item.id === id),
      create: (value) => {
        const now = new Date().toISOString();
        const entity = { ...value, id: crypto.randomUUID(), createdAt: now, updatedAt: now } as T;
        this.storage.write(key, [...this.storage.read<T[]>(key, []), entity]);
        return entity;
      },
      update: (id, value) => {
        const items = this.storage.read<T[]>(key, []);
        const index = items.findIndex((item) => item.id === id);
        if (index < 0) throw new Error('Record not found.');
        const entity = { ...items[index], ...value, id, updatedAt: new Date().toISOString() } as T;
        items[index] = entity;
        this.storage.write(key, items);
        return entity;
      },
      delete: (id) => {
        this.storage.write(
          key,
          this.storage.read<T[]>(key, []).filter((item) => item.id !== id)
        );
      }
    };
  }
}
