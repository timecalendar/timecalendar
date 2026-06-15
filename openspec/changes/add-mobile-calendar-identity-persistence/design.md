# Design — Calendar identity persistence (durable `user_calendars` token storage)

## Context

Phase 3 ship 5 of 5. The token a user adds (via school pick, QR scan, or iCal import)
**is their calendar identity** — and there is **no server-side record of which calendars
a given device holds**. Lose the token and the user must re-add the calendar by hand
([data-persistence-migration.md §2](../../../docs/react-native-migration/00-exploration/data-persistence-migration.md)
names `user_calendars.token` the single most critical, **No**-replaceable sembast field).

Today ships 3 and 4 land an added calendar in an **ephemeral** module-scoped holder
(`calendar-sources/data/scanned-source.ts`, a `useSyncExternalStore`) explicitly marked
"the seam **ship 5 swaps** for the durable token store." This ship makes that store
durable.

It is a near-exact replay of `add-mobile-personal-events-data` (TIM-132 / ADR 011): a
Drizzle table mirroring a Flutter sembast `toMap()` verbatim for importer fidelity, a
repository over `@/db`, pure row↔domain mappers, canonical-UTC normalization, a reactive
`useLiveQuery`, all under the K-3 coverage gate. The differences from that precedent are
the load-bearing decisions below (D1–D9).

**The Flutter wire format — read, not guessed.** Traced precisely:

- `app/lib/modules/calendar/models/user_calendar.dart` — the model + `toDbMap()`:
  `{ id, name, token, schoolName, schoolId, lastUpdatedAt: toIso8601String(),
  createdAt: toIso8601String(), visible: bool }`. `schoolName`/`schoolId` are nullable;
  `visible` defaults `true`.
- `app/lib/modules/calendar/repositories/user_calendar_repository.dart` — `STORE_NAME =
  'user_calendars'`, `_store.record(calendar.id).put(_db, calendar.toDbMap())`. **The
  sembast record key is `id`** (not the token), and `id` IS the upsert identity.
- `app/lib/modules/database/providers/migrations/003_convert_user_calendar_to_record.dart`
  — a Flutter migration that re-keyed records so `record.key == value['id']`, confirming
  `id` is the canonical record key.
- `data-persistence-migration.md §3.2` — the **real device JSONL dump** confirms
  `{"key":"700ff…","store":"user_calendars","value":{…,"token":"AdWBldUNaMhQfLjGrsAlN",…}}`:
  store `user_calendars`, record key `id`, token a field of `value`.
- The server DTO `CalendarForPublic` (returned by `GET /calendars/by-token/{token}`)
  maps **one-to-one** onto these fields: `{ id, token, name, schoolName (nullable),
  schoolId? , lastUpdatedAt, createdAt }` — exactly what Flutter's
  `UserCalendar.fromCalendarForPublic` consumes. `visible` is a **client-only** field
  (not on the DTO), defaulting `true`.

The wire format is therefore fully resolved with no ambiguity (HUMAN_BLOCKED is empty for
the schema). The one open verification item is purely **on-device durability** (restart /
kill / cache-clear / the Android sembast path), not the format.

## Goals / Non-Goals

**Goals**

- A durable, importer-targetable `user_calendars` store mirroring the Flutter
  `toDbMap()` verbatim, surviving restart/kill/cache-clear.
- Ships 3 and 4's add-success paths persist a durable row (token + metadata), replacing
  the ephemeral holder.
- The full golden-path data layer: schema → migration → repository → mappers → reactive
  hook → tests, with the persistence/restart proof central.
- ADR 018 recording the MMKV-vs-Drizzle decision and the verbatim-schema decision.

**Non-Goals** (deferred, recorded so a later ship owns them)

- **The Phase-09 one-shot importer itself** — this ship builds the *target schema* and
  the *bypass-the-uid* upsert path the importer will use; it does not read sembast.
- **A "your calendars" management screen / list UI** — the reactive `useUserCalendars()`
  hook is the seam a later home/calendar ship renders; this ship ships no new screen
  (the QR/iCal screens are *rewired*, not redesigned).
- **Calendar-event sync** (`calendar_events`) — re-syncable from the token (research §2),
  a later ship; we persist only the irreplaceable identity row.
- **A `visible` toggle UI** — the column + `setVisible` repository method exist (wire
  fidelity), but no toggle screen this ship.
- **Removing the Flutter `calendar-sources` ephemeral pattern from school-pick** — school
  selection persists its own selection store already (ADR 013-adjacent); QR/iCal are the
  two paths that fed the ephemeral holder.

## Decisions

