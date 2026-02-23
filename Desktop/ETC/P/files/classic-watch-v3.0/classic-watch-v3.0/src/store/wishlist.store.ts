import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WishlistItem } from '@/types';

interface WishlistStore {
  items: WishlistItem[];
  
  // Actions
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    immer((set, get) => ({
      items: [],

      addToWishlist: (productId) => {
        const exists = get().items.some((item) => item.productId === productId);
        
        if (!exists) {
          set((state) => {
            state.items.push({
              productId,
              addedAt: new Date(),
            });
          });
        }
      },

      removeFromWishlist: (productId) => {
        set((state) => {
          state.items = state.items.filter(
            (item) => item.productId !== productId
          );
        });
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    })),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
