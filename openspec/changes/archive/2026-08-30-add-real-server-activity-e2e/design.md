## Context

This is Ticket 7 of the Activity revival delivery plan ([TIM-400](/TIM/issues/TIM-400), parent
[TIM-389](/TIM/issues/TIM-389)). The authoritative source is
`docs/react-native-migration/05-tech-specs/activity-revival.md` at
`595786a01c5678158905d4a16ca1d6beba90c9d3`, specifically **Verification strategy → Integration,
Maestro, and device checks** and **Delivery plan → Ticket 7**.

The required production behavior already exists: the v1 page endpoint, incremental SQLite cache,
Settings badge and Activity screen, and sync/push/open/foreground/removal triggers. This change adds
verification without changing those contracts.

The supported real-server path is fixed:

```text
mobile/e2e/run_e2e.sh
  -> ci/e2e-server.sh up
     -> isolated timecalendar_test db:init
        -> server/src/scripts/seed-e2e-calendar.ts (NODE_ENV=test only)
  -> one Maestro process per top-level mobile/.maestro/*.yaml
  -> ci/e2e-server.sh down
```

The host has no KVM and cannot run Android Emulator or iOS Simulator Maestro. Native execution is
therefore a post-merge `main` CI proof; this branch can prove the server fixture, Jest integrations,
Maestro syntax/selector shape, and the ordinary mobile gates.

## Goals / Non-Goals

**Goals:**

- Prove the six fixture cases deterministically: new, changed, cancelled, same timestamp with ID
  tie-breaking, unread, and more than one 50-row page.
- Exercise the real generated-client → mutator → NestJS → Postgres path from the app.
- Make every negative Maestro assertion non-vacuous and keep one shared selector-safe flow for
  iOS and Android.
- Prove cached offline restart and removal-driven pruning at the integration boundary rather than
  by mocking the operation under test.
- Leave a standalone real-device checklist for the OS-only push and foreground behavior.

**Non-Goals:**

- Production data, production seed changes, load testing, live university feeds, or a broad sync
  harness rewrite.
- A new API route, OpenAPI/client regeneration, schema migration, native config change, or Flutter
  maintenance.
- Running or claiming a native pass on this no-KVM host, or adding the `run-e2e` PR label contrary
  to board policy.

## Decision 1 — Stage unread with two calendars; do not use clocks, mocks, or a test-only endpoint

A fresh Activity state has `lastReadAt = null`. The first newest-page request deliberately omits
`unreadSince`, so even a server full of logs cannot produce a badge on first import. A one-calendar
static fixture therefore cannot satisfy "import → sync → observe unread" without cheating.

The flow uses two dedicated calendars:

1. `e2e-activity-baseline` has one old calendar-log row. A nested baseline-import subflow starts
   from `clearState`, imports it, and waits for sync. The flow opens Activity once; the screen's
   existing cache-read action stores that old row's server timestamp as the read watermark.
2. `e2e-activity-calendar` has 52 newer rows. A second nested import subflow cold-opens the existing
   dev-import route **without** `clearState`, so both tokens remain held. The sync-triggered forced
   Activity refresh sends the baseline watermark as `unreadSince`; the real v1 endpoint returns
   `unreadCount: 52`, which the real Settings badge renders.

Both subflows live below `mobile/.maestro/activity/`, so `run_e2e.sh` does not discover and execute
them as independent top-level flows. The only top-level addition is `activity.yaml`.

Rejected alternatives:

- A future-dated row plus a timed wait is clock-sensitive and would create the exact CI flake this
  ticket is meant to remove.
- A test-only server mutation endpoint changes a contract surface solely for test orchestration.
- Writing `activity_state` directly from Maestro bypasses the app seam and proves less than the
  existing screen action.
- Reusing `e2e-smoke-calendar` would couple Activity's staged state to unrelated calendar-family
  flows. Dedicated fixed IDs/tokens keep the seed additive and isolated.

