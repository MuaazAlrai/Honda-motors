import { computed, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';
import {
  CustomerLedgerEntry,
  Sale,
  SalePayment
} from '../../features/sales/sales.model';
import { LocalStorageRepository } from '../../repositories/local-storage.repository';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly paymentRepository;
  private readonly ledgerRepository;
  private readonly paymentState = signal<SalePayment[]>([]);
  private readonly ledgerState = signal<CustomerLedgerEntry[]>([]);
  readonly payments = this.paymentState.asReadonly();
  readonly ledgerEntries = this.ledgerState.asReadonly();
  readonly initialPaymentMethods = computed(() => {
    const methods = new Map<string, string>();
    for (const payment of this.paymentState()) {
      if (payment.notes !== 'Initial payment' || methods.has(payment.saleId)) continue;
      methods.set(payment.saleId, payment.paymentMethod);
    }
    return methods;
  });

  constructor(
    repositoryFactory: LocalStorageRepository,
    private readonly firestore: Firestore,
    private readonly auth: Auth
  ) {
    this.paymentRepository = repositoryFactory.collection<SalePayment>('sale-payments');
    this.ledgerRepository = repositoryFactory.collection<CustomerLedgerEntry>('customer-ledger');
    this.refresh();
  }

  recordSale(sale: Sale, paymentMethod: string): void {
    const paidAmount = sale.paidAmount ?? sale.totalRevenue;
    const remainingAmount = sale.remainingAmount ?? 0;
    this.ledgerRepository.create({
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      entryType: 'SALE',
      debit: sale.totalRevenue,
      credit: 0,
      balance: sale.totalRevenue,
      entryDate: sale.saleDate,
      notes: 'Sales invoice'
    });
    if (paidAmount > 0) {
      this.createPayment(sale, paidAmount, paymentMethod, sale.saleDate, 'Initial payment');
    }
    this.refresh();
    void this.syncBalance(sale, remainingAmount);
  }

  recordPayment(
    sale: Sale,
    amount: number,
    paymentMethod: string,
    paymentDate: string,
    notes: string
  ): void {
    this.createPayment(sale, amount, paymentMethod, paymentDate, notes);
    this.refresh();
    void this.syncBalance(sale, sale.remainingAmount ?? 0);
  }

  private createPayment(
    sale: Sale,
    amount: number,
    paymentMethod: string,
    paymentDate: string,
    notes: string
  ): void {
    const payment = this.paymentRepository.create({
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      amount,
      paymentMethod,
      paymentDate,
      notes
    });
    this.ledgerRepository.create({
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      entryType: 'PAYMENT',
      debit: 0,
      credit: amount,
      balance: sale.remainingAmount ?? Math.max(0, sale.totalRevenue - amount),
      entryDate: paymentDate,
      notes
    });
    void this.syncPayment(sale, payment);
  }

  private async syncBalance(sale: Sale, remainingAmount: number): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    try {
      await setDoc(doc(this.firestore, 'users', uid, 'saleBalances', sale.id), {
        ownerId: uid,
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        customerContact: sale.customerContact,
        totalAmount: sale.totalRevenue,
        paidAmount: sale.paidAmount ?? sale.totalRevenue,
        remainingAmount,
        paymentStatus: sale.paymentStatus ?? 'PAID',
        updatedAt: serverTimestamp()
      }, { merge: true });
      const customerId = this.customerKey(sale.customerName, sale.customerContact);
      await setDoc(doc(this.firestore, 'users', uid, 'customerLedgers', customerId), {
        ownerId: uid,
        customerName: sale.customerName,
        customerContact: sale.customerContact,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await setDoc(
        doc(collection(this.firestore, 'users', uid, 'customerLedgers', customerId, 'entries'), sale.id),
        {
          ownerId: uid,
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          saleAmount: sale.totalRevenue,
          paidAmount: sale.paidAmount ?? sale.totalRevenue,
          outstanding: remainingAmount,
          entryType: 'SALE_BALANCE',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Could not sync sale balance to Firestore.', error);
    }
  }

  private async syncPayment(sale: Sale, payment: SalePayment): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    try {
      await setDoc(doc(this.firestore, 'users', uid, 'saleBalances', sale.id, 'payments', payment.id), {
        ownerId: uid,
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Could not sync payment to Firestore.', error);
    }
  }

  private customerKey(name: string, contact: string): string {
    return `${name}-${contact}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID();
  }

  private refresh(): void {
    this.paymentState.set(this.paymentRepository.getAll());
    this.ledgerState.set(this.ledgerRepository.getAll());
  }
}
