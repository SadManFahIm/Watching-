import { AxiosError } from 'axios';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { Order, Product, PromoCode, Review, User } from '@/types';
import { canTransition } from '@/features/orders/constants';
import {
  appendEvent,
  filterProducts,
  persistMockDb,
  recomputeProductRating,
  searchProducts,
  seedOrders,
  seedProducts,
  seedPromoCodes,
  seedReviews,
  seedUsers,
} from './data';

// Short artificial latency keeps a realistic loading state without paying a
// main-thread tax on every route (the mock DB is local, so 40ms reads as
// instant while still exercising skeletons/loading states).
const LATENCY_MS = 40;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const productById = (id: string): Product | undefined =>
  seedProducts.find((product) => product.id === id);

const orderById = (id: string): Order | undefined => seedOrders.find((order) => order.id === id);

// ---------------------------------------------------------------------------
// Audit helpers — every meaningful mutation appends an immutable event and
// persists the whole database so both history and reload survival hold.
// (appendEvent lives in ./data so demo-auth helpers share it.)
// ---------------------------------------------------------------------------

const persist = (): void => {
  persistMockDb();
};

// Custom axios adapters must apply status validation themselves (axios only does
// that inside its built-in adapters) — non-2xx responses must reject like axios.
const errorCodeFor = (status: number): string =>
  status === 401 ? 'ERR_INVALID_AUTH' : status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST';

const toResponse = async <T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T
): Promise<AxiosResponse> => {
  const response = {
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {},
    config,
  } as AxiosResponse;

  if (status >= 200 && status < 300) {
    return response;
  }

  const message = (data as { message?: string } | undefined)?.message ?? response.statusText;
  throw new AxiosError(message, errorCodeFor(status), config, null, response);
};

const notFound = (config: InternalAxiosRequestConfig, message: string): Promise<AxiosResponse> =>
  toResponse(config, 404, { success: false, message });

// Axios serializes request bodies to JSON strings before adapters run.
const parseBody = (config: InternalAxiosRequestConfig): unknown => {
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as unknown;
    } catch {
      return {};
    }
  }
  return config.data ?? {};
};

const isAdminEmail = (email: string): boolean =>
  email.startsWith('admin') || email.includes('demo');

const promoById = (code: string): PromoCode | undefined => {
  const normalized = code.trim().toUpperCase();
  return seedPromoCodes.find((promo) => promo.code.toUpperCase() === normalized);
};

/** Returns the promo when it is currently redeemable, else a user-safe error. */
const validatePromo = (
  promo: PromoCode | undefined,
  subtotal: number
): { ok: true; promo: PromoCode } | { ok: false; error: string } => {
  if (!promo) return { ok: false, error: 'Invalid promo code.' };
  if (!promo.active) return { ok: false, error: 'This promo code is no longer available.' };
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: 'This promo code has expired.' };
  }
  if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
    return { ok: false, error: 'This promo code has reached its usage limit.' };
  }
  if (promo.minOrderValue !== undefined && subtotal < promo.minOrderValue) {
    return {
      ok: false,
      error: `This code requires a minimum order of $${promo.minOrderValue}.`,
    };
  }
  return { ok: true, promo };
};

/** Computes the discount a promo grants on a pre-discount subtotal. */
export const discountForPromo = (promo: PromoCode, subtotal: number): number => {
  const raw =
    promo.type === 'percent' ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal);
  const capped =
    promo.type === 'percent' && promo.maxDiscount !== undefined
      ? Math.min(raw, promo.maxDiscount)
      : raw;
  return Math.round(capped * 100) / 100;
};

// ---------------------------------------------------------------------------
// Query string helpers (the API layer sends filters as URL params)
// ---------------------------------------------------------------------------

interface ListQuery {
  filters: import('@/types').ProductFilters | undefined;
  sort: import('@/types').SortOption;
  page: number;
  pageSize: number;
}