### D1 — Storage: Drizzle (`@/db`), not MMKV (`@/storage`) → **ADR 018**

`user_calendars` is **relational identity**: a *set* of calendars, each a row with an
upsert key (`id`), a token, and metadata; the app queries by id and by token, upserts by
id, and removes by id. This is a table, not a blob. Three forces decide it for Drizzle:

1. **It is relational, multi-row, queried.** `getByToken`, `upsert`-by-`id`, `remove`,
   `setVisible`, and a reactive list are first-class relational operations. MMKV would
   force a hand-rolled JSON-array-in-one-key with manual find/replace/serialize on every
   write — a flat-KV hack for relational identity, re-implementing what SQLite does.
2. **It is a Phase-09 migration target needing a real schema + migration.** The importer
   replays the sembast `user_calendars` store into a *matching* schema; `personal_events`
   set the precedent that a sembast store → a Drizzle table mirroring `toMap()`. A MMKV
   blob has no schema for the importer to target and no migration story.
3. **It gets the migration-runner durability story for free** — the same
   `runMigrations()` + committed-bundle plumbing `personal_events` uses; SQLite is
   on-disk durable across restart/kill/cache-clear with no extra wiring.

MMKV *was* genuinely weighed: it is simpler for a tiny blob and is synchronous. Rejected
because the simplicity is illusory here — the moment identity is a queried, upserted,
multi-row set with an importer target, MMKV becomes the harder path (manual serialization,
no schema, no migration), and it would **diverge** from the `personal_events` precedent
that the next importer engineer expects. The decision is **ADR 018's central call**.
*(MMKV stays the right tool for Settings prefs and the query-cache persister — flat,
single-value, non-relational. This is not one.)*

### D2 — Schema mirrors the Flutter `toDbMap()` VERBATIM (importer fidelity) → **ADR 018**

`userCalendars` `sqliteTable` (SQL `user_calendars` — the sembast store name verbatim):

