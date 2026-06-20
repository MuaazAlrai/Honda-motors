import { CurrencyPipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { BikeService } from '../../core/services/bike.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SaleService } from '../../core/services/sale.service';
import { UiService } from '../../shared/services/ui.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent {
  readonly displayedColumns = ['id', 'bike', 'year', 'engine', 'color', 'purchase', 'quantity', 'actions'];
  readonly nextBikeId = computed(() => this.bikeService.bikes().length + 1);
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    readonly bikeService: BikeService,
    private readonly purchaseService: PurchaseService,
    private readonly saleService: SaleService,
    private readonly ui: UiService
  ) {
    this.form = formBuilder.nonNullable.group({
      bikeName: ['', [Validators.required, Validators.maxLength(100)]],
      modelYear: [new Date().getFullYear(), [Validators.required, Validators.min(1950)]],
      engineCc: [70, [Validators.required, Validators.min(1)]],
      color: ['', [Validators.required, Validators.maxLength(40)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],
      openingQuantity: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addBike(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.bikeService.create(this.form.getRawValue());
      this.form.reset({
        bikeName: '',
        modelYear: new Date().getFullYear(),
        engineCc: 70,
        color: '',
        purchasePrice: 0,
        salePrice: 0,
        openingQuantity: 0
      });
      this.ui.success('Bike model added to inventory.');
    } catch (error) {
      this.ui.error((error as Error).message);
    }
  }

  removeBike(id: string, name: string): void {
    const inUse =
      this.purchaseService.purchases().some((item) => item.bikeId === id) ||
      this.saleService.sales().some((item) =>
        item.bikeId === id || item.allocations?.some((allocation) => allocation.bikeId === id)
      );
    if (inUse) {
      this.ui.error('This bike has transactions and cannot be deleted.');
      return;
    }
    this.ui
      .confirm({ title: 'Delete bike model?', message: `${name} will be permanently removed.` })
      .subscribe(() => {
        this.bikeService.delete(id);
        this.ui.success('Bike model deleted.');
      });
  }
}
