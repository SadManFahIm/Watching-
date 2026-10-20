import { describe, expect, it } from 'vitest';
import { orderKeys } from './orders.api';

describe('orderKeys', () => {
  it('gives different page sizes their own cache entry', () => {
    // The admin dashboard loads 100 orders and Manage Orders loads 200; sharing
    // a key would let one page render the other's truncated list.
    expect(orderKeys.list(undefined, 1, 100)).not.toEqual(orderKeys.list(undefined, 1, 200));
  });

  it('keeps every list key under the shared lists() prefix for invalidation', () => {
    expect(orderKeys.list(undefined, 1, 100).slice(0, 2)).toEqual(orderKeys.lists());
  });
});
