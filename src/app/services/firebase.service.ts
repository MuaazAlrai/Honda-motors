import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface BikeDocument {
  id?: string;
  name: string;
  price: number;
  createdAt?: unknown;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly operationTimeoutMs = 20_000;
  private readonly firestore = inject(Firestore);
  private readonly bikesCollection = collection(this.firestore, 'bikes');

  async addBike(bike: Omit<BikeDocument, 'id' | 'createdAt'> = {
    name: 'Honda 125',
    price: 250000
  }) {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Saving the bike timed out. Check your connection and try again.')),
        this.operationTimeoutMs
      );
    });

    return Promise.race([
      addDoc(this.bikesCollection, {
        ...bike,
        createdAt: serverTimestamp()
      }),
      timeout
    ]).finally(() => clearTimeout(timeoutId));
  }

  getBikes(): Observable<BikeDocument[]> {
    return collectionData(this.bikesCollection, {
      idField: 'id'
    }) as Observable<BikeDocument[]>;
  }
}
