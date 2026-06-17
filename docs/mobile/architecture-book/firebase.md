# Firebase — Crashlytics + Analytics + Cloud Messaging

Crash reporting + analytics. These are the load-bearing rules and the caveats tooling can't carry (R-1: a rule that can be a lint rule / type / CI gate is one — the prose here is what can't be).

## SDK + API

- Use **`@react-native-firebase/{app,crashlytics,analytics,messaging}` v24, modular API only** (`getAnalytics`/`logEvent`, `getCrashlytics`/`log`/`recordError`/`crash`, `getMessaging`/`requestPermission`/`getAPNSToken`/`getToken`/`onMessage`/`onTokenRefresh`/`setBackgroundMessageHandler`). The namespaced `firebase.crashlytics()` style is **deprecated** (v22+) — do not use it.
- The Firebase **JS/Web SDK is not used** — it can't capture native crashes.
- **Auth deferred; Messaging built (ADR [026](./decisions/026-fcm-messaging-seam.md)).** Auth stays deferred to the feature that needs it (R-2: no speculative adoption); Messaging is now behind the seam (Phase 06 Ship A — see **Cloud Messaging** below).

## One Firebase project per environment

- Analytics/Crashlytics/quotas/billing are project-scoped, so dev noise must not pollute production. `app.config.ts` switches `googleServicesFile` by `APP_VARIANT` (the `IS_DEV` branch): dev `fr.samuelprak.timecalendar.dev` → **`timecalendar-dev`**; production `fr.samuelprak.timecalendar` → **`timecalendar-samuelprak`** (shared with the Flutter app, reusing its committed config files).
- The four config files are **committed** in `mobile/firebase/` (`google-services{,.dev}.json`, `GoogleService-Info{,.dev}.plist`). Client API keys are **not secret** (they ship in the binary; the Flutter app commits its pair too).
- **Manual prerequisite:** the `.dev` apps must be registered in the `timecalendar-dev` console and the files dropped in — see `mobile/firebase/README.md`. Native builds / e2e fail until then; `tsc`/lint/Jest don't read the files, so CI `test-mobile` is unaffected. Can't be a lint rule (console + binary config), hence prose.

## iOS static frameworks — mandatory, highest-risk

- `expo-build-properties` carries `ios.useFrameworks: "static"` (alongside the iOS/Android floors and the dev cleartext flag) — the Firebase iOS SDK ships static frameworks. This alters pod linking **app-wide**; if a pod breaks, the escape is `ios.forceStaticLinking` for the RNFB pods. Verified only by a real prebuild (config-shape, not source).

## Wrapper seam, no startup side-effect

- `src/firebase/index.ts` is the **single seam** the app touches — `logEvent` / `logMessage` / `recordError` / `crashTest` over the modular SDK. Feature code imports `@/firebase`, **never `@react-native-firebase/*` directly** (swappable, behind our own abstraction). Each helper resolves the native instance **lazily** inside its body, so importing the module never touches native code (safe in Jest).
- **Crashlytics/Analytics need no `import "@/firebase"` in `_layout.tsx`.** RNFirebase **auto-initializes** the native default app from the bundled config files and **auto-installs the global JS exception handler** — so unhandled JS errors reach Crashlytics for free and there is nothing to run at startup for *those* surfaces. **Messaging is the exception** (ADR [026](./decisions/026-fcm-messaging-seam.md)): its background handler is a JS registration that *must* run early, so the seam **is** now a side-effect `import "@/firebase"` in `_layout.tsx` (mirroring i18n) — see **Cloud Messaging** below. Do not "fix" that import out.

## Cloud Messaging

FCM push **receive** behind the same seam (Phase 06 Ship A, ADR [026](./decisions/026-fcm-messaging-seam.md); parity with the Flutter `notification.dart`). Receive only — token→backend registration, prefs UI, tap-routing, and local reminders are later ships.

> **First consumer (Phase 06 Ship B, ADR [027](./decisions/027-fcm-subscription-registration.md)).** `getFcmToken` / `onFcmTokenRefresh` / `requestNotificationPermission` / `recordError` now have their first consumer: the subscription-registration seam in **`src/features/notifications/`** (NOT this seam — B-1 bans the generated client here; the registration is a feature, not transport). It reads the token, assembles the `notification-subscription` DTO, and **PUTs it idempotently** on every prefs change + on token-refresh. The subscription API is **PUT-only (no GET)**, so the **local MMKV `@/storage` store is the source of truth** — the seam never reads subscription state back from the server; "round-trips" means the PUT succeeds. A failed PUT → `recordError(error, "notifications/subscription")` + an accessible Retry on the prefs screen. The seam's shape/posture is unchanged.

