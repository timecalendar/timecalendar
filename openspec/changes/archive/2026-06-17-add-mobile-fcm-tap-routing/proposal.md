## Why

Phase 06 Ship A (`add-mobile-fcm-messaging`, ADR 026) landed the `@/firebase` push-**receive** seam and Ship B (`add-mobile-fcm-subscription`, ADR 027) registers the token + persists preferences. Pushes now arrive, but **tapping a notification does nothing useful** — the app does not route the user to what changed, and a foreground push does not refresh the calendar. The server's `firebase-admin` sender (frozen) emits a `calendar_changed` data message **per changed event**; the device must (a) refresh the calendar when it learns a calendar changed and (b) open the affected event when the user taps the notification — across all three app states (foreground, background, killed/cold-start).

This is the Flutter parity gap: Flutter's `NotificationService` dispatches on `message['action']` and its single registered `CALENDAR_CHANGED` listener triggers a sync. RN improves on it: because the `calendar_changed` payload carries the changed `event.uid` and mobile already has an `event-details/[uid]` route, a **tap can deep-link to the event**, not just refresh.

The server is **done and frozen** — this is purely mobile client wiring.

## What Changes

- **Two new `@/firebase` seam helpers** (`mobile/src/firebase/index.ts`), mirroring the existing lazy-resolve-native posture so importing the seam stays Jest-safe: `onNotificationOpenedApp(handler)` (the background→foreground tap entrypoint) and `getInitialNotification()` (the killed/cold-start tap entrypoint). The existing `onForegroundMessage` is reused for the foreground case.
- **A pure payload→route parser (`data/tap-routing.ts`)** in the `features/notifications/` module: `parseNotificationRoute(message)` decodes the server's `data: { action: "calendar_changed", payload: JSON.stringify({ type, event }) }` contract and returns `{ kind: "event", uid }` for `NEW`/`EDIT`, `{ kind: "calendar" }` for `CANCEL` (the event is gone — no dead detail page), or `null` for anything it does not handle (no data, a non-`calendar_changed` action, an unparseable payload, a missing `event.uid`). A JSON parse failure is recorded via `@/firebase` `recordError` and yields `null` — never a crash. This is the branch-heavy, fully unit-testable core.
- **A tap-routing dispatcher hook (`data/tap-routing.ts` / `useNotificationTapRouting`)**, mounted once in the root layout next to Ship B's `useNotificationRegistration`, wiring the three messaging entrypoints to the calendar sync + the router:
  - **Foreground** (`onForegroundMessage`): a `calendar_changed` message triggers a calendar **sync/refetch** and does **NOT** navigate (Flutter parity — never yank the user mid-use).
  - **Background tap** (`onNotificationOpenedApp`) and **killed/cold-start** (`getInitialNotification`, resolved in a mount effect so the root navigator is already mounted): **sync/refetch** then **navigate** per `parseNotificationRoute` — `event` → `router.push('/event-details/<uid>')`, `calendar` → `router.push('/calendar')`. A `null` route or a `null` initial notification is a safe no-op.
- **The refetch** reuses the existing calendar sync seam (`useSyncCalendars().sync` from `@/features/calendar/data`) — the same orchestrator the startup sync + pull-to-refresh use. No new sync path.
- **Load-bearing ADR (028):** the payload→route contract, the `NEW`/`EDIT`→event-details vs `CANCEL`→calendar decision, the foreground-refetch-only rule, the R-2 guard (the server emits **only** `calendar_changed`; unknown actions are ignored gracefully — no speculative handlers), and the deep-link uid-match assumption (the synced `calendarEvents.uid` equals the push `event.uid`, both the iCal uid; on mismatch the detail screen degrades gracefully to not-found).
- **CI proves the payload→route mapping** (mock-at-mutator + a mocked router): `NEW`/`EDIT` → push `event-details/[uid]` + refetch; `CANCEL` → `/calendar` + refetch; foreground → refetch + **no** navigation; malformed payload → no-op + `recordError`; null initial notification → no-op. CI **cannot** prove a real tap-from-KILLED — that is device-only and inboxed.

## Capabilities

### New Capabilities
- `mobile-fcm-tap-routing`: notification tap-through routing — the pure `calendar_changed` payload→route parser (the `NEW`/`EDIT`→event vs `CANCEL`→calendar contract, defensive parsing), and the three-app-state dispatcher (foreground refetch-only; background + cold-start refetch-then-navigate) wired through the `@/firebase` tap entrypoints, the calendar sync seam, and the Expo Router. Local reminders are out of scope (Ship D).

### Modified Capabilities
- `mobile-firebase`: the receive seam gains two tap entrypoints (`onNotificationOpenedApp`, `getInitialNotification`) following the same lazy-resolve-native, native-safe-import posture as the existing messaging helpers.

## Impact

- **Code (new):** `mobile/src/features/notifications/data/tap-routing.ts` (+ colocated test). The `@/firebase` seam gains two exported helpers.
- **Code (edit):** `mobile/src/firebase/index.ts` (two helpers + their mock in `mobile/jest/setup-firebase.ts`), `mobile/src/app/_layout.tsx` (mount the tap-routing hook beside `NotificationRegistration`), `mobile/src/features/notifications/data/index.ts` + `index.ts` (barrel export).
- **i18n:** any new user-facing string (a foreground "calendar updated" affordance, if added) → `en.json` + `fr.json` (FR/EN parity). The default is a silent refetch (no new copy).
- **Architecture Book:** `decisions/028-fcm-tap-routing.md` (new ADR), `decisions/README.md` (index row), `firebase.md` (Cloud Messaging — the two tap entrypoints + the dispatcher), `features.md` (Notifications feature — tap routing), `architecture-changelog.md` (dated entry).
- **Server:** UNCHANGED. No edits. The generated client is not touched (tap routing reuses the existing sync mutation seam).
- **Native:** none — no new dependency, no `app.config.ts` change, no fingerprint bump (rides Ship A's messaging wiring).
- **Human-blocked:** real tap-from-foreground/background/**KILLED** routing on **both** platforms in a **release** build — device-only, folded into / cross-referencing Ship A's device-verification inbox note.
