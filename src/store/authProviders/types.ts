import type { AuthState, PasskeyRecord, User } from '@/types';

export type PendingMfa = AuthState['pendingMfa'];

/** State changes a provider asks the auth store to apply after an auth step. */
export interface AuthResult {
  patch: Partial<AuthState>;
  /** Resolve the admin role for this email once the patch is applied. */
  checkAdminFor?: string;
}

/**
 * One authentication backend (Firebase, the demo accounts, or none). The auth
 * store owns state and loading/error handling; providers do the backend work.
 */
export interface AuthProvider {
  readonly kind: 'firebase' | 'demo' | 'unconfigured';
  initialize(apply: (result: AuthResult) => Promise<void>): Promise<void>;
  signIn(email: string, password: string): Promise<AuthResult>;
  verifyMfaChallenge(code: string, pending: PendingMfa): Promise<AuthResult>;
  signInWithPasskey(pending: PendingMfa): Promise<AuthResult>;
  signUp(email: string, password: string, displayName: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  sendEmailVerification(): Promise<void>;
  /** Re-reads the email-verified flag; undefined when there is nothing to refresh. */
  refreshEmailVerified(): Promise<boolean | undefined>;
  enableTotp(user: User | null): Promise<{ secret: string; otpAuthUrl: string }>;
  confirmTotp(user: User | null, code: string): Promise<void>;
  disableMfa(user: User | null): Promise<void>;
  registerPasskey(user: User | null, name: string): Promise<PasskeyRecord>;
  removePasskey(user: User | null, passkeyId: string): Promise<void>;
}

export const PASSKEYS_DEMO_ONLY =
  'Passkeys (WebAuthn) require Firebase Identity Platform — available in demo mode only.';
