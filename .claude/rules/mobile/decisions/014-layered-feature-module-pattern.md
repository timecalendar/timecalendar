# 014 — The layered feature-module pattern: `src/features/<feature>/<layer>/` with sublayer + feature barrels and seam boundaries

> Origin: the `harden-mobile-golden-path` change (Phase 1.5 — golden-path extraction),
> design D1/D3/D4. Blesses the cross-feature module pattern earned from the three
> pattern-establishment features. **Generalizes** the folder-shape half of ADR
> [009](./009-settings-feature-prefs.md) (first feature folder, sample of one) — it does
> NOT supersede 009's infra→feature-edge decision, which still stands and owns its own
> revisit. The how-to lives in the golden-path exemplar
> ([`golden-path.md`](../golden-path.md)); this is the decision record.

## Status

Accepted. **⚠️ Revisit fired (2026-06-15, `relocate-feature-screens-to-ui`):** the
open-sublayer-set clause fired — a `ui/` presentation sublayer was added and feature
screens relocated from `src/components/` into `src/features/<feature>/ui/`. See the
updated Decision points 1 & 3 and the Rule changelog.

## Context

ADR [009](./009-settings-feature-prefs.md) recorded the **first** `src/features/` folder
(`settings/prefs/`) with an explicit caveat: *"deliberately thin — one feature's data layer,
not a blessed framework; the exemplar is earned from three features in Phase 1.5, not
declared from one."* That earn-point — Phase 1.5 — is now reached: three deliberately-varied
features ([ADR 004](./004-phase-1-feature-order.md)) have landed and **converged** on the
same module shape:

- **Settings** — `settings/prefs/` (`types.ts` + `store.ts` + `hooks.ts` + `index.ts`).
- **Personal events** — `personal-events/data/` + `personal-events/form/` (two sublayers,
  each with a sub-barrel; a feature-level `index.ts` re-exporting both).
- **School selection** — `school-selection/data/` (query layer) + `school-selection/store/`
  (selection store); two sub-barrels + a feature-level barrel.

The convergence is real and load-bearing: every future feature copies this shape, and reversing
it later ripples across the app (R-4's ADR trigger). The variety across the three (a feature has
the sublayers its *axis* needs — `data/` for a data/query/repository seam, `store/` for persisted
state, `form/` for form logic) is the signal the pattern is general, not a one-feature accident.

## Decision

Bless the **layered feature-module pattern** as the golden-path structure:

