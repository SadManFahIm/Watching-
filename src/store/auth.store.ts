/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// firebase/auth is imported lazily (see loadFirebaseAuth) so demo mode never
// loads the SDK on the critical path — type-only imports removed for build.
import { getFirebaseAuth, initializeFirebase } from '@/lib/firebase';
import { loadFirebaseAuth } from '@/lib/firebaseAuth';
import {
  generateChallenge,
  runPasskeyRegistration,
  verifyPasskeyRegistration,
  runPasskeyAuthentication,
  verifyPasskeyAuthentication,
  toAllowCredentials,
  webauthnSupported,
  describeWebAuthnError,
} from '@/lib/webauthn';
import { mockApiEnabled, demoUser } from '@/config';
import {
  demoAuthenticate,
  demoRegister,
  demoGoogleSignIn,
  demoEnableTotp,
  demoConfirmTotp,
  demoDisableMfa,
  demoRegisterPasskey,
  demoRemovePasskey,
  demoSignInWithPasskey,
  demoUpdatePasskeyCounter,
  getDemoUser,
  getDemoSessionUserId,
  setDemoSession,
  clearDemoSession,
} from '@/mocks/auth';
import { seedUsers } from '@/mocks/data';
import type { PasskeyRecord } from '@/types';
import type { User, AuthState } from '@/types';
import api from '@/lib/axios';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  // Two-factor authentication
  enableTotp: () => Promise<{ secret: string; otpAuthUrl: string }>;
  confirmTotp: (code: string) => Promise<void>;
  disableMfa: () => Promise<void>;
  verifyMfaChallenge: (code: string) => Promise<void>;
  // Passkeys (demo path only)
  registerPasskey: (name: string) => Promise<PasskeyRecord>;
  removePasskey: (passkeyId: string) => Promise<void>;
  signInWithPasskey: () => Promise<void>;
  checkAdminStatus: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// In-flight MFA state that must not live in the persisted store: the TOTP
// enrollment secret and the Firebase sign-in resolver (both session-only).
let pendingTotpSecret: any | null = null;
let pendingMfaResolver: any | null = null;

const isMfaRequiredError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/multi-factor-auth-required'
  );
};

// Firebase auth instance — resolved lazily on first use (initializeFirebase is
// async now, so the store can no longer capture it synchronously at module
// load). `null` means Firebase is unconfigured (demo mode).
let auth: any | null = null;
let authResolved = false;

const ensureAuthResolved = async (): Promise<void> => {
  if (authResolved) return;
  await initializeFirebase();
  auth = getFirebaseAuth() ?? null;
  authResolved = true;
};

// Firebase may be unconfigured in development (no .env.local yet).
const ensureAuth = (): any => {
  if (!auth) {
    throw new Error(
      'Authentication is not configured. Add your Firebase credentials to .env.local and restart.'
    );
  }
  return auth;
};

// Helper function to convert Firebase user to app user
const convertFirebaseUser = (
  firebaseUser: import('firebase/auth').User,
  fb: typeof import('firebase/auth')
): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || undefined,
  role: 'user', // Will be updated by checkAdminStatus
  emailVerified: firebaseUser.emailVerified === true,
  mfaEnabled: fb.multiFactor(firebaseUser).enrolledFactors.length > 0,
  createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
  updatedAt: new Date(),
});

