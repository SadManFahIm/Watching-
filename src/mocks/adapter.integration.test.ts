// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

/**
 * End-to-end persistence + audit integration test. Drives the mock adapter
 * exactly like axios would (stringified bodies), then simulates a full page
 * reload by resetting the module graph and re-importing — the hydrated seeds
 * must reflect every mutation with its audit trail intact.
 */

const config = (method: string, url: string, data?: unknown): InternalAxiosRequestConfig =>
  ({
    method,
    url,
    data: data === undefined ? undefined : JSON.stringify(data),
    headers: {},
  }) as unknown as InternalAxiosRequestConfig;

const loadAdapter = async () => (await import('@/mocks/adapter')).mockApiAdapter;

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('mock adapter persistence + audit integration', () => {
  it('persists a placed order, its audit trail and stock changes across reloads', async () => {
    const adapter = await loadAdapter();
    const product = (await adapter(config('get', '/products/p3'))).data;
    const stockBefore = product.stock;

    const created = (
      await adapter(
        config('post', '/orders', {
          userId: 'demo-user',
          items: [{ productId: 'p3', quantity: 1, product }],
          subtotal: product.price,
          shipping: 0,
          tax: Math.round(product.price * 0.05 * 100) / 100,
          total: product.price + Math.round(product.price * 0.05 * 100) / 100,
          shippingAddress: {
            fullName: 'Demo Admin',
            phone: '+1 555 010 2030',
            addressLine1: '12 Lakeview Avenue',
            city: 'Geneva',
            state: 'GE',
            postalCode: '1204',
            country: 'Switzerland',
          },
          paymentMethod: 'card',
        })
      )
    ).data;

    expect(created.id).toBe('o7');
    expect(created.history?.map((event: { action: string }) => event.action)).toContain(
      'Order placed'
    );

    // Full "page reload": fresh module graph hydrated from localStorage.
    vi.resetModules();
    const reloaded = await loadAdapter();
    const data = await import('@/mocks/data');

    expect(data.seedOrders).toHaveLength(7);
    const o7 = data.seedOrders.find((order) => order.id === 'o7');
    expect(o7).toBeDefined();
    expect(o7?.history?.[0]?.action).toBe('Order placed');
    expect(o7?.history?.[0]?.at).toBeInstanceOf(Date);
    // Dates are revived properly — sorting by createdAt works after reload.
    expect(new Date(o7?.createdAt as unknown as string).getTime()).toBeGreaterThan(0);
    expect(data.seedProducts.find((item) => item.id === 'p3')?.stock).toBe(stockBefore - 1);

    // The reloaded adapter still serves the persisted order.
    const fetched = (await reloaded(config('get', '/orders/o7'))).data;
    expect(fetched.id).toBe('o7');
    expect(fetched.orderStatus).toBe('pending');
  });

  it('appends and persists status-change audit events across reloads', async () => {
    const adapter = await loadAdapter();

    const before = (
      await adapter(config('patch', '/orders/o3/status', { status: 'shipped', trackingNumber: 'CWP2026TRK9' }))
    ).data;
    const lastEvent = before.history?.[before.history.length - 1];
    expect(lastEvent?.action).toBe('Status changed to shipped');
    expect(lastEvent?.detail).toContain('CWP2026TRK9');

    vi.resetModules();
    const data = await import('@/mocks/data');
    const o3 = data.seedOrders.find((order) => order.id === 'o3');
    expect(o3?.orderStatus).toBe('shipped');
    expect(o3?.trackingNumber).toBe('CWP2026TRK9');
    const reloadedLast = o3?.history?.[(o3?.history?.length ?? 1) - 1];
    expect(reloadedLast?.action).toBe('Status changed to shipped');
    expect(reloadedLast?.at).toBeInstanceOf(Date);
  });

  it('rejects status changes outside the order lifecycle and leaves the order untouched', async () => {
    const adapter = await loadAdapter();

    // o1 is delivered — a terminal state.
    await expect(
      adapter(config('patch', '/orders/o1/status', { status: 'pending' }))
    ).rejects.toMatchObject({ response: { status: 400 } });
    // o3 is processing — it cannot skip shipping.
    await expect(
      adapter(config('patch', '/orders/o3/status', { status: 'delivered' }))
    ).rejects.toMatchObject({ response: { status: 400 } });

    const o1 = (await adapter(config('get', '/orders/o1'))).data;
    expect(o1.orderStatus).toBe('delivered');
    const o3 = (await adapter(config('get', '/orders/o3'))).data;
    expect(o3.orderStatus).toBe('processing');
  });

  it('allows a same-status update that only adds tracking', async () => {
    const adapter = await loadAdapter();

    // o2 is already shipped.
    const updated = (
      await adapter(config('patch', '/orders/o2/status', { status: 'shipped', trackingNumber: 'CWP2026TRK1' }))
    ).data;
    expect(updated.orderStatus).toBe('shipped');
    expect(updated.trackingNumber).toBe('CWP2026TRK1');
  });

  it('persists role changes with audit events and default 2FA state', async () => {
    const adapter = await loadAdapter();

    const updated = (
      await adapter(config('patch', '/users/user-sarah', { role: 'admin' }))
    ).data;
    expect(updated.role).toBe('admin');
    const updatedLast = updated.history?.[updated.history.length - 1];
    expect(updatedLast?.action).toBe('Admin access granted');
    expect(updatedLast?.detail).toBe('Role changed: user → admin');

    vi.resetModules();
    const data = await import('@/mocks/data');
    const sarah = data.seedUsers.find((user) => user.id === 'user-sarah');
    expect(sarah?.role).toBe('admin');
    const sarahLast = sarah?.history?.[(sarah?.history?.length ?? 1) - 1];
    expect(sarahLast?.action).toBe('Admin access granted');
    // New schema fields hydrate with defaults for v1-era persisted users.
    expect(sarah?.mfaEnabled).toBe(false);
  });

  it('rejects invalid payloads and succeeds with valid ones', async () => {
    const adapter = await loadAdapter();

    await expect(
      adapter(config('post', '/orders', { items: [], total: 0 }))
    ).rejects.toMatchObject({ message: 'Order has no items' });

    const product = (await adapter(config('get', '/products/p1'))).data;
    const created = await adapter(
      config('post', '/orders', {
        userId: 'demo-user',
        items: [{ productId: 'p1', quantity: 1, product }],
        total: 800,
        paymentMethod: 'cod',
      })
    );
    expect(created.status).toBe(201);
    expect(created.data.history?.[0]?.detail).toBe('Cash on delivery');
  });
});