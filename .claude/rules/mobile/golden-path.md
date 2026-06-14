# Golden-path exemplar — TimeCalendar mobile

One of the [five living artifacts](./architecture.md#the-five-living-artifacts).
**This is the blessed reference, extracted in Phase 1.5 from the three landed
pattern-establishment features** — Settings, Personal events, School selection
([ADR 004](./decisions/004-phase-1-feature-order.md) order). It is *earned, not
declared* (migration-approach §4, philosophy principle 5): the shape below is what
the three deliberately-varied features actually converged on, not a Phase-0 guess.

> **R-1 pointer style.** This file does not re-derive the features' code — it points
> at the real files. Every pointer must resolve; a move/rename is a one-line fix here.
> The decision record is [ADR 014](./decisions/014-layered-feature-module-pattern.md);
> this file is the *how-to*.

## Why the exemplar is organized by axis (not one "reference feature")

The three features stress **different architectural axes** — no single one exercises
local-KV *and* device-CRUD *and* server-read. Blessing one as "the" reference would
force the other two axes into footnotes and mislead a new feature whose axis differs.
So the exemplar names the **canonical landed feature per axis**, then documents the
**common spine** all three share once.

| Axis | Canonical feature | Where it lives |
| --- | --- | --- |
| Local key-value + native controls + i18n | **Settings** | `mobile/src/features/settings/prefs/` + `mobile/src/components/settings-screen.tsx` |
| Structured device-local CRUD + multi-field form + write error path | **Personal events** | `mobile/src/features/personal-events/{data,form}/` + `mobile/src/components/{personal-events-list,personal-event-form-screen}.tsx` |
| Server read + offline cache + nested navigation | **School selection** | `mobile/src/features/school-selection/{data,store}/` + `mobile/src/components/onboarding/` |

When you start a feature, find the row whose axis is closest to yours and copy *that*
feature's layer for the parts unique to it; copy the common spine below for the rest.

## The common spine (shared by all three)

### Feature-module folder shape — `src/features/<feature>/<layer>/`

A feature's logic lives under `src/features/<feature>/`, split into the **sublayers
its axis needs** — a feature adds only the ones it uses (the set is open, not fixed):

- **`data/`** — the data/query/repository seam. The **only** place a feature touches
  the generated Orval hooks or the `@/db` seam. See `school-selection/data/queries.ts`
  (the only generated-hook import site) and `personal-events/data/repository.ts` (the
  only `@/db` import site).
- **`store/`** — a persisted-state seam over `@/storage`: total, defensively-validated
  reads; flat namespaced keys; one imperative write path; the reactive read in a
  `hooks.ts`. See `settings/prefs/store.ts` and `school-selection/store/store.ts`.
- **`form/`** — pure form logic (validation, build, save/delete/load hooks over the
  feature's `data/`). See `personal-events/form/`.

Settings has only the prefs store; School selection has `data/` + `store/`; Personal
events has `data/` + `form/` (its `data/` *is* the store analog — persistence is the
SQLite table, not MMKV).

The blessing decision and the open sublayer set are
[ADR 014](./decisions/014-layered-feature-module-pattern.md).

### Barrel discipline (no cycle)

Each sublayer has an `index.ts` re-exporting its public surface; a **feature-level**
`index.ts` re-exports the sublayers. **Sublayers never import the feature barrel** —
when a sublayer needs a sibling, it imports the sibling's *sub-barrel* directly. The
graph stays a DAG. This no-self-barrel-cycle rule is **CI-enforced** as boundary B-2
(`eslint-plugin-boundaries`, TIM-135 — see the Architecture Book "Lint & format →
Feature-module boundaries").

- Feature barrels: `mobile/src/features/personal-events/index.ts` (its comment states
  "No cycle: form/* imports the data sub-barrel directly … never this file"),
  `mobile/src/features/school-selection/index.ts` (same note).
- Sub-barrels: `mobile/src/features/school-selection/data/index.ts`,
  `mobile/src/features/school-selection/store/index.ts`,
  `mobile/src/features/personal-events/data/index.ts`,
  `mobile/src/features/personal-events/form/index.ts`,
  `mobile/src/features/settings/prefs/index.ts`.

### Seam conventions

- **`data/` is the only generated-hook / `@/db` import site.** Screens consume the
  **feature barrel only**, never `@/api/generated/*`, `@/db`, or `react-native-mmkv`
  directly. References: `school-selection/data/queries.ts` (wraps the generated
  `useSchoolControllerFindSchools` / `useSchoolGroupControllerFindSchoolGroups` over
  the single `mobile/src/api/mutator.ts` `customFetch`, maps DTOs → small domain
  shapes), `personal-events/data/repository.ts` (the only importer of
  `mobile/src/db/index.ts`). This boundary is **now CI-enforced** by
  `eslint-plugin-boundaries` (TIM-135, `add-mobile-feature-boundaries-lint` — B-1/B-3 in
  the `timecalendar/feature-boundaries` block of `mobile/eslint.config.js`); the ADR-014
  debt is paid.
- **The store is total + defensively-validated over `@/storage`, one write path.** A
  bad/unset/legacy value parses to a safe default, never throws; writes go through one
  imperative path, the reactive read through a `hooks.ts` over the seam's reactive read
  (`useStoredString` in `mobile/src/storage/index.ts`). References:
  `settings/prefs/store.ts` (total `parseThemePreference`/`parseLanguagePreference`),
  `school-selection/store/store.ts` + `school-selection/store/types.ts` (total
  `parseSchoolId`/`parseGroupValues`).
- **Mappers at the row↔domain edge.** The data layer maps storage/DTO rows to small
  domain shapes so consumers never touch the wire/row format. References:
  `personal-events/data/types.ts` (`rowToEvent`/`eventToRow`, normalizing to canonical
  UTC), `school-selection/data/types.ts` (the DTO → `SchoolListItem`/`SchoolGroupNode`
  projections).

### Presentational screen in `src/components/` + thin route in `src/app/`

The route-structure rule (Architecture Book "Navigation & route structure"): a screen
that needs a test is a presentational module under `src/components/`, and the route
under `src/app/` is a one-line re-export. References:

- `mobile/src/app/settings.tsx` (thin route) → `mobile/src/components/settings-screen.tsx`.
- `mobile/src/app/personal-event-form.tsx` → `mobile/src/components/personal-event-form-screen.tsx`.
- `mobile/src/app/onboarding/{index,groups}.tsx` (thin entrypoints under a nested
  `mobile/src/app/onboarding/_layout.tsx` `Stack`) → `mobile/src/components/onboarding/`.

Non-tab routes register as a `<Stack.Screen>` **sibling of `(tabs)`** in
`mobile/src/app/_layout.tsx` (a bare sibling under the native tabs is unreachable).

### Coverage split (90% logic / 70% presentation)

Logic sublayers (`data/`/`store/`/`form/`, under the `src/features/**` glob) are
90%-gated; presentational screens (`src/components/**`) are under the 70% floor. See
[ADR 003](./decisions/003-coverage-threshold.md) and `mobile/jest.config.js`.

### Screen / test / e2e skeleton shape

- **Component test** — colocated `*.test.tsx`, renders through the **real** theme +
  i18n trees and asserts **localized text, not keys** (and drives the control → hook
  wiring). Mock at the `customFetch` mutator seam, never the network. References:
  `mobile/src/components/settings-screen.test.tsx`,
  `mobile/src/components/onboarding/school-picker-screen.test.tsx`,
  `mobile/src/components/personal-event-form-screen.test.tsx`.
- **Maestro flow** — a real round-trip, deep-linked, asserting seeded data. References:
  `mobile/.maestro/settings.yaml` (render + reachability),
  `mobile/.maestro/personal-events.yaml` (create→list→delete CRUD round-trip),
  `mobile/.maestro/onboarding.yaml` (the live `GET /schools` round-trip).

### i18n / a11y call-site conventions

- **Flat typed i18n keys, FR + EN parity** (`tsc`-typed both directions). Validation
  and pure logic return **localizable keys, not sentences** — the screen maps them to
  `t()`. Reference: `personal-events/form/validate.ts` (returns
  `"personalEvents.form.error.titleRequired"` etc.). (Architecture Book "i18n".)
- **Accessible loading/error live regions + touchable roles+labels.** Async status
  carries a polite live region + status role; every touchable declares a role +
  translated label + a ≥44pt/48dp hit area. References:
  `mobile/src/components/onboarding/school-picker-screen.tsx` (accessible
  loading/error-with-retry/empty states), `mobile/src/components/settings-screen.tsx`
  and its Profile entry link. (Architecture Book "Accessibility".)

## Starting a new feature (the copy-this checklist)

A new feature can be started by copying the **skeleton template tree** at
[`docs/react-native-migration/02-pattern-establishment/golden-path-template/`](../../../docs/react-native-migration/02-pattern-establishment/golden-path-template/).
It lives **outside `mobile/src/`** on purpose (so Metro doesn't bundle it, the route
harness doesn't walk it, and the coverage harness doesn't count it — design D2); its
files carry a `.ts.txt` / `.tsx.txt` suffix so they are never compiled, bundled, or
linted-as-source. The mechanism is a documented convention + the existing tsc/lint/
coverage gates — **not** a code generator (R-2; see deferred debt below).

Ordered steps:

1. **Copy** the template tree's files into your feature's home:
   `golden-path-template/feature/` → `mobile/src/features/<feature>/`,
   `golden-path-template/components/` → `mobile/src/components/`,
   `golden-path-template/app/` → `mobile/src/app/`.
2. **Drop the `.txt` suffix** (`types.ts.txt` → `types.ts`, `feature-screen.tsx.txt` →
   `<feature>-screen.tsx`, etc.) and rename `feature`/`<feature>` to your feature name.
3. **Keep only the sublayers your axis needs** (`data/` / `store/` / `form/`) — copy
   the canonical feature's layer (table above) for the axis-specific parts.
4. **Wire FR + EN keys** for every user-facing string (flat keys, both catalogs —
   `tsc` parity fails otherwise).
5. **Register the route** in `mobile/src/app/_layout.tsx` as a `<Stack.Screen>` sibling
   of `(tabs)` (the route-structure rule).
6. **Add a Maestro flow** under `mobile/.maestro/` for the happy path.
7. **Run the gates** in `mobile/`: `npx tsc --noEmit`, `npm run lint`, `npm test`. The
   existing gates catch copy mistakes (a missing key, a 0%-covered stub, a wrong import
   boundary) immediately — they are the safety net the lightest mechanism relies on.

### Deferred debt — a scaffolding generator

A code generator / scaffolding CLI (plop, hygen, a custom script) was **deliberately
not built** (R-2 / design D2): heavy tooling the repo's posture rejects, and from a
sample of three features the "right" generated shape isn't stable enough to freeze into
codegen. **Trigger to revisit:** hand-copy friction becomes real (the feature count
grows) **and** the shape has stopped evolving.

## The closest real references

These *are* the blessed set now (no longer "no reference yet"):

- **`mobile/src/features/school-selection/data/queries.ts`** — the data/query seam:
  generated hook → `customFetch` → NestJS, mapped to domain shapes, the only
  generated-hook import site.
- **`mobile/src/features/settings/prefs/store.ts`** + **`school-selection/store/store.ts`**
  — the total, validated, one-write-path store posture.
- **`mobile/src/features/personal-events/form/validate.ts`** — pure logic returning
  localizable keys.
- **`mobile/src/components/onboarding/school-picker-screen.test.tsx`** — the reference
  component test (mock at the mutator seam, real hook + `QueryClient`, assert localized
  text).
- **`mobile/.maestro/onboarding.yaml`** + **`mobile/e2e/`** — the real-round-trip e2e shape.
- The Architecture Book sections "School selection", "Settings preferences", "Storage →
  First feature schema — personal events", "Data layer", "Navigation & route structure",
  "i18n", "Accessibility" — the rules these features embody.
