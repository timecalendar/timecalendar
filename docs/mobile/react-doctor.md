# Mobile React Doctor report

This is the normalized current-state inventory for the standalone Expo project in `mobile/`.
React Doctor output is evidence to triage, not an automatic rewrite queue. The raw JSON is not
committed because it contains checkout-specific absolute paths.

## Reproducible commands

Install from the mobile lockfile, then run from `mobile/`:

```sh
npm ci
npm run react-doctor
npm run react-doctor:changed
```

Both scripts use the locally installed, exactly pinned React Doctor `0.9.13`, explicitly scan `.`,
disable telemetry, score reporting, caches, and supply-chain analysis, and print warnings
verbosely. The full scan uses `--blocking none`; the changed scan uses
`--scope changed --base origin/main --blocking warning`.

## Current baseline

A cache-disabled full scan on 2026-10-25 identified the single `mobile` project as Expo with
React Compiler enabled. It scanned 727 source files and reported 68 diagnostics in 32 files: 3
errors and 65 warnings. The per-rule inventory reconciles to `3 + 65 = 68`.

| Severity | Rule | Count |
| --- | --- | ---: |
| error | `react-hooks-js/todo` | 3 |
| warning | `react-doctor/react-compiler-no-manual-memoization` | 47 |
| warning | `react-doctor/no-loading-flag-reset-outside-finally` | 2 |
| warning | `react-doctor/rn-no-legacy-shadow-styles` | 4 |
| warning | `react-doctor/js-combine-iterations` | 1 |
| warning | `react-doctor/async-await-in-loop` | 1 |
| warning | `react-doctor/no-array-index-as-key` | 1 |
| warning | `react-doctor/only-export-components` | 2 |
| warning | `react-doctor/no-high-complexity-react-function` | 1 |
| warning | `react-doctor/no-derived-state` | 1 |
| warning | `react-doctor/rn-no-scrollview-mapped-list` | 2 |
| warning | `react-doctor/rn-prefer-reanimated` | 1 |
| warning | `react-doctor/rn-prefer-expo-image` | 1 |
| warning | `react-doctor/no-object-keys-values-entries-on-maybe-undefined` | 1 |

## Error dispositions

All three errors are triaged deferrals. React Doctor 0.9.13 reports React Compiler's known lack of
support for the indicated `try` form; it does not report a runtime defect. No suppression is used.

| Location | Unsupported form and required behavior | Disposition | Evidence, owner, and revisit trigger |
| --- | --- | --- | --- |
| `mobile/src/features/activity/ui/activity-screen.tsx:79` | `try/finally` releases both the ref single-flight guard and visible loading state after page success or rejection. | Deferred | `activity-screen.test.tsx` proves rejection, retry, and finalization. Mobile Activity owners revisit when the compiler accepts `TryStatement` without `catch`, or when a clearer equivalent preserves both releases. |
| `mobile/src/features/calendar-sources/data/user-calendars/rename.ts:54` | The outer `finally` releases pending state while inner handling deliberately separates recoverable request failure from recorded local-write failure. | Deferred | `rename.test.tsx` proves both failure domains, recording, rethrow, and cleanup. Calendar-source data owners revisit after compiler finalizer support; promise-chain conversion is not clearer. |
| `mobile/src/features/feedback/ui/feedback-screen.tsx:76` | `try/finally` releases the synchronous duplicate-submit ref after success, `false`, or rejection. | Deferred | `feedback-screen.test.tsx` proves success, rejection, retry, and duplicate suppression. Feedback owners revisit when the compiler accepts finalizers or an equally clear single-flight primitive exists. |

No source rewrite is clearer than these exception-safe forms, so the three files keep them.

## Warning dispositions

The following cohorts account for all 18 non-memoization warnings. “False positive” means the
reported failure condition is contradicted by the cited guard or API contract. “Deferred” means a
real maintainability or performance trade-off was inspected and intentionally left with a trigger.

