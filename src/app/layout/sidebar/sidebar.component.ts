import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarStateService } from '../sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <aside
      class="sidebar"
      [class.collapsed]="state.isCollapsed() && !state.isMobile()"
      [class.open]="state.isMobileOpen()"
    >
      <div class="brand">
        <!-- <img class="sidebar-logo" src="/images/mari-honda-logo.png" alt="Mari Honda Motors" /> -->
        <div class="brand-copy">
          <strong>Mari Honda Motors</strong>
          <span>PREMIUM DEALERSHIP ERP</span>
        </div>
        <button
          mat-icon-button
          class="sidebar-toggle"
          [attr.aria-label]="state.isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          (click)="state.toggle()"
        >
          <mat-icon>{{ state.isMobile() ? 'close' : state.isCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <div class="nav-label">WORKSPACE</div>
      <mat-nav-list>
        @for (item of navItems; track item.route) {
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active"
            [matTooltip]="item.label"
            [matTooltipDisabled]="!state.isCollapsed() || state.isMobile()"
            matTooltipPosition="right"
            (click)="state.isMobile() && state.closeMobile()"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle class="nav-text">{{ item.label }}</span>
          </a>
        }
      </mat-nav-list>
    </aside>
  `
})
export class SidebarComponent {
  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'space_dashboard' },
    { label: 'Bike Inventory', route: '/products', icon: 'two_wheeler' },
    { label: 'Bike Stock', route: '/stock', icon: 'inventory_2' },
    // Bike Purchases menu is temporarily disabled.
    // { label: 'Bike Purchases', route: '/purchases', icon: 'two_wheeler' },
    { label: 'Bike Sales', route: '/sales', icon: 'point_of_sale' },
    { label: 'Expenses', route: '/expenses', icon: 'receipt_long' },
    { label: 'Profit', route: '/profit', icon: 'account_balance_wallet' }
  ];

  constructor(readonly state: SidebarStateService) {}
}
