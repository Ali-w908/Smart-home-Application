import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smarthome',
  appName: 'SmartHome Control',
  webDir: 'dist',
  android: {
    backgroundColor: '#f3f4f6',
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
  }
};

export default config;
