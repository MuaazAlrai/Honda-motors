import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../core/storage/storage.service';
import { ResetDataConfirmDialogComponent } from '../shared/dialogs/reset-data-confirm-dialog.component';
import { UiService } from '../shared/services/ui.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarStateService } from './sidebar-state.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule
  ],
  template: `
    <div
      class="app-layout"
      [class.sidebar-collapsed]="sidebarState.isCollapsed() && !sidebarState.isMobile()"
    >
      @if (sidebarState.isMobile() && sidebarState.isMobileOpen()) {
        <button
          class="sidebar-backdrop"
          aria-label="Close navigation"
          (click)="sidebarState.closeMobile()"
        ></button>
      }

      <app-sidebar />

      <div class="workspace-scroll">
        <header class="top-header">
          <mat-toolbar class="navbar">
            <button
              mat-icon-button
              class="header-toggle"
              [attr.aria-label]="sidebarState.isMobile() ? 'Open navigation' : 'Toggle sidebar'"
              (click)="sidebarState.toggle()"
            >
              <mat-icon>{{ sidebarState.isMobile() ? 'menu' : sidebarState.isCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
            <img class="header-logo" src="/images/mari-honda-logo.png" alt="Mari Honda Motors" />
            <div class="navbar-title">
              <strong>Mari Honda Motors</strong>
              <span>Motorcycle Dealership Management · 0307-3068132</span>
            </div>
            <span class="spacer"></span>
            <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon><span>Sign out</span>
              </button>
              <button mat-menu-item (click)="clearData()">
                <mat-icon>delete_sweep</mat-icon><span>Reset application data</span>
              </button>
            </mat-menu>
            <!-- <div class="dealer-status"><span></span> Showroom Online</div> -->
          </mat-toolbar>
        </header>

        <main class="content-area">
          <div class="content-inner"><router-outlet /></div>
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    breakpoints: BreakpointObserver,
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly ui: UiService,
    readonly sidebarState: SidebarStateService
  ) {
    breakpoints
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.sidebarState.setMobile(result.matches));
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  clearData(): void {
    this.dialog
      .open(ResetDataConfirmDialogComponent, {
        width: '460px',
        data: {
          title: 'Reset all ERP data?',
          message: 'Bike inventory, purchases, sales, and expenses will be permanently deleted. Type your login password to continue.',
          confirmText: 'Reset data',
          cancelText: 'No'
        }
      })
      .afterClosed()
      .subscribe(async (password) => {
        if (!password) return;

        try {
          await this.auth.reauthenticateWithPassword(password);
          await this.storage.clearApplicationData();
          location.reload();
        } catch (error) {
          console.error('Could not reset application data.', error);
          this.ui.error(this.resetDataErrorMessage(error));
        }
      });
  }

  private resetDataErrorMessage(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Password is incorrect. Application data was not reset.';
    }

    if (code === 'auth/requires-recent-login') {
      return 'Please sign in again before resetting application data.';
    }

    return 'Application data could not be reset. Please try again.';
  }
}
