# Design — React Native Activity SQLite model

Scope: the storage half of the Activity revival epic (Ticket 3 of [TIM-389]). Everything here is
device-local. No HTTP call, no generated client, no screen.

Authority: `docs/react-native-migration/05-tech-specs/activity-revival.md` at commit `595786a0`
(architecture decisions 5 and 8, *Mobile state behavior*, *Verification strategy → React Native
data tests`), `docs/mobile/architecture-book/storage.md`, ADRs 011 / 018 / 021 / 024.

## Context

The four existing tables were each written for a different posture:

| Table             | Posture                                        |
| ----------------- | ---------------------------------------------- |
| `personal_events` | durable user data, importer target             |
| `user_calendars`  | durable identity, importer target              |
| `calendar_events` | rebuildable cache, **whole-table drop+replace** |
| `checklist_items` | durable user data, importer target             |

Activity is a fifth posture that none of them covers: a **rebuildable cache that must never be
replaced wholesale**. Its content arrives as bounded server pages (≤100 rows) across many sessions;
throwing the table away on each refresh would delete the historical backfill the student paged in.
So the write path is merge-by-id, and the only rows that ever leave are the ones an explicit rule
removes (past retention, or belonging to a calendar the device no longer holds).

## Decision 1 — Two tables: an incremental log cache plus a singleton state row

`activity_logs` — one row per server `calendar_log`, keyed by the **server** id (the merge
identity; there is no device-minted id here, unlike `personal_events`):

| Column          | Type                | Notes                                              |
| --------------- | ------------------- | -------------------------------------------------- |
| `id`            | `text` PK           | server `calendar_log.id` — the upsert identity      |
| `calendar_id`   | `text` NOT NULL     | soft reference to `user_calendars.id`, no FK        |
| `calendar_name` | `text` NOT NULL     | denormalized from the DTO; survives offline         |
| `change_json`   | `text` NOT NULL     | `CalendarChangeGet` as JSON text                    |
| `created_at`    | `text` NOT NULL     | canonical UTC ISO-8601 (server time)                |
| `updated_at`    | `text` NOT NULL     | canonical UTC ISO-8601 (server time)                |

Indexes: `activity_logs_created_at_idx` on `created_at`, `activity_logs_calendar_id_idx` on
`calendar_id` — the two access paths (newest-first read + retention prune; per-calendar delete).

`activity_state` — the singleton:

| Column                      | Type                     | Notes                                     |
| --------------------------- | ------------------------ | ----------------------------------------- |
| `id`                        | `integer` PK             | always `1`                                |
| `last_read_at`              | `text` nullable          | **server** `asOf` watermark (decision 8)  |
| `unread_count`              | `integer` NOT NULL       | last server-supplied exact count           |
| `last_server_as_of`         | `text` nullable          | latest trusted **server** snapshot         |
| `last_successful_refresh_at`| `text` nullable          | **device** clock, freshness policy only    |
| `older_page_cursor`         | `text` nullable          | opaque server cursor                       |
| `older_page_complete`       | `integer` (boolean)      | backfill reached the end                   |

Storage conventions follow ADR 011/018/021 unchanged: dates are canonical UTC ISO-8601 **text**
(lexicographic order equals chronological order, so `<`/`ORDER BY` work on plain text columns),
booleans are Drizzle `mode: "boolean"`, and the structured change is plain TEXT holding JSON — not
Drizzle `mode: "json"`, because a `mode: "json"` column throws on a corrupt value and the whole
timeline must survive one bad row (ADR 021 / D2, applied again here).

`activity_logs` is **not** a Phase-09 Flutter import target (specification: *out of scope —
migrating Flutter's rebuildable `calendar_logs` cache*), so unlike the four existing tables there is
no importer-fidelity constraint on the column set. The columns are exactly the v1 DTO minus
`calendarToken`, which the v1 contract deliberately does not return.

### Why `last_server_as_of` exists (a resolved specification ambiguity)

The specification's illustrative `activityState` shape lists `lastSuccessfulRefreshAt` but no
separate server-snapshot field, while architecture decision 5 requires that local pruning run
"relative to the server's latest known `asOf`" and decision 7 requires a **five-minute** staleness
check on passive triggers. Those are two different clocks:

- the staleness check compares against the **device** clock (is it five minutes since *this phone*
  last succeeded?);
- the retention cutoff and the read watermark must be **server** time, because a wrong device clock
  must not delete a year of history or hide unread changes (decision 8, and the "device clock is
  wrong" risk row).

Collapsing them into one column forces one of the two to be wrong. A phone whose clock is an hour
slow would read a server-stamped `lastSuccessfulRefreshAt` as being in the future and never refresh
again for an hour; a phone whose clock is a year fast would prune the entire cache on the next
write. The two columns are therefore split, and the split is what the specification's own decisions
require. This is additive to the illustrative shape, not a behavioral reinterpretation, and it is
flagged on TIM-403 for the Founding Engineer.

**Retention cutoff = `max(incoming asOf, stored last_server_as_of) − 1 year`.** Taking the max keeps
pruning monotonic: an older-page write carries the *snapshot* `asOf` of the chain it belongs to,
which can be older than a newest-page refresh that already landed, and a stale snapshot must not
un-prune or over-prune.

## Decision 2 — The singleton row is created lazily and every read is total

No seed row ships in the migration. `getActivityState()` returns a documented default when the row
is absent:

```ts
{ lastReadAt: null, unreadCount: 0, lastServerAsOf: null,
  lastSuccessfulRefreshAt: null, olderPageCursor: null, olderPageComplete: false }
```

Every write is an upsert on `id = 1`. This matters for reset: `resetBackendDatabase()` deletes the
row like any other, and the next read is a fresh default rather than a crash or a resurrection of
a stale watermark. It matches the total-read posture the `@/storage` seam already has for MMKV
values ("absent, corrupt, or legacy values return safe defaults instead of throwing").

## Decision 3 — Defensive decoding: a malformed row is skipped, never thrown, and recorded once

`change_json` is decoded by a **pure** mapper:

- `JSON.parse` failure, `null`, or a non-object → the mapper returns `null` and the row is dropped
  from the mapped result;
- a parsed object whose `oldItems` / `newItems` / `changedItems` are absent or not arrays → each
  missing array degrades to `[]` (the `parseJsonArray` posture), the row survives;
- element-level shape is **not** validated per field (same posture as `calendar_events` tags, ADR
  021 / D2) — Ticket 5 renders defensively.

Purity keeps the mapper unit-testable with no SQLite and no Firebase mock. The **repository** owns
the observability: when a read drops at least one row it calls `recordUnknownError` once per read
through the `@/firebase` seam with a static context string (`"activity/malformed-cached-change"`)
and **no row content** — no ids, no titles, no locations, no JSON (specification: *Security and
privacy*). One record per read, not per row, so a corrupted table cannot flood Crashlytics.

## Decision 4 — One synchronous transaction owns page merge, prune, removal, and metadata

`storeActivityPage(input)` runs a single **synchronous** `db.transaction` callback with `.run()`
executors — the seam rule from `storage.md`: the Expo SQLite driver never awaits an async
transaction callback, so an async one would commit after the first statement and the atomicity
would be a lie (the exact bug `harden-mobile-db-seam` fixed).

Statement order inside the transaction:

1. **Upsert each row** by `id` (`onConflictDoUpdate({ target: activityLogs.id, set: row })`), one
   statement per row. The server page is bounded at 100 rows, so no chunking is needed and no
   `excluded.*` bulk-upsert construct has to be plumbed through the seam. Repeating a page is a
   no-op on content — that is what makes cursor recovery safe.
2. **Prune retention**: `delete where created_at < cutoff`, cutoff per decision 1.
3. **Prune removed calendars**: `delete where calendar_id NOT IN (heldCalendarIds)`. When the held
   set is **empty**, take an explicit branch that deletes every row instead — an empty `NOT IN`
   list is a degenerate SQL predicate and must not be relied on.
4. **Upsert `activity_state`** with the new cursor, `last_server_as_of`, `unread_count` (when the
   response supplied one) and `last_successful_refresh_at`.

Prune *after* upsert, so a page containing rows for a since-removed calendar cannot leave residue.
Metadata *last*, so a throw anywhere above leaves the previous cursor and watermark intact and the
next attempt retries the same page — "advances the older-page cursor only after the page is stored
successfully".

The input is data, not policy. The coordinator (Ticket 4) decides *when* to fetch and *what* the
page means; the repository is told what to write:

```ts
interface ActivityPageWrite {
  rows: ActivityLogRow[]        // already mapped from the v1 DTO
  page: "newest" | "older"
  serverAsOf: string            // canonical UTC ISO-8601 — never a device clock
  nextCursor: string | null
  heldCalendarIds: string[]
  unreadCount?: number          // server-supplied; newest page only
  refreshedAt: string           // device clock, freshness policy only
}
```

Cursor rules, from architecture decision 5:

| `page`   | Effect on `older_page_cursor`                                                          |
| -------- | --------------------------------------------------------------------------------------- |
| `older`  | set to `nextCursor`; `older_page_complete = nextCursor === null`                         |
| `newest` | set **only if** the stored cursor is null *and* `older_page_complete` is false; else keep |

The `newest` guard is what stops a routine newest-page refresh from restarting a half-finished
backfill from page two, and from re-opening a backfill that already reached the end.

## Decision 5 — Read state operations are separate, small, and server-timed

Four operations beside the page write, each its own transaction (they are independent of a page
landing):

- `markActivityRead(watermark: string)` — sets `last_read_at` to a **server** timestamp and
  `unread_count` to 0. The caller supplies the value; the repository never reads a clock. Ticket 4
  passes the response `asOf` when the screen is visible; when opening offline it passes
  `getNewestCachedServerTime()`.
- `clearLocalUnread()` — `unread_count = 0` without moving the watermark (opening Activity clears
  the badge immediately, even offline).
- `clearOlderPageCursor()` — `older_page_cursor = null`, `older_page_complete = false`, **rows
  untouched**. This is the 400-on-a-stale-cursor recovery: the chain restarts from the newest page
  and upsert identity makes the repeated pages harmless.
- `removeCalendarActivity(calendarId)` — deletes that calendar's rows and only that calendar's rows.

Reads: `findActivityLogsNewestFirst()` ordered `desc(created_at), desc(id)` — the same total order
the server pages by, so cache order and server order can never disagree — and
`getNewestCachedServerTime()` (`max(created_at)`, or null on an empty cache).

Whole-table reads match the current `storage.md` posture ("whole-table reads are intentional for
the current data size"). One year of Activity for a heavy user is on the order of hundreds of rows;
if Ticket 5 measures otherwise, scoped SQL is the documented escalation.

## Decision 6 — Prove the migration against real SQLite, not a mock

`expo-sqlite` is mocked suite-wide (`jest/setup-db.ts`), so the committed migrations have **never**
been executed in CI — `migrate.test.ts` proves only that the runner passes the bundle to
`migrate()`. That is acceptable for a table nobody is upgrading into; it is not acceptable for a
migration that must land on phones that already hold four populated tables.

Node 24 ships `node:sqlite` (`DatabaseSync`) in core. The repo's `.nvmrc` pins 24.13.0 and CI reads
`node-version-file: .nvmrc`, so it is available in CI at the same version. Verified in this
worktree: `import { DatabaseSync } from "node:sqlite"` imports, typechecks (`tsc --noEmit`), lints
clean, and runs green under the jest-expo preset; applying the committed bundle to `:memory:`
produces the four existing tables.

The new test drives the **committed bundle** (`src/db/migrations/migrations.js` — the same
inline-imported SQL the device applies, split on Drizzle's `--> statement-breakpoint`), in two
directions:

- **fresh install** — apply every migration to an empty database, assert both Activity tables and
  both indexes exist;
- **upgrade** — apply `0000…0003` only, insert a representative row into each of the four existing
  tables, then apply `0004` and assert the Activity tables/indexes appeared **and every
  pre-existing row is still there and unchanged**.

Alternative considered and rejected: asserting on the SQL *text* (grep for `CREATE TABLE`). It
would pass on SQL that SQLite refuses to execute, and it cannot express "upgrades an existing
database" at all. Fallback if `node:sqlite` ever becomes unavailable: `expo-sqlite`'s own Node
build, recorded here so the next reader does not re-derive it.

The experimental-feature warning Node prints for `node:sqlite` is noise on stderr, not a failure;
if it bothers the CI log the runner can pass `--no-warnings=ExperimentalWarning`. Do not silence it
by pinning a different Node.

## Decision 7 — Extend the shared fake-db rather than hand-roll a fifth mock

The repository tests need Drizzle slices `createFakeDb` does not model yet: `desc`, `lt`,
`notInArray`, ordering by two keys, and a where-less `delete` inside a transaction. Hand-rolling a
local `jest.mock("@/db")` for Activity would recreate exactly the duplication TIM-154/155 removed.
The extension is additive — existing consumers (`personal-events`, `event-checklists`,
`calendar-sources`, `calendar/sync`, `db/reset`) keep passing unchanged, which is itself the
regression check.

Note for the implementer: `createFakeDb` consumers must keep the `mock`-prefixed instance name so
`babel-plugin-jest-hoist` accepts it in the `jest.mock` factory (documented at the top of
`fake-db.ts`).

## Decision 8 — Reset order

`resetBackendDatabaseWith` gains both tables **first**, before `checklist_items`:

```
activity_logs → activity_state → checklist_items → calendar_events → user_calendars → personal_events
```

Caches and child rows before identity rows, which is the existing rationale; Activity is the most
derived data in the database. Still one synchronous transaction, still all-or-nothing. The
`mobile-storage` capability text that says "all four tables" is updated to six.

## What this ticket deliberately does not build

- No fetch, no generated v1 client, no single-flight coordinator (Ticket 4). The DTO→row mapper is
  written against the **frozen contract shape in the specification**, not against generated types
  that do not exist yet, which is why this ticket can run in parallel with Ticket 2.
- No screen, route, Settings row, badge, or localized string (Ticket 5).
- No trigger wiring, no five-minute freshness *policy* — only the columns it will read (Ticket 6).
- No Flutter `calendar_logs` import, no durable event snapshot (out of scope, decision 9).
