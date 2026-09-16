/**
 * Accessibility regression tests.
 *
 * Renders every page (with the real layouts, guards and providers) and runs
 * axe-core's WCAG A/AA rules against the DOM. `color-contrast` is disabled
 * here: jsdom has no layout engine, so contrast can only be verified against
 * a real browser — the CI Lighthouse job covers it. Structural rules
 * (heading-order, aria-*, landmark/region, label, name) run for real and fail
 * the pipeline on any regression.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import axe from 'axe-core';

import { createAppTheme } from '@/styles/theme';
import MainLayout from '@/components/layout/MainLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';

import HomePage from '@/features/home/pages/HomePage';
import ProductsPage from '@/features/products/pages/ProductsPage';
import ProductDetailPage from '@/features/products/pages/ProductDetailPage';
import CartPage from '@/features/cart/pages/CartPage';
import CheckoutPage from '@/features/cart/pages/CheckoutPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ProfilePage from '@/features/auth/pages/ProfilePage';
import WishlistPage from '@/features/products/pages/WishlistPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import MyOrdersPage from '@/features/orders/pages/MyOrdersPage';
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import ManageProductsPage from '@/features/admin/pages/ManageProductsPage';
import ManageOrdersPage from '@/features/admin/pages/ManageOrdersPage';
import ManageUsersPage from '@/features/admin/pages/ManageUsersPage';
import ManageReviewsPage from '@/features/admin/pages/ManageReviewsPage';
import AddProductPage from '@/features/admin/pages/AddProductPage';
import NotFoundPage from '@/features/errors/pages/NotFoundPage';
import ErrorFallback from '@/components/common/ErrorFallback';

import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { makeProduct, makeUser } from '@/test/factories';

type AuthState = 'guest' | 'user' | 'admin';

const setAuth = (state: AuthState) => {
  useAuthStore.setState({
    user:
      state === 'guest'
        ? null
        : makeUser({
            role: state === 'admin' ? 'admin' : 'user',
            email: 'demo@classicwatch.local',
          }),
    isAuthenticated: state !== 'guest',
    isAdmin: state === 'admin',
    isLoading: false,
    pendingMfa: null,
  });
};

const setCart = (count: number) => {
  const product = makeProduct();
  const items =
    count > 0
      ? [
          {
            productId: product.id,
            product,
            quantity: count,
          },
        ]
      : [];
  useCartStore.setState({
    items,
    total: count * product.price,
    itemCount: count,
  });
};

const AppRoutes = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>
    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/orders" element={<MyOrdersPage />} />
    </Route>
    <Route
      element={
        <AdminRoute>
          <DashboardLayout />
        </AdminRoute>
      }
    >
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/products" element={<ManageProductsPage />} />
      <Route path="/admin/products/add" element={<AddProductPage />} />
      <Route path="/admin/orders" element={<ManageOrdersPage />} />
      <Route path="/admin/users" element={<ManageUsersPage />} />
      <Route path="/admin/reviews" element={<ManageReviewsPage />} />
    </Route>
  </Routes>
);

const renderPage = (path: string, auth: AuthState) => {
  setAuth(auth);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={createAppTheme('light')}>
        <CssBaseline />
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const expectNoA11yViolations = async (): Promise<void> => {
  const results = await axe.run(document.body, {
    rules: {
      // Needs a real layout engine — covered by the Lighthouse CI job.
      'color-contrast': { enabled: false },
    },
  });
  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
  expect(violations).toEqual([]);
};

const waitForContent = async () => {
  // Page heading + data-driven content settled (mock latency is ~40ms).
  await waitFor(
    () => {
      expect(document.querySelector('h1')).not.toBeNull();
      expect(document.querySelector('[role="status"][aria-label="Loading products"]')).toBeNull();
      expect(document.querySelector('[aria-label="Loading"]')).toBeNull();
    },
    { timeout: 4000 }
  );
  // Allow the mock data to flush.
  await waitFor(
    () => {
      expect(document.querySelector('.MuiCircularProgress-root')).toBeNull();
    },
    { timeout: 4000 }
  );
};

describe('accessibility regression tests (axe-core, WCAG A/AA)', () => {
  beforeEach(() => {
    localStorage.clear();
    setAuth('guest');
    setCart(0);
  });

  it('home page', async () => {
    renderPage('/', 'guest');
    await waitForContent();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /add to cart/i }).length).toBeGreaterThan(0)
    );
    await expectNoA11yViolations();
  });

  it('products catalog', async () => {
    renderPage('/products', 'guest');
    await waitForContent();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /add to cart/i }).length).toBeGreaterThan(0)
    );
    await expectNoA11yViolations();
  });

  it('product detail', async () => {
    renderPage('/products/p1', 'guest');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('cart (empty)', async () => {
    setCart(0);
    renderPage('/cart', 'guest');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('cart (with items)', async () => {
    setCart(2);
    renderPage('/cart', 'guest');
    await waitForContent();
    await waitFor(() => expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('login', async () => {
    renderPage('/login', 'guest');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('register', async () => {
    renderPage('/register', 'guest');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('forgot password', async () => {
    renderPage('/forgot-password', 'guest');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('checkout', async () => {
    setCart(1);
    renderPage('/checkout', 'user');
    await waitForContent();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument()
    );
    await expectNoA11yViolations();
  });

  it('wishlist', async () => {
    renderPage('/wishlist', 'user');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('profile', async () => {
    renderPage('/profile', 'user');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('user dashboard', async () => {
    renderPage('/dashboard', 'user');
    await waitForContent();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    );
    await expectNoA11yViolations();
  });

  it('my orders', async () => {
    renderPage('/dashboard/orders', 'user');
    await waitForContent();
    await expectNoA11yViolations();
  });

  it('admin overview', async () => {
    renderPage('/admin', 'admin');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('admin products', async () => {
    renderPage('/admin/products', 'admin');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('admin add product', async () => {
    renderPage('/admin/products/add', 'admin');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('admin orders', async () => {
    renderPage('/admin/orders', 'admin');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('admin users', async () => {
    renderPage('/admin/users', 'admin');
    await waitForContent();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('admin reviews', async () => {
    renderPage('/admin/reviews', 'admin');
    // Admin reviews renders a large table — use a longer timeout for the initial paint.
    await waitFor(
      () => {
        expect(document.querySelector('h1')).not.toBeNull();
        expect(document.querySelector('.MuiCircularProgress-root')).toBeNull();
      },
      { timeout: 15000 }
    );
    await expectNoA11yViolations();
  });

  it('404 page', async () => {
    renderPage('/no-such-route', 'guest');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });

  it('error boundary fallback', async () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <CssBaseline />
        <ErrorFallback error={new Error('Test boundary error')} resetErrorBoundary={() => {}} />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    await expectNoA11yViolations();
  });
});
