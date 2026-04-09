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
};

export default config;
