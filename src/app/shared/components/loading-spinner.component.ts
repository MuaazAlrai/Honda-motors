import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (isLoading()) {
      <div class="loading-overlay">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">{{ message() }}</p>
      </div>
    }
  `,
  styles: [
    `
      .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
      }

      .loading-text {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    `
  ]
})
export class LoadingSpinnerComponent {
  isLoading = input(false);
  message = input('Loading...');
}
