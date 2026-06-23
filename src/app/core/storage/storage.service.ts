import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';

interface ErpSnapshot {
  ownerId: string;
  data: Record<string, unknown>;
  updatedAt?: unknown;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly legacyPrefix = 'mari-honda-motors:';
  private readonly accountPrefix = 'mari-honda-motors:user:';
  private hydratedUid = '';
  private syncTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly auth: Auth,
    private readonly firestore: Firestore
  ) {}

  read<T>(key: string, fallback: T): T {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const accountValue = localStorage.getItem(this.storageKey(key));
      if (accountValue) return JSON.parse(accountValue) as T;

      // Backward compatibility for data saved before account-based storage.
      const legacyValue = localStorage.getItem(this.legacyPrefix + key);
      return legacyValue ? (JSON.parse(legacyValue) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    localStorage.setItem(this.storageKey(key), JSON.stringify(value));
    this.scheduleCloudSync();
  }

  async hydrateForUser(uid: string): Promise<void> {
    if (!uid || this.hydratedUid === uid) return;
    this.hydratedUid = uid;

    try {
      const snapshot = await getDoc(doc(this.firestore, 'users', uid, 'erpData', 'snapshot'));
      if (snapshot.exists()) {
        const cloudData = (snapshot.data() as ErpSnapshot).data ?? {};
        Object.entries(cloudData).forEach(([key, value]) => {
          localStorage.setItem(this.userKey(uid, key), JSON.stringify(value));
        });
        return;
      }
    } catch (error) {
      console.error('Could not restore ERP data from Firestore. Using local data.', error);
    }

    this.migrateLegacyData(uid);
    await this.syncToFirestore(uid);
  }

  async clearApplicationData(): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    clearTimeout(this.syncTimer);

    const prefixes = uid
      ? [`${this.accountPrefix}${uid}:`, this.legacyPrefix]
      : [this.legacyPrefix];
    Object.keys(localStorage)
      .filter((key) =>
        prefixes.some((prefix) => key.startsWith(prefix)) &&
        (!uid || !key.startsWith(this.accountPrefix) || key.startsWith(`${this.accountPrefix}${uid}:`))
      )
      .forEach((key) => localStorage.removeItem(key));

    if (!uid) return;

    await setDoc(doc(this.firestore, 'users', uid, 'erpData', 'snapshot'), {
      ownerId: uid,
      data: {},
      updatedAt: serverTimestamp()
    });
    await this.clearPaymentData(uid);
  }

  private storageKey(key: string): string {
    const uid = this.auth.currentUser?.uid;
    return uid ? this.userKey(uid, key) : this.legacyPrefix + key;
  }

  private userKey(uid: string, key: string): string {
    return `${this.accountPrefix}${uid}:${key}`;
  }

  private migrateLegacyData(uid: string): void {
    const legacyKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(this.legacyPrefix) && !key.startsWith(this.accountPrefix)
    );
    for (const legacyKey of legacyKeys) {
      const collectionKey = legacyKey.slice(this.legacyPrefix.length);
      const targetKey = this.userKey(uid, collectionKey);
      if (localStorage.getItem(targetKey) === null) {
        const value = localStorage.getItem(legacyKey);
        if (value !== null) localStorage.setItem(targetKey, value);
      }
      localStorage.removeItem(legacyKey);
    }
  }

  private scheduleCloudSync(): void {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => void this.syncToFirestore(uid), 350);
  }

  private async syncToFirestore(uid: string): Promise<void> {
    const prefix = `${this.accountPrefix}${uid}:`;
    const data: Record<string, unknown> = {};
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => {
        try {
          data[key.slice(prefix.length)] = JSON.parse(localStorage.getItem(key) ?? 'null');
        } catch {
          // Ignore invalid legacy values rather than corrupting the cloud snapshot.
        }
      });

    try {
      await setDoc(doc(this.firestore, 'users', uid, 'erpData', 'snapshot'), {
        ownerId: uid,
        data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Could not back up ERP data to Firestore.', error);
    }
  }

  private async clearPaymentData(uid: string): Promise<void> {
    const balances = await getDocs(collection(this.firestore, 'users', uid, 'saleBalances'));
    for (const balance of balances.docs) {
      const payments = await getDocs(collection(balance.ref, 'payments'));
      await Promise.all(payments.docs.map((payment) => deleteDoc(payment.ref)));
      await deleteDoc(balance.ref);
    }

    const ledgers = await getDocs(collection(this.firestore, 'users', uid, 'customerLedgers'));
    for (const ledger of ledgers.docs) {
      const entries = await getDocs(collection(ledger.ref, 'entries'));
      await Promise.all(entries.docs.map((entry) => deleteDoc(entry.ref)));
      await deleteDoc(ledger.ref);
    }
  }
}
