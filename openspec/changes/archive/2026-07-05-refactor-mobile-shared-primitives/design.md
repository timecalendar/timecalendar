# Design — Consolidate duplicated storage/db primitives (TIM-155)

## Context

TIM-155 is a child of the TIM-151 RN app technical-state review, which named **horizontal
duplication** as the app's dominant flaw. This change consolidates four families of copied
storage/db glue that grew feature-by-feature. It is a **pure refactor** — every replacement
reproduces the existing behavior exactly. The load-bearing invariant is the app's
**defensive/total-parser posture**: hidden events, personal events, and checklist items are
**irreplaceable, no-server-backup** local data (the Phase-09 importer set), so a corrupt or
absent stored value must decode to the safe empty default and **never throw**. Consolidating
the copies MUST NOT weaken that by one branch.

The discovery is done (see the proposal's Impact list); this document records the load-bearing
placement/design decisions and the exact behavior-equivalence obligations, so a reviewer can
confirm "no behavior change" mechanically rather than by re-reading every site.

## Goals / Non-Goals

**Goals.** One uid generator on the `@/db` seam. Shared total JSON-array parsing +
reactive parsed read on the `@/storage` seam. Four pure row↔domain mapper primitives on the
`@/db` seam. Delete the copies; point the call sites at the shared surface. Preserve every
behavior verbatim. Keep the PR small and reviewable.

**Non-Goals.** No behavior change, no new dependency, no schema/migration/query change, no
native/EAS-fingerprint change. **No generic mapper factory** and **no generic object/record
parser** (both are speculative — the four mapper primitives and the array parser are the units
that are actually duplicated today; R-2). `decodeFields` (the calendar sync **object** parser)
and `dtoToRow`'s DTO string re-canonicalization are explicitly left as-is. No change to
`parseHiddenEvents`'s bespoke record-shape parsing (only its `isStringArray` dependency is
shared), and no change to `parseSchoolId` (a string test, not an array parse). No touching of
the `personal_events` / `user_calendars` / `checklist_items` / `calendar_events` schemas.

## Decision: the uid generator lives on `@/db` as `newId`, not on `@/storage` and not per-feature

Three byte-identical `randomUUID()` wrappers exist. The Architecture Book already frames each
as "the single, swappable import site" — the only defect is that it is *per feature*, so the
seam is duplicated, and there is a naming drift (`newEventId` vs `newId`).

- **Seam = `@/db`.** Every uid is the **primary-key identity of a Drizzle row**
  (`personal_events.uid`, `user_calendars.id`, `checklist_items.uuid`). It belongs to the
  relational store's seam, alongside the tables and operators the `@/db` index already
  re-exports — not `@/storage` (KV blobs) and not a feature. `expo-crypto` is **not**
  lint-banned outside a seam (only `react-native-mmkv`/`expo-sqlite`/`drizzle-orm` are), so
  `src/db/id.ts` importing it is consistent with the deleted wrappers — no new lint edge.
- **Canonical name = `newId`** (two of three copies already use it; `newEventId` is the
  outlier). The generator is event-agnostic (it makes calendar-source ids and checklist uuids
  too), so `newId` is the right name.
- **Alternatives rejected.** (a) *A shared `@/storage` `newId`* — wrong seam; a uid is a
  relational-row identity, not a KV value. (b) *A single feature owning it and the others
  importing across features* — a cross-feature `data → data` edge for a pure primitive, when a
  seam is the natural home. (c) *Keep three copies* — the duplication this ticket exists to
  kill.

**Behavior-equivalence obligation.** `newId` is `randomUUID()`, identical to all three copies.
The one folded test mocks `expo-crypto` and proves single delegation (replacing three
near-identical tests). Consumers move from a feature import to `@/db`; the calendar-sources
`newId` (no invoker — verified: only its own test + barrels referenced it) is dropped entirely.

## Decision: the KV-blob parse primitives + the reactive parsed read live on `@/storage`

