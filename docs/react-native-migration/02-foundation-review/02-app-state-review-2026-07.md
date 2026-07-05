# React Native app — technical state review (2026-07-04)

> **Scope:** the whole `mobile/` React Native (Expo SDK 56) app as it stands after
> Phases 0–05 of the migration — ~10.8k LOC of hand-written source across 231 files,
> 71 test files, 8 feature folders. This is a **technical health check**: what we did
> well, what we did badly, how we got here, what to continue, what to stop, and the
> concrete refactorings (3 major + a long tail) worth doing next.
>
> Author: FoundingEngineer (TIM-151). Method: read the actual code (not just the
> Architecture Book), fanned out four parallel audits (calendar feature, cross-feature
> consistency, test suite, infra+config), and hand-verified every load-bearing claim
> (dead-code greps, duplication counts) before writing.

---

## 0. TL;DR

**This is a genuinely healthy codebase — unusually so for AI-assisted work.** Strict
TypeScript (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), lint-enforced
architectural boundaries, zero `any`/`@ts-ignore`/`eslint-disable`/`TODO` in
hand-written source, current dependencies, and a clean seam architecture that has held
up across 25 ADRs and five phases. The pattern discipline is real, not aspirational.

**But the same discipline that made each feature clean also made them clones.** The
biggest problem is **horizontal duplication**: every write-capable feature independently
re-implements the same error-recording wrapper, the same defensive parsers, the same uid
wrapper, the same row↔domain mapper boilerplate, and the same ~100-line Drizzle test
fake. Nothing is *wrong*; there's just N copies of it. That is exactly what you'd expect
from a per-feature "copy the golden path" workflow with no back-pressure to extract
shared helpers once the third copy appears.

The three major refactorings below all attack that, plus one dead-code sweep and one
real product gap (E2E proves almost nothing about the five newest screens).

**Continue:** the seam architecture, the total/defensive parser posture, the
mock-at-the-seam test strategy, the ADR discipline.
**Stop:** copy-pasting the write/error/parse/mapper/test-fake boilerplate per feature
without extracting it; letting dead "insurance" code (`findInRange`, `getByUid`)
accumulate; shipping features whose only end-to-end proof is "the screen renders."

---

## 1. How we got here

The migration ran as a strict serial pipeline (plan → apply → simplify → review) with an
Architecture Book, an ADR log, and a Definition-of-Done gate per feature. Each feature
copied the **golden-path exemplar** (`src/features/<feature>/{data,store,form,ui}/`) and
passed the same lint/coverage/i18n/a11y gates.

That process produced two dominant effects, one good and one bad, and they're two sides
of the same coin:

- **Good:** every feature has the *same shape*, honors the *same boundaries*, and is
  independently testable. A new engineer can predict where anything lives. The B-1…B-4
  feature-boundary lint rules mean the seams are structural, not conventional.
- **Bad:** the pipeline optimized each feature *in isolation*. "Copy the golden path"
  had no counter-force of "…and when you write the third copy of this helper, extract
  it." The `simplify` stage runs on *the change's diff*, so it never sees that the
  `recordError` wrapper it's looking at is identical to six others already in `main`.
  Cross-feature duplication is invisible to a per-change simplifier by construction.

So the debt is not sloppiness — it's the predictable blind spot of a per-feature
assembly line. The fix is a small number of shared-infra extractions plus a habit of
"rule of three" back-pressure.

---

## 2. What's genuinely good (keep doing this)

1. **Lint-enforced seam architecture.** `react-native-mmkv`, `expo-sqlite`, `drizzle-orm`,
   `@expo/ui`, `@howljs/calendar-kit`, raw `fetch`, `axios`, and `@react-navigation/*`
   are all banned outside their one wrapper directory, and `eslint-plugin-boundaries`
   encodes the feature-module edges (B-1 `data/`-only seam, B-2 no self-barrel cycle,
   etc.). The single most impressive touch: `eslint-import-resolver-typescript` is an
   *explicit* devDependency specifically so an unresolved `@/` alias can't make a
   boundary rule silently pass (the dangerous false-negative). That's paranoid in the
   right way. (`mobile/eslint.config.js`)

2. **The alpha-churn containment.** Every genuinely unstable API
   (`expo-router/unstable-native-tabs`, `@expo/ui`, `expo-glass-effect`, and the
   single-maintainer `@howljs/calendar-kit`) is quarantined behind `src/components/chrome/`
   with a lint ban. When one of them breaks on a future SDK, the blast radius is one
   file. The `calendar-kit.tsx` wrapper is a textbook thin seam — re-exports only the
   container/header/body the one consumer needs plus a `buildCalendarTheme` token
   mapping, no speculative composed calendar. (`mobile/src/components/chrome/**`)

