import { getFirebaseAuth, initializeFirebase } from '@/lib/firebase';
import { mockApiEnabled } from '@/config';
import { clearDemoSession } from '@/mocks/auth';
import { createFirebaseAuthProvider } from './firebase';
import { demoAuthProvider } from './demo';
import type { AuthProvider } from './types';

export type { AuthProvider, AuthResult } from './types';

const notConfigured = (): never => {
  throw new Error(
    'Authentication is not configured. Add your Firebase credentials to .env.local and restart.'
  );
};

/** No Firebase and no demo mode: nobody can sign in. */
const unconfiguredAuthProvider: AuthProvider = {
  kind: 'unconfigured',
  async initialize(apply) {
    await apply({ patch: { isLoading: false } });
  },
  signIn: async () => notConfigured(),
  verifyMfaChallenge: async () => notConfigured(),
  signInWithPasskey: async () => notConfigured(),
  signUp: async () => notConfigured(),
  signInWithGoogle: async () => notConfigured(),
  async signOut() {
    clearDemoSession();
  },
  resetPassword: async () => notConfigured(),
  sendEmailVerification: async () => notConfigured(),
  async refreshEmailVerified() {
    return undefined;
  },
  enableTotp: async () => notConfigured(),
  confirmTotp: async () => notConfigured(),
  disableMfa: async () => notConfigured(),
  registerPasskey: async () => notConfigured(),
  removePasskey: async () => notConfigured(),
};

let providerPromise: Promise<AuthProvider> | null = null;

/**
 * Picks the auth backend once: Firebase when it initializes, otherwise the
 * demo accounts in mock-API mode, otherwise a provider that rejects sign-in.
 * Firebase init is lazy, so this is async and cached after the first call.
 */
export const resolveAuthProvider = (): Promise<AuthProvider> => {
  providerPromise ??= (async () => {
    await initializeFirebase();
    const auth = getFirebaseAuth();
    if (auth) return createFirebaseAuthProvider(auth);
    return mockApiEnabled ? demoAuthProvider : unconfiguredAuthProvider;
  })();
  return providerPromise;
};
