## Context

The real Calendar route currently combines independently owned agenda/data/details behavior with a renderer facade implemented entirely by calendar-kit. The facade carries vendor event projection, tiles, theme conversion, date-window buffering, imperative navigation, visible/settled callbacks, a package patch, a global Jest mock, a narrow ESLint exception, and renderer-specific coverage configuration.

The approved owned-renderer design requires a clean replacement rather than a fallback or compatibility layer. T01 is intentionally smaller than a functional timeline: it must establish an owned, labelled surface, keep the app and retained Calendar journeys usable, and stop before paging, hour scrolling, weekday columns, day/week switching, event tiles, zoom, or orientation work. Expo SDK 56 runs only on the React Native New Architecture; the existing Hermes, Gesture Handler, Reanimated, and Worklets baseline remains unchanged.

## Goals / Non-Goals

**Goals:**

- Mount a feature-owned React Native day/week shell on the existing Calendar route with a localized date heading exposed as a heading and a stable full-bleed canvas.
- Keep Agenda reachable and preserve agenda event activation, event-details rendering, back navigation, Calendar unmount/remount, and tab leave/return.
- Delete the entire calendar-kit integration and every configuration exception that exists only for it, while preserving unrelated dependencies and root/runtime structure.
- Leave an implementation and test shape that later tickets can extend one visible capability at a time.
- Record exact automated evidence, fabricated fixture instructions, tested revision, capability limits, and the owner checklist before the required owner QA pause.

**Non-Goals:**

- Horizontal paging, vertical scrolling, hour gutters, weekday columns, weekend filtering, day/week mode switching, event or all-day tiles, current-time display, zoom, gestures, or renderer failure recovery.
- New settings or persistence, changed event facts or storage seams, agenda redesign, native orientation/store configuration, a public renderer API, a second renderer, or a compatibility facade.
- Native Maestro execution on this host, release readiness, owner acceptance, or merge.

## Decision: Make the T01 renderer a small feature-private owned component

Create one presentational component under `mobile/src/features/calendar/renderer` using React Native views, themed tokens, and semantic text. Its input is the already-resolved localized date heading; it owns only the heading/canvas presentation and exposes no ref, navigation method, event projection, gesture callback, or calendar-kit-shaped compatibility API.

The Calendar screen continues to own locale, effective display zone, selected date, menus, routes, sync/agenda orchestration, and Add behavior. Keeping this boundary feature-private follows the useful ownership direction from the existing renderer seam without preserving its vendor contract or prematurely designing the revisioned renderer protocol due in later slices.

Alternatives considered:

- Re-skin the existing facade while leaving its prop shape: rejected because the unused event, range, ref, and callback inputs would be compatibility baggage and silent no-op behavior.
- Render the shell directly in `calendar-screen.tsx`: rejected because it would erase the already-approved renderer ownership boundary and make later renderer growth re-entangle screen orchestration.
- Build paging, grid primitives, or a presentation reducer now: rejected because those are observable capabilities owned by later tickets.

## Decision: Keep date state, but remove renderer-driven date coupling

Collapse the controller's independent anchor/visible values and imperative timeline ref into the smallest screen-owned selected-date state needed for the localized heading and retained agenda range. A valid existing `focusDate` can still select that date without pretending that the empty canvas moved; the Today action may remain only if it visibly changes the selected date/heading and otherwise meets existing accessibility behavior.

The pre-T05 view selector exposes only choices that render distinct working surfaces: the owned Calendar shell and Agenda. A Day choice must not remain if selecting it changes no meaningful presentation. Agenda stays an in-place mode, uses its current bounded seven-day event read, refresh behavior, checklist progress, and event-details routing. Timeline status/event data is not painted onto the empty shell; an event-bearing local store must not be described as an empty data result merely because T01 intentionally omits tiles.

Alternatives considered:

- Keep day/week/agenda and Today controls unchanged: rejected where actions only mutate hidden state or render the same canvas, because enabled no-op controls are forbidden by the delivery agreement.
- Remove all date handling: rejected because it would unnecessarily regress the current localized heading and agenda date input while deleting the vendor coupling.

## Decision: Remove calendar-kit and its exclusive machinery atomically