- **Four lazy-native helpers**, one per concern, each resolving `getMessaging()` inside its body (same posture as the Crashlytics/Analytics helpers): `requestNotificationPermission` (iOS UNUserNotification prompt + Android 13+ `POST_NOTIFICATIONS` runtime request), `getFcmToken`, `onForegroundMessage` (returns an unsubscribe), `onFcmTokenRefresh` (returns an unsubscribe). Feature code imports `@/firebase`, **never `@react-native-firebase/messaging` directly**.
- **iOS APNS-token-FIRST (load-bearing rule).** On iOS `getFcmToken` calls `getAPNSToken` first and returns `null` (caller retries next refresh/foreground cycle) **without** calling `getToken` when APNS isn't ready yet; on Android it calls `getToken` directly. `getToken` errors → `recordError` → `null`. **Never call `getToken` before a non-null `getAPNSToken` on iOS** — it races and can error. Exact Flutter `getFcmToken` parity.
- **The ONE no-native-on-import exception.** `setBackgroundMessageHandler(getMessaging(), handler)` runs at **module init** (the only top-level native call in the seam) because RNFB requires the background handler before the JS app finishes booting — a late registration misses background/quit-state messages. It loads during boot via the side-effect `import "@/firebase"` in `src/app/_layout.tsx`. Jest-safe because `jest/setup-firebase.ts` mocks the messaging module; the proof test asserts the registration fired **exactly once**.
- **Native wiring (config-shape, prebuild-verified — R-1).** `@react-native-firebase/messaging` v24 plugin entry; iOS `aps-environment` entitlement (declared in `ios.entitlements` — the RNFB messaging plugin does **not** inject it; it only wires the Android notification icon) + `UIBackgroundModes: ["remote-notification"]`; Android `POST_NOTIFICATIONS`. Rides the existing `ios.useFrameworks: "static"` set; `ios.forceStaticLinking` is the escape. See [runtime.md](./runtime.md).
- **CI proves the wiring; real delivery is device-only.** The proof test drives the mocked SDK (permission / APNS-first token order / `onMessage` / `onTokenRefresh` / `setBackgroundMessageHandler`). It **cannot** assert a real push *arrives* — foreground/background/**killed**, both platforms, **release** build — that is the manual on-device step in `docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md` (incl. the `timecalendar-dev` APNs-key prerequisite + the OEM-throttling / dev-client / simulator caveats).
- **Expo Push stays rejected** (ADR 026 re-affirms): FCM direct + the server `firebase-admin` sender + `notification-subscription`, server unchanged. The seam decouples the app from the SDK, not so the transport is swappable to Expo Push.

## Debug-build reporting + verification surface

- `mobile/firebase.json` sets `crashlytics_debug_enabled: true` so a local `npm run ios/android` (debug + Metro, dev variant) reports a forced crash; release/e2e builds report regardless.
- The `__DEV__`-gated `FirebaseDebugPanel` on the Profile tab (log a test event / force a test crash) is the on-demand verification surface. Gated by `__DEV__` so it never renders in production.

## What CI proves vs. what's manual

- `src/firebase/firebase.test.ts` mocks the native modules (`jest/setup-firebase.ts`, suite-wide) and asserts the wrapper drives the SDK with the expected args — wiring proven in CI (`test-mobile`: tsc + lint + Jest).
- CI **cannot** assert an event/crash *arrives* in the console — that is the **manual on-device step**: Firebase DebugView for the event, the Crashlytics dashboard for the crash. The Maestro e2e asserts a seeded school name; Firebase just must not break app launch.

## Deferred (recorded debt — not built)

- **Auth** — its own feature.
- **Analytics consent / GDPR gate** — collection is on-by-default to verify; a consent gate is owned by a later feature (the French user base makes it real).
- **Custom event taxonomy; native dSYM symbolication** beyond what the Crashlytics config plugin wires automatically.
