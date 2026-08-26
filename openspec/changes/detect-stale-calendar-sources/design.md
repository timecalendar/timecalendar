## Context

`POST /calendars/sync` currently catches each source failure, retains the stored
`CalendarContent`, and returns that last-good content with no per-calendar health signal.
`Calendar.lastUpdatedAt` is an attempt timestamp (it advances on failure), while
`calendar_log.createdAt` records successful content changes. This makes an expired source
look freshly synced even when it can only return old events.

The rentrée investigation found 2,892 recently accessed calendars with an explicit
`lastDate` in the past. AMU is the clearest known transition: its retired
`ade-web-consult.univ-amu.fr` / 2025–26 source still serves old content while the current
year is published through `agenda-web-consult.univ-amu.fr`. URLs and tokens are sensitive
and must remain confined to the existing server-side fetch/identity seams.

The server already has the needed durable evidence: stored source metadata, school
identity, calendar content, and indexed calendar-change history. The mobile app already
has an offline-safe event cache and an MMKV seam suitable for a rebuildable advisory
snapshot, so neither server nor SQLite schema evolution is required.

The applied source-health snapshot exposed a leaf orchestration race in the existing
dev-import E2E seam. `replaceSourceHealthSnapshot` synchronously notifies a mounted Calendar
subscriber, rerendering the production tree while the import's async effect is still in
flight. Because that effect's cleanup currently marks the run cancelled whenever hook
dependencies change identity, the successful real sync can skip its guarded
`router.replace("/calendar")` and leave native E2E on the loading screen. Separately, the
committed Maestro flows still target the removed `calendar-view-agenda` item id even though
the live UI now exposes a `calendar-view` native menu whose action is labelled `Agenda`.

## Goals / Non-Goals

**Goals:**

- Produce a conservative, explainable stale-source signal without deleting content.
- Guide affected students through the existing add-calendar flow, including explicit AMU
  2026–27 guidance.
- Keep last-good events visible during source failure and recovery.
- Keep URLs/tokens out of the new DTO, local health snapshot, UI, accessibility strings,
  analytics, Crashlytics, and test output.
- Make the classifier deterministic and cheap enough for batch sync responses.
- Preserve the real dev-import add → sync → SQLite path while guaranteeing exactly one
  Calendar navigation across source-health subscriber rerenders when still mounted.
- Drive Agenda through the current native menu on Android and iOS without weakening seeded
  event or event-details assertions.

**Non-Goals:**

- Proving that every source classified as non-stale is currently reachable.
- Automatically rewriting stored URLs, deleting old sources, or migrating subscriptions.
- Adding a failure-history table, schema migration, production backfill, or deploy act.
- Changing the legacy Flutter app or solving generic iCal import failures.
- Adding timeouts, mocking the native round-trip, restoring removed menu-item test IDs, or
  changing CI/workflow files to mask the failures.

## Decision: Return advisory health beside each batch-sync calendar

`CalendarWithContent` gains a required `sourceHealth` object with stable enums:

- `status`: `healthy | unknown | stale`;
- `reason`: `expired_export_window | known_source_transition | null`;
- `recoveryAction`: `re_add | null`;
- `guide`: `amu_2026_2027 | null`.

The nested object contains no source URL, query value, token, raw error, or arbitrary
server text. `healthy` means that a reviewed positive rule applies; `unknown` means no
conclusive stale evidence, not that the upstream is healthy. Mobile renders recovery UI
only for `stale`, so uncertainty does not alarm users. Stable codes let mobile own typed
French/English copy and accessibility semantics.

The health belongs beside `CalendarWithContent`, not inside `CalendarForPublic`: it is
evaluated in the batch-sync context and does not silently change every endpoint returning
calendar identity. The API addition is additive for existing clients.

Alternatives rejected:

- Returning URLs or human-written server messages leaks source credentials/identifiers and
  bypasses typed localization.
- Encoding health in HTTP failure status loses per-calendar results in a batch and would
  hide the last-good content.
- Returning only a boolean cannot distinguish an AMU migration from a generic expired
  export window or evolve recovery safely.

## Decision: Use conclusive rules, not age alone

A pure classifier receives parsed, internal evidence and an injected clock. It never logs
or returns the raw URL. Rules run in priority order:

