# Calendar identity persistence: durable `user_calendars` token storage (importer-targetable)

## Why

Phase 3 ship 5 of 5 — **Identity persistence**. This is the **load-bearing ship**:
the calendar-subscription **token IS the user's identity**, and there is **no server
backup** of a user's calendar set. A lossy or non-durable store loses the user's
calendars permanently.

Ships 3 (QR scan) and 4 (iCal import) currently hand a successfully-added calendar
into an **EPHEMERAL in-memory holder**
(`mobile/src/features/calendar-sources/data/scanned-source.ts`) — a module-scoped
`useSyncExternalStore` that is gone on app restart, process kill, or JS-cache clear.
Both ship-3 and ship-4 comments say so verbatim: "the seam **ship 5 swaps** for the
durable token store." This change is that swap. After it lands, a scanned/imported
calendar **survives app restart, process kill, and JS-cache clear**.

It is the **first table ADDED** to the Drizzle store since `personal_events`, and it is
a **Phase-09 migration target**: the schema mirrors the Flutter `user_calendars` sembast
wire format **verbatim** so the one-shot importer can write the recovered
`user_calendars` rows (carrying the irreplaceable `token`) with **no data loss** — the
exact posture [ADR 011](../../../.claude/rules/mobile/decisions/011-personal-event-storage.md)
established for `personal_events`. The migration-research doc names
`user_calendars.token` as the **single most critical, irreplaceable** sembast field
([data-persistence-migration.md §2/§3.2](../../../docs/react-native-migration/00-exploration/data-persistence-migration.md)).

This change ships the **durable data layer + the wiring of ships 3/4's success paths
into it** — the schema, the second real migration, the repository/mappers/reactive read,
the persist-on-add wiring, and the tests (centrally, the persistence/round-trip proof).
It does **not** ship a "your calendars" management screen, calendar-event sync, a
visibility toggle UI, or the Phase-09 importer itself — those are later ships (see
Non-Goals in design.md).

## What Changes

- **A new `userCalendars` Drizzle table** (`mobile/src/db/schema.ts`, SQL table
  `user_calendars`) whose columns mirror the Flutter `UserCalendar.toDbMap()` wire format
  **verbatim** (the sembast `user_calendars` store): `id` TEXT primary key (the sembast
  **record key** / upsert identity — verified against the Flutter repo + the §3.2 device
  dump), `token` TEXT not-null (the irreplaceable subscription identity), `name` TEXT
  not-null, nullable `schoolName` / `schoolId` TEXT, `lastUpdatedAt` / `createdAt` TEXT
  not-null holding UTC ISO-8601 strings, `visible` INTEGER (boolean, default 1). The
  `@/db` seam re-exports `userCalendars`.
- **The second real Drizzle migration** — `npm run generate:migrations` emits a new
  `000N_*.sql` (`CREATE TABLE user_calendars …`), advances `meta/_journal.json`, and
  updates `migrations.js`; all committed. The startup runner applies it unchanged.
- **The data layer** — `mobile/src/features/calendar-sources/data/user-calendars/`:
  domain `UserCalendar` type + pure `rowToCalendar` / `calendarToRow` mappers (isolating
  the TEXT-ISO + boolean wire format, normalizing dates to canonical UTC), a repository
  over `@/db` (`findAll`, `getById`, `getByToken`, `upsert` by `id` mirroring the Flutter
  `put`, `remove`, `setVisible`), a `fromCalendarForPublic` mapper (the server DTO → a
  domain calendar, mirroring Flutter's `UserCalendar.fromCalendarForPublic`), a `newId()`
  uid wrapper over `expo-crypto`, and a reactive `useUserCalendars()` hook over the seam's
  `useLiveQuery`.
- **Ships 3/4 success paths persist through the repository** — a successful QR scan and a
  successful iCal create now **resolve the token to its `CalendarForPublic` metadata**
  (`GET /calendars/by-token/{token}`) and **`upsert`** a durable `userCalendars` row,
  replacing the ephemeral `setScannedSource` handoff. A failed persist is recorded
  through `@/firebase` `recordError` (writes CAN fail). The ephemeral holder is removed.
- **Observability + tests** — repository proven against the mocked `@/db` seam (query
  shape + mapping), mappers proven (round-trip, importer-fidelity verbatim, canonical-UTC
  normalization, boolean + null handling), a **restart-simulation** test (a fresh
  repository read returns what a prior write persisted, within the harness's mock-db
  capabilities), the migrate proof test still green against the now-two-migration bundle,
  and a **Maestro restart-durability assertion** where reliably driveable (else inboxed).
- **Rules updated** — a new `user_calendars` schema section in
  [storage.md](../../../.claude/rules/mobile/storage.md) (mirroring the personal-events
  section), [features.md](../../../.claude/rules/mobile/features.md) (calendar-sources
  durable layer), **[ADR 018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md)**
  (the MMKV-vs-Drizzle decision + the verbatim-schema-for-importer-fidelity decision), the
  ADR index, and the [architecture-changelog](../../../.claude/rules/mobile/architecture-changelog.md).
  Roadmap step 5 ticked.

## Impact

- **Affected specs:** `mobile-calendar-identity-persistence` (new).
- **Affected code:** `mobile/src/db/schema.ts` (+`user_calendars` table),
  `mobile/src/db/index.ts` (re-export), `mobile/src/db/migrations/**` (new migration),
  `mobile/src/features/calendar-sources/data/**` (new `user-calendars/` sublayer module;
  `scanned-source.ts` removed; `create.ts` and the QR/iCal screens rewired to persist),
  the calendar-sources barrels, i18n catalogs (FR+EN) if any new UI string is needed,
  `mobile/.maestro/` (a restart flow if driveable). No new dependency (`expo-crypto`,
  `expo-sqlite`, `drizzle-orm`, the generated calendars client already exist).
- **Native:** none — `user_calendars` is a new SQLite table under the existing seam; no
  config plugin, no `app.config.ts` change (the migration materializes on the next launch).
- **Risk:** token-correctness is the user's identity (mitigated by the verbatim schema,
  pure tested mappers, the persistence-round-trip + restart tests, and the on-device
  Maestro/manual restart proof). Rollback is a plain revert (additive table; a fresh DB
  simply lacks the table until the migration re-runs).
