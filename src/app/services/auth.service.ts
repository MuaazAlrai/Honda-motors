import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  authState,
  browserLocalPersistence,
  browserSessionPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  verifyPasswordResetCode
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly operationTimeoutMs = 20_000;
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  readonly user$ = authState(this.auth);

  async login(email: string, password: string, rememberMe = false) {
    await setPersistence(
      this.auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    return this.withTimeout(
      signInWithEmailAndPassword(this.auth, email.trim(), password),
      'Login timed out. Check your connection and try again.'
    );
  }

  async register(email: string, password: string) {
    const credential = await this.withTimeout(
      createUserWithEmailAndPassword(this.auth, email.trim(), password),
      'Registration timed out. Check your connection and try again.'
    );

    try {
      await this.withTimeout(
        setDoc(doc(this.firestore, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email: credential.user.email,
          createdAt: serverTimestamp()
        }),
        'Saving your account profile timed out. Please try again.'
      );
    } catch (error) {
      await deleteUser(credential.user);
      throw error;
    }

    await signOut(this.auth);
    return credential;
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim();

    try {
      await this.withTimeout(
        sendPasswordResetEmail(this.auth, normalizedEmail),
        'Sending the reset email timed out. Check your connection and try again.'
      );
      console.info('Firebase password reset email sent:', normalizedEmail);
    } catch (error) {
      console.error('Firebase password reset email failed:', error);
      throw error;
    }
  }

  verifyResetCode(code: string): Promise<string> {
    return verifyPasswordResetCode(this.auth, code);
  }

  confirmResetPassword(code: string, newPassword: string): Promise<void> {
    return this.withTimeout(
      confirmPasswordReset(this.auth, code, newPassword),
      'Updating the password timed out. Check your connection and try again.'
    );
  }

  updateEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      return Promise.reject(new Error('You must be signed in to change your email.'));
    }

    return firebaseUpdateEmail(user, newEmail.trim());
  }

  updatePassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      return Promise.reject(new Error('You must be signed in to change your password.'));
    }

    return firebaseUpdatePassword(user, newPassword);
  }

  changeEmail(newEmail: string): Promise<void> {
    return this.updateEmail(newEmail);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  waitForCurrentUser(): Promise<User | null> {
    return firstValueFrom(this.user$);
  }

  private withTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), this.operationTimeoutMs);
    });

    return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId));
  }
}