1. A reviewed known-transition rule matching AMU's retired host/year source returns
   `stale / known_source_transition / re_add / amu_2026_2027` immediately. Matching the
   AMU school alone is insufficient because current AMU sources must not be flagged.
2. A syntactically valid explicit `lastDate` older than a 14-day grace period is stale when
   the latest successful content-change timestamp is absent or does not post-date the
   expired window plus grace. It returns
   `stale / expired_export_window / re_add / null`.
3. A reviewed current-source rule may return `healthy`. All remaining, unparseable, or
   weak-evidence cases return `unknown`.

The explicit window is inherently unable to fetch the current term; last-change evidence
guards against surprising post-window activity, and the grace avoids alarming a student
immediately after a legitimate short window ends. `lastUpdatedAt` is deliberately not used
as success evidence because current code advances it after failed fetches.

The known-transition registry is small typed application policy colocated with the
classifier. It matches parsed hostname and non-secret year/project characteristics rather
than exposing them. Each entry requires a unit test for positive and near-miss current-host
cases. It is not a general URL-rewriter.

Alternatives rejected:

- “No change for N days” alone is unsafe: a correct timetable may genuinely be unchanged.
- An expired window alone without a grace/evidence check is noisier around short legitimate
  exports.
- Persisting failure streaks would require a server migration and rollout/backfill work not
  needed for the strong signals in this ticket.

## Decision: Aggregate change evidence once per response

The calendar-log repository adds one grouped query returning the latest
`calendar_log.createdAt` for all calendar IDs in the response. The calendar service loads
that map once, classifies each calendar in memory, and maps content/subjects/health into the
DTO. It must not issue one query per calendar or hydrate full log/change JSON.

Classification happens after due sync attempts finish, so an empty/erroring source still
returns its last-good content plus the newly evaluated stale status. Background fetch jobs
do not need to build a public DTO and therefore do not run the classifier.

## Decision: Keep mobile health in a rebuildable MMKV snapshot

The calendar-sources feature owns a typed `store/` module keyed by calendar ID. A successful
batch response is validated/mapped in `data/` and replaces one JSON MMKV value through
`@/storage`; it stores only the enum fields and calendar IDs, never tokens or URLs. Reads are
total: malformed or unknown enum values degrade to `unknown` and never suppress events.

The sync orchestrator replaces SQLite event rows first and then replaces the health
snapshot. A request or local event-write failure leaves both previous snapshots intact. A
health-write failure is a local persistence error recorded through `@/firebase`; event rows
remain usable and the UI falls back to the previous/unknown health state. Removing a user
calendar also removes its keyed health entry; replacement prunes entries not returned by
the server.

This avoids a Drizzle migration for advisory, server-rebuildable state and preserves ADR
018's durable calendar identity shape. An in-memory-only value was rejected because it
would disappear on restart/offline launch; adding health columns to `user_calendars` was
rejected because it couples rebuildable server advice to irreplaceable identity storage.

## Decision: Separate dev-import mounted lifetime from reactive dependency churn

The dev-import screen keeps its one-run guard, but mounted lifetime is tracked independently
from the async orchestration effect. The import uses current sync/router operations without
making ordinary callback identity changes equivalent to unmount. A successful token add and
real `useSyncCalendars().sync()` therefore performs one guarded
`router.replace("/calendar")` if the screen is still mounted; a genuine unmount suppresses
both navigation and error-state updates.

The regression proof mounts a reactive `useSourceHealthSnapshot` consumer in the same test
tree as `DevImportScreen`, drives the real generated sync hook with `customFetch` mocked at
the documented seam, and uses the existing DB/storage test seams. Its successful response
writes SQLite events and the MMKV health snapshot, forcing the rerender that previously
cancelled navigation. It asserts one add, one sync request/write sequence, and exactly one
Calendar replacement. Existing production-inert and failure tests remain unchanged.

This is a local lifecycle correction, not a new reusable navigation or storage rule, so it
does not amend ADR 030 or the Architecture Book. Moving navigation into the sync hook was
rejected because the data-layer seam must remain route-agnostic. Removing the mounted guard
was rejected because a completed request must not update or navigate an actually unmounted
screen. A timeout/retry was rejected because it would only hide deterministic cancellation.

## Decision: Exercise the live native Calendar view menu in Maestro

