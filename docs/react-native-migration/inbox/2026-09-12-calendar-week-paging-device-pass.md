# (HUMAN: owner device verification) T02 empty-week paging

**For:** the human owner performing physical-device gesture and assistive-technology checks.

## What is ready

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

- Build kind: development build from the exact revision above.
- Install: run `npm ci` from `mobile/`, then `npm run ios` or `npm run android` with a supported
  device attached.
- Reset: uninstall the app or clear its data before the pass. Do not use a personal calendar or
  production export.
- Launch the deterministic Monday fixture with
  `timecalendar-dev://calendar?focusDate=2026-09-14`. The heading must name Monday 2026-09-14 in
  the selected app locale.
- For retained T01 Agenda/details verification, start the repository E2E server, run
  `mobile/.maestro/01-fresh-user-import.yaml`, and use its fabricated event only.

## Environment record

- Device / OS / platform: pending owner entry.
- Build kind / revision: pending owner entry.
- Active refresh rate: pending owner entry; make no timing or smoothness claim without it.
- VoiceOver or TalkBack enabled for announcement pass: pending owner entry.

## Owner checklist

- [ ] Drag halfway and hold: the visible and native headings still name Monday 2026-09-14.
- [ ] Release past the threshold in each direction: the canvas and both headings settle on exactly
      the adjacent Monday, with no blank or partial frame.
- [ ] Fast-fling repeatedly in each direction: every accepted fling moves exactly one week.
- [ ] Reverse direction, cancel a drag, and interrupt a settle: the surface recentres or accepts
      only the latest destination, without a stale heading.
- [ ] Use Previous week and Next week repeatedly: controls meet the platform target, each action
      moves one week, and no duplicate announcement is heard.
- [ ] With reduced motion enabled, repeat swipe and controls: the same destination commits without
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
