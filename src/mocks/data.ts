import type {
  AuditEvent,
  Order,
  Product,
  ProductFilters,
  PromoCode,
  Review,
  SortOption,
  User,
} from '@/types';
import { demoUserId } from '@/config';
import {
  loadMockDb,
  saveMockDb,
  clearMockDb,
  registerMockDbMigration,
  migrateSnapshot,
  parseMockDbPayload,
  MOCK_DB_SCHEMA_VERSION,
} from './storage';

// ---------------------------------------------------------------------------
// Product imagery (Unsplash CDN — verified live; hotlinked, no repo bloat)
// ---------------------------------------------------------------------------

const IMAGE_POOL: Record<Product['category'], string[]> = {
  luxury: [
    '1524592094714-0f0654e20314',
    '1622434641406-a158123450f9',
    '1533139502658-0198f920d8e8',
    '1523275335684-37898b6baf30',
  ],
  sport: [
    '1547996160-81dfa63595aa',
    '1522312346375-d1a52e2b99b3',
    '1594534475808-b18fc33b045e',
    '1523170335258-f5ed11844a49',
  ],
  casual: ['1495856458515-0637185db551', '1523275335684-37898b6baf30', '1544117519-31a4b719223d'],
  smart: ['1587836374828-4dbafa94cf0e', '1579586337278-3befd40fd17a', '1623998021446-45cd9b269056'],
  classic: [
    '1523170335258-f5ed11844a49',
    '1508057198894-247b23fe5ade',
    '1526045431048-f857369baa09',
    '1614164185128-e4ec99c436d7',
    '1612817159949-195b6eb9e31a',
  ],
};

const unsplash = (id: string, width: number): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

const productImages = (category: Product['category'], index: number) => {
  const pool = IMAGE_POOL[category];
  const thumbnail = unsplash(pool[index % pool.length], 800);
  return {
    thumbnail,
    images: [
      thumbnail,
      unsplash(pool[(index + 1) % pool.length], 1200),
      unsplash(pool[(index + 2) % pool.length], 1200),
    ],
  };
};

// Register migrations BEFORE loading so persisted snapshots are upgraded.
registerMockDbMigration(1, (db) => ({
  products: db.products.map((product, index) => {
    if (product.thumbnail || (product.images && product.images.length > 0)) return product;
    const category: Product['category'] = product.category ?? 'classic';
    const { thumbnail, images } = productImages(category, index);
    return { ...product, thumbnail, images, category };
  }),
  orders: db.orders,
  users: db.users.map((user) => ({
    ...user,
    mfaEnabled: user.mfaEnabled ?? false,
    passkeys: user.passkeys ?? [],
  })),
}));

// Hydrate from the persisted snapshot when one exists (mock QA survives
// reloads); otherwise build a fresh seed. All three collections must stay
// in this order — seedOrders resolves product references at build time.
const persisted = loadMockDb();

// ---------------------------------------------------------------------------
// Seeded catalog
// ---------------------------------------------------------------------------

const BRANDS = ['Aurum', 'Chronos', 'Meridian', 'Orion', 'Vela', 'Tempus'];
const MODELS: Record<string, string[]> = {
  luxury: ['Heritage Moonphase', 'Grand Date 41', 'Skeleton Tourbillon', 'Perpetual 39'],
  sport: ['Diver Pro 300', 'Chronograph 42', 'GMT Master', 'Racing 41'],
  casual: ['Automatic 38', 'Field 40', 'Everyday 37', 'Weekender 39'],
  smart: ['Smart Tourer 46', 'Connected Sport', 'Hybrid Classic', 'Active Pulse'],
  classic: ['Dress 36', 'Classic Quartz', 'Officer 40', 'Petite Seconde'],
};

const MOVEMENTS: Record<string, string> = {
  luxury: 'In-house Automatic',
  sport: 'Automatic',
  casual: 'Automatic',
  smart: 'Smart OS',
  classic: 'Quartz',
};

