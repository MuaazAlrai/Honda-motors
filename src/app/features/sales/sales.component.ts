import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { UiService } from '../../shared/services/ui.service';
import { SalesService } from './sales.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTableModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent {
  readonly displayedColumns = ['invoice', 'customer', 'contact', 'bike', 'quantity', 'price', 'revenue', 'profit', 'date', 'actions'];
  readonly stockError = signal('');
  readonly form;
  private readonly formValue;
  readonly selectedBike = computed(() => this.salesService.stock().find((item) => item.id === this.formValue().bikeId));
  readonly total = computed(() => Number(this.formValue().quantity || 0) * Number(this.formValue().salePricePerBike || 0));
  readonly insufficientStock = computed(() => Number(this.formValue().quantity || 0) > (this.selectedBike()?.availableStock ?? 0));

  constructor(formBuilder: FormBuilder, readonly salesService: SalesService, private readonly ui: UiService) {
    this.form = formBuilder.nonNullable.group({
      customerName: ['', Validators.required],
      customerContact: ['', Validators.required],
      bikeId: [salesService.stock()[0]?.id ?? '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      salePricePerBike: [0, [Validators.required, Validators.min(1)]]
    });
    this.formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  }

  saveSale(): void {
    this.stockError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.insufficientStock()) { this.stockError.set('Insufficient bike stock.'); return; }
    try {
      this.salesService.saveSale(this.form.getRawValue());
      this.form.patchValue({ customerName: '', customerContact: '', quantity: 1, salePricePerBike: 0 });
      this.ui.success('Bike sale saved; stock and profit updated.');
    } catch (error) {
      this.stockError.set((error as Error).message);
    }
  }

  deleteSale(id: string): void {
    this.ui.confirm({ title: 'Delete bike sale?', message: 'The sold bikes will be returned to available stock.' }).subscribe(() => {
      this.salesService.deleteSale(id);
      this.ui.success('Bike sale deleted.');
    });
  }
}
