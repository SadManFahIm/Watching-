/* eslint-disable @typescript-eslint/no-explicit-any */
// firebase/auth is imported lazily (see loadFirebaseAuth) so demo mode never
// loads the SDK on the critical path.
import { loadFirebaseAuth } from '@/lib/firebaseAuth';
import api from '@/lib/axios';
import type { User } from '@/types';
import { PASSKEYS_DEMO_ONLY, type AuthProvider, type AuthResult } from './types';

const isMfaRequiredError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/multi-factor-auth-required'
  );
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

export const createFirebaseAuthProvider = (auth: any): AuthProvider => {
  // In-flight MFA state that must not live in the persisted store: the TOTP
  // enrollment secret and the Firebase sign-in resolver (both session-only).
  let pendingTotpSecret: any | null = null;
  let pendingMfaResolver: any | null = null;

  const signedIn = (user: User, adminEmail = user.email): AuthResult => ({
    patch: { user, isAuthenticated: true, isLoading: false, pendingMfa: null },
    checkAdminFor: adminEmail,
  });

  // Turns Firebase's "second factor required" error into a TOTP challenge.
  const challengeFor = async (error: unknown, email: string): Promise<AuthResult | null> => {
    if (!isMfaRequiredError(error)) return null;
    try {
      const fb: any = await loadFirebaseAuth();
      pendingMfaResolver = fb.getMultiFactorResolver(auth, error);
      return { patch: { isLoading: false, pendingMfa: { email, mode: 'totp' } } };
    } catch {
      pendingMfaResolver = null;
      return null;
    }
  };

  const requireCurrentUser = (message: string): any => {
    const current = auth.currentUser;
    if (!current) throw new Error(message);
    return current;
  };

  return {
    kind: 'firebase',

    async initialize(apply) {
      const fb = await loadFirebaseAuth();
      fb.onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const user = convertFirebaseUser(firebaseUser, fb);
          await apply({
            patch: { user, isAuthenticated: true, isLoading: false },
            checkAdminFor: user.email,
          });
        } else {
          await apply({
            patch: { user: null, isAuthenticated: false, isAdmin: false, isLoading: false },
          });
        }
      });
    },

    async signIn(email, password) {
      try {
        const fb = await loadFirebaseAuth();
        const result = await fb.signInWithEmailAndPassword(auth, email, password);
        return signedIn(convertFirebaseUser(result.user, fb), email);
      } catch (error) {
        const challenge = await challengeFor(error, email);
        if (challenge) return challenge;
        throw error;
      }
    },

    async verifyMfaChallenge(code) {
      if (!pendingMfaResolver) throw new Error('No pending two-factor challenge.');
      const fb = await loadFirebaseAuth();
      const enrollmentId = pendingMfaResolver.hints[0]?.uid ?? '';
      const assertion = fb.TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code.trim());
      const result = await pendingMfaResolver.resolveSignIn(assertion);
      pendingMfaResolver = null;
      pendingTotpSecret = null;
      return signedIn(convertFirebaseUser(result.user, fb));
    },

    async signInWithPasskey() {
      throw new Error(PASSKEYS_DEMO_ONLY);
    },

    async signUp(email, password, displayName) {
      const fb = await loadFirebaseAuth();
      const result = await fb.createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await fb.updateProfile(result.user, { displayName });

      const user = convertFirebaseUser(result.user, fb);
      user.displayName = displayName;

      // Save to backend
      await saveUserToBackend(user, 'POST');

      // Kick off the verification email without blocking registration.
      const sendVerification = async () => {
        try {
          if (result.user.emailVerified === false) {
            const fbAny: any = fb;
            await fbAny.sendEmailVerification(result.user);
          }
        } catch (error) {
          console.error('Could not send verification email:', error);
        }
      };
      void sendVerification();

      return { patch: { user, isAuthenticated: true, isLoading: false } };
    },

    async signInWithGoogle() {
      try {
        const fb = await loadFirebaseAuth();
        const result = await fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
        const user = convertFirebaseUser(result.user, fb);

        // Save to backend
        await saveUserToBackend(user, 'PUT');

        return signedIn(user);
      } catch (error) {
        const challenge = await challengeFor(error, '');
        if (challenge) return challenge;
        throw error;
      }
    },

    async signOut() {
      pendingMfaResolver = null;
      pendingTotpSecret = null;
      const fb = await loadFirebaseAuth();
      await fb.signOut(auth);
    },

    async resetPassword(email) {
      const fb = await loadFirebaseAuth();
      await fb.sendPasswordResetEmail(auth, email.trim());
    },

    async sendEmailVerification() {
      const current = requireCurrentUser('You must be signed in to verify your email.');
      if (current.emailVerified) return;
      const fb: any = await loadFirebaseAuth();
      await fb.sendEmailVerification(current);
    },

    async refreshEmailVerified() {
      // Re-read the Firebase account after the user clicks the verification
      // link — onAuthStateChanged does not fire for an in-place reload().
      const current = auth.currentUser;
      if (!current) return undefined;
      try {
        await current.reload();
        return current.emailVerified === true;
      } catch (error) {
        console.error('Failed to refresh auth state:', error);
        return undefined;
      }
    },

    async enableTotp() {
      const current = requireCurrentUser(
        'You must be signed in to enable two-factor authentication.'
      );
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

    async confirmTotp(_user, code) {
      if (!pendingTotpSecret) throw new Error('Start enrollment before confirming.');
      const current = requireCurrentUser(
        'You must be signed in to enable two-factor authentication.'
      );
      const fb = await loadFirebaseAuth();
      await fb
        .multiFactor(current)
        .enroll(
          fb.TotpMultiFactorGenerator.assertionForEnrollment(pendingTotpSecret, code.trim()),
          'TOTP'
        );
      pendingTotpSecret = null;
    },

    async disableMfa() {
      const current = requireCurrentUser('You must be signed in.');
      const fb = await loadFirebaseAuth();
      const mfaUser = fb.multiFactor(current);
      const factor = mfaUser.enrolledFactors[0];
      if (!factor) throw new Error('No enrolled second factor to disable.');
      await mfaUser.unenroll(factor.uid);
    },

    async registerPasskey() {
      throw new Error(PASSKEYS_DEMO_ONLY);
    },

    async removePasskey() {
      throw new Error(PASSKEYS_DEMO_ONLY);
    },
  };
};
