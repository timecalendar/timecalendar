# 026 — FCM push-receive grown into the `@/firebase` seam (iOS APNS-first, one top-level background handler, Expo Push re-rejected)

> Origin: the `add-mobile-fcm-messaging` change (Phase 06 Ship A — the load-bearing
> receive seam), design Decisions 2/3/4. Builds on the Crashlytics/Analytics
> `@/firebase` seam (its wrapper-seam + lazy-native-on-import posture) and reuses the
> i18n side-effect-import pattern for the one place that posture is bent.

## Status

Accepted.

## Context

Phase 06 needs the app to **receive** Firebase Cloud Messaging push, mirroring the live
Flutter app (`modules/firebase/services/notification/notification.dart` +
`background_handler.dart`), which shares the production project
(`timecalendar-samuelprak`) and already ships push. The transport decision is **frozen**:
FCM + the server `firebase-admin` sender + the `notification-subscription` PUT flow; the
server is done and **unedited**. This ship is purely client wiring — and it is the
*first* messaging ship, so the seam shape it sets is copied by the later token-registration
/ tap-routing / reminders ships and is costly to re-decide (R-4 → an ADR).

Three forces make this load-bearing:

1. The existing `@/firebase` seam has a hard invariant: **importing it never touches
   native** (each helper resolves `getMessaging()`/`getCrashlytics()` lazily inside its
   body, so Jest stays safe). RNFB's `setBackgroundMessageHandler` **must** be registered
   at the top level before the JS app finishes booting — a handler registered late (e.g.
   inside a component effect) misses background/quit-state messages and warns/throws. The
   two directly conflict.
2. On iOS the FCM token is undefined until APNS has vended its token; calling `getToken`
   before a non-null `getAPNSToken` races and can error.
3. A reader could later "simplify" the seam back to purity (drop the side-effect import)
   and silently break quit-state push, or reorder the iOS token path and reintroduce the
   race — neither is caught by tsc/lint/Jest.

## Decision

**Grow the existing `@/firebase` module** (not a submodule, not a class) with four
messaging helpers, each resolving `getMessaging()` lazily inside its body exactly like the
Crashlytics/Analytics helpers — `requestNotificationPermission`, `getFcmToken`,
`onForegroundMessage`, `onFcmTokenRefresh` — plus one top-level registration.

- **iOS APNS-token-FIRST guard (load-bearing).** `getFcmToken` branches on `Platform.OS`:
  on iOS it calls `getAPNSToken` first and returns `null` (caller retries next
  refresh/foreground cycle) **without** calling `getToken` when APNS is not yet available;
  otherwise it returns `getToken`. On Android it calls `getToken` directly (no APNS
  concept). `getToken` errors are caught → `recordError` (the existing observability seam)
  → `null`. Exact parity with Flutter `getFcmToken`. **The rule: on iOS, never call
  `getToken` before a non-null `getAPNSToken`.**

- **The background-message handler is the ONE documented exception to no-native-on-import
  (load-bearing).** `setBackgroundMessageHandler(getMessaging(), handler)` runs at module
  init — the only top-level native access in the seam. To keep import Jest-safe,
  `jest/setup-firebase.ts` mocks `@react-native-firebase/messaging` so the init call hits a
  `jest.fn()`, and the proof test asserts it fired exactly once. For the handler to register
  during boot the seam must be imported early; the harness-correct site is a **side-effect
  `import "@/firebase"` in the Expo Router entry** (`src/app/_layout.tsx`), mirroring the
  i18n side-effect import. This is the **inverse of the Crashlytics rationale** (Crashlytics
  needs no startup import because it auto-installs natively; the background handler is a JS
  registration that must run early). The invariant is **narrowed in prose + spec** to "no
  native on import *except* the background handler," not silently broken — it is one call,
  lint-mockable, test-asserted.

- **Expo Push re-rejected (re-affirmed, not re-litigated).** The app uses FCM directly via
  RNFB messaging; the sender is the existing server `firebase-admin` +
  `notification-subscription`, frozen. The seam exists so the app is decoupled from the
  SDK, not so the transport is swappable to Expo Push — that is closed.

- **Native wiring.** `@react-native-firebase/messaging` v24 (matching the installed RNFB
  `app`/`crashlytics`/`analytics` `^24.1.1`) as a config-plugin entry; iOS `aps-environment`
  entitlement (declared explicitly in `ios.entitlements` — the RNFB messaging plugin does
  NOT inject it; it only wires the Android notification icon) and
  `UIBackgroundModes: ["remote-notification"]`; Android `POST_NOTIFICATIONS`. Rides the
  existing `ios.useFrameworks: "static"` set (no new `expo-build-properties`);
  `ios.forceStaticLinking` is the escape if a pod breaks. Config-shape, prebuild-verified
  (R-1) — `tsc`/lint/Jest don't read entitlements/permissions.

*Rejected:* a separate `@/firebase/messaging` submodule (dilutes "the single place the app
touches Firebase" for four helpers); a stateful singleton mirroring Flutter's
`NotificationService` (reintroduces startup state the RN seam deliberately lacks);
registering the background handler in a root effect (misses quit-state messages — the exact
constraint); a separate non-`@/firebase` registration file (splits the seam and imports the
messaging package from outside it); leaving the seam pure and documenting background push as
"not wired" (background receipt is a Phase-06 exit criterion).

## Consequences

- The later Phase-06 ships (token→backend registration, prefs UI, tap-routing, local
  reminders) build on a settled, lint-encoded receive seam — they extend, they don't
  re-decide.
- The `@/firebase` no-native-on-import invariant now has **exactly one** documented hole;
  it is mocked suite-wide and asserted once. The proof tests prove the **wiring only**
  (permission / APNS-first token order / `onMessage` / `onTokenRefresh` /
  `setBackgroundMessageHandler` driven with the expected args). **CI cannot prove a real
  push arrives** — that is device-only (foreground/background/**killed**, both platforms,
  **release** build) and is recorded in
  `docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md`.
- The native change (new plugin + dep + entitlement/permission) forces a fresh build under
  the `runtimeVersion` fingerprint policy — no silently-incompatible OTA. Correct.
- The dev project `timecalendar-dev` needs its own APNs auth key before any dev-build push
  test (production already has one via Flutter) — a console prerequisite, inboxed.

## Revisit if

- A messaging pod breaks under static frameworks → `ios.forceStaticLinking` (verified by
  prebuild), same posture as the rest of RNFB.
- RNFB changes the background-handler registration contract (a later version no longer
  requires the top-level call) → the side-effect import + the narrowed invariant can be
  reconsidered; until then, **do not "fix" the `import "@/firebase"` out of the entry** — it
  is load-bearing for quit-state push.
- A second top-level native need appears in the seam → re-weigh "exactly one exception" (it
  may mean the seam should own a real init step, the way i18n does).
- The transport decision reopens (e.g. a move to Expo Push for some surface) → a new ADR
  supersedes this one's Decision-4 clause; the seam shape itself is reusable.
