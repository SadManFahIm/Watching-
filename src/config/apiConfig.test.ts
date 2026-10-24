import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The app must never talk to an API it was not explicitly pointed at: with no
 * VITE_API_BASE_URL it stays on the in-app mock API instead of a default host.
 */

const loadConfig = async () => {
  vi.resetModules();
  return import('@/config');
};

const stubFirebaseCredentials = () => {
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'key');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'project');
  vi.stubEnv('VITE_FIREBASE_APP_ID', 'app');
};

describe('API configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('has no default API host and stays on the mock API when none is configured', async () => {
    stubFirebaseCredentials();
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_ENABLE_MOCK_API', '');

    const { default: config, mockApiEnabled } = await loadConfig();

    expect(config.apiBaseUrl).toBe('');
    expect(mockApiEnabled).toBe(true);
    expect(config.mockApiEnabled).toBe(true);
  });

  it('uses the configured API host and the real API when one is set', async () => {
    stubFirebaseCredentials();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    vi.stubEnv('VITE_ENABLE_MOCK_API', '');

    const { default: config, mockApiEnabled } = await loadConfig();

    expect(config.apiBaseUrl).toBe('https://api.example.com');
    expect(mockApiEnabled).toBe(false);
  });
});
