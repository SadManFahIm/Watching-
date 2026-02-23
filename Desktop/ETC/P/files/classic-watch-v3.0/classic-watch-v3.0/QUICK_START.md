# 🚀 Quick Start Guide - Classic Watch Pro

## তাড়াতাড়ি শুরু করার জন্য (For Quick Setup)

### 1️⃣ প্রথমে Dependencies Install করো
```bash
cd classic-watch-upgraded
npm install
```

### 2️⃣ Environment Variables Setup করো
```bash
# .env.example কে copy করো
cp .env.example .env.local

# এরপর .env.local file টা edit করো এবং তোমার Firebase credentials add করো
```

### 3️⃣ Development Server Start করো
```bash
npm run dev
```

Server চালু হবে: http://localhost:3000

---

## 📁 Project Structure বুঝতে

```
src/
├── api/              → API calls & React Query hooks
├── components/       → Reusable UI components
├── features/         → Feature-wise organized code
│   ├── auth/        → Login, Register, Profile
│   ├── products/    → Product listing, details
│   ├── cart/        → Shopping cart
│   ├── orders/      → Order management
│   └── admin/       → Admin dashboard
├── store/           → Global state (Zustand)
├── lib/             → Firebase, Axios setup
├── types/           → TypeScript types
├── utils/           → Helper functions
└── config/          → App configuration
```

---

## 🎯 Key Files তোমার Edit করতে হবে

### 1. Firebase Setup
**File:** `src/config/index.ts`
```typescript
// তোমার Firebase credentials এখানে add করো
```

### 2. API Base URL
**File:** `.env.local`
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

### 3. Theme Customization
**File:** `src/styles/theme.ts`
```typescript
// Colors, typography customize করো
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev           # Start dev server (with HMR)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier
npm run type-check   # TypeScript validation

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

---

## 🔥 নতুন Features যা তুমি পাবে

### 1. Dark Mode
```tsx
import { useThemeStore } from '@/store/theme.store';

const { isDark, toggleMode } = useThemeStore();
```

### 2. Shopping Cart
```tsx
import { useCartStore } from '@/store/cart.store';

const { items, addItem, removeItem } = useCartStore();
```

### 3. Wishlist
```tsx
import { useWishlistStore } from '@/store/wishlist.store';

const { items, addToWishlist } = useWishlistStore();
```

### 4. Authentication
```tsx
import { useAuthStore } from '@/store/auth.store';

const { user, signIn, signOut } = useAuthStore();
```

### 5. Products API
```tsx
import { useProducts, useProduct } from '@/api/products.api';

// Get all products with filters
const { data, isLoading } = useProducts(filters);

// Get single product
const { data: product } = useProduct(productId);
```

---

## 📝 Common Tasks

### নতুন Page যোগ করতে চাও?
1. Create: `src/features/yourFeature/pages/YourPage.tsx`
2. Add route in: `src/App.tsx`

### নতুন Component যোগ করতে চাও?
1. Create: `src/components/common/YourComponent.tsx`
2. Export from: `src/components/index.ts` (optional)

### নতুন API Endpoint যোগ করতে চাও?
1. Create hook: `src/api/yourFeature.api.ts`
2. Use React Query

### নতুন Store যোগ করতে চাও?
1. Create: `src/store/yourFeature.store.ts`
2. Use Zustand pattern

---

## 🎨 UI Components তোমার Use করতে পারবে

### Material-UI (MUI)
```tsx
import { Button, TextField, Card, Box } from '@mui/material';
import { ShoppingCart, Favorite } from '@mui/icons-material';
```

### Animations
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

### Notifications
```tsx
import toast from 'react-hot-toast';

toast.success('Success!');
toast.error('Error!');
```

---

## 🐛 Common Issues & Solutions

### Issue: Port already in use
```bash
# Change port in vite.config.ts
server: {
  port: 3001, // Change to different port
}
```

### Issue: Firebase not initialized
```bash
# Check .env.local has correct credentials
# Make sure to restart dev server after changes
```

### Issue: TypeScript errors
```bash
npm run type-check  # See all type errors
# Fix types or add 'any' temporarily
```

### Issue: Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 🚢 Deploy করতে চাও?

### Vercel (Recommended)
1. Push to GitHub
2. Import on Vercel
3. Add environment variables
4. Deploy!

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

---

## 📚 আরো জানতে চাও?

- **Full Documentation:** `README.md`
- **Upgrade Details:** `UPGRADE_SUMMARY.md`
- **TypeScript Types:** `src/types/index.ts`
- **API Documentation:** Check individual `*.api.ts` files

---

## 🤝 Help দরকার?

1. Check existing code examples
2. Read TypeScript type definitions
3. Check console for errors
4. Use React Query Devtools (bottom-right corner)

---

## 🎯 Next Steps

1. ✅ Setup environment variables
2. ✅ Start dev server
3. ✅ Explore the codebase
4. ✅ Customize theme/colors
5. ✅ Add your features
6. ✅ Test thoroughly
7. ✅ Deploy!

---

**Happy Coding! 🚀**

**Made with ❤️ using React 18 + TypeScript + Vite**
