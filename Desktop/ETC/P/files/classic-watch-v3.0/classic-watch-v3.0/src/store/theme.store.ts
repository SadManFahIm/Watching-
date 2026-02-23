import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  isDark: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

// Check system preference
const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: getSystemTheme(),

      setMode: (mode) => {
        const isDark = mode === 'dark' || (mode === 'system' && getSystemTheme());
        set({ mode, isDark });
        
        // Update document class
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDark);
        }
      },

      toggleMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setMode(newMode);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on load
          const isDark = 
            state.mode === 'dark' || 
            (state.mode === 'system' && getSystemTheme());
          
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
          }
        }
      },
    }
  )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const store = useThemeStore.getState();
      if (store.mode === 'system') {
        store.setMode('system');
      }
    });
}
