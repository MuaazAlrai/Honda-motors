import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProfitService } from './profit.service';

@Component({
  selector: 'app-profit',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatIconModule],
  templateUrl: './profit.component.html',
  styleUrl: './profit.component.scss'
})
export class ProfitComponent {
  constructor(readonly profitService: ProfitService) {}
}
