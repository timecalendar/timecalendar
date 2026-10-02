**For:** whoever runs the device passes, and the human owner for the verdict (hand feel and
screen readers need a person holding the phone).

# Calendar native paging cutover (E04 T08): hand checks and one Android decision

## What I need

1. **Android chained swipes, by hand** (OnePlus 6, perf or dev build of the T08 merge). Swipe
   forward quickly several times, each swipe starting before the previous page has settled, then
   the same backwards, then alternate directions mid-settle. Say whether the re-aimed settle feels
   native or whether you would rather lose the occasional swipe (see "Why").
2. **Pinch on a week with events.** The harness measures 1–13% of pinch frames within 16.7 ms on
   the `focusDate` week (P02 wants ≥95%). E05 replaces this layout-animated pinch; confirm the
   current state is acceptable on `main` until then (no release is cut before E07).
3. **VoiceOver and TalkBack** on the Calendar: the adjustable canvas pages by one week or day, the
   tiles of the committed page are reachable, and the neighbour pages are not.
4. **iPhone hardware**: rapid swipes, Today and a Day/Week switch. Only the iOS Simulator was run.

## Why

- **Android chained swipes.** With `snapToInterval` + `disableIntervalMomentum`, React Native
  Android (`ReactHorizontalScrollView.flingAndSnap`) aims a lifted drag at the next page boundary
  from the lift position. Gesture Handler does not hand the scroll view the `ACTION_DOWN` that would
  stop the previous snap, so a swipe that starts while that snap is still running mostly finishes
  the interrupted page: 4 of 20 chained swipes were lost in the spike and on the first T08 build.
  T08 aborts the running snap when such a drag starts and, when the drag continues in the same
  direction, re-aims the settle one page past the page the interrupted snap was heading to (an
  animated `scrollTo` one frame after the lift). Reversals keep the native snap. Harness result on
  `2cc9ff0b`: 20/20 forward, 19/20 backward, reversals exact, 5/5 flings, 20/20 diagonals. The
  re-aimed settle uses React Native's fixed-duration scroll animation instead of the fling physics,
  which only a hand can judge.
- The rest needs a person, a screen reader or an iPhone.

## How to verify

- Numbers and commands: the T08 pull request body and `mobile/perf/samples/t08-2cc9ff0b/`.
- To drop the re-aim, remove the `aimsChainedSwipes` branch in
  `mobile/src/features/calendar/renderer/owned-calendar-pager.ts` (one commit,
  `fix(calendar): re-aim only same-direction Android chained swipes`, plus its predecessor).

## Blocks

Nothing on `main`. The E04 evidence file and any preview build wait on these checks (P06, D08).
