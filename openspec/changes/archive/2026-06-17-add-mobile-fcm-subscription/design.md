## Context

Ship A (`add-mobile-fcm-messaging`, ADR 026) grew the `@/firebase` seam with push **receive**: `requestNotificationPermission`, `getFcmToken` (iOS APNS-first), `onForegroundMessage`, the top-level `setBackgroundMessageHandler`, and `onFcmTokenRefresh`. Ship B makes the token **useful**: register it with the server so the frozen `firebase-admin` sender can push, and let the user set reminder preferences.

The server `notification-subscription` module is **done and frozen** (read-only parity reference):

```
PUT /notification-subscription   (create-or-update, 204 No Content; NO GET)
NotificationSubscriptionCreate {
  frequency: "immediately" | "hourly" | "daily"
  nbDaysAhead: number   // 1..30
  isActive: boolean
  calendarIds: string[] // server calendar UUIDs
  fcmToken: string
}
```

The Orval client is **already generated** (`mobile/src/api/generated/notification-subscription/notification-subscription.ts` — `useNotificationSubscriptionControllerCreateOrUpdateSubscription`, the PUT mutation over the single `customFetch` mutator; the DTO type is `NotificationSubscriptionCreate` in `timeCalendar.schemas.ts`). We **consume** it; we do not regenerate.

The parity reference is the Flutter `app/lib/modules/firebase/services/notification/notification.dart`: `getFcmToken` (the APNS-first guard Ship A already mirrored), `subscribe()`/`subscribeDelay()` (request permission, then register), and a token-to-backend registration (its `subscribeToCalendar` PUT body is commented-out legacy `/fcm/subscribe`; the **live** registration is the server `notification-subscription` PUT the generated client wraps). The Flutter notification-settings UI is also disabled/commented, so the **DTO is the authoritative shape** for the preferences UI, not a live Flutter screen.

The two durable inputs already exist: the Ship-A token helpers (`@/firebase`) and Phase 03's `user_calendars` store — whose **row `id` is the server calendar id** (`fromCalendarForPublic` copies `dto.id`; `getById`/`getByToken` confirm `id` is the server identity, distinct from the irreplaceable `token`). So `calendarIds` = the `user_calendars` rows' `id`s.

## Goals / Non-Goals

**Goals:**
- A local MMKV prefs store for `frequency` / `nbDaysAhead` / `isActive` (source of truth — PUT-only API has no read-back), mirroring `settings/prefs`.
- An idempotent `PUT /notification-subscription` registration seam assembling the DTO from local prefs + `user_calendars` ids + the Ship-A token; re-PUT on token-refresh and on every prefs change.
- A subscription-preferences sub-screen bound to the local prefs + driving the re-PUT, reached from Profile.
- The failed-PUT observability surface (`recordError` + accessible Retry).
- CI proof of the write paths at the `customFetch` mutator; FR/EN i18n; ADR 027; Book + changelog.

**Non-Goals:**
- Tap-through routing (`onNotificationOpenedApp` / `getInitialNotification`, action dispatch) — Ship C.
- Local reminders (`expo-notifications`) — Ship D.
- Any server change — frozen, read-only.
- Regenerating the Orval client — already generated, consumed as-is.
- A GET-backed prefs read or server-state reconciliation — the API is PUT-only by design (Decision 1).
- Visual polish / designer assets for the prefs screen (native-default per R-3; polish inboxed).

## Decisions

### Decision 1 (load-bearing, → ADR 027) — PUT-only API: the local MMKV store is the source of truth; PUT idempotently

`PUT /notification-subscription` is create-or-update with **no GET** — confirmed in the frozen server controller (a single `@Put()`, no `@Get()`). The app therefore **cannot read its own subscription state back from the server**. Two shapes were considered:

- *(rejected)* keep the prefs only in TanStack Query / in-memory and re-derive on launch — there is nothing to derive from (no GET), so the UI would reset to defaults every cold start and silently re-PUT defaults over the user's real choice.
- **(chosen)** persist `frequency` / `nbDaysAhead` / `isActive` **locally in MMKV `@/storage`** — the **single source of truth** — exactly mirroring `settings/prefs` (the established local-pref precedent: flat keys, total parsers, a reactive `useStoredString` read). Every change writes MMKV first, then **PUTs idempotently** (the full DTO, computed fresh each time). On launch the UI renders the local store; the registration seam re-PUTs to keep the server convergent.

