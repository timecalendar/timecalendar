## Context

QR and iCal imports currently share `useAddCalendar()`, whose operation is `POST /calendars` → resolve the returned token → upsert `user_calendars`. The server creates and populates calendar content synchronously, but the mobile operation does not hydrate `calendar_events`; event hydration normally happens only through startup or user-initiated calendar sync. A successful import therefore exits before the local timetable is ready.

The success exit also calls `dismissAll()` from inside the nested onboarding Stack. In Expo Router 56 this pops only the closest Stack, while clearing the onboarding draft can independently activate protected-route recovery. The combined behavior can expose School instead of the calendar. QR importing and completed phases meanwhile keep rendering an unchanged live camera, and provider selection returns before mounting its `Stack.Screen` title during loading/error.

The root navigator already anchors `(tabs)` as its initial route. The installed Expo Router 56 implementation targets the deepest divergent navigator for an absolute href; `dismissTo` pops to an existing target and replaces the current route only when the target is absent. These semantics let the app remove onboarding without resetting the root navigator or creating a second tabs entry.

Constraints include the existing generated API client, SQLite schemas, privacy rule forbidding calendar URLs/tokens in route parameters and diagnostics, feature-boundary rules around generated imports and `@/db`, and the current offline-safe rule that a failed sync preserves last-good events.

## Goals / Non-Goals

**Goals:**

- Give QR and iCal imports explicit, accessible progress, error, and success states.
- Remove onboarding once calendar identity is durable, without a guard race or unbounded sibling-route history.
- Show success only after the newly held calendar's events are committed locally and ready for reactive calendar reads.
- Make retries resume the furthest safe in-memory checkpoint instead of repeating completed steps.
- Serialize calendar-sync writes and let import require a pass that starts after any older in-flight pass.
- Keep startup, pull-to-refresh, notification, foreground, and import triggers on one sync implementation with their existing observability behavior.
- Use short, stable native chrome for export-guide provider states.

**Non-Goals:**

- Enabling notifications from the success screen.
- Changing server calendar creation, adding an idempotency key, regenerating OpenAPI, or changing the generated mobile client.
- Persisting unfinished import checkpoints across process death or deliberate abandonment.
- Adding or migrating SQLite tables, MMKV keys, native dependencies, or permissions.
- Changing export-guide content, catalogue validation, image hosting, or guide-page history.

## Decisions

### 1. One root result route owns event finalization and success

After `user_calendars` upsert succeeds, QR and iCal call `router.dismissTo("/calendar-import-result")`. Because this root route is not already in the stack, Expo Router targets the root Stack, removes the focused onboarding entry, and places the result above the existing tabs anchor:

```text
before: [Tabs, Onboarding(..., Import method, QR or iCal)]
after:  [Tabs, Calendar import result]
```

Unmounting the onboarding layout clears the ephemeral draft by ownership; the import screen does not clear it before navigation, so protected-route recovery cannot race the exit. The result route receives no URL, token, school, programme, or success flag. It reads the durable calendar-token set through the calendar sync seam.

The route renders three phases:

1. loading events, with a polite status and disabled duplicate execution;
2. recoverable failure, stating that the calendar was added but events could not be loaded, with Retry and a secondary route to Calendar;
3. success, stating that the timetable is ready, with a primary “View my timetable” action.

The success action calls `router.dismissTo("/calendar")`. This pops the result to the existing `(tabs)` entry and selects Calendar. It does not use `navigate`, because `navigate` is not a sufficient proof that an existing root navigator entry will be popped in the installed router. Native Back from the result also reaches tabs, never onboarding. The result route remains a suitable owner for a later notification action, but this change adds none.

Alternatives considered:

- **Keep success inside QR/iCal:** rejected because native Back could re-enter the completed import chooser and because two source screens would own duplicate finalization UI.
- **Call `dismissAll()` or reset the root state:** rejected because `dismissAll()` is scoped to the closest Stack and a reset discards more navigation state than necessary.
- **Use `replace("/calendar")` immediately:** rejected because it provides no success dwell and makes sync failure recovery indistinguishable from an empty calendar.

### 2. Sibling source switching changes mode without growing history

The import-method chooser intentionally pushes one chosen source. “Scan another QR code” clears the failed attempt and re-arms the camera on the same QR route. “Enter an iCal URL instead” dispatches the guarded handoff and calls `router.replace("/onboarding/ical-url")`, replacing the QR sibling. Native Back from iCal therefore returns to the chooser. Any future iCal-to-QR shortcut MUST use the symmetric replacement.

Guide pages continue to push one bounded entry per instruction page, because previous-page Back behavior is intentional and independent from source-mode switching.

### 3. Calendar addition exposes an attempt-bound resumable checkpoint

The shared add-calendar seam becomes an explicit operation/controller rather than one opaque promise. It retains only the current attempt's normalized URL, immutable create fields, and the furthest completed in-memory checkpoint:

```text
create pending
  → token received
  → metadata resolved
  → user_calendars committed
```

