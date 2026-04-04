import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mirros.app',
  appName: 'mirros',
  webDir: 'out',
  server: {
    // Android emülatör için: 10.0.2.2 = host makinenin localhost
    // Fiziksel cihaz için: kendi IP adresin (ör. 192.168.1.X:3000)
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  },
};

export default config;
