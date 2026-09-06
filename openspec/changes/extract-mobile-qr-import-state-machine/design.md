## Context

`QrScanScreen` currently combines five concerns: camera permission presentation, barcode parsing,
the add-calendar async sequence, recovery transitions, and navigation/lifecycle effects. Its refs
correctly provide synchronous exclusion where React state alone cannot, while its independent
booleans and nullable `attempt` allow combinations that are not meaningful states. The binding
mobile QR specification and Architecture Book require a valid failed attempt to remain locked and
retryable with its originally normalized URL and import fields.

This is a local refactor inside the existing `calendar-sources/ui` boundary. The data seam,
onboarding draft provider, router contract, camera configuration, translations, and public exports
do not change. No new ADR is warranted because this applies the established feature-controller
pattern without changing a load-bearing rule.

## Goals / Non-Goals

**Goals:**

- Give every scan/import/recovery transition one explicit owner and make impossible render states
  unrepresentable.
- Retain synchronous exclusion, captured retry inputs, exactly-once completion, and unmount safety.
- Keep the screen as a small composition shell and each view materially below 200 lines.
- Preserve all visible copy, accessibility properties, test IDs, navigation targets, and public
  module boundaries.
- Produce direct transition tests plus screen integration tests that protect the full current
  behavior.

**Non-Goals:**

- Changing parsing, calendar creation, durable persistence, draft lifetime, error reporting, or
  import-journey navigation.
- Adding state-management or camera dependencies, persistence, navigation parameters, analytics,
  or a QR failure-reporting route.
- Removing legitimate lifecycle synchronization merely to reduce effect count.
- Editing the Architecture Book, API contract/generated client, database migrations, native/store
  configuration, deployment/CI, or legacy Flutter code.

## Decisions

### Decision 1 — One controller hook owns a discriminated render state and transition commands

Add a focused `useQrImportController` beside the screen. It exposes a discriminated state and the
commands the views can invoke; the screen and views do not set transition state directly.

The render state has only these phases:

- `scanning`, optionally carrying the recoverable invalid-payload indication;
- `importing`, carrying the immutable captured attempt;
- `failed`, carrying that same captured attempt; and
- `completed`, a terminal state while success cleanup/navigation runs.

The attempt is a value `{ url, fields }`, created only after the pure parser accepts a barcode. The
controller shallow-copies `fields` when capturing it, so later renders or draft changes cannot alter
retry input. `retry` is available only from `failed` and reuses this value; `scanAnother` discards it
and returns to `scanning`; manual URL navigation leaves it and the Stack-scoped draft untouched.

This resolves the React Doctor concern about a standalone `attempt` state used only by handlers.
The attempt becomes part of render-driving tagged state: its presence distinguishes import and
failure states, and the failure view is the only phase that can issue Retry. Controller tests prove
the captured value governs retry even if the current draft and camera input later change. If React
Doctor still reports the tagged field, the Apply evidence must classify that result against these
render and test dependencies rather than suppress it.

Alternative: store the attempt only in a ref and keep booleans for rendering. Rejected because it
separates recovery data from the phase in which it is valid and preserves impossible boolean
combinations. Alternative: use only React state for exclusion. Rejected because camera callbacks
and rapid presses can occur before a render commits, so the first callback must close the gate
synchronously.

### Decision 2 — Refs own imperative guards; the reducer/state owns presentation

Keep three controller-private refs with narrow purposes:

- `activeRef` prevents any navigation, draft clearing, recording, or state dispatch after disposal;
- `inFlightRef` closes synchronously before calling the async seam and excludes every concurrent
  scan or retry; and
- `completedRef` makes success cleanup and navigation exactly once.

The scan gate also remains synchronous: a camera result claims it before parsing. Invalid input
transitions back to `scanning` with guidance and immediately re-arms; a valid input stays claimed
through `importing` and `failed` until Scan another. Async work uses `try/catch/finally` (or an
equivalent single settlement path). A rejection that still belongs to an active, incomplete
controller records exactly once, releases the in-flight gate, then exposes `failed`; a late
settlement only releases internal refs and produces no external or React-state effect.

The mount/unmount effect is retained because synchronizing the controller with component lifetime
is a genuine external lifecycle concern. Moving these guards into a reducer was rejected: reducers
must stay pure and cannot synchronously coordinate camera callbacks, promises, navigation, or
error recording.

### Decision 3 — Small views receive state and commands, never infrastructure seams

Keep `QrScanScreen` as the composition root for camera permissions, add-calendar, import fields,
draft cleanup, navigation, and the controller. Split presentation into cohesive modules or small
same-folder components:

- permission loading/request/settings views;
- the QR camera/scanner view and its invalid-payload notice;
- an importing/progress presentation that retains the current camera experience and locks input;
- a terminal success presentation used only during exactly-once journey exit; and
- the failure/recovery view with Retry, Scan another, and manual URL commands.

No view imports the generated client, draft context, Firebase seam, or router. Existing translation
keys, control test IDs, accessibility roles/labels/live regions, theme tokens, QR-only camera
configuration, and touch-target sizing remain unchanged. Progress and completion introduce no new
copy or dwell state: they represent controller phases while preserving the current interaction and
immediate success exit.

Alternative: one large `QrScannerView` containing every permission and recovery branch. Rejected
because it would move rather than remove the mixed responsibility and would not meet the component
size goal. Alternative: create a new feature sublayer. Rejected because this is UI orchestration,
not a reusable domain/data boundary, and the established `ui/` controller pattern already fits.

### Decision 4 — Test the controller contract directly and retain end-to-end component wiring

Add focused controller-hook tests with deferred promises for transition ownership and race safety.
Keep screen tests for camera permission rendering, the real parser boundary, existing UI/a11y/test
IDs, router behavior, and public seam wiring. Together they cover valid scan, invalid payload,
initial failure, failed retry, successful retry, rapid scan/retry duplication, Scan another, manual
URL, direct-route empty fields, and resolve/reject after unmount.

The unmount cases assert no draft clear, navigation, recording, or React state-update warning. The
retry case changes both the current camera payload and current draft after failure, then proves the
captured normalized URL and fields are reused. No wait timeout, retry helper, or weakened matcher is
added to hide a race.

## Risks / Trade-offs

- **[A state dispatch opens a race before a render commits]** → Close scan and in-flight refs before
  parsing or invoking the add-calendar promise; test multiple callbacks and presses in one turn.
- **[A stale promise completes after unmount or after success]** → Check active/completed guards
  before every observable settlement effect and test both late resolve and late reject.
- **[Refactor changes a11y or selectors while moving markup]** → Preserve existing props and IDs
  verbatim in view-level integration assertions.
- **[Controller/view splitting creates import cycles]** → Keep files in `calendar-sources/ui`, import
  the sibling `data` barrel, and export only the screen through existing public barrels.
- **[React Doctor reports the captured attempt despite tagged-state use]** → Record the exact
  changed-file result and classify it with the phase rendering and retry-capture tests; do not add
  a suppression without evidence.

## Migration Plan

Land the controller, views, and adjusted focused tests atomically on the existing branch. There is
no persisted-state, API, or rollout migration. Rollback is a normal code revert because the public
route, data seam, and stored calendar format remain unchanged.

## Open Questions

None.