The PUT being idempotent (create-or-update keyed server-side by the fcmToken/user) makes re-sending the full DTO on every change and every token-refresh **safe and self-healing** — a missed PUT (offline) is corrected by the next one. **"Round-trips with the server" (the Phase-06 exit criterion) = the PUT succeeds**; there is deliberately no read-back to assert against. This is clean, not a hack: it is the same single-source-of-truth-plus-idempotent-write pattern the hidden-events / user_calendars stores use, applied to a write-only API. ADR 027 records it so a future reader does not "add a GET for correctness" (there is none) or move the source of truth to the server (it cannot be read).

**Defaults** (Flutter parity + safe-by-default): `frequency = "immediately"`, `nbDaysAhead = 7` (the Flutter `/fcm/subscribe` default was `date_limit ?? 14`, but the DTO range is 1..30 and the home `dynamicHourRange`/agenda surfaces a week — 7 is the conservative reminder horizon; recorded as a deliberate choice, trivially changed), `isActive = true` (opt-in by default, matching Flutter `notification_calendar ?? true`). Reads go through **total parsers** (any unset/corrupt/out-of-range value → the default, never throws) exactly like `parseThemePreference`; `nbDaysAhead` is additionally **clamped to [1,30]** on read so a corrupt store can never produce a DTO the server would 400.

### Decision 2 (load-bearing, → ADR 027) — A new `src/features/notifications/` feature module, not grown into Settings or `@/firebase`

The registration concern is **neither** a generic device preference (Settings owns theme/language — infallible MMKV, no network) **nor** transport (the `@/firebase` seam is receive-only and must stay free of feature/network logic + the generated client — B-1 bans the generated import outside a feature `data/`). It is a **feature**: a network write that can fail, bound to a server DTO, composing the token + the `user_calendars` read + local prefs.

So a **new feature folder `src/features/notifications/`** (the layered ADR-014 pattern), with `data/` (prefs store + registration seam + types) and `ui/` (the prefs screen). It consumes:
- `@/firebase` (`getFcmToken`, `onFcmTokenRefresh`, `recordError`) — through the seam, never `@react-native-firebase/*` (the Ship-A rule).
- `@/features/calendar-sources/data` (`useUserCalendars`) — a cross-feature `data → data` read by full `@/` path (the legitimate consumer pattern the calendar sync orchestrator and home selectors already use).
- `@/api/generated/notification-subscription/*` — the generated PUT client, imported **only** in `data/subscription.ts` (B-1).
- `@/storage` — only in `data/prefs.ts` (B-1).

*Rejected:* growing `settings/prefs` — it would pull the generated client + the firebase seam + a network failure path into a folder whose whole identity is "infallible local device prefs" (ADR 009 records "Observability ➖ N/A" for Settings); a network write that can fail does not belong there. *Rejected:* putting registration in `@/firebase` — violates B-1 (generated import outside a feature `data/`) and the seam's receive-only/transport-only role (ADR 026). The prefs *screen* is presented as a Settings-adjacent sub-screen (Profile entry link, same as the existing Settings link), but the *code* lives in the notifications feature — UI placement ≠ code ownership.

### Decision 3 — When the first PUT fires; the registration trigger

Mirroring Flutter `subscribeDelay` (request permission, then register once a token exists), the **first PUT fires after a non-null FCM token is acquired**, driven by a fire-and-forget once-effect mounted in `_layout.tsx` (a `<NotificationRegistration />` component rendering `null`, mirroring the existing `<StartupSync />`). The effect:
1. calls `requestNotificationPermission()` (idempotent; the OS prompt shows once),
2. resolves `getFcmToken()` — if `null` (iOS APNS not ready), it does nothing and relies on `onFcmTokenRefresh` to fire the registration when a token lands,
3. on a non-null token, PUTs the assembled DTO,
4. subscribes `onFcmTokenRefresh` → re-PUT with the new token.

It is a component (not a top-level side-effect) because the registration wires the generated mutation, which needs the QueryClient in context — exactly the `StartupSync` rationale. It goes through the feature `data/` hook, never the generated client or `@/db` directly (B-3/B-4). Permission-request placement is the conservative choice (no separate pre-prompt screen this ship — R-2/R-3; a polished priming screen is inboxable later); the trigger is idempotent so it is safe to fire each cold start.

### Decision 4 — Zero held calendars still PUTs (`calendarIds: []`)

When the user holds no calendars, the registration **still PUTs** with `calendarIds: []` (and the honored `isActive`). The server is create-or-update keyed by the device/token; sending an empty set lets it **prune** a previously-registered device down to nothing (the user removed all calendars → no calendar-change pushes), rather than leaving a stale subscription the user can no longer see (PUT-only — they cannot read it). The DTO validator (`@IsArray @IsUUID each`) accepts an empty array. *Rejected:* skipping the PUT when empty — that would strand a stale server subscription with no way for the client to ever clear it (no GET, no delete endpoint), the exact failure mode the PUT-only API makes invisible. Recorded so it is not "optimized" into a skip.

