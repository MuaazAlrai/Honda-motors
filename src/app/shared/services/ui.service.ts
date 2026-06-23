import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../dialogs/confirm-dialog.component';
import { SuccessNotificationComponent } from '../dialogs/success-notification.component';

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly topSnackbar = {
    horizontalPosition: 'center' as const,
    verticalPosition: 'top' as const
  };

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  success(message: string): void {
    this.dialog.open(SuccessNotificationComponent, {
      data: message,
      width: '320px',
      maxWidth: '92vw',
      panelClass: 'success-dialog-panel'
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      ...this.topSnackbar,
      duration: 4000,
      panelClass: 'error-snackbar'
    });
  }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .pipe(filter((confirmed): confirmed is boolean => confirmed === true));
  }
}