1. **`src/features/<feature>/<layer>/`** where `<layer>` is a sublayer the feature's axis needs:
   - **`data/`** — the data/query/repository seam. The **only** place a feature touches the
     generated Orval hooks (`useSchoolControllerFindSchools` …) or the `@/db` seam
     (`db`/`personalEvents`/operators). Wraps them, maps DTO/row → small domain shapes, exposes
     typed query/CRUD functions + reactive hooks. (`school-selection/data/queries.ts`,
     `personal-events/data/repository.ts`.)
   - **`store/`** — a persisted-state seam over `@/storage`. **Total, defensively-validated**
     reads (a bad/unset/legacy value parses to a safe default, never throws); flat namespaced
     keys; one imperative write path; the reactive read in a `hooks.ts` over `@/storage`'s
     reactive seam read. (`settings/prefs/store.ts`, `school-selection/store/store.ts`.)
   - **`form/`** — pure form logic (validation returning localizable *keys* not sentences; a
     pure build function; save/delete/load hooks over the feature's `data/`). No `t()`, no
     backend import in the pure parts. (`personal-events/form/`.)
   - **`ui/`** — the presentational screen(s) for the feature; consumes sibling sub-barrels —
     never its own feature barrel (B-2) — and never the seams directly (B-1). The colocated
     `*.test.tsx` is fine here because it is NOT under `src/app/`, so Metro's route-bundling
     `require.context` never walks it. (`settings/ui/settings-screen.tsx`,
     `personal-events/ui/personal-event-form-screen.tsx`, `school-selection/ui/school-picker-screen.tsx`.)
   - A feature adds only the sublayers it needs (Settings has `prefs/` + `ui/`; School
     selection has `data/` + `store/` + `ui/`; Personal events has `data/` + `form/` + `ui/`;
     Splash is presentation-only — just `ui/`, no data/store/form).
2. **Barrel discipline (no cycle).** Each sublayer has an `index.ts` re-exporting its public
   surface; a feature-level `index.ts` re-exports the sublayers. **Sublayers never import the
   feature barrel** — they import a *sibling sublayer's* sub-barrel directly when needed
   (`form/` → `@/features/personal-events/data`), keeping the graph a DAG.
3. **Seam boundaries.** Presentational screens live in the feature's `ui/` sublayer
   (`src/features/<feature>/ui/`), not `src/components/`, and consume **sibling sub-barrels**
   directly (`settings/ui/settings-screen.tsx` → `@/features/settings/prefs`) — never their own
   feature barrel (B-2), and never the generated API hooks, `@/db`, or `react-native-mmkv`
   directly (B-1). `src/components/` now holds only genuinely shared primitives/shell
   (`themed-text`, `themed-view`, `color-swatch-picker`, `date-time-field`, the `chrome/*`
   wrappers, …), which `ui/` screens import via `@/components/*` (an allowed feature-sublayer →
   component edge). Thin route entrypoints live in `src/app/` as one-line re-exports of the
   screen through the feature's `ui/` sub-barrel (the route-structure rule).
4. **Coverage split (ADR 003).** Logic sublayers (`data/`/`store/`/`form/` — the
   `src/features/*/!(ui)/**` glob) are 90%-gated; `ui/` screens fall to the `global` 70% floor
   (the `!(ui)` extglob *excludes* them rather than overlaying a 70 key, because Jest coverage
   thresholds are additive, not most-specific-wins).

The boundaries in (1)/(3) were **review-enforced** when this ADR landed; **encoding** them as
`eslint-plugin-boundaries` was the separate TIM-135 slice (held out of this docs/pattern
extraction to avoid doubling the blast radius). That slice has **landed** —
`add-mobile-feature-boundaries-lint` (TIM-135, 2026-06-14) encodes the boundaries as
B-1…B-4 in the `timecalendar/feature-boundaries` block (Architecture Book "Lint & format →
Feature-module boundaries"); they are now CI-enforced, no longer review-only.

*Rejected:* a single rigid "reference feature" to copy (the three stress different axes — one
would mislead a feature of a different axis; design D1); a code generator to stamp the shape
(heavy tooling the repo's posture rejects from a sample of three — R-2 / design D2); freezing the
sublayer set (a feature adds the sublayers its axis needs — the set is open, not fixed).

## Consequences

- Every future feature copies `src/features/<feature>/<layer>/` (sublayers from the open set
  `{data, store, form, ui, …}`) + the barrel discipline + the seam boundaries; the golden-path
  exemplar is the how-to and a skeleton template tree (outside `src/`) is the copy source.
- The pattern is **blessed, not frozen** — the calendar spike (ADR 005) may generalize it; this
  ADR's revisit covers that.
- ADR 009's infra→feature-edge decision (prefs consumed by `use-color-scheme`/`@/i18n`) is
  resolved by TIM-135 as **allowed** (boundary B-4) — its revisit fired and is recorded there.
- The feature-boundary lint (TIM-135, `add-mobile-feature-boundaries-lint`) **landed**
  (2026-06-14): the boundaries (B-1 `data/`-only-seam, B-2 no-self-barrel-cycle, B-3
  barrel-entry-point, B-4 allowed infra edge) this ADR documents are now CI-enforced.

## Revisit if

- `eslint-plugin-boundaries` (TIM-135) **landed**; a *future* adjustment to its encoding (new
  allow/deny edges, a new element type or sublayer name) wants to change the documented shape
  — reconcile this ADR + the exemplar + the `timecalendar/feature-boundaries` block then.
- A feature's axis needs a sublayer the pattern doesn't name (e.g. a `sync/` mutation-queue
  layer for offline writes) — extend the open sublayer set with the new feature's evidence.
  (This fired 2026-06-15 — `ui/` was added when feature screens relocated out of
  `src/components/`; see Status.)
- The calendar spike (ADR 005) or a later feature shows the layered shape doesn't fit a genuinely
  different axis — generalize rather than force-fit (the migration-approach §4 posture).
