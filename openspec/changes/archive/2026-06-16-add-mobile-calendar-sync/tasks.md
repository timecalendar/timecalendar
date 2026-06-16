# Tasks — add-mobile-calendar-sync

> Read FIRST: `.claude/rules/mobile/storage.md`, `data.md`, `calendar.md`, the
> golden-path exemplar, ADR 011 + ADR 018 (the importer-fidelity precedent), and the
> Flutter sync source (`app/lib/modules/calendar/services/calendar_sync_service.dart`,
> `repositories/calendar_event_repository.dart`, `models/calendar_event.dart` +
> `calendar_event_custom_fields.dart` + `event_tag.dart`). Mirror the user-calendars
> data layer (`mobile/src/features/calendar-sources/data/user-calendars/`).

## 1. Schema — the third Drizzle table (D1)

- [x] Add `calendarEvents = sqliteTable("calendar_events", …)` to `mobile/src/db/schema.ts`
      with: `uid` TEXT primaryKey; `title`, `color`, `groupColor` TEXT notNull;
      `startsAt`, `endsAt`, `exportedAt` TEXT notNull (UTC ISO-8601); `location`,
      `description` TEXT (nullable); `allDay` `integer({ mode: "boolean" }).notNull()`;
      `teachers`, `tags` TEXT notNull (JSON); `fields` TEXT (nullable JSON); `type` TEXT
      notNull (EventTypeEnum value, verbatim — NOT a checked enum); `userCalendarId` TEXT
      notNull. Add the verbatim-mirror + importer-fidelity doc comment (mirror the
      `personalEvents`/`userCalendars` comments; cite ADR 021, the `type`-not-in-toDbMap
      note, and the soft-`userCalendarId`-no-FK note).

## 2. The third migration — generated + committed (D1)

- [x] Run `npm run generate:migrations` in `mobile/` (`drizzle-kit generate`, driver
      expo). Commit `src/db/migrations/0002_*.sql`, the third `meta/_journal.json` entry,
      `0002_snapshot.json`, and the updated `migrations.js` (now importing `m0000`/`m0001`/
      `m0002`). Confirm `migrations.d.ts` is unchanged (stable across regenerations).
- [x] Verify `0002_*.sql` is `CREATE TABLE calendar_events (…)` with the expected columns
      (allDay/visible-style integer, all TEXT otherwise).

## 3. The `@/db` seam re-export (D1)

- [x] In `mobile/src/db/index.ts` re-export `calendarEvents` from `./schema` (alongside
      `personalEvents`, `userCalendars`). No new operator — `gte`/`lte`/`and`/`eq` are
      already re-exported.

## 4. The sync `data/` layer — mappers (D2/D3, 90%-gated)

- [x] `mobile/src/features/calendar/data/sync/types.ts`: `CalendarEventRow` aliases; pure
      `rowToCalendarEvent` / `calendarEventToRow` mapping to the EXISTING `CalendarEvent`
      domain type (import from `../types`). Dates → canonical UTC `toISOString()`;
      `teachers`/`tags`/`fields` JSON encode (`JSON.stringify`) / **defensive** decode
      (try/catch → `[]` / `null` — never throw); `tags` decodes to `EventTag[]` then
      projects to the domain `tags: string[]` (tag names); `canceled` derived from
      `fields?.canceled ?? false`; null↔undefined; boolean `allDay`.
- [x] `fromCalendarEventDto(dto: CalendarEventForPublic, userCalendarId: string)` — the
      ONLY generated-DTO import in the layer (B-1), mirroring Flutter `fromApi`.
- [x] `data/sync/types.test.ts`: round-trip; importer-fidelity verbatim; canonical-UTC
      normalization; JSON round-trip + **corrupt-JSON → safe default** (no throw);
      null/boolean; DTO mapper with parent id. 90% gate.

## 5. The sync `data/` layer — repository (D3, 90%-gated)

- [x] `data/sync/repository.ts`: `findInRange(from, to)` (overlap query
      `and(lte(calendarEvents.startsAt, to.toISOString()), gte(calendarEvents.endsAt, from.toISOString()))`,
      mapped via `rowToCalendarEvent`); `replaceAll(events)` **transactional** —
      `db.transaction(async (tx) => { await tx.delete(calendarEvents); /* chunked bulk
      insert (~500 rows) of calendarEventToRow(...) */ })`. No class — a module of
      functions, mirroring user-calendars `repository.ts`. Imports `{ db, calendarEvents,
      and, gte, lte }` from `@/db` only.