### Decision 5 — Re-PUT on every prefs change and every token-refresh; debounce only the screen, not the wire contract

The local store is the source of truth (Decision 1), so each prefs mutation (`setFrequency`/`setNbDaysAhead`/`setIsActive`) writes MMKV then triggers an idempotent re-PUT, and `onFcmTokenRefresh` re-PUTs with the new token. The `nbDaysAhead` control is a 1..30 stepper/number — the screen MAY debounce rapid taps before the PUT (a UI concern), but the **contract is "every committed change re-PUTs"**; the test asserts a change → a PUT with the new value. Idempotency makes an extra PUT harmless, so no dedupe/coalescing machinery is built (R-2).

### Decision 6 — Observability: a failed PUT is recorded + surfaced with Retry (the calendar-sources pattern)

A subscription PUT is a **retryable network write whose silent failure breaks the user's reminders** — so it follows the calendar-sources add-calendar / personal-events write posture, **not** the recoverable-read posture: a rejected PUT → `@/firebase` `recordError(error, "notifications/subscription")` **and** an accessible failure surface (`accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`) with a **Retry** control on the prefs screen. The background/startup re-PUT (the trigger effect) records on failure but has no on-screen surface (no screen is mounted) — it self-heals on the next change/refresh. The reactive prefs **read** is total/infallible (Decision 1's total parsers → no record).

### Decision 7 — ADR number 027; Book + changelog + features edits are tasks, not silent

Next free ADR is **027** (highest existing is 026, Ship A). The implementer writes `decisions/027-fcm-subscription-registration.md` (Status/Context/Decision/Consequences/Revisit-if, mirroring ADR 026 rigor): the **PUT-only / local-source-of-truth** decision (Decision 1), the **first-PUT trigger + zero-calendars + re-PUT policy** (Decisions 3/4/5), and the **new-feature-module** placement (Decision 2). Adds the index row to `decisions/README.md`, a Notifications section to `features.md`, a registration-consumer + local-prefs note to `firebase.md`'s Cloud Messaging section, and a dated `architecture-changelog.md` entry (R-1: the spec/lint/test carry the rule; the prose links to them).

## Risks / Trade-offs

- **[PUT-only API → no server read-back; local store can drift from server]** → Local is the **declared** source of truth; idempotent re-PUT on every change + token-refresh keeps the server convergent and self-heals a missed write. ADR 027 records it so no one adds a (non-existent) GET.
- **[A failed PUT silently breaks reminders]** → `recordError` + an accessible Retry on the screen; the trigger effect re-PUTs on the next change/refresh. The failure path is CI-tested (mock-at-mutator: PUT rejects → record + error flag).
- **[`nbDaysAhead` out of range → server 400]** → The total parser clamps to [1,30] on read; the UI stepper is bounded; the DTO can never carry an out-of-range value.
- **[Zero calendars edge]** → PUT `[]` so the server can prune (Decision 4), not skip (which would strand a stale subscription with no client recourse).
- **[iOS token is null until APNS is ready]** → The trigger does nothing on a null token and relies on `onFcmTokenRefresh` to fire the registration — exactly the Ship-A contract; no busy-retry.
- **[Permission prompt timing]** → Native-default (request in the trigger, conservative — R-3); a polished priming screen is inboxable future work, not this ship.
- **[CI cannot prove a real server push results]** → Out of scope here; the real-push-delivery device verification is already inboxed by Ship A. This ship's CI proves the **write wiring** (PUT-on-change, re-PUT-on-refresh, persist/read-back, failure→record) — green wiring + the device note is the bar.

## Migration Plan

No data migration. Additive: a new MMKV key namespace (`notifications.*`) under the existing `@/storage` seam, a new feature module, a new thin route, one `_layout.tsx` Stack sibling + one mounted trigger component, and i18n keys. No new dependency, no native/`app.config.ts`/babel change, no Drizzle schema/migration, no fingerprint bump. Rollback = revert the feature folder, the route, the `_layout.tsx` edits, the Profile link, and the i18n keys; nothing else is touched.

## Open Questions

None blocking. The `nbDaysAhead` default (7) and the permission-request placement (in the trigger, no priming screen) are settled by Decisions 1/3 as deliberate native-default choices, trivially revisited; the exact stepper-vs-slider control for `nbDaysAhead` is an implementer UI choice within the bounded-1..30 contract.
