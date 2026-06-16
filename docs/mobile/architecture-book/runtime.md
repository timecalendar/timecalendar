# Runtime & native baseline

> Rules that can be encoded link to their enforcing gate (per R-1); the rest is here because it can't be.

## Runtime baseline

- **Expo SDK 56** (React Native **0.85.3**). New Architecture + Hermes are SDK defaults and the **only** supported mode.
- **`expo-dev-client`**: local builds are development builds, **never** Expo Go.
- **Expo Router** is the navigation backbone.
- **Platform scope: iOS + Android only — there is no web target** (ADR [007](./decisions/007-drop-web-target.md)). No `app.config.ts` `web` block, no `"web"` script, no `react-dom` / `react-native-web` deps. `Fonts` carries `ios` / `default` only (`Fonts.mono` resolves on both). The `@/hooks/use-color-scheme` seam stays; Metro resolves the bare `.ts` on both platforms. Re-add web only deliberately, with its own design, if a real web roadmap appears.

## Project placement

- `mobile/` is a **standalone npm project** with its own lockfile, a sibling of `server/` and `app/` — **not** a root-workspace member. Expo pins `react` exactly per SDK while Next floats it, and npm workspaces can't isolate the two (overrides don't apply to workspace direct deps; duplicates break expo-doctor). The root workspace remains "web + its generated client."
- **Revisit if:** real package-level sharing between web and mobile emerges (beyond codegen), or the repo moves to pnpm.

## TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` on top of `expo/tsconfig.base`; `npx tsc --noEmit` must stay clean. *Gate:* `mobile/tsconfig.json`.

## Native projects: CNG

- `mobile/ios/` and `mobile/android/` are **generated, gitignored, never hand-edited**. All native config flows through `app.config.ts` + config plugins; `npx expo prebuild --clean` is the only way native projects change.

## Native deps & permission config

Most native deps **autolink with no `plugins` entry** (`react-native-mmkv` v4/Nitro, `expo-crypto`, `expo-sqlite`'s module). A dep needs a `plugins` entry only to inject **native config a plugin owns** — most often **permission strings** a missing of which is an App Store rejection / runtime crash. These strings are **config-shape, prebuild-verified (R-1)** — `tsc`/lint/Jest don't read them; a real `expo prebuild` / e2e build is the proof. They are **build-time config, OS-localized** from the Info.plist/manifest — **not** i18n catalog strings (so the no-hardcoded-strings rule doesn't apply to them).

- **`expo-camera`** (the QR scanner, `src/features/calendar-sources`; ADR [017](./decisions/017-qr-scan-camera.md)). Native module **autolinks**; the `plugins` entry `["expo-camera", { cameraPermission, recordAudioAndroid: false }]` injects only the iOS `NSCameraUsageDescription` and gates the barcode scanner. **`recordAudioAndroid: false` is mandatory** — the plugin **defaults it to `true`**, which would add `RECORD_AUDIO` to the Android manifest; QR scanning never records audio, so we disable it (no `microphonePermission` either). Links under the existing iOS `useFrameworks: "static"` set (no new `expo-build-properties`); the escape if a pod breaks is `ios.forceStaticLinking`. Verified by `expo prebuild` / e2e (config-shape) — see the inbox DoD note; mocked under Jest (`jest/setup-expo-camera.ts`).
- **`@react-native-firebase/messaging`** (FCM push receive, behind the `@/firebase` seam; ADR [026](./decisions/026-fcm-messaging-seam.md)). Native module **autolinks**; the plugin entry wires only the Android notification icon, so the push config is **declared in `app.config.ts`**: iOS `ios.entitlements["aps-environment"]` (the plugin does NOT inject it) + `ios.infoPlist.UIBackgroundModes: ["remote-notification"]` (background data messages wake the app for the top-level background handler); Android `android.permissions: ["POST_NOTIFICATIONS"]` (the Android 13+ runtime permission, paired with the runtime request in the seam's `requestNotificationPermission`). Links under the existing iOS `useFrameworks: "static"` set (no new `expo-build-properties`); the escape if a pod breaks is `ios.forceStaticLinking`. Verified by `expo prebuild` (config-shape — the entitlement, background mode, and permission land in the generated projects); real push **receipt** is device-only (`docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md`). Mocked under Jest (`jest/setup-firebase.ts`).

## App identity: `APP_VARIANT`

- Dynamic `app.config.ts`, switched on `APP_VARIANT`:
  - unset / `production` → `fr.samuelprak.timecalendar` / "TimeCalendar" / scheme `timecalendar` — **preserves store identity** (RN ships as an *update* to the Flutter app).
  - `development` → `fr.samuelprak.timecalendar.dev` / "TimeCalendar (Dev)" / scheme `timecalendar-dev` — **coexists** with the store app on devices.
- The `ios` / `android` / `start` npm scripts set `APP_VARIANT=development`. Switching variants requires `expo prebuild --clean`.
- The `.dev` identifier needs its own Firebase registration (owned by the Firebase setup).

## Minimum OS floors

- **Effective floors: iOS 16.4 / Android API 24** (ADR [002](./decisions/002-minimum-os.md)). K-2 set iOS 15.1, but SDK 56's own minimum deployment target is 16.4, which prevails (K-2's "SDK raises its own minimum" clause). Android's SDK minimum (21) is below our 24, so the K-2 floor stands there.
- Encoded in `app.config.ts` via `expo-build-properties` — **kept explicit even where redundant**: documents intent, survives SDK default drift.
- Liquid Glass degradation baseline: iOS 16.4–25 → non-glass fallback; iOS 26+ → Liquid Glass.
