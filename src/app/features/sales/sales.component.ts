import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { SaleEditDialogComponent } from '../../shared/dialogs/sale-edit-dialog.component';
import { AddPaymentDialogComponent } from '../../shared/dialogs/add-payment-dialog.component';
import { PasswordConfirmDialogComponent } from '../../shared/dialogs/password-confirm-dialog.component';
import { UiService } from '../../shared/services/ui.service';
import { PaymentType, Sale, SalePayment } from './sales.model';
import { SalesService } from './sales.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent {
  readonly displayedColumns = [
    'customer',
    'contact',
    'purchases',
    'invoices',
    'quantity',
    'revenue',
    'paid',
    'remaining',
    'status',
    'date',
    'actions'
  ];
  readonly stockError = signal('');
  readonly searchQuery = signal('');
  readonly form;
  readonly formValue;

  private readonly expandedInvoices = signal<Set<string>>(new Set());

  readonly filteredCustomerSales = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.salesService.customerSales();
    return this.salesService.customerSales().filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      c.customerContact.toLowerCase().includes(q)
    );
  });

  readonly paymentsBySaleId = computed(() => {
    const map = new Map<string, SalePayment[]>();
    for (const payment of this.salesService.payments()) {
      const list = map.get(payment.saleId) ?? [];
      list.push(payment);
      map.set(payment.saleId, list);
    }
    return map;
  });

  readonly stockOptions = computed(() => this.salesService.availableModels());
  readonly totalQuantity = computed(() =>
    (this.formValue().items ?? []).reduce((total, item) => total + Number(item?.quantity ?? 0), 0)
  );
  readonly grandTotal = computed(() =>
    (this.formValue().items ?? []).reduce(
      (total, item) => total + Number(item?.quantity ?? 0) * Number(item?.salePricePerBike ?? 0),
      0
    )
  );
  readonly effectivePaidAmount = computed(() =>
    Number(this.formValue().paidAmount || 0)
  );
  readonly remainingAmount = computed(() =>
    Math.max(0, this.grandTotal() - this.effectivePaidAmount())
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    readonly salesService: SalesService,
    private readonly ui: UiService,
    private readonly dialog: MatDialog
  ) {
    this.form = formBuilder.nonNullable.group({
      customerName: ['', Validators.required],
      customerContact: ['', Validators.required],
      paymentMethod: ['Cash', Validators.required],
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      items: formBuilder.nonNullable.array([this.createItem()])
    });
    this.formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  }

  get items(): FormArray<SaleItemForm> {
    return this.form.controls.items;
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) return;
    this.items.removeAt(index);
    this.stockError.set('');
  }

  availableFor(index: number): number {
    const bikeId = this.items.at(index).controls.bikeId.value;
    return this.stockOptions().find((stock) => stock.id === bikeId)?.availableStock ?? 0;
  }

  itemTotal(index: number): number {
    const item = this.items.at(index).getRawValue();
    return Number(item.quantity || 0) * Number(item.salePricePerBike || 0);
  }

  selectBike(index: number): void {
    this.stockError.set('');
    const item = this.items.at(index);
    const bike = this.stockOptions().find((stock) => stock.id === item.controls.bikeId.value);
    if (bike && item.controls.salePricePerBike.value <= 0) {
      item.controls.salePricePerBike.setValue(bike.salePrice);
    }
  }

  saveSale(): void {
    this.stockError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      const value = this.form.getRawValue();
      const paidAmount = this.effectivePaidAmount();
      if (paidAmount > this.grandTotal()) {
        this.stockError.set('Paid amount cannot exceed the total bill.');
        return;
      }
      const paymentType: PaymentType = paidAmount <= 0 ? 'CREDIT'
        : paidAmount >= this.grandTotal() ? 'FULL' : 'PARTIAL';
      this.salesService.saveSale({
        customerName: value.customerName,
        customerContact: value.customerContact,
        paymentMethod: value.paymentMethod,
        paymentType,
        paidAmount,
        notes: value.notes,
        items: value.items
      });
      this.form.reset({
        customerName: '',
        customerContact: '',
        paymentMethod: 'Cash',
        paidAmount: 0,
        notes: ''
      });
      this.items.clear();
      this.items.push(this.createItem());
      this.ui.success('Sales invoice saved; inventory and profit updated.');
    } catch (error) {
      this.stockError.set((error as Error).message);
    }
  }

  addPayment(sale: Sale): void {
    this.dialog.open(AddPaymentDialogComponent, {
      data: sale,
      width: '480px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((payment) => {
      if (!payment) return;
      try {
        this.salesService.addPayment(sale.id, payment);
        this.ui.success('Payment added successfully.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }

  editSale(sale: Sale): void {
    this.dialog.open(SaleEditDialogComponent, {
      data: sale,
      width: '720px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((input) => {
      if (!input) return;
      try {
        this.salesService.updateSale(sale.id, input);
        this.ui.success('Sale updated.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }

  deleteSale(id: string): void {
    this.dialog.open(PasswordConfirmDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      disableClose: true
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.salesService.deleteSale(id);
      this.ui.success('Sale deleted.');
    });
  }

  toggleInvoice(id: string): void {
    const next = new Set(this.expandedInvoices());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.expandedInvoices.set(next);
  }

  isInvoiceExpanded(id: string): boolean {
    return this.expandedInvoices().has(id);
  }

  getPaymentsFor(saleId: string): SalePayment[] {
    return (this.paymentsBySaleId().get(saleId) ?? [])
      .slice()
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }

  private createItem(): SaleItemForm {
    return this.formBuilder.nonNullable.group({
      // Do not read stockOptions() here: the first item is created before
      // formValue exists, and stockOptions depends on formValue.
      bikeId: [this.salesService.availableModels()[0]?.id ?? '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      salePricePerBike: [0, [Validators.required, Validators.min(0)]]
    });
  }
}

type SaleItemForm = FormGroup<{
  bikeId: FormControl<string>;
  quantity: FormControl<number>;
  salePricePerBike: FormControl<number>;
}>;
