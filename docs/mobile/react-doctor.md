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

A cache-disabled full scan on 2026-09-07 identified the single `mobile` project as Expo with
React Compiler enabled. It scanned 494 source files and reported 93 diagnostics in 44 files: 5
errors and 88 warnings. The per-rule inventory reconciles to `5 + 88 = 93`.

| Severity | Rule | Count |
| --- | --- | ---: |
| error | `react-hooks-js/todo` | 5 |
| warning | `react-doctor/react-compiler-no-manual-memoization` | 65 |
| warning | `react-doctor/no-loading-flag-reset-outside-finally` | 2 |
| warning | `react-doctor/no-set-state-after-await-in-effect` | 1 |
| warning | `react-doctor/rn-no-legacy-shadow-styles` | 5 |
| warning | `react-doctor/no-barrel-import` | 1 |
| warning | `react-doctor/js-combine-iterations` | 2 |
| warning | `react-doctor/async-await-in-loop` | 2 |
| warning | `react-doctor/no-array-index-as-key` | 1 |
| warning | `react-doctor/only-export-components` | 2 |
| warning | `react-doctor/no-high-complexity-react-function` | 2 |
| warning | `react-doctor/no-derived-state` | 1 |
| warning | `react-doctor/rn-no-scrollview-mapped-list` | 2 |
| warning | `react-doctor/rn-prefer-reanimated` | 1 |
| warning | `react-doctor/no-object-keys-values-entries-on-maybe-undefined` | 1 |

The proposal-time scan reported the same 93 diagnostics across 493 files; the implementation adds
the React Doctor contract test, producing the final 494-file count without adding a diagnostic.
The earlier mission baseline was 461 files and 106 diagnostics: 7 errors and 99 warnings. The
difference is the result of intervening source changes, not a copied or suppressed baseline.

The seven prerequisite integrations are:

| Pull request | Merge commit | Result relevant to this inventory |
| ---: | --- | --- |
| #369 | `f8a01180` | Onboarding welcome decomposition |
| #370 | `859cbc54` | Personal-event editor decomposition; removed the compiler bailout around the former inline delete `try/finally` |
| #371 | `ada9f09a` | User-calendar management decomposition; replaced the visibility handler's compiler-bailing `try/finally` with the tested operation-keyed controller |
| #372 | `bc686ab9` | QR import state-machine extraction |
| #373 | `3209efa2` | Event-details simplification |
| #374 | `7be6dbbf` | Jest lifecycle stabilization |
| #376 | `9a451566` | Single-owner architecture cleanup |

The two historical compiler errors no longer in the current five-error inventory are therefore
accounted for by #370's personal-event delete extraction and #371's visibility-controller
extraction.

## Error dispositions

All five errors are triaged deferrals. React Doctor 0.9.13 reports React Compiler's known lack of
support for the indicated `try` form; it does not report a runtime defect. No suppression is used.

| Location | Unsupported form and required behavior | Disposition | Evidence, owner, and revisit trigger |
| --- | --- | --- | --- |
| `mobile/src/features/activity/ui/activity-screen.tsx:74` | `try/finally` releases both the ref single-flight guard and visible loading state after page success or rejection. | Deferred | `activity-screen.test.tsx` proves rejection, retry, and finalization. Mobile Activity owners revisit when the compiler accepts `TryStatement` without `catch`, or when a clearer equivalent preserves both releases. |
| `mobile/src/features/calendar-sources/data/user-calendars/add-calendar.ts:50` | `try/catch/finally` spans create, token resolution, durable upsert, error state, rethrow, and pending cleanup. | Deferred | `add-calendar.test.tsx` proves each failure boundary and cleanup. Calendar-source data owners revisit after compiler support for finalizers or a simpler state-machine boundary. |
| `mobile/src/features/calendar-sources/data/user-calendars/rename.ts:54` | The outer `finally` releases pending state while inner handling deliberately separates recoverable request failure from recorded local-write failure. | Deferred | `rename.test.tsx` proves both failure domains, recording, rethrow, and cleanup. Calendar-source data owners revisit after compiler finalizer support; promise-chain conversion is not clearer. |
| `mobile/src/features/calendar/data/sync/sync.ts:57` | Nested failure domains preserve no-token return, recoverable read/fetch behavior, recorded local writes, non-blocking Activity refresh, name convergence, and final syncing cleanup. | Deferred | `sync.test.tsx`, `startup.test.ts`, `restart.test.ts`, and `hooks.test.ts` cover the lifecycle. Calendar data owners revisit only with compiler support or a tested orchestration abstraction that keeps these domains explicit. |
| `mobile/src/features/feedback/ui/feedback-screen.tsx:83` | `try/finally` releases the synchronous duplicate-submit ref after success, `false`, or rejection. | Deferred | `feedback-screen.test.tsx` proves success, rejection, retry, and duplicate suppression. Feedback owners revisit when the compiler accepts finalizers or an equally clear single-flight primitive exists. |