- [x] `data/sync/repository.test.ts`: `jest.mock("@/db")` with a query-builder /
      transaction spy — assert `findInRange` issues the expected query shape and
      `replaceAll` deletes-then-inserts INSIDE a single `transaction` callback. 90% gate.

## 6. The sync `data/` layer — reactive read hook (D3)

- [x] `data/sync/hooks.ts`: `useSyncedEvents(range): CalendarEvent[]` over the seam's
      `useLiveQuery(db.select().from(calendarEvents))`, mapped + range-filtered in a
      `useMemo` (mirror `useUserCalendars` + the existing range-filter in `events.ts`).
- [x] `data/sync/hooks.test.ts`: the hook reflects the live rows (mock `@/db`'s
      `useLiveQuery`). (Hook covered under the logic glob.)

## 7. The sync orchestrator (D4/D6, 90%-gated)

- [x] `data/sync/sync.ts`: `useSyncCalendars()` returning `{ sync, isSyncing, isError,
      reset }`. Wraps `useCalendarSyncControllerSyncCalendars` (the ONLY generated-hook
      import site, B-1) over `customFetch`; reads tokens via the user-calendars
      `findAll()` (`@/features/calendar-sources/data/user-calendars` barrel path); empty
      → no-op (no request). On success: flatten
      `result.flatMap(c => c.events.map(e => fromCalendarEventDto(e, c.calendar.id)))` →
      `replaceAll`. **Observability split (D6):** a fetch rejection → `isError` only (NOT
      recordError); a `replaceAll` throw → `recordError(error, "calendar/sync")` + `isError`.
- [x] `data/sync/sync.test.tsx`: mock `src/api/mutator`, drive the REAL generated mutation
      + real `QueryClient` (mirror `add-calendar.test.tsx`). Assert: success → `replaceAll`
      with flattened+mapped events; no-tokens → no request; fetch-failure → `isError`, NO
      `recordError`; replace-failure → `recordError`. 90% gate.

## 8. The data/ sub-barrel + restart-simulation (D3)

- [x] `data/sync/index.ts` — the sub-barrel (re-export the public surface: `useSyncedEvents`,
      `useSyncCalendars`, `findInRange`, `replaceAll`, the mappers as needed).
- [x] `data/sync/restart.test.ts` — a stateful Map-backed `@/db` fake; a `replaceAll`
      then a freshly-required repository module reads the rows back (mirror the
      user-calendars `restart.test.ts` write-then-read-back contract). 90% gate.

## 9. Swap the events-source seam (D4/D7)

- [x] `data/events.ts`: `useCalendarEvents(range)` returns `useSyncedEvents(range)` merged
      with `usePersonalEvents()` (mapped via the existing `personalToCalendarEvent`),
      range-filtered. REMOVE `denseWeekFixture()` from the default merge. Keep the
      signature, the `DateRange` export, and the `CalendarEvent` shape unchanged.
- [x] Confirm `data/index.ts` still exports `denseWeekFixture` (now dev/test-only) and add
      the new `data/sync` surface to the feature barrel as needed (no cycle: `sync/` imports
      `../types`, never the feature barrel).
- [x] Verify NO change is needed in `ui/calendar-screen.tsx` or `ui/agenda-list.tsx` for
      the source swap (the seam absorbed it) — only the pull-to-refresh wiring (task 10).
- [x] Update/extend `data/events.test.ts` for the new source (mock `useSyncedEvents` +
      `usePersonalEvents`); assert the fixture is no longer in the default result.

## 10. Calendar screen — pull-to-refresh + sync status (D5, 70% floor)

- [x] `ui/calendar-screen.tsx`: wire `useSyncCalendars()`; add a `RefreshControl` (on the
      agenda `SectionList` and a scroll wrapper for the grid view) calling `sync()`; an
      accessible refreshing state; on failure an accessible sync-error + retry (polite live
      region + status role + a labeled retry control). Screen stays presentational. Brand
      surface (R-3): refresh tint from `@/theme` `primary`.
- [x] `ui/calendar-screen.test.tsx`: extend — mock `useSyncCalendars` + the synced source;
      assert the refresh control triggers `sync()` and the error+retry state renders
      accessibly. (70% floor; the synced-event render is the existing wiring.)

## 11. Startup sync trigger (D5)

