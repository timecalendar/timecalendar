## Context

The `@/db` seam (`mobile/src/db/`) owns the single `expo-sqlite` handle, the Drizzle instance, the committed migration bundle, the coalescing reactive read, and the backend reset transaction. Four tables ride it today: `personal_events` (ADR 011), `user_calendars` (ADR 018), `calendar_events` (ADR 021), `checklist_items` (ADR 024). Every one of them was designed under a shared posture:

- dates are canonical UTC ISO-8601 **TEXT** (lexicographic order = chronological order, so range filters and ordered reads work on a plain text column);
- non-scalar values are plain **TEXT holding JSON**, never Drizzle `mode: "json"`, because the hand-written mapper can degrade a corrupt value to a safe default while `mode: "json"` throws and takes the whole read with it;
- mappers are **pure** (no `db`), so they unit-test exhaustively with no SQLite mock;
- multi-statement writes run in a **synchronous** `db.transaction` callback with `.run()` executors — the expo driver never awaits, so an async callback would let `BEGIN`/`COMMIT` bracket only the first statement.

Activity inherits all of that. What it does **not** inherit is `calendar_events`' drop+replace strategy, and that is the whole reason this needs a design rather than a fifth copy of the same table.

The DTO shape is frozen by the specification (architecture decision 2) and does **not** depend on Ticket 2 shipping:

```ts
type CalendarLogV1 = {
  id: string
  calendarId: string
  calendarName: string
  calendarChange: CalendarChangeGet   // already in the generated schemas today
  createdAt: string
  updatedAt: string
}
```

`CalendarChangeGet` (`{ oldItems, newItems, changedItems }`) already exists in `mobile/src/api/generated/timeCalendar.schemas.ts` from the legacy operation, so the mapper's decoded shape is real today.

## Goals / Non-Goals

**Goals**

- An Activity cache that survives pagination, offline use, and app restart, and that can never lose a backfilled older page to a newest-page refresh.
- A read watermark that is immune to a wrong device clock.
- A migration whose upgrade path from an installed database is proven by a test, not asserted in a comment.
- A repository whose every write is one all-or-nothing transaction, with the cursor advancing only after the rows it describes are durably stored.
- Zero coupling to the network layer, the generated client, or any screen — so Ticket 3 lands while Ticket 2 is still in review.

**Non-Goals**

- No fetch, no generated-client call, no TanStack Query wiring (Ticket 4 owns the coordinator and is the only caller of these operations).
- No route, screen, badge, or i18n string (Ticket 5).
- No trigger wiring into calendar sync, push, screen-open, or foreground (Ticket 6).
- No Flutter `calendar_logs` import. These tables are backend-bound rebuildable data and are explicitly **not** Phase-09 import targets, so the importer-fidelity constraint that shaped ADR 011/018/021/024 column-for-column does not apply here.
- No durable event snapshot from the historical payload (architecture decision 9) — `changeJson` is stored verbatim and never expanded into `calendar_events`.
- No `activity_state` column beyond the six the specification freezes.

## Decisions

### D1 — The Activity cache is merged by log id, never replaced

`calendar_events` is drop+replaced because a sync response is the *complete* current timetable: the newest response is the whole truth, and replacing is the cheapest way to be exactly right. A calendar-log page is the opposite — it is one bounded window over a year of history, and the app deliberately never downloads the whole year (specification, out of scope). Replacing on every newest-page refresh would:

- delete every older page a student already backfilled by scrolling, on the very next pull-to-refresh;
- make the offline timeline shrink to at most one page;
- turn a passive background refresh into user-visible data loss.

So the write is an upsert keyed on `activity_logs.id` (the server `calendar_log` id). Upsert identity is also what makes the two recovery paths in D5 safe: a repeated newest page, an older page that overlaps cached rows, and a full restart of the pagination chain after a rejected cursor are all *idempotent* rather than duplicating.

