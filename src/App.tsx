import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

// Store
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';

// Cross-tab sync
import { useCrossTabCartSync } from '@/features/cart/hooks/useCrossTabCartSync';

// Theme
import { createAppTheme } from '@/styles/theme';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Pages - Lazy loaded for code splitting
import { lazy, Suspense } from 'react';

// Home and the products catalog are the two landing routes Lighthouse and
// users hit first — they are tiny (5-7 KB) and eager-loading them removes the
// Suspense gap so the page paints immediately after the shell.
import Home from '@/features/home/pages/HomePage';
import Products from '@/features/products/pages/ProductsPage';
const ProductDetail = lazy(() => import('@/features/products/pages/ProductDetailPage'));
const Cart = lazy(() => import('@/features/cart/pages/CartPage'));
const Checkout = lazy(() => import('@/features/cart/pages/CheckoutPage'));
const Login = lazy(() => import('@/features/auth/pages/LoginPage'));
const Register = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPassword = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const VerifyEmail = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const Dashboard = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MyOrders = lazy(() => import('@/features/orders/pages/MyOrdersPage'));
const OrderDetail = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const Wishlist = lazy(() => import('@/features/products/pages/WishlistPage'));
const Profile = lazy(() => import('@/features/auth/pages/ProfilePage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const ManageProducts = lazy(() => import('@/features/admin/pages/ManageProductsPage'));
const ManageOrders = lazy(() => import('@/features/admin/pages/ManageOrdersPage'));
const ManageUsers = lazy(() => import('@/features/admin/pages/ManageUsersPage'));
const ManageReviews = lazy(() => import('@/features/admin/pages/ManageReviewsPage'));
const AddProduct = lazy(() => import('@/features/admin/pages/AddProductPage'));
const NotFound = lazy(() => import('@/features/errors/pages/NotFoundPage'));

// Components
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorFallback from '@/components/common/ErrorFallback';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isDark = useThemeStore((state) => state.isDark);

  // Initialize auth state
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Keep the cart in sync across open tabs.
  useCrossTabCartSync();

  // Create theme based on dark mode
  const theme = createAppTheme(isDark ? 'dark' : 'light');

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public routes with MainLayout */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* 404 — keep the header/footer shell so users can recover. */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Protected routes with MainLayout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                  </Route>

                  {/* Dashboard routes with DashboardLayout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/orders" element={<MyOrders />} />
                  </Route>

                  {/* Admin routes with DashboardLayout */}
                  <Route
                    element={
                      <AdminRoute>
                        <DashboardLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<ManageProducts />} />
                    <Route path="/admin/products/add" element={<AddProduct />} />
                    <Route path="/admin/products/edit/:id" element={<AddProduct />} />
                    <Route path="/admin/orders" element={<ManageOrders />} />
                    <Route path="/admin/users" element={<ManageUsers />} />
                    <Route path="/admin/reviews" element={<ManageReviews />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: isDark ? '#1e1e1e' : '#fff',
                  color: isDark ? '#fff' : '#000',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ThemeProvider>

          {/* React Query Devtools (only in dev) */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