const FEATURE_LIBRARY: Record<string, string[]> = {
  luxury: ['Sapphire crystal', '18k gold accents', 'Exhibition caseback', 'Hand-finished dial'],
  sport: ['Sapphire crystal', '200m+ water resistance', 'Ceramic bezel', 'Helium escape valve'],
  casual: ['Anti-reflective crystal', 'Quick-release strap', 'Slim profile', 'Luminous indices'],
  smart: ['AMOLED display', 'GPS & heart-rate', '5 ATM water resistance', '7-day battery'],
  classic: ['Scratch-resistant crystal', 'Elegant slim case', 'Leather strap', 'Date window'],
};

const categories: Product['category'][] = ['luxury', 'sport', 'casual', 'smart', 'classic'];

const buildProduct = (index: number): Product => {
  const category = categories[index % categories.length];
  const models = MODELS[category];
  const model = models[index % models.length];
  const brand = BRANDS[index % BRANDS.length];
  const { thumbnail, images } = productImages(category, index);

  const basePrice =
    category === 'luxury'
      ? 3800 + (index % 5) * 3400
      : category === 'sport'
        ? 1800 + (index % 4) * 900
        : 800 + (index % 6) * 260;

  const isDiscounted = index % 4 === 1;
  const originalPrice = isDiscounted ? basePrice + Math.round(basePrice * 0.2) : undefined;
  const discount = isDiscounted ? 20 : undefined;

  const stock = index % 5 === 0 ? 0 : 3 + (index % 8);
  const createdAt = new Date(Date.UTC(2025, (index * 3) % 12, ((index * 7) % 27) + 1));

  return {
    id: `p${index + 1}`,
    name: `${brand} ${model}`,
    brand,
    model,
    description: `A refined ${category} timepiece from ${brand}. Precision-engineered for those who value craftsmanship, presence, and longevity — equally at home in the boardroom and beyond.`,
    price: basePrice,
    originalPrice,
    discount,
    images,
    thumbnail,
    category,
    stock,
    rating: Number((3.9 + ((index * 37) % 10) / 10).toFixed(1)),
    reviewCount: ((index * 7) % 23) + 2,
    specifications: {
      movement: MOVEMENTS[category],
      caseDiameter: `${36 + ((index * 2) % 10)}mm`,
      caseMaterial: category === 'luxury' ? '18k Gold & Steel' : 'Stainless Steel',
      waterResistance:
        category === 'sport' ? `${200 + (index % 4) * 100}m` : category === 'smart' ? '50m' : '30m',
      strapMaterial: index % 3 === 0 ? 'Calf Leather' : 'Stainless Steel',
      warranty: 'International 2-year warranty',
    },
    features: FEATURE_LIBRARY[category],
    isNew: index < 4,
    isFeatured: index % 3 === 0,
    createdAt,
    updatedAt: createdAt,
  };
};

const makeSeedProducts = (): Product[] =>
  Array.from({ length: 16 }, (_, index) => buildProduct(index));

export const seedProducts: Product[] = persisted?.products ?? makeSeedProducts();

// ---------------------------------------------------------------------------
// Demo user directory
// ---------------------------------------------------------------------------

const makeSeedUsers = (): User[] => [
  {
    id: demoUserId,
    email: 'demo@classicwatch.local',
    displayName: 'Demo Admin',
    role: 'admin',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-01-15T00:00:00Z'),
    updatedAt: new Date('2025-01-15T00:00:00Z'),
  },
  {
    id: 'user-sarah',
    email: 'sarah@example.com',
    displayName: 'Sarah Khan',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-02-02T00:00:00Z'),
    updatedAt: new Date('2025-03-10T00:00:00Z'),
  },
  {
    id: 'user-miguel',
    email: 'miguel@example.com',
    displayName: 'Miguel Alvarez',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-04-20T00:00:00Z'),
    updatedAt: new Date('2025-05-01T00:00:00Z'),
  },
  {
    id: 'user-ayesha',
    email: 'ayesha@example.com',
    displayName: 'Ayesha Rahman',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-06-11T00:00:00Z'),
    updatedAt: new Date('2025-07-19T00:00:00Z'),
  },
  {
    id: 'user-daniel',
    email: 'daniel@example.com',
    displayName: 'Daniel Fischer',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-09-03T00:00:00Z'),
    updatedAt: new Date('2025-10-25T00:00:00Z'),
  },
  {
    id: 'admin-priya',
    email: 'admin@classicwatch.local',
    displayName: 'Priya Sharma',
    role: 'admin',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: new Date('2025-01-05T00:00:00Z'),
    updatedAt: new Date('2025-12-01T00:00:00Z'),
  },
];

