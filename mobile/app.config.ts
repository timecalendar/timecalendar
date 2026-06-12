import type { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

const appId = IS_DEV
  ? 'fr.samuelprak.timecalendar.dev'
  : 'fr.samuelprak.timecalendar';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'TimeCalendar (Dev)' : 'TimeCalendar',
  slug: 'timecalendar',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: IS_DEV ? 'timecalendar-dev' : 'timecalendar',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: appId,
  },
  android: {
    package: appId,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        // K-2 floors were iOS 15.1 / minSdk 24; SDK 56's own iOS minimum is
        // 16.4, so that is the effective floor (K-2 revisit recorded in
        // migration-approach.md §8 and the Architecture Book).
        ios: { deploymentTarget: '16.4' },
        android: { minSdkVersion: 24 },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