Delete the `renderer/calendar-kit` implementation, old renderer types and window helpers that have no non-vendor consumer, the package patch, and `jest/calendar-kit/setup.ts`. Remove `@howljs/calendar-kit` from both manifests, the Jest setup entry and renderer-only coverage key, and the calendar-kit import-ban/vendor-exception configuration. Because the patch directory contains no other patch, also remove `patch-package`, its lock entries, and the postinstall hook; retain any dependency that has another repository consumer.

Update calendar-kit-specific comments in the app root, tests, and pure Calendar helpers so current code no longer claims a vendor or fallback path. Do not delete `GestureHandlerRootView`, Gesture Handler, Reanimated, or Worklets: they belong to the retained Expo 56 runtime and approved owned-renderer direction, and some are used elsewhere. No native configuration or runtime fingerprint change is required.

Alternatives considered:

- Keep the vendor dependency unused for rollback: rejected because D07 defines rollback as a coherent source/build revision and explicitly forbids a parallel vendor path.
- Keep the lint ban or Jest mock as future guards: rejected because both name and accommodate a dependency that must no longer exist.

## Decision: Reconcile current contracts without rewriting history

Add delta specs that replace the current vendor/day-week claims with the T01 owned-shell milestone, narrow the Agenda selector contract, and preserve event-details activation through Agenda while marking day/week tile activation temporarily absent. Update `docs/mobile/architecture-book/calendar.md` and `CHANGELOG.md` to describe current behavior and explicit capability limits.

Existing ADRs remain historical records. T01 implements approved project decisions D02, D03, D04, and D07 and does not introduce another costly-to-reverse binding rule, so no new Architecture Book ADR is required. The current docs must not say the complete renderer or React Native launch is ready.

## Decision: Prove the cut with focused automation and an owner-ready handoff

Component tests cover the owned heading/canvas, French and English rendering, agenda switching, agenda-to-details routing, Calendar remount, and state after leaving/returning. Configuration tests or repository assertions cover the absence of dependency, patch, vendor imports, Jest setup, coverage exception, and ESLint exception. Existing event-details and relevant selector/harness tests remain green; all three top-level Maestro journeys and the agenda helper stay present.

The Applier records every edited suite plus focused renderer/screen/config suites, dependency/install proof, TypeScript, lint, scoped Prettier, applicable coverage, React Doctor, OpenSpec validation, and the tested revision. Native Maestro is deferred to its existing CI/main evidence path because this host has no device runtime. The owner handoff uses fabricated local data only, identifies the build and setup/reset steps, lists the absent capabilities, and pauses for the ticket's explicit device checklist and acceptance.

## Risks / Trade-offs

- **The deliberate blank timeline can look like lost event data** → Keep events visible through Agenda, avoid a false timeline empty-data message, preserve storage unchanged, and state the temporary limitation in UI-facing verification and docs.
- **Removing vendor setup can accidentally remove shared runtime support** → Audit each package and root wrapper for non-vendor consumers; delete only calendar-kit-exclusive files and patch tooling with no remaining patch.
- **Tests may continue passing through stale global mocks** → Delete the global mock first, add direct owned-shell behavior assertions, and search the repository for every calendar-kit import/name/config allowance.
- **A retained control can become an enabled no-op** → Test each visible action against an observable result and remove/narrow controls whose later capability has not landed.
- **The slice may grow into T02–T05** → Keep the shell static: no paging state, scroll container, grid/hour math consumption, weekday layout, gesture handler, or day/week switching implementation.
- **Owner QA cannot run locally on this host** → Produce the exact build/fixture checklist and pause with the PR unmerged for explicit device acceptance and human review.

## Migration Plan

1. Replace the vendor facade with the static owned shell and simplify the screen/controller/menu boundary.
2. Delete calendar-kit code, package/lock entries, patch tooling, and exclusive test/lint/coverage setup in the same commit series.
3. Rework focused tests and current docs/specs so only implemented T01 behavior is claimed.
4. Run the complete scoped verification matrix and prepare a testable build plus fabricated-data owner checklist.
5. Leave the draft PR open for implementation review and owner QA; do not merge or begin the next renderer ticket.

Rollback is a source/build rollback to the last coherent pre-launch revision. No database, server contract, or native binary migration occurs, and no dormant vendor switch remains in the new revision.

## Open Questions

None. The approved project records and T01 ticket resolve the architectural and product boundaries needed for this slice; implementation observations that contradict them must stop and return to the Founding Engineer for re-briefing.
