## Why

Phase 06 (notifications) needs the app to **receive** Firebase Cloud Messaging push, mirroring the live Flutter app — which shares the production Firebase project (`timecalendar-samuelprak`) and already ships push. The server (`firebase-admin` sender + `notification-subscription` PUT flow) is **done and frozen**; this is purely client-side wiring. Ship A is the load-bearing first ship: it grows the existing `@/firebase` seam with messaging, adds the native dep, and proves the seam wiring in CI — so the later ships (token registration, tap-routing, reminders) build on a settled, lint-encoded receive seam rather than re-deciding it.

## What Changes

- **Extend the `@/firebase` seam** (`mobile/src/firebase/index.ts`) with a messaging surface mirroring Flutter `notification.dart`:
  - `requestNotificationPermission` — iOS `UNUserNotification` authorization + Android 13+ `POST_NOTIFICATIONS` runtime request.
  - `getFcmToken` — with the **iOS APNS-token-FIRST guard** (call `getAPNSToken` before `getToken`; return `null` when APNS is not yet available, exactly like Flutter `getFcmToken`).
  - `onForegroundMessage(handler)` — foreground `onMessage` subscription (returns an unsubscribe).
  - `onFcmTokenRefresh(handler)` — token-refresh listener (returns an unsubscribe).
  - **Top-level `setBackgroundMessageHandler`** registered at module init (RN harness constraint — must register before the JS app finishes booting). This is the **one** place the no-startup-side-effect / lazy-native posture is bent; resolved explicitly in design.md.
- **New native dep `@react-native-firebase/messaging` v24** (matches the installed RNFB `app`/`crashlytics`/`analytics` `^24.1.1`): config-plugin entry in `app.config.ts`, iOS push entitlement (`aps-environment`) + `UIBackgroundModes: ["remote-notification"]`, Android `POST_NOTIFICATIONS` permission. Rides the existing iOS `useFrameworks: "static"` set; `ios.forceStaticLinking` is the documented pod escape.
- **Load-bearing ADR (026):** the messaging seam shape, re-affirming the Expo-Push rejection (FCM + `firebase-admin`, server unchanged) and the iOS-APNS-first token rule.
- **Flip the Architecture Book:** `firebase.md` "Auth + Messaging are deferred" → Messaging built (Auth stays deferred); append a dated entry to `architecture-changelog.md`.
- **CI proves SEAM WIRING ONLY:** extend `jest/setup-firebase.ts` to mock native messaging; tests assert the seam drives permission / token (APNS-first ordering) / `onMessage` / `setBackgroundMessageHandler` / `onTokenRefresh` with expected args. CI **cannot** prove a real push arrives — that is device-only and is inboxed.
- **Device-verification inbox note** (HUMAN handoff): real push received foreground / background / **killed**, on **both** platforms, in a **RELEASE** build; dev-project APNs-key prerequisite; native-crash-under-dev-client + OEM-throttling caveats.

## Capabilities

### New Capabilities
- `mobile-fcm-messaging`: the FCM push-receive seam — permission request, FCM-token retrieval with the iOS APNS-first guard, foreground-message subscription, top-level background-message handler, token-refresh listener, and the native-dep/config-plugin wiring (iOS entitlement + background mode, Android permission). Receive + seam only — token-to-backend registration, subscription-preferences UI, tap-routing, and local reminders are out of scope (Ships B/C/D).

### Modified Capabilities
- `mobile-firebase`: the "Auth + Messaging are deferred" rule changes — Messaging is now **built** behind the `@/firebase` seam (Auth stays deferred). The seam's no-startup-side-effect posture gains one documented exception (the top-level background handler).

## Impact

- **Code:** `mobile/src/firebase/index.ts` (extend), `mobile/src/firebase/firebase.test.ts` (new assertions), `mobile/jest/setup-firebase.ts` (mock messaging), `mobile/app.config.ts` (plugin + entitlement + permission + background mode), `mobile/package.json` + lockfile (new dep).
- **Architecture Book:** `firebase.md` (Messaging built), `architecture-changelog.md` (dated entry), `decisions/026-*.md` (new ADR), `decisions/README.md` (index row).
- **Native:** iOS `aps-environment` entitlement + `UIBackgroundModes` remote-notification; Android `POST_NOTIFICATIONS`. Verified only by a real `expo prebuild` / device build (config-shape, not source).
- **Server:** UNCHANGED. No edits.
- **Human-blocked:** real push delivery (foreground/background/killed, both platforms, release build) + dev-project APNs key are device/console-only — inboxed, do not block.