3. **Total/defensive parser posture.** Every persisted read is *total* — a
   corrupt/absent/legacy value parses to a safe default and never throws. This is exactly
   right for importer-target data with no server backup. `settings/prefs/types.ts`'s
   `makePreferenceParser` factory is the model the other features should have reused
   (see §4.2). (`hidden-events/data/types.ts`, `sync/types.ts` `decodeJsonArray`/`decodeFields`)

4. **The transactional drop+replace sync.** `sync/repository.ts:replaceAll` does a
   delete-all + chunked bulk insert inside one `db.transaction` with `INSERT_CHUNK_SIZE = 50`
   documented against SQLite's ~999 bound-variable cap. Atomic (no half-empty timetable on
   crash) and safe from the variable limit. Clean and correct.

5. **The offline-persister wiring.** `gcTime === maxAge` (the hard constraint the
   persist-client requires), a `buster: "v1"` to discard incompatible cached blobs, and a
   `shouldDehydrateQuery` that persists *only* the schools/groups reads (the single-school
   detail query is deliberately excluded). Both classic footguns — "persisted a stale
   incompatible cache" and "persisted the whole world" — are avoided by design.
   (`api/query-client.ts`, `school-selection/data/persist.ts`)

6. **Mock-at-the-seam testing.** The suite mocks native modules suite-wide but reproduces
   *enough API shape to exercise real wiring* — e.g. the mocked `CalendarBody` actually
   invokes `renderEvent` per event and wraps each in a `Pressable` firing `onPressEvent`,
   so the screen's event→tile mapping and tap-routing are genuinely proven, not stubbed
   away. The **restart-simulation tests** (a module-scoped `Map` "disk" surviving
   `jest.resetModules()`) prove the write-then-read-back *contract* for irreplaceable data,
   and the event-checklists one even proves the non-obvious "checklist survives a
   `calendar_events` drop+replace" soft-ref property. (`mobile/jest/setup-*.ts`,
   `**/restart.test.ts`)

7. **Pure logic is exhaustively unit-tested.** Overlap packing, agenda grouping, home
   selectors, validators, formatters, mappers, defensive decoders — all pure, all with
   real edge-case tests. Zero `any`, zero suppressions in hand-written infra.

8. **Dependencies are current.** TypeScript 6.0, React 19.2, TanStack Query 5.101, Expo
   SDK 56 / RN 0.85.3 — all at or one patch behind latest, all SDK-appropriate. No stale
   or risky pins. The only intentional hold is `@react-native-firebase@^24` (documented).

---

## 3. Major refactorings (the three headliners)

### R-1 — Extract the write/error/failed-flag machinery into shared infra

**Severity: major. Effort: ~1 day. Risk: low (mechanical, well-tested).**

Every write-capable feature independently reimplements the identical error-recording
shape. The error-normalization ternary alone —
`error instanceof Error ? error : new Error(String(error))` — appears at **8 verified
sites**:

- `features/personal-events/form/hooks.ts:36` and `:63` (two hand-inlined copies)
- `features/event-checklists/data/hooks.ts:68`
- `features/hidden-events/data/hooks.ts:49`
- `features/calendar/data/sync/sync.ts:72`
- `features/calendar-sources/ui/qr-scan-screen.tsx:69`
- `features/calendar-sources/ui/ical-url-screen.tsx:61`
- `db/migrate.ts:23`

On top of that, three features (`hidden-events`, `event-checklists`, `personal-events`)
independently reimplement the same `[failed, setFailed] = useState(false)` +
`try { write(); setFailed(false) } catch { recordError(...); setFailed(true) }` action
wrapper (`hidden-events/data/hooks.ts:42-55`, `event-checklists/data/hooks.ts:60-76`,
`personal-events/form/hooks.ts:26-71`).

**Fix:**
1. Add `recordUnknownError(error: unknown, context: string)` to `src/firebase` — kills
   the ternary at all 8 sites.
2. Add a `useRecordedAction(scope: string)` hook returning `{ run, failed }` — kills the
   `run`/`failed` boilerplate in the three feature hooks.

The per-feature `HideActions`/`ChecklistActions`/save-delete *interfaces* stay exactly as
they are; only the plumbing is shared. This is the single highest-value refactor: it
touches the most sites, is purely mechanical, and centralizes the observability contract
(a future engineer adding a write gets the recording + a11y-failable flag for free instead
of re-deriving it and possibly forgetting the `recordError`).

