# Calendar sync: real synced events into a durable `calendar_events` table behind the unchanged events-source seam

## Why

Phase 04 item 3 — **Sync + offline cache**. The calendar today renders a committed
**dense-week fixture** merged with the local personal-events read
(`mobile/src/features/calendar/data/events.ts` `useCalendarEvents(range)`). The
day/week timeline and the agenda view both consume that seam and were
**deliberately designed to absorb a source swap** without any consumer change
(`calendar.md`: "The later calendar-sync ship swaps the source here … the swap is
this one file"). This change is that swap: the calendar must render **real data**.

It is the **third real Drizzle table** (after `personal_events` and `user_calendars`)
and the **second device-local sync surface** — the events a user actually sees come
from `POST /calendars/sync { tokens }` over the durable subscription tokens Phase 03
made durable (`user_calendars`). It is a **Phase-09 migration target**: the schema
mirrors the Flutter `CalendarEvent.toDbMap()` wire format **verbatim** so the one-shot
importer can write recovered `calendar_events` rows with no data loss — the exact
posture [ADR 011](../../../.claude/rules/mobile/decisions/011-personal-event-storage.md)
and [ADR 018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md)
established. It also introduces the **drop+replace sync strategy** and the **first
JSON-array/object columns** (teachers/tags/fields) — both load-bearing and reused, so
they earn a new ADR (021).

The Flutter sync flow (`app/lib/modules/calendar/services/calendar_sync_service.dart`
+ `repositories/calendar_event_repository.dart`, read for parity): load
`user_calendars` → if empty, return → `POST /calendars/sync { tokens }` (BATCH, all
tokens in one call) → flatten `calendars.flatMap(c => c.events)` (attach the parent
`userCalendarId`) → **DROP all `calendar_events` rows then insert all flattened
events** → read back → views filter client-side. Offline: read from the local table;
the drop+replace runs **only on a successful fetch**, so a failed sync leaves the
last-good rows intact.

## What Changes

- **A third Drizzle table `calendarEvents` (SQL `calendar_events`)** mirroring the
  Flutter `CalendarEvent.toDbMap()` + the server `CalendarEventForPublic` DTO verbatim:
  `uid` TEXT PK, `title`, `color`/`groupColor` (`#RRGGBB`), `startsAt`/`endsAt` UTC
  ISO-8601 TEXT, nullable `location`, `allDay` boolean, nullable `description`,
  `teachers`/`tags`/`fields` as JSON TEXT columns, `exportedAt` UTC ISO-8601 TEXT,
  `type` (EventTypeEnum) TEXT, and `userCalendarId` TEXT (the parent calendar id).
- **A third committed migration** (`0002_*.sql` + a `_journal.json` entry +
  `0002_snapshot.json` + an updated `migrations.js`) via `drizzle-kit generate` driver
  `expo`. The runner applies all three; `migrate.test.ts` still passes.
- **The `@/db` seam** re-exports `calendarEvents` (no new operator — `gte`/`lte`/`and`
  already exist for the range query).
- **A `calendar/data/sync/` sub-module:** the `CalendarEventRow`↔domain mappers +
  `fromCalendarEventDto` (canonical UTC, JSON encode/decode, null↔undefined), a
  transactional `replaceAll(events)` (atomic DROP + bulk-insert), a `findInRange(from,
  to)` range read, a `useSyncedEvents(range)` reactive `useLiveQuery` read, and a
  `useSyncCalendars()` orchestrator (read tokens from the existing user-calendars hook
  → batch `POST /calendars/sync` over `customFetch` → map DTO→rows → `replaceAll`).
- **`useCalendarEvents(range)` swaps its source** to the synced rows merged with the
  personal-events read — same signature, same `CalendarEvent` shape, **no consumer
  change**. The dense-week fixture becomes **dev/test-only** (no longer in the default
  runtime merge).
- **Sync triggers:** fire-and-forget at app startup (mirroring `void runMigrations()`)
  and **pull-to-refresh** on the calendar screen, with an accessible refreshing /
  sync-error / retry surface.
- **A new ADR 021** (calendar-events storage schema + JSON columns + drop+replace
  sync strategy + the recoverable-error observability posture).

## Capabilities

### New Capabilities

- **mobile-calendar-sync** — synced server calendar events persisted durably in a
  `calendar_events` table (importer-targetable), fed to the calendar views through the
  unchanged events-source seam, with offline reads and a recoverable sync-error
  surface.

### Modified Capabilities

- **mobile-calendar** (timeline + agenda) — `useCalendarEvents(range)` now sources
  synced rows + personal events instead of the fixture; the calendar screen gains
  pull-to-refresh + a sync status surface. No `CalendarEvent` shape change.
- **mobile-storage** — a third table + migration in the `@/db` seam.

## Impact

- `mobile/src/db/schema.ts`, `mobile/src/db/index.ts`, `mobile/src/db/migrations/**`.
- `mobile/src/features/calendar/data/{events.ts,sync/**,index.ts,fixtures.ts}`.
- `mobile/src/features/calendar/ui/calendar-screen.tsx` (pull-to-refresh + sync status).
- `mobile/src/app/_layout.tsx` (startup sync trigger).
- `mobile/src/i18n/locales/{en,fr}.json` (sync refresh/error/retry strings).
- `mobile/jest/setup-db.ts` (extend the `@/db` mock for the new query/transaction shape
  used by repository tests, mirroring user-calendars' local `jest.mock("@/db")`).
- `.claude/rules/mobile/{storage.md,calendar.md,features.md,architecture-changelog.md}`
  + ADR 021 + the ADR README index.
- `mobile/.maestro/calendar.yaml` (note the seeded-data limitation; keep render +
  reachability + a fixture/dev-seeded assertion as feasible).
