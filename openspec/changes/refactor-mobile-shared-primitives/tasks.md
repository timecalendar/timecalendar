# Tasks — Consolidate duplicated storage/db primitives (TIM-155)

Apply-ready, ordered. **Pure refactor — no behavior change anywhere.** All commands run from
`mobile/`. The defensive/total-parser posture (undefined/non-JSON/wrong-shape → empty default,
never throws) MUST be preserved **verbatim** at every site. Keep the PR small: a suggested
**3-commit split** — (1) §1 uid, (2) §2 parse + reactive read, (3) §3 mappers — each
independently green (`npx tsc --noEmit` + `npm run lint` + `npm test`). §4 docs + §5
verification land with the commit that introduces the surface they cover (or the final commit).

> Verified file-path corrections from discovery (apply as written): (a) the `newId` re-export
> is dropped from **both** `event-checklists/data/index.ts` **and** the
> `event-checklists/index.ts` feature barrel; (b) the calendar-sources `newId` has **no
> invoker** (only its own test + barrels) — safe to drop; (c) three test files mock the moved
> uid wrapper and must be updated (§1); (d) `parseJsonArray`'s `raw` param is
> `string | undefined` — this harmlessly widens the calendar-sync `decodeJsonArray(string)`
> input (those columns are notNull, so the undefined branch is never reached — no behavior
> change).

## 1. uid consolidation — one `@/db` `newId` (commit 1)

- [x] Create `mobile/src/db/id.ts`: `export function newId(): string { return randomUUID() }`
  importing `randomUUID` from `expo-crypto`; a header comment stating it is **the single,
  swappable uid seam** for all device-local record identities (personal events, calendar
  sources, checklists) and the Phase-09 importer bypasses it by supplying its own recovered id.
- [x] Create `mobile/src/db/id.test.ts` folding the three near-identical wrapper tests into
  **one**: `jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }))`, prove `newId()`
  returns the mocked value and delegates to `randomUUID` exactly once.
- [x] Re-export `newId` from `mobile/src/db/index.ts` (next to the tables/operators surface),
  with a one-line comment that it is the seam's single uid generator.
- [x] Delete the three copies and their tests: `mobile/src/features/personal-events/data/uid.ts`
  (+ `uid.test.ts`), `mobile/src/features/calendar-sources/data/user-calendars/id.ts`
  (+ `id.test.ts`), `mobile/src/features/event-checklists/data/id.ts` (+ `id.test.ts`).
- [x] Update call sites to reach `newId` (see deviation note):
  - `mobile/src/features/personal-events/form/build.ts` — `newEventId()` → `newId()`. Deviation
    from the literal "import from `@/db`": `form/` may not import `@/db` (B-1), so `newId` is
    re-exported from the `@/features/personal-events/data` barrel and `build.ts` imports it from
    there (name change `newEventId` → `newId`); comment updated.
  - `mobile/src/features/event-checklists/data/hooks.ts` — `newId()` now imported from `@/db`
    (remove `import { newId } from "./id"`; `@/db` is already imported in this file — add
    `newId` to that import).
- [x] Drop the now-dead barrel re-exports:
  - `mobile/src/features/personal-events/data/index.ts` — the `./uid` re-export is replaced by
    `export { newId } from "@/db"` (data/ may import `@/db`, B-1 — see the build.ts deviation above).
  - `mobile/src/features/event-checklists/data/index.ts` — remove `export { newId } from "./id"`.
  - `mobile/src/features/event-checklists/index.ts` — remove `newId` from the `./data` re-export list.
  - `mobile/src/features/calendar-sources/data/user-calendars/index.ts` — remove `export { newId } from "./id"`.
  - `mobile/src/features/calendar-sources/data/index.ts` — remove `newId` from the
    `./user-calendars` re-export list.
- [x] Update the tests that mock the moved wrapper (the one place this refactor touches tests):
  - `mobile/src/features/personal-events/form/build.test.ts` — it imports + mocks `newEventId`
    from `@/features/personal-events/data`; switch to mocking `newId` from `@/db` (the module
    `build.ts` now calls) and rename the `mockNewEventId` local.
  - `mobile/src/features/personal-events/ui/personal-event-form-screen.test.tsx` — same barrel
    `newEventId` mock → mock `newId` from `@/db`.
  - `mobile/src/features/event-checklists/data/hooks.test.ts` — it does
    `jest.mock("./id", () => ({ newId: jest.fn() }))`; switch to mocking `newId` from `@/db`
    (mind the existing `@/db` mock in that file, if any — merge, do not clobber the table/op mocks).
- [x] `npx tsc --noEmit` + `npm run lint` + `npm test` green (commit 1).

## 2. Parse primitives + reactive parsed read — on `@/storage` (commit 2)