The upsert is **row by row** inside one synchronous transaction (`insert(...).values(row).onConflictDoUpdate({ target: activityLogs.id, set: {...} }).run()`), not one multi-row statement with an `excluded.` SQL fragment. A page is bounded at 100 rows by the server contract, so the statement count is bounded and small; the explicit per-row form keeps the write readable and avoids hand-written SQL fragments in a feature repository. (`calendar_events`' chunked bulk insert exists because a sync writes ~600 rows at once; that pressure does not exist here.)

**Rejected — a `replaceAll` mirroring `calendar_events`.** Simpler and consistent with the existing table, but it is precisely the behavior that breaks pagination and offline history. Consistency with the wrong strategy is not a virtue.

### D2 — `lastReadAt` is a server-issued `asOf`; the device clock never writes it

Unread count is exact and device-local (read state is not shared between two installations holding the same token). The watermark is therefore the only thing standing between a misconfigured phone clock and a permanently wrong badge:

- clock set forward → a device-clock watermark is ahead of every server row, so nothing is ever unread again;
- clock set backward → already-read history re-counts as unread on every refresh.

Both are silent and permanent. So every write of `lastReadAt` takes a **server-issued** value:

- `markActivityRead(asOf)` — the screen is open and a newest-page request succeeded under snapshot `asOf`; the student is looking at that snapshot, so `lastReadAt = asOf` and `unreadCount = 0`.
- `markActivityReadFromCache()` — the screen opened offline. There is no fresh `asOf`, so the watermark advances only to `MAX(activity_logs.created_at)`, the newest **server** timestamp the device can prove it has seen, and only when that is newer than the stored watermark. `unreadCount` is cleared locally regardless. A later successful response can still count rows created after that point, which is the correct, conservative outcome.

`lastSuccessfulRefreshAt` is a *different* value with a different clock: it feeds the five-minute passive-freshness policy (Ticket 4), which compares elapsed local time, so it is device time. Keeping the two apart is the point of the decision — the design must not "fix" the inconsistency by unifying them.

`unreadCount` from the server response is stored **without** touching the watermark when the screen is closed. Advancing the watermark on a passive refresh would mark unseen changes as read.

### D3 — One synchronous transaction per page write, with a fixed statement order

`storeNewestPage` and `storeOlderPage` share one transaction body, in this order:

1. **Upsert** the page's rows by id (D1).
2. **Prune by age** — delete rows whose `created_at` is older than one year before the latest trusted server snapshot (D4).
3. **Prune by ownership** — delete rows whose `calendar_id` is not in the caller-supplied held-calendar id list. When that list is empty the whole table is deleted (`NOT IN ()` is not valid SQL, and "the device holds no calendars" genuinely means "no Activity rows are owned").
4. **Advance state** — `olderPageCursor` / `olderPageComplete` per D5, then `unreadCount` / `lastSuccessfulRefreshAt` / `lastReadAt`.

State is written **last and inside the same transaction**, so a throw anywhere in steps 1–3 leaves both the rows and the cursor exactly as they were. This is the concrete meaning of "advance the cursor only after the page is stored successfully": not a second statement after an awaited write, but a later statement in the same atomic unit.

The callback is non-async with `.run()` executors, per the seam's atomicity contract. The repository functions still return `Promise<void>` to their callers (Ticket 4 awaits them), wrapping the synchronous transaction — the same shape `replaceAll` uses.

Held calendar ids are a **parameter**, not a read of `user_calendars` inside this repository. Ticket 4 owns reading them through the calendar-sources public data seam (specification, architecture decision 6: `activity data → calendar-sources data`). Taking them as an argument keeps this change dependency-free and keeps the feature graph acyclic.

### D4 — "Latest trusted server snapshot" is derived, not stored

The prune cutoff is one year before the newest server time the device can trust. The specification freezes `activity_state` at six columns, so there is no column to store it in — and there does not need to be:

```
latestKnownAsOf = max(write.asOf, MAX(activity_logs.created_at))
cutoff          = latestKnownAsOf minus one year
delete where created_at < cutoff
```

Every cached `created_at` is server-issued and every `asOf` is server-issued, so the max of the two is a sound lower bound on server "now" and is **monotone** — it can only move forward as pages arrive. An older-page write carries the snapshot-bound `asOf` of its chain, which is at most the newest one; taking the max means it prunes at the same boundary rather than under-pruning. The device clock is never consulted, so a wrong clock cannot delete a year of history.

Comparison is lexicographic on canonical UTC ISO-8601 text, the property ADR 011/D4 established and the mappers guarantee.

**Rejected — a seventh `activity_state` column.** It would store what two existing columns already imply, add a migration field to keep consistent, and put the ticket outside the frozen schema.

### D5 — The older-page cursor lifecycle lives in the repository

Four rules, all provable without a network:

| Situation | Behavior |
| --- | --- |
| First successful page on an empty cache | Store the response's `nextCursor` as `olderPageCursor`. A `null` `nextCursor` sets `olderPageComplete = true` — the whole history fits in one page. |
| Later newest-page refresh, cursor already stored | **Preserve** the stored cursor. A partial backfill must not restart from page two, and the newest page's `nextCursor` points at a window the student already has. |
| Successful older-page write | Overwrite `olderPageCursor` with the write's `nextCursor`, after the rows land. `nextCursor === null` sets `olderPageComplete = true`. |
| Server rejects the stored cursor (400) | `clearOlderPageCursor()` sets `olderPageCursor = null` and `olderPageComplete = false`, and **deletes no rows**. Pagination restarts from the newest page; D1's upsert identity makes the repeated pages harmless. |

"Preserve on newest refresh, overwrite on older write" is the whole subtlety, and it is why the two operations are separate functions rather than one with a boolean.

`activity_state` is a singleton keyed `id = 1`. No row is seeded by the migration: a **missing** row reads as the documented defaults (`lastReadAt: null`, `unreadCount: 0`, `lastSuccessfulRefreshAt: null`, `olderPageCursor: null`, `olderPageComplete: false`), matching the total-read posture `@/storage` already uses, and every write is an upsert on `id`. This means a fresh install, a reset device, and a device whose state row was somehow lost all behave identically, with no migration-time seed to get wrong.

### D6 — Malformed rows are skipped by a pure mapper; the repository records the skip

`rowToActivityLog(row)` returns `ActivityLog | null`. It returns `null` when `change_json` does not parse, or parses to something that is not an object carrying the three `CalendarChangeGet` arrays. It stays **pure** — no `db`, no `@/firebase` — so it tests exhaustively against literal rows.

The specification requires a malformed row to be "recorded through the existing unexpected-local-data path". That path is `recordUnknownError(error, "<static context>")` on the `@/firebase` seam. Putting it in the mapper would make the mapper impure and would fire once per bad row per read. So the **repository's read** filters the nulls and, when it dropped any, records once with a static context and a **count** — never a log id, calendar id, calendar name, event title, location, or any part of `change_json`. The specification's privacy rule ("tokens, event titles, locations, descriptions, calendar IDs, log IDs … never appear in Crashlytics attributes") is a hard constraint on this line, and a negative test pins it.

The **write** mapper is defensive symmetrically: `dtoToActivityRow(dto)` returns `null` when `createdAt` or `updatedAt` cannot be parsed into a canonical ISO string. A row whose date text is not orderable would silently corrupt both the newest-first read and the age prune, so it must never reach the table. The caller skips such rows exactly as the read skips malformed ones.

### D7 — The migration upgrade path is proven against real SQLite

`expo-sqlite` and `drizzle-orm/expo-sqlite` are mocked suite-wide (`jest/setup-db.ts`) because they have no off-device JS, so `migrate.test.ts` can only prove the *runner wiring*. That is not enough for a table addition the ticket calls a data-incident surface: the thing that must be true is that the committed SQL applies cleanly **to a database that already has the other four tables and rows in them**.

Node 24 (pinned by `.nvmrc`, the same version CI uses) ships `node:sqlite`. A Jest file with a `@jest-environment node` docblock can therefore read the committed `.sql` files and `meta/_journal.json` from disk with `fs`, apply them to an in-memory `DatabaseSync`, and assert against `sqlite_master`. This was verified working in this repository before the change was written — a probe applied all four existing migrations to `:memory:` and read back the four table names.

Three proofs:

1. **Fresh install** — apply every journal entry in order; `activity_logs` and `activity_state` exist with the expected columns; both indexes exist.
2. **Upgrade from an existing database** — apply every entry *before* the Activity migration, insert a representative row into each of the four existing tables, then apply the Activity migration; the new tables exist and **every pre-existing row is still there, unchanged**.
3. **Additive-only** — the Activity migration's SQL contains no `DROP` or `ALTER` against an existing table, and the journal's earlier entries are unmodified.

Reading the SQL from disk rather than importing it also sidesteps the Metro `.sql` transformer that Jest does not have.

**Rejected — adding `better-sqlite3` to get a real Drizzle driver in tests.** It would let the repository tests run against real SQL too, but it is a native dev dependency requiring a compile step in CI, for a benefit the extended fake harness (D8) already delivers. `node:sqlite` is a built-in and is used only to execute committed SQL text, where a driver is not needed.

### D8 — Extend the shared fake `@/db`, do not hand-roll a new mock

`createFakeDb` (`src/test-support/fake-db.ts`) is the shared stateful in-memory `@/db` harness five suites already use; TIM-151/154 consolidated ~200 lines of near-identical hand-rolled `jest.mock("@/db", …)` factories into it. It currently models exactly `eq` and `asc` with a single-condition `where` and a single-key `orderBy`. The Activity repository needs `desc`, `and`, `lt`, `notInArray`, and a two-key `orderBy(desc(createdAt), desc(id))`.

So the fake's condition model becomes a small tree (`{op: "eq" | "lt" | "notInArray", field, val}` and `{op: "and", parts}`) evaluated by `matches`, and `orderBy` accepts multiple keys with a direction. **`eq`/`asc` keep their existing call-spy contract** — no existing test asserts on the *returned shape* of a condition, only on `spies.eq(column, value)` / `spies.where` / `spies.orderBy` call arguments, so the extension is backward compatible by construction. The five existing suites must stay green **with no edits**; that is the acceptance test for the extension.

The alternative — a bespoke Activity mock — is the duplication TIM-151 was dispatched to remove.

### D9 — One ADR covering D1 and D2

D1 (incremental, never replaced) and D2 (server-time watermark) are both costly to reverse and neither is derivable from the code: D1 looks like an inconsistency with `calendar_events` until you know why, and D2 looks like an over-complication until you picture a wrong clock. The Book's ADR policy ("only for a costly-to-reverse decision") is met by both, and the four preceding tables each carry one, so one ADR records both.

**Number it immediately before writing.** The live index tops out at `044-jest-per-test-time-budget.md`, so `045` is the next free number — but open PR #273 currently carries a `044-…` file of its own and will renumber to `045` when it rebases. An ADR-number collision is **invisible to git**: two different filenames merge as two clean adds, and the duplicate only surfaces when a human reads the index. Re-check `docs/mobile/architecture-book/decisions/` **and** the open mobile PRs at the moment of writing, and keep the ADR's prose free of bare "ADR 0NN" cross-references that a renumber would falsify.

## Risks / Trade-offs

- **The upgrade-path proof executes SQL, not the Drizzle migrator.** It proves the committed statements apply to a real database with real prior rows — it does not prove `drizzle-orm/expo-sqlite/migrator`'s bookkeeping, which stays covered by `migrate.test.ts` against the mocked runner and by the on-device app launch. This is the honest boundary; the alternative (a real expo-sqlite runtime in Jest) does not exist off-device.
- **`node:sqlite` is flagged experimental on Node 24** and prints an `ExperimentalWarning`. It is a built-in, pinned by `.nvmrc` to the version CI runs, and used only in a test — but a future Node bump could change its API surface. Confine it to the one test file so the blast radius is one file.
- **The fake-`@/db` extension is shared infrastructure.** A regression there silently weakens five other suites rather than failing loudly. Mitigated by keeping `eq`/`asc` untouched and by requiring the existing suites to pass **unmodified**.
- **Row-by-row upsert is N statements per page.** Bounded at 100 by the server's page cap, inside one transaction — well under the cost of the existing 600-row sync replace. If the page cap ever rises materially, revisit with a chunked multi-row upsert.
- **The `activity_state` singleton is a repository convention, not a database constraint.** A `CHECK (id = 1)` would enforce it in SQL, but the repository is the only writer, every write is an upsert on the constant, and a check constraint on a table that ships to field devices is harder to change later than a constant. A test pins that repeated writes leave exactly one row.
- **Pruning depends on canonical ISO text ordering.** Guaranteed by D6's write mapper rejecting unparseable dates, which is exactly why that guard is not optional.

## Migration Plan

Additive schema only: one new migration creating two tables and two indexes, touching no existing table. Rollback is a code revert — the new tables are simply never read again, and no destructive down-migration is needed (the specification's rollout section says the same). Both tables are backend-bound rebuildable data, so the environment-switch reset already clears them once they are in `resetBackendDatabaseWith`, and a student who switches environments or reinstalls simply refetches.

No server change, no OpenAPI change, no native config change, no new runtime dependency.

## Open Questions

None blocking. Two calls the Applier makes at implementation time:

- The exact ADR number (D9) — determined immediately before writing the file, not now.
- The generated migration's tag name, which `drizzle-kit generate` assigns.
