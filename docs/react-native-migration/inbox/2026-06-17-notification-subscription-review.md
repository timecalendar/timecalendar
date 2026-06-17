# Notification subscription — visual + screen-reader review & live-PUT round-trip

**Date:** 2026-06-17
**Roadmap:** Phase 06 Ship B (FCM-token-to-backend registration + subscription preferences)
**Change:** `add-mobile-fcm-subscription`
**ADR:** [027](../../../docs/mobile/architecture-book/decisions/027-fcm-subscription-registration.md)
**For:** Samuel (needs a real device + the live server — the autonomous loop and CI cannot do either)

This is the **device-only half** of Ship B's Definition of Done. CI proves the **write
wiring** — `data/subscription.test.tsx` drives the REAL generated PUT mutation through the
mocked `customFetch` mutator and asserts PUT-on-change, re-PUT-on-token-refresh, null-token →
no-PUT, zero-calendars → `calendarIds: []`, and the failure path (PUT rejects → `recordError`
+ `isError`); `data/prefs.test.ts` + `data/restart.test.ts` prove the local store persists and
survives a (simulated) restart; `ui/notification-settings-screen.test.tsx` proves the screen
reflects the store, drives the mutators, and renders the failure surface + Retry. CI **cannot**:
(1) observe the screen's real native rendering / a real screen-reader pass, or (2) confirm a real
`PUT /notification-subscription` reaches the live server and the local store + server converge.
Those are this manual pass.

## Why this is needed / what it proves

- **The DoD native-correctness + a11y axes** (visual review + manual VoiceOver/TalkBack) — the
  jest harness mocks `@expo/ui` and `Switch`, so it proves the wiring but not the native feel,
  the OS picker popup, the switch's screen-reader announcement, Dynamic Type, contrast, or the
  alert live-region actually announcing on a real screen reader.
- **The Phase-06 exit criterion "round-trips with the server"** = the PUT succeeds (ADR 027 —
  the API is PUT-only, there is deliberately no read-back to assert against). CI mocks the
  mutator, so a real server round-trip must be confirmed from a device once.

## How to verify

### A. Visual + screen-reader review (both platforms — iOS + Android, physical devices)

1. Build the dev variant, open **Profile → Notifications** (the new entry link).
2. **Visual:** the title is a heading; the frequency picker, the 1..30 `nbDaysAhead` stepper
   (`+` / `−`, disabled at the bounds), and the `isActive` switch render with native chrome and
   adequate spacing/contrast in **both light and dark** schemes. Bump **Dynamic Type / font
   scale** to the largest step — nothing clips or overlaps.
3. **Screen reader (VoiceOver on iOS, TalkBack on Android):**
   - The title is announced as a heading.
   - Each control announces its translated label (frequency / "Increase days ahead" /
     "Decrease days ahead" / "Enable notifications") and its current value/state.
   - The stepper buttons announce **disabled** at 1 (decrement) and 30 (increment).
   - Force a failure (see B.3) and confirm the **alert live-region** announces the failure
     message and the **Retry** button is reachable and announces its label.
4. Run it in **FR and EN** (Settings → Language) — every string is translated, no raw keys.

### B. Live-server PUT round-trip (one platform is enough)

1. Point the dev build at the **live server** (`EXPO_PUBLIC_API_URL`), signed in with at least
   one held calendar.
2. Grant the notification permission when prompted; change a preference (e.g. frequency →
   daily, or nudge `nbDaysAhead`). Confirm via a **proxy / server log** that a
   `PUT /notification-subscription` fires carrying the new value, the device's **FCM token**,
   and `calendarIds` = the **server calendar ids** of the held calendars (NOT the tokens) — and
   returns **204**. Server-side, confirm the subscription row reflects the new value (the local
   store + server have converged).
3. **Failure path:** kill the network (airplane mode) and change a preference — confirm the
   screen shows the accessible failure surface + Retry, a Crashlytics `recordError` is logged
   (context `notifications/subscription`), and **Retry** after restoring the network succeeds.
4. **Zero-calendars prune:** remove all held calendars, change a preference, and confirm the PUT
   carries `calendarIds: []` (the server prunes the device's calendar set).
5. **Token-refresh re-PUT** (best-effort): if a token refresh can be triggered, confirm a re-PUT
   fires carrying the new token.

## Notes

- The real push **delivery** (does a calendar-change notification actually arrive?) is the
  separate device-only axis already inboxed by Ship A
  (`2026-06-17-fcm-push-receive-device-verification.md`). This note is the **registration +
  preferences** half: the PUT round-trips and the screen is correct/accessible.
- Do **not** tick the delivery exit criterion off CI green — green write wiring + this honest
  device note is the bar for Ship B.