- [x] Add a fire-and-forget startup sync: a small `useStartupSync()` (or a once-effect in
      the calendar screen's first mount / `src/app/_layout.tsx`) firing `void sync()` once.
      Offline-safe (silent at launch). Keep it consistent with the `void runMigrations()` /
      `import "@/i18n"` startup posture; respect feature-boundary B-3/B-4 (the root layout
      may not import `@/db` data — go through the feature `data/` hook).

## 12. i18n (FR + EN)

- [x] New flat keys in `src/i18n/locales/{en,fr}.json` (both complete — tsc parity): e.g.
      `calendar.sync.refreshing`, `calendar.sync.error`, `calendar.sync.retry`,
      `calendar.sync.retryLabel`, `calendar.sync.refreshingLabel`. No hardcoded strings.

## 13. Architecture Book + ADR + docs (R-1)

- [x] `.claude/rules/mobile/storage.md`: add a "Calendar events store — `calendar_events`"
      section (the third table; the schema, the JSON columns + defensive mappers, the
      transactional drop+replace, the third migration, what CI proves vs. on-device) —
      mirror the `user_calendars` section; cite ADR 021.
- [x] `.claude/rules/mobile/calendar.md`: update the "events-source seam" + "Deferred"
      sections — calendar sync LANDED (the source swap, sync triggers, the fixture now
      dev/test-only, the FlashList/perf trigger now reachable on real synced data).
- [x] `.claude/rules/mobile/features.md`: extend the Calendar feature entry with the sync
      sublayer + observability split.
- [x] Write `.claude/rules/mobile/decisions/021-calendar-event-storage-and-sync.md` (copy
      `TEMPLATE.md`): the `calendar_events` verbatim schema + TEXT-ISO dates (building on
      ADR 011/018), the JSON-columns-as-defensive-mapper decision (D2, the new wrinkle),
      the drop+replace transactional sync strategy, the `type`-stored-verbatim note, and
      the recoverable-fetch vs. crash-worthy-write observability split (D6). Add row 021 to
      `decisions/README.md` index.
- [x] Append a `2026-06-16 · add-mobile-calendar-sync` entry to
      `.claude/rules/mobile/architecture-changelog.md` (newest last).

## 14. Maestro (note the seeded-data limitation)

- [x] Inspect `ci/e2e-server.sh` / the seed for a `user_calendars` token reachable by deep
      link with synced events. IF a seeded token + synced events are reachable: extend
      `.maestro/calendar.yaml` to assert a synced event renders (ideally offline-after-sync).
      IF NOT: keep render + reachability + the dev/fixture-seed assertion and record the
      limitation in `calendar.md` (no new server-seeding work this ship). Default to the
      latter.
- [ ] This is a runtime-heavy ship — run Maestro locally (`mobile/e2e/run_e2e.sh`) before
      marking E2E done. (HUMAN: needs a release-config dev-variant build on a device +
      JDK17/ANDROID_HOME; the real synced render is the on-device pass —
      `inbox/2026-06-16-calendar-sync-on-device.md`. The flow itself was updated for the
      seeded-data limitation; `.maestro/calendar.yaml` asserts render + reachability.)

## 15. Human handoff (inbox)

- [x] `docs/react-native-migration/inbox/2026-06-16-calendar-sync-on-device.md` — the
      on-device manual proofs CI can't do: (a) **real synced data renders** (a real device
      with a real `user_calendars` token), (b) **offline read** (airplane mode after a
      sync → timetable still renders), (c) **drop+replace atomicity / no half-empty table**
      after a kill mid-sync, (d) the **low-end-Android frame-rate / Reassure baseline on
      real synced data** (extend the existing `inbox/2026-06-16-calendar-low-end-android-perf.md`
      scope), (e) Crashlytics arrival for a forced `replaceAll` failure. State what/why/how
      to verify. Mark any task depending on these `(HUMAN: see inbox/<file>)`.

## 16. Local verification (run in `mobile/`)

- [x] `npx tsc --noEmit` clean.
- [x] `npm run lint` (`--max-warnings 0`) clean — feature-boundary B-1..B-4 hold (the
      `@/db` + generated-hook imports stay in `data/`).
- [x] `npm test -- --coverage` green; the `data/sync/**` logic clears the 90% gate, global
      ≥ 70%, and `migrate.test.ts` passes applying all three migrations.
- [x] `npm run generate:migrations` produces no diff (the committed bundle is current).
- [x] `openspec validate add-mobile-calendar-sync` passes.
