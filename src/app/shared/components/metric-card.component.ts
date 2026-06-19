import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface MetricCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="metric-card" [class]="'metric-card--' + card().color">
      <mat-card-content>
        <div class="metric-header">
          <h3 class="metric-title">{{ card().title }}</h3>
          <mat-icon class="metric-icon">{{ card().icon }}</mat-icon>
        </div>
        <div class="metric-value">{{ formatValue(card().value) }}</div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .metric-card {
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
      }

      .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }

      .metric-card--blue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .metric-card--green {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
      }

      .metric-card--orange {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .metric-card--red {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        color: white;
      }

      .metric-card--purple {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        color: #333;
      }

      mat-card-content {
        padding: 24px;
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .metric-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        opacity: 0.9;
      }

      .metric-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        opacity: 0.7;
      }

      .metric-value {
        font-size: 32px;
        font-weight: 700;
      }
    `
  ]
})
export class MetricCardComponent {
  card = input.required<MetricCard>();
  click = output();

  formatValue(value: number | string): string {
    if (typeof value === 'string') return value;
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}
