# Firebase — Crashlytics + Analytics

Crash reporting + analytics. These are the load-bearing rules and the caveats tooling can't carry (R-1: a rule that can be a lint rule / type / CI gate is one — the prose here is what can't be).

## SDK + API

- Use **`@react-native-firebase/{app,crashlytics,analytics}` v24, modular API only** (`getAnalytics`/`logEvent`, `getCrashlytics`/`log`/`recordError`/`crash`). The namespaced `firebase.crashlytics()` style is **deprecated** (v22+) — do not use it.
- The Firebase **JS/Web SDK is not used** — it can't capture native crashes.
- **Auth + Messaging are deferred** to the features that need them (the Flutter app uses both — R-2: no speculative adoption).

## One Firebase project per environment

- Analytics/Crashlytics/quotas/billing are project-scoped, so dev noise must not pollute production. `app.config.ts` switches `googleServicesFile` by `APP_VARIANT` (the `IS_DEV` branch): dev `fr.samuelprak.timecalendar.dev` → **`timecalendar-dev`**; production `fr.samuelprak.timecalendar` → **`timecalendar-samuelprak`** (shared with the Flutter app, reusing its committed config files).
- The four config files are **committed** in `mobile/firebase/` (`google-services{,.dev}.json`, `GoogleService-Info{,.dev}.plist`). Client API keys are **not secret** (they ship in the binary; the Flutter app commits its pair too).
- **Manual prerequisite:** the `.dev` apps must be registered in the `timecalendar-dev` console and the files dropped in — see `mobile/firebase/README.md`. Native builds / e2e fail until then; `tsc`/lint/Jest don't read the files, so CI `test-mobile` is unaffected. Can't be a lint rule (console + binary config), hence prose.

## iOS static frameworks — mandatory, highest-risk

- `expo-build-properties` carries `ios.useFrameworks: "static"` (alongside the iOS/Android floors and the dev cleartext flag) — the Firebase iOS SDK ships static frameworks. This alters pod linking **app-wide**; if a pod breaks, the escape is `ios.forceStaticLinking` for the RNFB pods. Verified only by a real prebuild (config-shape, not source).

## Wrapper seam, no startup side-effect

- `src/firebase/index.ts` is the **single seam** the app touches — `logEvent` / `logMessage` / `recordError` / `crashTest` over the modular SDK. Feature code imports `@/firebase`, **never `@react-native-firebase/*` directly** (swappable, behind our own abstraction). Each helper resolves the native instance **lazily** inside its body, so importing the module never touches native code (safe in Jest).
- **Deliberately unlike i18n: there is no `import "@/firebase"` in `_layout.tsx`.** RNFirebase **auto-initializes** the native default app from the bundled config files and **auto-installs the global JS exception handler** — so unhandled JS errors reach Crashlytics for free and there is nothing to run at startup. A side-effect import mirroring i18n would be cargo-culting; add one only if a real startup action appears (consent toggle, user-id attribute).

## Debug-build reporting + verification surface

- `mobile/firebase.json` sets `crashlytics_debug_enabled: true` so a local `npm run ios/android` (debug + Metro, dev variant) reports a forced crash; release/e2e builds report regardless.
- The `__DEV__`-gated `FirebaseDebugPanel` on the Profile tab (log a test event / force a test crash) is the on-demand verification surface. Gated by `__DEV__` so it never renders in production.

## What CI proves vs. what's manual

- `src/firebase/firebase.test.ts` mocks the native modules (`jest/setup-firebase.ts`, suite-wide) and asserts the wrapper drives the SDK with the expected args — wiring proven in CI (`test-mobile`: tsc + lint + Jest).
- CI **cannot** assert an event/crash *arrives* in the console — that is the **manual on-device step**: Firebase DebugView for the event, the Crashlytics dashboard for the crash. The Maestro e2e asserts a seeded school name; Firebase just must not break app launch.

## Deferred (recorded debt — not built)

- **Auth, Messaging** — their own features.
- **Analytics consent / GDPR gate** — collection is on-by-default to verify; a consent gate is owned by a later feature (the French user base makes it real).
- **Custom event taxonomy; native dSYM symbolication** beyond what the Crashlytics config plugin wires automatically.
