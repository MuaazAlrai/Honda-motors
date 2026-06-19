import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  products: `${environment.apiBaseUrl}/products`,
  purchases: `${environment.apiBaseUrl}/purchases`,
  sales: `${environment.apiBaseUrl}/sales`,
  expenses: `${environment.apiBaseUrl}/expenses`,
  dashboard: `${environment.apiBaseUrl}/dashboard`
} as const;