## Decision 2 — Put the page boundary through the same-timestamp pair

The newer calendar owns exactly 52 log rows, ordered as follows:

- positions 1–3: one new, one changed, and one cancelled log with stable ASCII titles and UIDs;
- positions 4–49: deterministic filler logs;
- positions 50–51: two logs with the exact same `createdAt` and fixed UUIDs whose descending ID
  order is known;
- position 52: a stable older-page anchor.

The baseline calendar's single older row follows those 52 rows once both calendars are held. With
the mobile client's explicit page limit of 50, page one ends on the higher-ID tie row and page two
begins on the lower-ID tie row, then returns the older anchor and baseline. This makes the older
page prove both pagination and the ID tie-break instead of merely proving that 51 arbitrary rows
exist.

All IDs, tokens, names, event UIDs, titles, locations, relative timestamp offsets, and row counts
are constants. The seed writes exact `createdAt`/`updatedAt` values (including the shared timestamp)
instead of trusting `CreateDateColumn` timing. `db:init --drop` remains the lifecycle reset; saves
are nevertheless fixed-ID/idempotent like the existing smoke and rename calendars.

The target calendar's current `CalendarContent` contains the new event and the changed event's new
UID so both routes resolve to real current details. The cancelled UID is absent, which is why its
history row must remain inert.

## Decision 3 — Prove the fixture through the real HTTP search contract in server Jest

A colocated server integration test runs the seed against the worker-isolated Postgres database and
calls `POST /v1/calendar-logs/search` through the Nest test app. It asserts:

- rerunning the seed restores the fixed names/content/log set;
- the baseline-only search returns its one row;
- the two-token search with the baseline row's timestamp as `unreadSince` returns
  `unreadCount: 52`;
- page one has 50 rows and a cursor; page two has the remaining target rows plus the baseline and a
  null cursor;
- the fixed same-timestamp IDs appear once each, in descending-ID order on opposite sides of the
  boundary; and
- no response contains a calendar token.

This is the CI proof for the fixture itself. It complements, rather than duplicates, the endpoint's
generic pagination tests: those prove the algorithm over factories; this test proves the exact
artifact that `ci/e2e-server.sh` loads and Maestro consumes.

The seed may be factored into a sibling `seed-e2e-activity.ts` to keep the existing calendar seed
readable, but `seedE2eCalendar(dataSource)` remains the one `NODE_ENV=test` entry called from
`seed-database.ts`. No lifecycle script or workflow edit is needed.

## Decision 4 — Use route-stable IDs and positive anchors; never use `back`

The Activity flow follows the selector-drift evidence in commits `7728d1a1`, `4da219de`, and
`03d7e6be`:

- rows are selected by existing `testID` families (`settings-activity`,
  `activity-<kind>-<uid>`, `activity-cancelled-<uid>`) rather than child text that iOS may collapse
  into a composed accessibility label;
- below-the-fold rows use `scrollUntilVisible` before activation;
- `assertNotVisible` is used only after the same selector was positively observed, or alongside a
  positive screen anchor that rules out an empty/wrong-screen false green;
- no `- back` command is used. Re-entry is `stopApp` → `openLink` → optional iOS "Open" →
  `extendedWaitUntil` with a 60-second cold-start budget;
- the cancelled-row tap is followed by a positive `activity-section-list` assertion and absence of
  the unique details-only location, proving the route stayed put; and
- Settings first proves the composed unread accessible name is visible. After Activity opens, the
  flow reopens Settings, positively observes the row, then proves that previously matched unread
  name is absent.

New testIDs are added only if the native hierarchy cannot address an existing stable node. Any new
ID gets a colocated component assertion and a static selector check. The Applier must not weaken a
real-data assertion to a loading, empty, or mere route-title assertion.

## Decision 5 — Gesture refresh and scroll-driven pagination stay black-box

