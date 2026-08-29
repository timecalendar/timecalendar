## 0. Read first

- [ ] 0.1 Read `docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture
      decisions 5 and 8, *Mobile state behavior*, *Verification strategy → React Native data
      tests*), `docs/mobile/architecture-book/storage.md`, and this change's `design.md`. The
      design resolves one specification ambiguity (the two-clock split behind `last_server_as_of`) —
      read that section before writing the schema.

## 1. Schema and migration (sensitive surface: ships to devices, no JS rollback)

- [ ] 1.1 Add `activityLogs` to `mobile/src/db/schema.ts`: `id` text PK (server log id),
      `calendarId` text NOT NULL, `calendarName` text NOT NULL, `changeJson` text NOT NULL,
      `createdAt` text NOT NULL, `updatedAt` text NOT NULL. Add the two indexes
      (`activity_logs_created_at_idx` on `created_at`, `activity_logs_calendar_id_idx` on
      `calendar_id`) via Drizzle's table-extras callback. Comment it in the voice of the four
      existing tables: why merge-by-server-id rather than drop+replace, why TEXT-ISO, why plain
      TEXT JSON rather than `mode: "json"`, and that it is explicitly NOT a Phase-09 importer target.
- [ ] 1.2 Add `activityState` to the same file: `id` integer PK (always 1), `lastReadAt` text
      nullable, `unreadCount` integer NOT NULL default 0, `lastServerAsOf` text nullable,
      `lastSuccessfulRefreshAt` text nullable, `olderPageCursor` text nullable, `olderPageComplete`
      integer boolean NOT NULL default false. Comment the two-clock split: `lastServerAsOf` and
      `lastReadAt` are SERVER time; `lastSuccessfulRefreshAt` is DEVICE time and is used only for
      the five-minute freshness check a later ticket adds.
- [ ] 1.3 Generate the migration with `npm run generate:migrations` (drizzle-kit). Verify the emitted
      `0004_*.sql` contains only `CREATE TABLE` / `CREATE INDEX` — **no `ALTER`, no `DROP`, nothing
      touching an existing table**. Confirm `meta/_journal.json`, `meta/0004_snapshot.json`, and
      `migrations/migrations.js` all gained their entry; if drizzle-kit did not update
      `migrations.js`, add the import + map entry by hand in the existing style.
- [ ] 1.4 Verification: `git diff mobile/src/db/migrations/` shows an additive 0004 only, and the
      four existing `.sql` files and their snapshots are byte-identical to `main`.

## 2. Real-SQLite migration proof (no test in this repo executes a migration today)

- [ ] 2.1 Add `mobile/src/db/migrations.test.ts` using `import { DatabaseSync } from "node:sqlite"`
      (Node 24 built-in; `.nvmrc` pins 24.13.0 and CI reads `node-version-file: .nvmrc`). Drive the
      **committed bundle** (`./migrations/migrations`), applying each entry in journal order and
      splitting each SQL string on `--> statement-breakpoint`. Do not re-read the `.sql` files from
      disk — the bundle is what the device applies.
- [ ] 2.2 Fresh-install case: apply every migration to `:memory:`; assert `activity_logs` and
      `activity_state` exist in `sqlite_master` and that both named indexes exist.
- [ ] 2.3 Upgrade case: apply `0000…0003` only, insert one representative row into each of
      `personal_events`, `user_calendars`, `calendar_events`, `checklist_items`, then apply `0004`.
      Assert the two Activity tables and both indexes now exist AND every pre-existing row is still
      present and field-for-field unchanged. This is the acceptance criterion "upgrades an existing
      database", so assert the row contents, not just the counts.
- [ ] 2.4 Assert the schema shape the repository depends on: `activity_logs.id` is the primary key
      (so `ON CONFLICT (id)` upsert is well-defined) — read it from `PRAGMA table_info` /
      `PRAGMA index_list`, not from the SQL text.
- [ ] 2.5 Verification: `npx jest src/db/migrations.test.ts` green. Node prints an
      `ExperimentalWarning` for `node:sqlite` — that is stderr noise, not a failure; do not silence
      it by changing the pinned Node version.

## 3. `@/db` seam

- [ ] 3.1 Export `activityLogs` and `activityState` from `mobile/src/db/index.ts` alongside the
      existing four tables.
- [ ] 3.2 Re-export `desc`, `lt`, and `notInArray` from `drizzle-orm` through the seam, in the
      existing "only what a consumer needs" style (R-2), with a comment naming the Activity query
      each one serves.
- [ ] 3.3 Extend `mobile/src/db/reset.ts`: add `activityLogs` and `activityState` to
      `BackendResetTables` and delete them FIRST inside the same synchronous transaction, in the
      order `activityLogs → activityState → checklistItems → calendarEvents → userCalendars →
      personalEvents`. Update `resetBackendDatabase()` in `index.ts` to pass both.
- [ ] 3.4 Update `mobile/src/db/reset.test.ts`: six tables in the asserted delete order, six-way
      invocation-order assertion, and a case proving Activity state is gone after a reset.
- [ ] 3.5 Verification: `npx jest src/db/reset.test.ts` green.

## 4. Shared fake-db extension (additive — existing consumers must stay green untouched)

- [ ] 4.1 Extend `mobile/src/test-support/fake-db.ts` with `desc`, `lt`, and `notInArray` resolvers,
      multi-key `orderBy` (accept a list of orders and compare in sequence, descending supported),
      and a `delete(table)` with no `where` that clears the table **inside** a transaction. Keep the
      existing spy surface and the documented `mock`-prefix hoisting rule.
- [ ] 4.2 Support the `insert(...).values(row).onConflictDoUpdate(...).run()` shape used inside a
      synchronous transaction — the existing `onConflictDoUpdate` path only terminates via `then`.
- [ ] 4.3 Verification: run every existing fake-db consumer suite unchanged and green —
      `npx jest src/db/reset.test.ts src/features/personal-events/data/repository.test.ts
      src/features/event-checklists/data src/features/calendar-sources/data/user-calendars
      src/features/calendar/data/sync`.

## 5. Activity domain types and pure mappers

- [ ] 5.1 Create `mobile/src/features/activity/data/types.ts`: the domain `ActivityLog`
      (`id`, `calendarId`, `calendarName`, `change`, `createdAt: Date`, `updatedAt: Date`) and
      `ActivityChange` (`oldItems`, `newItems`, `changedItems`), plus `ActivityState` and the
      documented default state value.
- [ ] 5.2 Write the DTO→row mapper against the **frozen v1 contract shape in the specification**
      (`CalendarLogV1`: `id`, `calendarId`, `calendarName`, `calendarChange`, `createdAt`,
      `updatedAt` — no `calendarToken`). Do NOT import a generated v1 type; Ticket 2 has not shipped
      it. Define the input shape locally and leave a comment naming
      `openspec/changes/add-v1-calendar-log-search` as where the generated type will come from, so
      Ticket 4 can swap it. Canonicalize both timestamps with `toISOString()` and JSON-encode the
      change.
- [ ] 5.3 Write the total row→domain decoder: unparseable JSON / `null` / non-object → return
      `null` (caller skips the row); a parsed object with absent or non-array `oldItems` /
      `newItems` / `changedItems` → those collections degrade to `[]` and the row survives. No
      per-element validation (the ADR 021 / D2 posture). Keep it PURE — no `db`, no `@/firebase`.
- [ ] 5.4 Write `types.test.ts`: valid round-trip; each of the three collections independently
      absent / non-array / present; `"{"`, `"null"`, `"[]"`, `'"string"'`, and `"7"` as stored
      payloads; timestamp canonicalization of a non-canonical input string.
- [ ] 5.5 Verification: `npx jest src/features/activity/data/types.test.ts` green.

## 6. Activity repository

- [ ] 6.1 Create `mobile/src/features/activity/data/repository.ts` — a module of functions over
      `@/db` only (never `drizzle-orm` directly), mirroring `user-calendars/repository.ts`.
- [ ] 6.2 `storeActivityPage(input: ActivityPageWrite)` in ONE **synchronous** `db.transaction`
      (non-async callback, `.run()` executors — `storage.md`'s rule; an async callback commits after
      the first statement and the atomicity is a lie). Statement order: (1) upsert each row by `id`
      with `onConflictDoUpdate`; (2) delete rows with `createdAt < cutoff` where
      `cutoff = max(input.serverAsOf, stored lastServerAsOf) − 1 year`; (3) delete rows whose
      `calendarId` is outside `input.heldCalendarIds`, with an explicit branch deleting ALL rows
      when that array is empty; (4) upsert the state row. Never call `Date.now()` or `new Date()`
      with no argument anywhere in this function — every timestamp arrives as an input.
- [ ] 6.3 Cursor rules inside step (4): an `older` page sets `olderPageCursor = nextCursor` and
      `olderPageComplete = nextCursor === null`; a `newest` page adopts `nextCursor` only when the
      stored cursor is null AND `olderPageComplete` is false, otherwise it preserves both. Store
      `unreadCount` only when the input supplies it; always advance `lastServerAsOf` to the max and
      `lastSuccessfulRefreshAt` to `input.refreshedAt`.
- [ ] 6.4 `getActivityState()` — total: no row → the documented defaults from 5.1.
- [ ] 6.5 `markActivityRead(watermark: string)` — sets `lastReadAt` to the caller-supplied SERVER
      timestamp and `unreadCount` to 0. `clearLocalUnread()` — `unreadCount = 0`, watermark
      untouched. `clearOlderPageCursor()` — cursor null, `olderPageComplete` false, **no row
      deleted**.
- [ ] 6.6 `removeCalendarActivity(calendarId)` — deletes that calendar's rows only.
- [ ] 6.7 `findActivityLogsNewestFirst()` — ordered `desc(createdAt), desc(id)`, mapping each row
      and skipping decoder nulls; when at least one row was skipped, call `recordUnknownError` ONCE
      for that read through `@/firebase` with a static context (`"activity/malformed-cached-change"`)
      and no row content. `getNewestCachedServerTime()` — the max `createdAt`, or null.
- [ ] 6.8 Add `mobile/src/features/activity/data/index.ts` and `mobile/src/features/activity/index.ts`
      barrels exporting only the public data surface (B-1/B-2: later tickets import
      `@/features/activity`, never a deep path).
- [ ] 6.9 Verification: `npx jest src/features/activity` green.

## 7. Repository tests

- [ ] 7.1 Transaction shape: one `transaction` call, a NON-async callback
      (`callback.constructor.name !== "AsyncFunction"`), every statement inside it (assert via
      `invocationCallOrder`), and a thrown transaction propagates leaving cursor/watermark/rows
      untouched.
- [ ] 7.2 Idempotency: storing the same page twice yields one row per id with identical content;
      storing a page into a cache holding earlier rows preserves the earlier rows (merge, not
      replace).
- [ ] 7.3 Newest-first read including a same-`createdAt` pair broken deterministically by id
      descending.
- [ ] 7.4 Retention: with the device clock faked a year forward AND a year backward
      (`jest.setSystemTime`), the same page store prunes exactly the same rows — the pruning
      assertions must be identical under both clocks. Plus: a stale older-page `asOf` does not move
      `lastServerAsOf` backwards and does not change the cutoff.
- [ ] 7.5 Calendar removal: `removeCalendarActivity` removes one calendar's rows only; a store whose
      held set omits a calendar evicts its rows in the same transaction; an empty held set empties
      the table.
- [ ] 7.6 Read state: default state before any write; a stored server `unreadCount` does not move
      `lastReadAt`; `clearLocalUnread` zeroes the count and leaves the watermark;
      `markActivityRead` stores the exact supplied timestamp and zeroes the count.
- [ ] 7.7 Cursor: first page seeds it; a newest refresh preserves an existing cursor; a completed
      backfill is not re-opened by a newest page carrying a cursor; an older page advances it and
      marks completion on a null `nextCursor`; `clearOlderPageCursor` resets the chain and **every
      cached row is still present** (assert the rows, not just the state).
- [ ] 7.8 Corruption: a table containing one unparseable `change_json` returns the valid rows, does
      not throw, and produces exactly ONE `recordUnknownError` call whose arguments contain no id,
      calendar name, event text, or stored payload (assert on the serialized call arguments).
- [ ] 7.9 Restart durability: mirror the existing `restart.test.ts` pattern — `jest.resetModules()`
      between writes proves the cursor and watermark survive a simulated process restart.

## 8. Architecture Book and feature map (R-1 — same PR)

- [ ] 8.1 Add ADR `docs/mobile/architecture-book/decisions/045-activity-cache-and-read-watermark.md`
      using `TEMPLATE.md`: cache Activity history incrementally in SQLite (merge by server log id,
      never drop+replace) and use a SERVER-time read watermark and retention cutoff, never the
      device clock. Consequences: history survives offline and across pages; a wrong device clock
      cannot hide unread changes or delete history; the cache is rebuildable and resets with
      backend-bound data. Revisit if: history becomes large enough to need scoped SQL reads, or the
      read watermark becomes account-shared across devices. Register it in `decisions/README.md`
      (ADR 045 is unclaimed on `main` and on every remote branch as of 2026-08-29 — re-check before
      committing).
- [ ] 8.2 `storage.md`: add both tables to the Tables table with their important representation;
      note the incremental-merge posture beside `calendar_events`' drop+replace; add both tables to
      the backend-reset list in the documented delete order; state the two-clock rule (server
      watermark/retention vs device freshness stamp).
- [ ] 8.3 `features.md`: add the `activity` feature row (responsibility: Activity history cache and
      device-local read/pagination state; seams: `@/db` `activity_logs` / `activity_state`,
      `@/firebase` for malformed cached data) and one cross-feature contract line — Activity read
      state is device-local and never shared between installations holding the same calendar token.
- [ ] 8.4 Append a dated entry to `architecture-changelog.md` (migration-approach §7).
- [ ] 8.5 Verification: the ADR is linked from `decisions/README.md`'s active table and no other
      file claims 045.

## 9. Gates

- [ ] 9.1 `cd mobile && npx tsc --noEmit`.
- [ ] 9.2 `cd mobile && npm run lint` (0 warnings). Confirm the boundary rules accept the new
      `src/features/activity/data/**` paths with no `eslint.config.js` change; if the feature needs
      registering, that is a config edit to call out in the handoff.
- [ ] 9.3 `cd mobile && npm test -- --coverage` — the coverage form, not bare `npm test`
      (`src/features/*/!(ui|renderer)/**` and `src/db/**` are gated at 90% lines+branches; a bare
      run passes blind past it).
- [ ] 9.4 `npx openspec validate add-mobile-activity-cache --strict` and `openspec archive
      --dry-run` (delta headers are only validated at archive time — catch a MODIFIED/ADDED mismatch
      now, not behind the merge gate).

## 10. Definition of Done

- [ ] 10.1 Walk `docs/mobile/architecture-book/definition-of-done.md`. Applicable: gates + coverage
      (9.x), reusable guidance updated (8.x), unexpected failures reach Crashlytics without personal
      data (6.7/7.8). Record the reason for each item that does not apply: no user-facing text (no
      FR/EN strings this ticket), no UI (a11y, Dynamic Type, contrast, touch targets, low-end device
      — all Ticket 5), no Maestro flow (no user-facing behavior yet — Ticket 7 owns the Activity
      E2E).
- [ ] 10.2 On-device reality check that CI cannot give: the migration's real application on a device
      that already holds data. File it as a `(HUMAN: …)` note in
      `docs/react-native-migration/inbox/` — install the previous build, add a calendar and sync,
      then install this build and confirm startup completes with existing data intact. It is a note,
      never a blocker on this PR.
- [ ] 10.3 Confirm the diff contains no HTTP call, no generated-client import, no screen, no route,
      and no server file — Tickets 4–7 own those.