The focused bailout verification passed 8 suites and 62 tests. Since no source rewrite was clearer
than these exception-safe forms, the current five files are unchanged.

## Warning dispositions

The following cohorts account for all 23 non-memoization warnings. “False positive” means the
reported failure condition is contradicted by the cited guard or API contract. “Deferred” means a
real maintainability or performance trade-off was inspected and intentionally left with a trigger.

| Rule (count) | Locations | Disposition and evidence | Owner and revisit trigger |
| --- | --- | --- | --- |
| `no-loading-flag-reset-outside-finally` (2) | `mobile/src/features/activity/data/lifecycle.ts`; `mobile/src/features/personal-events/ui/use-personal-event-delete-confirmation.ts` | False positives. Activity's refresh seam never rejects and skips state writes after unmount. Delete converts failures to `false`, which takes the reset path; `true` navigates away. | Activity and personal-event owners; revisit if either called promise begins rejecting or success stops navigating away. |
| `no-set-state-after-await-in-effect` (1) | `mobile/src/features/calendar-sources/ui/dev-import-screen.tsx` | False positive. Both post-await navigation and error state are guarded by `mountedRef`. | Calendar-source UI owners; revisit if the async import effect gains another post-await write. |
| `rn-no-legacy-shadow-styles` (5) | `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx`; `mobile/src/features/calendar/ui/agenda-list.tsx` (2); `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx`; `mobile/src/features/home/ui/home-screen/home-screen-header.tsx` | Deferred. These styles intentionally pair iOS shadow properties with Android `elevation` and preserve shipped visual parity. | Mobile UI owners; revisit with a cross-platform `boxShadow` migration backed by iOS/Android visual evidence. |
| `no-barrel-import` (1) | `mobile/src/features/calendar/data/events.ts` | False positive. The local `./sync` sub-barrel is the Architecture Book's owned data seam and is allowed by the enforced feature-boundary graph. | Calendar data owners; revisit if the lint-enforced sublayer contract changes. |
| `js-combine-iterations` (2) | `mobile/src/features/calendar/data/events.ts`; `mobile/src/features/home/data/selectors.ts` | Deferred. The explicit stages preserve visibility and day-selection intent; no measured hot-path problem was found. | Calendar and Home data owners; revisit on a profiler trace or large-schedule regression attributable to these passes. |
| `async-await-in-loop` (2) | `mobile/src/features/calendar/data/sync/sync.ts`; `mobile/src/features/environment/data/session-reset.ts` | Deferred. Name convergence and registered reset participants are deliberately sequential failure/order domains. | Calendar and environment owners; revisit only when concurrency semantics and partial-failure handling are specified and tested. |
| `no-array-index-as-key` (1) | `mobile/src/features/calendar/renderer/calendar-kit/calendar-kit-timeline.test.tsx` | False positive. This is a stateless test adapter over a fixed rendered array; it carries no user state and never ships. | Calendar renderer test owners; revisit if the fake rows gain state or reordering assertions. |
| `only-export-components` (2) | `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx`; `mobile/src/features/feedback/ui/feedback-screen.tsx` | Deferred development-only Fast Refresh optimization. Both pure helpers are colocated with their sole component contract and directly tested. | Feature UI owners; extract if another production consumer appears or Fast Refresh state loss is reproduced. |
| `no-high-complexity-react-function` (2) | `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx`; `mobile/src/features/school-selection/ui/school-picker-screen.tsx` | Deferred. The reported branches express bounded variants and explicit loading/error/empty/accessibility states with focused tests. | Feature UI owners; revisit when another state or variant is added, or a change cannot be isolated in focused tests. |
| `no-derived-state` (1) | `mobile/src/features/event-checklists/ui/event-checklist.tsx` | False positive. Draft state is intentionally user-editable; the effect's echo queue distinguishes acknowledged local writes from external canonical updates. | Checklist owners; revisit if editing moves to a form controller with an explicit external-reset API. |
| `rn-no-scrollview-mapped-list` (2) | `mobile/src/features/home/ui/upcoming-scroller.tsx`; `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx` | Deferred. Upcoming events are a small horizontal daily set; school groups are a recursive expandable tree unsuitable for a mechanical flat-list swap. | Home and onboarding owners; revisit on measured low-end scroll regressions or a flattened tree design. |
| `rn-prefer-reanimated` (1) | `mobile/src/features/splash/ui/splash-screen.tsx` | False positive. React Native `Animated.timing` is configured with `useNativeDriver: true`, and the component owns reduced-motion and cleanup behavior. | Splash owners; revisit if the animation gains JS-driven properties or joins a shared Reanimated sequence. |
| `no-object-keys-values-entries-on-maybe-undefined` (1) | `mobile/src/test-support/fake-db.ts` | False positive. `projection === undefined` returns immediately before `Object.entries(projection)`; the narrowed branch always has an object. | Test-harness owners; revisit if the projection type admits `null` or the guard moves. |

