import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup } from '@testing-library/react';

// react-helmet-async's <Helmet> requires a <HelmetProvider> ancestor, but
// page/component tests render isolated trees without one. No jsdom test
// asserts on <head> output (that belongs to the E2E / Lighthouse runs), so
// render Helmet as a no-op and HelmetProvider as a pass-through.
vi.mock('react-helmet-async', () => {
  const HelmetProvider = ({ children }: { children?: ReactNode }) => children ?? null;
  const Helmet = () => null;
  return { HelmetProvider, Helmet };
});

// This setup file also runs for the node-environment store tests, where
// `window` does not exist — only install the DOM shims in a browser env.
const hasWindow = typeof window !== 'undefined';

if (hasWindow) {
  // MatchMedia is not implemented in jsdom — MUI's useMediaQuery needs it.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Some MUI components (e.g. Popover/Select) probe for ResizeObserver.
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!('ResizeObserver' in window)) {
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverMock,
    });
  }

  // scrollTo is not implemented in jsdom.
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });

  // IntersectionObserver used by lazy rails.
  if (!('IntersectionObserver' in window)) {
    class IntersectionObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return [];
      }
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: IntersectionObserverMock,
    });
  }
}

// Clean up mounted trees between tests.
afterEach(() => {
  cleanup();
});
