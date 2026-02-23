import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Notification } from '@/types';
import { subscribeToNotifications, unsubscribeFromNotifications } from '@/lib/socket';
import toast from 'react-hot-toast';

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  isInitialized: boolean;
  
  // Actions
  initialize: () => void;
  cleanup: () => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsStore>()(
  immer((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isInitialized: false,

    initialize: () => {
      if (get().isInitialized) return;

      // Subscribe to real-time notifications
      subscribeToNotifications((notification: Notification) => {
        get().addNotification(notification);
        
        // Show toast notification
        switch (notification.type) {
          case 'success':
            toast.success(notification.title);
            break;
          case 'error':
            toast.error(notification.title);
            break;
          case 'warning':
            toast(notification.title, { icon: '⚠️' });
            break;
          default:
            toast(notification.title);
        }

        // Play sound (optional)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192.png',
          });
        }
      });

      set({ isInitialized: true });
    },

    cleanup: () => {
      unsubscribeFromNotifications();
      set({ isInitialized: false });
    },

    addNotification: (notification) => {
      set((state) => {
        state.notifications.unshift(notification);
        if (!notification.read) {
          state.unreadCount++;
        }
        
        // Keep only last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      });
    },

    markAsRead: (id) => {
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
    },

    markAllAsRead: () => {
      set((state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      });
    },

    deleteNotification: (id) => {
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n.id !== id);
      });
    },

    clearAll: () => {
      set({
        notifications: [],
        unreadCount: 0,
      });
    },
  }))
);

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Notification types
export const NotificationTypes = {
  ORDER_PLACED: 'order_placed',
  ORDER_UPDATED: 'order_updated',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  NEW_MESSAGE: 'new_message',
  STOCK_ALERT: 'stock_alert',
  PRICE_DROP: 'price_drop',
  WISHLIST_SALE: 'wishlist_sale',
  NEW_PRODUCT: 'new_product',
  REVIEW_RESPONSE: 'review_response',
};
