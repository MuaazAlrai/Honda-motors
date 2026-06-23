import { CurrencyPipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { BikeService } from '../../core/services/bike.service';
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
  readonly displayedColumns = ['bike', 'purchase', 'quantity'];
  readonly catalog = computed(() => {
    const models = new Map<string, ReturnType<BikeService['bikes']>[number]>();
    for (const bike of this.bikeService.bikes()) {
      const key = bike.bikeName.trim().replace(/\s+/g, ' ').toLowerCase();
      const existing = models.get(key);
      if (existing) {
        existing.openingQuantity += bike.openingQuantity;
      } else {
        models.set(key, { ...bike });
      }
    }
    return [...models.values()];
  });
  readonly form;

  constructor(
    formBuilder: FormBuilder,
    readonly bikeService: BikeService,
    private readonly ui: UiService
  ) {
    this.form = formBuilder.nonNullable.group({
      bikeName: ['', [Validators.required, Validators.maxLength(100)]],
      modelYear: [new Date().getFullYear(), [Validators.required, Validators.min(1950)]],
      engineCc: [0],
      color: [''],
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
        engineCc: 0,
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

}
