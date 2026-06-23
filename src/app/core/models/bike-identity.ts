import { Bike } from './bike.model';

export type BikeIdentity = Pick<Bike, 'bikeName'>;

export function bikeModelKey(bike: BikeIdentity): string {
  return normalize(bike.bikeName);
}

export function bikeNameKey(bikeName: string): string {
  return normalize(bikeName);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
