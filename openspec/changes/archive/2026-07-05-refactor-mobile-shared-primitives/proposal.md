# Consolidate duplicated storage/db primitives into the `@/storage` + `@/db` seams — one uid generator, shared total JSON-array parsing + reactive parsed reads, and four pure row↔domain mapper helpers — a pure no-behavior-change refactor preserving the defensive/total-parser posture verbatim

## Why

TIM-155 (the RN app technical-state review, TIM-151) named **horizontal duplication** as
the dominant flaw of the `mobile/` code. The storage/db layers grew feature-by-feature (A1
Settings → B1 Personal events → C1 School selection → Ship A Hidden events → Ship B Event
checklists → the calendar sync store), and each feature independently re-invented the same
three primitives:

- **A uid generator.** Three **byte-identical** `randomUUID()` wrappers exist —
  `personal-events/data/uid.ts` (`newEventId`), `calendar-sources/data/user-calendars/id.ts`
  (`newId`), `event-checklists/data/id.ts` (`newId`) — plus a naming drift (`newEventId` vs
  `newId`). This is exactly the kind of trivially-shareable seam the Architecture Book's
  storage section already frames as "the single, swappable import site" per feature; there is
  no reason it is *per feature* rather than *the seam's*.
- **A total JSON-array parser.** `school-selection/store` (`parseGroupValues`),
  `hidden-events/data` (`parseHiddenEvents`, via a local `isStringArray`), and
  `calendar/data/sync` (`decodeJsonArray<T>`) each re-implement the same defensive
  try/catch → `[]` posture with subtly different call shapes.
- **A reactive parsed read.** Settings prefs, School selection, and Hidden events each write
  the same `parser(useStoredString(KEY))` pairing by hand.
- **Row↔domain mapper glue.** Four data layers hand-roll the same `new Date(iso)` /
  `date.toISOString()` / `?? undefined` / `?? null` field conversions.

None of this is a behavior change; it is the same code, copied. Consolidating it is the R-2
"a consumer arrived — three times" move: promote the primitive to the seam that owns the
concern (`@/storage` for the KV-blob parsing + reactive parsed read, `@/db` for the uid +
the SQLite-row mapper glue), delete the copies, and point the call sites at the shared
surface. The migration philosophy's finite-perfection DoD wants the skeleton *clean* before
it grows; this is that cleanup for the two storage seams.

This is a **pure refactor**. **No behavior changes anywhere.** The defensive/total-parser
posture that guards the app's **irreplaceable, no-server-backup** local data (hidden events,
personal events, checklists — the Phase-09 importer's set) is the load-bearing invariant and
MUST be preserved **verbatim**: every shared helper reproduces the exact undefined / non-JSON
/ wrong-shape → empty-default, never-throws behavior of the code it replaces, and the mapper
primitives are applied **only** where a field is genuinely a Date or a null/undef passthrough
(no re-canonicalization of DTO strings, no readability regressions).

## What Changes

### 4.1 — one uid generator, in the `@/db` seam

- **New `mobile/src/db/id.ts`** exporting `newId(): string` — a thin wrapper over
  `expo-crypto`'s `randomUUID` (the same v4-UUID CSPRNG shape all three copies use), with a
  header comment stating it is **the single uid seam** and the importer bypasses it. Re-export
  `newId` from `mobile/src/db/index.ts` (the seam's public surface, next to the tables +
  operators). New `mobile/src/db/id.test.ts` folding the three near-identical wrapper tests
  into **one** mock-`expo-crypto` single-delegation proof.
- **Delete** the three copies (`.ts` + `.test.ts` each): `personal-events/data/uid.ts`,
  `calendar-sources/data/user-calendars/id.ts`, `event-checklists/data/id.ts`.
- **Point the two call sites at `@/db`:** `personal-events/form/build.ts` (`newEventId()` →
  `newId()` from `@/db`) and `event-checklists/data/hooks.ts` (`newId()` from `./id` →
  `newId()` from `@/db`).
- **Drop the now-dead barrel re-exports:** `personal-events/data/index.ts` (`newEventId`),
  `event-checklists/data/index.ts` **and** the `event-checklists/index.ts` feature barrel
  (`newId`), `calendar-sources/data/user-calendars/index.ts` (`newId`), and remove `newId`
  from the `calendar-sources/data/index.ts` re-export list. The calendar-sources `newId` has
  **no invoker** today (reserved for a future local source — verified: only its own test +
  the barrels referenced it), so dropping it loses nothing.

### 4.2 — shared total JSON-array parsing, reactive parsed read, and mapper glue