Retry resumes at the first incomplete step. A resolve or upsert failure after receiving a token never repeats `POST /calendars` during that mounted attempt. A new QR scan or materially changed URL is a deliberate new attempt and clears the prior in-memory checkpoint. Once the durable upsert commits, the source controller becomes terminal and routes to the root result exactly once.

This does not provide exactly-once server creation when the server commits but the original HTTP response is lost, nor does it recover a token lost to process death. Solving those ambiguity windows requires a server idempotency contract and is outside this change.

Alternatives considered:

- **Retry the complete chain:** rejected because `POST /calendars` is non-idempotent.
- **Persist an incomplete token locally:** rejected because it would add recovery schema/lifecycle policy beyond the reported flow and still would not solve a lost create response.
- **Change create to return all metadata/content:** rejected because it expands the server and generated-client contract unnecessarily.

### 4. Import progress replaces, rather than overlays, source input

On a valid QR claim, the camera unmounts and a shared readable progress view replaces it. This stops the visual impression that scanning is still active and minimizes continued camera exposure. On valid iCal submission, the form is replaced by the same progress treatment and duplicate submission is unavailable. Source-specific validation and pre-persistence recovery remain on their owning routes.

The QR controller continues to synchronously claim one barcode before React rerenders and ignores late settlements after unmount. Its terminal phase now means “durable identity committed and result navigation requested”, not “render the camera while immediately dismissing”.

### 5. Calendar sync uses a module-level serial coordinator with explicit outcomes

Every sync trigger goes through one coordinator. Ordinary startup, foreground, notification, Home, and Calendar triggers join the active pass. Import finalization requests `freshAfterCurrent`: if a pass is active, one follow-up pass is queued and coalesced; it starts even if the older pass failed and reads `user_calendars` only after that pass settles. No two passes can reach `replaceAll` concurrently.

This ordering prevents an older startup response, captured before the new token existed, from committing after the import pass and erasing the new calendar's events. The forced follow-up includes the durable token because result navigation happens only after the upsert commit.

The coordinator returns a discriminated outcome rather than swallowing all detail into hook-local flags:

- events ready, with metadata convergence either complete or stale;
- no held calendars;
- recoverable failure before event commit, classified as remote/read or local event write.

The existing hook maps outcomes back to `isSyncing` and `isError` for current consumers. A name-convergence write failure retains the current `isError` behavior for Calendar/Home, but import treats it as success because `replaceAll` already committed the events. Activity refresh remains fire-and-forget after the event commit and cannot turn success into failure.

Alternatives considered:

- **Call the current hook and inspect `isError` after awaiting:** rejected because the promise resolves on failure and React state is not an atomic operation result.
- **Allow parallel syncs with last-started generation checks:** rejected because superseded callers would still need to discover and await the winning pass.
- **Run a special one-calendar import fetch:** rejected because it would duplicate mapping, atomic replacement, observability, name convergence, and activity-trigger behavior.

### 6. Export-guide provider chrome is mounted before every early return

Provider selection always mounts `Stack.Screen` with a new short key such as “Export guide” / “Guide d’exportation”, then selects loading, blocking-error, or provider content beneath it. The existing long provider prompt becomes the `PageIntro` heading and its explanatory text remains the caption. This prevents Expo Router's raw `export-guide/providers` fallback and keeps native titles within compact chrome.

The guide-page title and intentional per-page stack behavior remain unchanged.

## Risks / Trade-offs

- **[Create response is ambiguous after a network loss]** → Resume only once a token is known, document the remaining server-idempotency gap, and do not claim exactly-once creation.
- **[A student abandons a post-token pre-upsert failure]** → Keep the primary Retry checkpoint-safe and treat Scan another, editing the URL, Back, or process death as explicit abandonment; no private checkpoint enters navigation.
- **[A result-screen Back occurs while sync is active]** → The module-level coordinator continues independently of the unmounted presentation; the existing Calendar pull-to-refresh remains the visible recovery path if it later fails.
- **[Serial sync increases latency behind a slow startup pass]** → Import requests exactly one coalesced fresh follow-up and displays progress; bounded server deadlines still apply.
- **[Global coordinator state complicates tests]** → Expose a test reset only through the established test-module pattern and prove joining, forced follow-up, failure handoff, and write ordering with deferred requests.
- **[Success with zero events can look suspicious]** → Treat a successfully committed empty server response as success; an actually empty timetable is valid, while transport/write failures use the error phase.

## Migration Plan

1. Add delta specs and architecture documentation for navigation, checkpoints, and coordinated sync.
2. Refactor sync behind the serial coordinator while preserving current trigger/UI behavior and prove it independently.
3. Add the root result route and its loading/error/success presentation.
4. Refactor shared add-calendar checkpoints, then wire iCal and QR to progress and result navigation.
5. Apply the provider-header copy/layout correction and complete FR/EN parity.
6. Run focused tests, full mobile tests/typecheck/lint/React Doctor as required, and verify the route stack and camera transition on iOS and Android.

The change is additive at runtime and needs no data migration. Rollback consists of reverting the mobile release; existing durable calendars and events remain compatible because storage and server contracts do not change.

## Open Questions

None for implementation. Server-issued idempotency for create-response ambiguity is explicitly deferred to a separate change.