### Manual memoization: 65 warnings

The remaining memoization findings are evidence-backed deferrals grouped by semantic role. React
Compiler may reproduce caches, but these identities are currently part of renderer inputs, hook
APIs, or effect lifecycles. The code is not mass-edited to improve a score.

The renderer/data-projection cohort has 28 occurrences:

- `mobile/src/components/adaptive-content.tsx` (2)
- `mobile/src/features/activity/data/hooks.ts` (2)
- `mobile/src/features/calendar-sources/data/user-calendars/hooks.ts` (1)
- `mobile/src/features/calendar/data/event-details.ts` (1)
- `mobile/src/features/calendar/data/events.ts` (1)
- `mobile/src/features/calendar/data/sync/hooks.ts` (1)
- `mobile/src/features/calendar/renderer/calendar-kit/calendar-kit-timeline.tsx` (2)
- `mobile/src/features/calendar/ui/agenda-list.tsx` (2)
- `mobile/src/features/calendar/ui/calendar-screen.tsx` (1)
- `mobile/src/features/event-checklists/data/hooks.ts` (1)
- `mobile/src/features/event-checklists/data/progress.ts` (2)
- `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx` (1)
- `mobile/src/features/home/ui/home-screen/use-home-screen-controller.ts` (9)
- `mobile/src/features/onboarding/draft/context.tsx` (1)
- `mobile/src/features/school-selection/ui/school-picker-screen.tsx` (1)

`calendar-kit-timeline.test.tsx` is the representative identity proof: a progress-only rerender
retains the projected vendor event array and object identities. The onboarding provider is the
representative context value: its memoized object prevents every route consumer from receiving a
new API value on unrelated provider rerenders. The cheap local candidate was the school-picker's
filtered array; inspection found no correctness requirement, but retained it because removal has
no user benefit and would make this inventory the reason for a production change. Mobile feature
owners revisit this cohort when compiler output can be inspected/profiled in the Expo build or an
identity test proves the manual layer redundant.

The hook/action API cohort has 30 callback occurrences:

- `mobile/src/components/adaptive-content.tsx` (1)
- `mobile/src/features/calendar-sources/data/create.ts` (1)
- `mobile/src/features/calendar-sources/data/user-calendars/actions.ts` (2)
- `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` (1)
- `mobile/src/features/event-checklists/data/hooks.ts` (7)
- `mobile/src/features/event-checklists/ui/event-checklist.tsx` (3)
- `mobile/src/features/hidden-events/data/hooks.ts` (4)
- `mobile/src/features/home/ui/home-screen/use-home-screen-controller.ts` (1)
- `mobile/src/features/notifications/data/hooks.ts` (3)
- `mobile/src/features/onboarding/draft/context.tsx` (4)
- `mobile/src/features/personal-events/form/hooks.ts` (2)
- `mobile/src/features/settings/prefs/hooks.ts` (1)

These callbacks cross component/hook boundaries or appear in dependency arrays. The onboarding
draft tests exercise the context API through successive updates, and notification hook tests prove
registration changes without duplicate subscription work. Feature owners revisit when a compiler
upgrade demonstrably preserves these public identities without the explicit callbacks.

The effect/subscription lifecycle cohort has 7 callback occurrences:

- `mobile/src/components/adaptive-content.tsx` (1)
- `mobile/src/features/activity/data/lifecycle.ts` (2)
- `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx` (2)
- `mobile/src/features/notifications/data/subscription.ts` (1)
- `mobile/src/hooks/use-recorded-action.ts` (1)

Here callback identity controls measurement, once-only effects, cleanup, subscription
registration, or an exception-recording action wrapper. Notification subscription tests cover
registration changes, cleanup, and failure recording; Changelog tests cover idempotent
acknowledgement on dismissal/unmount. Feature owners revisit after compiler upgrades only with
focused effect-count and cleanup proofs.

The three cohort totals reconcile exactly: `28 + 30 + 7 = 65`; together with the 23 warning
entries above, `65 + 23 = 88`.

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