- **`@/storage` gains two parse primitives** (`src/storage/index.ts`): `isStringArray` and a
  total `parseJsonArray<T>(raw, guard?)` reproducing all three current behaviors exactly
  (undefined → `[]`; JSON.parse in try/catch → `[]`; non-array → `[]`; guard-fail → `[]`;
  else cast to `T[]`). Reuse in `hidden-events/data/types.ts` (delete its local `isStringArray`,
  use the shared one on the two record fields — `parseHiddenEvents`'s bespoke record-shape
  parsing stays), `school-selection/store/types.ts` (`parseGroupValues` body →
  `return parseJsonArray(raw, isStringArray)`), and `calendar/data/sync/types.ts` (delete
  local `decodeJsonArray<T>`, use `parseJsonArray<T>` **with no guard** at its two call sites —
  preserving the exact guardless cast). `decodeFields` (the object parser) is **out of scope**.
- **`@/storage` gains one reactive parsed read** (`src/storage/index.ts`, next to
  `useStoredString`): `useParsedStoredString<T>(key, parser) = parser(useStoredString(key))`.
  Reuse in Settings prefs (theme + language), School selection (schoolId + groupValues — the
  combine-then-branch logic stays, only each read pair is swapped), and Hidden events
  (`useHiddenEvents`).
- **`@/db` gains four pure mapper helpers** in a **new `mobile/src/db/mappers.ts`**
  (re-exported from `src/db/index.ts`): `isoToDate`, `dateToIso`, `nullToUndef`, `undefToNull`
  — **no generic mapper factory** (R-2: the four primitives are the shareable unit; a factory
  is speculative). New `mobile/src/db/mappers.test.ts`. Reuse in the four row↔domain mappers
  (`personal-events`, `user-calendars`, `event-checklists` with its nullable-date branches,
  `calendar/data/sync` `rowToCalendarEvent`) **only** where a field is a real Date or a
  null/undef passthrough — DTO string→string re-canonicalization (`dtoToRow`'s
  `new Date(x).toISOString()`) is left untouched for readability.

### No behavior change; no new dependency; no native surface

`expo-crypto` is already a dependency and is **not** lint-banned outside a seam (only
`react-native-mmkv` / `expo-sqlite` / `drizzle-orm` are), so `src/db/id.ts` importing it is
consistent with the deleted wrappers. No `app.config.ts` / babel / metro / EAS-fingerprint
change. No schema, migration, or query change.

## Capabilities

### Modified Capabilities

- `mobile-storage`: the spec (which governs **both** the `@/storage` KV seam and the `@/db`
  relational seam) gains requirements **documenting the new shared seam surface** — the single
  `@/db` `newId()` uid generator, the `@/storage` total JSON-array parse primitives, the
  `@/storage` reactive parsed read, and the four `@/db` pure mapper primitives — each with the
  invariant that the shared helper preserves the pre-existing defensive/total behavior
  verbatim. These are ADDED requirements (a refactor documenting the consolidated surface); no
  existing requirement's behavior changes.

## Impact

- **New:** `mobile/src/db/id.ts` (+ `id.test.ts`), `mobile/src/db/mappers.ts`
  (+ `mappers.test.ts`); `mobile/src/db/index.ts` re-exports `newId` + the four mappers.
- **New in `@/storage`:** `isStringArray`, `parseJsonArray`, `useParsedStoredString` in
  `mobile/src/storage/index.ts` (+ their tests colocated in `src/storage/`).
- **Deleted:** `mobile/src/features/personal-events/data/uid.ts` (+`.test.ts`),
  `mobile/src/features/calendar-sources/data/user-calendars/id.ts` (+`.test.ts`),
  `mobile/src/features/event-checklists/data/id.ts` (+`.test.ts`); the local `isStringArray`
  in `hidden-events/data/types.ts` and `decodeJsonArray` in `calendar/data/sync/types.ts`.
- **Modified (call sites + barrels):** `personal-events/form/build.ts`,
  `event-checklists/data/hooks.ts`; the parse reuse sites (`hidden-events/data/types.ts`,
  `school-selection/store/types.ts`, `calendar/data/sync/types.ts`); the reactive-read reuse
  sites (`settings/prefs/hooks.ts`, `school-selection/store/hooks.ts`,
  `hidden-events/data/hooks.ts`); the mapper reuse sites (`personal-events/data/types.ts`,
  `calendar-sources/data/user-calendars/types.ts`, `event-checklists/data/types.ts`,
  `calendar/data/sync/types.ts`); the barrels dropping dead re-exports
  (`personal-events/data/index.ts`, `event-checklists/data/index.ts`,
  `event-checklists/index.ts`, `calendar-sources/data/user-calendars/index.ts`,
  `calendar-sources/data/index.ts`); and the affected feature tests that mock the moved uid
  wrapper (`personal-events/form/build.test.ts`,
  `personal-events/ui/personal-event-form-screen.test.tsx`,
  `event-checklists/data/hooks.test.ts`).
- **Docs:** `docs/mobile/architecture-book/storage.md` (the shared-primitives section on both
  seams' surface) + `docs/mobile/architecture-book/architecture-changelog.md` (dated entry).
- **Native surface:** none. No new dependency, no `app.config.ts`/babel/metro change, no
  EAS-fingerprint bump.
