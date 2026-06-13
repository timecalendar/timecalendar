import type { ConfigContext, ExpoConfig } from "expo/config"

const IS_DEV = process.env.APP_VARIANT === "development"

const appId = IS_DEV
  ? "fr.samuelprak.timecalendar.dev"
  : "fr.samuelprak.timecalendar"

// One Firebase project per environment (Google best practice — Analytics,
// Crashlytics, quotas and billing are all project-scoped). The dev variant
// (.dev appId) is registered in the `timecalendar-dev` project; production
// reuses the Flutter app's `timecalendar-samuelprak` config files. The four
// files live (committed) in mobile/firebase/ — see mobile/firebase/README.md.
const googleServicesAndroid = IS_DEV
  ? "./firebase/google-services.dev.json"
  : "./firebase/google-services.json"
const googleServicesIOS = IS_DEV
  ? "./firebase/GoogleService-Info.dev.plist"
  : "./firebase/GoogleService-Info.plist"

// EAS Update seam (add-mobile-eas). The real projectId is produced by `eas init`
// (a human step — no EAS project exists yet) and written here / read from env;
// the placeholder keeps `tsc` and `expo config --json` green until then. The
// updates.url is derived from it (https://u.expo.dev/<projectId>). See EAS.md.
const easProjectId =
  process.env.EAS_PROJECT_ID ?? "00000000-0000-0000-0000-000000000000"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "TimeCalendar (Dev)" : "TimeCalendar",
  slug: "timecalendar",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? "timecalendar-dev" : "timecalendar",
  userInterfaceStyle: "automatic",
  // fingerprint policy: an OTA JS update is only delivered to a build whose
  // native runtime is compatible; any native-affecting change (new plugin, a
  // dep with native code, an SDK bump) forces a fresh native build instead of a
  // silently-incompatible OTA. See the Architecture Book "EAS / distribution".
  runtimeVersion: { policy: "fingerprint" },
  updates: {
    url: `https://u.expo.dev/${easProjectId}`,
  },
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: appId,
    googleServicesFile: googleServicesIOS,
    // Dev variant only: let release-config e2e builds reach the harness server
    // on http://localhost:3005. ATS already exempts loopback, so this is
    // belt-and-braces; the production identity carries no exception (D6).
    ...(IS_DEV
      ? {
          infoPlist: {
            NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
          },
        }
      : {}),
  },
  android: {
    package: appId,
    googleServicesFile: googleServicesAndroid,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-updates",
    // Local SQLite (Drizzle migration runner lives in src/db). expo-sqlite and
    // react-native-mmkv v4/Nitro both link under the existing iOS
    // useFrameworks "static" set below — no new expo-build-properties (D8).
    // MMKV v4 autolinks with no plugin entry.
    "expo-sqlite",
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics",
    "@react-native-firebase/analytics",
    [
      "expo-build-properties",
      {
        // K-2 floors were iOS 15.1 / minSdk 24; SDK 56's own iOS minimum is
        // 16.4, so that is the effective floor (K-2 revisit recorded in
        // migration-approach.md §8 and the Architecture Book).
        // useFrameworks "static" is mandatory for @react-native-firebase — the
        // Firebase iOS SDK ships static frameworks. If a pod breaks under it,
        // the documented escape is ios.forceStaticLinking for the RNFB pods.
        ios: { deploymentTarget: "16.4", useFrameworks: "static" },
        // Dev variant only: release builds block cleartext HTTP by default,
        // which would silently break the http://10.0.2.2:3005 e2e call (D6).
        android: {
          minSdkVersion: 24,
          ...(IS_DEV ? { usesCleartextTraffic: true } : {}),
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        // Native static launch screen, drawn before any JS runs. This single
        // brand-pink literal (the Flutter `Colors.pink` identity tone #E91E63) is
        // the one color the splash can't source from the @/theme tokens: a native
        // launch screen runs pre-JS, so it can neither read JS theme tokens nor
        // switch on the OS color scheme. It is the brand fill (not a body-text
        // surface) and reads acceptably in both light and dark; the JS splash
        // overlay (src/components/splash-screen.tsx) mounts immediately after JS
        // loads and corrects to the scheme-appropriate @/theme token (design D5).
        backgroundColor: "#E91E63",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: easProjectId,
    },
  },
})
