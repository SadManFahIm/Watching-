# 📁 Complete File Structure - Classic Watch Pro v2.0

## Root Directory
```
classic-watch-upgraded/
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json             # TypeScript configuration
├── 📄 vite.config.ts            # Vite build config
├── 📄 .eslintrc.cjs             # ESLint rules
├── 📄 .prettierrc               # Code formatting rules
├── 📄 .gitignore                # Git ignore patterns
├── 📄 .env.example              # Environment template
├── 📄 README.md                 # Main documentation
├── 📄 UPGRADE_SUMMARY.md        # Detailed upgrade report
├── 📄 QUICK_START.md            # Quick setup guide
├── 📄 index.html                # HTML entry point
│
└── 📁 src/                      # Source code
    ├── 📄 main.tsx              # React entry point
    ├── 📄 App.tsx               # Main App component
    ├── 📄 vite-env.d.ts         # Vite type definitions
    │
    ├── 📁 api/                  # API layer (React Query)
    │   ├── 📄 products.api.ts   # Product queries & mutations
    │   ├── 📄 orders.api.ts     # Order queries & mutations
    │   ├── 📄 reviews.api.ts    # Review queries & mutations
    │   └── 📄 users.api.ts      # User queries & mutations
    │
    ├── 📁 components/           # Reusable components
    │   ├── 📁 common/          # Shared components
    │   │   ├── 📄 ProtectedRoute.tsx
    │   │   ├── 📄 AdminRoute.tsx
    │   │   ├── 📄 LoadingScreen.tsx
    │   │   ├── 📄 ErrorFallback.tsx
    │   │   ├── 📄 SkeletonLoader.tsx
    │   │   └── 📄 EmptyState.tsx
    │   │
    │   ├── 📁 layout/          # Layout components
    │   │   ├── 📄 MainLayout.tsx
    │   │   ├── 📄 DashboardLayout.tsx
    │   │   ├── 📄 Header.tsx
    │   │   ├── 📄 Footer.tsx
    │   │   └── 📄 Sidebar.tsx
    │   │
    │   └── 📁 ui/              # Base UI components
    │       ├── 📄 Button.tsx
    │       ├── 📄 Card.tsx
    │       ├── 📄 Modal.tsx
    │       ├── 📄 Badge.tsx
    │       └── 📄 Tooltip.tsx
    │
    ├── 📁 features/            # Feature modules
    │   │
    │   ├── 📁 auth/           # Authentication
    │   │   ├── 📁 pages/
    │   │   │   ├── 📄 LoginPage.tsx
    │   │   │   ├── 📄 RegisterPage.tsx
    │   │   │   └── 📄 ProfilePage.tsx
    │   │   ├── 📁 components/
    │   │   │   ├── 📄 LoginForm.tsx
    │   │   │   ├── 📄 RegisterForm.tsx
    │   │   │   └── 📄 SocialLogin.tsx
    │   │   └── 📁 hooks/
    │   │       └── 📄 useAuthForm.ts
    │   │
    │   ├── 📁 products/       # Products
    │   │   ├── 📁 pages/
    │   │   │   ├── 📄 ProductsPage.tsx
    │   │   │   ├── 📄 ProductDetailPage.tsx
    │   │   │   └── 📄 WishlistPage.tsx
    │   │   ├── 📁 components/
    │   │   │   ├── 📄 ProductCard.tsx
    │   │   │   ├── 📄 ProductGrid.tsx
    │   │   │   ├── 📄 ProductFilters.tsx
    │   │   │   ├── 📄 ProductSort.tsx
    │   │   │   ├── 📄 ProductDetail.tsx
    │   │   │   └── 📄 ProductGallery.tsx
    │   │   └── 📁 hooks/
    │   │       └── 📄 useProductFilters.ts
    │   │
    │   ├── 📁 cart/           # Shopping Cart
    │   │   ├── 📁 pages/
    │   │   │   ├── 📄 CartPage.tsx
    │   │   │   └── 📄 CheckoutPage.tsx
    │   │   ├── 📁 components/
    │   │   │   ├── 📄 CartItem.tsx
    │   │   │   ├── 📄 CartSummary.tsx
    │   │   │   ├── 📄 CheckoutForm.tsx
    │   │   │   └── 📄 PaymentForm.tsx
    │   │   └── 📁 hooks/
    │   │       └── 📄 useCheckout.ts
    │   │
    │   ├── 📁 orders/         # Orders
    │   │   ├── 📁 pages/
    │   │   │   ├── 📄 MyOrdersPage.tsx
    │   │   │   └── 📄 OrderDetailPage.tsx
    │   │   ├── 📁 components/
    │   │   │   ├── 📄 OrderCard.tsx
    │   │   │   ├── 📄 OrderTimeline.tsx
    │   │   │   └── 📄 OrderStatusBadge.tsx
    │   │   └── 📁 hooks/
    │   │       └── 📄 useOrderTracking.ts
    │   │
    │   ├── 📁 reviews/        # Product Reviews
    │   │   ├── 📁 components/
    │   │   │   ├── 📄 ReviewCard.tsx
    │   │   │   ├── 📄 ReviewForm.tsx
    │   │   │   ├── 📄 ReviewList.tsx
    │   │   │   └── 📄 RatingStars.tsx
    │   │   └── 📁 hooks/
    │   │       └── 📄 useReviewForm.ts
    │   │
    │   ├── 📁 dashboard/      # User Dashboard
    │   │   ├── 📁 pages/
    │   │   │   └── 📄 DashboardPage.tsx
    │   │   └── 📁 components/
    │   │       ├── 📄 DashboardStats.tsx
    │   │       └── 📄 RecentOrders.tsx
    │   │
    │   ├── 📁 admin/          # Admin Panel
    │   │   ├── 📁 pages/
    │   │   │   ├── 📄 AdminDashboardPage.tsx
    │   │   │   ├── 📄 ManageProductsPage.tsx
    │   │   │   ├── 📄 ManageOrdersPage.tsx
    │   │   │   ├── 📄 ManageUsersPage.tsx
    │   │   │   └── 📄 AddProductPage.tsx
    │   │   └── 📁 components/
    │   │       ├── 📄 AdminStats.tsx
    │   │       ├── 📄 ProductTable.tsx
    │   │       ├── 📄 OrderTable.tsx
    │   │       ├── 📄 UserTable.tsx
    │   │       └── 📄 ProductForm.tsx
    │   │
    │   └── 📁 home/           # Home Page
    │       ├── 📁 pages/
    │       │   └── 📄 HomePage.tsx
    │       └── 📁 components/
    │           ├── 📄 Hero.tsx
    │           ├── 📄 FeaturedProducts.tsx
    │           ├── 📄 LatestProducts.tsx
    │           ├── 📄 Categories.tsx
    │           └── 📄 Testimonials.tsx
    │
    ├── 📁 store/              # Global State (Zustand)
    │   ├── 📄 auth.store.ts   # Authentication state
    │   ├── 📄 cart.store.ts   # Shopping cart state
    │   ├── 📄 wishlist.store.ts  # Wishlist state
    │   └── 📄 theme.store.ts  # Theme/Dark mode state
    │
    ├── 📁 hooks/              # Custom React Hooks
    │   ├── 📄 useDebounce.ts
    │   ├── 📄 useLocalStorage.ts
    │   ├── 📄 useMediaQuery.ts
    │   ├── 📄 useOnClickOutside.ts
    │   └── 📄 useIntersectionObserver.ts
    │
    ├── 📁 lib/                # Third-party integrations
    │   ├── 📄 firebase.ts     # Firebase setup
    │   ├── 📄 axios.ts        # Axios instance & interceptors
    │   └── 📄 queryClient.ts  # React Query client
    │
    ├── 📁 types/              # TypeScript Types
    │   ├── 📄 index.ts        # Global types
    │   ├── 📄 api.types.ts    # API response types
    │   └── 📄 form.types.ts   # Form types
    │
    ├── 📁 utils/              # Utility Functions
    │   ├── 📄 helpers.ts      # General helpers
    │   ├── 📄 validators.ts   # Validation functions
    │   ├── 📄 formatters.ts   # Data formatters
    │   └── 📄 constants.ts    # App constants
    │
    ├── 📁 styles/             # Styles
    │   ├── 📄 global.css      # Global CSS
    │   └── 📄 theme.ts        # MUI theme configuration
    │
    ├── 📁 config/             # Configuration
    │   └── 📄 index.ts        # App config
    │
    └── 📁 assets/             # Static Assets
        ├── 📁 images/         # Images
        ├── 📁 icons/          # Icons
        └── 📁 fonts/          # Custom fonts
```

