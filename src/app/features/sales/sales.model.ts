export interface Sale {
  id: string;
  bikeId: string;
  customerName: string;
  customerContact: string;
  invoiceNumber: string;
  quantity: number;
  salePricePerBike: number;
  totalRevenue: number;
  costPerBike: number;
  profit: number;
  saleDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type SaleInput = Omit<
  Sale,
  'id' | 'totalRevenue' | 'costPerBike' | 'profit' | 'createdAt' | 'updatedAt'
>;

export interface SaleView extends Sale {
  bikeName: string;
}

export interface NewSaleRequest {
  bikeId: string;
  customerName: string;
  customerContact: string;
  quantity: number;
  salePricePerBike: number;
}
