import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (userId?: string, page = 1) => [...orderKeys.lists(), { userId, page }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  myOrders: (userId: string) => [...orderKeys.all, 'my-orders', userId] as const,
};

// Fetch all orders (Admin)
export const useAllOrders = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: orderKeys.list(undefined, page),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Order>>(
        `/orders?page=${page}&pageSize=${pageSize}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Fetch user's orders
export const useMyOrders = (userId: string) => {
  return useQuery({
    queryKey: orderKeys.myOrders(userId),
    queryFn: async () => {
      const response = await api.get<Order[]>(`/orders/user/${userId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
};

// Fetch single order
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Order>(`/orders/${id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
};

// Create order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<Order>('/orders', order);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders(data.userId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order placed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });
};

// Update order status (Admin)
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status,
      trackingNumber 
    }: { 
      orderId: string; 
      status: OrderStatus;
      trackingNumber?: string;
    }) => {
      const response = await api.patch<Order>(`/orders/${orderId}/status`, {
        status,
        trackingNumber,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders(data.userId) });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });
};

// Cancel order
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch<Order>(`/orders/${orderId}/cancel`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders(data.userId) });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });
};

// Delete order (Admin)
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      await api.delete(`/orders/${orderId}`);
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    },
  });
};
