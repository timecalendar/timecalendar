# Tasks — add-mobile-fcm-messaging (Phase 06 Ship A)

Receive + seam only. No token-to-backend, no prefs UI, no tap-routing, no local reminders
(Ships B/C/D). Server is UNCHANGED — no server edits.

## 1. Native dependency + config wiring

- [x] 1.1 Add `@react-native-firebase/messaging` to `mobile/package.json` pinned to the **same
      v24 line** as the installed `@react-native-firebase/{app,crashlytics,analytics}`
      (`^24.1.1`); run `npm install` and commit the lockfile change.
- [x] 1.2 In `mobile/app.config.ts`, add `"@react-native-firebase/messaging"` to `plugins`
      (next to the existing app/crashlytics/analytics entries).
- [x] 1.3 In `mobile/app.config.ts`, declare the iOS push wiring: ensure the `aps-environment`
      entitlement is present (RNFB messaging plugin adds it — verify at prebuild) and add
      `ios.infoPlist.UIBackgroundModes: ["remote-notification"]`. Keep the existing dev-only
      `NSAppTransportSecurity` branch intact.
- [x] 1.4 In `mobile/app.config.ts`, add `"POST_NOTIFICATIONS"` to `android.permissions`
      (Android 13+ runtime notification permission).
- [x] 1.5 Add a config-comment block (mirroring the expo-camera entry's comment) stating:
      messaging rides the existing `ios.useFrameworks: "static"` set (no new
      `expo-build-properties`); the escape if a pod breaks is `ios.forceStaticLinking`; the
      entitlement/permission are config-shape, prebuild-verified (R-1), OS-localized, NOT i18n
      catalog strings.
- [x] 1.6 Verify autolink + config shape with `cd mobile && npx expo prebuild --clean` (then
      discard the generated `ios/`/`android/` — they are gitignored, CNG). Confirm the iOS
      entitlement + background mode and the Android permission land in the generated projects.

## 2. Extend the `@/firebase` seam (`mobile/src/firebase/index.ts`)

Mirror the Flutter `modules/firebase/services/notification/notification.dart` parity. Keep the
lazy-resolve-native-inside-each-helper posture (each helper calls `getMessaging()` in its body).

- [x] 2.1 `requestNotificationPermission(): Promise<void>` → messaging `requestPermission`
      (iOS UNUserNotification authorization; Android 13+ triggers the runtime
      `POST_NOTIFICATIONS` request). Mirrors Flutter `subscribe()`.
- [x] 2.2 `getFcmToken(): Promise<string | null>` with the **iOS APNS-token-FIRST guard**: on
      iOS call `getAPNSToken` first and return `null` (without calling `getToken`) when it is
      null; otherwise return `getToken`. On Android call `getToken` directly. Catch `getToken`
      errors → `recordError` (existing seam) and return `null`. Exact parity with Flutter
      `getFcmToken`.
- [x] 2.3 `onForegroundMessage(handler): () => void` → messaging `onMessage`, forwards the
      message to the handler, returns the unsubscribe.
- [x] 2.4 `onFcmTokenRefresh(handler): () => void` → messaging `onTokenRefresh`, returns the
      unsubscribe.
- [x] 2.5 **Top-level** `setBackgroundMessageHandler(getMessaging(), handler)` registered at
      module init (NOT inside a component) — the single documented exception to the
      no-native-on-import invariant (design Decision 2). Add a comment explaining the RN harness
      constraint (must register before the JS app boots; misses quit-state messages otherwise)
      and that this is the only top-level native access in the seam.
- [x] 2.6 Add a side-effect `import "@/firebase"` at the Expo Router entry so the seam (and thus
      the background handler) loads during boot (mirrors the i18n side-effect import). Confirm
      this is the inverse of the crashlytics rationale (crashlytics auto-installs natively;
      messaging's background handler is a JS registration that must run early). Do NOT add init
      logic beyond the import.
- [x] 2.7 Verify no feature/screen code imports `@react-native-firebase/messaging` directly
      (the seam is the only importer) — consistent with the existing `@/firebase` rule.

## 3. CI proof — seam wiring only (extend the existing firebase test posture)

- [x] 3.1 Extend `mobile/jest/setup-firebase.ts` to `jest.mock("@react-native-firebase/messaging")`
      exposing `getMessaging`, `requestPermission`, `getAPNSToken`, `getToken`, `onMessage`,
      `onTokenRefresh`, `setBackgroundMessageHandler` as `jest.fn()`s (so module-init
      registration and import stay safe off-device).
- [x] 3.2 In `mobile/src/firebase/firebase.test.ts` (firebase.test.ts pattern), assert the seam
      drives the mocked SDK with expected args:
      - `requestNotificationPermission` → `requestPermission` called.
      - `getFcmToken` on iOS → `getAPNSToken` called **before** `getToken`; returns the token.
      - `getFcmToken` on iOS with null APNS → returns `null`, `getToken` NOT called.
      - `getFcmToken` on Android → `getToken` called, no APNS lookup.
      - `onForegroundMessage` → `onMessage` subscribed, returns an unsubscribe.
      - `onFcmTokenRefresh` → `onTokenRefresh` subscribed, returns an unsubscribe.
      - importing the seam → `setBackgroundMessageHandler` called exactly once.
      (Use `Platform.OS` mocking per the existing harness convention for the iOS/Android branches.)
- [x] 3.3 Add a test comment (mirroring the existing firebase.test.ts header) stating CI proves
      the wiring only — it CANNOT assert a real push arrives; that is the device-only step in the
      inbox note.

## 4. Architecture Book — flip Messaging to built (R-1: prose links to the gates)

- [x] 4.1 Write `docs/mobile/architecture-book/decisions/026-fcm-messaging-seam.md` mirroring
      ADR 020/021 rigor (Status / Context / Decision / Consequences / Revisit if). Record: the
      messaging seam shape (four helpers + the top-level background handler), the **iOS
      APNS-token-first** rule, the **background-handler no-native-on-import exception** (the
      narrowed invariant), and the **re-affirmed Expo-Push rejection** (FCM + firebase-admin,
      server unchanged).
- [x] 4.2 Add the ADR 026 row to `docs/mobile/architecture-book/decisions/README.md` index.
- [x] 4.3 In `docs/mobile/architecture-book/firebase.md`: flip "**Auth + Messaging are deferred**"
      (§SDK ~line 9) and the §Deferred list (~line 38) to "**Auth deferred; Messaging built
      (ADR 026)**". Add a `## Cloud Messaging` section recording the seam helpers, the APNS-first
      rule, the background-handler module-init exception (+ the entry side-effect import), and
      that CI proves wiring while real delivery is device-only.
- [x] 4.4 If a runtime native-dep note is warranted, add a `@react-native-firebase/messaging`
      bullet to `docs/mobile/architecture-book/runtime.md` "Native deps & permission config"
      (entitlement + background mode + POST_NOTIFICATIONS, rides static frameworks, prebuild-
      verified) — mirror the expo-camera bullet.
- [x] 4.5 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md`
      (Messaging flipped deferred → built; ADR 026; new dep + config; the background-handler
      exception).

## 5. Human handoff — device-only verification (REQUIRED deliverable, NOT a ship)

- [x] 5.1 Write `docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md`
      (HUMAN note) with a concrete test script: send a test push from the Firebase console /
      server to a seeded token; verify **receipt** (not tap — tap is Ship C) in **foreground**,
      **background**, and **KILLED/cold-start** states, on **both** iOS and Android, in a
      **RELEASE** build. Include: the dev-project (`timecalendar-dev`) **APNs auth key**
      prerequisite (production already has one via Flutter); the **native-crash-not-reported-
      under-expo-dev-client** caveat (verify in release/standalone); the **OEM/Android delivery
      throttling** caveat (slow/missing push on a throttling OEM is not a regression); and that
      **iOS push is impossible on the simulator / emulators can't receive FCM** (physical device
      required). State what is needed / why / how to verify. (HUMAN: device + Firebase console)

## 6. Definition of Done — local verification (foundation isn't done until green)

- [x] 6.1 `cd mobile && npx tsc --noEmit` clean.
- [x] 6.2 `cd mobile && npm run lint` clean (`--max-warnings 0`).
- [x] 6.3 `cd mobile && npm test` green, coverage gate respected (the seam logic is on a logic
      glob → 90%; the new helpers must be exercised by the §3 tests).
- [x] 6.4 Confirm the DoD axes: Architecture (ADR 026 + Book + changelog done), Types, Lint,
      Unit tests, Observability (token errors → `recordError`), i18n (N/A — no user-facing
      strings in Ship A; record the N/A reason), a11y (N/A — no UI in Ship A), Native correctness
      (entitlement/permission/background mode prebuild-verified), and Documentation. The real
      push-delivery axis is **inboxed device-only** (task 5.1) — green wiring + the honest inbox
      note is the bar; do NOT tick a delivery exit criterion off CI green.
