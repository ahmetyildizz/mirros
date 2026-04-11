import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mirros.app',
  appName: 'mirros',
  webDir: 'out',
  server: {
    // Live Vercel URL for initial native testing
    url: 'https://mirros.vercel.app',
    cleartext: true,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3057274589981074~2543071348',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
