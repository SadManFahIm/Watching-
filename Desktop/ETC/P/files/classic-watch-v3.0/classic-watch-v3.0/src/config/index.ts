interface Config {
  apiBaseUrl: string;
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
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://classic-watch-server.onrender.com',
  
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
