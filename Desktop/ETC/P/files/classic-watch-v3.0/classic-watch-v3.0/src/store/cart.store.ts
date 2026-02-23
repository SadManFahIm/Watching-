import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Cart, CartItem, Product } from '@/types';

interface CartStore extends Cart {
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
  calculateTotal: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.id
          );

          if (existingItem) {
            // Update quantity if item already exists
            existingItem.quantity += quantity;
          } else {
            // Add new item
            state.items.push({
              productId: product.id,
              quantity,
              product,
            });
          }

          // Recalculate totals
          state.itemCount = state.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          state.total = state.items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
        });
      },

      removeItem: (productId) => {
        set((state) => {
          state.items = state.items.filter(
            (item) => item.productId !== productId
          );

          // Recalculate totals
          state.itemCount = state.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          state.total = state.items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const item = state.items.find((item) => item.productId === productId);
          if (item) {
            item.quantity = quantity;

            // Recalculate totals
            state.itemCount = state.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            state.total = state.items.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0
            );
          }
        });
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
        });
      },

      getItem: (productId) => {
        return get().items.find((item) => item.productId === productId);
      },

      calculateTotal: () => {
        const state = get();
        const itemCount = state.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const total = state.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        set({ itemCount, total });
      },
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
