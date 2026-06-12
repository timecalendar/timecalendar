# TimeCalendar mobile (React Native / Expo)

The React Native rewrite of the TimeCalendar app (the Flutter app lives at `../app/`). Expo SDK 56, New Architecture + Hermes, dev-client builds.

This is a **standalone npm project** — it is deliberately _not_ part of the root npm workspace (own `package.json` and `package-lock.json`, like `../server/`). Rationale: Expo pins `react` to an exact version per SDK while the web app floats it; a shared hoisted tree couples the two permanently. See the scaffold change's design D7 and the Architecture Book at `../.claude/rules/mobile/`.

## Prerequisites

- **Node 22+** and npm
- **iOS:** **Xcode 26.4+** (hard SDK 56 minimum — older Xcode fails compiling `expo-modules-jsi` with `weak let` errors) with an iOS simulator; CocoaPods — `expo prebuild` runs `pod install` for you
- **Android:** **JDK 17** (newer JDKs as the Gradle JVM break the build — e.g. JDK 25 crashes Gradle 9.3's toolchain resolver). This directory has an `.sdkmanrc` pinning `java=17.0.19-tem` — with SDKMAN's `sdkman_auto_env=true` it switches automatically on `cd`; otherwise run `sdk env`. Also: Android Studio / Android SDK, an emulator (AVD), and `ANDROID_HOME` set (`$HOME/Library/Android/sdk` plus `platform-tools` on `PATH`)

## Run it

```bash
npm install
npm run ios       # build + launch dev client on the iOS simulator
npm run android   # build + launch dev client on the Android emulator
npm start         # Metro dev server only (when a dev client is already installed)
```

These are **development builds** (`expo-dev-client`), not Expo Go.

## App variants (`APP_VARIANT`)

App identity is resolved dynamically in `app.config.ts`:

| `APP_VARIANT`        | App name           | Bundle ID / package              | Scheme             |
| -------------------- | ------------------ | -------------------------------- | ------------------ |
| unset / `production` | TimeCalendar       | `fr.samuelprak.timecalendar`     | `timecalendar`     |
| `development`        | TimeCalendar (Dev) | `fr.samuelprak.timecalendar.dev` | `timecalendar-dev` |

The `ios` / `android` / `start` npm scripts set `APP_VARIANT=development`, so local builds install side by side with the store (Flutter) app on a real device. The production identity is reserved for store builds (EAS, later) — it ultimately ships as an _update_ to the existing Flutter app.

**Caveat — switching variants requires a prebuild.** Native projects are generated with the identity that was active at prebuild time. If you build with a different `APP_VARIANT` than the last prebuild, regenerate first:

```bash
APP_VARIANT=development npx expo prebuild --clean
```

## Native projects (CNG)

`ios/` and `android/` are **generated, never committed** (Continuous Native Generation). All native configuration flows through `app.config.ts` and config plugins (`expo-build-properties` pins the OS floors: iOS 16.4 — SDK 56's own minimum, above the original K-2 15.1 floor — and Android `minSdk` 24). Never edit the generated projects by hand; `npx expo prebuild --clean` rebuilds them from scratch.

`expo-env.d.ts` is also generated (first `expo start`/`prebuild` recreates it) and gitignored, per template convention.
