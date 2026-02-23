import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

// Analytics Types
export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface ProductMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerGrowth: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    ordersCount: number;
  }>;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  revenue: number;
  percentage: number;
}

export interface TrafficData {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
}

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  salesMetrics: (period: string) => [...analyticsKeys.all, 'sales', period] as const,
  productMetrics: () => [...analyticsKeys.all, 'products'] as const,
  customerMetrics: (period: string) => [...analyticsKeys.all, 'customers', period] as const,
  revenueChart: (period: string) => [...analyticsKeys.all, 'revenue', period] as const,
  categorySales: (period: string) => [...analyticsKeys.all, 'category', period] as const,
  traffic: (period: string) => [...analyticsKeys.all, 'traffic', period] as const,
};

// Hooks
export const useSalesMetrics = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return useQuery({
    queryKey: analyticsKeys.salesMetrics(period),
    queryFn: async () => {
      const response = await api.get<SalesMetrics>(`/analytics/sales?period=${period}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProductMetrics = () => {
  return useQuery({
    queryKey: analyticsKeys.productMetrics(),
    queryFn: async () => {
      const response = await api.get<ProductMetrics>('/analytics/products');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCustomerMetrics = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return useQuery({
    queryKey: analyticsKeys.customerMetrics(period),
    queryFn: async () => {
      const response = await api.get<CustomerMetrics>(
        `/analytics/customers?period=${period}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRevenueChart = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return useQuery({
    queryKey: analyticsKeys.revenueChart(period),
    queryFn: async () => {
      const response = await api.get<RevenueData[]>(
        `/analytics/revenue-chart?period=${period}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCategorySales = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return useQuery({
    queryKey: analyticsKeys.categorySales(period),
    queryFn: async () => {
      const response = await api.get<CategorySales[]>(
        `/analytics/category-sales?period=${period}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useTrafficData = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return useQuery({
    queryKey: analyticsKeys.traffic(period),
    queryFn: async () => {
      const response = await api.get<TrafficData[]>(
        `/analytics/traffic?period=${period}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Export CSV
export const exportAnalytics = async (
  type: 'sales' | 'products' | 'customers',
  period: string
): Promise<void> => {
  try {
    const response = await api.get(`/analytics/export/${type}?period=${period}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Real-time metrics (WebSocket)
export const subscribeToRealtimeMetrics = (
  callback: (metrics: Partial<SalesMetrics>) => void
): void => {
  // Implementation would use Socket.IO
  // This is a placeholder for the structure
};
