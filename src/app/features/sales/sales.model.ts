export interface SaleStockAllocation {
  batchId: string;
  bikeId?: string;
  batchType: 'opening' | 'purchase';
  purchaseDate: string;
  quantity: number;
  unitCost: number;
}

export interface SaleItem {
  id: string;
  bikeId: string;
  bikeName: string;
  quantity: number;
  salePricePerBike: number;
  totalRevenue: number;
  costPerBike: number;
  profit: number;
  allocations: SaleStockAllocation[];
}

export interface Sale {
  id: string;
  bikeId: string;
  customerName: string;
  customerContact: string;
  invoiceNumber: string;
  quantity: number;
  salePricePerBike: number;
  totalRevenue: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  costPerBike: number;
  profit: number;
  saleDate: string;
  paymentMethod?: string;
  originalPaymentMethod?: string;
  notes: string;
  allocations?: SaleStockAllocation[];
  items?: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export type SaleInput = Omit<
  Sale,
  'id' | 'totalRevenue' | 'costPerBike' | 'profit' | 'allocations' | 'createdAt' | 'updatedAt'
>;

export interface SaleView extends Sale {
  bikeName: string;
  itemsView: SaleItem[];
  itemsSummary: string;
}

export interface CustomerSalesView {
  customerKey: string;
  customerName: string;
  customerContact: string;
  sales: SaleView[];
  totalInvoices: number;
  totalBikes: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  paymentStatus: PaymentStatus;
  lastSaleDate: string;
}

export interface NewSaleItemRequest {
  bikeId: string;
  quantity: number;
  salePricePerBike: number;
}

export interface NewSaleRequest {
  customerName: string;
  customerContact: string;
  paymentMethod: string;
  paymentType: PaymentType;
  paidAmount: number;
  notes: string;
  items: NewSaleItemRequest[];
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT';
export type PaymentType = 'FULL' | 'PARTIAL' | 'CREDIT';

export interface SalePayment {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  entryType: 'SALE' | 'PAYMENT';
  debit: number;
  credit: number;
  balance: number;
  entryDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type SaleUpdate = Pick<
  Sale,
  'customerName' | 'saleDate' | 'quantity' | 'salePricePerBike' | 'notes'
> & {
  paymentMethod: string;
};
