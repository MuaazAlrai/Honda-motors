export interface Bike {
  id: string;
  bikeName: string;
  modelYear: number;
  engineCc: number;
  color: string;
  purchasePrice: number;
  salePrice: number;
  openingQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export type BikeInput = Omit<Bike, 'id' | 'createdAt' | 'updatedAt'>;
