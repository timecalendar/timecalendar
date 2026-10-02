**For:** whoever runs the device passes, and the human owner for the verdict and one decision
(hand feel and screen readers need a person holding the phone).

# Calendar native paging cutover (E04 T08): hand checks and the Android chained-swipe decision

## What I need

1. **Decide how Android should treat a swipe that starts while the previous page is still
   snapping** (see "Why"). Today the native snap keeps it: 3 to 5 of 20 chained swipes only
   finish the interrupted page, and about 1 chain in 8 ends without a settle. A JS re-aim was
   tried and removed.
2. **Pinch on a week with events.** The harness measures 1–13% of pinch frames within 16.7 ms on
   the `focusDate` week (P02 wants ≥95%). E05 replaces this layout-animated pinch; confirm the
   current state is acceptable on `main` until then (no release is cut before E07).
3. **VoiceOver and TalkBack** on the Calendar: the adjustable canvas pages by one week or day, the
   tiles of the committed page are reachable, and the neighbour pages are not.
4. **iPhone hardware**: rapid swipes, Today and a Day/Week switch. Only the iOS Simulator was run.

## Why

- **Cause of the dropped chained swipes on Android.** With `snapToInterval` +
  `disableIntervalMomentum`, React Native Android (`ReactHorizontalScrollView.flingAndSnap`) aims a
  lifted drag at the next page boundary **from the lift position**. Gesture Handler does not hand
  the scroll view the `ACTION_DOWN` that would stop the previous snap (`cancelPostTouchScrolling`),
  so the running snap and the new drag fight until it ends. A swipe that starts while that snap
  still has more distance left than the finger travels lands on the interrupted page.
- **Chains that end without a settle.** In about 3 of 25 harness chains (20 swipes, 150 ms apart)
  the pager came to rest with no settle report, so the committed date stayed behind the visible
  page until the next touch, which recovers it. 8 later chains with drag and momentum logging all
  settled, so the event sequence was not captured. The likely path is the same stale post-touch
  runnable: `handlePostTouchScrolling` returns early while the previous runnable is alive, so a
  slow final lift gets no snap and rests between pages (spike finding 3 describes it for
  `pagingEnabled`, which React Native also turns on natively for `snapToInterval` on Android).
- **What was tried.** Aborting the running snap at drag start and, for a drag in the same
  direction, an animated `scrollTo` one page past the interrupted target one frame after the lift.
  Chains then landed +18 to +20, but reversals were off by one or two pages and unsettled chains
  still occurred; worklet scroll commands reach the Android view through the next mount batch and
  race the native snap. It was removed (`revert(calendar): drop the Android chained-swipe re-aim`).
- **Options:** accept the native behaviour; fix it natively (a patched or wrapped
  `ReactHorizontalScrollView` that cancels the post-touch runnable on a new drag and snaps from the
  targeted page; a native change and a new binary); a UI-thread rest check that snaps a pager left
  between pages; or the owned pager R08 keeps as the fallback.
- The rest needs a person, a screen reader or an iPhone.

## How to verify

- Numbers and commands: the T08 pull request body and `mobile/perf/samples/t08-d569f309/`.
- Chained scenarios: `node perf/run.mjs ... --probe owned-calendar-canvas --logcat
  CALENDAR_PAGING --scenarios swipe-forward-20,swipe-back-20,reversal-10`
  (`mobile/perf/README.md`). A chain that did not settle shows no `settle` line at its end.

## Blocks

Nothing on `main`. The E04 evidence file and any preview build wait on these checks (P06, D08).
