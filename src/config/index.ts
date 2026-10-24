const hasFirebaseCredentials = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

// The backend this app talks to. There is deliberately no default host: the
// app must only ever send data to an API it was explicitly configured with.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// Demo mode: serve the whole storefront from an in-memory mock API.
// Enabled explicitly via VITE_ENABLE_MOCK_API=true, or automatically whenever
// no Firebase credentials or no API URL are configured — in development AND in
// production builds, so a deployed demo is fully self-contained instead of
// pointing at a backend nobody set up. Configuring both flips it off.
export const mockApiEnabled =
  import.meta.env.VITE_ENABLE_MOCK_API === 'true' || !hasFirebaseCredentials || !apiBaseUrl;

export const demoUserId = 'demo-user';

export const demoUser = {
  id: demoUserId,
  email: 'demo@classicwatch.local',
  displayName: 'Demo Admin',
  photoURL: undefined,
  role: 'admin' as const,
  emailVerified: true,
  mfaEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface Config {
  apiBaseUrl: string;
  mockApiEnabled: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  cloudinary?: {
    cloudName: string;
  };
  stripe?: {
    publishableKey: string;
  };
  features: {
    darkMode: boolean;
    pwa: boolean;
    analytics: boolean;
  };
}

const config: Config = {
  apiBaseUrl,
  mockApiEnabled,

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },

  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  },

  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },

  features: {
    darkMode: true,
    pwa: true,
    analytics: import.meta.env.PROD,
  },
};

export default config;