| Drizzle column | SQL | From Flutter `toDbMap()` | Notes |
| --- | --- | --- | --- |
| `id` | `text("id").primaryKey()` | `id` | **The sembast record key = upsert identity** (not the token). The explicit PK, not a surrogate — the importer writes the recovered key verbatim. |
| `token` | `text("token").notNull()` | `token` | **The irreplaceable subscription identity.** Not the PK (Flutter's key is `id`), but the lookup key for `getByToken`. |
| `name` | `text("name").notNull()` | `name` | |
| `schoolName` | `text("school_name")` (nullable) | `schoolName` (nullable) | null↔undefined at the mapper edge. |
| `schoolId` | `text("school_id")` (nullable) | `schoolId` (nullable) | Flutter nullable; DTO `schoolId?` optional. |
| `lastUpdatedAt` | `text("last_updated_at").notNull()` | `lastUpdatedAt: toIso8601String()` | UTC ISO-8601 TEXT (ADR 011/D4 posture). |
| `createdAt` | `text("created_at").notNull()` | `createdAt: toIso8601String()` | UTC ISO-8601 TEXT. |
| `visible` | `integer("visible", { mode: "boolean" }).notNull().default(true)` | `visible: bool` | SQLite has no boolean — Drizzle `mode: "boolean"` stores 0/1; default true mirrors Flutter's `visible = true`. |

The **importer-fidelity property** (the load-bearing constraint): a `toDbMap()`-shaped
record imports with **zero value transformation** — `id`/`token`/`name` verbatim, the two
date strings already canonical UTC ISO-8601 from Flutter's `toIso8601String()` (written
verbatim), `schoolName`/`schoolId` null-preserving, `visible` bool → 0/1. No
parse-and-re-encode anywhere on the import path = no data-loss surface for the no-backup
recovery (exactly ADR 011's argument for `personal_events`).

**Dates as TEXT ISO-8601 UTC (not epoch-ms)** — same as ADR 011: (a) importer writes the
Flutter ISO string verbatim, no `Date.parse()` edge cases; (b) canonical UTC ISO-8601
sorts lexicographically = chronologically (relevant if a later ship orders calendars by
recency). Canonicality is guaranteed by `calendarToRow`'s `toISOString()`.

### D3 — Where the data layer lives: a `user-calendars/` module under `calendar-sources/data/`

The durable layer lives at
`mobile/src/features/calendar-sources/data/user-calendars/` (schema stays at
`mobile/src/db/schema.ts`, the seam dir). Rationale: the calendars a user adds *are* the
output of the calendar-sources flow (QR/iCal/school) — co-locating the durable store with
the seam that feeds it keeps the feature cohesive, and `data/` is already the feature's
seam sublayer (B-1: the only place importing `@/db` / generated hooks). A grouped
sub-module (`data/user-calendars/`) rather than loose files under `data/` keeps the
token-store's files (types, mappers, repository, hooks, id) together and distinct from the
QR/iCal scan files (`parse-source`, `create`, `validate-url`). It re-exports through the
`data/` sub-barrel, which the feature barrel re-exports — the established barrel discipline
(B-2, no self-barrel cycle). *Rejected:* a top-level `src/features/user-calendars/` feature
(splits the add-flow from its store for no gain — the screens that persist are in
calendar-sources); the loose-files-under-`data/` shape (mixes the durable store's 5 files
with the scan files).

### D4 — Repository over `@/db`; reactive read via `useLiveQuery`

A module of functions (no class — R-2, mirroring `personal-events/data/repository.ts`)
importing `{ db, userCalendars, eq }` from `@/db` only:

- `findAll(): Promise<UserCalendar[]>` — all rows → domain.
- `getById(id): Promise<UserCalendar | undefined>`.
- `getByToken(token): Promise<UserCalendar | undefined>` — the token-lookup path (dedupe:
  before persisting an add, check the token isn't already held).
- `upsert(calendar): Promise<void>` — `insert … onConflictDoUpdate({ target:
  userCalendars.id })`, mirroring the Flutter `record(id).put`. **Accepts a
  caller-supplied `id`** so the importer bypasses `newId()`.
- `remove(id): Promise<void>`.
- `setVisible(id, visible): Promise<void>` — wire-fidelity (the `visible` field exists; a
  toggle UI is a later ship). An UPDATE of the one column.

The `@/db` seam re-exports `userCalendars` (the table) — `eq` is already re-exported.
`useUserCalendars()` in `hooks.ts` runs `useLiveQuery(db.select().from(userCalendars))`
and maps rows → domain. R-2: re-export only what's needed (no new operator beyond the
already-exported `eq`).

### D5 — Mappers + the server-DTO mapper (`fromCalendarForPublic`)

Pure mappers isolate the wire format (no `db`, exhaustively unit-testable):

- `rowToCalendar(row)` — TEXT ISO → `Date`, `visible` 0/1 → boolean (Drizzle already
  surfaces `mode: "boolean"` as `boolean`), null `schoolName`/`schoolId` → `undefined`.
- `calendarToRow(calendar)` — `Date` → canonical UTC ISO via `toISOString()` (the property
  the TEXT columns rely on), boolean → Drizzle handles, `undefined` → `null`.
- `fromCalendarForPublic(dto: CalendarForPublic): UserCalendar` — the server-DTO →
  domain mapper, mirroring Flutter's `UserCalendar.fromCalendarForPublic`: `id`, `token`,
  `name`, `schoolName` (DTO `string | null` → `undefined`), `schoolId` (DTO `string |
  undefined`), `lastUpdatedAt`/`createdAt` (DTO ISO strings → `Date`), `visible: true`.
  This is the **only place** the generated DTO type touches the data layer — and it lives
  in `data/` (B-1). The DTO mirrors the wire format, so the mapper is a field copy.

### D6 — How ships 3/4 feed the durable store (the wiring)

Both add paths converge on **token → resolve → upsert**:

1. **iCal (`create.ts` / `IcalUrlScreen`)** — `POST /calendars` already returns `{ token }`
   (`CreateCalendarRepDto`). On success the create seam now **resolves the token to its
   `CalendarForPublic`** via `GET /calendars/by-token/{token}`
   (`calendarControllerFindCalendarByToken`, already generated), maps it via
   `fromCalendarForPublic`, and `upsert`s the durable row.
2. **QR (`QrScanScreen`)** — the scanned URL still `POST /calendars` (the QR yields a URL,
   not a token — Flutter parity), then the same resolve-and-upsert. **Decision:** route the
   QR path through the **same create+persist seam** as iCal (a shared
   `addCalendarFromUrl(url)` function in `data/user-calendars/`), so both paths share one
   persistence code path. The QR screen calls `addCalendarFromUrl(source.url)` instead of
   `setScannedSource`.
3. **The ephemeral `scanned-source.ts` is removed.** Its consumers (the
   onboarding screen that read `useScannedSource` to show "calendar added") switch to the
   durable reactive read `useUserCalendars()` (or simply dismiss on success — the durable
   row is the source of truth). The barrel exports drop `setScannedSource` /
   `useScannedSource` / `getScannedSource` / `clearScannedSource` / `ScannedCalendarSource`.

**A failed persist** (the token resolve or the upsert throws) is recorded through
`@/firebase` `recordError` (writes CAN fail — observability ✅, unlike the infallible
ephemeral holder) and surfaced as an accessible failure on the screen (reuse the existing
`failed`/`isError` a11y states). The persist seam (`addCalendarFromUrl`) is a `data/`
function returning a result/throwing; the screens own the UI state.

*Rejected:* keeping the ephemeral holder as a write-through cache over the durable store —
unnecessary indirection; the reactive `useLiveQuery` already gives a re-rendering read, so
the in-memory holder earns nothing once the durable store exists (its entire reason was to
demonstrate camera→state before the durable schema existed).

### D7 — `newId()` uid wrapper (importer bypasses it)

A thin `newId()` over `expo-crypto`'s `randomUUID()` (the single import site, swappable —
mirroring `personal-events/data/uid.ts`). A **locally**-added calendar gets `newId()` for
its `id` when the server DTO somehow lacks one — **but** `CalendarForPublic` already
carries the server `id`, so the normal add path uses the DTO's `id` (the canonical
identity). `newId()` exists for the create path's safety + future local-only sources; the
**importer supplies its own recovered `id`** to `upsert` (the bypass — same as ADR 011).

