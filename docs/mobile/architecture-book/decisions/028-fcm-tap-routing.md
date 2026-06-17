# 028 — FCM notification tap-through routing: a pure payload→route parser + a three-app-state dispatcher (refetch always; navigate on tap)

> Origin: the `add-mobile-fcm-tap-routing` change (Phase 06 Ship C — notification
> tap-through routing), design Decisions 1–5. Builds on Ship A's `@/firebase` receive seam
> (ADR 026 — `onForegroundMessage`, the background-message handler, `recordError`) and Ship
> B's `src/features/notifications/` module (ADR 027). Reuses the calendar sync orchestrator
> (`useSyncCalendars`, ADR 021) and the `event-details/[uid]` route (ADR 024).

## Status

Accepted.

## Context

Ships A/B landed receive + registration: pushes now arrive and the device is registered, but
**tapping a notification does nothing useful** and a foreground push does not refresh the
calendar. The server's frozen `firebase-admin` sender
(`server/src/modules/notifier/notifiers/fcm-notifier.ts`) emits **one FCM message per changed
event**:

```
notification: { title, body }                 // visible system notification
data: { action: "calendar_changed",           // the ONLY action emitted
        payload: JSON.stringify({ type, event }) }
```

where `type ∈ { NEW, CANCEL, EDIT }` (server `DifferenceType`) and `event` carries the iCal
`uid` (plus title/location/ISO dates). There is **no calendar id** and **no other action**.
The server is done and frozen — no server edit, no Orval regeneration.

The device must, on receiving / tapping such a message: **refresh** the calendar (the data
changed) and, on a **tap**, **open the affected event** (or the calendar, if it was
cancelled), across foreground, background, and killed/cold-start. Two forces make this
load-bearing (R-4 → an ADR):

1. **Cold-start navigation can race the root navigator.** `getInitialNotification` resolves
   at launch; a `router.push` before the `<Stack>` mounts throws / no-ops.
2. **The deep-link uid-match is an assumption, not a guarantee.** `/event-details/[uid]`
   looks up the synced row by `uid`; a provider quirk could make the change-detection uid
   differ from the sync DTO uid.

## Decision

**A pure payload→route parser + a once-mounted dispatcher hook**, both in
`src/features/notifications/data/tap-routing.ts` (one cohesive module), wired into the root
layout beside Ship B's `<NotificationRegistration />`.

- **The payload→route contract is a pure function (Decision 1).** `parseNotificationRoute`
  returns `{ kind: "event"; uid } | { kind: "calendar" } | null`:
  - `data?.action !== "calendar_changed"` (incl. missing data/action) → `null` (R-2: ignore
    unknown actions, forward-compatible, **no speculative handlers** for actions the server
    does not emit).
  - `data.payload` is a JSON string; `JSON.parse` inside try/catch. A throw →
    `recordError(err, "notifications/tap-routing")` + `null` — never a crash.
  - missing/blank `event.uid` → `null`.
  - `type === "CANCEL"` → `{ kind: "calendar" }` (the event is gone server-side; after a
    refetch its row is dropped, so a detail page would be empty — route to the calendar).
  - `type === "NEW" | "EDIT"` (defensively, any other type carrying a uid) → `{ kind:
    "event", uid }`.
  Keeping it pure (no hooks, no navigation, no async; the only non-pure dependency is
  `recordError`, in the catch) makes every branch unit-testable to the 90% per-file branch
  gate without React/Expo plumbing. The decoded `{ type, event }` uses a **minimal local
  type**, NOT the server types (the parser only needs `uid`).

