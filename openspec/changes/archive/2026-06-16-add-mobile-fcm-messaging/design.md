## Context

The `@/firebase` seam (`mobile/src/firebase/index.ts`) currently wraps Crashlytics + Analytics
over the `@react-native-firebase` v24 modular API, with a deliberate posture: **no startup
side-effect** (no `import "@/firebase"` in `_layout.tsx`) and **lazy native resolution** (each
helper calls `getCrashlytics()` / `getAnalytics()` inside its body, so importing the module
never touches native — Jest stays safe via `jest/setup-firebase.ts`). `firebase.md` records
"Auth + Messaging are deferred (R-2: no speculative adoption)."

Phase 06 Ship A needs **push receive**. The transport decision is already made and frozen: FCM
+ server `firebase-admin` + the `notification-subscription` PUT flow, Expo Push rejected. The
production project (`timecalendar-samuelprak`) is shared with the live Flutter app that already
ships push, so the production APNs key + FCM sender already exist. This ship is **client wiring**:
grow the seam, add the native dep, prove the wiring in CI, and inbox the device-only real-push
verification.

The parity reference is the Flutter `modules/firebase/services/notification/notification.dart`
+ `background_handler.dart`: `getFcmToken` (iOS APNS-token-first guard — `getAPNSToken` then
`getToken`, return null if APNS absent), foreground `onMessage`, `requestPermission`, a
top-level `firebaseMessagingBackgroundHandler`, and an implicit token lifecycle.

## Goals / Non-Goals

**Goals:**
- Extend `@/firebase` with messaging: `requestNotificationPermission`, `getFcmToken` (iOS
  APNS-first), `onForegroundMessage`, `onFcmTokenRefresh`, and a top-level background handler.
- Add `@react-native-firebase/messaging` v24 + config-plugin / entitlement / permission wiring.
- Preserve the lazy-native-on-import posture everywhere except the one place the harness forbids.
- Prove the seam wiring in CI; inbox the device-only delivery verification.
- Flip `firebase.md` Messaging deferred → built; ADR 026; changelog entry.

**Non-Goals (Ships B/C/D):**
- Registering the token with the backend (`PUT /notification-subscription`) — Ship B.
- Subscription-preferences UI — Ship B.
- Tap-through routing (`onNotificationOpenedApp` / `getInitialNotification`, action dispatch on
  `message['action']`) — Ship C.
- Local reminders (`expo-notifications`) — Ship D.
- Any server change — server is frozen, read-only parity reference.

## Decisions

### Decision 1 — One seam helper per messaging concern, lazy native inside each (mirror the existing posture)

The messaging surface is added to the **same** `@/firebase` module, one exported helper per
concern, each resolving `getMessaging()` lazily inside its body — identical to how `logEvent` /
`recordError` resolve `getAnalytics()` / `getCrashlytics()`. Helpers:

- `requestNotificationPermission(): Promise<void>` → messaging `requestPermission` (iOS
  UNUserNotification prompt; on Android 13+ RNFB's `requestPermission` triggers the runtime
  `POST_NOTIFICATIONS` request). Mirrors Flutter `subscribe()`.
- `getFcmToken(): Promise<string | null>` → the APNS-first guard (Decision 3).
- `onForegroundMessage(handler): () => void` → messaging `onMessage`, returns the unsubscribe.
- `onFcmTokenRefresh(handler): () => void` → messaging `onTokenRefresh`, returns the unsubscribe.

*Alternatives:* (a) a separate `@/firebase/messaging` submodule — rejected: the seam is "the
single place the app touches Firebase"; splitting it dilutes that and gains nothing for four
helpers. (b) a class/singleton mirroring Flutter's `NotificationService` — rejected: the RN
seam is functions + lazy resolution; a stateful singleton reintroduces startup state we
deliberately don't have.

### Decision 2 (load-bearing, → ADR 026) — The background-message handler is the ONE documented exception to the no-native-on-import posture

`setBackgroundMessageHandler` **must** be registered at the top level, before the app finishes
booting — RNFB documents this hard constraint (a handler registered late, e.g. inside a
component effect, misses background/quit-state messages and warns/throws). This directly
conflicts with the seam's invariant that *importing `@/firebase` never touches native*.

**Resolution: accept a single, explicitly-documented top-level native call** — the
`setBackgroundMessageHandler(getMessaging(), handler)` registration runs at module init in
`@/firebase`. This is the only top-level native access in the seam. To keep import safe in Jest,
`jest/setup-firebase.ts` mocks `@react-native-firebase/messaging` so the module-init call hits a
`jest.fn()` and the proof test asserts it was called once. There is **no `import "@/firebase"`
in `_layout.tsx`** today; for the background handler to register, the seam must be imported
during boot. The natural, harness-correct site is the **Expo Router entry** — adding a single
side-effect import so the module (and thus the handler) loads before the app fully initializes.
This mirrors how i18n is a side-effect import in `_layout.tsx`, and is the inverse of the
crashlytics rationale (crashlytics needed none because it auto-installs natively; messaging's
background handler is a JS registration that must run early).

This is an **escape-hatch-shaped** decision (ship-loop "stop-the-bleeding"): it bends a stated
invariant. It is **clean, not a hack** — it is one call, lint-mockable, test-asserted, and the
invariant is narrowed in prose + spec to "no native on import *except* the background handler"
rather than silently broken. It does **not** rise to a hard architectural blocker, so the
worklist continues. The ADR records it so a future reader doesn't "fix" the side-effect import
back out and silently break quit-state push.

