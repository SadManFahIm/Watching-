import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description: string;
}

interface CouponStore {
  appliedCoupon: Coupon | null;
  availableCoupons: Coupon[];
  
  // Actions
  applyCoupon: (code: string, cartTotal: number) => Promise<boolean>;
  removeCoupon: () => void;
  fetchAvailableCoupons: () => Promise<void>;
  calculateDiscount: (cartTotal: number) => number;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      appliedCoupon: null,
      availableCoupons: [],

      applyCoupon: async (code: string, cartTotal: number) => {
        try {
          const response = await api.post('/coupons/validate', {
            code,
            cartTotal,
          });

          const coupon: Coupon = response.data;

          // Validate minimum purchase
          if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
            toast.error(
              `Minimum purchase of $${coupon.minPurchase} required`
            );
            return false;
          }

          // Check expiry
          if (new Date(coupon.expiresAt) < new Date()) {
            toast.error('This coupon has expired');
            return false;
          }

          // Check usage limit
          if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            toast.error('This coupon has reached its usage limit');
            return false;
          }

          set({ appliedCoupon: coupon });
          toast.success(`Coupon "${code}" applied successfully!`);
          return true;
        } catch (error: any) {
          const message = error.response?.data?.message || 'Invalid coupon code';
          toast.error(message);
          return false;
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
        toast.success('Coupon removed');
      },

      fetchAvailableCoupons: async () => {
        try {
          const response = await api.get('/coupons/available');
          set({ availableCoupons: response.data });
        } catch (error) {
          console.error('Error fetching coupons:', error);
        }
      },

      calculateDiscount: (cartTotal: number) => {
        const { appliedCoupon } = get();
        if (!appliedCoupon) return 0;

        let discount = 0;

        if (appliedCoupon.type === 'percentage') {
          discount = (cartTotal * appliedCoupon.value) / 100;
          
          // Apply max discount if specified
          if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
            discount = appliedCoupon.maxDiscount;
          }
        } else {
          // Fixed amount discount
          discount = appliedCoupon.value;
        }

        // Ensure discount doesn't exceed cart total
        return Math.min(discount, cartTotal);
      },
    }),
    {
      name: 'coupon-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);

// Admin: Create coupon
export const createCoupon = async (
  coupon: Omit<Coupon, 'id' | 'usedCount'>
): Promise<Coupon> => {
  const response = await api.post('/coupons', coupon);
  return response.data;
};

// Admin: Update coupon
export const updateCoupon = async (
  id: string,
  updates: Partial<Coupon>
): Promise<Coupon> => {
  const response = await api.put(`/coupons/${id}`, updates);
  return response.data;
};

// Admin: Delete coupon
export const deleteCoupon = async (id: string): Promise<void> => {
  await api.delete(`/coupons/${id}`);
};

// Admin: Get all coupons
export const getAllCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get('/coupons/admin/all');
  return response.data;
};

// Generate random coupon code
export const generateCouponCode = (prefix = 'WATCH'): string => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};
