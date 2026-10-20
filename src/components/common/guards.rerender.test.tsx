// @vitest-environment jsdom
import { Profiler } from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';
import { useAuthStore } from '@/store/auth.store';

/**
 * The route guards wrap every protected page, so they must only re-render when
 * the auth fields they read change — not on unrelated store updates such as a
 * pending MFA challenge.
 */

const admin = {
  id: 'admin-1',
  email: 'admin@example.com',
  displayName: 'Priya',
  role: 'admin' as const,
  emailVerified: true,
  mfaEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const countRenders = (guard: React.ReactNode) => {
  let renders = 0;
  render(
    <MemoryRouter>
      <Profiler id="guard" onRender={() => (renders += 1)}>
        {guard}
      </Profiler>
    </MemoryRouter>
  );
  return () => renders;
};

describe('route guards subscribe to the auth fields they use', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: admin,
      isAuthenticated: true,
      isAdmin: true,
      isLoading: false,
      pendingMfa: null,
    });
  });

  it.each([
    [
      'ProtectedRoute',
      <ProtectedRoute key="p">
        <div>content</div>
      </ProtectedRoute>,
    ],
    [
      'AdminRoute',
      <AdminRoute key="a">
        <div>content</div>
      </AdminRoute>,
    ],
  ])('%s ignores unrelated auth store updates', (_name, guard) => {
    const renders = countRenders(guard);
    const initial = renders();

    act(() => {
      useAuthStore.setState({ pendingMfa: { email: 'someone@example.com', mode: 'totp' } });
    });

    expect(renders()).toBe(initial);
  });

  it('still re-renders when a field it reads changes', () => {
    const renders = countRenders(
      <ProtectedRoute>
        <div>content</div>
      </ProtectedRoute>
    );
    const initial = renders();

    act(() => {
      useAuthStore.setState({ isLoading: true });
    });

    expect(renders()).toBeGreaterThan(initial);
  });
});
