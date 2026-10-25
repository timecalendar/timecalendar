## Why

`mobile/` still ships the E02 calendar paging spike: a dev-only, headerless root route
(`/dev-paging-spike`) and a `paging-spike` feature module rendering fixture weeks. The owned
calendar renderer (ADR 062) replaced it, its evidence is captured in `docs/perf/E02-spike-evidence.md`
and the committed `mobile/perf/samples/spike-d5038fad-*` runs, and the design-system audit of
2026-10-25 decided to delete it. Keeping it costs a route-inventory exception, a feature-index row
and a navigation paragraph for code nobody runs.

## What Changes

- Delete `mobile/src/app/dev-paging-spike.tsx` and the whole `mobile/src/features/paging-spike/`
  module (`ui/`, `data/` including `spike-fixtures.test.ts`, `index.ts`).
- Remove the `dev-paging-spike` `Stack.Screen` registration and its comment from
  `mobile/src/app/_layout.tsx`.
- Remove `dev-paging-spike` from both headerless lists in
  `mobile/src/components/settings-route-structure.test.ts`, so the exhaustive route inventory proves
  the route is gone.
- Architecture Book: `navigation.md` and `features.md` describe the route set and feature index
  without the spike; `CHANGELOG.md` gains a dated 2026-10-25 entry.
- `mobile/perf/README.md` describes the `spike-d5038fad-*` samples as evidence captured from the E02
  paging spike at `d5038fad`, not as a reachable route. The samples themselves stay.
- No app behavior change beyond the deleted dev-only route. No dependency is removed: every import
  the spike used is shared with production code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-root-page-primitives`: the closed set of explicit headerless root registrations is stated
  exactly as the route-structure test enforces it — `(tabs)`, `onboarding`, `profile`, `more`,
  `dev-import`, `calendar-import-result` — with no spike route.

## Impact

- `mobile/src/app/` — one route file deleted, one `Stack.Screen` removed from `_layout.tsx`.
- `mobile/src/features/paging-spike/` — deleted. Nothing else in `mobile/src` imports it.
- `mobile/src/components/settings-route-structure.test.ts` — two list entries removed.
- `docs/mobile/architecture-book/` — `navigation.md`, `features.md`, `CHANGELOG.md`.
- `mobile/perf/README.md` — wording of the spike-sample entry only.
- Untouched: ADRs 005, 019 and 062, `docs/perf/*`, `docs/projects/*`,
  `docs/mobile/releases/06-calendar-paging-gate.md`, `mobile/perf/samples/*`, ESLint/Jest/package
  configuration, native config, OpenAPI, server, workflows. No human-only step.
