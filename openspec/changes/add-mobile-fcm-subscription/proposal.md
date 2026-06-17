## Why

Phase 06 Ship A (`add-mobile-fcm-messaging`, ADR 026) landed the `@/firebase` push-**receive** seam: permission, the iOS-APNS-first `getFcmToken`, foreground/background handlers, and `onFcmTokenRefresh`. The token is now obtainable but **nothing registers it with the backend**, so the server's `firebase-admin` sender (which pushes calendar-change notifications) has no device to push to, and the user has no way to set their reminder preferences.

Ship B closes that gap: register the FCM token with the server via the **already-generated** `PUT /notification-subscription` client, and grow Phase 02's Settings with a subscription-preferences sub-screen bound to the server DTO (`frequency` / `nbDaysAhead` / `isActive`). The server (`notification-subscription` module + `firebase-admin` sender) is **done and frozen** — this is purely mobile client wiring, mirroring the Flutter `notification.dart` registration + `subscribeDelay` flow.

The load-bearing wrinkle the planner resolves: the subscription API is **PUT-only — there is NO GET**. Preference state therefore has no server read-back; it must live **locally in MMKV `@/storage`** (the source of truth) and be **PUT idempotently** on every change and on token-refresh. "Round-trips with the server" (the Phase-06 exit criterion) = the PUT succeeds. This is recorded in ADR 027.

## What Changes

- **New feature module `src/features/notifications/`** (`data/` + `ui/`), the home of the FCM-token-registration + subscription concern — distinct from the cross-cutting `@/firebase` seam (which stays receive-only transport) and from Settings (which owns generic device prefs, not a server-bound network write). It consumes the `@/firebase` token/refresh helpers, the durable `user_calendars` read, the generated PUT client, and the `@/storage` seam.
- **Local preference store (`data/prefs.ts`)** over MMKV `@/storage`, mirroring `settings/prefs`: three typed, total-parsed preferences under flat keys (`notifications.frequency` / `notifications.nbDaysAhead` / `notifications.isActive`), with sensible defaults (`immediately` / `7` / `true`) and a reactive read hook. **The local store is the source of truth** (no server read-back — PUT-only API).
- **Subscription registration seam (`data/subscription.ts`)** — wraps the generated `useNotificationSubscriptionControllerCreateOrUpdateSubscription` (PUT) behind a `useSubscriptionRegistration()` hook that assembles the DTO from the local prefs + the `user_calendars` server ids + the Ship-A `getFcmToken`, and **PUTs idempotently**. Re-PUT is wired to `onFcmTokenRefresh` and fires on every preference change. The **only** generated-client import site for this feature (B-1).
- **The first-PUT + zero-calendars + token-refresh policy (ADR 027 / design):** the first registration is triggered after a non-null token is acquired (post-permission-grant), mirroring Flutter `subscribeDelay`; zero held calendars still PUTs (`calendarIds: []`, `isActive` honored) so the server can prune; every prefs change and every token-refresh re-PUTs.
- **Subscription-preferences sub-screen (`ui/notification-settings-screen.tsx`)** — grows Settings with a `frequency` picker (immediately/hourly/daily), an `nbDaysAhead` control (1–30), and an `isActive` toggle, all bound to the local prefs + driving an idempotent re-PUT. A thin `src/app/notification-settings.tsx` route (Stack sibling of `(tabs)`) reached from a Profile entry link (navigation.md route-structure rule).
- **Observability:** a failed subscription PUT → `@/firebase` `recordError(error, "notifications/subscription")` + an **accessible failure surface with Retry** (a retryable network write — the user's reminders silently break if it fails), mirroring the calendar-sources add-calendar failure pattern.
- **Load-bearing ADR (027):** the PUT-only / local-source-of-truth design — where state lives, when the first PUT fires, the zero-calendars + token-refresh re-PUT policy, and why this is a clean idempotent-write design rather than a hack.
- **i18n:** all new user-facing strings added to `en.json` + `fr.json` (FR/EN parity).
- **CI proves the write wiring** (mock-at-mutator): PUT-on-change, re-PUT-on-token-refresh, local persist + read-back (restart-simulation), and the failure path (PUT rejects → `recordError` + error state). CI **cannot** prove a real server-delivered push — that is the device-only Ship-A/exit-criterion verification already inboxed.

## Capabilities

### New Capabilities
- `mobile-fcm-subscription`: FCM-token-to-backend registration + subscription preferences — the local MMKV prefs store (source of truth, total parsers, defaults), the idempotent `PUT /notification-subscription` registration seam (DTO assembled from local prefs + `user_calendars` ids + the Ship-A token; re-PUT on token-refresh + on every prefs change; the first-PUT/zero-calendars policy), the preferences sub-screen, and the failure observability surface. Tap-through routing and local reminders are out of scope (Ships C/D).

### Modified Capabilities
- `mobile-firebase`: the receive seam's `getFcmToken` / `onFcmTokenRefresh` helpers gain their **first consumer** — the subscription registration seam reads the token and re-PUTs on refresh. No change to the seam's shape or posture; the requirement records the consumer edge.

## Impact

- **Code (new):** `mobile/src/features/notifications/` (`data/prefs.ts`, `data/subscription.ts`, `data/types.ts`, `data/index.ts`, `ui/notification-settings-screen.tsx`, `ui/index.ts`, `index.ts` + colocated tests), `mobile/src/app/notification-settings.tsx` (thin route).
- **Code (edit):** the Profile screen (add the notification-settings entry link), `src/app/_layout.tsx` (declare the `notification-settings` Stack sibling), and the registration trigger wiring (a mounted once-effect, mirroring `StartupSync`).
- **i18n:** `mobile/src/i18n/locales/{en,fr}.json` (new `notifications.*` keys, FR/EN parity).
- **Architecture Book:** `decisions/027-*.md` (new ADR), `decisions/README.md` (index row), `firebase.md` (Cloud Messaging — record the registration consumer + the local-prefs-source-of-truth), `features.md` (new Notifications feature section), `architecture-changelog.md` (dated entry).
- **Server:** UNCHANGED. No edits. The generated client is consumed, NOT regenerated.
- **Native:** none — no new dependency, no `app.config.ts`/babel change, no fingerprint bump (rides Ship A's messaging wiring; the generated client + MMKV/`user_calendars` seams already exist).
- **Human-blocked:** the visual + a11y review of the preferences sub-screen on both platforms (DoD native-correctness + manual screen-reader axes), and confirming a real PUT round-trips against the live server from a device — inboxed, do not block. (The real-push-delivery exit criterion is already inboxed by Ship A.)