| Rule (count) | Locations | Disposition and evidence | Owner and revisit trigger |
| --- | --- | --- | --- |
| `no-loading-flag-reset-outside-finally` (2) | `mobile/src/features/activity/data/lifecycle.ts`; `mobile/src/features/personal-events/ui/use-personal-event-delete-confirmation.ts` | False positives. Activity's refresh seam never rejects and skips state writes after unmount. Delete converts failures to `false`, which takes the reset path; `true` navigates away. | Activity and personal-event owners; revisit if either called promise begins rejecting or success stops navigating away. |
| `rn-no-legacy-shadow-styles` (4) | `mobile/src/features/calendar/ui/agenda-list.tsx` (2); `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx`; `mobile/src/features/home/ui/home-screen/home-screen-header.tsx` | Deferred. These styles intentionally pair iOS shadow properties with Android `elevation` and preserve shipped visual parity. | Mobile UI owners; revisit with a cross-platform `boxShadow` migration backed by iOS/Android visual evidence. |
| `js-combine-iterations` (1) | `mobile/src/features/home/data/selectors.ts` | Deferred. The explicit stages preserve day-selection intent; no measured hot-path problem was found. | Home data owners; revisit on a profiler trace or large-schedule regression attributable to these passes. |
| `async-await-in-loop` (1) | `mobile/src/features/environment/data/session-reset.ts` | Deferred. Registered reset participants are a deliberately sequential failure/order domain. | Environment owners; revisit only when concurrency semantics and partial-failure handling are specified and tested. |
| `no-array-index-as-key` (1) | `mobile/src/components/chrome/native-list.tsx` | False positive. `Children.toArray` keys every element child, so the element's own key is used; the index fallback only applies to keyless non-element children, which carry no state. | Chrome seam owners; revisit if section children stop flowing through `Children.toArray`. |
| `only-export-components` (2) | `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx`; `mobile/src/features/feedback/ui/feedback-screen.tsx` | Deferred development-only Fast Refresh optimization. Both pure helpers are colocated with their sole component contract and directly tested. | Feature UI owners; extract if another production consumer appears or Fast Refresh state loss is reproduced. |
| `no-high-complexity-react-function` (1) | `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx` | Deferred. The reported branches express bounded variants and explicit accessibility states with focused tests. | Checklist UI owners; revisit when another state or variant is added, or a change cannot be isolated in focused tests. |
| `no-derived-state` (1) | `mobile/src/features/event-checklists/ui/event-checklist.tsx` | False positive. Draft state is intentionally user-editable; the effect's echo queue distinguishes acknowledged local writes from external canonical updates. | Checklist owners; revisit if editing moves to a form controller with an explicit external-reset API. |
| `rn-no-scrollview-mapped-list` (2) | `mobile/src/features/home/ui/upcoming-scroller.tsx`; `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx` | Deferred. Upcoming events are a small horizontal daily set; school groups are a recursive expandable tree unsuitable for a mechanical flat-list swap. | Home and onboarding owners; revisit on measured low-end scroll regressions or a flattened tree design. |
| `rn-prefer-reanimated` (1) | `mobile/src/features/splash/ui/splash-screen.tsx` | False positive. React Native `Animated.timing` is configured with `useNativeDriver: true`, and the component owns reduced-motion and cleanup behavior. | Splash owners; revisit if the animation gains JS-driven properties or joins a shared Reanimated sequence. |
| `rn-prefer-expo-image` (1) | `mobile/src/components/chrome/native-list-header.tsx` | Deferred. The only image is the bundled static app icon at a fixed size; `expo-image`'s caching and remote-loading features bring no benefit to a local asset. | Chrome seam owners; revisit if the header renders a remote or user-supplied image. |
| `no-object-keys-values-entries-on-maybe-undefined` (1) | `mobile/src/test-support/fake-db.ts` | False positive. `projection === undefined` returns immediately before `Object.entries(projection)`; the narrowed branch always has an object. | Test-harness owners; revisit if the projection type admits `null` or the guard moves. |

### Manual memoization: 47 warnings