*Alternatives:* (a) register inside a root effect — rejected: misses quit-state messages, the
exact RN harness constraint. (b) a separate non-`@/firebase` `index.js` registration file
imported by the entry — rejected: splits the messaging seam in two and the registration would
import the messaging package outside the seam, violating the "feature code never imports
`@react-native-firebase/*`" rule from a worse angle. (c) leave the seam pure and document that
background push "isn't wired" — rejected: background receipt is a core Phase-06 exit criterion.

### Decision 3 (load-bearing, → ADR 026) — iOS APNS-token-FIRST guard, exact Flutter parity

`getFcmToken` branches on `Platform.OS`:
- **iOS:** `const apns = await getAPNSToken(messaging); if (apns == null) return null;` then
  `return getToken(messaging)`. On iOS the FCM token is undefined until APNS has vended its
  token; calling `getToken` first races and can error. Returning `null` (rather than throwing)
  lets the caller (Ship B) retry on the next token-refresh/foreground cycle — same contract as
  Flutter `getFcmToken`, which returns null when `getAPNSToken()` is null.
- **Android:** `return getToken(messaging)` directly — no APNS concept.

Errors from `getToken` are caught and surfaced via the existing `recordError` seam (mirrors
Flutter's `catchError` → logger), returning `null`. This is the ADR's third load-bearing rule:
*on iOS, never call `getToken` before a non-null `getAPNSToken`.*

### Decision 4 (load-bearing, → ADR 026) — Re-affirm Expo Push rejection; server unchanged

ADR 026 re-affirms (does not re-litigate) the rejection of Expo's push service: the app uses
FCM directly via RNFB messaging; the sender is the existing server `firebase-admin` +
`notification-subscription`, frozen and unedited. The seam exists so the app is decoupled from
the SDK, not so the transport is swappable to Expo Push — that is closed.

### Decision 5 — Native wiring: plugin entry + entitlement + background mode + Android permission, riding static frameworks

`app.config.ts` gains:
- `"@react-native-firebase/messaging"` in `plugins` (alongside the existing app/crashlytics/
  analytics entries).
- iOS: `aps-environment` entitlement (RNFB's messaging plugin adds it; declared/verified at
  prebuild) and `infoPlist.UIBackgroundModes: ["remote-notification"]` so background data
  messages wake the app.
- Android: `POST_NOTIFICATIONS` in `android.permissions` (Android 13+ runtime permission;
  paired with the runtime request in `requestNotificationPermission`).

Messaging rides the **existing** `ios.useFrameworks: "static"` set — no new `expo-build-properties`
(same as expo-camera/sqlite/mmkv). If a messaging pod breaks under static linking, the documented
escape is `ios.forceStaticLinking` for the RNFB pods (firebase.md). All of this is **config-shape,
prebuild-verified (R-1)** — `tsc`/lint/Jest don't read entitlements/permissions; a real
`expo prebuild` / device build is the proof. The `runtimeVersion` fingerprint policy means this
native change forces a fresh build (no silently-incompatible OTA) — correct.

### Decision 6 — ADR number 026; Book + changelog edits are tasks, not silent

Next free ADR is **026** (highest existing is 025). The implementer writes
`docs/mobile/architecture-book/decisions/026-fcm-messaging-seam.md` (mirroring ADR 020/021
rigor: Status/Context/Decision/Consequences/Revisit-if), adds the index row in
`decisions/README.md`, flips `firebase.md`'s "Auth + Messaging are deferred" to "Auth deferred;
Messaging built (ADR 026)" in both the §SDK list (~line 9) and the §Deferred list (~line 38),
adds a `## Cloud Messaging` section to `firebase.md` recording the seam helpers + the APNS-first
rule + the background-handler exception, and appends a dated entry to
`architecture-changelog.md`. These are enumerated in tasks.md (R-1: the spec/lint/test carry the
rule; the prose links to them).

## Risks / Trade-offs

- **[Background handler bends the no-native-on-import invariant]** → Narrow the invariant in
  prose + spec to "except the background handler," mock it in `jest/setup-firebase.ts`, assert
  it in the proof test, and record the why in ADR 026 so it isn't "fixed" away.
- **[CI cannot prove a real push arrives]** → Explicit non-goal; spec says so; device verification
  is an inbox HUMAN note (foreground/background/**killed**, both platforms, **release** build).
- **[iOS push is impossible on the simulator; emulator can't receive FCM]** → Device-only;
  inboxed with a concrete test script and the physical-device requirement.
- **[Dev project `timecalendar-dev` may lack an APNs auth key]** → Production already has one via
  Flutter; the dev project needs its own APNs key uploaded in the console for any dev-build push
  test. Console + hardware → inbox HUMAN note (not a ship).
- **[Native crashes aren't reported to Crashlytics under expo-dev-client]** → Verify push
  reliability in a release/standalone build; folded into the device-verification note.
- **[OEM/Android delivery throttling]** → Known, unchanged limitation (no guaranteed delivery
  time); noted in the device-verification inbox so a slow/missing push on a throttling OEM isn't
  mistaken for a regression.
- **[A messaging pod breaks under static frameworks]** → `ios.forceStaticLinking` escape, verified
  by prebuild; same posture as the rest of RNFB.

## Migration Plan

No data migration. Additive: new dep + new seam helpers + native config. Rollback = revert the
plugin entry, the dep, and the seam additions; the existing Crashlytics/Analytics seam is
untouched in shape (only the wrapper-seam requirement's prose widens). The fingerprint runtime
policy guarantees the native change ships as a fresh build, never a broken OTA.

## Open Questions

None blocking. The Expo Router entry side-effect-import site (vs. a dedicated entry registration
file) is settled by Decision 2 (entry side-effect import, mirroring i18n) — the implementer picks
the exact entry file but the shape is fixed.