- [x] In `mobile/src/storage/index.ts` add (with comments matching the file's house style):
  - `export function isStringArray(value: unknown): value is string[]` =
    `Array.isArray(value) && value.every((v) => typeof v === "string")`.
  - `parseJsonArray<T>` — **signature deviation**: the guard is a WHOLE-ARRAY guard
    `guard?: (v: unknown) => v is T[]`, not the literal per-element `v is T`. `isStringArray`
    is `v is string[]` (a whole-array guard), so `parsed.every(guard)` (per-element) would be
    type- and semantics-wrong (it would require each element to itself be a `string[]`). With
    the whole-array form, `parseJsonArray(raw, isStringArray)` correctly infers `T = string`
    and the body checks `guard(parsed)`. Behavior is identical to the three prior parsers.
    `raw === undefined` → `[]`; `JSON.parse` try/catch → `[]`; not `Array.isArray` → `[]`;
    guard supplied and `!guard(parsed)` → `[]`; else `return parsed as T[]` (guardless = the
    `decodeJsonArray` cast without element validation).
  - `export function useParsedStoredString<T>(key: string, parser: (raw: string | undefined) => T): T`
    = `parser(useStoredString(key))`, placed **next to** `useStoredString`, read-only, with a
    comment mirroring the existing reactive-read block.
- [x] Add colocated tests in `mobile/src/storage/` proving: `parseJsonArray` for undefined /
  non-JSON / non-array / guard-fail → `[]`, guarded happy path, and **guardless** cast happy
  path; `isStringArray` true/false; `useParsedStoredString` applies the parser to the reactive
  read (driven through the real MMKV in-memory seam + `await act`, mirroring the hooks tests).
- [x] Reuse in `mobile/src/features/hidden-events/data/types.ts`: delete the local
  `isStringArray`, import it from `@/storage`, use it on the two record fields inside
  `parseHiddenEvents`. **`parseHiddenEvents`'s bespoke record-shape parsing stays unchanged.**
  (The `hidden-events/data/restart.test.ts` `@/storage` fake gains `isStringArray` — a forced
  mock update, same category as the §1 uid mocks; real impl, behavior verbatim.)
- [x] Reuse in `mobile/src/features/school-selection/store/types.ts`: `parseGroupValues` body
  becomes `return parseJsonArray(raw, isStringArray)` (import both from `@/storage`). Same total
  behavior: undefined / non-JSON / non-string-array → `[]`.
- [x] Reuse in `mobile/src/features/calendar/data/sync/types.ts`: delete the local
  `decodeJsonArray<T>`, import `parseJsonArray` from `@/storage`, and at its two call sites use
  `parseJsonArray<EventTag>(row.tags)` and `parseJsonArray<string>(row.teachers)` — **pass NO
  guard** (preserving the exact guardless cast). **Leave `decodeFields` (the object parser)
  entirely untouched** — out of scope. **Extra consumer (discovery gap):**
  `calendar/data/event-details.ts` also imported `decodeJsonArray` (teachers + tags) — repointed
  to guardless `parseJsonArray` too (it is in `calendar/data/`, so `@/storage` is allowed).
- [x] Reuse the reactive parsed read (swap each `parseX(useStoredString(K))` pair for
  `useParsedStoredString(K, parseX)`):
  - `mobile/src/features/settings/prefs/hooks.ts` — theme (`parseThemePreference`) + language
    (`parseLanguagePreference`) reads.
  - `mobile/src/features/school-selection/store/hooks.ts` — schoolId (`parseSchoolId`) +
    groupValues (`parseGroupValues`) reads. **Keep** the combine-then-`if (schoolId ===
    undefined) return undefined` branch logic exactly — only swap each read pair.
  - `mobile/src/features/hidden-events/data/hooks.ts` — the `useHiddenEvents` read
    (`parseHiddenEvents(useStoredString(HIDDEN_EVENTS_KEYS.set))`).
- [x] Confirm the school-selection / hidden-events / calendar-sync parser test suites stay green
  **unchanged** (they are the no-behavior-change oracle — restart.test.ts's `@/storage` fake is
  the one forced mock update, noted above). `npx tsc --noEmit` + `npm run lint` + `npm test`
  green (commit 2).

## 3. Mapper primitives — on `@/db` (commit 3)

- [x] Create `mobile/src/db/mappers.ts` with exactly four pure helpers (NO generic factory), a
  header comment framing them as the shared row↔domain glue for the TEXT-ISO / nullable SQLite
  format:
  - `export function isoToDate(iso: string): Date { return new Date(iso) }`
  - `export function dateToIso(date: Date): string { return date.toISOString() }`
  - `export function nullToUndef<T>(value: T | null): T | undefined { return value ?? undefined }`
  - `export function undefToNull<T>(value: T | undefined): T | null { return value ?? null }`
- [x] Re-export the four from `mobile/src/db/index.ts`.
- [x] Create `mobile/src/db/mappers.test.ts` proving each primitive (Date round-trip, null→undef,
  undef→null, and the alias equivalences).
- [x] Reuse in the four mappers **only where a field is a real Date or a null/undef
  passthrough** (keep readability — see the per-site table in `design.md`):
  - `mobile/src/features/personal-events/data/types.ts` — `rowToEvent` (`isoToDate` ×3,
    `nullToUndef` ×2); `eventToRow` (`dateToIso` ×3, `undefToNull` ×2).
  - `mobile/src/features/calendar-sources/data/user-calendars/types.ts` — `rowToCalendar`
    (`isoToDate` ×2, `nullToUndef` ×2); `calendarToRow` (`dateToIso` ×2, `undefToNull` ×2);
    `fromCalendarForPublic` (`isoToDate` ×2 for the DTO dates, `nullToUndef` ×2). **Note:**
    `fromCalendarForPublic`'s `new Date(dto.…)` IS a real Date conversion → `isoToDate` applies
    (distinct from `dtoToRow`'s string re-canonicalization, which stays out).
  - `mobile/src/features/event-checklists/data/types.ts` — NULLABLE dates: `rowToChecklistItem`
    keeps `row.x === null ? undefined : isoToDate(row.x)` (×3); `checklistItemToRow` keeps
    `item.x === undefined ? null : dateToIso(item.x)` (×3). The primitive supplies only the
    non-null conversion inside the branch.
  - `mobile/src/features/calendar/data/sync/types.ts` — `rowToCalendarEvent` (`isoToDate` for
    startsAt/endsAt, `nullToUndef` for location/description). **Do NOT touch `dtoToRow`'s
    `new Date(x).toISOString()`** — that is a DTO string re-canonicalization, out of scope.
- [x] Confirm the four existing mapper test suites (`personal-events`, `user-calendars`,
  `event-checklists`, `calendar/sync`) stay green **unchanged** — they are the strongest
  no-behavior-change proof. `npx tsc --noEmit` + `npm run lint` + `npm test` green (commit 3).
  **Forced mock update (same category as the §1 uid mocks):** the nine suites that `jest.mock("@/db")`
  with a query-builder/live-query fake (personal-events repository+hooks, user-calendars
  repository+hooks+restart, event-checklists repository+restart, calendar/sync hooks+restart) now
  spread `...jest.requireActual("@/db/mappers")` into their factory — the mappers reach the seam
  primitives, and `@/db/mappers` is pure (no native deps) so the real impls keep behavior verbatim.
  The four dedicated mapper unit suites (`types.test.ts`) mock nothing and stay untouched.

## 4. Architecture Book + changelog (R-1 — binding-rules repo)

- [x] Update `docs/mobile/architecture-book/storage.md` — document the new **shared seam
  surface**: (a) the single `@/db` `newId()` uid generator (replace the per-feature "single
  swappable import site" phrasing at the personal-events / user-calendars / event-checklists
  entries with a pointer to the shared `@/db` `newId`); (b) the `@/storage` `isStringArray` +
  total `parseJsonArray` + `useParsedStoredString` (the reactive-reads bullet already lists
  `useStoredString`/`useStoredBoolean`/`useStoredNumber` — add `useParsedStoredString` there,
  and add a "shared KV-blob parsing" note); (c) the four `@/db` `mappers.ts` primitives (the
  shared row↔domain glue). Keep it R-1 pointer-style; reference the relevant ADRs the seam docs
  already cite (011/018/021/023/024/027) where the shared helper now serves them.
- [x] Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md` (date ·
  slug `refactor-mobile-shared-primitives` · what moved: three uid wrappers → `@/db` `newId`,
  KV-blob parsing + reactive parsed read → `@/storage`, four mapper primitives → `@/db` ·
  why: horizontal-duplication cleanup, R-2 · pointer → storage.md; pure refactor, no behavior
  change, no rule change). This is a consolidation, not a rule change, so **no new ADR** is
  required (the placement decisions are recorded in this change's `design.md` — lift only if a
  reviewer flags one as ADR-worthy).

## 5. Local verification + CI proof + DoD

- [x] `npx tsc --noEmit` clean in `mobile/`.
- [x] `npm run lint` clean (`--max-warnings 0`) in `mobile/`.
- [x] `npm test` green in `mobile/` (517 passed / 81 suites); `npm test -- --coverage` still clears
  the K-3 gate (`src/db/id.ts`, `src/db/mappers.ts`, and `src/storage/index.ts` all 100%; the
  deleted per-feature wrapper tests are replaced by the folded `db/id.test.ts`).
- [ ] **CI proof (R-1): the existing `test-mobile` job is the runtime proof.** No NEW CI proof
  test is needed beyond the unit tests above — this change adds no runtime behavior; its
  correctness IS "the pre-existing mapper/parser/reactive-read test suites stay green unchanged"
  plus the new seam-primitive unit tests. Confirm the full `test-mobile` job (tsc, lint,
  Jest+coverage) is green in CI on the branch. *(Local tsc + lint + Jest+coverage all green;
  CI confirmation is post-push, on the reviewer/conductor.)*
- [x] Run the DoD checklist (`docs/mobile/architecture-book/definition-of-done.md`): every axis
  ✅ or ➖+reason. **No behavior change** — Observability / i18n / a11y / Performance axes are
  ➖ (untouched by a pure refactor); Tests ✅ (suites green unchanged + new primitive tests);
  Architecture Book ✅ (§4).
