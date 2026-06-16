# FCM push receive — device-only delivery verification

**Date:** 2026-06-17
**Roadmap:** Phase 06 Ship A (FCM push receive + the messaging seam)
**Change:** `add-mobile-fcm-messaging`
**ADR:** [026](../../../docs/mobile/architecture-book/decisions/026-fcm-messaging-seam.md)
**For:** Samuel (needs a real device + the Firebase console — the autonomous loop and CI cannot do this)

This is the **device-only delivery axis** for the push-receive ship. CI proves the seam
**WIRING ONLY** — `src/firebase/firebase.test.ts` drives the mocked native messaging and
asserts the seam calls `requestPermission`, `getAPNSToken`/`getToken` (in the iOS APNS-first
order), `onMessage`, `onTokenRefresh`, and registers `setBackgroundMessageHandler` exactly
once at module init. CI **cannot** prove a real push **arrives** on a device: it can't run
APNs/FCM, can't observe the OS notification tray, and can't exercise the background/killed
process states. Those are this manual pass. **Receipt only** — tapping a notification to route
into the app is Ship C, not verified here.

## Prerequisites

1. **A physical device for each platform.** iOS push is **impossible on the simulator**
   (no APNs) and the Android emulator can't reliably receive FCM without Play Services /
   real-device delivery — a **physical iPhone and a physical Android phone** are required.
2. **The `timecalendar-dev` project needs its own APNs auth key.** Production
   (`timecalendar-samuelprak`) already has one via the Flutter app, but a **dev build**
   (`fr.samuelprak.timecalendar.dev`) talks to `timecalendar-dev`, which needs its **own**
   APNs Authentication Key (.p8) uploaded under *Project settings → Cloud Messaging → Apple
   app configuration*. Without it, iOS dev-build push silently never arrives. (Android dev
   push works off the committed `google-services.dev.json` with no extra key.)
3. **Test in a RELEASE / standalone build, not the dev client.** Native crashes are **not
   reported to Crashlytics under expo-dev-client**, and the dev client's process lifecycle
   differs from a store build's — so verify foreground/background/killed in a **release**
   build (an EAS `preview`/`production` profile build, or `expo run:* --variant release`),
   not `expo start` + dev client.

## How to send a test push

Either of:

- **Firebase console** → *Engage → Messaging → New campaign → Notifications* (or the
  "Test on device" flow): paste the device's FCM token (log it from the app — call the seam's
  `getFcmToken()` from the dev panel or a temporary log), send. For a **data** message that
  exercises the background handler, use the *Additional options → Custom data* fields (a
  notification-only message does not invoke `setBackgroundMessageHandler`).
- **A direct FCM send** (curl / `firebase-admin` from a scratch script) to the token, with a
  `data` payload, to exercise the background path explicitly.

Use the **dev** project's console/credentials when testing the dev build, the **production**
project's for a production build (one Firebase project per environment — `firebase.md`).

## The matrix to verify (receipt only)

For **each platform** (iOS physical, Android physical), in a **release** build:

| State | How to get there | Expected |
| --- | --- | --- |
| **Foreground** | App open and visible | `onForegroundMessage` fires — confirm via a temporary log/toast (the OS does **not** show a tray notification for a foreground message by default; the JS handler is the proof) |
| **Background** | App backgrounded (home button / app switcher), not killed | A notification-payload message shows in the tray; a `data` message wakes the app and the **background handler** runs (temporary log) |
| **Killed / cold start** | App swiped away from the app switcher (fully terminated) | The push still arrives in the tray; the **background handler** still runs for a data message — this is exactly why `setBackgroundMessageHandler` is registered at module init (ADR 026), and the state CI cannot reach |

Also confirm: **permission prompt** appears on first `requestNotificationPermission()` (iOS
authorization sheet; Android 13+ `POST_NOTIFICATIONS` runtime dialog) and denying it suppresses
delivery as expected.

## Caveats — do not mistake these for regressions

- **Native crash not reported under the dev client.** Verify reliability in a release/standalone
  build; a clean dev-client run is **not** proof the release build is crash-free on the push path.
- **OEM / Android delivery throttling.** Many Android OEMs (Xiaomi, Huawei, Samsung power-saving,
  etc.) throttle or delay background FCM delivery aggressively — there is **no guaranteed delivery
  time**. A slow or missing push on a throttling OEM (especially after the app has been killed and
  the device idle) is a **known platform limitation, not a regression** in this ship.
- **iOS simulator / Android emulator can't receive FCM** — a missing push there is expected; use
  physical devices only.

## What this verifies vs. what it doesn't

- **Verifies:** a real push is *received* in all three process states on both platforms (the
  Phase-06 receive exit criterion), and the permission prompt behaves.
- **Does NOT verify (later ships):** registering the token with the backend
  (`PUT /notification-subscription`, Ship B), the subscription-preferences UI (Ship B),
  tap-through routing (Ship C), local reminders (Ship D). **Do not tick a delivery exit
  criterion off CI green** — green wiring + this honest device pass is the bar.
