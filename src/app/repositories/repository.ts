import { Entity } from '../core/models';

export interface Repository<T extends Entity> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(value: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T;
  update(id: string, value: Partial<Omit<T, 'id' | 'createdAt'>>): T;
  delete(id: string): void;
}
