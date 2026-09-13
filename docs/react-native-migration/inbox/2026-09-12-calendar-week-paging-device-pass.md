# (HUMAN: owner device verification) T02 empty-week paging

**For:** the human owner performing physical-device gesture and assistive-technology checks.

## Testable build target

The immutable corrected source revision is
`763ae5d20f99fa8d296d1ae8e2adcfce388acaeb`. Build a development app from that
revision for the pending owner checks; no native result below is attributed to a different
build.

The native month/year title is the only page header. The calendar has no secondary
full-date row or arrow buttons. Its animated viewport owns native pan events directly.
Development pages show a preview label, their Monday date key, measured width × height,
and stable week tints; these move with the finger. Screen-reader increment/decrement
actions on the adjustable canvas provide labelled next/previous navigation.
The T04 weekday/date labels belong to the week columns, without an extra date toolbar.

Automated checks from `mobile/`:

- `npm test -- --runInBand src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/ui/calendar-screen.test.tsx src/features/calendar/data/week-transition.test.ts src/features/calendar/data/week.test.ts calendar-owned-shell.contract.test.ts`: 5 suites, 71 tests passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run react-doctor:changed`: passed, no issues.
- `npm test -- --coverage`: 177 suites and 1,658 tests passed; global coverage was 97.64%
  statements and 92.12% branches.

These commands ran against immutable source revision
`763ae5d20f99fa8d296d1ae8e2adcfce388acaeb`. The focused renderer test verifies that the
destination animation target and replacement strip position keep the same page at the viewport
origin, while the screen test pages beyond the initial slots in both directions.

## Build and fabricated fixture

- Build kind: development build from revision
  `763ae5d20f99fa8d296d1ae8e2adcfce388acaeb`.
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

- Device / OS / platform: pending owner entry; no corrected native result is claimed yet.
- Installed build / revision: pending owner build from
  `763ae5d20f99fa8d296d1ae8e2adcfce388acaeb`.
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
