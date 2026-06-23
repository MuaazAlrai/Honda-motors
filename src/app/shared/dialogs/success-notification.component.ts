import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-success-notification',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content>
      <div class="success-icon">
        <svg viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="25" fill="none"/>
          <path fill="none" d="M14 27l8 8 16-18"/>
        </svg>
      </div>
      <h2>Success!</h2>
      <p>{{ data }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-flat-button class="ok-btn" (click)="close()">OK</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 28px 16px;
      gap: 4px;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 4px solid #4caf50;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      animation: pop .35s ease;
    }
    .success-icon svg {
      width: 48px;
      height: 48px;
    }
    .success-icon circle {
      stroke: #4caf50;
      stroke-width: 2;
    }
    .success-icon path {
      stroke: #4caf50;
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 0;
      animation: draw .35s ease .2s both;
    }
    @keyframes pop {
      0% { transform: scale(.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes draw {
      from { stroke-dashoffset: 48; }
      to   { stroke-dashoffset: 0; }
    }
    h2 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 700;
      color: #212121;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    mat-dialog-actions { padding: 12px 28px 24px; }
    .ok-btn {
      min-width: 100px;
      height: 40px;
      border-radius: 8px !important;
      background: #5c6bc0 !important;
      color: white !important;
      font-weight: 600;
      font-size: 15px;
    }
  `]
})
export class SuccessNotificationComponent {
  constructor(
    private readonly ref: MatDialogRef<SuccessNotificationComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: string
  ) {
    setTimeout(() => ref.close(), 3000);
  }

  close(): void {
    this.ref.close();
  }
}