### R-2 — Extract a shared Drizzle test fake; delete the per-feature copies

**Severity: major. Effort: ~1 day. Risk: none (test-only).**

Each Drizzle-backed feature hand-rolls a near-identical stateful `@/db` fake. The
restart-simulation fakes are the worst:
`calendar-sources/data/user-calendars/restart.test.ts:34-125` (~90 lines) and
`event-checklists/data/restart.test.ts:37-166` (~130 lines) — the latter is a strict
*superset* of the former. On top of that, five `repository.test.ts` files
(`personal-events`, `user-calendars`, `calendar/sync`, `event-checklists`,
`calendar/event-details`) each copy-paste a chainable "thenable query-builder" mock
factory (`makeSelect`/`makeInsert`/`makeBuilder` honoring `from/where/orderBy/values/
onConflictDoUpdate/then`) plus its `beforeEach` reset.

That is **~200+ lines of duplicated Map-backed Drizzle plumbing** across the suite, and
it's the fragile kind — the day Drizzle's builder API shifts, all five break in the same
way and must be fixed five times.

**Fix:** one `jest/fake-db.ts` exporting `createFakeDb({ tables })` that returns the
`db` handle + column tokens + `eq`/`asc`/`gte`/`lte`/`transaction` fakes. Each test then
declares only its tables and assertions. Roughly halves the test-scaffold LOC and makes
Drizzle-API drift a one-file fix. (This also removes the incentive for the cargo-cult
`id.ts` wrapper tests — see N-1.)

### R-3 — Dead-code sweep: delete the unused "insurance" reads (and their tests)

**Severity: major (structural clarity). Effort: ~half day. Risk: low.**

Two prominent functions are **verified dead in production** (grep confirms only
definitions, re-exports, and comments — zero call sites):

- **`findInRange`** exists in *both* `calendar/data/sync/repository.ts:26` and
  `personal-events/data/repository.ts:44`, re-exported from both `index.ts` barrels, and
  is **never called**. The reactive read path (`useSyncedEvents` →
  `useCalendarEvents`) reads the *whole* `calendar_events` table live and filters in JS
  (`sync/hooks.ts:15`, `events.ts:65`). The SQL-range read that would push the window
  into the query — the documented perf escape hatch — exists but is orphaned.
- **`getByUid`** in `calendar/data/event-details.ts:134` is dead: the screen consumes the
  reactive `useEventDetails` instead, which **re-implements the identical two-table
  "synced-wins-else-personal-else-null" resolution inline** (lines 186-196). So we carry
  two copies of the resolution rule, one unused.

Worse than dead weight, `getByUid`'s live twin `useEventDetails` fires **two whole-table
`useLiveQuery` subscriptions on every details-screen open** (one on `calendar_events`,
one on `personal_events`) even though a uid can only match one table — and the synced
subscription re-fires on *every* calendar sync even when viewing a personal event.

**Fix:**
1. Delete both `findInRange` copies + their exports + tests, OR wire them into the
   reactive path if the whole-table read is a real concern (decide explicitly; don't
   leave it orphaned). Given "the table is small" is the recorded design bet, **deleting**
   and documenting the whole-table decision as intentional is the honest move.
2. Delete `getByUid` + its test, making `useEventDetails` the single resolution path — or
   refactor `useEventDetails` to call a shared resolver so the rule lives once.

Also in this bucket: `calendar/data/fixtures.ts` is a **163-line hand-authored dense-week
fixture** that is no longer merged at runtime (dev/test-only) yet lives in a production
`data/` folder where it's shipped and counted as feature source. Move it under a test
`__fixtures__` dir.

---

## 4. Tech debt (do soon, lower ceremony)

### 4.1 Consolidate the three uid wrappers
`personal-events/data/uid.ts` (`newEventId`), `calendar-sources/.../user-calendars/id.ts`
(`newId`), and `event-checklists/data/id.ts` (`newId`) are three separate files each
containing exactly `return randomUUID()` over `expo-crypto`, differing only in name
(`newEventId` vs `newId` — naming drift). The "single swappable import site" rationale is
sound but is *stronger* centralized: one `src/db/new-id.ts` (or `@/id`) serves all three.

