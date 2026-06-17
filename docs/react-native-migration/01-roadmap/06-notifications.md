# Phase 06 — Notifications

> **Goal:** push and local reminders, on Firebase — server side unchanged.
>
> **Depends on:** Phase 03 (identity/tokens) + Phase 01 (Firebase wired). **Modules:** `firebase` (messaging), `notification-subscription` (client), reminders.

> **Status (2026-06-17): COMPLETE.** Shipped serially as four ships — A (FCM receive seam, #192), B (token registration + subscription prefs, #194), C (tap-through routing, #195) all merged; D (local reminders) decided **deferred** in writing (ADR 029). CI proves the seam/route/write **wiring**; the load-bearing **device-only** axes (real push received foreground/background/killed, real tap routing, on both platforms in a release build) are honestly **inboxed for human hardware**, not CI-tickable — green wiring + the device-verification notes is the bar.

## Rough steps

1. **FCM push** via `@react-native-firebase/messaging`; register token with the backend (server `firebase-admin` + `notification-subscription` flow **unchanged**). ✅ **Ship A** (`@/firebase` messaging seam, ADR 026) + **Ship B** (token registration, ADR 027).
2. **Subscription preferences** — frequency/days-ahead settings UI bound to the existing server DTO. ✅ **Ship B** (ADR 027 — PUT-only/local-source-of-truth).
3. **Local reminders** — `expo-notifications` for purely-local event reminders *only if* needed beyond server push (don't double-stack). ⏹️ **Ship D — DEFERRED (ADR 029).** Server push covers all synced calendars; the only gap is personal-event reminders, which the Flutter app never had — net-new scope, not parity (R-2). Recorded as future debt (`inbox/2026-06-17-local-reminders-deferred.md`); no `expo-notifications` dependency added.
4. **Tap-through routing** — notification tap opens the correct calendar/event screen. ✅ **Ship C** (ADR 028 — pure parser + three-state dispatcher; `calendar_changed`→event-details/calendar).

## Exit criteria

- Push received foreground/background/killed; tap routes correctly; both platforms. — **Wiring CI-proven** (mocked-native seam tests + payload→route mapping tests); **real delivery + real tap-from-killed are device-only**, inboxed (`inbox/2026-06-17-fcm-push-receive-device-verification.md`, incl. the Ship-C tap script + the dev-project APNs-key prerequisite + dev-client-crash / OEM-throttling / iOS-simulator caveats). CI cannot receive a real FCM push or simulate a real cold-start tap — honest gap, not a tick.
- Subscription prefs round-trip with the server. ✅ **Met** — PUT-on-change + re-PUT-on-token-refresh CI-proven; the local MMKV store is the source of truth (PUT-only API, no GET — ADR 027), so "round-trips" = the PUT succeeds. A live-server PUT round-trip from a device is inboxed (`inbox/2026-06-17-notification-subscription-review.md`).
- Passes full DoD. ✅ Each ship passed the finite-perfection DoD + reviewer gate before merge.

## Risks & decisions

- **Reject Expo Push** — keep FCM + `firebase-admin` (already decided; **re-affirmed** in ADR 026).
- **Local reminders deferred** — ADR 029 (Ship D): not built; personal-event reminders are future debt (no Flutter parity, R-2).
- OEM/Android delivery throttling is a known, unchanged limitation — no guaranteed delivery time (noted in the device-verification inbox).
- Native crashes aren't reported to Crashlytics under `expo-dev-client` — verify notification reliability in release builds (folded into the device-verification inbox).
</content>
