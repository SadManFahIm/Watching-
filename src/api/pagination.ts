import type { PaginatedResponse } from '@/types';

/**
 * Loads every page of a paginated endpoint and returns the combined items.
 * Fetches page 1 to learn `totalPages`, then the remaining pages in parallel.
 * A response that is not a PaginatedResponse yields no items rather than
 * `undefined` entries, so callers can always iterate the result safely.
 */
export const fetchAllPages = async <T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> => {
  const first = await fetchPage(1);
  if (!(first.totalPages > 1)) return first.data ?? [];

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) => fetchPage(index + 2))
  );
  return [first, ...rest].flatMap((page) => page.data ?? []);
};