export const seedUsers: User[] = persisted?.users ?? makeSeedUsers();

// ---------------------------------------------------------------------------
// Seeded orders for the demo user (and a couple for other users)
// ---------------------------------------------------------------------------

const orderItem = (productId: string, quantity: number) => {
  const product = seedProducts.find((item) => item.id === productId) as Product;
  return { productId, quantity, product };
};

const dayOffset = (base: Date, offsetDays: number): Date =>
  new Date(base.getTime() + offsetDays * 86_400_000);

// Deterministic audit trail for seeded orders so the history UI has data to
// show before any live mutation happens.
const buildSeedHistory = (
  createdAt: Date,
  status: Order['orderStatus'],
  customerName: string
): AuditEvent[] => {
  const events: AuditEvent[] = [{ at: createdAt, actor: customerName, action: 'Order placed' }];
  if (status === 'processing' || status === 'shipped' || status === 'delivered') {
    events.push({ at: dayOffset(createdAt, 1), actor: 'Store', action: 'Order processing' });
  }
  if (status === 'shipped' || status === 'delivered') {
    events.push({ at: dayOffset(createdAt, 2), actor: 'Store', action: 'Order shipped' });
  }
  if (status === 'delivered') {
    events.push({ at: dayOffset(createdAt, 4), actor: 'Store', action: 'Order delivered' });
  }
  return events;
};

const buildOrder = (
  id: string,
  userId: string,
  productIds: string[],
  quantities: number[],
  status: Order['orderStatus'],
  payment: Order['paymentStatus'],
  createdAt: string,
  method: Order['paymentMethod'] = 'card'
): Order => {
  const items = productIds.map((productId, index) => orderItem(productId, quantities[index]));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 15;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const date = new Date(createdAt);
  const customerName = userId === demoUserId ? 'Demo Admin' : 'Sarah Khan';

  return {
    id,
    userId,
    items,
    subtotal,
    shipping,
    tax,
    total: Math.round((subtotal + shipping + tax) * 100) / 100,
    shippingAddress: {
      fullName: customerName,
      phone: '+1 555 010 2030',
      addressLine1: '12 Lakeview Avenue',
      city: 'Geneva',
      state: 'GE',
      postalCode: '1204',
      country: 'Switzerland',
    },
    orderStatus: status,
    paymentStatus: payment,
    paymentMethod: method,
    trackingNumber:
      status === 'shipped' || status === 'delivered'
        ? `CWP${date.getFullYear()}${id.slice(1).padStart(4, '0')}`
        : undefined,
    history: buildSeedHistory(date, status, customerName),
    createdAt: date,
    updatedAt: date,
  };
};

const makeSeedOrders = (): Order[] => [
  buildOrder('o1', demoUserId, ['p4', 'p9'], [1, 1], 'delivered', 'paid', '2025-06-12T09:30:00Z'),
  buildOrder('o2', demoUserId, ['p12'], [1], 'shipped', 'paid', '2025-08-02T14:05:00Z'),
  buildOrder('o3', demoUserId, ['p2'], [2], 'processing', 'paid', '2026-01-20T11:12:00Z'),
  buildOrder('o4', demoUserId, ['p14'], [1], 'pending', 'pending', '2026-02-10T16:45:00Z', 'cod'),
  buildOrder('o5', 'user-sarah', ['p6'], [1], 'delivered', 'paid', '2025-07-22T10:00:00Z'),
  buildOrder(
    'o6',
    'user-miguel',
    ['p8', 'p11'],
    [1, 2],
    'pending',
    'pending',
    '2026-02-12T08:20:00Z',
    'wallet'
  ),
];

export const seedOrders: Order[] = persisted?.orders ?? makeSeedOrders();

// ---------------------------------------------------------------------------
// Seeded reviews (deterministic — one cluster per seeded product) and promo
// codes. Product rating/reviewCount aggregates are derived from the review
// rows (see reconcile below), so the catalog numbers always match the review
// list a customer actually sees on the detail page.
// ---------------------------------------------------------------------------

