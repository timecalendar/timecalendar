## 1. Atomic transactions (independent must-fix; also makes coalescing reliable)

- [x] 1.1 Convert `replaceAll` (`mobile/src/features/calendar/data/sync/repository.ts`) from `db.transaction(async (tx) => …)` with `await tx.…` to Drizzle's synchronous transaction form: a non-async callback using `tx.delete(calendarEvents).run()` and `tx.insert(calendarEvents).values(chunk).run()`; keep the `INSERT_CHUNK_SIZE` chunking. Verify the function still returns a `Promise<void>` to its callers (wrap the sync transaction if needed) without reintroducing an async transaction callback.
- [x] 1.2 Convert `reorder` (`mobile/src/features/event-checklists/data/repository.ts`) to the same synchronous transaction form (`tx.update(checklistItems).set(…).where(…).run()` per item, non-async callback).
- [x] 1.3 Audit the remaining `db.transaction` call sites for the same async-callback anti-pattern; convert any found, or record in the change notes that none remain.
- [x] 1.4 Update the repository tests (`repository.test.ts` for calendar sync and event-checklists) to assert the synchronous-transaction form (non-async callback, `.run()` executors) and that every statement executes inside one transaction. Fix the stale comments in both repositories that claimed atomicity the old code didn't deliver.

## 2. Coalescing reactive read on the `@/db` seam

- [x] 2.1 Create the seam-owned reactive-read hook (e.g. `mobile/src/db/live-query.ts`) as a DROP-IN for Drizzle's `useLiveQuery`: same call signature `(query, deps?)` and same return shape `{ data, error, updatedAt }`. It resolves the observed table from `query.config.table` and its name via `getTableConfig` (public `drizzle-orm/sqlite-core`) to match change events by table name.
- [x] 2.2 Implement trailing-edge coalescing: the INITIAL read runs immediately; each `addDatabaseChangeListener` event for the observed table (re)schedules a single trailing re-read so a burst collapses to ONE re-query, with a guaranteed re-read after the final event of the burst. Use a small coalescing window (one frame / `setTimeout(0)`), pinned by the deterministic test in 2.5.
- [x] 2.3 Preserve the consumer contract exactly: `data` starts as the empty default, `updatedAt` stays `undefined` until the first query resolves.
- [x] 2.4 Add the cancellation guard the stock hook lacks: an in-flight re-read MUST NOT apply its result after unmount or a deps change (clear pending timer + ignore stale resolves on cleanup).
- [x] 2.5 Write the seam unit test (fake timers, mocked `addDatabaseChangeListener`, a fake thenable query): a burst of K change events yields exactly ONE re-read; a re-read is guaranteed after the last event; `data`/`updatedAt` empty-until-first-resolve contract holds; no state update fires after unmount/deps change.
- [x] 2.6 Wire it into the seam: replace `export { … useLiveQuery }` re-export in `mobile/src/db/index.ts` with the seam hook; remove the direct `drizzle-orm/expo-sqlite/query` import.
- [x] 2.7 Confirm the lint boundary bans importing a reactive-read primitive (`drizzle-orm/expo-sqlite/query` / `drizzle-orm`) outside `src/db/**`; extend the `no-restricted-imports` rule if the query subpath slips through.

## 3. Verify consumers unchanged + gates green

- [x] 3.1 Run the reactive-read consumer tests (`useSyncedEvents`, `usePersonalEvents`, `useUserCalendars`, `useEventDetails`, `useChecklist`) and the calendar/home/hidden-events screen tests — all mock at the seam and MUST stay green with no consumer edits.
- [x] 3.2 Run the full gate set: `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage` (the coverage form — plain `npm test` passes blind past the 90% per-file branches gate). New seam module + transaction changes must meet the coverage floor.

## 4. Architecture Book corrections

- [x] 4.1 Amend ADR 021 (`docs/mobile/architecture-book/decisions/021-calendar-event-storage-and-sync.md`) IN PLACE: record the real freeze mechanism under the already-fired revisit trigger (per-row `sqlite3_update_hook` events × synchronous whole-table re-query, not render jank); correct D3's atomicity wording to the synchronous-transaction form; and correct the erroneous "Phase-09 importer target" claim (the roadmap recovers only `user_calendars.token`/`personal_events`/`checklist_items`/`hidden_events` and re-syncs cached events — `calendar_events` is NOT migrated).
- [x] 4.2 Correct `docs/mobile/architecture-book/storage.md`: document the coalescing reactive-read contract and the transaction-atomicity contract on the `@/db` seam; remove the reference to the no-longer-existing `findInRange`.
- [x] 4.3 Append an `architecture-changelog.md` entry (dated) for the two new `@/db` seam contracts, per the migration-approach §7 rule.

## 5. On-device validation (atomicity + reactivity are device-proof-only)

- [x] 5.1 On a dev build with a real 500+ event calendar: fully relaunch, open Calendar and Profile, confirm NO startup freeze (JS thread responsive) and the timetable renders.
- [x] 5.2 Force-kill mid-sync (best-effort) and relaunch: `calendar_events` holds either the complete old set or the complete new set, never partial/empty.
- [x] 5.3 Force-kill mid-reorder on a checklist and relaunch: item ordering is the complete old or complete new order, never duplicated/gapped.
- [x] 5.4 Record the device results in a `docs/react-native-migration/inbox/` note (mirrors the calendar-sync on-device note), closing the ADR 021 perf-trigger call.

## 6. Definition of Done

- [x] 6.1 Walk the feature Definition-of-Done checklist (`docs/mobile/architecture-book/definition-of-done.md`): specs updated, gates green with coverage, FR/EN parity N/A, a11y N/A, book updated, changelog appended.
- [x] 6.2 Confirm the diff is limited to the seam hook + two repository functions + tests + docs (no schema/migration/native/route/consumer-signature change) — i.e. reversible by reverting `src/db/` and the two repositories.
