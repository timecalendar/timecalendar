## 1. Lock week and transition semantics with focused tests

- [x] 1.1 Add a pure week-arithmetic suite for explicit first-weekday policy input, all seven containing weekdays, previous/next shifts, repeated round trips, month/year rollover, and Paris/New York/Tokyo spring/fall DST boundaries; require 100% statement and branch coverage for the new pure module and run its exact suite.
- [x] 1.2 Add pure revision/transition tests that prove one accepted direction per request, snap-back, duplicate delivery idempotence, stale/cancelled completion rejection, newer-request invalidation, Today/focus-date week normalization, and at most one pending replacement generation; run the exact suite.
- [x] 1.3 Extend the owned renderer suite through the supported Gesture Handler/Reanimated Jest setup to cover positive-width three-slot layout, held-drag heading stability, one-page fling in both directions, snap-back, reversal/cancellation, animation interruption, reduced motion, repeated previous/next actions, one accepted-settle callback, one announcement, and stable retained page count; run the exact suite.
- [x] 1.4 Extend the Calendar screen suite to prove that accepted paging commits the selected date, native month/year title, visible date heading, Agenda range, renderer generation, and accessibility context to one week; also prove stale completion cannot relabel the screen and retained T01 mount/Agenda/details/Today behavior remains usable, then run every edited Calendar suite.

## 2. Add policy-driven whole-week state

- [x] 2.1 Add a pure Calendar data module and barrel exports for resolving and shifting a display-zone week from an explicit first-weekday policy; compose existing civil-day helpers, use no fixed-duration arithmetic, and make the tests and 100% pure-module coverage pass.
- [x] 2.2 Replace the controller's raw Week selected-date updates with a small revisioned transition reducer/state machine that normalizes the launch week, issues monotonic requests, accepts the current acknowledgement once, and discards duplicate, cancelled, and stale completions; verify through the pure and screen suites.
- [x] 2.3 Route the existing Today and one-shot `focusDate` behavior through the policy-week normalization path while leaving Agenda's presentation and event-source seam unchanged; prove current-week/no-op and boundary cases in the screen suite.

## 3. Build the bounded owned paging surface

- [x] 3.1 Extend `mobile/src/features/calendar/renderer` with one feature-private previous/current/next empty-page strip whose page identities derive from the committed anchor and whose offscreen neighbours are hidden from the accessibility tree; assert exactly three retained slots.
- [x] 3.2 Add a horizontal Gesture Handler pan whose transient translation stays on the UI thread, clamps movement to the adjacent slots, settles at most one direction regardless of velocity, and cancels/recenters safely on reversal, interruption, layout change, unmount, or replacement; verify deterministic behavior with the renderer suite.
- [x] 3.3 Keep no more than one pending replacement generation, release superseded generation state/timers/completions, and rebuild the same three slots around an accepted anchor without a blank or partial settled frame; expose only content-free test instrumentation needed to assert bounded retention.
- [x] 3.4 Reuse the supported Reanimated/Worklets Jest implementations; change `mobile/jest/setup-reanimated.ts` only if a narrow lifecycle wrapper is required for observable scheduling/cancellation, and run the existing animation consumer suites after any shared setup edit.

## 4. Commit screen context and accessible navigation once

- [x] 4.1 Wire swipe settlements into the screen/controller transition path so the old selected date and both headings remain committed during held motion and an accepted revision updates page/date/headings/Agenda range together; verify month/year title changes and stale-result rejection in the screen suite.
- [x] 4.2 Add previous-week and next-week actions to the owned week surface with typed French/English strings, button semantics, and 44-point iOS / 48-dp Android targets; make both use the same one-page request/settle path as gestures and verify catalog parity plus both platform branches.
- [x] 4.3 Announce only the localized accepted destination week once, suppress announcements for movement, snap-back, cancellation, duplicate/stale delivery, and hide adjacent page semantics; verify with focused accessibility spies and leave native VoiceOver/TalkBack behavior for recorded device evidence.
- [x] 4.4 Preserve the current Week/Agenda selector, Add, Agenda refresh/retry, checklist, fabricated synced/personal event activation, event-details return, full-bleed week owner, and measured Agenda lane without adding Day, grid, vertical scroll, columns, weekends, events, zoom, or alternate pager behavior; run the affected retained-behavior suites.

