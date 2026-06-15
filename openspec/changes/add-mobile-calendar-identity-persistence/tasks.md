# Tasks — Calendar identity persistence (durable `user_calendars` token storage)

All paths under `mobile/`. Run the gates (`npx tsc --noEmit`, `npm run lint`, `npm test`)
in `mobile/`. Mirror `add-mobile-personal-events-data` (ADR 011) throughout — it is the
template (schema → migration → repository → mappers → reactive hook → tests).

## 1. The `userCalendars` Drizzle table (`src/db/schema.ts`)

- [ ] 1.1 Add a `userCalendars` `sqliteTable` (SQL table name `user_calendars`, the sembast
  store name verbatim) to `src/db/schema.ts`, alongside `personalEvents`. Columns mirror the
  Flutter `UserCalendar.toDbMap()` wire format VERBATIM (design D2 / ADR 018):
  `id: text("id").primaryKey()` (the sembast record key = upsert identity — **not** the token),
  `token: text("token").notNull()` (the irreplaceable subscription identity),
  `name: text("name").notNull()`, `schoolName: text("school_name")` (nullable),
  `schoolId: text("school_id")` (nullable), `lastUpdatedAt: text("last_updated_at").notNull()`,
  `createdAt: text("created_at").notNull()` (UTC ISO-8601 strings, ADR 011/D4 posture),
  `visible: integer("visible", { mode: "boolean" }).notNull().default(true)`. Add a header
  comment mirroring the `personalEvents` one (the importer-fidelity rationale + the `id`-is-the-
  record-key, `token`-is-the-identity-field, dates-TEXT-ISO points). No `any`.

## 2. Generate + commit the second real migration

- [ ] 2.1 Run `npm run generate:migrations` in `mobile/`. Confirm it emits a new
  `src/db/migrations/0001_*.sql` (`CREATE TABLE user_calendars …`), a second
  `src/db/migrations/meta/_journal.json` entry, a `src/db/migrations/meta/0001_snapshot.json`,
  and an updated `src/db/migrations/migrations.js` (now importing `m0000` + `m0001` and exporting
  both). **Commit all generated files** (fresh-clone-no-codegen rule).
- [ ] 2.2 Confirm `src/db/migrations/migrations.d.ts` still types the regenerated bundle (stable
  across regenerations — the storage-doc note). Adjust only if the generated shape changed.
- [ ] 2.3 Run `npm test` and confirm `src/db/migrate.test.ts` **still passes** unchanged (it
  asserts the runner drives `migrate(db, migrations)` with the committed bundle regardless of
  entry count).

## 3. The `@/db` seam re-export (`src/db/index.ts`)

- [ ] 3.1 Re-export the `userCalendars` table from `src/db/index.ts` (`export { personalEvents,
  userCalendars } from "./schema"`). Do NOT add any new drizzle operator — `eq` is already
  re-exported and is the only operator the repository needs (R-2: re-export only what's needed).

## 4. The durable data layer (`src/features/calendar-sources/data/user-calendars/`)

- [ ] 4.1 `types.ts` — the domain `UserCalendar` type (`id`, `token`, `name`,
  `schoolName: string | undefined`, `schoolId: string | undefined`, `lastUpdatedAt: Date`,
  `createdAt: Date`, `visible: boolean`) over `typeof userCalendars.$inferSelect/$inferInsert`,
  plus the PURE mappers (design D5): `rowToCalendar` (TEXT ISO → `Date`; null
  `school_name`/`school_id` → `undefined`; `visible` already boolean via Drizzle mode),
  `calendarToRow` (`Date` → canonical UTC ISO via `toISOString()`; `undefined` → `null`),
  and `fromCalendarForPublic(dto: CalendarForPublic)` (the server DTO → domain mapper mirroring
  Flutter's `UserCalendar.fromCalendarForPublic`: DTO `schoolName: string | null` → `undefined`,
  dates parsed to `Date`, `visible: true`). `CalendarForPublic` is imported from
  `@/api/generated/...schemas` — **this is the only generated-type import in the layer** and it
  lives in `data/` (B-1). No `db` import in this file (pure).
- [ ] 4.2 `id.ts` — `newId()` over `expo-crypto`'s `randomUUID` (the single import site,
  swappable; mirrors `personal-events/data/uid.ts`). The importer bypasses it by supplying its
  own recovered id to `upsert`.
