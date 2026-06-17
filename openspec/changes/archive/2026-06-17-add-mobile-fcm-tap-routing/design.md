# Design — add-mobile-fcm-tap-routing (Phase 06 Ship C)

## Context

Ships A/B landed receive + registration. The server (`server/src/modules/notifier/notifiers/fcm-notifier.ts`, frozen) sends, **one FCM message per changed event**:

```
notification: { title, body }                       // visible system notification
data: {
  action: "calendar_changed",                        // the ONLY action emitted
  payload: JSON.stringify({ type, event })
}
```

where `type ∈ { NEW, CANCEL, EDIT }` (server `DifferenceType`) and `event` is `EventForChangeDetection` = `{ uid: string, title: string, location: string | null, startsAt: ISO-string, endsAt: ISO-string }`. There is **no calendar id** and **no other action**.

The mobile app must, on receiving / tapping such a message:
- **refresh** the calendar (the data changed), and
- on a **tap**, **open the affected event** (or the calendar, if it was cancelled).

across foreground, background, and killed/cold-start.

## Decision 1 — The payload→route contract (a pure function)

A pure `parseNotificationRoute(message: FirebaseMessage): TapRoute | null`, where

```ts
type TapRoute = { kind: "event"; uid: string } | { kind: "calendar" }
```

Mapping:
- `message.data?.action !== "calendar_changed"` (incl. missing data/action) → `null` (R-2: ignore unknown actions, forward-compatible, no speculative handlers).
- `data.payload` is a **JSON string**; `JSON.parse` it inside try/catch. A throw → `recordError(err, "notifications/tap-routing")` + `null`.
- Parsed `{ type, event }`: a missing/blank `event.uid` → `null`.
- `type === "CANCEL"` → `{ kind: "calendar" }` (the event no longer exists server-side; after a refetch its row is gone, so a detail page would be empty — route to the calendar instead).
- `type === "NEW" | "EDIT"` (and, defensively, any other non-CANCEL type carrying a uid) → `{ kind: "event", uid }`.

Keeping this pure (no hooks, no navigation, no async) makes every branch unit-testable to the 90% per-file branch gate without React/Expo plumbing.

## Decision 2 — The dispatcher hook + the three app states

`useNotificationTapRouting()` is a once-mounted hook in `src/app/_layout.tsx` (beside Ship B's `NotificationRegistration`), wiring:

- `useSyncCalendars()` → `{ sync }` (the existing calendar sync orchestrator — `@/features/calendar/data`; the same one `useStartupSync` + pull-to-refresh use; a failed sync is silent/last-good per ADR 021).
- `useRouter()` (expo-router) for imperative navigation.

Behavior per state:

| State | Entry point | Action |
|---|---|---|
| **Foreground** | `onForegroundMessage` | `calendar_changed` → `void sync()`. **No navigation** (Flutter parity — do not yank the user mid-use). |
| **Background tap** | `onNotificationOpenedApp` | `void sync()`, then `navigate(parseNotificationRoute(msg))`. |
| **Killed / cold-start** | `getInitialNotification()` | resolved in a **mount effect**; if non-null → `void sync()`, then `navigate(parseNotificationRoute(msg))`. |

`navigate(route)`: `event` → `router.push('/event-details/' + uid)`; `calendar` → `router.push('/calendar')`; `null` → no-op.

The foreground listener returns its unsubscribe from a `useEffect` (cleanup wired). `onNotificationOpenedApp` likewise. `getInitialNotification` runs once behind a ref guard (it is a one-shot at launch).

## Decision 3 — Navigation-before-mount (the R-4 risk, resolved)

`getInitialNotification` cold-start navigation must not run before the root navigator is mounted, or `router.push` throws / no-ops. Resolution: the hook is mounted **inside** `RootLayout`'s rendered tree (the `<Stack>` is already returned by the same component), and the cold-start handling runs in a `useEffect` — effects fire **after** the first render commits, by which point the `<Stack>` navigator is mounted. This mirrors the existing once-effects (`useStartupSync`, `useNotificationRegistration`) that already navigate/act safely from the root layout. No deferral/queue is needed. This is **not** a hard architectural blocker.

(If, on device, a cold-start `router.push` ever races the navigator, the documented fallback is to gate the navigation on a `rootNavigationState?.key` readiness check from `expo-router` — noted in the inbox device script, not built speculatively.)

## Decision 4 — Deep-link uid-match assumption (graceful degradation)

`/event-details/[uid]` looks up `calendarEvents.uid` (and `personalEvents.uid`). The synced row's `uid` is set by `dtoToRow` to `dto.uid`, and the push payload's `event.uid` is the same iCal event uid. So after the refetch, `/event-details/<event.uid>` resolves to the freshly-synced row. If a provider quirk makes the change-detection uid differ from the sync DTO uid (the server notes uids can vary across providers for the "same" event), the detail screen's `useEventDetails` returns `{ event: null, loading: false }` — a graceful **not-found**, never a crash. Recorded in ADR 028; the device note verifies the happy path.

## Decision 5 — R-2: only `calendar_changed`

The server emits exactly one action. The parser ignores everything else by returning `null` (forward-compatible), and we build **no** handlers for hypothetical future actions/payloads (R-2: no speculative adoption). When the server grows a new action, that is its own ship.

## What CI proves vs. what is device-only

- **CI (mock-at-mutator + mocked router):** `NEW`/`EDIT` → `router.push('/event-details/<uid>')` + `sync` called; `CANCEL` → `router.push('/calendar')` + `sync`; foreground → `sync` + router **not** called; malformed payload → no nav + `recordError`; unknown action → no-op; null `getInitialNotification` → no-op; listener cleanup wired.
- **Device-only (inboxed):** a real tap routing correctly from foreground/background/**KILLED**, on **both** platforms, in a **release** build. CI cannot deliver a real push or simulate a real cold-start tap. Folded into Ship A's `docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md`.

## Non-Goals

- Local reminders (`expo-notifications`) — Ship D.
- Any server change, new dependency, or Orval regeneration.
- Per-event deep-link payloads beyond `calendar_changed` (the server emits none).
- A rich in-app foreground banner — the default is a silent refetch; a subtle affordance is optional and native-default (R-3) if added.
