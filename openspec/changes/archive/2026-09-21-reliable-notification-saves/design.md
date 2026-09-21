## Context

The notifications feature currently creates the generated TanStack mutation in both `useNotificationRegistration` and `useNotificationPreferences`. Both hooks also subscribe to FCM token refresh, so a mounted screen can overlap the root listener. Mutation pending/error state belongs to that hook instance, route unmount discards it, and `useUserCalendars()` makes an unresolved live query indistinguishable from a loaded empty collection. Local preferences remain durable, but there is no durable fact saying the corresponding full-state PUT still needs acknowledgment.

The approved D03 project decision requires durable latest-state synchronization without a generic queue or API revision. The existing generated plain `notificationSubscriptionControllerCreateOrUpdateSubscription` function accepts `RequestInit`, including `signal`, and already traverses the single cancellable `customFetch` mutator. MMKV is synchronous behind `@/storage`; `useUserCalendarsSnapshot()` provides `ready` and `revision`; the environment gate unmounts app consumers before the reset participant runs.

The PUT is idempotent, but a timed-out or aborted client request may still finish on the server. This design prevents stale local acknowledgment and performs eventual latest-snapshot repair. It cannot promise strict server ordering after an ambiguous transport outcome without a server revision protocol, which remains out of scope.

## Goals / Non-Goals

**Goals:**

- Keep preference writes immediate while durably retaining unacknowledged remote intent.
- Establish exactly one mounted owner for subscription PUTs, token listening, current inputs, retries, and observable status.
- Serialize client requests and coalesce all intervening changes into one next request built from the latest snapshot.
- Make request completion, timers, and acknowledgment safe across newer generations, disposal, and backend reset.
- Distinguish unavailable prerequisites from success, including unloaded versus loaded-empty calendars.
- Preserve route-independent status and recover dirty intent after process restart.

**Non-Goals:**

- Notification permission/status/refusal repair, new prompt timing, or system-settings links.
- A generic durable queue, stored request bodies, stored FCM tokens, background execution, or connectivity monitoring.
- Server/API/schema changes, strict ordering after ambiguous timeouts, push-delivery guarantees, or scheduling changes.
- A notification screen redesign or changes to native/Firebase/store configuration.

## Decision 1 — One controller factory and one live app-lifetime instance

Add a pure `createNotificationSyncRuntime(dependencies)` controller in the notifications data layer. Dependencies cover durable metadata access, current snapshot construction, the PUT transport, timers/clock, active-state observation, and sanitized error recording. The factory exposes lifecycle/input commands (`start`, `invalidate`, `foreground`, `retry`, `dispose`, `resetForEnvironment`) plus `subscribe/getSnapshot` for `useSyncExternalStore`.

Production exports one live instance through the notifications data barrel. A root component inside `PersistQueryClientProvider` starts it, supplies the reactive calendar snapshot/effective zone and locale invalidations, owns the sole FCM refresh listener, and disposes on unmount. The settings hook reads preferences and shared runtime status, and its setters invalidate before writing. It creates no mutation and owns no token listener. The environment participant reaches the same live instance through a narrow notifications data export.

This separates the race-heavy state machine from React and enables controlled-promise, fake-timer, restart, and reset tests. React Context was rejected because reset needs an imperative owner after consumer unmount and route-independent tests should not require a component tree. TanStack mutation state was rejected because hook instances do not survive route unmount or process death and do not encode current-generation acknowledgment.

## Decision 2 — Persist only dirty intent and a monotonic generation

Add two total-decoded MMKV values through `@/storage`:

- `notifications.sync.dirty`: boolean, default `false`.
- `notifications.sync.generation`: non-negative safe integer, default `0` for missing/malformed values.

Both are backend-bound and cleared by existing classified storage reset. `markDirty()` synchronously increments generation and writes dirty `true` before any notification preference setter mutates its key. If the process dies between those writes, startup safely sends the previous complete preference snapshot; if it dies after the preference write, startup sends the new one. If success occurs but the process dies before the synchronous clear, a redundant idempotent replay is safe. At the safe-integer ceiling the controller rolls to a fresh generation while also advancing its in-memory epoch, so no live captured completion can match.

Startup always marks dirty once as the existing cold-start backstop, even when no dirty marker was restored. Token, calendar, locale, and effective-zone changes also increment generation before the controller accepts the new input revision. The runtime persists no token, calendar identifiers, locale/zone tuple, DTO, error object, retry timestamp, or payload queue.

Persisting the full desired snapshot was rejected because preferences and live sources are already canonical and tokens/calendar payloads are sensitive and replaceable. Persisting only a last-success timestamp was rejected because it cannot prove which local intent it acknowledges.

## Decision 3 — Latest-state serialized drain with generation and epoch guards

The controller runs at most one client request at a time. A drain iteration captures `{generation, epoch}`, builds the DTO from current sources, and rechecks both identities before starting transport. Any invalidation during asynchronous token resolution makes that candidate obsolete and schedules a rebuild. Changes during an active PUT only leave dirty intent at the newer generation; when the request settles, the same drain sends one latest snapshot rather than intermediate values.

A success clears durable dirty state and publishes `acknowledged` only when all of these still match: the captured generation, the runtime epoch, the active live instance, and the current input identity represented by that generation. Earlier success or failure is otherwise inert except that the serialized drain observes newer dirty work. Failure can never clear dirty intent.

`dispose()` and `resetForEnvironment()` advance the epoch, abort the transport signal, clear retry timers, and detach subscriptions. Reset additionally clears runtime-owned in-memory status and its durable metadata explicitly (classification clearing remains the second idempotent line of defense). New work after a restart/reset therefore cannot be acknowledged by an old promise. Abort cannot guarantee the server stopped, so the next latest-state PUT is the repair mechanism.

