# Phase 06 — Notifications

> **Goal:** push and local reminders, on Firebase — server side unchanged.
>
> **Depends on:** Phase 03 (identity/tokens) + Phase 01 (Firebase wired). **Modules:** `firebase` (messaging), `notification-subscription` (client), reminders.

## Rough steps

1. **FCM push** via `@react-native-firebase/messaging`; register token with the backend (server `firebase-admin` + `notification-subscription` flow **unchanged**).
2. **Subscription preferences** — frequency/days-ahead settings UI bound to the existing server DTO.
3. **Local reminders** — `expo-notifications` for purely-local event reminders *only if* needed beyond server push (don't double-stack).
4. **Tap-through routing** — notification tap opens the correct calendar/event screen.

## Exit criteria

- Push received foreground/background/killed; tap routes correctly; both platforms.
- Subscription prefs round-trip with the server.
- Passes full DoD.

## Risks & decisions

- **Reject Expo Push** — keep FCM + `firebase-admin` (already decided). 
- OEM/Android delivery throttling is a known, unchanged limitation — no guaranteed delivery time.
- Native crashes aren't reported to Crashlytics under `expo-dev-client` — verify notification reliability in release builds.
</content>
