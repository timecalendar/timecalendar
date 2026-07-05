# TimeCalendar mobile (React Native / Expo)

The React Native rewrite of the TimeCalendar app (the Flutter app lives at `../app/`). Expo SDK 56, New Architecture + Hermes, dev-client builds.

This is a **standalone npm project** — it is deliberately _not_ part of the root npm workspace (own `package.json` and `package-lock.json`, like `../server/`). Rationale: Expo pins `react` to an exact version per SDK while the web app floats it; a shared hoisted tree couples the two permanently. See the scaffold change's design D7 and the Architecture Book at `../docs/mobile/architecture-book/`.

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

## Run on a physical iOS device

Same dev build, over USB. Plug in the iPhone, unlock it, tap **Trust This Computer**, then:

```bash
npm run ios -- --device   # build + install the dev client on the connected iPhone
```

First launch only: trust the developer certificate on the phone (**Settings → General → VPN & Device Management**). After that, `npm start` + reloading the app covers JS changes; rebuild natively only when native deps/config change.

**Point it at your dev backend.** The default `EXPO_PUBLIC_API_URL` (`https://api.timecalendar.host:1443`) resolves through your Mac's `/etc/hosts` and only works on the simulator — on a real device that hostname is a dead end. Set `mobile/.env.local` to your Mac's LAN IP and the plain-HTTP backend (the dev variant allows cleartext to local networks via `NSAllowsLocalNetworking`):

```bash
# mobile/.env.local — find the IP with: ipconfig getifaddr en0
EXPO_PUBLIC_API_URL=http://192.168.1.42:3005
```

`EXPO_PUBLIC_*` is inlined by Metro at bundle time, so restart Metro after editing (`npm start -- -c`). Phone and Mac must be on the same Wi-Fi (no guest network / AP isolation), with the dev backend running on your Mac. Revert to the `api.timecalendar.host` URL when switching back to the simulator.

## Run on a physical Android device

Same dev build, over USB. On the phone enable **Developer options → USB debugging**, plug it in, and accept the **Allow USB debugging** prompt (`adb devices` should list it), then:

```bash
npm run android -- --device   # build + install the dev client on the connected phone
```

**Point it at your dev backend.** Same as the iOS device above — set `mobile/.env.local` to your Mac's LAN IP (`10.0.2.2` is the *emulator's* alias for your Mac and does **not** work on a real device):

```bash
# mobile/.env.local — find the IP with: ipconfig getifaddr en0
EXPO_PUBLIC_API_URL=http://192.168.1.42:3005
```

This is the single value that works for the iOS device and this Android device at once — one Metro inlines the same `.env.local` into both bundles, so a LAN IP serves both (an `adb reverse` → `localhost` URL would only satisfy Android and break iOS). The dev variant permits cleartext HTTP to it (`usesCleartextTraffic`). Same requirements as iOS: phone and Mac on the same Wi-Fi, backend running on your Mac, restart Metro after editing (`npm start -- -c`).

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
