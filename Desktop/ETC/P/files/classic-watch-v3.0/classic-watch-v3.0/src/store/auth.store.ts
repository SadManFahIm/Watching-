import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import type { User, AuthState } from '@/types';
import api from '@/lib/axios';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAdminStatus: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const auth = getFirebaseAuth();
const googleProvider = new GoogleAuthProvider();

// Helper function to convert Firebase user to app user
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || undefined,
  role: 'user', // Will be updated by checkAdminStatus
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

      initialize: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const user = convertFirebaseUser(firebaseUser);
            set({ user, isAuthenticated: true, isLoading: false });
            
            // Check admin status
            await get().checkAdminStatus(user.email);
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isAdmin: false, 
              isLoading: false 
            });
          }
        });
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const result = await signInWithEmailAndPassword(auth, email, password);
          const user = convertFirebaseUser(result.user);
          
          set({ user, isAuthenticated: true, isLoading: false });
          await get().checkAdminStatus(email);
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to sign in');
        }
      },

      signUp: async (email: string, password: string, displayName: string) => {
        try {
          set({ isLoading: true });
          const result = await createUserWithEmailAndPassword(auth, email, password);
          
          // Update display name
          await updateProfile(result.user, { displayName });
          
          const user = convertFirebaseUser(result.user);
          user.displayName = displayName;
          
          // Save to backend
          await saveUserToBackend(user, 'POST');
          
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to sign up');
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const result = await signInWithPopup(auth, googleProvider);
          const user = convertFirebaseUser(result.user);
          
          // Save to backend
          await saveUserToBackend(user, 'PUT');
          
          set({ user, isAuthenticated: true, isLoading: false });
          await get().checkAdminStatus(user.email);
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to sign in with Google');
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          await firebaseSignOut(auth);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isAdmin: false, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to sign out');
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
