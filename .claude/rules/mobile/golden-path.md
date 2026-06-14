# Golden-path exemplar — TimeCalendar mobile

One of the [five living artifacts](./architecture.md#the-five-living-artifacts).
**This is a placeholder, not the exemplar yet — and not a template to copy.**

## Why this is empty (on purpose)

The golden-path exemplar is **earned, not declared** (migration-approach §4,
philosophy principle 5). It is extracted in **Phase 1.5**, from what the three
deliberately-varied Phase 1 features (Settings → Personal events → School selection,
[ADR 004](./decisions/004-phase-1-feature-order.md)) actually teach us — *after* the
pattern has been validated against variety, not before. Blessing an exemplar now,
from a sample size of zero, is exactly the day-one freezing this migration refuses.

So this file exists (step 12 says the five artifacts exist "even mostly empty") with
the right expectation set: there is **no reference feature to copy yet.**

## What the future exemplar must demonstrate

When Phase 1.5 extracts it, the exemplar (the reference feature + its reusable
scaffolding) should show, end to end:

- **Feature folder layout** — where a feature's screens, components, data, and tests
  live, and the import/module boundaries between them (the feature-boundary lint,
  deferred to when feature folders exist, lands around here).
- **Data / query seam** — how a feature reaches the server (TanStack Query hooks over
  the `customFetch` mutator) and device storage (MMKV / Drizzle) without leaking the
  generated client past its seam.
- **Navigation** — route-as-thin-entrypoint over a `@/components` module, the root
  `Stack` + `(tabs)` structure, nested navigation.
- **i18n + a11y wiring** — flat typed keys, the heading-role contract, accessible
  controls — at the call-site level a new feature copies.
- **Test + e2e shape** — the component test (mock at the `customFetch` seam) and the
  Maestro flow a feature ships with, and the coverage gate
  ([ADR 003](./decisions/003-coverage-threshold.md)) it then satisfies.

Each of these has a rule in the [Architecture Book](./architecture.md) already; the
exemplar's job is to show them composed in one real feature.

## The closest real references today

Until the exemplar exists, look at these (they are reference *surfaces*, not a
blessed pattern):

- **`mobile/src/features/school-selection/data/`** — the live server-read data/query
  layer: `queries.ts` wraps the generated hooks over `customFetch` (the only place they're
  imported) mapped to domain shapes; `persist.ts` is the offline persister config (ADR 013).
  The closest thing to the data/query seam today (the `schools-screen.tsx` harness it
  replaced is gone — real onboarding landed).
- **`mobile/src/features/school-selection/store/`** — the typed, validated, identity-only
  selection store (mirrors Settings prefs; total reads, reactive hook).
- **`mobile/src/components/onboarding/`** (+ their `*.test.tsx`) — the presentational
  screens: list/tree over the feature hooks, accessible loading/error-with-retry/empty
  states, localized; tested behind the mutator seam / mocked feature hooks. The nested
  route group lives in `mobile/src/app/onboarding/` (thin entrypoints).
- **`mobile/.maestro/onboarding.yaml`** + **`mobile/e2e/`** — the real-round-trip e2e shape
  (deep-link → assert a seeded school from the live `GET /schools`).
- The Architecture Book sections "Navigation & route structure", "Data layer",
  "School selection", "i18n", "Accessibility" — the rules the exemplar will embody.

**Do not copy this file's structure as if it were the pattern.** When the exemplar is
extracted in Phase 1.5, this placeholder is replaced with it and the change appends a
[Rule changelog](./architecture-changelog.md) entry.
