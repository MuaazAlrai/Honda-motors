import { computed, Injectable, signal } from '@angular/core';
import {
  NewSaleRequest,
  Sale,
  SaleItem,
  SaleStockAllocation,
  SaleUpdate,
  SaleView,
  PaymentStatus
} from '../../features/sales/sales.model';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';
import { bikeModelKey, bikeNameKey } from '../models';
import { BikeService } from './bike.service';
import { PurchaseService } from './purchase.service';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly repository;
  private readonly state = signal<Sale[]>([]);
  readonly sales = this.state.asReadonly();
  readonly saleViews = computed<SaleView[]>(() =>
    this.state().map((sale) => {
      const itemsView = this.itemsFor(sale);
      return {
        ...sale,
        bikeName: itemsView.map((item) => item.bikeName).join(', '),
        itemsView,
        itemsSummary: itemsView.map((item) => `${item.bikeName}${item.specificColor && item.color ? ` ${item.color}` : ''} x${item.quantity}`).join(' · ')
      };
    })
  );

  constructor(
    repositoryFactory: LocalStorageRepository,
    private readonly bikes: BikeService,
    private readonly purchases: PurchaseService
  ) {
    this.repository = repositoryFactory.collection<Sale>('bike-sales');
    this.refresh();
  }

  createInvoice(input: NewSaleRequest & { invoiceNumber: string; saleDate: string }): Sale {
    if (!input.items.length) throw new Error('Add at least one sale item.');
    const batches = this.remainingBatches();
    const items = input.items.map((item) => this.createItem(item, batches));
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCost = items.reduce((sum, item) => sum + item.costPerBike * item.quantity, 0);
    if (input.paidAmount < 0) throw new Error('Paid amount cannot be negative.');
    if (input.paidAmount > totalRevenue) {
      throw new Error('Paid amount cannot exceed the total bill.');
    }
    if (input.paymentType === 'FULL' && input.paidAmount !== totalRevenue) {
      throw new Error('Full payment must equal the total bill.');
    }
    if (input.paymentType === 'CREDIT' && input.paidAmount !== 0) {
      throw new Error('Credit sale paid amount must be zero.');
    }
    const first = items[0];
    const entity = this.repository.create({
      bikeId: first.bikeId,
      customerName: input.customerName,
      customerContact: input.customerContact,
      invoiceNumber: input.invoiceNumber,
      quantity,
      salePricePerBike: quantity > 0 ? totalRevenue / quantity : 0,
      totalRevenue,
      paidAmount: input.paidAmount,
      remainingAmount: totalRevenue - input.paidAmount,
      paymentStatus: this.paymentStatus(totalRevenue, input.paidAmount),
      paymentType: input.paymentType,
      costPerBike: quantity > 0 ? totalCost / quantity : 0,
      profit: totalRevenue - totalCost,
      saleDate: input.saleDate,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      allocations: items.flatMap((item) => item.allocations),
      items
    });
    this.refresh();
    return entity;
  }

  update(id: string, input: SaleUpdate): Sale {
    const existing = this.state().find((sale) => sale.id === id);
    if (!existing) throw new Error('Sale record not found.');
    if (this.itemsFor(existing).length > 1) {
      const entity = this.repository.update(id, {
        customerName: input.customerName,
        saleDate: input.saleDate,
        paymentMethod: input.paymentMethod,
        notes: input.notes
      });
      this.refresh();
      return entity;
    }

    const oldItem = this.itemsFor(existing)[0];
    const batches = this.remainingBatches(id);
    const item = this.createItem({
      bikeId: oldItem.bikeId,
      specificColor: oldItem.specificColor,
      quantity: input.quantity,
      salePricePerBike: input.salePricePerBike
    }, batches);
    const paidAmount = existing.paidAmount ?? existing.totalRevenue;
    if (paidAmount > item.totalRevenue) {
      throw new Error('Sale total cannot be reduced below the amount already paid.');
    }
    const entity = this.repository.update(id, {
      ...input,
      bikeId: item.bikeId,
      quantity: item.quantity,
      salePricePerBike: item.salePricePerBike,
      totalRevenue: item.totalRevenue,
      paidAmount,
      remainingAmount: item.totalRevenue - paidAmount,
      paymentStatus: this.paymentStatus(item.totalRevenue, paidAmount),
      costPerBike: item.costPerBike,
      profit: item.profit,
      allocations: item.allocations,
      items: [item]
    });
    this.refresh();
    return entity;
  }

  addPayment(
    id: string,
    amount: number,
    paymentMethod: string
  ): Sale {
    const sale = this.state().find((item) => item.id === id);
    if (!sale) throw new Error('Sale record not found.');
    const paidAmount = sale.paidAmount ?? sale.totalRevenue;
    const remainingAmount = sale.remainingAmount ?? Math.max(0, sale.totalRevenue - paidAmount);
    if (amount <= 0) throw new Error('Payment amount must be greater than zero.');
    if (amount > remainingAmount) {
      throw new Error(`Payment cannot exceed the remaining amount of PKR ${remainingAmount}.`);
    }
    const newPaidAmount = paidAmount + amount;
    const entity = this.repository.update(id, {
      paidAmount: newPaidAmount,
      remainingAmount: sale.totalRevenue - newPaidAmount,
      paymentStatus: this.paymentStatus(sale.totalRevenue, newPaidAmount),
      paymentMethod
    });
    this.refresh();
    return entity;
  }

  delete(id: string): void {
    this.repository.delete(id);
    this.refresh();
  }

  availableStock(bikeId: string, specificColor = false, excludedSaleId?: string): number {
    const bike = this.bikes.getById(bikeId);
    if (!bike) return 0;
    return this.remainingBatches(excludedSaleId)
      .filter((batch) => this.matchesSelection(batch.bikeId, bikeId, specificColor))
      .reduce((sum, batch) => sum + batch.remainingQuantity, 0);
  }

  averagePurchasePrice(bikeId: string): number {
    const batches = this.remainingBatches().filter((batch) => batch.bikeId === bikeId);
    const quantity = batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
    const cost = batches.reduce((sum, batch) => sum + batch.remainingQuantity * batch.unitCost, 0);
    return quantity > 0 ? cost / quantity : this.bikes.getById(bikeId)?.purchasePrice ?? 0;
  }

  inventoryValue(bikeId: string): number {
    return this.remainingBatches()
      .filter((batch) => batch.bikeId === bikeId)
      .reduce((sum, batch) => sum + batch.remainingQuantity * batch.unitCost, 0);
  }

  availableStockForBatch(bikeId: string): number {
    return this.remainingBatches()
      .filter((batch) => batch.bikeId === bikeId)
      .reduce((sum, batch) => sum + batch.remainingQuantity, 0);
  }

  allocatedQuantityForBatch(batchId: string): number {
    const original = this.allBatches().find((batch) => batch.id === batchId);
    const remaining = this.remainingBatches().find((batch) => batch.id === batchId);
    return original && remaining ? original.remainingQuantity - remaining.remainingQuantity : 0;
  }

  repriceBatch(batchId: string, unitCost: number): void {
    for (const sale of this.state()) {
      const items = this.itemsFor(sale);
      if (!items.some((item) => item.allocations.some((allocation) => allocation.batchId === batchId))) continue;
      const repriced = items.map((item) => {
        const allocations = item.allocations.map((allocation) =>
          allocation.batchId === batchId ? { ...allocation, unitCost } : allocation
        );
        const totalCost = allocations.reduce((sum, allocation) => sum + allocation.quantity * allocation.unitCost, 0);
        return { ...item, allocations, costPerBike: totalCost / item.quantity, profit: item.totalRevenue - totalCost };
      });
      const totalCost = repriced.reduce((sum, item) => sum + item.costPerBike * item.quantity, 0);
      this.repository.update(sale.id, {
        items: repriced,
        allocations: repriced.flatMap((item) => item.allocations),
        costPerBike: totalCost / sale.quantity,
        profit: sale.totalRevenue - totalCost
      });
    }
    this.refresh();
  }

  itemsFor(sale: Sale): SaleItem[] {
    if (sale.items?.length) return sale.items;
    const bike = this.bikes.getById(sale.bikeId);
    return [{
      id: `legacy:${sale.id}`,
      bikeId: sale.bikeId,
      bikeName: bike?.bikeName ?? 'Deleted bike',
      color: bike?.color,
      specificColor: false,
      quantity: sale.quantity,
      salePricePerBike: sale.salePricePerBike,
      totalRevenue: sale.totalRevenue,
      costPerBike: sale.costPerBike,
      profit: sale.profit,
      allocations: sale.allocations ?? []
    }];
  }

  refresh(): void {
    this.state.set(this.repository.getAll());
  }

  private paymentStatus(total: number, paid: number): PaymentStatus {
    if (paid <= 0) return 'CREDIT';
    if (paid >= total) return 'PAID';
    return 'PARTIAL';
  }

  private createItem(
    input: NewSaleRequest['items'][number],
    batches: InventoryBatch[]
  ): SaleItem {
    const bike = this.bikes.getById(input.bikeId);
    if (!bike) throw new Error('Bike model not found.');
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new Error('Sale quantity must be a whole number greater than zero.');
    }
    if (input.salePricePerBike < 0) throw new Error('Sale price cannot be negative.');

    const eligible = batches.filter((batch) =>
      batch.remainingQuantity > 0 &&
      this.matchesSelection(batch.bikeId, input.bikeId, input.specificColor)
    );
    const available = eligible.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
    if (input.quantity > available) {
      throw new Error(`Only ${available} bike(s) are available for ${bike.bikeName}${input.specificColor ? ` ${bike.color}` : ''}.`);
    }

    let remaining = input.quantity;
    const allocations: SaleStockAllocation[] = [];
    for (const batch of eligible) {
      if (remaining === 0) break;
      const quantity = Math.min(batch.remainingQuantity, remaining);
      batch.remainingQuantity -= quantity;
      remaining -= quantity;
      allocations.push({
        batchId: batch.id,
        bikeId: batch.bikeId,
        batchType: batch.type,
        purchaseDate: batch.purchaseDate,
        quantity,
        unitCost: batch.unitCost
      });
    }
    const totalRevenue = input.quantity * input.salePricePerBike;
    const totalCost = allocations.reduce((sum, allocation) => sum + allocation.quantity * allocation.unitCost, 0);
    return {
      id: crypto.randomUUID(),
      bikeId: input.bikeId,
      bikeName: bike.bikeName,
      color: input.specificColor ? bike.color : undefined,
      specificColor: input.specificColor,
      quantity: input.quantity,
      salePricePerBike: input.salePricePerBike,
      totalRevenue,
      costPerBike: totalCost / input.quantity,
      profit: totalRevenue - totalCost,
      allocations
    };
  }

  private matchesSelection(candidateBikeId: string, selectedBikeId: string, specificColor: boolean): boolean {
    const candidate = this.bikes.getById(candidateBikeId);
    const selected = this.bikes.getById(selectedBikeId);
    if (!candidate || !selected) return false;
    return specificColor
      ? bikeModelKey(candidate) === bikeModelKey(selected)
      : bikeNameKey(candidate.bikeName) === bikeNameKey(selected.bikeName);
  }

  private remainingBatches(excludedSaleId?: string): InventoryBatch[] {
    const batches = this.allBatches();
    const sales = this.state()
      .filter((sale) => sale.id !== excludedSaleId)
      .sort((left, right) =>
        left.saleDate.localeCompare(right.saleDate) ||
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id)
      );

    for (const sale of sales) {
      const allocations = this.itemsFor(sale).flatMap((item) => item.allocations);
      if (allocations.length) {
        for (const allocation of allocations) {
          const batch = batches.find((item) => item.id === allocation.batchId);
          if (batch) batch.remainingQuantity = Math.max(0, batch.remainingQuantity - allocation.quantity);
        }
        continue;
      }

      for (const item of this.itemsFor(sale)) {
        let remaining = item.quantity;
        const eligible = batches.filter((batch) =>
          this.matchesSelection(batch.bikeId, item.bikeId, item.specificColor)
        );
        for (const batch of eligible) {
          if (remaining === 0) break;
          const consumed = Math.min(batch.remainingQuantity, remaining);
          batch.remainingQuantity -= consumed;
          remaining -= consumed;
        }
      }
    }
    return batches;
  }

  private allBatches(): InventoryBatch[] {
    const opening = this.bikes.bikes()
      .filter((bike) => bike.openingQuantity > 0)
      .map<InventoryBatch>((bike) => ({
        id: `opening:${bike.id}`,
        bikeId: bike.id,
        type: 'opening',
        purchaseDate: bike.createdAt.slice(0, 10),
        createdAt: bike.createdAt,
        unitCost: bike.purchasePrice,
        remainingQuantity: bike.openingQuantity
      }));
    const purchases = this.purchases.purchases()
      .filter((purchase) => purchase.quantity > 0)
      .map<InventoryBatch>((purchase) => ({
        id: purchase.id,
        bikeId: purchase.bikeId,
        type: 'purchase',
        purchaseDate: purchase.purchaseDate,
        createdAt: purchase.createdAt,
        unitCost: purchase.purchasePricePerBike,
        remainingQuantity: purchase.quantity
      }));
    return [...opening, ...purchases].sort((left, right) =>
      left.purchaseDate.localeCompare(right.purchaseDate) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id)
    );
  }
}

interface InventoryBatch {
  id: string;
  bikeId: string;
  type: 'opening' | 'purchase';
  purchaseDate: string;
  createdAt: string;
  unitCost: number;
  remainingQuantity: number;
}