## 📝 File Naming Conventions

### Components
- PascalCase: `ProductCard.tsx`, `UserProfile.tsx`
- Suffix with type: `LoginPage.tsx`, `CartItem.tsx`

### Hooks
- camelCase with 'use' prefix: `useAuth.ts`, `useProducts.ts`

### Utilities
- camelCase: `helpers.ts`, `validators.ts`

### Types
- PascalCase: `User`, `Product`, `Order`
- Suffix interfaces with 'Props': `ButtonProps`, `CardProps`

### Constants
- UPPER_SNAKE_CASE: `API_BASE_URL`, `MAX_FILE_SIZE`

## 🎯 Import Patterns

### With Path Aliases
```typescript
// ✅ Good (using @/ alias)
import { useAuthStore } from '@/store/auth.store';
import { ProductCard } from '@/components/products/ProductCard';
import { formatCurrency } from '@/utils/helpers';

// ❌ Avoid (relative paths)
import { useAuthStore } from '../../../store/auth.store';
```

### Barrel Exports
```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';

// Usage
import { Button, Card, Modal } from '@/components/ui';
```

## 📦 Key Dependencies by Directory

### `/api` - React Query
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
```

### `/store` - Zustand
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
```

### `/components` - MUI + Framer Motion
```typescript
import { Box, Button } from '@mui/material';
import { motion } from 'framer-motion';
```

### `/lib` - Firebase + Axios
```typescript
import { getAuth } from 'firebase/auth';
import axios from 'axios';
```

## 🔍 Finding Code

### Need to add authentication?
→ `src/features/auth/` or `src/store/auth.store.ts`

### Need to modify product display?
→ `src/features/products/components/`

### Need to change API calls?
→ `src/api/`

### Need to update global state?
→ `src/store/`

### Need to add utilities?
→ `src/utils/`

### Need to update types?
→ `src/types/`

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete project documentation |
| `UPGRADE_SUMMARY.md` | Detailed upgrade report |
| `QUICK_START.md` | Quick setup guide |
| `FILE_STRUCTURE.md` | This file - structure guide |

---

**🎯 Key Principle:** Everything has its place, and there's a place for everything!