## 5. Reconcile contracts, current guidance, and CI proof

- [x] 5.1 Update `mobile/calendar-owned-shell.contract.test.ts` for the intended owned paging module inventory and approved motion dependencies while continuing to fail on vendor/fallback/compatibility/duplicate renderer paths, alternate pager implementation, unexpected sensitive-surface changes, or loss of the three Maestro journeys/Agenda helper; run the contract suite.
- [x] 5.2 Update `docs/mobile/architecture-book/calendar.md` and `docs/mobile/architecture-book/CHANGELOG.md` to describe the current T02 three-page, policy-driven, revisioned settled contract and the still-absent later capabilities; add no Architecture Book ADR unless implementation changes an approved costly-to-reverse boundary.
- [x] 5.3 Review D02/D04/D05/D06 and this change's delta against the implemented code, then run `openspec validate swipe-one-empty-week-at-a-time --strict`; repair the spec/design/tasks together if implementation evidence changes the approach rather than silently weakening a requirement.
- [x] 5.4 Create or update a migration inbox note tagged `(HUMAN: owner device verification)` with an immutable build/revision, fabricated Monday 2026-09-14 fixture and reset/launch steps, actual device/OS/build fields, active refresh rate for timing claims, and the exact held-drag, settle, fast-fling, reversal, controls, announcement, retention, and retained-T01 checklist; never use personal calendar content or claim unrun results.

## 6. Produce local-green and native evidence

- [x] 6.1 From `mobile/`, run every edited suite plus the focused week, transition, renderer, Calendar screen, i18n, Jest-config-if-edited, repository-contract, Maestro selector, and harness tests with exact `npm test -- --runTestsByPath ...` paths; record commands, suite/test counts, outcomes, and tested Git revision.
- [x] 6.2 Run applicable coverage including every new pure module, `npx tsc --noEmit`, `npm run lint`, scoped `npx prettier --check <edited-files>`, `npm run react-doctor:changed`, and the established Maestro selector/harness regressions; preserve all three top-level journeys and record native execution truthfully.
- [x] 6.3 On available iOS and Android runtimes, record content-free held-drag, settle, fast-fling, reversal/interruption, repeated controls, reduced-motion, settled-announcement, frame continuity, and retained-page/generation observations with exact build/device/OS and active refresh rate; do not turn simulator/unit results into physical-device, native-feel, or assistive-technology claims.
- [x] 6.4 Run a final diff audit for one-page semantics, fixed-duration date math, frame-frequency React updates, unbounded pages/generations/timers, duplicate semantic trees, event/data mutations, later-slice scope, and changes under OpenAPI/generated API, server migrations, native/store config, deployment/CI, or legacy Flutter paths.

## 7. Update the existing PR and pause for owner acceptance

- [ ] 7.1 Push the tested implementation revision to the existing draft PR and update its feature-level body with exact local/native evidence, build/fixture instructions, sensitive-surface statement, T02 limitations, and remaining owner checks; run the required disclosure scan on the exact title/body before publication and re-read the stored PR body after every write.
- [ ] 7.2 Provide the ticket-specific owner with the immutable build/revision and checklist for Monday 2026-09-14, including held heading, coherent settle, one-page fling, reversal plus previous/next, stable long paging, and the previously accepted T01 interaction; record each result and focused retest evidence on this same ticket.
- [ ] 7.3 Keep the PR unmerged and auto-merge disabled while the board-user-required owner QA and human review are pending; do not start, assign, or wake T03 until T02 has explicit owner acceptance and its PR has been human-merged.
