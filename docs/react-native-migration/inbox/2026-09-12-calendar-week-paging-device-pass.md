# (HUMAN: owner device verification) T02 empty-week paging

**For:** the human owner performing physical-device gesture and assistive-technology checks.

## Current working-tree verification target

The native month/year title is the only page header. The calendar has no secondary
full-date row or arrow buttons. Its animated viewport owns native pan events directly.
Development pages show a preview label, their Monday date key, measured width × height,
and stable week tints; these move with the finger. Screen-reader increment/decrement
actions on the adjustable canvas provide labelled next/previous navigation.
The T04 weekday/date labels belong to the week columns, without an extra date toolbar.

Historical short-release diagnostics were observed on 2026-09-13 on a physical iPhone 13 Pro
using a development build of revision `4ee9df69b9a5ef56eff3f7e00b69b7f878d9799d`.
The OS version was not recorded, so this observation is incomplete evidence and does not
confirm the corrected build, full ticket acceptance, or Android coverage.

The captured failure sequence is END at offset -42.6667 → snap-back starts → BEGAN with
the previous drag coordinates → snap-back completion reports `finished=false` at -42.6667.
The BEGAN event occurs during recognizer reset, before the logged touch-end event. Pan
activation, rather than BEGAN, owns animation cancellation and drag-origin capture.
BEGAN only records whether a new pan is eligible. A tiny touch that never activates cannot
interrupt snap-back.

Five subsequent physical-device snap-backs start at offsets -37.6667, -30.3333, -73.3333,
-58.6667, and -33. Every completion reports `finished=true` and `offset=0`.
A regression test replays END → BEGAN with stale coordinates and a subsequent tiny
BEGAN → FAILED sequence, asserting that neither cancels the running snap-back.

The corrected renderer uses a cumulative-position three-page strip and separate native
movement/state registration holders. Owner rerenders do not cancel requests. App inactivity
cancels pending motion, and new pans cannot interrupt an accepted settle. The accepted page
keeps the same physical coordinate across its replacement commit, removing the post-commit
transform jump that caused the settle-time tint flicker. This correction still requires the
owner frame-continuity retest below.

Temporary per-event logging and offset observers are absent from the renderer. No transient
runtime logs are part of the committed evidence.

Current correction checks from `mobile/`:

- `npm test -- --runInBand src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/ui/calendar-screen.test.tsx src/features/calendar/data/week-transition.test.ts src/features/calendar/data/week.test.ts calendar-owned-shell.contract.test.ts`: 5 suites, 71 tests passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run react-doctor:changed`: passed, no issues.

## Historical handoff evidence

Revision `86ae8e0c1807bb5748b425299d68ec02d81090d5` implements one-week paging on the empty
owned Calendar surface. It adds no native dependency or configuration change.

Automated evidence on that source tree:

- `npx tsc --noEmit` and `npm run lint`: passed.
- `npm test -- --coverage`: 177 suites and 1,647 tests passed; global coverage was 97.63%
  statements and 92.19% branches. The new pure week and transition modules each reached 100%
  statements, branches, functions, and lines in their focused coverage run.
- `npm run react-doctor:changed`: passed with no issues after removing manual memoization from the
  compiler-managed Calendar controller.
- The repaired Calendar screen and renderer run passed 2 suites and 33 tests. The Maestro selector
  suite passed within the full Jest run, and both shell harnesses passed independently.

No iOS runtime, Android runtime, or attached device was available on the development host. Device,
OS, build, refresh-rate, native gesture, and screen-reader results below are intentionally pending;
the automated results do not claim native feel or assistive-technology behavior.

## Build and fabricated fixture

- Build kind: development build from the immutable correction revision recorded below.
- Install: run `npm ci` from `mobile/`, then `npm run ios` or `npm run android` with a supported
  device attached.
- Reset: fully reload the development bundle so no interrupted Fast Refresh motion remains.
  Use the fabricated date fixture; no stored-calendar deletion is needed.
- Launch the deterministic Monday fixture with
  `timecalendar-dev://calendar?focusDate=2026-09-14`. The preview must show 2026-09-14 and positive viewport dimensions;
  the canvas accessibility label must name that Monday in the selected app locale.
- For retained T01 Agenda/details verification, start the repository E2E server, run
  `mobile/.maestro/01-fresh-user-import.yaml`, and use its fabricated event only.

## Environment record

- Device / OS / platform: pending owner entry.
- Build kind / revision: pending owner entry.
- Active refresh rate: pending owner entry; make no timing or smoothness claim without it.
- VoiceOver or TalkBack enabled for announcement pass: pending owner entry.

## Owner checklist

- [ ] Drag halfway and hold: preview labels and page boundaries move; the native title and
      canvas accessibility label still represent the committed week.
- [ ] Release past the threshold in each direction: the canvas, native title, and accessibility label settle on exactly
      the adjacent Monday, with no blank or partial frame.
- [ ] Fast-fling repeatedly in each direction: every accepted fling moves exactly one week.
- [ ] Reverse direction, cancel a drag, and interrupt a settle: the surface recentres or accepts
      only the latest destination, without a stale heading.
- [ ] Use the canvas Previous week and Next week screen-reader actions repeatedly: each action
      moves one week, and no duplicate announcement is heard.
- [ ] With reduced motion enabled, repeat swipe and accessibility actions: the same destination commits without
      nonessential travel animation.
- [ ] With VoiceOver or TalkBack, verify only the settled page is exposed and each accepted week is
      announced once; held, cancelled, and snap-back motion is silent.
- [ ] Page forward and back at least 40 times: responsiveness does not visibly worsen, and the
      surface continues to show only its current page and immediate neighbours.
- [ ] Repeat the accepted T01 interaction: switch Week → Agenda, open the fabricated event, return,
      use Today, and revisit Week without losing navigation or rendering behavior.

## Results and gate

- Checklist results / observations: pending owner entry.
- Focused retest revision and evidence after any finding: pending if required.
- Acceptance source and date: pending explicit owner acceptance.

The PR remains unmerged with automatic merge disabled. The next owned-renderer ticket remains
paused until this checklist, explicit owner acceptance, human review, and human merge are recorded.
