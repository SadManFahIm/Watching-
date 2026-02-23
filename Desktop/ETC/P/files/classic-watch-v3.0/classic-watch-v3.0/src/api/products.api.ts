import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Product, ProductFilters, PaginatedResponse, SortOption } from '@/types';
import toast from 'react-hot-toast';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilters, sort?: SortOption, page = 1) =>
    [...productKeys.lists(), { filters, sort, page }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  latest: () => [...productKeys.all, 'latest'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
};

// Fetch products with filters
export const useProducts = (
  filters?: ProductFilters,
  sort?: SortOption,
  page = 1,
  pageSize = 12
) => {
  return useQuery({
    queryKey: productKeys.list(filters, sort, page),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.category?.length) {
        params.append('category', filters.category.join(','));
      }
      if (filters?.brand?.length) {
        params.append('brand', filters.brand.join(','));
      }
      if (filters?.priceRange) {
        params.append('minPrice', filters.priceRange[0].toString());
        params.append('maxPrice', filters.priceRange[1].toString());
      }
      if (filters?.rating) {
        params.append('rating', filters.rating.toString());
      }
      if (filters?.inStock !== undefined) {
        params.append('inStock', filters.inStock.toString());
      }
      if (sort) {
        params.append('sort', sort);
      }
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await api.get<PaginatedResponse<Product>>(`/products?${params}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch single product
export const useProduct = (id: string, options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
    ...options,
  });
};

// Fetch featured products
export const useFeaturedProducts = (limit = 8) => {
  return useQuery({
    queryKey: [...productKeys.featured(), limit],
    queryFn: async () => {
      const response = await api.get<Product[]>(`/products/featured?limit=${limit}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Fetch latest products
export const useLatestProducts = (limit = 8) => {
  return useQuery({
    queryKey: [...productKeys.latest(), limit],
    queryFn: async () => {
      const response = await api.get<Product[]>(`/products/latest?limit=${limit}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Search products
export const useSearchProducts = (query: string, enabled = true) => {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: async () => {
      if (!query.trim()) return [];
      const response = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && query.trim().length > 0,
  });
};

// Admin: Create product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<Product>('/products', product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });
};

// Admin: Update product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const response = await api.put<Product>(`/products/${id}`, product);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.id) });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });
};

// Admin: Delete product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });
};
