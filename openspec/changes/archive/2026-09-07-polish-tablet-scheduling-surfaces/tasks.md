## 1. Home lane and measured timeline geometry

- [x] 1.1 Replace Home's local `MaxContentWidth` frame and per-sibling horizontal ownership with one measured `standard` lane inside the existing safe-area owner; align the feature header/add affordance, welcome/status blocks, Upcoming, Today, and scroll edges without changing platform chrome, safe-area edges, refresh, navigation, or source order.
- [x] 1.2 Keep `UpcomingScroller` horizontally scrollable with its existing fixed card width and event behavior, and add a focused assertion that wider measured lanes reveal capacity without stretching cards.
- [x] 1.3 Refactor `TodayTimeline` so its actual tile-area owner supplies the only positive width used for overlap pixels and minimum-target reflow; remove the window-width/content-padding fallback while retaining `useWindowDimensions()` for `fontScale` only and using the interactive reflow presentation before measurement.
- [x] 1.4 Extend `home-screen.test.tsx` and `today-timeline.test.tsx` with the smallest table covering 390 phone preservation, the 599/600 gutter boundary where the screen owns it, representative 768/800/834/1024 tablet lanes, first positive measurement, a narrow nested tile area inside a wider mocked window, remeasurement, Dynamic Type reflow, overlap geometry, press/routing, checklist, all-day, refresh, and platform add behavior.

## 2. Calendar mode-aware composition

- [x] 2.1 Compose Agenda's `CalendarScreenStatus` and `AgendaList` inside one measured `standard` lane while keeping the safe-area owner, grouping, sticky headers, checklist progress, event routing, and refresh control unchanged.
- [x] 2.2 Preserve day/week `CalendarTimeline` as full bleed through the renderer-neutral seam; keep native header/actions/view menu untouched and the Android FAB anchored to the full Calendar bounds rather than the Agenda lane.
- [x] 2.3 Extend `calendar-screen.test.tsx` with focused phone/tablet cases proving Agenda loaded/empty/error/refresh alignment at 390 and representative 600/768/834/1024 widths, plus day/week full-bleed width, unchanged native actions/menu, and Android FAB bounds/behavior. Update `agenda-list` coverage only where a lane-owned list assertion is clearer at that component boundary.

## 3. Event details and checklist lane

- [x] 3.1 Put event-details loaded content, action failure presentation, and checklist in one measured `readable` lane inside the existing safe-area/presentation owner, preserving scrolling and the title → metadata → event action → checklist source/focus order.
- [x] 3.2 Apply the same readable-lane ownership to loading and missing/not-found outcomes without changing their accessible live-region/status semantics; keep the surface one column at 834+ and under large text.
- [x] 3.3 Extend `event-details-screen.test.tsx` and the existing checklist integration coverage at 390/768/834/1024 as relevant to prove loaded/loading/missing/error caps, long wrapping content, one-column source/accessibility order, event actions, and checklist CRUD behavior.

## 4. Personal-events list and form lanes

- [x] 4.1 Replace the personal-events list's local frame with the shared measured `standard` lane for header/Add, empty state, rows, and scroll edges; preserve one-list composition, reactive reads, row labels/hints, and create/edit navigation.
- [x] 4.2 Put `PersonalEventEditor`'s scroll body and `PersonalEventActions` footer in one measured `readable` lane while leaving `KeyboardAvoidingView` as the keyboard owner and preserving native pickers, field/validation/action order, save/delete failures, confirmation, deletion, and back navigation.
- [x] 4.3 Extend `personal-events-list.test.tsx` and `personal-event-form-screen.test.tsx` with focused 390/600/768/800/834/1024 cases as relevant, including list/empty/header alignment, readable form/footer alignment, long/large-text one-column order, keyboard-safe footer reachability, validation, create/edit/save failure, and delete confirmation/failure behavior.

## 5. Documentation and contract reconciliation

- [x] 5.1 Update `docs/mobile/tablet-quick-wins.md` only after implementation to mark the Home, Calendar, event-details/checklist, personal-events list, and form rows with their actual disposition, touched ownership seams, and focused automated proof; record native/device evidence as unavailable on this host rather than claiming execution.
- [x] 5.2 Reconcile `docs/mobile/architecture-book/calendar.md`, `theming.md`, `testing.md`, and `CHANGELOG.md` against the finished code. The expected disposition is no Architecture Book rule or ADR change because this work consumes the existing responsive/calendar/testing contracts; if implementation creates a reusable current-state rule, update the topical page plus `CHANGELOG.md` and identify the decision explicitly for Reviewer scrutiny.
- [x] 5.3 Confirm OpenSpec delta scenarios still match the implemented behavior, then sync the canonical specs and archive `.openspec.yaml`, proposal, design, specs, and checked tasks before final review.

## 6. Verification and CI proof

- [x] 6.1 Run the focused Jest suites for `responsive`, `adaptive-content`, Home/Today timeline, Calendar/Agenda, event details/checklist, and personal-events list/form; record the exact commands and results in the PR or handoff.
- [x] 6.2 Run the local-green mobile gates from `mobile/`: `npx tsc --noEmit`, `npm run lint`, and `npm test`. Fix regressions within the scheduling-polish scope and report any unrelated failure with its exact evidence.
- [x] 6.3 CI proof: ensure the focused phone/tablet component and geometry tests added above run under the existing `test-mobile` Jest gate and fail if lane ownership regresses to a global-window assumption, Agenda caps day/week, details/forms reorder at 834+, or the form footer diverges from its readable lane.
- [x] 6.4 Run `mobile/e2e/maestro-selectors.test.ts` or the repository's containing static Jest command if any touched markup changes an existing Maestro selector; keep current selector families intact. Do not add `run-e2e` or claim native simulator/device execution from this host.
- [x] 6.5 Review the final diff against scope: no calendar/data or persistence semantics, routes, generated API/contract, dependencies, renderer vendor/patch, native/store/EAS/Firebase configuration, deploy/CI paths, landscape/multitasking behavior, tablet-only navigation, or `app/` changes.