// Helper function to save user to backend
const saveUserToBackend = async (user: User, method: 'POST' | 'PUT' = 'POST') => {
  try {
    await api.request({
      url: '/users',
      method,
      data: {
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Error saving user to backend:', error);
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      pendingMfa: null,

      initialize: async () => {
        await ensureAuthResolved();
        if (!auth) {
          if (mockApiEnabled) {
            // Demo mode: resume the active demo session (or sign the built-in
            // account in) so the whole storefront is browsable without Firebase.
            const sessionUser = getDemoUser(getDemoSessionUserId());
            const user = sessionUser ?? { ...demoUser };
            set({
              user,
              isAuthenticated: true,
              isAdmin: user.role === 'admin',
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          return;
        }
        const fb = await loadFirebaseAuth();
        fb.onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const user = convertFirebaseUser(firebaseUser, fb);
            set({ user, isAuthenticated: true, isLoading: false });

            // Check admin status
            await get().checkAdminStatus(user.email);
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isAdmin: false,
              isLoading: false,
            });
          }
        });
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          await ensureAuthResolved();
          if (!auth && mockApiEnabled) {
            const user = await demoAuthenticate(email, password);
            const passkeyAvailable = (user.passkeys?.length ?? 0) > 0;
            if (user.mfaEnabled || passkeyAvailable) {
              set({
                pendingMfa: {
                  email: user.email,
                  mode: 'totp',
                  passkeyAvailable,
                },
                isLoading: false,
              });
              return;
            }
            set({
              user,
              isAuthenticated: true,
              isAdmin: user.role === 'admin',
              isLoading: false,
              pendingMfa: null,
            });
            return;
          }
          const fb = await loadFirebaseAuth();
          const result = await fb.signInWithEmailAndPassword(ensureAuth(), email, password);
          const user = convertFirebaseUser(result.user, fb);

          set({ user, isAuthenticated: true, isLoading: false, pendingMfa: null });
          await get().checkAdminStatus(email);
        } catch (error) {
          if (isMfaRequiredError(error) && auth) {
            try {
              const fb: any = await loadFirebaseAuth();
              pendingMfaResolver = fb.getMultiFactorResolver(auth, error);
              set({ isLoading: false, pendingMfa: { email, mode: 'totp' } });
              return;
            } catch {
              pendingMfaResolver = null;
            }
          }
          set({ isLoading: false });
          throw new Error(error instanceof Error ? error.message : 'Failed to sign in', {
            cause: error,
          });
        }
      },

      verifyMfaChallenge: async (code: string) => {
        await ensureAuthResolved();
        if (!auth && mockApiEnabled) {
          const pending = get().pendingMfa;
          if (!pending?.email) throw new Error('No pending two-factor challenge.');
          const account = seedUsers.find(
            (user) => user.email.toLowerCase() === pending.email.toLowerCase()
          );
          if (!account || !account.mfaEnabled) {
            throw new Error('Two-factor authentication is not enabled for this account.');
          }
          if (!/^\d{6}$/.test(code.trim())) {
            throw new Error('Enter the 6-digit code from your authenticator app.');
          }
          setDemoSession(account.id);
          const user = getDemoUser(account.id);
          if (!user) throw new Error('Account not found.');
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
            pendingMfa: null,
          });
          return;
        }
        if (!pendingMfaResolver) throw new Error('No pending two-factor challenge.');
        const fb = await loadFirebaseAuth();
        const enrollmentId = pendingMfaResolver.hints[0]?.uid ?? '';
        const assertion = fb.TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code.trim());
        const result = await pendingMfaResolver.resolveSignIn(assertion);
        pendingMfaResolver = null;
        pendingTotpSecret = null;
        const user = convertFirebaseUser(result.user, fb);
        set({ user, isAuthenticated: true, isLoading: false, pendingMfa: null });
        await get().checkAdminStatus(user.email);
      },

      signInWithPasskey: async () => {
        if (auth) {
          throw new Error(
            'Passkeys (WebAuthn) require Firebase Identity Platform — available in demo mode only.'
          );
        }
        const pending = get().pendingMfa;
        if (!pending?.email) throw new Error('No pending passkey challenge.');
        const account = seedUsers.find(
          (user) => user.email.toLowerCase() === pending.email.toLowerCase()
        );
        if (!account) throw new Error('Account not found.');

        const realPasskeys = toAllowCredentials(account.passkeys ?? []);
        if (realPasskeys.length > 0 && webauthnSupported()) {
          // Genuine WebAuthn ceremony — the authenticator proves user presence
          // and the assertion signature is verified against the stored key.
          const challenge = generateChallenge();
          const response = await runPasskeyAuthentication({
            challenge,
            allowCredentials: realPasskeys,
          });
          const record = account.passkeys?.find((item) => item.id === response.id);
          if (!record) {
            throw new Error('This passkey is not registered for the account.');
          }
          await verifyPasskeyAuthentication({ credential: record, response, challenge });
          demoUpdatePasskeyCounter(account.id, record.id, record.credential?.counter ?? 0);
          setDemoSession(account.id);
          const user = getDemoUser(account.id);
          if (!user) throw new Error('Account not found.');
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
            pendingMfa: null,
          });
          return;
        }

        // No verifiable credential material (legacy stand-in passkeys or an
        // unsupported platform) — fall back to the simulated assertion.
        const user = await demoSignInWithPasskey(account.id);
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
          isLoading: false,
          pendingMfa: null,
        });
      },

      enableTotp: async () => {
        if (!auth && mockApiEnabled) {
          const current = get().user;
          if (!current)
            throw new Error('You must be signed in to enable two-factor authentication.');
          return demoEnableTotp(current.id);
        }
        const current = ensureAuth().currentUser;
        if (!current) throw new Error('You must be signed in to enable two-factor authentication.');
        const fb = await loadFirebaseAuth();
        const mfaUser = fb.multiFactor(current);
        const session = await mfaUser.getSession();
        const secret = await fb.TotpMultiFactorGenerator.generateSecret(session);
        pendingTotpSecret = secret;
        return {
          secret: secret.secretKey,
          otpAuthUrl: secret.generateQrCodeUrl(current.email ?? 'account', 'Classic Watch Pro'),
        };
      },

      confirmTotp: async (code: string) => {
        if (!auth && mockApiEnabled) {
          const current = get().user;
          if (!current)
            throw new Error('You must be signed in to enable two-factor authentication.');
          demoConfirmTotp(current.id, code);
          set((state) => {
            if (state.user) {
              state.user.mfaEnabled = true;
              state.user.mfaEnrolledAt = new Date();
            }
          });
          return;
        }
        if (!pendingTotpSecret) throw new Error('Start enrollment before confirming.');
        const current = ensureAuth().currentUser;
        if (!current) throw new Error('You must be signed in to enable two-factor authentication.');
        const fb = await loadFirebaseAuth();
        await fb
          .multiFactor(current)
          .enroll(
            fb.TotpMultiFactorGenerator.assertionForEnrollment(pendingTotpSecret, code.trim()),
            'TOTP'
          );
        pendingTotpSecret = null;
        set((state) => {
          if (state.user) {
            state.user.mfaEnabled = true;
            state.user.mfaEnrolledAt = new Date();
          }
        });
      },

      disableMfa: async () => {
        if (!auth && mockApiEnabled) {
          const current = get().user;
          if (!current) throw new Error('You must be signed in.');
          demoDisableMfa(current.id);
          set((state) => {
            if (state.user) {
              state.user.mfaEnabled = false;
              state.user.mfaEnrolledAt = undefined;
            }
          });
          return;
        }
        const current = ensureAuth().currentUser;
        if (!current) throw new Error('You must be signed in.');
        const fb = await loadFirebaseAuth();
        const mfaUser = fb.multiFactor(current);
        const factor = mfaUser.enrolledFactors[0];
        if (!factor) throw new Error('No enrolled second factor to disable.');
        await mfaUser.unenroll(factor.uid);
        set((state) => {
          if (state.user) {
            state.user.mfaEnabled = false;
            state.user.mfaEnrolledAt = undefined;
          }
        });
      },

      registerPasskey: async (name: string) => {
        if (auth) {
          throw new Error(
            'Passkeys (WebAuthn) require Firebase Identity Platform — available in demo mode only.'
          );
        }
        const current = get().user;
        if (!current) throw new Error('You must be signed in to register a passkey.');

        if (webauthnSupported()) {
          // Genuine WebAuthn registration: the platform authenticator creates a
          // credential for this RP and we verify its attestation material.
          try {
            const challenge = generateChallenge();
            const { id, response } = await runPasskeyRegistration(
              {
                userName: current.email,
                userDisplayName: current.displayName || current.email,
                userId: current.id,
                challenge,
              },
              (current.passkeys ?? []).map((item) => item.id)
            );
            const verified = await verifyPasskeyRegistration({ response, challenge });
            const record: PasskeyRecord = {
              id,
              name: name.trim() || 'Passkey',
              createdAt: new Date(),
              isWebAuthn: true,
              credential: {
                publicKey: verified.publicKey,
                publicKeyAlgorithm: verified.publicKeyAlgorithm,
                counter: verified.counter,
                transports: response.response.transports,
                aaguid: verified.aaguid,
              },
            };
            demoRegisterPasskey(current.id, record);
            set((state) => {
              if (state.user) state.user.passkeys = [...(state.user.passkeys ?? []), record];
            });
            return record;
          } catch (error) {
            throw new Error(describeWebAuthnError(error), { cause: error });
          }
        }

        // Platform lacks WebAuthn — legacy name-only stand-in so the flow still
        // works on insecure contexts and older browsers.
        const record = demoRegisterPasskey(current.id, {
          id: `pk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
          name: name.trim() || 'Passkey',
          createdAt: new Date(),
        });
        set((state) => {
          if (state.user) state.user.passkeys = [...(state.user.passkeys ?? []), record];
        });
        return record;
      },

      removePasskey: async (passkeyId: string) => {
        if (auth) {
          throw new Error(
            'Passkeys (WebAuthn) require Firebase Identity Platform — available in demo mode only.'
          );
        }
        const current = get().user;
        if (!current) throw new Error('You must be signed in.');
        demoRemovePasskey(current.id, passkeyId);
        set((state) => {
          if (state.user) {
            state.user.passkeys = (state.user.passkeys ?? []).filter(
              (item) => item.id !== passkeyId
            );
          }
        });
      },

      signUp: async (email: string, password: string, displayName: string) => {
        try {
          set({ isLoading: true });
          await ensureAuthResolved();
          if (!auth && mockApiEnabled) {
            const user = await demoRegister(email, displayName);
            set({ user, isAuthenticated: true, isAdmin: false, isLoading: false });
            return;
          }
          const fb = await loadFirebaseAuth();
          const result = await fb.createUserWithEmailAndPassword(ensureAuth(), email, password);

          // Update display name
          await fb.updateProfile(result.user, { displayName });

          const user = convertFirebaseUser(result.user, fb);
          user.displayName = displayName;

          // Save to backend
          await saveUserToBackend(user, 'POST');

          set({ user, isAuthenticated: true, isLoading: false });

          // Kick off the verification email without blocking registration.
          try {
            if (result.user.emailVerified === false) {
              const fbAny: any = fb;
              await fbAny.sendEmailVerification(result.user);
            }
          } catch (error) {
            console.error('Could not send verification email:', error);
          }
        } catch (error) {
          set({ isLoading: false });
          throw new Error(error instanceof Error ? error.message : 'Failed to sign up', {
            cause: error,
          });
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          await ensureAuthResolved();
          if (!auth && mockApiEnabled) {
            const user = await demoGoogleSignIn();
            set({
              user,
              isAuthenticated: true,
              isAdmin: user.role === 'admin',
              isLoading: false,
              pendingMfa: null,
            });
            return;
          }
          const fb = await loadFirebaseAuth();
          const result = await fb.signInWithPopup(ensureAuth(), new fb.GoogleAuthProvider());
          const user = convertFirebaseUser(result.user, fb);

          // Save to backend
          await saveUserToBackend(user, 'PUT');

          set({ user, isAuthenticated: true, isLoading: false, pendingMfa: null });
          await get().checkAdminStatus(user.email);
        } catch (error) {
          if (isMfaRequiredError(error) && auth) {
            try {
              const fb: any = await loadFirebaseAuth();
              pendingMfaResolver = fb.getMultiFactorResolver(auth, error);
              set({ isLoading: false, pendingMfa: { email: '', mode: 'totp' } });
              return;
            } catch {
              pendingMfaResolver = null;
            }
          }
          set({ isLoading: false });
          throw new Error(
            error instanceof Error ? error.message : 'Failed to sign in with Google',
            {
              cause: error,
            }
          );
        }
      },

      signOut: async () => {
        pendingMfaResolver = null;
        pendingTotpSecret = null;
        try {
          await ensureAuthResolved();
          if (!auth) {
            // Demo mode has no Firebase session — clear the demo session and state.
            clearDemoSession();
            set({
              user: null,
              isAuthenticated: false,
              isAdmin: false,
              isLoading: false,
              pendingMfa: null,
            });
            return;
          }
          set({ isLoading: true });
          const fb = await loadFirebaseAuth();
          await fb.signOut(ensureAuth());
          set({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
            pendingMfa: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(error instanceof Error ? error.message : 'Failed to sign out', {
            cause: error,
          });
        }
      },

      resetPassword: async (email: string) => {
        await ensureAuthResolved();
        if (!auth && mockApiEnabled) {
          // Demo mode has no real email provider. Simulate the round trip and
          // succeed silently for any address (standard anti-enumeration).
          await new Promise((resolve) => {
            setTimeout(resolve, 250);
          });
          return;
        }
        const fb = await loadFirebaseAuth();
        await fb.sendPasswordResetEmail(ensureAuth(), email.trim());
      },

      sendEmailVerification: async () => {
        await ensureAuthResolved();
        if (!auth && mockApiEnabled) {
          // Demo accounts are considered verified (no email infra).
          return;
        }
        const current: any = ensureAuth().currentUser;
        if (!current) {
          throw new Error('You must be signed in to verify your email.');
        }
        if (current.emailVerified) return;
        const fb: any = await loadFirebaseAuth();
        await fb.sendEmailVerification(current);
      },

      refreshAuthState: async () => {
        // Re-read the Firebase account after the user clicks the verification
        // link — onAuthStateChanged does not fire for an in-place reload().
        await ensureAuthResolved();
        const current: any = auth?.currentUser;
        if (!current) return;
        try {
          await current.reload();
          set((state) => {
            if (state.user) {
              state.user.emailVerified = current.emailVerified === true;
            }
          });
        } catch (error) {
          console.error('Failed to refresh auth state:', error);
        }
      },

      checkAdminStatus: async (email: string) => {
        try {
          const response = await api.get(`/admin/${email}`);
          const isAdmin = response.data?.[0]?.role === 'admin';

          set((state) => {
            if (state.user) {
              state.user.role = isAdmin ? 'admin' : 'user';
            }
            state.isAdmin = isAdmin;
          });
        } catch (error) {
          console.error('Error checking admin status:', error);
          set({ isAdmin: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
