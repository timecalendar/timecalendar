# 027 — FCM-token-to-backend registration: a new `src/features/notifications/` module, the local MMKV store as the source of truth, idempotent PUT-only

> Origin: the `add-mobile-fcm-subscription` change (Phase 06 Ship B — token-to-backend
> registration + subscription-preferences UI), design Decisions 1–6. Builds on Ship A's
> `@/firebase` receive seam (ADR 026 — `getFcmToken` / `onFcmTokenRefresh` /
> `requestNotificationPermission` / `recordError`), the `settings/prefs` local-pref
> precedent, and the Phase-03 `user_calendars` store.

## Status

Accepted.

## Context

Ship A landed the push-**receive** seam: the FCM token is now obtainable, but **nothing
registers it with the backend**, so the server's frozen `firebase-admin` sender has no
device to push to, and the user has no way to set reminder preferences. Ship B closes that
gap by wiring the token + preferences to the **already-generated** PUT client. The server
`notification-subscription` module + the `firebase-admin` sender are **done and frozen** —
no server edit, no Orval regeneration.

Two forces make this load-bearing (R-4 → an ADR), and a third makes the module placement
worth recording:

1. **The subscription API is PUT-only — there is NO GET.** The frozen controller has a
   single `@Put()`, no `@Get()`. The app therefore cannot read its own subscription state
   back from the server. A reader could later "add a GET for correctness" (there is none)
   or move the source of truth to the server (it cannot be read).
2. **`calendarIds` is the `user_calendars` row `id`, not the FCM token.** The row `id` IS
   the server calendar id (`fromCalendarForPublic` copies `dto.id`), distinct from the
   irreplaceable `token`. Sending the token here would silently register the wrong ids.
3. The registration concern is **neither** a generic device preference (Settings owns
   infallible local theme/language, "Observability ➖ N/A" per ADR 009) **nor** transport
   (the `@/firebase` seam is receive-only and B-1 bans the generated client outside a
   feature `data/`). It is a feature: a network write that can fail, bound to a server DTO.

## Decision

**A new feature module `src/features/notifications/`** (the layered ADR-014 pattern) with
`data/` (the prefs store + the registration seam + types) and `ui/` (the prefs screen). It
consumes `@/firebase` (token/refresh/recordError, through the seam), `@/features/
calendar-sources/data` (`useUserCalendars`, a cross-feature `data → data` read by full
`@/` path), the generated PUT client (**only** in `data/subscription.ts` — B-1), and
`@/storage` (**only** in `data/prefs.ts` — B-1). It is NOT grown into Settings (whose
identity is infallible local prefs with no network) nor into `@/firebase` (B-1 + the
seam's receive-only role).

- **The local MMKV store is the source of truth; PUT idempotently (load-bearing).** Because
  the API is PUT-only, `frequency` / `nbDaysAhead` / `isActive` persist **locally in MMKV
  `@/storage`** under flat keys (`notifications.*`), mirroring `settings/prefs`: total
  parsers (unset/corrupt/out-of-range → the default, never throws; `nbDaysAhead` clamped to
  [1,30] on read so a corrupt store can never produce a DTO the server would 400) + a
  reactive read. Every change writes MMKV **first**, then PUTs the full DTO (computed fresh
  each time). On launch the UI renders the local store; the registration seam re-PUTs to
  keep the server convergent. **"Round-trips with the server" (the Phase-06 exit criterion)
  = the PUT succeeds** — there is deliberately no read-back to assert against. This is the
  same single-source-of-truth-plus-idempotent-write pattern the hidden-events /
  `user_calendars` stores use, applied to a write-only API — clean, not a hack.

- **Defaults:** `frequency = "immediately"`, `nbDaysAhead = 7` (Flutter's legacy
  `date_limit ?? 14`, but the DTO range is 1..30 and the home/agenda surface a week — 7 is
  the conservative reminder horizon, a deliberate trivially-changed choice), `isActive =
  true` (opt-in, matching Flutter `notification_calendar ?? true`). The frequency values are
  the generated `NotificationSubscriptionCreateFrequency` const-union (not re-declared).

- **First-PUT trigger + zero-calendars + re-PUT policy (Decisions 3/4/5).** The first PUT
  fires after a non-null token is acquired, via a fire-and-forget once-effect mounted as a
  `<NotificationRegistration />` component in `_layout.tsx` next to `<StartupSync />` (it
  wires the generated mutation → needs the QueryClient in context; it goes through the
  feature `data/`, never the generated client / `@/db` — B-3/B-4). It requests permission
  (idempotent), and on a **null** token (iOS APNS not ready) does nothing and relies on
  `onFcmTokenRefresh` to fire the registration when a token lands. **Zero held calendars
  STILL PUTs `calendarIds: []`** so the server can prune a previously-registered device
  (skipping would strand a stale subscription the PUT-only API makes invisible — no GET, no
  delete). Every prefs change and every token-refresh re-PUTs; idempotency makes an extra
  PUT harmless, so no coalescing machinery is built (R-2) — the screen MAY debounce taps,
  but the wire contract is "every committed change re-PUTs".

- **Observability (Decision 6).** A failed subscription PUT → `@/firebase`
  `recordError(error, "notifications/subscription")` **and** an accessible failure surface
  (`accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`) + a **Retry** control on
  the prefs screen (the calendar-sources add-calendar write posture — a retryable write
  whose silent failure breaks the user's reminders). The background/startup re-PUT records
  on failure but has no on-screen surface; it self-heals on the next change/refresh. The
  reactive prefs **read** is total/infallible (the total parsers → no record).

## Consequences

- The PUT seam + the generated client live in `data/subscription.ts` (B-1); `@/storage` in
  `data/prefs.ts` (B-1); the screen reaches seams only through the feature `data/` (B-1/B-3).
  The feature-boundaries ESLint rule (R-1) carries these; this ADR is the prose pointer.
- CI proves the **write wiring** (mock-at-mutator): PUT-on-change, re-PUT-on-token-refresh,
  null-token → no-PUT, zero-calendars → `calendarIds: []`, persist/read-back (incl. a
  restart-simulation against a stateful `@/storage` fake — the prefs are irreplaceable,
  PUT-only), and the failure path (PUT rejects → `recordError` + `isError`). CI **cannot**
  prove a real server-delivered push — that device-only verification is inboxed (Ship A's
  delivery note + the Ship-B review note).
- No native change this ship: no new dependency, no `app.config.ts` / babel / fingerprint
  change, no Drizzle schema/migration. Additive only (a new MMKV key namespace, a feature
  module, a thin route, one `_layout.tsx` Stack sibling + the mounted trigger, i18n keys).

## Revisit if

The server gains a **GET** for the subscription (then a server-state read-back / reconcile
becomes possible — re-weigh "local is the source of truth"); a **delete** endpoint lands
(then zero-calendars could DELETE rather than PUT `[]`); the `nbDaysAhead` default (7) or the
permission-request placement (in the trigger, no priming screen — R-3) proves wrong on
device; a second consumer needs the registration concern (re-weigh the module boundary); or
the PUT stops being idempotent server-side (then the fire-on-every-change posture needs
dedupe/coalescing).