const REVIEWER_NAMES = [
  'Sarah Khan',
  'Miguel Alvarez',
  'Ayesha Rahman',
  'Daniel Fischer',
  'Leo Martin',
  'Emma Wilson',
  'Noah Kim',
  'Priya Sharma',
];

const POSITIVE_TITLES = [
  'Flawless craftsmanship',
  'Even better in person',
  'My daily companion',
  'Worth every penny',
  'An heirloom piece',
];

const MID_TITLES = [
  'Solid, with small caveats',
  'Great value overall',
  'Very good, not perfect',
  'Beautiful dial',
];

const CRITICAL_TITLES = ['Beautiful but flawed', 'Not what I expected', 'Disappointed'];

const POSITIVE_COMMENTS = [
  'The finishing is superb — the dial catches the light beautifully and the movement keeps flawless time. Packaging felt genuinely premium.',
  'I compared it against pieces twice the price and this holds its own. The case profile is elegant and it wears lighter than it looks.',
  'Wore it daily for a month now. Keeps excellent time, the bracelet is comfortable, and I have received several compliments.',
  'A true keeper. The details up close are what sold me: crisp dial printing, a satisfying crown action, and a lovely exhibition back.',
];

const MID_COMMENTS = [
  'A very capable watch overall. The strap took a few days to break in, and I wish the lume were stronger, but the dial is gorgeous.',
  'Solid build and accurate movement. Slightly heavier than I expected, but that actually adds to the presence on the wrist.',
  'Good everyday piece. Delivery was fast and well packaged. Would recommend for anyone starting a collection.',
];

const CRITICAL_COMMENTS = [
  'The watch itself is stunning, but mine arrived with a faint mark on the clasp. Customer service responded quickly, though.',
  'The proportions look larger on the wrist than in the photos. If you have a smaller wrist, size down.',
  'I had high hopes, but the water resistance rating feels optimistic for daily use. Otherwise the design is lovely.',
];

const clampRating = (value: number): number => Math.max(1, Math.min(5, Math.round(value)));

/** Builds `count` integer ratings (1–5) whose average tracks `target`. */
const ratingsFor = (count: number, target: number): number[] => {
  const ratings: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i += 1) {
    const wobble = [0, 0, 1, -1, 0, 1, 0][(i * 3 + Math.round(target)) % 7];
    let value = clampRating(target + wobble);
    // Pull back towards the running mean so a later run of bad luck cannot
    // drag the final average far from the product's displayed rating.
    const expected = Math.round((i + 1) * target);
    if (sum + value > expected + 2) value = Math.max(1, value - 1);
    if (sum + value < expected - 2) value = Math.min(5, value + 1);
    ratings.push(value);
    sum += value;
  }
  return ratings;
};

const reviewTitle = (rating: number, seed: number): string => {
  const pool = rating >= 4 ? POSITIVE_TITLES : rating === 3 ? MID_TITLES : CRITICAL_TITLES;
  return pool[seed % pool.length];
};

const reviewComment = (rating: number, seed: number): string => {
  const pool = rating >= 4 ? POSITIVE_COMMENTS : rating === 3 ? MID_COMMENTS : CRITICAL_COMMENTS;
  return pool[seed % pool.length];
};

const productIndex = (id: string): number | null => {
  const match = /^p(\d{1,2})$/.exec(id);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < 64 ? index : null;
};

const makeSeedReviews = (): Review[] => {
  const reviews: Review[] = [];
  seedProducts.forEach((product, position) => {
    const index = productIndex(product.id) ?? position;
    const count = 2 + ((index * 5) % 7); // 2–8 reviews per product
    const target =
      product.rating > 0 ? product.rating : Number((3.9 + ((index * 37) % 10) / 10).toFixed(1));
    const ratings = ratingsFor(count, target);

    ratings.forEach((rating, row) => {
      const seed = index * 7 + row * 3;
      reviews.push({
        id: `r${index + 1}-${row + 1}`,
        productId: product.id,
        userId: `reviewer-${(index + row) % REVIEWER_NAMES.length}`,
        userName: REVIEWER_NAMES[(index + row) % REVIEWER_NAMES.length],
        rating,
        title: reviewTitle(rating, seed),
        comment: reviewComment(rating, seed),
        verified: (index + row) % 5 !== 0,
        helpful: (index * 3 + row * 7) % 11,
        createdAt: dayOffset(new Date(), -(12 + ((index * 3 + row * 5) % 90))),
      });
    });
  });
  return reviews;
};

