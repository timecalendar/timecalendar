# (HUMAN: owner device verification) T03 full-day Calendar movement

**For:** the human owner performing physical-device gesture, clock-preference, and assistive-technology checks.

## Testable build target

The earlier `53a242f69707ebaa4c1304dda6f222f5630b27e2` build is superseded after owner testing found
blinking/missing hour lines, indistinguishable week movement, non-native vertical settlement,
and iOS content hidden beneath the Liquid Glass tab bar. Build the repaired branch head after
the implementation is committed and record that immutable revision below.

Repaired build revision: pending commit.

Automated checks from `mobile/` at the repaired working revision:

- Full Jest run under the repository's UTC test contract: 177 suites and 1,665 tests passed.
- Focused Calendar/native-pager verification: 55 tests passed.
- `npx tsc --noEmit`, lint, formatting, and `git diff --check`: passed.
- React Doctor changed-code scan: no diagnostics.
- Strict OpenSpec validation: 97 items passed.
- Metro compiled the iOS development bundle and remains healthy on port 8081.

Physical iOS/Android and assistive-technology observations remain pending below.

## Build and fabricated fixture

- Install dependencies with `npm ci` from `mobile/`, then run `npm run ios` or
  `npm run android` with a supported device attached.
- Fully reload the development bundle before testing so no Fast Refresh motion is retained.
- Launch `timecalendar-dev://calendar?focusDate=2026-09-14`. The Week surface itself is the
  fabricated empty fixture; no personal or synced calendar content is read by the renderer.
- For retained Agenda/details verification, use only the repository's fabricated import journey.

## Environment record

- iOS device / OS / physical or simulator: pending owner entry; unavailable on the development host.
- Android device / OS / physical or emulator: pending owner entry; unavailable on the development host.
- Installed build kind and exact revision: pending owner entry.
- Active refresh rate: pending owner entry; required for any timing or smoothness claim.
- VoiceOver / TalkBack and text-size setting: pending owner entry; unavailable on the development host.

Unavailable platform and assistive-technology observations remain pending here and for T28; Jest
results are not native-feel, device-clock, frame-continuity, or screen-reader claims.

## Owner checklist

- [ ] Scroll to 00:00 and 24:00 on iOS: both ends are reachable above the Liquid Glass tab bar without settled blank overscroll.
- [ ] Fling vertically and release: native momentum visibly continues, decelerates, and settles naturally.
- [ ] Slowly scroll the full day on both platforms: every hour and half-hour line remains continuously visible without blinking.
- [ ] At the top, middle, and bottom, gutter labels stay aligned with major grid lines while the native date heading remains fixed.
- [ ] From mid-afternoon, page one week horizontally in both directions: native page motion is visible, development tint/date identity changes, the gutter stays fixed, and the destination keeps the same visible clock position.
- [ ] Try slow diagonal movement, a fast diagonal, and quick reversal: only the first dominant axis moves and it does not switch during the gesture or jump on settlement.
- [ ] Begin a press-like touch, then move beyond tolerance: movement wins without a tap result.
- [ ] Change the device between 12-hour and 24-hour display and return to the app: hour labels follow the device behavior supported by that platform.
- [ ] Repeat vertical drag and fling with reduced motion enabled; verify bounded movement and no date announcement.
- [ ] Page and scroll repeatedly: only previous/current/next pages remain present and motion does not visibly degrade. Record the refresh rate with any continuity observation.
- [ ] Repeat the accepted prior interaction: page a week, use Today and screen-reader week actions, switch Week → Agenda, open the fabricated event, return, and revisit Week.
- [ ] With VoiceOver or TalkBack, verify one adjustable committed-week context, no duplicate grid semantics, one announcement per accepted week, and silence during vertical movement.

## Results and gate

- Checklist results / observations: pending owner entry.
- Focused retest build and revision after any finding: pending if required.
- Acceptance source and date: pending explicit owner acceptance.
- Human review and merged revision: pending.

Do not begin the next renderer slice until this checklist has explicit owner acceptance and the pull request has been human-merged.
