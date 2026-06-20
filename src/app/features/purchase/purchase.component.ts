import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UiService } from '../../shared/services/ui.service';
import { PurchaseEditDialogComponent } from '../../shared/dialogs/purchase-edit-dialog.component';
import { Purchase } from './purchase.model';
import { PurchasesService } from './purchase.service';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTableModule],
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss'
})
export class PurchaseComponent {
  readonly displayedColumns = ['invoice', 'supplier', 'bike', 'quantity', 'rate', 'total', 'date', 'actions'];
  readonly form;
  readonly formValue;
  readonly selectedBike = computed(() => this.purchasesService.bikes().find((bike) => bike.id === this.formValue().bikeId));
  readonly total = computed(() => Number(this.formValue().quantity || 0) * Number(this.formValue().purchasePricePerBike || 0));

  constructor(
    formBuilder: FormBuilder,
    readonly purchasesService: PurchasesService,
    private readonly ui: UiService,
    private readonly dialog: MatDialog
  ) {
    this.form = formBuilder.nonNullable.group({
      supplierName: ['', Validators.required],
      bikeId: [purchasesService.bikes()[0]?.id ?? '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePricePerBike: [0, [Validators.required, Validators.min(1)]]
    });
    this.formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  }

  savePurchase(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.purchasesService.savePurchase(this.form.getRawValue());
      this.form.patchValue({ supplierName: '', quantity: 1, purchasePricePerBike: 0 });
      this.ui.success('Bike purchase saved and stock updated.');
    } catch (error) {
      this.ui.error((error as Error).message);
    }
  }

  editPurchase(purchase: Purchase): void {
    this.dialog.open(PurchaseEditDialogComponent, {
      data: {
        purchase,
        bikes: this.purchasesService.bikes(),
        bikeLocked: this.purchasesService.hasRelatedSales(purchase.id)
      },
      width: '720px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((input) => {
      if (!input) return;
      try {
        this.purchasesService.updatePurchase(purchase.id, input);
        this.ui.success('Purchase updated.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }

  deletePurchase(id: string): void {
    if (this.purchasesService.hasRelatedSales(id)) {
      this.ui.error('This purchase batch has related sales and cannot be deleted.');
      return;
    }
    this.ui.confirm({ title: 'Delete bike purchase?', message: 'Inventory and average purchase cost will be recalculated.' }).subscribe(() => {
      try {
        this.purchasesService.deletePurchase(id);
        this.ui.success('Purchase deleted.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }
}