const makeSeedPromoCodes = (): PromoCode[] => [
  {
    id: 'promo-1',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    active: true,
    usedCount: 12,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'promo-2',
    code: 'LUXE200',
    type: 'fixed',
    value: 200,
    minOrderValue: 1500,
    active: true,
    usedCount: 4,
    createdAt: new Date('2026-02-01T00:00:00Z'),
  },
  {
    id: 'promo-3',
    code: 'SUMMER20',
    type: 'percent',
    value: 20,
    minOrderValue: 800,
    maxDiscount: 150,
    usageLimit: 50,
    usedCount: 3,
    active: true,
    expiresAt: new Date(Date.UTC(2026, 11, 31)),
    createdAt: new Date('2026-06-01T00:00:00Z'),
  },
  {
    id: 'promo-4',
    code: 'WINTER25',
    type: 'percent',
    value: 25,
    active: false,
    usedCount: 99,
    createdAt: new Date('2025-11-01T00:00:00Z'),
  },
];

export const seedReviews: Review[] = persisted?.reviews ?? makeSeedReviews();
export const seedPromoCodes: PromoCode[] = persisted?.promoCodes ?? makeSeedPromoCodes();

// Snapshots written before the reviews collection existed carry product
// rating/reviewCount fields from the older formula seeds. When we just
// hydrated fresh review rows, reconcile the two so the aggregates shown on
// cards and filters equal the actual review list.
if (!persisted?.reviews) {
  seedReviews.forEach((review) => {
    const product = seedProducts.find((item) => item.id === review.productId);
    if (!product) return;
    const rows = seedReviews.filter((item) => item.productId === product.id);
    if (rows.length === 0) return;
    const average = rows.reduce((sum, item) => sum + item.rating, 0) / rows.length;
    product.rating = Math.round(average * 10) / 10;
    product.reviewCount = rows.length;
  });
}

/** Recomputes a product's rating/reviewCount from its live review rows after a
 * review mutation (used by the adapter so the catalog stays consistent). */
export const recomputeProductRating = (productId: string): Product | undefined => {
  const product = seedProducts.find((item) => item.id === productId);
  if (!product) return undefined;
  const rows = seedReviews.filter((item) => item.productId === productId);
  if (rows.length === 0) {
    product.rating = 0;
    product.reviewCount = 0;
    return product;
  }
  const average = rows.reduce((sum, item) => sum + item.rating, 0) / rows.length;
  product.rating = Math.round(average * 10) / 10;
  product.reviewCount = rows.length;
  return product;
};

/** Append an immutable audit event to any entity carrying a history (shared by
 * the adapter and the demo auth helpers so all mutations log consistently). */
export const appendEvent = <T extends { history?: AuditEvent[] }>(
  entity: T,
  actor: string,
  action: string,
  detail?: string
): void => {
  const history: AuditEvent[] = entity.history ?? [];
  history.push({ at: new Date(), actor, action, detail });
  entity.history = history;
};

// Persist the current in-memory state so mutations survive reloads.
export const persistMockDb = (): void => {
  saveMockDb({
    products: seedProducts,
    orders: seedOrders,
    users: seedUsers,
    reviews: seedReviews,
    promoCodes: seedPromoCodes,
  });
};

// Wipe mutations and rebuild a pristine seed (used by the demo reset control).
export const resetMockDb = (): void => {
  clearMockDb();
  seedProducts.splice(0, seedProducts.length, ...makeSeedProducts());
  seedUsers.splice(0, seedUsers.length, ...makeSeedUsers());
  seedOrders.splice(0, seedOrders.length, ...makeSeedOrders());
  seedReviews.splice(0, seedReviews.length, ...makeSeedReviews());
  seedPromoCodes.splice(0, seedPromoCodes.length, ...makeSeedPromoCodes());
  // Regenerate the catalog aggregates from the freshly seeded review rows.
  seedProducts.forEach((product) => {
    recomputeProductRating(product.id);
  });
  persistMockDb();
};