Maestro opens the stable `calendar-view` control and selects the visible `Agenda` native
menu action on both platforms. The Applier replaces every committed use of the removed
`calendar-view-agenda` selector in the affected calendar-family flows, not only the first
lexically failing flow, so the process-per-flow native suite can reach its integrated end.
The anchor `calendar.yaml` flow continues to assert `E2E Today Lecture`, open that real synced
event, and assert `Room E2E Lecture`; stale recovery and hidden-event flows retain their own
existing seeded assertions and actions.

Restoring implementation-only item test IDs was rejected because native menu children are
platform-owned and the stable public interaction is the menu plus localized action label.
Skipping Agenda or weakening the seeded assertions was rejected because it would stop
proving the server → generated client → SQLite → Calendar round-trip.

## Decision: Recovery is additive and user-controlled

If any held calendar is stale, Calendar shows an accessible non-modal banner above the
last-good timetable with a button to `/user-calendars`. Calendar management marks each
stale row, explains the reason with typed localized copy, and offers “Add updated calendar”.
That action enters the existing school/add-calendar route with recovery context; AMU gets
specific 2026–27 wording, while the generic expired-window case uses neutral re-add copy.

The old calendar remains visible and stored. A successful add does not automatically remove
it; the user can compare and deliberately delete it through the existing confirm-gated
control. This prevents a failed re-add from destroying the only timetable and avoids a
hidden bulk migration. No feed URL/token appears in visible copy, accessibility labels,
navigation parameters, or diagnostic events.

Automatic rewrite/delete was rejected because host/project transitions are not reversible,
can change resource identity, and would be a deploy act requiring separate human approval.

## Decision: Treat the non-destructive recovery contract as load-bearing

The Applier adds the next available Architecture Book ADR for “preserve last-good content
and expose advisory source recovery”, updates the decisions index, and updates
`calendar.md` with the current sync contract. The ADR records the data-safety boundary and
revisit condition (a future authenticated server-side migration mechanism with audited
rollback), while implementation-specific thresholds remain in tested code.

## Risks / Trade-offs

- **[False positive from an unusual expired window]** → Require expiry beyond the grace,
  consider last-change evidence, keep recovery advisory, and never delete/rewrite.
- **[False negative for feeds without explicit dates]** → Return `unknown`; expand only via
  reviewed school rules or a separately designed failure-history capability.
- **[Pruned calendar logs yield no last-change row]** → Treat absence as missing evidence,
  not recent success; the expired-window/known-transition evidence remains explainable.
- **[AMU changes its source again]** → Keep exact old/current host near-miss tests and make
  the registry entry easy to remove; no stored source is mutated.
- **[Batch query cost]** → One indexed grouped projection over only returned calendar IDs;
  add a repository query-shape test and avoid log payload hydration.
- **[Stale health snapshot offline]** → It is advisory and last-observed; it never controls
  event visibility or deletion. A later successful sync replaces it.
- **[New banner affects dense calendar layout]** → Keep it compact/non-modal, component-test
  large text, and require QA/device review through the migration inbox and CI Maestro.
- **[A hook callback changes identity during an in-flight import]** → Decouple mounted
  lifetime from render dependencies and prove the synchronous MMKV subscriber rerender with
  the real sync hook.
- **[A later Maestro flow still uses the removed agenda selector]** → Replace every
  committed `calendar-view-agenda` use in the affected native flows and require both
  platform jobs on the exact integrated head.

## Migration Plan

1. Land classifier, aggregate query, DTO, committed OpenAPI, generated client, mobile store,
   UI, tests, Architecture Book/ADR, and the human device-check inbox note in one PR.
2. Deploy normally only after the contract-compatible server and mobile code pass review;
   no backfill or data mutation runs at deploy time.
3. Older mobile clients ignore the additive response field. New clients treat an absent
   field defensively as `unknown` during mixed-version rollout.
4. Rollback is code-only: revert server/mobile behavior. Existing events and calendar
   identities are untouched; the namespaced MMKV advisory value can be ignored or removed.
5. Before Reviewer sign-off, run the focused dev-import regression plus existing import,
   sync, and source-health tests, then require green Android and iOS labelled native E2E on
   the exact integrated head. No workflow edit, deploy act, or separate QA gate is needed.

## Open Questions

- None blocking implementation. Any proposal to auto-migrate AMU calendars or backfill
  source health must be a separate human-gated rollout ticket with measured matching,
  rollback, and upstream-load analysis.