### D8 — The migration: the second real Drizzle migration

`npm run generate:migrations` (drizzle-kit, driver `expo`) diffs `schema.ts` (now two
tables) against the committed snapshot and emits `0001_*.sql` (`CREATE TABLE
user_calendars …`), a second `meta/_journal.json` entry, a `0001_snapshot.json`, and an
updated `migrations.js` (now importing `m0000` + `m0001`). All committed (fresh-clone-no-
codegen rule). `migrations.d.ts` is stable across regenerations (the storage doc's note).
The runner applies both unchanged. The existing `migrate.test.ts` proof still passes (it
asserts `migrate(db, migrations)` is driven with the committed bundle, regardless of
entry count).

### D9 — Testing: persistence is central → and the restart proof

Mirroring `personal-events/data` but with the persistence/restart proof load-bearing:

- **Mappers** (`types.test.ts`) — round-trip (domain → row → domain, all fields equal,
  dates canonical UTC, `visible` boolean preserved, null `schoolName`/`schoolId` → absent),
  **importer-fidelity verbatim** (a `toDbMap()`-shaped row reads back with no value change),
  `fromCalendarForPublic` (DTO → domain field copy, null `schoolName` → undefined,
  `visible: true`).
- **uid** (`id.test.ts`) — delegates to mocked `expo-crypto.randomUUID`.
- **Repository** (`repository.test.ts`) — each function's Drizzle query SHAPE + mapping
  against the **mocked `@/db` seam** (the `jest.mock("@/db")` chainable query-builder spy,
  exactly the personal-events pattern): `upsert` → `onConflictDoUpdate({ target:
  userCalendars.id })` with the mapped row; `getByToken` → `eq(userCalendars.token, …)`;
  `remove`/`setVisible` by id; `findAll` maps all rows.
- **Restart simulation** (the central durability proof CI *can* run): a test that drives
  the repository against a **stateful in-memory mock `@/db`** (a tiny Map-backed fake
  honoring `insert/onConflictDoUpdate/select/delete`), writes a calendar, then **reads it
  back through a freshly-imported repository module / a re-created store handle**, asserting
  the row survives — proving the write-then-read-back contract the repository guarantees.
  (CI cannot prove on-disk SQLite materialization — that is on-device, D-below.)
- **The persist wiring** (`add-calendar.test.ts` and the rewired screen tests) — a
  successful `POST /calendars` → `GET /calendars/by-token` → `upsert` chain (mocked at the
  `customFetch` mutator seam + the repository), and the **failure path** (resolve/upsert
  throws → `recordError` called → a11y failure surfaced).
- **Maestro restart-durability** (`mobile/.maestro/calendar-persistence.yaml`) — **the real
  on-device proof**: add a calendar (via the existing onboarding flow / a deep link),
  `stopApp` + `launchApp`, assert the calendar is **still present** (a seeded-text
  assertion against the durable reactive read). The dev e2e *can* relaunch the app
  (`stopApp`/`launchApp` are stable Maestro commands cross-platform). **If** the
  post-relaunch render of the calendar isn't reliably assertable on both platforms (no list
  UI ships this change — Non-Goal), this falls back to an **inbox** manual restart / kill /
  cache-clear verification note (HUMAN_BLOCKED). The change ships the Maestro flow if a
  stable post-relaunch assertion target exists; otherwise the inbox note owns it.