// ---------------------------------------------------------------------------
// Backup / restore (admin demo-data controls)
// ---------------------------------------------------------------------------

/** Serializes the live in-memory DB as a versioned, human-readable backup. */
export const exportMockDbBackup = (): string =>
  JSON.stringify(
    {
      app: 'classic-watch-pro',
      exportedAt: new Date().toISOString(),
      schemaVersion: MOCK_DB_SCHEMA_VERSION,
      snapshot: {
        products: seedProducts,
        orders: seedOrders,
        users: seedUsers,
        reviews: seedReviews,
        promoCodes: seedPromoCodes,
      },
    },
    null,
    2
  );

/**
 * Validates a backup payload, upgrades it through the migration chain when it
 * predates the current schema, and swaps it into the live DB. The returned
 * error messages are user-safe (shown in the admin UI).
 */
export const importMockDbBackup = (contents: string): { ok: boolean; error?: string } => {
  let raw: string;
  try {
    raw = contents.trim();
    if (!raw) return { ok: false, error: 'The backup file is empty.' };
  } catch {
    return { ok: false, error: 'The backup file could not be read.' };
  }

  // Distinguish "newer than this app" from "not a backup at all" for clear UX.
  let futureVersion = false;
  try {
    const probe = JSON.parse(raw) as { schemaVersion?: unknown };
    futureVersion =
      typeof probe?.schemaVersion === 'number' && probe.schemaVersion > MOCK_DB_SCHEMA_VERSION;
  } catch {
    // Unparseable JSON is not a future-version backup; `futureVersion` stays false.
  }

  const payload = parseMockDbPayload(raw);
  if (!payload) {
    return {
      ok: false,
      error: futureVersion
        ? 'This backup was created by a newer version of the app — upgrade to restore it.'
        : 'This file is not a valid mock-database backup (expected products, orders and users arrays).',
    };
  }
  const migrated = migrateSnapshot(payload.version, payload.db);
  if (!migrated) {
    return { ok: false, error: 'This backup is from an unsupported schema version.' };
  }

  seedProducts.splice(0, seedProducts.length, ...migrated.snapshot.products);
  seedOrders.splice(0, seedOrders.length, ...migrated.snapshot.orders);
  seedUsers.splice(0, seedUsers.length, ...migrated.snapshot.users);
  seedReviews.splice(0, seedReviews.length, ...(migrated.snapshot.reviews ?? makeSeedReviews()));
  seedPromoCodes.splice(
    0,
    seedPromoCodes.length,
    ...(migrated.snapshot.promoCodes ?? makeSeedPromoCodes())
  );
  // Keep aggregates coherent for older backups that predate the review rows.
  seedProducts.forEach((product) => {
    recomputeProductRating(product.id);
  });
  persistMockDb();
  return { ok: true };
};

// ---------------------------------------------------------------------------
// Filter / sort helpers shared with the mock adapter
// ---------------------------------------------------------------------------

export const filterProducts = (
  filters: ProductFilters | undefined,
  sort: SortOption,
  products: Product[] = seedProducts
): Product[] => {
  let result = [...products];

  if (filters?.category && filters.category.length > 0) {
    result = result.filter((product) => filters.category?.includes(product.category));
  }
  if (filters?.brand && filters.brand.length > 0) {
    result = result.filter((product) => filters.brand?.includes(product.brand));
  }
  if (filters?.priceRange) {
    const [min, max] = filters.priceRange;
    result = result.filter((product) => product.price >= min && product.price <= max);
  }
  if (filters?.rating !== undefined) {
    result = result.filter((product) => product.rating >= (filters.rating as number));
  }
  if (filters?.inStock) {
    result = result.filter((product) => product.stock > 0);
  }
  if (filters?.isNew) {
    result = result.filter((product) => product.isNew);
  }
  if (filters?.isFeatured) {
    result = result.filter((product) => product.isFeatured);
  }

  switch (sort) {
    case 'price-low':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'popular':
      result.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'name-az':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-za':
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return result;
};

export const searchProducts = (query: string): Product[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return seedProducts.filter((product) =>
    [product.name, product.brand, product.model, product.category, product.description]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
};