### 4.2 Share the defensive-parse and mapper primitives
- The "try `JSON.parse`, validate shape, else safe default, never throw" skeleton — and
  the `isStringArray` guard specifically — is written three times
  (`hidden-events/data/types.ts:27`, `school-selection/store/types.ts:35`,
  `sync/types.ts:41`). Extract `parseJsonArray<T>(raw, guard)` + `isStringArray` into
  `@/storage`. Keep each feature's *shape validation* local; share the boilerplate.
- The row↔domain mappers across all four Drizzle tables repeat the same
  `new Date(x)` / `x.toISOString()` / `?? null`↔`?? undefined` transforms field-by-field,
  plus an identical "canonical UTC ISO-8601" doc-comment paragraph in four places. The
  *field lists* legitimately differ, so don't build a generic mapper factory — but extract
  `isoToDate`/`dateToIso`/`nullToUndef`/`undefToNull` helpers so the "canonical UTC"
  invariant lives in one tested place instead of four comment blocks.
- The reactive store-read hook `parse(useStoredString(KEY))` is copied across
  `settings/prefs/hooks.ts`, `school-selection/store/hooks.ts`, `hidden-events/data/hooks.ts`
  (the comments literally say "mirroring useThemePreference"). A `useParsedStoredString(key,
  parser)` in `@/storage` collapses the trio.