The three total JSON-array parsers and the three `parser(useStoredString(KEY))` pairings all
operate on **KV values read through the MMKV seam**. Their home is `@/storage` (`src/storage/
index.ts`), next to `useStoredString` — not a feature, and not `@/db` (these are KV blobs, not
SQLite rows). This is the R-2 "a consumer arrived three times" promotion.

`parseJsonArray<T>(raw, guard?)` MUST reproduce **all three** current behaviors exactly, which
differ only in whether they pass an element guard:

| Current site | Behavior `parseJsonArray` must match |
| --- | --- |
| `parseGroupValues` (school-selection) | undefined → `[]`; JSON.parse in try/catch → `[]`; not-array → `[]`; not-all-strings → `[]`; else the array. **Guard = `isStringArray`.** |
| `parseHiddenEvents` two fields (hidden-events) | each field validated by `isStringArray`; non-string-array → `[]`. **The shared `isStringArray` replaces the local one; the record-shape parse stays bespoke.** |
| `decodeJsonArray<T>` (calendar sync) | undefined-impossible (input is `string`, non-optional); JSON.parse in try/catch → `[]`; not-array → `[]`; **casts `as T[]` with NO element guard.** So the two call sites pass **no guard** — preserving the exact guardless cast. |

The signature is `parseJsonArray<T>(raw: string | undefined, guard?: (v: unknown) => v is T): T[]`.
The `raw: string | undefined` widens `decodeJsonArray`'s `string` input harmlessly (the
calendar sync columns are notNull, so `raw` is always a string there — the undefined branch is
simply never reached, no behavior change). `isStringArray(value): value is string[]` is exported
so `parseGroupValues` and `parseHiddenEvents` can pass it as the guard.

`useParsedStoredString<T>(key, parser) = parser(useStoredString(key))` is a one-liner living
next to `useStoredString`. It is **read-only** (writes stay imperative — the seam's one-write-
path posture). School selection's `useSelectedSchool` combines two reads then branches on
`schoolId === undefined`; **that branch logic stays** — only each `parseX(useStoredString(K))`
becomes `useParsedStoredString(K, parseX)`. Hooks-rules: both the old and new form call
`useStoredString` unconditionally at the top level of the calling hook, so `useParsedStoredString`
(which calls `useStoredString` once, unconditionally) is a faithful mechanical substitution.

**Alternatives rejected.** (a) *A generic record/object parser too* — `parseHiddenEvents`'s
record shape and `decodeFields`'s object shape are one-off; no duplication to collapse (R-2,
out of scope). (b) *Folding `parseSchoolId` in* — it is a non-empty-string test, not an array
parse; unrelated.

## Decision: four pure mapper primitives on `@/db` — no generic mapper factory

Four data layers hand-roll the same field conversions. Consolidate exactly four **pure**
primitives into a new `src/db/mappers.ts` (re-exported from `src/db/index.ts` — the same seam
as the tables they map):

- `isoToDate(iso: string): Date` = `new Date(iso)`
- `dateToIso(date: Date): string` = `date.toISOString()`
- `nullToUndef<T>(value: T | null): T | undefined` = `value ?? undefined`
- `undefToNull<T>(value: T | undefined): T | null` = `value ?? null`

**Why primitives, not a factory.** A generic `makeMapper(schema)` would be speculative
machinery for four hand-written mappers with genuinely different field sets and one
nullable-date branch (checklists). The primitives are the actually-duplicated unit; the mappers
stay explicit and readable. R-2.

**The readability guardrail (load-bearing for "no behavior change" + review sanity).** Apply the
primitives **only** where the domain field is a **real Date** (`isoToDate`/`dateToIso`) or a
genuine **null↔undefined passthrough** (`nullToUndef`/`undefToNull`). Do **NOT** force them
into:

