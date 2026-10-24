import { demoUser } from '@/config';
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
import type { PasskeyRecord, User } from '@/types';
import type { AuthProvider, AuthResult } from './types';

const signedIn = (user: User): AuthResult => ({
  patch: {
    user,
    isAuthenticated: true,
    isAdmin: user.role === 'admin',
    isLoading: false,
    pendingMfa: null,
  },
});

const findAccount = (email: string) =>
  seedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());

// Starts the demo session for an account and returns its current snapshot.
const startSession = (accountId: string): User => {
  setDemoSession(accountId);
  const user = getDemoUser(accountId);
  if (!user) throw new Error('Account not found.');
  return user;
};

/** Built-in demo accounts backed by the mock database (no Firebase). */
export const demoAuthProvider: AuthProvider = {
  kind: 'demo',

  async initialize(apply) {
    // Resume the active demo session (or sign the built-in account in) so the
    // whole storefront is browsable without Firebase.
    const user = getDemoUser(getDemoSessionUserId()) ?? { ...demoUser };
    await apply({
      patch: { user, isAuthenticated: true, isAdmin: user.role === 'admin', isLoading: false },
    });
  },

  async signIn(email, password) {
    const user = await demoAuthenticate(email, password);
    const passkeyAvailable = (user.passkeys?.length ?? 0) > 0;
    if (user.mfaEnabled || passkeyAvailable) {
      return {
        patch: {
          pendingMfa: { email: user.email, mode: 'totp', passkeyAvailable },
          isLoading: false,
        },
      };
    }
    return signedIn(user);
  },

  async verifyMfaChallenge(code, pending) {
    if (!pending?.email) throw new Error('No pending two-factor challenge.');
    const account = findAccount(pending.email);
    if (!account || !account.mfaEnabled) {
      throw new Error('Two-factor authentication is not enabled for this account.');
    }
    if (!/^\d{6}$/.test(code.trim())) {
      throw new Error('Enter the 6-digit code from your authenticator app.');
    }
    return signedIn(startSession(account.id));
  },

  async signInWithPasskey(pending) {
    if (!pending?.email) throw new Error('No pending passkey challenge.');
    const account = findAccount(pending.email);
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
      return signedIn(startSession(account.id));
    }

    // No verifiable credential material (legacy stand-in passkeys or an
    // unsupported platform) — fall back to the simulated assertion.
    return signedIn(await demoSignInWithPasskey(account.id));
  },

  async signUp(email, _password, displayName) {
    const user = await demoRegister(email, displayName);
    return { patch: { user, isAuthenticated: true, isAdmin: false, isLoading: false } };
  },

  async signInWithGoogle() {
    return signedIn(await demoGoogleSignIn());
  },

  async signOut() {
    // Demo mode has no Firebase session — just clear the demo session.
    clearDemoSession();
  },

  async resetPassword() {
    // Demo mode has no real email provider. Simulate the round trip and
    // succeed silently for any address (standard anti-enumeration).
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  },

  async sendEmailVerification() {
    // Demo accounts are considered verified (no email infra).
  },

  async refreshEmailVerified() {
    return undefined;
  },

  async enableTotp(user) {
    if (!user) throw new Error('You must be signed in to enable two-factor authentication.');
    return demoEnableTotp(user.id);
  },

  async confirmTotp(user, code) {
    if (!user) throw new Error('You must be signed in to enable two-factor authentication.');
    demoConfirmTotp(user.id, code);
  },

  async disableMfa(user) {
    if (!user) throw new Error('You must be signed in.');
    demoDisableMfa(user.id);
  },

  async registerPasskey(user, name) {
    if (!user) throw new Error('You must be signed in to register a passkey.');

    if (webauthnSupported()) {
      // Genuine WebAuthn registration: the platform authenticator creates a
      // credential for this RP and we verify its attestation material.
      try {
        const challenge = generateChallenge();
        const { id, response } = await runPasskeyRegistration(
          {
            userName: user.email,
            userDisplayName: user.displayName || user.email,
            userId: user.id,
            challenge,
          },
          (user.passkeys ?? []).map((item) => item.id)
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
        demoRegisterPasskey(user.id, record);
        return record;
      } catch (error) {
        throw new Error(describeWebAuthnError(error), { cause: error });
      }
    }

    // Platform lacks WebAuthn — legacy name-only stand-in so the flow still
    // works on insecure contexts and older browsers.
    return demoRegisterPasskey(user.id, {
      id: `pk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      name: name.trim() || 'Passkey',
      createdAt: new Date(),
    });
  },

  async removePasskey(user, passkeyId) {
    if (!user) throw new Error('You must be signed in.');
    demoRemovePasskey(user.id, passkeyId);
  },
};