### 4.3 Stale comments that now mislead
- `db/migrate.ts:11-14` still says the runner applies an **"empty bundle"** ("applies
  zero migrations… leaves the DB at version 0"). The bundle now has *four* migrations and
  materializes four real tables at startup. Fix the comment.
- `calendar/ui/calendar-screen.tsx:101-105` has a comment block claiming `eventRoute`
  routes "by ORIGIN — a personal event → its editable form," which ADR 024 made false
  (both kinds now open `/event-details/<uid>`). The `userCalendarId` argument threaded
  through `handlePressEvent`/`eventRoute` is now ignored ceremony (`routes.ts:17` prefixes
  it `_`). Drop the unused arg and fix the comment.

### 4.4 Startup migration failure is silent
`runMigrations()` catches everything, calls `recordError`, and resolves normally;
`_layout.tsx:30` fires it as `void runMigrations()`. If a migration fails, the app renders
with tables that don't exist and every `useLiveQuery` yields empty screens — the *only*
runtime signal is a Crashlytics entry. This is a recorded design choice (reads are
reactive, not first-paint-gated), but it's worth a tracked follow-up: a migration-failed
UI state via the `useMigrations()` hook the code already anticipates, landed with the
first feature whose initial read must block on a table.

### 4.5 The `customFetch` seam has no timeout and no direct test
- `api/mutator.ts:30` calls `fetch(...)` with no `AbortController`/timeout. TanStack's
  `retry: 2` only fires on *rejection*, not a stalled-open socket. The seam is the one
  place to add a default timeout (or forward `options.signal`) — cheap robustness win.
- `mutator.ts` is excluded from coverage (documented as E2E-covered), so its non-2xx →
  typed `ApiError` mapping is only ever exercised via mocks in consumer tests, never
  directly. A small direct unit test of the status→`ApiError` mapping closes a real gap in
  the one seam every network call flows through, without changing the mock-at-the-mutator
  posture for consumers.

---

## 5. The E2E gap (product risk, not just debt)

The Maestro flows are honest about their own limits, but the net effect deserves a clear
statement: **for the five most complex, most recently-shipped surfaces — calendar sync,
event details, checklists, hidden events, and the home today view — there is no
end-to-end proof that real data renders on a device.** Those flows assert only "screen
mounts past splash + route reachable + empty/not-found state":

- `calendar.yaml` — title + view toggle + event-details *not-found* (deep-link to a fake
  uid). No real synced event, no dense-overlap render, no tile tap.
- `event-checklists.yaml` — *only* the not-found state. The entire add/toggle/reorder/
  delete round-trip is never E2E-exercised.
- `hidden-events.yaml` — the management *empty* state only.
- `home.yaml` — heading + *empty-day* state + pull-to-refresh reachability.
- `ical-import.yaml` — render + empty-submit validation only.

Only `onboarding.yaml` (live `GET /schools` round-trip) and `personal-events.yaml`
(device-local CRUD round-trip) are genuine smoke tests.

**Root cause:** a *seeding* gap — `ci/e2e-server.sh` seeds no `user_calendars` token with
synced `calendar_events`, and the dense-week fixture was removed from the runtime merge.
**Highest-leverage fix:** add one server-seed fixture (a calendar token + a handful of
synced events) reachable by a stable deep link. That single fixture converts five
"reachability" flows into real round-trips and gives us the safe-rollout smoke coverage
these tests exist for. This is currently deferred to inbox on-device manual passes, which
don't run in CI — so today, a regression that blanks the synced calendar would pass every
automated gate.

---

## 6. Nits (nice-to-have, low priority)

- **N-1** — Three identical `id.ts`/`uid.ts` wrapper *tests* mock `randomUUID`→X and
  assert the wrapper returns X; they prove no behavior and exist only to satisfy the 90%
  `data/` coverage gate. This is the exact "gate driving cargo-cult tests" ADR 003's
  revisit clause anticipates. Fold them away with R-2 / 4.1.
- **N-2** — `repository.test.ts` upsert assertions call the *real* mapper on both the
  code side and the assertion side (`expect(mockValues).toHaveBeenCalledWith(eventToRow(event))`).
  A mapper bug would be wrong-in-the-same-way on both sides and still pass. Assert one
  concrete literal field (e.g. `startsAt === "2026-06-14T09:00:00.000Z"`) so the repo test
  is independent of the mapper.
- **N-3** — Duplicated local-date→`YYYY-MM-DD` helpers: `agenda.ts:16` (`localDayKey`) and
  `calendar-screen.tsx:48` (`ymd`) are byte-identical. One shared date util.
- **N-4** — `calendar-screen.tsx:91` `const calendarEvents = ...` shadows the `@/db` table
  symbol name used everywhere else; rename to `eventItems` to avoid false grep hits.
- **N-5** — `events.ts:39` (`intersectsRange`, half-open) vs `sync/repository.ts:26`
  (`findInRange`, closed `lte`/`gte`) use different boundary semantics for the same "in
  window?" question. Latent while `findInRange` is dead (R-3); align if it's ever kept.
- **N-6** — The repeated `failed`-flag accessible error banner (polite live region +
  `alert` role) is hand-written on each write screen (`event-checklist.tsx:55`,
  `hidden-events-screen.tsx:64`, `qr-scan-screen.tsx:192`,
  `personal-event-form-screen.tsx:253`). A shared `<WriteErrorNotice>` enforces the a11y
  contract instead of relying on each screen to remember both props.
- **N-7** — The `#C2185B` "white-text-on-brand" shade is mandated in a `tokens.ts` comment
  but is not a token; the first white-on-brand button will hardcode the hex. Promote to a
  `primaryStrong` token when that consumer lands (deliberate R-2 deferral — noted so it
  doesn't drift).
- **N-8** — `app.config.ts:63` Android adaptive-icon `backgroundColor: "#E6F4FE"` is the
  leftover Expo-template blue, inconsistent with the pink brand. Verify against the icon
  art.
- **N-9** — `experiments.reactCompiler: true` opts the whole app into a still-young
  auto-memoization transform; combined with the `fingerprint` OTA policy, a mis-memoized
  component is a subtle, wide-blast-radius bug class. No action — awareness only.
- **N-10** — The lint constant `chromeAlphaImportPatterns` is misnamed now that stable
  `@howljs/calendar-kit` is in the list (already flagged in-code as a deferred rename per
  ADR 020). Rename when the list next changes.

---

## 7. Recommended sequencing

The three majors and the top tech-debt are best done as **one focused "shared-infra +
dead-code" change** (they're all in the same blind spot and touch overlapping files):

1. **R-3 dead-code sweep** first (smallest, unblocks clarity): delete `findInRange` ×2,
   `getByUid`, move `fixtures.ts`, fix the stale comments (4.3).
2. **R-1 write/error infra**: `recordUnknownError` + `useRecordedAction`, migrate all 8
   sites.
3. **R-2 shared test fake**: `jest/fake-db.ts`, delete the per-feature copies; fold away
   the cargo-cult uid tests (N-1).
4. **4.1 + 4.2** uid/parse/mapper-primitive helpers (ride the same pass).
5. Separately, as its own change: **§5 E2E seed fixture** (different subsystem —
   `ci/e2e-server.sh` + one Maestro flow per newest surface). This is the highest *product*
   value item and shouldn't be blocked behind the refactor.

Everything else (§6 nits, 4.4 migration-failed UI, 4.5 fetch timeout) is opportunistic —
pick them up when touching the relevant file.

**One process change to prevent recurrence:** add a "rule of three" check to the
review/simplify stage — when a change introduces the *third* copy of a helper, the diff
should extract it rather than clone it. The per-change simplifier can't see cross-`main`
duplication today; a lightweight reviewer prompt ("does this reimplement something already
in `src/`?") closes that blind spot cheaply.
