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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { SaleEditDialogComponent } from '../../shared/dialogs/sale-edit-dialog.component';
import { AddPaymentDialogComponent } from '../../shared/dialogs/add-payment-dialog.component';
import { UiService } from '../../shared/services/ui.service';
import { PaymentType, Sale } from './sales.model';
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
    MatSlideToggleModule,
    MatTableModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent {
  readonly displayedColumns = [
    'invoice',
    'customer',
    'contact',
    'items',
    'quantity',
    'revenue',
    'paid',
    'remaining',
    'paymentMethod',
    'status',
    'date',
    'notes',
    'actions'
  ];
  readonly stockError = signal('');
  readonly form;
  readonly formValue;

  readonly specificColor = computed(() => Boolean(this.formValue().specificColor));
  readonly stockOptions = computed(() =>
    this.specificColor() ? this.salesService.colorStock() : this.salesService.availableModels()
  );
  readonly totalQuantity = computed(() =>
    (this.formValue().items ?? []).reduce((total, item) => total + Number(item?.quantity ?? 0), 0)
  );
  readonly grandTotal = computed(() =>
    (this.formValue().items ?? []).reduce(
      (total, item) => total + Number(item?.quantity ?? 0) * Number(item?.salePricePerBike ?? 0),
      0
    )
  );
  readonly effectivePaidAmount = computed(() => {
    const type = this.formValue().paymentType;
    if (type === 'FULL') return this.grandTotal();
    if (type === 'CREDIT') return 0;
    return Number(this.formValue().paidAmount || 0);
  });
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
      paymentType: formBuilder.nonNullable.control<PaymentType>('FULL', Validators.required),
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      specificColor: [false],
      items: formBuilder.nonNullable.array([this.createItem()])
    });
    this.formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
    this.form.controls.specificColor.valueChanges.subscribe(() => {
      this.stockError.set('');
      const firstId = this.stockOptions()[0]?.id ?? '';
      this.items.controls.forEach((item) => item.controls.bikeId.setValue(firstId));
    });
    this.form.controls.paymentType.valueChanges.subscribe((type) => {
      if (type === 'CREDIT') this.form.controls.paidAmount.setValue(0);
      if (type === 'FULL') this.form.controls.paidAmount.setValue(this.grandTotal());
    });
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
      this.salesService.saveSale({
        customerName: value.customerName,
        customerContact: value.customerContact,
        paymentMethod: value.paymentMethod,
        paymentType: value.paymentType,
        paidAmount,
        notes: value.notes,
        items: value.items.map((item) => ({
          ...item,
          specificColor: value.specificColor
        }))
      });
      this.form.reset({
        customerName: '',
        customerContact: '',
        paymentMethod: 'Cash',
        paymentType: 'FULL',
        paidAmount: 0,
        notes: '',
        specificColor: false
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
    this.ui.confirm({
      title: 'Delete sales invoice?',
      message: 'All bikes on this invoice will be returned to inventory.'
    }).subscribe(() => {
      this.salesService.deleteSale(id);
      this.ui.success('Sale deleted.');
    });
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
