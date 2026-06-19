import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout.component';
import { AuthComponent } from './auth/auth/auth';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign In | Mari Honda Motors',
    component: AuthComponent
  },
  {
    path: 'forgot-password',
    title: 'Forgot Password | Mari Honda Motors',
    loadComponent: () => import('./auth/reset-password/reset-password')
      .then((m) => m.ResetPasswordComponent)
  },
  {
    path: 'reset-password',
    title: 'Reset Password | Mari Honda Motors',
    loadComponent: () => import('./auth/reset-password/reset-password')
      .then((m) => m.ResetPasswordComponent)
  },
  { path: 'auth', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', title: 'Dashboard | Mari Honda Motors', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'products', title: 'Bike Inventory | Mari Honda Motors', loadComponent: () => import('./features/product/product.component').then((m) => m.ProductComponent) },
      { path: 'stock', title: 'Bike Stock | Mari Honda Motors', loadComponent: () => import('./features/stock/stock.component').then((m) => m.StockComponent) },
      { path: 'purchases', title: 'Bike Purchases | Mari Honda Motors', loadComponent: () => import('./features/purchase/purchase.component').then((m) => m.PurchaseComponent) },
      { path: 'sales', title: 'Bike Sales | Mari Honda Motors', loadComponent: () => import('./features/sales/sales.component').then((m) => m.SalesComponent) },
      { path: 'expenses', title: 'Expenses | Mari Honda Motors', loadComponent: () => import('./features/expense/expense.component').then((m) => m.ExpenseComponent) },
      { path: 'profit', title: 'Profit | Mari Honda Motors', loadComponent: () => import('./features/profit/profit.component').then((m) => m.ProfitComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];
