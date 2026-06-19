import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UiService } from '../../shared/services/ui.service';
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
    return this.stockService.stock().filter((item) => `${item.bikeName} ${item.modelYear} ${item.engineCc} ${item.color}`.toLowerCase().includes(term));
  });

  constructor(readonly stockService: StockService, private readonly ui: UiService) {}

  deleteBike(item: StockItem): void {
    if (!this.stockService.canDeleteBike(item.id)) {
      this.ui.error('This bike has purchase or sale history and cannot be deleted.');
      return;
    }
    this.ui.confirm({ title: 'Delete bike model?', message: `${item.bikeName} will be permanently removed.` }).subscribe(() => {
      this.stockService.deleteBike(item.id);
      this.ui.success('Bike model deleted.');
    });
  }

  stockPercentage(item: StockItem): number {
    const acquired = item.openingQuantity + item.purchasedQuantity;
    return acquired > 0 ? Math.max(0, Math.min(100, (item.availableStock / acquired) * 100)) : 0;
  }
}
