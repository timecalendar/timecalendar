# TimeCalendar mobile (React Native / Expo)

The React Native rewrite of the TimeCalendar app (the Flutter app lives at `../app/`). Expo SDK 56, New Architecture + Hermes, dev-client builds.

This is a **standalone npm project** — it is deliberately _not_ part of the root npm workspace (own `package.json` and `package-lock.json`, like `../server/`). Rationale: Expo pins `react` to an exact version per SDK while the web app floats it; a shared hoisted tree couples the two permanently. See the scaffold change's design D7 and the Architecture Book at `../docs/mobile/architecture-book/`.

## Prerequisites

- **Node 24** (the pin is the repo-root `.nvmrc`; `nvm use` from the root) and npm
- **iOS (macOS only):** **Xcode 26.4+** (hard SDK 56 minimum — older Xcode fails compiling `expo-modules-jsi` with `weak let` errors) with an iOS simulator; CocoaPods — `expo prebuild` runs `pod install` for you
- **Android:** **JDK 17** (newer JDKs as the Gradle JVM break the build — e.g. JDK 25 crashes Gradle 9.3's toolchain resolver). This directory has an `.sdkmanrc` pinning `java=17.0.19-tem` — with SDKMAN's `sdkman_auto_env=true` it switches automatically on `cd`; otherwise run `sdk env`. Plus an Android SDK with `ANDROID_HOME` set and `$ANDROID_HOME/platform-tools` on `PATH`:
  - **macOS:** Android Studio installs it at `$HOME/Library/Android/sdk`, with an emulator (AVD).
  - **Linux / WSL2:** Android Studio is not required. Unzip the [command-line tools](https://developer.android.com/studio#command-line-tools-only) to `$HOME/Android/Sdk/cmdline-tools/latest`, set `ANDROID_HOME=$HOME/Android/Sdk`, then install exactly what React Native 0.85 pins (see `node_modules/react-native/gradle/libs.versions.toml`):
    ```bash
    yes | sdkmanager --licenses
    sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" "cmake;3.22.1"
    ```
    Metro's React Native DevTools binary also needs `libnspr4` and `libnss3` (`apt install`); without them Metro prints a red "error while loading shared libraries: libnspr4.so" on start that is otherwise harmless.

## Run it

```bash
npm install
npm run ios       # build + launch dev client on the iOS simulator
npm run android   # build + launch dev client on the Android emulator
npm start         # Metro dev server only (when a dev client is already installed)
```

These are **development builds** (`expo-dev-client`), not Expo Go.

The generated Android project builds all four ABIs by default. For a physical device build, one ABI is enough and roughly halves the native build:

```bash
ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a npm run android
```

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
npm run android                          # one attached device, no emulator running: it is picked automatically
npm run android -- --device ONEPLUS_A6003   # several: --device takes the *name* the CLI lists, not the adb serial
```

**Point it at your dev backend.** The dev client and the app both need a path to your machine. There are two, and the right one depends on whether an iPhone shares the same Metro:

- **`adb reverse` (default on Linux / WSL2, or Android-only setups).** No Wi-Fi, no firewall, no LAN IP. The phone reaches your machine's ports through USB:

  ```bash
  adb reverse tcp:3005 tcp:3005 && adb reverse tcp:8081 tcp:8081
  ```

  ```bash
  # mobile/.env.local
  EXPO_PUBLIC_API_URL=http://localhost:3005
  ```

  Reverse rules are per-connection: re-run the command after replugging or rebooting the phone. `expo run:android` sets the 8081 rule itself but still hands the dev client a `192.168.x.x:8081` URL, which times out on a USB-only setup ("There was a problem loading the project"). Start Metro with `npm start -- --localhost` so the client gets `localhost:8081`, or type that URL into the dev launcher once.

- **LAN IP (macOS with an iPhone on the same Metro).** One Metro inlines the same `.env.local` into both bundles, so the URL has to work for both devices, and only a LAN IP does — a `localhost` URL would only satisfy Android:

  ```bash
  # mobile/.env.local — find the IP with: ipconfig getifaddr en0
  EXPO_PUBLIC_API_URL=http://192.168.1.42:3005
  ```

  `10.0.2.2` is the *emulator's* alias for the host and does **not** work on a real device. Phone and machine on the same Wi-Fi, backend running, restart Metro after editing (`npm start -- -c`).

The dev variant permits cleartext HTTP to either (`usesCleartextTraffic`).

### WSL2

WSL2 cannot see USB devices, so `adb` inside WSL lists nothing. Two ways out:

- **adb server on Windows (no admin rights needed).** Unzip the Windows [platform-tools](https://developer.android.com/tools/releases/platform-tools) somewhere under your Windows user profile and start the server from there (`adb.exe start-server`). Point the WSL client at it:

  ```bash
  export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037
  ```

  Requires `networkingMode=mirrored` in `%USERPROFILE%\.wslconfig` (the socket, and the `adb reverse` tunnels into WSL ports, do not cross the default NAT). **Keep both platform-tools at the same release:** a mismatched client kills the server and restarts it on the wrong side. `adb install`, `adb reverse`, `logcat`, and `expo run:android` all work through this.
- **usbipd-win** (`winget install usbipd`, then `usbipd bind` / `usbipd attach --wsl`, plus `linux-tools-*` in WSL). Full USB passthrough; needs Windows admin and `sudo`.

Either way, use the `adb reverse` backend path above, not a LAN IP: Windows Firewall blocks LAN inbound to mirrored WSL ports by default.

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
