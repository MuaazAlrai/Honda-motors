export interface DashboardMetrics {
  totalBikesPurchased: number;
  totalBikesSold: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  inventoryValue: number;
  lowStockCount: number;
  bikeModelCount: number;
  bestSellingBike: string;
}

export interface ActivityItem {
  type: 'Purchase' | 'Sale' | 'Expense';
  description: string;
  amount: number;
  date: string;
}
