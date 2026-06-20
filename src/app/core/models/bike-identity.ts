import { Bike } from './bike.model';

export type BikeIdentity = Pick<Bike, 'bikeName' | 'modelYear' | 'engineCc' | 'color'>;

export function bikeModelKey(bike: BikeIdentity): string {
  return [
    normalize(bike.bikeName),
    bike.modelYear,
    bike.engineCc,
    normalize(bike.color)
  ].join('|');
}

export function bikeNameKey(bikeName: string): string {
  return normalize(bikeName);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
