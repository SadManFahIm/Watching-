import { describe, expect, it, vi } from 'vitest';
import type { PaginatedResponse } from '@/types';
import { fetchAllPages } from './pagination';

const pageOf = (items: number[], page: number, pageSize: number): PaginatedResponse<number> => ({
  data: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
});

describe('fetchAllPages', () => {
  it('collects every item across all pages, in page order', async () => {
    const items = Array.from({ length: 7 }, (_, i) => i + 1);
    const fetchPage = vi.fn((page: number) => Promise.resolve(pageOf(items, page, 3)));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(items);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('makes a single request when everything fits on one page', async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(pageOf([1, 2], page, 10)));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list for an empty collection', async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(pageOf([], page, 10)));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([]);
  });

  it.each([
    ['a bare array', [{ id: 'o1' }]],
    ['a differently-keyed object', { products: [{ id: 'p1' }] }],
  ])('returns an empty list instead of [undefined] for %s', async (_label, response) => {
    // The live server answers in shapes other than PaginatedResponse; callers
    // iterate the result, so it must never contain undefined entries.
    const fetchPage = vi.fn(() =>
      Promise.resolve(response as unknown as PaginatedResponse<{ id: string }>)
    );

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
