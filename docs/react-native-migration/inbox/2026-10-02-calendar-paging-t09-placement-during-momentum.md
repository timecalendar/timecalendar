**For:** whoever runs the device passes, then whoever owns the Calendar pager next (only a real
device shows which scroll events a native fling sends when it is interrupted).

# Calendar pager: a placement during momentum may never settle (E04 T09)

## What I need

1. **Check on both platforms** whether the horizontal pager sends `onMomentumScrollEnd` when a
   fling is still decelerating and the app places the pager with `scrollTo` (for example: fling
   toward next week, then press Today before the page lands).
2. **If it does not**, make a placement end the pager's momentum (or settle when the placed offset
   is aligned) in `mobile/src/features/calendar/renderer/owned-calendar-pager.ts`, then un-skip the
   test named below.

## Why

The pager's UI-thread `momentum` flag is set by `onMomentumBegin` and cleared only by
`onMomentumEnd` or a new drag. The `place` worklet does not touch it. A page settles only when no
drag or momentum is active and the offset is page-aligned. So if the native view stops the fling
for `scrollTo` without a momentum end, the pager stays "moving": the heading follows the Today
action (it comes from the controller), but the previous week stays the committed page, keeps the
live, accessible tiles, and no context announcement happens until the next touch.

Jest cannot tell which native behaviour is real. The skipped test
`calendar-screen.test.tsx` › "lets Today supersede a fling stopped by the placement without a
momentum end" fails today (Today's page is never committed). The sibling test, where a momentum end
does arrive at the placed week, passes.

The fix is small, but it belongs in the pager file that T08b is changing for Android settle
robustness, so T09 (tests only) left it.

Evidence: with the test un-skipped, `TZ=UTC npx jest src/features/calendar/ui/calendar-screen.test.tsx`
fails with `Unable to find an element with testID: owned-calendar-page-week:20619` (Today's page
is mounted but hidden from accessibility, so it is not the committed page).

## How to verify

On each platform, fling toward next week and press Today before the page lands. Today's week
must become the committed page: its events are focusable by VoiceOver/TalkBack and the heading
is announced once. In Jest, the skipped test passes once un-skipped.

## Blocks

Nothing on `main`; it should be resolved before the E07 release gate.
