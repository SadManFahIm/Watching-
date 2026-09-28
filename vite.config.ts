/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Vite 8 bundles with Rolldown, which only accepts the function form of
// `manualChunks` (the object form was a Rollup-only convenience). Each entry
// maps a node_modules package to the vendor chunk it belongs in; the regex
// lists the shared transitive deps so the split matches the old object form.
const VENDOR_CHUNKS: { name: string; test: RegExp }[] = [
  {
    name: 'react-vendor',
    test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|loose-envify|js-tokens|@remix-run[\\/]router)[\\/]/,
  },
  {
    name: 'mui-vendor',
    test: /node_modules[\\/](@mui[\\/][^\\/]+|@emotion[\\/][^\\/]+|@popperjs[\\/]core|clsx|prop-types|react-is|react-transition-group|@babel[\\/]runtime)[\\/]/,
  },
  { name: 'firebase-vendor', test: /node_modules[\\/]firebase[\\/]/ },
  { name: 'query-vendor', test: /node_modules[\\/]@tanstack[\\/]react-query[^\\/]*[\\/]/ },
  {
    name: 'form-vendor',
    test: /node_modules[\\/](react-hook-form|zod|@hookform[\\/]resolvers)[\\/]/,
  },
];

const manualChunks = (id: string): string | undefined =>
  VENDOR_CHUNKS.find(({ test }) => test.test(id))?.name;

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    // Vitest 5 removed `environmentMatchGlobs`; per-environment file routing is
    // now expressed with `projects`. This keeps the previous split: component and
    // feature specs run in jsdom, everything else in plain node.
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/features/**/*.test.tsx', 'src/components/**/*.test.tsx'],
          // The a11y suite renders whole pages and runs axe-core over the full
          // DOM, which regularly exceeds Vitest's 5s default on a loaded runner.
          testTimeout: 30000,
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'src/features/**/*.test.tsx',
            'src/components/**/*.test.tsx',
          ],
        },
      },
    ],
    setupFiles: ['./src/test/setup.ts', './src/test/setup-jsdom.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inline the tiny SW-registration snippet instead of a separate
      // registerSW.js request (render-blocking on first load).
      injectRegister: 'inline',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Classic Watch Pro',
        short_name: 'ClassicWatch',
        description: 'Premium luxury watch e-commerce platform',
        theme_color: '#3867D6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
