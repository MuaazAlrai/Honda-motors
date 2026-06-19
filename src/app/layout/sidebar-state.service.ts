import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  readonly isCollapsed = signal(false);
  readonly isMobile = signal(false);
  readonly isMobileOpen = signal(false);

  toggle(): void {
    if (this.isMobile()) {
      this.isMobileOpen.update((open) => !open);
    } else {
      this.isCollapsed.update((collapsed) => !collapsed);
    }
  }

  setState(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
  }

  setMobile(isMobile: boolean): void {
    this.isMobile.set(isMobile);
    this.isMobileOpen.set(false);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }
}