- [ ] 4.3 `repository.ts` — async CRUD over `@/db` (imports `{ db, userCalendars, eq }` only;
  never `drizzle-orm`/`expo-sqlite`): `findAll`, `getById(id)`, `getByToken(token)` (via
  `eq(userCalendars.token, token)`), `upsert(calendar)` (`insert … onConflictDoUpdate({ target:
  userCalendars.id, set: row })` mirroring the Flutter `record(id).put`; accepts a caller-
  supplied id), `remove(id)`, `setVisible(id, visible)` (an UPDATE of the one column). Map rows↔
  domain via the pure mappers.
- [ ] 4.4 `hooks.ts` — `useUserCalendars()` over `useLiveQuery(db.select().from(userCalendars))`
  (re-exported from `@/db`, never a direct `drizzle-orm` import), mapping live rows → domain.
- [ ] 4.5 `add-calendar.ts` — the SHARED persist seam (design D6): `addCalendarFromUrl(url)` (or
  a hook wrapping the existing `useCreateCalendar`) that `POST /calendars { url }` → `{ token }`
  → `GET /calendars/by-token/{token}` (`calendarControllerFindCalendarByToken`, already
  generated) → `fromCalendarForPublic` → `upsert`. On failure, throw/return a result the screen
  records via `@/firebase` and surfaces. This is the one persistence code path both QR and iCal
  use. (Keep the generated-hook usage in `data/` — B-1.)
- [ ] 4.6 `index.ts` — the `user-calendars` sub-module barrel re-exporting the public surface
  (`UserCalendar`, the mappers, `newId`, the repository functions, `useUserCalendars`,
  `addCalendarFromUrl`).

## 5. Rewire ships 3/4 to persist; remove the ephemeral holder

- [ ] 5.1 Delete `src/features/calendar-sources/data/scanned-source.ts` and its test
  `scanned-source.test.ts`. Remove `setScannedSource` / `getScannedSource` /
  `clearScannedSource` / `useScannedSource` / `ScannedCalendarSource` from the `data/` sub-barrel
  (`data/index.ts`) and the feature barrel (`index.ts`); re-export the new `user-calendars`
  surface instead. (Keep `ScannedCalendarSource` only if the pure QR parser still needs the
  `{ url }` shape — if so, keep the *type* in `types.ts` but drop the holder functions.)
- [ ] 5.2 `ui/qr-scan-screen.tsx` — on a successful parse, call `addCalendarFromUrl(source.url)`
  (await/`.then`) instead of `setScannedSource`; on success dismiss; on failure call
  `recordError` (already imported) and surface the existing `failed` a11y alert. Update the
  screen's header comment (the ephemeral-holder reference is now the durable store).
- [ ] 5.3 `ui/ical-url-screen.tsx` — replace the `setScannedSource({ url })` success branch with
  the durable persist: on create success the create+persist seam (`addCalendarFromUrl`) upserts
  the row; on success dismiss; the existing server-error/retry a11y states cover the failure (and
  `recordError` is already wired). Update the header comment.
- [ ] 5.4 Update any onboarding screen that read `useScannedSource` (the "calendar added"
  indicator) to read the durable `useUserCalendars()` reactive hook (or simply dismiss on
  success). Grep for `useScannedSource` / `setScannedSource` to find all call sites; none may
  remain.

## 6. i18n (FR + EN parity — `tsc`-enforced both directions)

- [ ] 6.1 Add any new user-facing string the persist-failure path needs (e.g.
  `calendarSources.persist.failure`) to BOTH `src/i18n/locales/en.json` and `fr.json` (flat keys,
  both catalogs — `tsc` parity fails otherwise). Reuse existing QR/iCal failure keys where the
  message is equivalent; only add a key if genuinely new. If no new string is needed, record that
  (DoD i18n axis ➖ N/A + reason in the change notes).

## 7. Tests (persistence is central — design D9)

- [ ] 7.1 `data/user-calendars/types.test.ts` — the mappers: round-trip (domain → row → domain,
  all fields equal, dates canonical UTC, `visible` preserved, null `schoolName`/`schoolId` →
  absent), **importer-fidelity verbatim** (a `toDbMap()`-shaped row reads back with no value
  change), `fromCalendarForPublic` (DTO → domain field copy, DTO `schoolName: null` → undefined,
  `visible: true`).
- [ ] 7.2 `data/user-calendars/id.test.ts` — `newId()` delegates to the mocked
  `expo-crypto.randomUUID`.
- [ ] 7.3 `data/user-calendars/repository.test.ts` — each function's Drizzle query SHAPE +
  mapping against the **mocked `@/db` seam** (the `jest.mock("@/db")` chainable query-builder
  spy, the personal-events pattern): `upsert` → `onConflictDoUpdate({ target: userCalendars.id })`
  with the mapped row; `getByToken` → `eq(userCalendars.token, …)`; `getById`/`remove`/
  `setVisible` by id; `findAll` maps all rows.
