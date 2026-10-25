## Context

See proposal.md — Why. The spike is self-contained: one thin route file re-exporting the feature
screen, a `paging-spike` module with fixture data and its own Jest test, one explicit headerless
`Stack.Screen` in the root layout, and two entries in the route-structure test's headerless sets.
The route-structure test compares root registrations to the files discovered under
`mobile/src/app/`, so the route file and its registration must leave together.

Evidence produced by the spike lives outside `mobile/src`: `docs/perf/E02-spike-evidence.md`
cites `mobile/perf/samples/spike-d5038fad-{snap,paging,small-k}` and the README entry that names
them.

## Goals / Non-Goals

**Goals:**
- Remove every runtime trace of the spike from `mobile/src`.
- Keep the route inventory exhaustive and green with the spike absent.
- Keep the E02 evidence chain intact and readable.

**Non-Goals:**
- Editing ADRs 005, 019 or 062, `docs/perf/*` or `docs/projects/*`: they record what was decided
  and measured at the time and stay valid as evidence.
- Removing dependencies: `react-native-gesture-handler`, `react-native-reanimated`,
  `react-native-worklets` and `react-native-safe-area-context` are used by production code.
- Any change to the owned calendar renderer or to `dev-import` / `settings-gallery`.

## Decisions

### Delete outright, keep the perf samples

Alternatives: keep the spike behind the dev variant as a reference, or move it out of `mobile/src`
into a scratch directory. Both keep unrun code compiling against a moving codebase and keep the
route-inventory exception alive. The evidence that matters is already frozen in the committed
samples and in `docs/perf/E02-spike-evidence.md`, and the code is recoverable from history at
`d5038fad`. Deletion is the owner's decision; the samples stay because a cited evidence file must
not dangle.

### State the closed headerless set in the spec

The current `mobile-root-page-primitives` requirement lists the headerless exceptions without
`calendar-import-result`, while the route-structure test enforces it. The delta states the exact set
the test enforces after deletion, so spec and gate agree. The rule is already encoded (R-1): the
test's `headerlessRoutes` set plus the exhaustive `discoveredRoutes()` comparison. No new gate is
needed.

### `perf/README.md` wording

The README entry names `/dev-paging-spike` as if it were reachable. It is reworded to describe the
samples as captured from the E02 paging spike at `d5038fad` with fixture weeks: an evidence
description, not history narration, and still the anchor `E02-spike-evidence.md` reads with.

## Risks / Trade-offs

- [A dev deep link `timecalendar-dev://dev-paging-spike` now hits Expo Router's unmatched route]
  → Dev-only and undocumented outside the deleted paragraph; acceptable.
- [Coverage gate shifts when the spike's fixture test and code leave together] → The spike code is
  removed with its test, so no remaining file loses coverage; `npm test -- --coverage` proves it.
- [A stray reference survives in prose] → Task sweep with `grep -rn "paging-spike"` limited to the
  allowed evidence locations.

## Migration Plan

Single PR. Rollback is a revert. The RN app is not in production, so no installed build is affected.
