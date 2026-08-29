> Every path below is relative to the repository root. All commands run from `mobile/`.
> Read `docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture decisions 5, 8, 9; Mobile state behavior; Verification strategy → React Native data tests) and `docs/mobile/architecture-book/storage.md` before starting.

## 1. Schema and migration (sensitive surface — `mobile/src/db/`)

- [x] 1.1 Add `activityLogs` to `mobile/src/db/schema.ts`: `id` TEXT primary key (the server calendar-log id), `calendarId` / `calendarName` / `changeJson` / `createdAt` / `updatedAt` all TEXT `notNull`. Add the two indexes with the Drizzle `sqliteTable(name, cols, (t) => [ index(...).on(t.createdAt), index(...).on(t.calendarId) ])` third-argument array form. Follow the file's existing comment style: state *why* the columns are TEXT-ISO and JSON-as-TEXT, and state explicitly that this table is **not** a Phase-09 importer target (unlike the four above it) so the next reader does not apply the importer-fidelity constraint here.
- [x] 1.2 Add `activityState` to the same file: `id` INTEGER primary key (always `1`), `lastReadAt` / `lastSuccessfulRefreshAt` / `olderPageCursor` nullable TEXT, `unreadCount` INTEGER `notNull` default `0`, `olderPageComplete` INTEGER `mode: "boolean"` `notNull` default `false`. Do **not** add a seventh column (design D4) and do **not** seed a row in the migration (design D5).
- [x] 1.3 Generate the migration with `npm run generate:migrations`. Verify: exactly one new `.sql` file, one new `meta/_journal.json` entry, an added import + map entry in `migrations/migrations.js`, and **no diff** to any earlier `.sql` file or journal entry. Read the generated SQL and confirm it contains only `CREATE TABLE` / `CREATE INDEX` — no `DROP`, no `ALTER` of an existing table. Verification: `git diff --stat mobile/src/db/migrations/`.

## 2. Real-SQLite migration proof (the data-incident gate)

- [x] 2.1 Add `mobile/src/db/migrations.sqlite.test.ts` with a `/** @jest-environment node */` docblock. It reads `meta/_journal.json` and the `.sql` files from disk with `node:fs` (not `import` — Jest has no Metro `.sql` transformer) and applies them to an in-memory `node:sqlite` `DatabaseSync`, splitting each file on `--> statement-breakpoint`. Node 24 is pinned by `.nvmrc` and is what CI runs; this approach was verified working against the four existing migrations before this change was written.
- [x] 2.2 **Fresh-install test:** apply every journal entry in order; assert `activity_logs` and `activity_state` exist in `sqlite_master` with the expected columns (`PRAGMA table_info`), and that both indexes exist (`sqlite_master` where `type = 'index'`).
- [x] 2.3 **Upgrade-path test (the one that matters):** locate the Activity migration by scanning journal entries for the SQL that creates `activity_logs`; apply every entry *before* it; `INSERT` one representative row into each of `personal_events`, `user_calendars`, `calendar_events`, `checklist_items`; apply the Activity migration; assert the new tables and indexes exist **and** every inserted row is still present with unchanged values. Locate by tag scan, not a hard-coded index, so a future migration does not silently change what this proves.
- [x] 2.4 **Additive-only test:** assert the Activity migration's SQL matches no `DROP TABLE` / `ALTER TABLE` against an existing table name.
- [x] 2.5 Verification: `npx jest src/db/migrations.sqlite.test.ts` passes. Confirm the `node:sqlite` `ExperimentalWarning` does not fail the run under `npm test` (`jest --ci`).

## 3. `@/db` seam extension

- [x] 3.1 Re-export `activityLogs` and `activityState` from `mobile/src/db/index.ts`, alongside the four existing tables.
- [x] 3.2 Re-export the operators the Activity repository needs and nothing more (R-2): `desc`, `and`, `lt`, `notInArray` from `drizzle-orm`, joining the existing `asc` / `eq`. Add a comment naming which operation needs each (newest-first ordering, the composite prune condition, the age cutoff, the ownership prune).
- [x] 3.3 Extend `mobile/src/db/reset.ts`: add `activityLogs` and `activityState` to `BackendResetTables` and delete both inside the existing single synchronous transaction, before the identity/local-event tables (they are cache-shaped, like `calendar_events`). Wire the two new tables into `resetBackendDatabase()` in `index.ts`.
- [x] 3.4 Extend `mobile/src/db/reset.test.ts` to six tables: the seeded/emptied set, the exact delete order, and the `toHaveBeenCalledTimes(6)` + `invocationCallOrder` assertions. Confirm the environment-switch path needs no separate change — `switch.ts` calls `resetBackendDatabase`, so there is exactly one list (record this in the change notes; it is the design's claim).

## 4. Shared fake-`@/db` extension (`mobile/src/test-support/fake-db.ts`)

- [x] 4.1 Replace the fake's single-condition model with a small tree: `{ op: "eq" | "lt" | "notInArray", field, val }` and `{ op: "and", parts }`, evaluated by `matches`. Add `desc`, `and`, `lt`, `notInArray` operators to the exported module and to `FakeDb["spies"]`, each recording to a spy exactly as `eq` / `asc` do.
- [x] 4.2 Make `orderBy` accept multiple keys with a direction, sorting by each in turn (the Activity read is `orderBy(desc(createdAt), desc(id))`). Keep the existing single-`asc` behavior identical.
- [x] 4.3 Do **not** change the `eq` / `asc` spy contract. Verification: run the five existing consumers **unmodified** and confirm green — `npx jest src/features/calendar/data/sync src/features/event-checklists/data/repository.test.ts src/features/calendar-sources/data/user-calendars/repository.test.ts src/features/personal-events/data/repository.test.ts src/db/reset.test.ts`. Any edit needed to an existing test is a signal the extension broke compatibility; fix the fake, not the test.

## 5. Activity feature data layer (`mobile/src/features/activity/`)

- [x] 5.1 Create `data/types.ts`: the domain `ActivityLog` (decoded `CalendarChangeGet`, `Date` timestamps) and the `ActivityState` shape with its documented defaults. Freeze the page-write input shape here too (rows, server `asOf`, held calendar ids, next cursor, optional unread count / last-successful-refresh).
- [x] 5.2 Create `data/mappers.ts` — **pure**, no `db`, no `@/firebase` (design D6). `rowToActivityLog(row): ActivityLog | null` decodes `changeJson` defensively (parse failure, non-object, or missing the three `CalendarChangeGet` item collections → `null`). `dtoToActivityRow(dto): ActivityLogInsert | null` canonicalizes both timestamps via `new Date(x).toISOString()` and returns `null` when either is unparseable. Reuse `@/db`'s `isoToDate` / `dateToIso` primitives where they apply; do not re-implement them.
- [x] 5.3 Create `data/repository.ts` over the `@/db` seam. Operations: `readActivityState()`, `listActivityLogs()` (newest first, `desc(createdAt)` then `desc(id)`), `storeNewestPage(...)`, `storeOlderPage(...)`, `clearOlderPageCursor()`, `markActivityRead(asOf)`, `markActivityReadFromCache()`. Every write is one **synchronous** `db.transaction` callback with `.run()` executors, wrapped to return `Promise<void>` (mirror `replaceAll` in `calendar/data/sync/repository.ts`).
- [x] 5.4 Implement the shared page-write transaction body in the fixed order of design D3: upsert each row by id (`onConflictDoUpdate({ target: activityLogs.id, set })`, row by row) → prune by age → prune by ownership → write state. State last, same transaction.
- [x] 5.5 Age prune: cutoff is one year before `max(write.asOf, MAX(activity_logs.created_at))` (design D4). Read the cached max inside the transaction. Never read the device clock.
- [x] 5.6 Ownership prune: `notInArray(activityLogs.calendarId, heldCalendarIds)`; when `heldCalendarIds` is empty, delete the whole table (`NOT IN ()` is invalid SQL).
- [x] 5.7 Cursor lifecycle (design D5): `storeNewestPage` **preserves** a non-null stored `olderPageCursor` and only sets one when none is stored; `storeOlderPage` always overwrites; a `null`/absent next cursor sets `olderPageComplete = true`; `clearOlderPageCursor()` nulls the cursor, sets `olderPageComplete = false`, and deletes **no** rows.
- [x] 5.8 Read state (design D2 / specification architecture decision 8): `markActivityRead(asOf)` writes the server `asOf` and zeroes the unread count; `markActivityReadFromCache()` zeroes the count and advances the watermark only to `MAX(created_at)` and only when that is later than the stored watermark; a page write storing a server `unreadCount` **never** touches the watermark. No code path may write `lastReadAt` from `Date.now()` / `new Date()`.
- [x] 5.9 `activity_state` writes are upserts on the constant id `1`; a missing row reads as the documented defaults. No seed, no `CHECK` constraint.
- [x] 5.10 Malformed-row recording: `listActivityLogs` filters out mapper nulls and, when it dropped any, records **once** through `recordUnknownError` with a static context (e.g. `"activity/decode"`) and the skipped **count** only — never a log id, calendar id, calendar name, or any change-payload content.
- [x] 5.11 Add `data/index.ts` (sublayer barrel) and `mobile/src/features/activity/index.ts` (feature barrel re-exporting `./data`). B-2: the sublayer must not import its own feature barrel. No `ui/` in this ticket.

## 6. Tests

- [x] 6.1 `data/mappers.test.ts`: valid round-trip; `changeJson` that is not JSON; JSON that is not an object; an object missing the item collections; unparseable `createdAt` and `updatedAt` on the write side. Pure — no `@/db` mock needed.
- [x] 6.2 `data/repository.test.ts` using `createFakeDb` (never a bespoke mock). Cover, one test each: first page stored and read newest-first; a repeated page updates in place without duplicating; an overlapping older page merges without losing rows outside it; a throwing transaction leaves rows **and** state untouched; the transaction callback is non-async (`callback.constructor.name !== "AsyncFunction"`, as `reset.test.ts` does) and every write runs in exactly one transaction.
- [x] 6.3 Retention tests: rows beyond one year are pruned; a write carrying an older `asOf` still prunes at the newest cached `created_at`; a device clock set far forward and far back does not change the pruned set (drive it with a fake clock and assert the same result).
- [x] 6.4 Calendar-removal tests: only the omitted calendar's rows are deleted, every still-held calendar's rows remain; an empty held-id list empties the table.
- [x] 6.5 Cursor tests: first page persists its cursor; a newest-page refresh preserves an existing cursor; an older-page write overwrites it; a failed write does not advance it; an absent next cursor marks the chain complete; the cursor survives `jest.resetModules()` (the simulated restart — follow `calendar/data/sync/restart.test.ts`); `clearOlderPageCursor()` resets the chain with **every cached row still present**.
- [x] 6.6 Read-state tests: `markActivityRead(asOf)` sets the watermark and zeroes the count; a page write with an unread count stores it and leaves the watermark untouched; `markActivityReadFromCache()` advances only through the newest cached server timestamp and never past a later stored watermark; a negative test proving no operation writes a device-clock value into `lastReadAt`.
- [x] 6.7 Privacy negative test: the `recordUnknownError` call for skipped rows carries no log id, calendar id, calendar name, or change-payload substring.

## 7. Gates

- [x] 7.1 `npx tsc --noEmit` — green.
- [x] 7.2 `npm run lint` — green. Confirm the B-1 boundary is satisfied: only `features/activity/data/**` imports `@/db`, and nothing outside `src/db/**` imports `drizzle-orm/sqlite-core`.
- [x] 7.3 `npm test -- --coverage` — green, with `src/db/**` and `src/features/activity/!(ui)/**` both meeting the **90% lines and branches** gate (the plain `npm test` form passes blind past it — run the coverage form). Defensive `null` branches in the mappers need explicit tests to reach branch coverage; do not add `istanbul ignore` to reach the number.
- [x] 7.4 Confirm the full suite is green with **no edits** to any pre-existing test file other than `src/db/reset.test.ts` (task 3.4). Any other required edit means the fake-db extension regressed a consumer.

## 8. Architecture Book

- [x] 8.1 Write the ADR recording design D1 (the cache is merged by log id, never replaced — and why that diverges from `calendar_events`' drop+replace) and D2 (`lastReadAt` is a server-issued `asOf`; a device-clock watermark permanently breaks the unread badge on a wrong clock). Follow `decisions/TEMPLATE.md`. **Pick the number immediately before writing:** re-read `docs/mobile/architecture-book/decisions/` for the live maximum *and* check the open mobile PRs (`gh pr diff <N> --name-only | grep decisions/`) — open PR #273 carries its own `044-…` and will renumber upward on rebase, and an ADR-number collision is invisible to git because two different filenames merge as two clean adds. Add the entry to `decisions/README.md`. Avoid bare `ADR 0NN` cross-references in the prose that a later renumber would falsify.
- [x] 8.2 `docs/mobile/architecture-book/storage.md`: add `activity_logs` and `activity_state` to the Tables table with their important representation; state in **Durability** that both are backend-bound rebuildable data (like `calendar_events`), that the read watermark is server-issued time, and that they are not Phase-09 import targets; update the **Backend environment reset** bullet from four tables to six in the documented delete order.
- [x] 8.3 `docs/mobile/architecture-book/features.md`: add the `activity` row — responsibility (device-local Activity history cache, read watermark, and pagination state) and seams (`@/db`; `activity_logs` / `activity_state`; held calendar ids supplied by the caller, so no calendar-feature dependency). Note in the change notes that the cross-feature contracts and the Settings entry land with Tickets 4–6.
- [x] 8.4 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` naming both decisions, the two new tables, the six-table reset, and the ADR number (migration-approach §7).

## 9. Definition of Done

- [x] 9.1 Walk `docs/mobile/architecture-book/definition-of-done.md`. Applicable: gates green with coverage, ADR + Book updated. Record the reason for each non-applicable item: no user-facing surface, so no Maestro flow, no FR/EN strings, no accessibility pass, no device-form-factor check this ticket (they land with Ticket 5).
- [x] 9.2 Confirm the diff is limited to `mobile/src/db/` (schema, migration, index, reset + tests), `mobile/src/features/activity/`, `mobile/src/test-support/fake-db.ts`, the OpenSpec change, and the four Book files — no server change, no OpenAPI change, no native/`app.config.ts`/`eas.json` change, no new runtime dependency, no route.
- [x] 9.3 `openspec validate add-mobile-activity-cache --strict` passes (run it early, not at merge time — the delta-header check is what `openspec archive` gates on, and it aborts behind the long CI gate).
- [x] 9.4 Flag both sensitive surfaces in the PR body: the `mobile/src/db/` schema + migration runner (with a pointer to the upgrade-path proof in task 2.3) and the environment-switch reset path (with a pointer to task 3.4).

## Change notes (Applier)

**Deviations from the plan, with reasons.**

- **`and` is NOT re-exported from `@/db` (task 3.2).** The design's fixed statement order
  (D3: upsert → prune by age → prune by ownership → state) makes the two prunes *separate*
  deletes, so nothing composes conditions. Re-exporting `and` with no consumer violates R-2
  ("re-export ONLY what a consumer needs"), so it was left out of both `@/db` and the fake,
  with a comment at the export site naming the reason. Add it back with its consumer if a
  later Activity ticket needs one.
- **The fake gained `.limit()` and a synchronous `.all()` (tasks 4.1–4.2).** Not in the plan,
  but required by D4/D5: the page write must read its state row and its newest cached
  timestamp *inside* the synchronous transaction, and `drizzle-orm/expo-sqlite` is a `'sync'`
  session, so `.all()` is how a real read happens there. `.limit(1)` makes the newest-timestamp
  read ride the `created_at` index instead of scanning. `eq`/`asc` keep their spy contract.
- **`src/db/schema.test.ts` added (task 7.3).** Drizzle evaluates the third-argument index
  callback lazily, so the two `index(...)` declarations never executed and `schema.ts` fell to
  85.71% lines, under the 90% `src/db/**` gate. The test reads the table config, which both
  covers the callback and catches a future edit that drops an index from the schema —
  something `migrations.sqlite.test.ts` cannot see, since it only inspects the *already
  committed* migration.
- **State writes are read-modify-write of the whole row (task 5.9).** `values` and `set` then
  carry identical content. A partial upsert would insert defaults for the untouched columns on
  the first write (no row exists yet), quietly clobbering state — and it would also make the
  fake and real SQLite disagree, since real SQLite applies only `set` on conflict.
- **One extra defensive branch in the age prune (task 5.5).** `ageCutoffIn` canonicalizes
  *both* candidates, not just `asOf`. A test caught the original: an unorderable cached
  `created_at` reached `toISOString()` and threw, which would have taken the whole page write —
  rows included — down with it. It now degrades to "no trusted time" and skips the prune rather
  than deleting against a garbage cutoff.

**Confirmations the plan asked for.**

- **Task 3.4 — one reset list.** Confirmed: `src/db/switch.ts` calls `resetBackendDatabase()`,
  which calls `resetBackendDatabaseWith`. There is exactly one table list, so the
  environment-switch path needed no separate change. `reset.test.ts` now also asserts every
  seeded table reads back empty, so the Activity tables are proven cleared, not just proven
  passed to `delete`.
- **Task 4.3 — no consumer regressed.** The five existing `createFakeDb` consumers (10 suites,
  51 tests) pass **unmodified**. The only pre-existing test file edited is `src/db/reset.test.ts`,
  which task 3.4 authorizes.
- **Task 8.1 — ADR number.** Live index topped out at `044`. Open PR #273 carries its own
  `044-preserve-content-and-advise-source-recovery.md`, which collides with the merged `044` and
  renumbers to `045` on rebase — so this ADR took **046**, leaving `045` free. `decisions/README.md`
  records why the gap exists, since an ADR-number collision is invisible to git.
- **Task 8.3 — cross-feature contracts.** The `activity` feature row names only the seams this
  ticket ships. The refresh coordinator and the calendar-sources read land with Ticket 4; the
  screen and the Settings unread entry with Ticket 5; trigger wiring with Ticket 6.
- **Task 9.1 — Definition of Done.** Applicable and met: `tsc`/lint/tests green, the 90% logic
  gate met (`activity/data` at 100% lines and branches, `src/db` at 100% lines), Book and ADR
  updated, and unexpected failures reach Crashlytics with no personal data (pinned by a negative
  test). Not applicable, all for the same reason — **this ticket ships no user-visible surface**:
  no Maestro happy path, no FR/EN strings, no VoiceOver/TalkBack or touch-target pass, no
  low-end-device check, no DebugView analytics. They land with Ticket 5, which owns the screen.
- **Task 9.2 — diff scope.** Limited to `mobile/src/db/`, `mobile/src/features/activity/`,
  `mobile/src/test-support/fake-db.ts`, the OpenSpec change, and four Book files. No server, no
  OpenAPI, no native/`app.config.ts`/`eas.json`, no new runtime dependency (`node:sqlite` is a
  Node built-in used only by a test), no route.