- [ ] 7.4 `data/user-calendars/restart.test.ts` (the central durability proof) — drive the
  repository against a **stateful in-memory mock `@/db`** (a Map-backed fake honoring
  `insert/onConflictDoUpdate/select/where/delete`), write a calendar, then read it back through a
  fresh repository import / re-created handle, asserting the row survives — the write-then-read-
  back contract. Comment that on-disk SQLite materialization is on-device (Maestro/manual), CI
  proves the contract.
- [ ] 7.5 `data/user-calendars/add-calendar.test.ts` — the persist wiring: success (mock the
  `customFetch` mutator seam + the repository → `POST` then `GET by-token` then `upsert` called
  with the mapped DTO) and **failure** (resolve/upsert throws → the caller records via
  `recordError`; assert the error path). Mock at the mutator seam, never the network
  (testing.md).
- [ ] 7.6 Update the rewired screen tests (`ui/qr-scan-screen.test.tsx`,
  `ui/ical-url-screen.test.tsx`) for the new persist call (mock `addCalendarFromUrl` / the
  repository + the mutator); assert success dismisses and failure surfaces the a11y alert +
  records. Remove assertions tied to the deleted ephemeral holder.
- [ ] 7.7 Run `npm test -- --coverage`; the new logic paths (`src/db/**`,
  `src/features/calendar-sources/data/**`) clear the K-3 90% lines/branches gate; the rewired
  screens stay on the 70% floor. Gate lands GREEN.

## 8. E2E — Maestro restart durability (or inbox the manual pass)

- [ ] 8.1 Determine whether a durable calendar is reliably assertable after `stopApp` /
  `launchApp` on both platforms given no list UI ships here (an onboarding "1 calendar added"
  indicator from the reactive read is the candidate target).
- [ ] 8.2 IF a stable target exists: add `mobile/.maestro/calendar-persistence.yaml` — add a
  calendar (existing onboarding flow / deep link), `stopApp`, `launchApp`, assert the calendar is
  still present (seeded-text assertion). Mirror the existing `.maestro/*.yaml` shape.
- [ ] 8.3 IF NOT: write an inbox note `docs/react-native-migration/inbox/<date>-calendar-restart-durability.md`
  (what/why/how-to-verify the manual restart, kill, and JS-cache-clear durability pass on iOS +
  Android) and mark this task `(HUMAN: see inbox/<file>)`. Exactly one of 8.2 / 8.3 must land
  (no silently-skipped E2E axis).

## 9. Architecture Book + ADR + roadmap

- [ ] 9.1 Write **ADR 018** `.claude/rules/mobile/decisions/018-user-calendar-storage.md` (copy
  `TEMPLATE.md`): the MMKV-vs-Drizzle decision (Drizzle wins — relational identity + Phase-09
  migration target + free durability; MMKV rejected as a flat-KV hack for relational identity,
  genuinely weighed per design D1) AND the verbatim-`toDbMap()`-schema decision for importer
  fidelity (mirroring ADR 011), the `id`-is-the-record-key / `token`-is-the-identity-field
  finding, dates-as-TEXT-ISO, and the server-DTO mapper. Context / Decision (alternatives) /
  Consequences / Revisit-if. Reference ADR 011 as the precedent.
- [ ] 9.2 Add the ADR 018 row to `.claude/rules/mobile/decisions/README.md` index.
- [ ] 9.3 Add a `user_calendars` schema section to `.claude/rules/mobile/storage.md` (mirroring
  the personal-events schema section): the table + verbatim wire format, the `data/user-calendars`
  layer, the importer-fidelity property, the second migration, what CI proves (mappers/repository/
  restart-sim) vs. on-device (Maestro/manual restart), pointer to ADR 018.
- [ ] 9.4 Update `.claude/rules/mobile/features.md` — the calendar-sources entry: the durable
  `user-calendars` layer, the persist-on-add wiring, observability ✅ (the first calendar-sources
  write that can fail), the ephemeral holder removed.
- [ ] 9.5 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (date · change-slug
  · what moved · why · pointer).
- [ ] 9.6 Tick step 5 in `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`.

## 10. Verify

- [ ] 10.1 `npx tsc --noEmit` clean; `npm run lint` (`--max-warnings 0`) clean; `npm test --
  --coverage` green with the K-3 gate satisfied.
- [ ] 10.2 `openspec validate add-mobile-calendar-identity-persistence --strict` passes.
- [ ] 10.3 Confirm no `useScannedSource` / `setScannedSource` / `scanned-source` references
  remain (grep clean) — the ephemeral holder is fully removed.
