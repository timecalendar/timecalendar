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

// EAS Update seam (add-mobile-eas). The real projectId was produced by `eas init`
// and is committed here as the fallback — it is NOT a secret (it ships in the
// binary and the EAS project is public-by-id). EAS_PROJECT_ID can override it.
// updates.url is derived from it (https://u.expo.dev/<projectId>). See eas.md.
const easProjectId =
  process.env.EAS_PROJECT_ID ?? "3b427ef6-1aae-4175-8217-ea447ee6df6b"

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
    // Export-compliance: the app uses only standard/exempt encryption (HTTPS/TLS
    // to the API, unencrypted MMKV, platform-standard Firebase crypto — no
    // proprietary algorithm). Sets ITSAppUsesNonExemptEncryption=false so EAS
    // stops prompting per build and a future store submission is pre-cleared.
    config: { usesNonExemptEncryption: false },
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
    // Camera + barcode scanning (the QR scanner, src/features/calendar-sources).
    // The native module autolinks under CNG; this plugin entry exists only to
    // inject the iOS NSCameraUsageDescription (a missing camera usage string is
    // an App Store rejection / iOS runtime crash) and to gate the barcode
    // scanner into the build. `recordAudioAndroid: false` keeps RECORD_AUDIO off
    // the Android manifest — QR scanning never records audio; no
    // microphonePermission for the same reason. Links under the existing iOS
    // useFrameworks "static" set below (no new expo-build-properties); the escape
    // if a pod breaks is ios.forceStaticLinking. The permission strings are
    // config-shape, prebuild-verified (R-1) — tsc/lint/Jest don't read them; a
    // real `expo prebuild` / e2e is the proof (see runtime.md + ADR 017). The
    // usage description is build-time config, OS-localized — NOT an i18n catalog
    // string.
    [
      "expo-camera",
      {
        cameraPermission:
          "TimeCalendar needs camera access to scan a QR code that adds your calendar.",
        recordAudioAndroid: false,
      },
    ],
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