- **The dispatcher hook wires the three app states (Decision 2).** `useNotificationTapRouting`
  reads `useSyncCalendars().sync` (the existing orchestrator — `@/features/calendar/data`,
  the same one `useStartupSync` + pull-to-refresh use; a failed sync is silent/last-good per
  ADR 021) and `useRouter()` (expo-router):

  | State | Entry point (`@/firebase`) | Action |
  |---|---|---|
  | **Foreground** | `onForegroundMessage` | `calendar_changed` → `void sync()`. **No navigation** (Flutter parity — never yank the user mid-use). |
  | **Background tap** | `onNotificationTap` (`onNotificationOpenedApp`) | `void sync()`, then navigate per the parsed route. |
  | **Killed / cold-start** | `getInitialTap` (`getInitialNotification`) | resolved in a ref-guarded mount effect; if non-null → `void sync()`, then navigate. A `null` initial notification is a safe no-op. |

  `navigate(route)`: `event` → `router.push('/event-details/<uid>')`; `calendar` →
  `router.push('/calendar')`; `null` → no-op. The foreground + background listeners return
  their unsubscribes from the effect cleanup; the cold-start read is a one-shot behind a ref
  guard.

- **Navigation-after-mount resolves the race (Decision 3).** The hook is mounted **inside**
  `RootLayout`'s rendered tree (the `<Stack>` is returned by the same component) and the
  cold-start handling runs in a `useEffect` — effects fire **after** the first render
  commits, by which point the `<Stack>` navigator is mounted. This mirrors the existing
  once-effects (`useStartupSync`, `useNotificationRegistration`). No deferral/queue is built
  (R-2). The documented device fallback if a cold-start `router.push` ever races on device:
  gate on `expo-router`'s `rootNavigationState?.key` readiness — noted in the inbox device
  script, not built speculatively.

- **The deep-link uid-match assumption degrades gracefully (Decision 4).** `dtoToRow` sets
  the synced row's `uid` to `dto.uid` (the iCal event uid), the same uid the push payload
  carries, so after the refetch `/event-details/<event.uid>` resolves the freshly-synced row.
  If a provider quirk makes the change-detection uid differ, `useEventDetails` returns
  `{ event: null, loading: false }` — a graceful **not-found**, never a crash.

- **The seam gains two tap entrypoints (modifies ADR 026).** `onNotificationTap` and
  `getInitialTap` in `src/firebase/index.ts`, each resolving `getMessaging()` lazily inside
  the body (mirroring `onForegroundMessage` / `getFcmToken`) so importing `@/firebase` stays
  native-safe — no new top-level native access (the background handler remains the only one).

## Consequences

- The hook reaches the calendar feature via its `@/features/calendar/data` barrel (a
  legitimate cross-feature `data → data` read), the router via expo-router, and `@/firebase`
  via the seam — **no generated client, no `@/db`, no `@/storage`** here (B-1..B-4). The
  feature-boundaries ESLint rule (R-1) carries these; this ADR is the prose pointer.
- CI proves the **mapping + wiring** (mock-at-mutator + a mocked router): `NEW`/`EDIT` →
  `router.push('/event-details/<uid>')` + `sync`; `CANCEL` → `router.push('/calendar')` +
  `sync`; foreground → `sync` + router **not** called; malformed payload → no nav +
  `recordError`; unknown action → no-op; null `getInitialTap` → no-op; listener cleanup
  wired. CI **cannot** prove a real tap routing from foreground/background/**KILLED** on a
  device in a release build — that is device-only and inboxed (folded into Ship A's
  delivery-verification note).
- The refetch reuses the existing sync seam — **no new sync path, no new client call, no
  Orval regeneration**. No native change: no new dependency, no `app.config.ts` /
  fingerprint change, no Drizzle schema/migration. Additive only (one `data/` module, two
  seam helpers + their mock, one `_layout.tsx` Stack-sibling component, the barrel exports).
- Default is a **silent refetch** — no new user-facing copy. A subtle foreground affordance
  would be native-default (R-3) if ever added.

## Revisit if

The server grows a **new data-message action** (then it gets its own handler on its own
ship — the parser ignores it gracefully until then); a cold-start `router.push` races the
navigator **on device** (then wire the `rootNavigationState` readiness gate); the
change-detection uid and the sync DTO uid prove to diverge in practice (then the not-found
degradation needs a friendlier surface, or a uid-reconcile step); a foreground push warrants
an in-app banner over a silent refetch; or local reminders (Ship D) need to share this
dispatch path.
