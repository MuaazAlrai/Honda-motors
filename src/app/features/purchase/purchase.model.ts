export interface Purchase {
  id: string;
  bikeId: string;
  supplierName: string;
  invoiceNumber: string;
  quantity: number;
  purchasePricePerBike: number;
  totalCost: number;
  purchaseDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseInput = Omit<Purchase, 'id' | 'totalCost' | 'createdAt' | 'updatedAt'>;

export interface PurchaseView extends Purchase {
  bikeName: string;
}

export interface NewPurchaseRequest {
  bikeId: string;
  supplierName: string;
  quantity: number;
  purchasePricePerBike: number;
}
