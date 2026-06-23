import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { UiService } from '../../shared/services/ui.service';
import { StockEditDialogComponent } from '../../shared/dialogs/stock-edit-dialog.component';
import { StockItem } from './stock.model';
import { StockService } from './stock.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent {
  readonly search = signal('');
  readonly filteredStock = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.stockService.stock().filter((item) =>
      `${item.bikeName} ${item.modelYear}`.toLowerCase().includes(term)
    );
  });

  constructor(
    readonly stockService: StockService,
    private readonly ui: UiService,
    private readonly dialog: MatDialog
  ) {}

  editBike(item: StockItem): void {
    this.dialog.open(StockEditDialogComponent, {
      data: item,
      width: '720px',
      maxWidth: '95vw'
    }).afterClosed().subscribe((input) => {
      if (!input) return;
      try {
        this.stockService.updateBike(item, input);
        this.ui.success('Stock updated.');
      } catch (error) {
        this.ui.error((error as Error).message);
      }
    });
  }

  deleteBike(item: StockItem): void {
    if (!this.stockService.canDeleteBike(item.id)) {
      this.ui.error('This stock still contains inventory and cannot be deleted.');
      return;
    }
    this.ui.confirm({
      title: 'Delete stock record?',
      message: 'Are you sure you want to delete this stock record?'
    }).subscribe(() => {
      this.stockService.deleteBike(item.id);
      this.ui.success('Stock deleted.');
    });
  }

  stockPercentage(item: StockItem): number {
    const acquired = item.openingQuantity + item.purchasedQuantity;
    return acquired > 0 ? Math.max(0, Math.min(100, (item.availableStock / acquired) * 100)) : 0;
  }
}