- `dtoToRow`'s `new Date(dto.startsAt).toISOString()` — this is a DTO **string→string
  re-canonicalization** (parse-then-serialize to force canonical UTC), not a Date-typed field;
  wrapping it in `dateToIso(isoToDate(...))` would obscure intent and is out of scope.
- `checklistItemToRow` / `rowToChecklistItem` nullable dates — these keep their explicit
  `=== null ? undefined : isoToDate(row.x)` / `=== undefined ? null : dateToIso(item.x)` branch;
  the primitive supplies only the non-null conversion inside the branch (the null test is not a
  `?? ` passthrough, so `nullToUndef` does not apply to the whole expression).

Per-site application (verified against the current source):

| Mapper | Primitives applied |
| --- | --- |
| `personal-events` `rowToEvent` | `isoToDate` ×3 (startsAt/endsAt/exportedAt), `nullToUndef` ×2 (location/description) |
| `personal-events` `eventToRow` | `dateToIso` ×3, `undefToNull` ×2 |
| `user-calendars` `rowToCalendar` | `isoToDate` ×2 (lastUpdatedAt/createdAt), `nullToUndef` ×2 (schoolName/schoolId) |
| `user-calendars` `calendarToRow` | `dateToIso` ×2, `undefToNull` ×2 |
| `user-calendars` `fromCalendarForPublic` | `isoToDate` ×2 (DTO dates), `nullToUndef` ×2 (schoolName/schoolId) |
| `event-checklists` `rowToChecklistItem` | `isoToDate` ×3 **inside** the `=== null ? undefined :` branch |
| `event-checklists` `checklistItemToRow` | `dateToIso` ×3 **inside** the `=== undefined ? null :` branch |
| `calendar/sync` `rowToCalendarEvent` | `isoToDate` ×2 (startsAt/endsAt), `nullToUndef` ×2 (location/description) |

`fromCalendarForPublic`'s DTO dates ARE real `Date` conversions (`new Date(dto.lastUpdatedAt)`),
so `isoToDate` applies — distinct from `dtoToRow`'s string re-canonicalization.

**Behavior-equivalence obligation.** Each primitive is a mechanical alias of the exact
expression it replaces (`new Date(x)` ≡ `isoToDate(x)`; `x.toISOString()` ≡ `dateToIso(x)`;
`x ?? undefined` ≡ `nullToUndef(x)`; `x ?? null` ≡ `undefToNull(x)`). The four existing mapper
test suites are unchanged and must stay green (the strongest no-behavior-change proof). A new
`mappers.test.ts` proves the four primitives directly.

## Risks / Trade-offs

- **A silent behavior change hiding in a "mechanical" swap** — mitigated by (a) the four
  existing mapper test suites + the school-selection / hidden-events / calendar-sync parser
  tests staying **unchanged and green** (they are the behavior oracle), (b) the guardless-cast
  and nullable-date obligations spelled out above so a reviewer diffs against them, and (c)
  `tsc` catching any type drift in the shared generics.
- **Test-mock churn.** `personal-events/form/build.test.ts` and
  `personal-event-form-screen.test.tsx` mock `newEventId` on the data barrel; the
  `event-checklists/data/hooks.test.ts` mocks `./id`. These mocks must move to mock `newId`
  from `@/db` (or the local import path they now use). This is the one place the "pure
  refactor" touches tests — called out in tasks so the implementer expects it.
- **Scope creep** toward "consolidate all the parsers/mappers." Explicitly bounded: object/
  record parsers, the mapper factory, `parseSchoolId`, and `dtoToRow` string
  re-canonicalization are all out.

## Migration / Rollout

Single PR, suggested **3-commit split** (each independently green — `tsc` + lint + test):
(1) 4.1 uid consolidation, (2) 4.2 parse primitives + reactive parsed read, (3) 4.2 mapper
primitives. Book + changelog land with the commit that introduces the surface they document
(or the final commit). No feature flag, no data migration — the on-disk format is untouched.
