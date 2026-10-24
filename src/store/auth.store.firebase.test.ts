import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Firebase-mode paths of the auth store that the basic suite does not cover:
 * registration, Google sign-in, the TOTP sign-in challenge, TOTP enrollment
 * and passkey rejection. Firebase is mocked with controllable spies.
 */

const mocks = vi.hoisted(() => {
  const enrolledFactors: { uid: string }[] = [];
  return {
    enrolledFactors,
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    sendEmailVerification: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    getMultiFactorResolver: vi.fn(),
    assertionForSignIn: vi.fn(() => 'sign-in-assertion'),
    assertionForEnrollment: vi.fn(() => 'enroll-assertion'),
    generateSecret: vi.fn(),
    enroll: vi.fn(),
    unenroll: vi.fn(),
    apiGet: vi.fn(),
    apiRequest: vi.fn(),
    firebaseAuth: { currentUser: null as unknown },
  };
});

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: vi.fn(),
  updateProfile: mocks.updateProfile,
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: mocks.sendEmailVerification,
  GoogleAuthProvider: class GoogleAuthProvider {},
  multiFactor: () => ({
    enrolledFactors: mocks.enrolledFactors,
    getSession: async () => 'mfa-session',
    enroll: mocks.enroll,
    unenroll: mocks.unenroll,
  }),
  getMultiFactorResolver: mocks.getMultiFactorResolver,
  TotpMultiFactorGenerator: {
    generateSecret: mocks.generateSecret,
    assertionForEnrollment: mocks.assertionForEnrollment,
    assertionForSignIn: mocks.assertionForSignIn,
  },
}));

vi.mock('@/lib/firebase', () => ({
  initializeFirebase: async () => undefined,
  getFirebaseAuth: () => mocks.firebaseAuth,
}));

vi.mock('@/lib/axios', () => ({
  default: { get: mocks.apiGet, request: mocks.apiRequest },
}));

import { useAuthStore } from '@/store/auth.store';
import { makeUser } from '@/test/factories';

const firebaseUser = (overrides: Record<string, unknown> = {}) => ({
  uid: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: undefined,
  emailVerified: true,
  metadata: { creationTime: '2024-01-01T00:00:00Z' },
  ...overrides,
});

describe('auth store — Firebase paths', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.enrolledFactors.length = 0;
    mocks.firebaseAuth.currentUser = null;
    mocks.apiGet.mockResolvedValue({ data: [{ role: 'user' }] });
    mocks.apiRequest.mockResolvedValue({});
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      pendingMfa: null,
    });
  });

  it('registers, sets the display name, saves the user and sends a verification email', async () => {
    const created = firebaseUser({ displayName: '', emailVerified: false });
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: created });

    await useAuthStore.getState().signUp('alice@example.com', 'secret123', 'Alice');

    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mocks.firebaseAuth,
      'alice@example.com',
      'secret123'
    );
    expect(mocks.updateProfile).toHaveBeenCalledWith(created, { displayName: 'Alice' });
    expect(mocks.apiRequest).toHaveBeenCalledWith({
      url: '/users',
      method: 'POST',
      data: { email: 'alice@example.com', displayName: 'Alice' },
    });
    expect(mocks.sendEmailVerification).toHaveBeenCalledWith(created);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user?.displayName).toBe('Alice');
    expect(state.user?.emailVerified).toBe(false);
  });

  it('signs in with Google, upserts the user and resolves admin status', async () => {
    mocks.signInWithPopup.mockResolvedValue({ user: firebaseUser() });
    mocks.apiGet.mockResolvedValue({ data: [{ role: 'admin' }] });

    await useAuthStore.getState().signInWithGoogle();

    expect(mocks.apiRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }));
    expect(mocks.apiGet).toHaveBeenCalledWith('/admin/alice@example.com');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAdmin).toBe(true);
    expect(state.pendingMfa).toBeNull();
  });

  it('turns a second-factor requirement into a TOTP challenge and completes it', async () => {
    const mfaError = Object.assign(new Error('mfa'), { code: 'auth/multi-factor-auth-required' });
    const resolveSignIn = vi.fn().mockResolvedValue({ user: firebaseUser() });
    mocks.signInWithEmailAndPassword.mockRejectedValue(mfaError);
    mocks.getMultiFactorResolver.mockReturnValue({ hints: [{ uid: 'totp-1' }], resolveSignIn });

    await useAuthStore.getState().signIn('alice@example.com', 'secret123');

    expect(mocks.getMultiFactorResolver).toHaveBeenCalledWith(mocks.firebaseAuth, mfaError);
    expect(useAuthStore.getState().pendingMfa).toEqual({
      email: 'alice@example.com',
      mode: 'totp',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await useAuthStore.getState().verifyMfaChallenge(' 123456 ');

    expect(mocks.assertionForSignIn).toHaveBeenCalledWith('totp-1', '123456');
    expect(resolveSignIn).toHaveBeenCalledWith('sign-in-assertion');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.pendingMfa).toBeNull();
    expect(mocks.apiGet).toHaveBeenCalledWith('/admin/alice@example.com');
  });

  it('rejects a challenge code when no sign-in is pending', async () => {
    await expect(useAuthStore.getState().verifyMfaChallenge('123456')).rejects.toThrow(
      'No pending two-factor challenge.'
    );
  });

  it('enrolls and then removes a TOTP second factor', async () => {
    mocks.firebaseAuth.currentUser = firebaseUser();
    useAuthStore.setState({ user: makeUser(), isAuthenticated: true });
    mocks.generateSecret.mockResolvedValue({
      secretKey: 'SECRET',
      generateQrCodeUrl: (account: string, issuer: string) => `otpauth://${issuer}/${account}`,
    });

    const enrollment = await useAuthStore.getState().enableTotp();
    expect(enrollment).toEqual({
      secret: 'SECRET',
      otpAuthUrl: 'otpauth://Classic Watch Pro/alice@example.com',
    });

    await useAuthStore.getState().confirmTotp(' 654321 ');
    expect(mocks.enroll).toHaveBeenCalledWith('enroll-assertion', 'TOTP');
    expect(useAuthStore.getState().user?.mfaEnabled).toBe(true);

    mocks.enrolledFactors.push({ uid: 'totp-1' });
    await useAuthStore.getState().disableMfa();
    expect(mocks.unenroll).toHaveBeenCalledWith('totp-1');
    expect(useAuthStore.getState().user?.mfaEnabled).toBe(false);
  });

  it('requires enrollment to start before a TOTP code can be confirmed', async () => {
    mocks.firebaseAuth.currentUser = firebaseUser();
    useAuthStore.setState({ user: makeUser(), isAuthenticated: true });

    await useAuthStore.getState().signOut();
    await expect(useAuthStore.getState().confirmTotp('123456')).rejects.toThrow(
      'Start enrollment before confirming.'
    );
  });

  it.each(['registerPasskey', 'removePasskey', 'signInWithPasskey'] as const)(
    'rejects %s because passkeys are demo-only',
    async (action) => {
      useAuthStore.setState({ user: makeUser(), isAuthenticated: true });
      await expect(
        (useAuthStore.getState()[action] as (arg?: string) => Promise<unknown>)('pk')
      ).rejects.toThrow('available in demo mode only');
    }
  );
});
