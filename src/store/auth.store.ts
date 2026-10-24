import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { resolveAuthProvider, type AuthResult } from '@/store/authProviders';
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

// The backend work (Firebase, demo accounts, or none) lives in
// '@/store/authProviders'; this store owns state, loading and error handling.
export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => {
      // Applies a provider result, then resolves the admin role when asked to.
      const apply = async ({ patch, checkAdminFor }: AuthResult) => {
        set(patch);
        if (checkAdminFor !== undefined) await get().checkAdminStatus(checkAdminFor);
      };

      const setMfaEnabled = (enabled: boolean) => {
        set((state) => {
          if (state.user) {
            state.user.mfaEnabled = enabled;
            state.user.mfaEnrolledAt = enabled ? new Date() : undefined;
          }
        });
      };

      return {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
        pendingMfa: null,

        initialize: async () => {
          const provider = await resolveAuthProvider();
          await provider.initialize(apply);
        },

        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true });
            const provider = await resolveAuthProvider();
            await apply(await provider.signIn(email, password));
          } catch (error) {
            set({ isLoading: false });
            throw new Error(error instanceof Error ? error.message : 'Failed to sign in', {
              cause: error,
            });
          }
        },

        verifyMfaChallenge: async (code: string) => {
          const provider = await resolveAuthProvider();
          await apply(await provider.verifyMfaChallenge(code, get().pendingMfa));
        },

        signInWithPasskey: async () => {
          const provider = await resolveAuthProvider();
          await apply(await provider.signInWithPasskey(get().pendingMfa));
        },

        enableTotp: async () => {
          const provider = await resolveAuthProvider();
          return provider.enableTotp(get().user);
        },

        confirmTotp: async (code: string) => {
          const provider = await resolveAuthProvider();
          await provider.confirmTotp(get().user, code);
          setMfaEnabled(true);
        },

        disableMfa: async () => {
          const provider = await resolveAuthProvider();
          await provider.disableMfa(get().user);
          setMfaEnabled(false);
        },

        registerPasskey: async (name: string) => {
          const provider = await resolveAuthProvider();
          const record = await provider.registerPasskey(get().user, name);
          set((state) => {
            if (state.user) state.user.passkeys = [...(state.user.passkeys ?? []), record];
          });
          return record;
        },

        removePasskey: async (passkeyId: string) => {
          const provider = await resolveAuthProvider();
          await provider.removePasskey(get().user, passkeyId);
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
            const provider = await resolveAuthProvider();
            await apply(await provider.signUp(email, password, displayName));
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
            const provider = await resolveAuthProvider();
            await apply(await provider.signInWithGoogle());
          } catch (error) {
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
          try {
            const provider = await resolveAuthProvider();
            // Only a real Firebase session takes a network round trip to end.
            if (provider.kind === 'firebase') set({ isLoading: true });
            await provider.signOut();
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
          const provider = await resolveAuthProvider();
          await provider.resetPassword(email);
        },

        sendEmailVerification: async () => {
          const provider = await resolveAuthProvider();
          await provider.sendEmailVerification();
        },

        refreshAuthState: async () => {
          const provider = await resolveAuthProvider();
          const emailVerified = await provider.refreshEmailVerified();
          if (emailVerified === undefined) return;
          set((state) => {
            if (state.user) {
              state.user.emailVerified = emailVerified;
            }
          });
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
      };
    }),
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