The memoization findings are evidence-backed deferrals grouped by semantic role. React Compiler
may reproduce caches, but these identities are currently part of renderer inputs, hook APIs, or
effect lifecycles. The code is not mass-edited to improve a score.

The renderer/data-projection cohort has 19 occurrences:

- `mobile/src/components/adaptive-content.tsx` (2)
- `mobile/src/features/activity/data/hooks.ts` (2)
- `mobile/src/features/calendar/data/event-details.ts` (1)
- `mobile/src/features/calendar/ui/agenda-list.tsx` (2)
- `mobile/src/features/event-checklists/data/hooks.ts` (1)
- `mobile/src/features/event-checklists/data/progress.ts` (2)
- `mobile/src/features/home/ui/home-screen/use-home-screen-controller.ts` (8)
- `mobile/src/features/school-selection/ui/school-picker-screen.tsx` (1)

The cheap local candidate is the school-picker's filtered array; inspection found no correctness
requirement, but it is retained because removal has no user benefit and would make this inventory
the reason for a production change. Mobile feature owners revisit this cohort when compiler output
can be inspected/profiled in the Expo build or an identity test proves the manual layer redundant.

The hook/action API cohort has 22 callback occurrences:

- `mobile/src/components/adaptive-content.tsx` (1)
- `mobile/src/features/calendar-sources/data/create.ts` (1)
- `mobile/src/features/calendar-sources/data/user-calendars/actions.ts` (2)
- `mobile/src/features/event-checklists/data/hooks.ts` (7)
- `mobile/src/features/event-checklists/ui/event-checklist.tsx` (3)
- `mobile/src/features/hidden-events/data/hooks.ts` (4)
- `mobile/src/features/home/ui/home-screen/use-home-screen-controller.ts` (1)
- `mobile/src/features/personal-events/form/hooks.ts` (2)
- `mobile/src/features/settings/prefs/hooks.ts` (1)

These callbacks cross component/hook boundaries or appear in dependency arrays. Feature owners
revisit when a compiler upgrade demonstrably preserves these public identities without the
explicit callbacks.

The effect/subscription lifecycle cohort has 6 callback occurrences:

- `mobile/src/components/adaptive-content.tsx` (1)
- `mobile/src/features/activity/data/lifecycle.ts` (2)
- `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx` (2)
- `mobile/src/hooks/use-recorded-action.ts` (1)

Here callback identity controls measurement, once-only effects, cleanup, or an
exception-recording action wrapper. Changelog tests cover idempotent acknowledgement on
dismissal/unmount. Feature owners revisit after compiler upgrades only with focused effect-count
and cleanup proofs.

The three cohort totals reconcile exactly: `19 + 22 + 6 = 47`; together with the 18 warning
entries above, `47 + 18 = 65`.

## Configured exceptions

`mobile/react-doctor.config.json` holds one scoped override and nothing else: the rule
`react-doctor/no-multi-component-file` is off for `src/**/*.gallery.tsx`. A gallery fixture is a
CSF3-shaped module whose named exports are the stories, so one file per component carrying several
story components is the format itself (ADR
[064](./architecture-book/decisions/064-in-house-component-gallery.md)). Every other file and rule
is scanned as before. `react-doctor.config.test.ts` pins the override to exactly this rule and
glob.

## Standalone dependency boundary

`mobile/package.json` and `mobile/package-lock.json` exclusively define the mobile dependency
graph. From `mobile/`, `npm ls next --all` prints `└── (empty)`, and the structured React Doctor
project metadata reports `framework: "expo"`, `projectName: "mobile"`, and
`nextjsVersion: null`. Root and web dependencies are independent sibling graphs, so a Next report
from either cannot be interpreted as a mobile vulnerability. This work does not change them.

## Gate proof

The changed-code command was exercised with a disposable `useMemo` addition in a tracked mobile
source file: it scanned one file, reported one new warning, and exited 1. After reverting, a
comment-only edit to a file with four pre-existing memoization findings scanned that file, reported
no new issues, and exited 0. Both disposable edits were reverted and no cache or raw report is
tracked.

Final verification results are recorded in the pull request and issue evidence on the exact head.