const parseListQuery = (searchParams: URLSearchParams): ListQuery => {
  const filters: ListQuery['filters'] = {};

  const category = searchParams.get('category');
  if (category) {
    const list = category
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (list.length > 0) filters.category = list;
  }

  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  if (minPriceRaw !== null || maxPriceRaw !== null) {
    const minPrice = Number(minPriceRaw);
    const maxPrice = Number(maxPriceRaw);
    filters.priceRange = [
      minPriceRaw !== null && Number.isFinite(minPrice) ? minPrice : 0,
      maxPriceRaw !== null && Number.isFinite(maxPrice) ? maxPrice : 1000000,
    ];
  }

  const rating = Number(searchParams.get('rating'));
  if (Number.isFinite(rating)) filters.rating = rating;

  if (searchParams.get('inStock') === 'true') filters.inStock = true;

  const page = Number(searchParams.get('page'));
  const pageSize = Number(searchParams.get('pageSize'));

  return {
    filters,
    sort: (searchParams.get('sort') as import('@/types').SortOption) ?? 'newest',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 12,
  };
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

const handleProducts = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).slice(1);
  const method = (config.method ?? 'get').toLowerCase();

  // GET /products/featured?limit=
  if (segments[0] === 'featured' && method === 'get') {
    const limit = Number(url.searchParams.get('limit') ?? 8);
    const featured = filterProducts({ isFeatured: true }, 'rating').slice(0, limit);
    return toResponse(config, 200, clone(featured));
  }

  // GET /products/latest?limit=
  if (segments[0] === 'latest' && method === 'get') {
    const limit = Number(url.searchParams.get('limit') ?? 8);
    const latest = filterProducts(undefined, 'newest').slice(0, limit);
    return toResponse(config, 200, clone(latest));
  }

  // GET /products/search?q=
  if (segments[0] === 'search' && method === 'get') {
    const query = url.searchParams.get('q') ?? '';
    return toResponse(config, 200, clone(searchProducts(query)));
  }

  const productId = segments[0];

  // GET /products/:id (single product — must be checked before the list route)
  if (productId && method === 'get') {
    const product = productById(productId);
    if (!product) return notFound(config, 'Product not found');
    return toResponse(config, 200, clone(product));
  }

  // GET /products?<filters>&page=&pageSize=
  if (!productId && method === 'get') {
    const { filters, sort, page, pageSize } = parseListQuery(url.searchParams);
    const filtered = filterProducts(filters, sort);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return toResponse(config, 200, {
      data: clone(filtered.slice(start, start + pageSize)),
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
  }

  // Admin mutations
  if (productId && method === 'put') {
    const existing = productById(productId);
    if (!existing) return notFound(config, 'Product not found');
    const patch = parseBody(config) as Partial<Product>;
    Object.assign(existing, patch, { updatedAt: new Date() });
    persist();
    return toResponse(config, 200, clone(existing));
  }

  if (productId && method === 'delete') {
    const index = seedProducts.findIndex((product) => product.id === productId);
    if (index === -1) return notFound(config, 'Product not found');
    seedProducts.splice(index, 1);
    persist();
    return toResponse(config, 200, { success: true });
  }

  if (method === 'post') {
    const payload = parseBody(config) as Partial<Product> & { name?: string };
    if (!payload.name)
      return toResponse(config, 400, { success: false, message: 'Name is required' });
    const id = `p${seedProducts.length + 1}`;
    const now = new Date();
    const product: Product = {
      id,
      name: payload.name,
      brand: payload.brand ?? 'Aurum',
      model: payload.model ?? payload.name,
      description: payload.description ?? '',
      price: payload.price ?? 0,
      images: payload.images ?? [],
      thumbnail: payload.thumbnail ?? '',
      category: payload.category ?? 'classic',
      stock: payload.stock ?? 0,
      rating: payload.rating ?? 0,
      reviewCount: payload.reviewCount ?? 0,
      specifications: payload.specifications ?? {
        movement: 'Automatic',
        caseDiameter: '40mm',
        caseMaterial: 'Stainless Steel',
        waterResistance: '50m',
        strapMaterial: 'Leather',
        warranty: '2 years',
      },
      features: payload.features ?? [],
      createdAt: now,
      updatedAt: now,
    };
    seedProducts.push(product);
    persist();
    return toResponse(config, 201, clone(product));
  }

  return notFound(config, 'Unknown product route');
};

const handleOrders = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).slice(1);
  const method = (config.method ?? 'get').toLowerCase();

  // POST /orders
  if (method === 'post') {
    const payload = parseBody(config) as Partial<Order>;
    if (!payload.items || payload.items.length === 0) {
      return toResponse(config, 400, { success: false, message: 'Order has no items' });
    }
    const now = new Date();
    const id = `o${seedOrders.length + 1}`;
    const methodType = payload.paymentMethod ?? 'card';

    // Redeem the promo code when the checkout applied one (counts toward its
    // usage cap). Invalid codes are ignored here — the checkout validated it
    // first and the discount is carried on the order for the record.
    let promoCode: string | undefined;
    let discount = payload.discount ?? 0;
    if (payload.promoCode) {
      const validated = validatePromo(promoById(payload.promoCode), payload.subtotal ?? 0);
      if (validated.ok) {
        validated.promo.usedCount += 1;
        promoCode = validated.promo.code;
        discount = discountForPromo(validated.promo, payload.subtotal ?? 0);
      }
    }

    const order: Order = {
      id,
      userId: payload.userId ?? '',
      items: payload.items,
      subtotal: payload.subtotal ?? 0,
      shipping: payload.shipping ?? 0,
      tax: payload.tax ?? 0,
      discount,
      promoCode,
      total: payload.total ?? 0,
      shippingAddress: payload.shippingAddress ?? {
        fullName: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      orderStatus: 'pending',
      paymentStatus: methodType === 'cod' ? 'pending' : 'paid',
      paymentMethod: methodType,
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };
    seedOrders.unshift(order);
    // Keep stock roughly in sync for the demo
    for (const item of order.items) {
      const product = productById(item.productId);
      if (product) product.stock = Math.max(0, product.stock - item.quantity);
    }
    appendEvent(
      order,
      order.shippingAddress.fullName || 'Customer',
      'Order placed',
      methodType === 'cod' ? 'Cash on delivery' : 'Payment received'
    );
    persist();
    return toResponse(config, 201, clone(order));
  }

  const orderId = segments[0];

  // PATCH /orders/:id/status
  if (segments[1] === 'status' && method === 'patch') {
    const order = orderById(orderId);
    if (!order) return notFound(config, 'Order not found');
    const body = parseBody(config) as { status?: Order['orderStatus']; trackingNumber?: string };
    const previous = order.orderStatus;
    if (body.status && !canTransition(previous, body.status)) {
      return toResponse(config, 400, {
        success: false,
        message: `Cannot change order status from ${previous} to ${body.status}.`,
      });
    }
    const hadTracking = Boolean(order.trackingNumber);
    if (body.status) order.orderStatus = body.status;
    if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
    order.updatedAt = new Date();
    appendEvent(
      order,
      'Store admin',
      previous === body.status ? 'Order updated' : `Status changed to ${body.status ?? previous}`,
      body.trackingNumber && !hadTracking ? `Tracking ${body.trackingNumber} added` : undefined
    );
    persist();
    return toResponse(config, 200, clone(order));
  }

  // PATCH /orders/:id/refund  (admin — only paid, non-cancelled orders)
  if (segments[1] === 'refund' && method === 'patch') {
    const order = orderById(orderId);
    if (!order) return notFound(config, 'Order not found');
    if (order.paymentStatus !== 'paid' || order.orderStatus === 'cancelled') {
      return toResponse(config, 400, {
        success: false,
        message: 'Only paid, non-cancelled orders can be refunded.',
      });
    }
    order.paymentStatus = 'refunded';
    order.updatedAt = new Date();
    appendEvent(order, 'Store admin', 'Refund issued', 'Payment refunded to original method');
    persist();
    return toResponse(config, 200, clone(order));
  }

  // PATCH /orders/:id/cancel
  if (segments[1] === 'cancel' && method === 'patch') {
    const order = orderById(orderId);
    if (!order) return notFound(config, 'Order not found');
    const wasPaid = order.paymentStatus === 'paid';
    order.orderStatus = 'cancelled';
    order.paymentStatus = wasPaid ? 'refunded' : 'pending';
    order.updatedAt = new Date();
    appendEvent(
      order,
      order.shippingAddress.fullName || 'Customer',
      'Order cancelled',
      wasPaid ? 'Payment refunded' : 'No payment was captured'
    );
    persist();
    return toResponse(config, 200, clone(order));
  }

  // GET /orders/user/:id
  if (segments[0] === 'user' && segments[1] && method === 'get') {
    const orders = seedOrders.filter((order) => order.userId === segments[1]);
    return toResponse(config, 200, clone(orders));
  }

  // GET /orders/:id
  if (orderId && method === 'get') {
    const order = orderById(orderId);
    if (!order) return notFound(config, 'Order not found');
    return toResponse(config, 200, clone(order));
  }

  // DELETE /orders/:id
  if (orderId && method === 'delete') {
    const index = seedOrders.findIndex((order) => order.id === orderId);
    if (index === -1) return notFound(config, 'Order not found');
    seedOrders.splice(index, 1);
    persist();
    return toResponse(config, 200, { success: true });
  }

  // GET /orders?page=&pageSize=  (admin list — paginated like /products)
  if (!orderId && method === 'get') {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize')) || 20);
    const total = seedOrders.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return toResponse(config, 200, {
      data: clone(seedOrders.slice(start, start + pageSize)),
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
  }

  return notFound(config, 'Unknown order route');
};

const handleUsers = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).slice(1);
  const method = (config.method ?? 'get').toLowerCase();

  // GET /admin/:email  (used to resolve admin role)
  if (segments[0] === 'admin' && segments[1] && method === 'get') {
    const role = isAdminEmail(decodeURIComponent(segments[1])) ? 'admin' : 'user';
    return toResponse(config, 200, [{ role }]);
  }

  const userId = segments[0];

  // PATCH /users/:id (admin role toggle / profile updates)
  if (userId && method === 'patch') {
    const user = seedUsers.find((item) => item.id === userId);
    if (!user) return notFound(config, 'User not found');
    const patch = parseBody(config) as Partial<User>;
    const previousRole = user.role;
    if (patch.role && patch.role !== user.role) {
      appendEvent(
        user,
        'Store admin',
        patch.role === 'admin' ? 'Admin access granted' : 'Admin access revoked',
        `Role changed: ${previousRole} → ${patch.role}`
      );
      user.role = patch.role;
    }
    if (patch.displayName && patch.displayName !== user.displayName) {
      appendEvent(user, 'Store admin', 'Profile updated', `Name changed to ${patch.displayName}`);
      user.displayName = patch.displayName;
    }
    user.updatedAt = new Date();
    persist();
    return toResponse(config, 200, clone(user));
  }

  // GET /users
  if (method === 'get') {
    return toResponse(config, 200, clone(seedUsers));
  }

  // POST /users & PUT /users  (auth store sync)
  if (method === 'post' || method === 'put') {
    const payload = parseBody(config) as Partial<User> & { email?: string };
    const existing = seedUsers.find((user) => user.email === payload.email);
    if (existing) {
      Object.assign(existing, payload, { updatedAt: new Date() });
      persist();
      return toResponse(config, 200, { success: true });
    }
    seedUsers.push({
      id: payload.id ?? `user-${seedUsers.length + 1}`,
      email: payload.email ?? '',
      displayName: payload.displayName ?? '',
      role: 'user',
      emailVerified: payload.emailVerified ?? true,
      mfaEnabled: payload.mfaEnabled ?? false,
      passkeys: payload.passkeys ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    persist();
    return toResponse(config, 201, { success: true });
  }

  return notFound(config, 'Unknown user route');
};

const handleReviews = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).slice(1);
  const method = (config.method ?? 'get').toLowerCase();

  // GET /reviews?productId=&page=&pageSize=  (product page, newest first)
  if (method === 'get' && segments.length === 0) {
    const productId = url.searchParams.get('productId');
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize')) || 10);
    const scoped = productId
      ? seedReviews.filter((review) => review.productId === productId)
      : seedReviews;
    const sorted = [...scoped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return toResponse(config, 200, {
      data: clone(sorted.slice(start, start + pageSize)),
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
  }

  const reviewId = segments[0];

  // POST /reviews/:id/helpful — upvote a review (demo: repeatable)
  if (reviewId && segments[1] === 'helpful' && method === 'post') {
    const review = seedReviews.find((item) => item.id === reviewId);
    if (!review) return notFound(config, 'Review not found');
    review.helpful += 1;
    persist();
    return toResponse(config, 200, { helpful: review.helpful });
  }

  // DELETE /reviews/:id  (admin moderation)
  if (reviewId && method === 'delete') {
    const index = seedReviews.findIndex((review) => review.id === reviewId);
    if (index === -1) return notFound(config, 'Review not found');
    const [removed] = seedReviews.splice(index, 1);
    recomputeProductRating(removed.productId);
    persist();
    return toResponse(config, 200, { success: true });
  }

  // POST /reviews — write a review
  if (method === 'post') {
    const payload = parseBody(config) as Partial<Review> & {
      productId?: string;
      rating?: number;
      title?: string;
      comment?: string;
      userId?: string;
      userName?: string;
    };
    const product = payload.productId ? productById(payload.productId) : undefined;
    if (!product) return toResponse(config, 400, { success: false, message: 'Product not found' });
    const rating = Number(payload.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return toResponse(config, 400, {
        success: false,
        message: 'Rating must be a whole number between 1 and 5.',
      });
    }
    if (!payload.title?.trim() || !payload.comment?.trim()) {
      return toResponse(config, 400, {
        success: false,
        message: 'Please add a title and a comment to your review.',
      });
    }

    const reviewerName = payload.userName?.trim() || 'Verified buyer';
    // A review counts as verified when the reviewer has an order containing
    // this product (the trust signal luxury buyers look for).
    const verified = seedOrders.some(
      (order) =>
        order.userId === payload.userId && order.items.some((item) => item.productId === product.id)
    );
    const review: Review = {
      id: `r${seedReviews.length + 1}`,
      productId: product.id,
      userId: payload.userId ?? '',
      userName: reviewerName,
      rating,
      title: payload.title.trim(),
      comment: payload.comment.trim(),
      verified,
      helpful: 0,
      createdAt: new Date(),
    };
    seedReviews.push(review);
    recomputeProductRating(product.id);
    persist();
    return toResponse(config, 201, { review, product: productById(product.id) });
  }

  return notFound(config, 'Unknown review route');
};

const handlePromos = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).slice(1);
  const method = (config.method ?? 'get').toLowerCase();

  // GET /promos/:code — validate a code against the current cart subtotal
  if (segments[0] && method === 'get') {
    const subtotal = Math.max(0, Number(url.searchParams.get('subtotal')) || 0);
    const promo = promoById(decodeURIComponent(segments[0]));
    const validated = validatePromo(promo, subtotal);
    if (!validated.ok) {
      return toResponse(config, 400, { success: false, message: validated.error });
    }
    return toResponse(config, 200, clone(validated.promo));
  }

  return notFound(config, 'Unknown promo route');
};

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export const mockApiAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await wait(LATENCY_MS);

  const url = new URL(String(config.url ?? '/'), 'http://mock.local');
  const [resource] = url.pathname.split('/').filter(Boolean);

  try {
    switch (resource) {
      case 'products':
        return await handleProducts(config);
      case 'orders':
        return await handleOrders(config);
      case 'users':
      case 'admin':
        return await handleUsers(config);
      case 'reviews':
        return await handleReviews(config);
      case 'promos':
        return await handlePromos(config);
      default:
        return notFound(config, `Unknown route: ${resource ?? '(empty)'}`);
    }
  } catch (error) {
    // Real client errors already carry their status — never mask them as 500s.
    if (error instanceof AxiosError) throw error;
    return toResponse(config, 500, { success: false, message: 'Mock API error' });
  }
};
