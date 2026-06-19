import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../dialogs/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class UiService {
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 2800, panelClass: 'success-snackbar' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 4000, panelClass: 'error-snackbar' });
  }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .pipe(filter((confirmed): confirmed is boolean => confirmed === true));
  }
}