After the routing checks, the flow cold-reopens Activity at the top, performs a downward pull
gesture on the list, and waits for the known first-page anchor to remain visible. The screen's Jest
integration continues to prove that this gesture's `RefreshControl` callback requests a forced
newest page; the Maestro step proves that the native gesture works without losing the real-server
timeline.

For the older page, `scrollUntilVisible` targets the fixed position-51 tie row / older-page anchor.
It cannot exist in the first 50-row response, so seeing it proves that `onEndReached` called the
real older-page request and that the returned page reached SQLite and the rendered list. This is a
stronger signal than asserting the transient spinner, which can legitimately settle too quickly
for Maestro to observe.

## Decision 6 — Integration tests keep the real Activity layers and mock only external seams

The offline-restart integration uses the shared stateful `createFakeDb` pattern from
`testing.md`: store a real page, reset Activity modules while preserving the fake's backing Maps,
make the `customFetch` mutator reject, mount the real Activity screen/data hooks, and assert the
cached title renders with the cached-failure state. The test asserts that no request succeeded;
failure is expected and cached rows remain.

The removal integration seeds rows for two calendars through the real repository, mounts the real
`useActivityOwnershipPrune`, supplies a loaded two-calendar baseline through the calendar-sources
hook seam, then removes one calendar. It reads through the real Activity repository and asserts
only the removed calendar's rows disappear while Activity state is byte-for-byte unchanged. It
must not replace `pruneToHeldCalendars` with a no-op spy, which is the narrower wiring proof the
existing lifecycle suite already owns.

These tests mock `customFetch` and calendar-source hooks because those are the Architecture Book's
owned seams; they do not mock the coordinator, repository, or prune operation being proven.

## Decision 7 — Device evidence is precise, separate, and non-blocking

A new inbox note tagged `(HUMAN: Activity real-device verification)` contains prerequisites,
seed/lifecycle commands, payload examples, exact foreground/background/cold-start cases, expected
badge/timeline results, iPhone/iPad portrait/Android form-factor scrolling, and a result table for
iOS and Android. It repeats every needed step so its operator need not read this ticket.

The note explicitly distinguishes automated evidence from OS-only evidence and says it never
blocks this PR. The ticket and PR report Maestro as **not run on this host**. Per board policy, the
PR receives no `run-e2e` label; the post-merge `main` native workflow is the definitive simulator
run, while physical-device push/foreground evidence remains the human note.

No ADR is added. The staged fixtures are a local verification technique, not an expensive-to-reverse
application architecture decision. The reusable rule belongs in `testing.md` and its changelog.

## Risks / Trade-offs

- **The fixture count is coupled to the 50-row client budget.** → Name the count and boundary in
  constants/tests; if the capacity ticket changes `ACTIVITY_PAGE_LIMIT`, this fixture and its proof
  fail visibly and must move together.
- **An unawaited post-sync Activity refresh may finish after dev-import navigation.** → The flow
  waits on the Settings unread accessible name, not merely on landing on Calendar.
- **The screen's read effect may race the second import.** → Positively observe the baseline row on
  Activity and then the zero-unread Settings row before importing the newer calendar.
- **Large Activity content can move targets below the fold.** → Use IDs plus
  `scrollUntilVisible`; never treat a direct missing-element failure as evidence of deletion or
  inertness.
- **The full folder includes unrelated flows and stops at the first failure.** → Keep Activity in
  one top-level flow, retain the process-per-flow wrapper, run syntax/static checks locally, and
  report native execution exactly as observed.
- **Server seed tests could collide with fixed IDs inside one worker database.** → Make the seed
  idempotent and assert restoration on a second call rather than relying on test ordering.

## Migration Plan

This is additive test and documentation work. Merge adds test-only rows only to the isolated
`timecalendar_test` seed. Rollback is a normal revert of the seed, tests, Maestro flow, and docs;
there is no deployed data or schema to migrate.

## Open Questions

None. The authoritative specification and landed dependencies define the required behavior; the
staged two-calendar fixture resolves the only orchestration ambiguity without expanding a public
surface.
