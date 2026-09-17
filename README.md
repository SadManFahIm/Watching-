# ⌚ Classic Watch Pro

> A **production-grade, security-first luxury watch e-commerce platform** — React 18 · TypeScript · Vite · MUI 6 · Zustand · TanStack Query — that runs fully in **demo mode with zero configuration** and can switch to **real Firebase auth + Firestore** by adding credentials.

![version](https://img.shields.io/badge/version-3.1.0-212121) ![license](https://img.shields.io/badge/license-MIT-blue) ![tests](https://img.shields.io/badge/tests-164%20passing-success) ![a11y](https://img.shields.io/badge/a11y-WCAG%20AA%20zero%20violations-4CAF50) ![PWA](https://img.shields.io/badge/PWA-ready-5A31F4) ![CI](https://img.shields.io/badge/CI-lint%20%CD%B7%20tsc%20%CD%B7%20tests%20%CD%B7%20build%20%CD%B7%20audit%20%CD%B7%20E2E%20%CD%B7%20Lighthouse-181717) ![Vite](https://img.shields.io/badge/Vite-7-646CFF)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Product Capabilities](#product-capabilities)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Available Scripts](#available-scripts)
- [Database Setup / Migration](#database-setup--migration)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Security](#security)
- [CI/CD](#cicd)
- [Build & Production](#build--production)
- [Deployment](#deployment)
- [Git Workflow](#git-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Project Status](#project-status)

---

## Project Overview

Classic Watch Pro is a full-featured luxury watch e-commerce application demonstrating **modern React engineering, defense-in-depth security, and outstanding performance & accessibility**. It ships a complete storefront, secure authentication (including TOTP 2FA and WebAuthn passkeys), a full admin/analytics console, and an architecture that runs on an **in-memory demo database** out of the box — with production Firebase integration available by supplying credentials.

The project was designed to be a **portfolio-quality reference implementation** of production React patterns: typed state management, server-state caching, schema-versioned persistence with live migrations, route-level code splitting, and a hardened security posture.

---

## Key Features

### Storefront

- **Catalog & discovery** — responsive product grid with category / brand / price / rating filters, sorting, live search, featured & latest rails, and rich product detail pages with real watch photography.
- **Reviews & ratings** — rating-distribution summaries, verified-purchase badges, helpful votes, and a write-review flow whose aggregates stay coherent with the catalog.
- **Discovery extras** — a persisted **recently-viewed rail** and the **side-by-side compare drawer** (up to four watches: specs, price, availability) that both **stay in sync across open browser tabs** via `BroadcastChannel`, plus **quick-view** on every card.
- **Cart & checkout** — persisted cart, Zod + react-hook-form validation, multiple payment methods, **promo codes** (percent/fixed, min-order & usage caps — seeded codes like `WELCOME10`), and order confirmation with a full order-history view.
- **Cross-tab cart sync** — the cart contents stay synchronized across open tabs via `BroadcastChannel` (most-recent-writer-wins, echo-loop protected).
- **Account area** — customer dashboard, order tracking & per-order activity timelines, wishlist, an in-app **notification center** (order status, refunds, stock alerts), and profile/security management.

### Accounts & Security

- **Full auth cycle** — register, login, Google sign-in, **forgot-password**, **email verification** with a route-level "verify your email" gate, anti-enumeration error copy.
- **Two-factor authentication (TOTP)** — enroll with a live secret + `otpauth://` URI, verify-and-enable, disable. Real Firebase MFA path included; a deterministic demo path works offline.
- **Passkeys (WebAuthn)** — *genuine* WebAuthn ceremonies via `@simplewebauthn` (registration + authentication), cryptographically verified client-side in demo mode, **counter-based replay protection**, and a clearly-labelled legacy fallback for browsers without WebAuthn.
- **Authorization** — `ProtectedRoute` / `AdminRoute` guards enforce sign-in, role, and email-verification; the admin surface is invisible to non-admins (verified by tests + live scans).
- **Audit history** — immutable, timestamped activity trails on orders (placement, status changes, cancellations) and users (role changes), surfaced in Admin Orders, Admin Users, and the customer order page.

### Admin & Analytics

- **Dashboard** — revenue / order / customer KPIs, dependency-free **SVG charts** (monthly revenue bars + order-status donut), inventory health, most-reviewed products, and **top customers** by lifetime spend.
- **Sales reports** — export analytics to **CSV** or a **print-to-PDF** report; every export is HTML-escaped so report content can never inject markup.
- **Management** — products CRUD, orders (status workflow + tracking notes + one-click **refunds** that append an immutable audit event), users (roles, 2FA/passkey badges, activity dialogs), a **review moderation queue**, and a **Backup / Restore / Reset** console for the demo database.

---

## Product Capabilities

| Area | Capability |
| ---- | ---------- |
| Storefront | Browse, search, filter, sort, quick-view, compare, recently-viewed |
| Purchasing | Cart, promo codes, multi-step checkout (shipping / payment / review) |
| Orders | Track status, activity timeline, refunds, order history |
| Reviews | Rate products, write reviews, moderation queue for admins |
| Accounts | Register, login (email/Google), email verification, profile, wishlist |
| Security | TOTP 2FA, WebAuthn passkeys, role-based guards, audit trails |
| Admin | Dashboard KPIs, charts, exports, full CRUD, backup/restore |
| Notifications | In-app notification center (order status, refunds, stock alerts) |
| PWA | Installable, offline-capable with service-worker caching |

---

## Technology Stack

| Area | Choice |
| ---- | ------ |
| Language / runtime | TypeScript 5.6 · Node ≥ 18 |
| Build / dev server | Vite 7 (SWC React plugin) · PWA plugin |
| UI | React 18 · MUI 6 |
| Routing | React Router 7 |
| Client state | Zustand 5 (+ persist middleware) |
| Server state | TanStack Query 5 |
| Forms / validation | React Hook Form (pinned 7.53.x) + Zod |
| Auth | Firebase Auth (lazy-loaded) · `@simplewebauthn/browser` + `@simplewebauthn/server` |
| HTTP | Axios with interceptors + an in-app mock adapter |
| Tests | Vitest 3 · React Testing Library · jsdom · axe-core · Playwright E2E |
| Error tracking | Sentry (`@sentry/react`) — lazily loaded when `VITE_SENTRY_DSN` is set |
| Quality | ESLint (incl. `eslint-plugin-security`) · Prettier · `tsc --noEmit` |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Application                     │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   │
│  │    Pages      │   │  Components  │   │   API layer     │   │
│  │  (routes)     │   │  (MUI)       │   │  (React Query)  │   │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘   │
│         │                  │                    │           │
│  ┌──────▼──────────────────▼────────────────────▼───────┐   │
│  │                 Zustand stores (client state)          │   │
│  │   (auth · cart · wishlist · theme · features)          │   │
│  └──────────────────────────┬────────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐   │
│  │                 Service abstraction                     │   │
│  │    Axios client + interceptors + mock adapter          │   │
│  └───────┬──────────────────────────────┬────────────────┘   │
└──────────┼──────────────────────────────┼────────────────────┘
           │                              │
┌──────────▼──────────┐        ┌──────────▼──────────┐
│   Real backend      │        │   Demo mode         │
│   (Firebase/Firestore│        │   (in-memory mock DB│
│   + HTTP API,       │        │   persisted to      │
│   optional)         │        │   localStorage,     │
│                     │        │   schema-versioned) │
└─────────────────────┘        └─────────────────────┘
```

The UI operates against a **service abstraction** (Axios client with interceptors + an in-app mock adapter). In demo mode, an in-memory mock database with realistic seed data (16 watches, 6 users, 6 orders) serves all requests behind the same API shape as the real backend. Every mutation persists across reloads to `localStorage` inside a **schema-versioned envelope** with a **migration registry** — old snapshots upgrade in place, never silently discarded.

---

## Project Structure

```
src/
├── api/            # Typed API hooks (React Query) for products/orders/users/wishlist
├── components/     # Layout (Header/Footer/MainLayout), common UI, guards, skeletons
├── config/         # Env-driven app config + demo user
├── features/       # Feature modules: auth, products, cart, orders, admin, dashboard, home
│   ├── admin/      # Dashboard, charts, exports, CRUD, backup/restore controls
│   ├── auth/       # Pages, MFA dialog, layouts
│   └── …
├── lib/            # Firebase bootstrap (lazy), axios client, WebAuthn ceremony helpers
├── mocks/          # Mock DB: seeds, schema-versioned storage, adapter, auth helpers
├── store/          # Zustand stores: auth, cart, wishlist, theme
├── styles/         # Global styles + MUI theme (light & dark, AA+ tuned)
├── test/           # Test setup + factories
├── types/          # Shared domain types
└── utils/          # Helpers, CSV/print export
```

Cross-tab broadcast utilities live in `src/lib/broadcastChannel.ts`, and feature-specific sync hooks are colocated with their features (e.g. `src/features/cart/hooks/useCrossTabCartSync.ts`).

See [`docs/FILE_STRUCTURE.md`](./docs/FILE_STRUCTURE.md) for the full tree and [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) for an architecture deep-dive.

---

## Prerequisites

- **Node.js ≥ 18** (Node 22 recommended for CI parity)
- **npm ≥ 9**
- Git

---

## Installation

```bash
# 1. Clone the repository
git clone git@github.com:SadManFahIm/Watching-.git
cd Watching-

# 2. Install dependencies
npm install

# 3. (Optional) Create your local environment file
cp .env.example .env.local
```

---

## Environment Variables

All configuration is provided via **environment variables** (Vite reads them from `.env.local`). Copy `.env.example` → `.env.local` and fill in values. Without Firebase credentials the app **auto-signs in the demo admin** on load.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `VITE_API_BASE_URL` | No | Backend API URL (demo mode ignores this) |
| `VITE_FIREBASE_API_KEY` | No | Firebase API key (enables real auth) |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | No | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | No | Firebase app ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | No | Cloudinary media integration |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe payment key |
| `VITE_SENTRY_DSN` | No | Sentry error-tracking DSN (lazy-loaded) |
| `VITE_ENABLE_ANALYTICS` | No | Feature flag: analytics |
| `VITE_ENABLE_PWA` | No | Feature flag: PWA support |
| `VITE_ENABLE_NOTIFICATIONS` | No | Feature flag: notification center |

> **All variables are optional.** The app runs in demo mode without any configuration.

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Demo accounts

In demo mode, sign in with **`demo@classicwatch.local`** and *any* password of 4+ characters (admin). Additional seeded users appear in **Admin → Manage users**. Explore the 2FA and passkey flows from **Profile → Security**.

> Without Firebase credentials the app **auto-signs in the demo admin** on load and persists mutations to `localStorage` under a versioned mock-DB key. Use the **Reset demo data** control on the admin dashboard to reseed.

---

## Available Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint (zero-warning policy) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier across `src/` |
| `npm test` | Full Vitest suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:ui` | Interactive UI mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Build + Playwright E2E smoke suite |
| `npm run generate:icons` | Regenerate PWA icon set |

---

## Database Setup / Migration

The app has no separate database setup requirement — the demo database is fully in-memory and self-seeding. However, the persistence layer is **schema-versioned** with a migration registry:

- The mock DB persists to `localStorage` under a versioned envelope key.
- On load, the snapshot is validated against the expected schema version; if older, registered migrations upgrade it in place.
- Admins can **export the DB as versioned JSON**, **validate & import** it back, or reseed.
- The DB schema is versioned and migration-tested.

To enable the real backend (Firebase Firestore), provide `VITE_FIREBASE_*` variables and restart — the same UI talks to Firestore instead. Swap, don't rewrite.

---

## Testing

### Unit & Component Tests — **164 passing across 26 files**

Run the full suite:

```bash
npm test
```

Test coverage includes:

- **Accessibility regression suite** (`src/features/__tests__/a11y.test.tsx`) — full-page axe-core scans (WCAG 2.1 AA) on 18 routes: storefront, auth, dashboard, checkout and admin surfaces. This suite catches structural defects jsdom renders even when a narrow viewport hides them.
- **Store-level behavior** — cart promo-code discount math, notifications feed, recently-viewed dedupe & cap, compare toggle limits.
- **Cross-tab sync** — cart, compare, and recently-viewed BroadcastChannel synchronization (message shape filtering, echo-loop protection, broadcast on mutation).
- **Mock-adapter integration** — reviews, promo validation & redemption, refund eligibility + audit, persistence across reloads.
- **Auth-store state machines** — MFA enrollment/verify/disable, email verification, passkeys incl. legacy fallback.
- **Route guards** — protected / admin / email-verification, header navigation.
- **Storage round-trips + schema migrations** + adapter integration.
- **WebAuthn verification helpers**, CSV/print export escaping, chart rendering.

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

The E2E smoke suite runs against the production build in demo mode and covers: the complete **buy flow** (discover → detail → cart → checkout → confirmation), **auth & admin guards**, and **admin order/review moderation**.

### Running the full quality gate (exactly what CI runs)

```bash
npm run lint && npm run type-check && npm test && npm run build
```

---

## Code Quality

- **Strict TypeScript** — `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **ESLint** with `@typescript-eslint/recommended`, `react-hooks/recommended`, and `eslint-plugin-security` (eval, unsafe-regex, non-literal-regexp as errors).
- **Prettier** formatting enforced across `src/`.
- **Zero-warning policy** — `npm run lint` fails on any warning.
- **Modular feature folders** with clear boundaries; shared utilities extracted to `lib/`, `utils/`.
- **Consistent, typed tests** for all core logic and UI flows.

---

## Security

### Posture

- **No secrets in the repo** — Firebase keys live in `.env.local` (git-ignored); missing config is detected and the app falls back to demo mode.
- **Supply chain** — `npm audit --omit=dev --audit-level=high` runs in CI; the production-only scope keeps the check fast *and* meaningful. Unused dependencies are removed rather than tolerated.
- **Input & output hardening** — Zod-validated forms, XSS-safe rendering, HTML-escaped export/print views, security-focused ESLint rules.
- **Auth hardening** — anti-enumeration error copy, email-verification gate on protected routes, role-based route guards, TOTP second factor, WebAuthn passkeys with counter replay protection, and immutable audit trails for privileged actions.
- **Cryptographically secure randomness** — challenge generation for WebAuthn uses `crypto.getRandomValues` and fails closed when unavailable.
- **Dependency pinning** — `react-hook-form` is pinned to the known-good 7.53.x line because 7.86.0 shipped a regression that silently drops `formState.errors` after failed validation.

### `.gitignore`

`.env*` (except `.env.example`), `node_modules/`, `dist/`, `test-results/`, coverage, and other local artifacts are all excluded.

---

## CI/CD

CI runs on **GitHub Actions** (`.github/workflows/ci.yml`) with three parallel jobs:

| Job | Checks |
| --- | ------ |
| **Quality gates** | lint → type-check → unit tests → production build → production-dependency audit |
| **E2E smoke** | Playwright against the production build (buy flow, auth + admin guard, moderation) |
| **Lighthouse budget** | Lighthouse CI against the built app enforcing performance / a11y / best-practices / SEO floors |

Concurrency cancels stale runs so PRs iterate fast. All jobs use Node 22 and npm caching.

Lighthouse budget (`.lighthouserc.json`) enforces explicit floors on every PR: perf ≥ 0.80 (warn), a11y / best-practices / SEO ≥ 0.90 (error), CLS ≤ 0.10, LCP ≤ 5.5 s, TBT ≤ 1200 ms on throttled mobile. Measured locally: **Home 99 · /products 86 · A11y / Best-practices / SEO 100**.

---

## Build & Production

```bash
npm run build
```

Produces a fully optimized production build in `dist/`:

- Route-level code splitting with granular vendor chunks (react, mui, firebase, query, form).
- **Lazy Firebase** — the Firebase SDK is dynamically imported; **demo-mode builds ship zero Firebase bytes** on the critical path.
- **Lazy WebAuthn** — `@simplewebauthn/browser` and `/server` are code-split and loaded only when a passkey ceremony actually runs.
- Terser minification with console/debugger stripping.
- **PWA** with auto-update registration, inline SW registration, and Workbox caching for fonts, images, and API responses.
- Inlined critical CSS + app-shell hero for fast first paint.

Serve locally with:

```bash
npm run preview
```

---

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the full deployment checklist. In summary:

1. **Build**: `npm run build`
2. **Serve** the `dist/` directory as a static site (any static host: Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).
3. **Sentry**: set `VITE_SENTRY_DSN` at build time to enable error tracking.
4. **Firebase**: set `VITE_FIREBASE_*` variables to enable real auth + Firestore.
5. **PWA**: the service worker and manifest are generated at build time; ensure the host serves them correctly.

---

## Git Workflow

This repository follows a **trunk-based workflow with feature branches**:

```text
main  (protected)
 └── feat/<feature>   →   create PR → CI green → merge to main
```

1. Create a feature branch from `main`.
2. Keep changes small and covered by tests.
3. Run the full quality gate locally before pushing.
4. Push and open a PR with a clear description of the change and verification performed.
5. CI runs lint, type-check, tests, build, audit, E2E and Lighthouse on every PR.
6. Merge only when CI is green.

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Dev server doesn't open browser | The dev server listens on port 3000 (`server.port`); visit `http://localhost:3000` |
| Firebase config warning on startup | Expected in demo mode — either add `VITE_FIREBASE_*` variables or ignore (the app falls back gracefully) |
| `react-hook-form` field errors silently dropped | Ensure `react-hook-form` stays pinned to `7.53.2` (a 7.86.0 regression was the reason for the pin) |
| Test failures in jsdom around `BroadcastChannel` | jsdom lacks `BroadcastChannel`; the sync hooks fall back to a no-op via `openBroadcastChannel` |
| Lighthouse perf fails in CI but passes locally | Cold shared runners vary; the config uses explicit metric floors and warns (not errors) on perf score |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Keep changes small and covered by tests — run the quality gate before pushing.
3. Open a pull request describing the change and the verification performed.

---

## License

MIT — free to use for learning or commercial purposes.

---

## Project Status

**v3.1.0 — Production-ready.** Actively maintained. See [`docs/ROADMAP_V3.md`](./docs/ROADMAP_V3.md) for the product roadmap.

---

## Documentation Index

| Document | Contents |
| -------- | -------- |
| [`README.md`](./README.md) | You are here |
| [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) | Package contents & architecture |
| [`docs/QUICK_START.md`](./docs/QUICK_START.md) | Fast setup walkthrough |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Deployment checklist & guide |
| [`docs/FILE_STRUCTURE.md`](./docs/FILE_STRUCTURE.md) | Complete file tree |
| [`docs/ROADMAP_V3.md`](./docs/ROADMAP_V3.md) | Product roadmap (living document) |
| [`docs/UPGRADE_SUMMARY.md`](./docs/UPGRADE_SUMMARY.md) | Migration/upgrade report |

---

_Classic Watch Pro · v3.1.0 — a demonstration of production-grade React engineering._

