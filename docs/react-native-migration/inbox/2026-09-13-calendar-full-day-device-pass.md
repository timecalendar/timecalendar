# (HUMAN: owner device verification) T03 full-day Calendar movement

**For:** the human owner performing physical-device gesture, clock-preference, and assistive-technology checks.

## Testable build target

Build a development app from immutable implementation revision
`3ecc063d46c6c03c057598b69b977915905ff94d`. It renders an empty complete-day grid beside
one pinned gutter while retaining the accepted three-page week movement.

Automated checks from `mobile/` at that implementation revision:

- Six focused suites: 106 tests passed (time geometry, hour formatting, gesture decisions,
  renderer, Calendar screen/controller, and repository contract).
- Introduced pure modules: 100% statements and branches in the focused coverage report.
- `npx tsc --noEmit`: passed.
- `npm run lint -- --quiet`: passed.

The final branch-head full coverage, formatting, React Doctor, harness, OpenSpec, and CI results
are recorded on the delivery ticket and pull request after documentation-only completion.

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

- [ ] Scroll to 00:00 and 24:00: both ends are reachable without settled blank overscroll.
- [ ] At the top, middle, and bottom, gutter labels stay aligned with major grid lines while the native date heading remains fixed.
- [ ] From mid-afternoon, page one week horizontally in both directions: the gutter stays fixed and the destination keeps the same visible clock position.
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
