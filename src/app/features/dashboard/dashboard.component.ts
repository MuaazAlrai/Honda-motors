import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="page-header">
      <div><span class="eyebrow">MARI HONDA MOTORS</span><h1>Motorcycle Dealership Dashboard</h1><p>Showroom stock, sales and profitability at a glance.</p></div>
      <div class="dashboard-actions">
        <div class="date-chip"><mat-icon>calendar_today</mat-icon>{{ today | date:'EEEE, d MMMM' }}</div>
        <!-- <button mat-flat-button color="primary" type="button" [disabled]="isSaving" (click)="saveData()">
          <mat-icon [class.loading-hidden]="isSaving">cloud_upload</mat-icon>
          <span class="button-spinner" [class.loading-hidden]="!isSaving" aria-hidden="true"></span>
          <span>{{ isSaving ? 'Saving' : 'Save Bike' }}</span>
        </button> -->
      </div>
    </section>
    @if (firebaseMessage) {
      <div class="firebase-message" [class.error]="firebaseError" role="status">
        <mat-icon>{{ firebaseError ? 'error' : 'cloud_done' }}</mat-icon>
        <span>{{ firebaseMessage }}</span>
      </div>
    }
    <section class="metric-grid">
      @for (card of cards(); track card.label) {
        <mat-card class="metric-card" [class]="'accent-' + card.accent"><mat-card-content><div class="metric-icon"><mat-icon>{{ card.icon }}</mat-icon></div><div><span>{{ card.label }}</span><strong>{{ card.currency ? (card.value | currency:'PKR ':'symbol':'1.0-0') : card.value }}</strong></div></mat-card-content></mat-card>
      }
    </section>
    <section class="dashboard-grid">
      <mat-card class="content-card chart-card">
        <mat-card-header><mat-card-title>Monthly bike sales</mat-card-title><mat-card-subtitle>Revenue for the last six months</mat-card-subtitle></mat-card-header>
        <mat-card-content class="sales-chart">
          @for (month of service.monthlySales(); track month.label) {
            <div class="chart-column"><strong>{{ month.revenue | currency:'PKR ':'symbol':'1.0-0' }}</strong><div class="chart-track"><span [style.height.%]="month.revenue / service.maxMonthlyRevenue() * 100"></span></div><small>{{ month.label }}</small></div>
          }
        </mat-card-content>
      </mat-card>
      <mat-card class="content-card">
        <mat-card-header><mat-card-title>Dealer intelligence</mat-card-title><mat-card-subtitle>Inventory and sales highlights</mat-card-subtitle></mat-card-header>
        <mat-card-content class="financial-list">
          <div><span>Best selling bike</span><strong>{{ service.metrics().bestSellingBike }}</strong></div>
          <div><span>Active bike models</span><strong>{{ service.metrics().bikeModelCount }}</strong></div>
          <div><span>Inventory value</span><strong>{{ service.metrics().inventoryValue | currency:'PKR ':'symbol':'1.0-0' }}</strong></div>
          <div class="net"><span>Net Profit</span><strong>{{ service.metrics().netProfit | currency:'PKR ':'symbol':'1.0-0' }}</strong></div>
        </mat-card-content>
      </mat-card>
    </section>
    <section class="dashboard-grid lower-grid">
      <mat-card class="content-card">
        <mat-card-header><mat-card-title>Low stock alerts</mat-card-title><mat-card-subtitle>Models with fewer than 3 bikes</mat-card-subtitle></mat-card-header>
        <mat-card-content class="alert-list">
          @for (item of service.lowStockAlerts(); track item.id) { <div><mat-icon>warning_amber</mat-icon><span><strong>{{ item.bikeName }}</strong><small>{{ item.engineCc }} CC · {{ item.color }}</small></span><b>{{ item.availableStock }} left</b></div> }
          @empty { <div class="empty-state compact"><mat-icon>verified</mat-icon><h3>Stock levels look healthy</h3></div> }
        </mat-card-content>
      </mat-card>
      <mat-card class="content-card activity-card">
        <mat-card-header><mat-card-title>Recent activity</mat-card-title><mat-card-subtitle>Latest dealership transactions</mat-card-subtitle></mat-card-header>
        <mat-card-content>
          @for (item of service.recentActivity(); track item.type + item.date + item.description) {
            <div class="activity-row"><div class="activity-icon" [class]="item.type.toLowerCase()"><mat-icon>{{ item.type === 'Sale' ? 'north_east' : item.type === 'Purchase' ? 'south_west' : 'receipt_long' }}</mat-icon></div><div class="activity-copy"><strong>{{ item.type }}</strong><span>{{ item.description }}</span></div><div class="activity-amount"><strong>{{ item.amount | currency:'PKR ':'symbol':'1.0-0' }}</strong><span>{{ item.date | date:'d MMM' }}</span></div></div>
          } @empty { <div class="empty-state"><mat-icon>two_wheeler</mat-icon><h3>Your showroom dashboard is ready</h3><p>Add bikes and transactions to see analytics.</p></div> }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .dashboard-actions{display:flex;align-items:center;gap:12px}.dashboard-actions button{min-width:148px}.button-spinner{width:18px;height:18px;display:inline-block;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}.loading-hidden{display:none!important}@keyframes spin{to{transform:rotate(360deg)}}.firebase-message{display:flex;align-items:center;gap:10px;margin:-10px 0 22px;padding:12px 16px;color:#b7e1c4;border:1px solid rgba(83,170,109,.4);border-radius:6px;background:rgba(83,170,109,.12)}.firebase-message.error{color:#ffaaa7;border-color:rgba(229,57,53,.38);background:rgba(229,57,53,.1)}.lower-grid{margin-top:24px}.sales-chart{height:250px;display:flex;align-items:flex-end;gap:16px;padding:24px!important}.chart-column{height:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px}.chart-column>strong{font-size:10px;color:var(--muted)}.chart-track{height:170px;width:100%;max-width:54px;display:flex;align-items:flex-end;border-radius:10px;background:#242424;overflow:hidden}.chart-track span{width:100%;min-height:4px;background:linear-gradient(180deg,#ef5350,#b71c1c);border-radius:10px 10px 0 0}.chart-column small{color:var(--muted)}.alert-list{padding:12px 22px 22px!important}.alert-list>div:not(.empty-state){display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}.alert-list mat-icon{color:#ef5350}.alert-list span{flex:1}.alert-list strong,.alert-list small{display:block}.alert-list small{color:var(--muted)}.alert-list b{color:#ef5350}.compact{padding:28px 10px}@media(max-width:700px){.dashboard-actions{width:100%}.dashboard-actions button{width:100%}.sales-chart{gap:6px;padding:18px 10px!important}.chart-column>strong{display:none}}
  `]
})
export class DashboardComponent {
  readonly today = new Date();
  isSaving = false;
  firebaseMessage = '';
  firebaseError = false;
  readonly cards = computed(() => {
    const metrics = this.service.metrics();
    return [
      { label: 'Bikes Purchased', value: metrics.totalBikesPurchased, icon: 'local_shipping', accent: 'silver', currency: false },
      { label: 'Bikes Sold', value: metrics.totalBikesSold, icon: 'two_wheeler', accent: 'red', currency: false },
      { label: 'Cash in Hand', value: metrics.cashInHand, icon: 'payments', accent: 'silver', currency: true },
      { label: 'Outstanding Credit', value: metrics.outstandingCredit, icon: 'credit_score', accent: 'red', currency: true },
      { label: 'Total Profit', value: metrics.totalProfit, icon: 'trending_up', accent: 'red', currency: true },
      { label: 'Total Expenses', value: metrics.totalExpenses, icon: 'receipt_long', accent: 'silver', currency: true },
      { label: 'Net Profit', value: metrics.netProfit, icon: 'account_balance_wallet', accent: 'red', currency: true }
    ];
  });
  constructor(
    readonly service: DashboardService,
    private readonly firebaseService: FirebaseService
  ) {}

  async saveData(): Promise<void> {
    this.isSaving = true;
    this.firebaseMessage = '';

    try {
      const document = await this.firebaseService.addBike();
      this.firebaseError = false;
      this.firebaseMessage = `Bike saved to Firestore with ID ${document.id}.`;
    } catch (error: unknown) {
      this.firebaseError = true;
      this.firebaseMessage = error instanceof Error
        ? `Firestore error: ${error.message}`
        : 'Firestore could not save the bike.';
      console.error(error);
    } finally {
      this.isSaving = false;
    }
  }
}