**Coverage:** the new logic paths (`src/db/**`, `src/features/calendar-sources/data/**`)
meet the enforced K-3 90% lines/branches; the rewired screens stay on the 70% floor.

## Risks / Trade-offs

- **Token correctness IS the user's identity (the headline risk).** Mitigated by: the
  verbatim schema (no transformation surface), the pure tested mappers, the
  persistence-round-trip + restart-simulation tests, and the on-device Maestro/manual
  restart proof. A `getByToken` dedupe prevents duplicate rows for the same subscription.
- **`GET /calendars/by-token` is a second network call on the add path.** Accepted: the
  metadata (name/school/dates) is needed to render and store a meaningful calendar; the
  alternative (storing only the token and lazily resolving) leaves a nameless row and a
  later resolve still has to happen. The call failure is recorded + retryable (the existing
  iCal error/retry a11y states cover it).
- **`visible` ships as a column with no toggle UI.** Accepted (wire fidelity > minimalism
  here — the importer must round-trip `visible`, so the column is non-negotiable; the
  `setVisible` method is the seam a later toggle ship uses). Not speculative divergence: the
  column exists *because the Flutter wire format has it* and the importer must preserve it.
- **CI can't prove on-disk durability.** Same as `personal_events`: the restart-simulation
  test proves the repository contract, the Maestro relaunch (or inbox manual pass) proves
  real SQLite survival. Recorded, not hidden.
- **Android sembast path / prefs backend** (research §6 open items) are the *importer's*
  concern (Phase 09), not this schema's — flagged in the inbox note, not blocking this ship.

## Definition-of-Done axes (every axis ✅ or ➖ N/A + reason — no third state)

- **Architecture** ✅ — golden-path data layer; `data/` the only `@/db`/generated import
  site (B-1); barrels (B-2); ADR 018 records the load-bearing decisions.
- **Types** ✅ — `tsc --noEmit` clean; Drizzle `$inferSelect/$inferInsert` for rows; no `any`.
- **Lint** ✅ — `--max-warnings 0`; `@/db`/generated stay inside `data/`.
- **Unit/component tests** ✅ — mappers + uid + repository + restart-sim + persist-wiring;
  K-3 90% on the new logic paths, green on landing.
- **E2E** ✅ (Maestro restart-durability) **or** ➖ N/A + inbox manual restart/kill/cache-
  clear note **if** no stable post-relaunch assertion target exists (D9) — decided at
  implementation, recorded either way (no third state).
- **i18n** ✅ — FR+EN for any new failure string (the persist-failed message); reuse
  existing QR/iCal keys where possible. ➖ N/A only if no new string is needed.
- **Accessibility** ✅ — the rewired screens keep their polite live regions + alert roles +
  ≥48dp touch targets; no new control type. Manual VoiceOver/TalkBack pass on the rewired
  add-success/failure paths (DoD Accessibility axis).
- **Native correctness** ➖ N/A — no new native module/control; a new SQLite table under the
  existing seam materializes via the runner (verified on-device by the Maestro launch).
- **Performance** ➖ N/A — a single-row upsert + one extra GET on add; no list rendering
  ships (no jank surface).
- **Observability** ✅ — a failed token-resolve/upsert → `@/firebase` `recordError` (the
  first calendar-sources path where a persist can fail); no PII (the token is the user's own
  subscription id, already in the binary's network calls).
- **Product analytics** ➖ N/A — no new analytics event this ship (consistent with the
  prior calendar-sources ships, which fired none); the add-calendar event is a later
  taxonomy ship.
- **Documentation** ✅ — ADR 018; storage.md `user_calendars` section; features.md;
  changelog; roadmap step 5 ticked.

## Migration Plan

Additive and reversible. The new table materializes on the next launch via the existing
runner; a fresh DB simply lacks it until the migration applies (idempotent `CREATE TABLE`).
Rollback is a plain revert — no data transformation, no native change. No coordination with
ships 3/4 beyond rewiring their two success call sites (this change owns that rewire).

## Open Questions

- **Maestro post-relaunch assertion target.** Whether a durable calendar is reliably
  assertable after `stopApp`/`launchApp` on both platforms given no list UI ships here
  (Non-Goal). Resolved at implementation: ship the Maestro flow if a stable target exists
  (e.g. an onboarding "1 calendar added" indicator from the reactive read), else inbox the
  manual restart/kill/cache-clear pass. Recorded in HUMAN_BLOCKED either way.
- **Android sembast path + prefs backend** (research §6) — the *importer's* (Phase 09)
  concern, not this schema's; inboxed for the importer ship, not blocking.
