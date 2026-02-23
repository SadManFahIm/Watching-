import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  subscribeToOrderUpdates,
  unsubscribeFromOrderUpdates,
} from '@/lib/socket';
import type { Order } from '@/types';

export interface OrderTrackingInfo {
  orderId: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  carrier?: string;
  timeline: Array<{
    status: string;
    location?: string;
    timestamp: Date;
    description: string;
  }>;
}

// Real-time order tracking hook
export const useOrderTracking = (orderId: string) => {
  const [realtimeUpdate, setRealtimeUpdate] = useState<Partial<OrderTrackingInfo> | null>(
    null
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const response = await api.get<OrderTrackingInfo>(`/orders/${orderId}/tracking`);
      return response.data;
    },
    enabled: !!orderId,
    staleTime: 1000 * 30, // 30 seconds
  });

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to real-time updates
    subscribeToOrderUpdates(orderId, (update) => {
      setRealtimeUpdate(update);
      refetch(); // Refetch full data when update received
    });

    return () => {
      unsubscribeFromOrderUpdates(orderId);
    };
  }, [orderId, refetch]);

  return {
    trackingInfo: data,
    realtimeUpdate,
    isLoading,
    error,
    refetch,
  };
};

// Get QR code for order tracking
export const getOrderQRCode = async (orderId: string): Promise<string> => {
  const response = await api.get(`/orders/${orderId}/qr-code`, {
    responseType: 'blob',
  });

  return URL.createObjectURL(response.data);
};

// Share tracking link
export const shareTrackingLink = async (orderId: string): Promise<string> => {
  const response = await api.post<{ shareUrl: string }>(`/orders/${orderId}/share`);
  return response.data.shareUrl;
};

// Get delivery estimate
export const getDeliveryEstimate = async (
  orderId: string
): Promise<{
  earliest: Date;
  latest: Date;
  confidence: number;
}> => {
  const response = await api.get(`/orders/${orderId}/delivery-estimate`);
  return response.data;
};

// Subscribe to delivery notifications
export const enableDeliveryNotifications = async (
  orderId: string,
  method: 'sms' | 'email' | 'push'
): Promise<void> => {
  await api.post(`/orders/${orderId}/notifications`, { method });
};

// Order status constants
export const OrderStatusSteps = {
  PLACED: {
    label: 'Order Placed',
    description: 'Your order has been received',
    icon: '📦',
  },
  CONFIRMED: {
    label: 'Confirmed',
    description: 'Order confirmed and being prepared',
    icon: '✅',
  },
  PROCESSING: {
    label: 'Processing',
    description: 'Your order is being packed',
    icon: '🔄',
  },
  SHIPPED: {
    label: 'Shipped',
    description: 'Your order is on the way',
    icon: '🚚',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    description: 'Your order will arrive today',
    icon: '🏃',
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been delivered',
    icon: '🎉',
  },
};

// Calculate order progress percentage
export const calculateOrderProgress = (status: string): number => {
  const statusOrder = [
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const index = statusOrder.indexOf(status);
  return index === -1 ? 0 : ((index + 1) / statusOrder.length) * 100;
};

// Get estimated delivery message
export const getDeliveryMessage = (
  status: string,
  estimatedDelivery?: Date
): string => {
  switch (status) {
    case 'PLACED':
    case 'CONFIRMED':
      return 'Your order is being prepared';
    case 'PROCESSING':
      return 'Your order is being packed';
    case 'SHIPPED':
      if (estimatedDelivery) {
        const days = Math.ceil(
          (estimatedDelivery.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return `Estimated delivery in ${days} ${days === 1 ? 'day' : 'days'}`;
      }
      return 'Your order is on the way';
    case 'OUT_FOR_DELIVERY':
      return 'Your order will arrive today';
    case 'DELIVERED':
      return 'Your order has been delivered';
    default:
      return 'Order status unknown';
  }
};