Parallel PUTs were rejected because response order would make latest intent unprovable locally. A FIFO event queue was rejected because only the current full snapshot matters and replaying obsolete intermediate preferences wastes writes.

## Decision 4 — Readiness-aware snapshot assembly

The root supplies the calendar source as `{calendars, ready, revision}` from `useUserCalendarsSnapshot()`. The request builder resolves the current FCM token at send time (or consumes the newest refresh value), reads notification preferences and effective locale/zone at send time, and copies calendar server IDs only when `ready` is true.

Readiness outcomes are:

- Null/missing FCM token: `waiting` with reason `registration`; no PUT and no retry budget consumed. Token refresh invalidates and resumes.
- Calendars not loaded: `waiting` with reason `calendars`; no PUT and no retry budget consumed. The loaded revision invalidates and resumes.
- Calendars loaded with zero rows: a valid DTO with `calendarIds: []` is PUT.
- All prerequisites ready: publish `pending` and call the injected transport with an AbortSignal.

Using `useUserCalendars()` alone was rejected because its initial empty array would incorrectly prune backend calendars before SQLite resolves.

## Decision 5 — Shared status and bounded active recovery

Expose an immutable public union with no sensitive values:

- `pending`: dirty ready work is building, in flight, or scheduled for bounded retry.
- `waiting`: dirty work lacks `registration` or `calendars` readiness.
- `error`: the latest current-generation attempt failed and manual retry is available.
- `acknowledged`: no dirty intent remains for the live runtime.

`useSyncExternalStore` keeps this status stable across notification-route unmount/remount. Restart reconstructs pending/waiting state from durable dirty intent; exception details are never persisted. The screen presents concise localized pending/waiting/error text and Retry for `error`, without equating remote acknowledgment with OS permission or delivered notifications.

The initial attempt may be followed by three automatic retries at 1s, 5s, and 30s while `AppState` is active. A failure keeps dirty intent durable. Exhaustion clears the timer and leaves `error`; it does not spin. Backgrounding cancels a pending retry timer while leaving dirty intent; foreground, manual Retry, or a relevant input change resets the bounded budget and drains the current snapshot. Reset/disposal cancels everything. Fixed deterministic delays are chosen over a new retry library because the scope is one feature runtime and deterministic fake-timer proof matters more than generalized policy.

## Decision 6 — Existing generated contract, injectable plain-function transport

Wrap the existing generated plain PUT function in a small feature transport accepting the assembled DTO and AbortSignal. The generated hook is no longer used by this feature. `customFetch` composes the caller signal with its existing timeout and backend-runtime guard, so environment quiescence and runtime reset share the established cancellation path.

No generated or OpenAPI file changes. Diagnostics retain the static notification context only and never include tokens, calendar identifiers, DTOs, input signatures, or persisted metadata. Transport injection lets tests control exact completion order without mocking the network.

## Decision 7 — Documentation and proof stay feature-scoped

Update the Architecture Book's Firebase/storage/testing current-state guidance and changelog; D03 already records the costly-to-reverse decision, so no new ADR is needed. Delta specs cover subscription ownership/recovery, MMKV classification, and environment invalidation.

Proof is layered: controller tests use controlled promises and fake timers; storage recreation proves dirty restart and the mark-before-preference crash; root integration tests prove the one listener/request source, route remount, calendar readiness, token rotation, locale/zone/calendar invalidation, foreground recovery, and reset during a request; screen tests prove shared status and Retry. A repository contract test rejects reintroduction of the generated mutation hook or a second token listener in screen code.

## Risks / Trade-offs

- [A timeout can let an older server request finish after the client starts its repair PUT] → document eventual repair rather than strict ordering; startup/foreground/input/manual recovery always sends the latest full snapshot.
- [A missed input edge could leave the backend stale] → one root owner observes token, calendar revision/readiness, language, effective zone, preferences, startup, and foreground; tests enumerate each edge and cold start remains the backstop.
- [Dirty metadata and preference writes are not one transaction] → dirty-before-mutation makes both crash orderings converge through full-snapshot replay.
- [Retries could drain battery or loop on missing prerequisites] → no retry is scheduled for waiting states; automatic delays are finite and active-only; durable dirty state outlives exhaustion.
- [Reset completion races with old async work] → epoch and generation checks precede every local side effect, while AbortSignal and timer cancellation reduce unnecessary work.
- [Shared status copy could imply notification delivery] → translations say remote settings are pending/saved and explicitly avoid permission or delivery claims; D04 permission boundaries remain unchanged.

## Migration Plan

1. Add total storage metadata helpers/classification and the pure controller with focused tests.
2. Add the generated plain-function transport and readiness-aware current-snapshot adapter.
3. Mount the single root runtime and reroute preference/token/locale/zone/calendar/foreground triggers to it; remove duplicate hook mutations/listeners.
4. Connect the shared status and Retry to the existing screen, then connect environment reset/disposal.
5. Update specs and Architecture Book guidance, run focused tests and the full mobile local gate, and include the controller integration suite as the CI proof test.

The metadata is additive and ignored by older builds. Rollback to the previous client leaves harmless backend-bound keys that a later reset removes; the old client still cold-start PUTs current preferences. No server rollout, migration, native build configuration, or human credential step is required.

## Open Questions

None. D03 fixes the ownership and eventual-consistency model; D04 fixes the permission boundary; D05 fixes schedule and owner-led device acceptance. The implementation should escalate only if the generated transport cannot accept cancellation or the existing calendar snapshot cannot expose loaded state as inspected.
