## Context

T07 leaves the real Calendar route with one automatic-inset native `ScrollView`, one three-page `PagerView`, a Reanimated dated-header projection, UI-thread pinch scale in `owned-calendar-zoom`, and one monotonic geometry revision from `owned-calendar-resize`. The full 00:00–24:00 grid, its gutter labels, and every content height already derive from the live `pixelsPerHour` shared value.

Three concrete gaps remain against this slice's outcome:

1. **No fresh-open position.** `useCalendarScreenController` seeds `verticalOffset` at `0` and the canvas applies it through `contentOffset`, so a fresh Calendar opens at 00:00. Nothing in the renderer knows the current minute, and the viewport height needed to place it is only known after the first timed-viewport measurement.
2. **No clock.** `CalendarScreen` passes `currentDate={new Date()}` — a new value on every render, never advancing on its own. `canGoToToday`/`goToToday` call `new Date()` independently. So Today meaning never rolls over while the screen stays mounted, and two consumers can read different instants.
3. **No indicator.** `nowIndicatorPosition` exists in `time-grid.ts` and is consumed only by Home's mini timeline, at Home's own 07:00–21:00-shaped range. The owned renderer has none, and `calendar.md` currently states outright that the shell has no now indicator.

Two existing constraints shape the solution. `nowIndicatorPosition` is Intl-bound through `minuteOfDayInZone`, and the "UI-thread (worklet) contract" suite plus `local/no-js-call-in-worklet` pin it as the module's one JS-thread-only export — a `useAnimatedStyle` cannot call it. And `calendar-owned-shell.contract.test.ts` bans the literal strings `setInterval`/`setTimeout` anywhere in the renderer directory while also pinning that directory's exact file inventory.

## Goals / Non-Goals

**Goals:**

- Open a fresh Day or Week timeline with the current display-zone minute near 30% of the usable timed viewport, with preceding-hour context above it, clamped deterministically at the full-day bounds.
- Drive the dated-header Today cue, the Today action, and the current-time indicator from exactly one focus/foreground-aware clock value so they roll over together.
- Show the current time with a cue that survives greyscale and colour-blind viewing, in light and dark appearance.
- Update at displayed minute precision only while relevant and foreground, and release every timer on blur, background, and unmount.
- Recompute clock meaning on foreground and day rollover without moving an already mounted viewport.
- Make non-today pages and hidden weekend columns explicitly indicator-free and consistent with the Today cue.
- Produce deterministic host proof and the complete revision-bound owner checklist without claiming device results.

**Non-Goals:**

- Implementing the complete Today-button/direct-date intent (T17), event-aware auto-scroll, or event-selected initial position.
- Restoring a scroll offset across process restarts, or persisting the fresh-open position.
- Any continuous idle animation, second-precision indicator, or sweeping-line effect.
- Rendering event tiles or the all-day lane, or introducing a second/compatibility renderer.
- Converging Home's private clock in `use-home-screen-controller` onto the new seam, or changing Home's indicator presentation.
- Shipping a production or release-build clock override for QA.

## Decisions

## Decision: One controller-owned clock, injected into the renderer as a value

A new feature-owned hook `useCalendarClock` lands in `mobile/src/features/calendar/data/clock.ts` and returns one `Date`. It seeds from the current instant, then, while the Calendar route is focused **and** `AppState` is `active`, schedules a single `setTimeout` aligned to the next wall-clock minute boundary (`60_050 - (Date.now() % 60_000)`, the cadence already proven by `use-home-screen-controller`) and re-arms from each tick. Blur, an `AppState` change away from `active`, and unmount clear the pending timeout and schedule nothing. Returning to focus or foreground recomputes the value immediately and re-arms, which is the required foreground refresh. The hook takes an optional `now?: () => Date` injection point for its own unit suite; production passes nothing.

`useCalendarScreenController` consumes the hook and returns `now`. `CalendarScreen` passes `currentDate={now}` to `OwnedCalendarShell` in place of `new Date()`, and `canGoToToday`/`goToToday` read the same `now` instead of minting their own instants. The renderer therefore receives the clock as part of its presentation model and owns no timer — consistent with the approved design's renderer facade rule and with `calendar.md`'s existing "no timer or animation owner" statement for the renderer.

Minute alignment rather than a fixed 60 s interval matters twice: the indicator moves when the displayed `HH:mm` actually changes, and the tick that crosses midnight is the day-rollover recomputation, so `todayKey` needs no separate scheduler.

Alternatives considered: a timer inside `owned-calendar-coordinator` would put lifecycle work in the renderer and force the contract's timer ban to be weakened for the wrong reason; a global app-level clock provider would widen the blast radius far past this slice; `setInterval` drifts off the displayed minute and keeps firing while backgrounded on Android; passing a `() => Date` factory down to the renderer would let two consumers read two instants, which is the defect being fixed.

## Decision: Position on the first geometry snapshot, once per mount

The renderer already advances `geometryRevision` from `replaceCalendarViewportGeometry`, and `previous === null` uniquely identifies the first complete timed-viewport measurement of a mount. That transition is the one place the fresh-open position is applied: the coordinator solves the now-anchored raw offset and commits it through the existing `invalidateForGeometry`/`scrollRevision` path, without animation, exactly as a resize replacement does. Every later geometry revision keeps T07's clock-anchor-preserving behaviour untouched.

A new pure worklet in `time-grid.ts` does the arithmetic:

```
nowAnchoredRawOffset({ minuteOfDay, pixelsPerHour, geometry, viewportFraction })
```

It computes `minuteToPixel(minuteOfDay, { startMinute: FULL_DAY_START_MINUTE, pixelsPerHour })`, subtracts `topInset + viewportFraction × usableHeight`, and returns `clampRawOffset(…, geometry)` against `contentHeight = fullDayContentHeight(pixelsPerHour)`. `NOW_VIEWPORT_FRACTION = 0.3` is a named export, not a literal. The minute-of-day arrives as a number, so the helper stays Intl-free and worklet-safe like the rest of the module; only the caller touches `minuteOfDayInZone`.

Clamping is what makes the late-night checklist item pass: 00:10 clamps to the top bound `-topInset`, and 23:50 clamps to `contentHeight - viewportHeight + bottomInset`, so the indicator stays on screen and the student never has to scroll past the day to reach it. 30% from the top is what supplies the "some preceding-hour context" the outcome asks for.

Applying this once per mount is also the whole of "preserve an already mounted user viewport": a clock tick changes only the indicator, a foreground return changes only clock meaning, and a rotation keeps T07's anchor. A Day↔Week switch or an accepted date transition replaces the renderer generation but not the geometry snapshot, so it preserves the settled offset rather than re-seeking now — the accepted T05/T06/T07 behaviour, unchanged.

Alternatives considered: seeding `initialVerticalOffset` in the controller cannot work, because the usable viewport height and insets do not exist before layout; centring the current time hides the preceding hours the outcome names; scrolling to the first event would choose the position from event data, which the ticket forbids; re-seeking on every foreground return would discard the student's scroll position.

## Decision: Indicator on today's column, with a shape and a typographic cue

Inside `owned-calendar-canvas`, each page's clock plane renders an indicator only for the column whose `key` equals the coordinator's `todayKey`. A page with no matching column renders nothing, which makes non-today pages and hidden weekend columns indicator-free by construction rather than by a special case. The indicator is a full-width rule across that one column with a filled circular cap at its leading edge — the non-color **shape** cue — over the existing `theme.primary` brand colour.

The hour gutter gains one `now` chip at the same vertical offset, rendered only when the committed centre page contains today: a bordered pill showing the current `HH:mm` in the same locale/zone/device-clock convention as the gutter labels. That is the non-color **typographic** cue, and it is the one accessible node of the pair. The gutter's `accessible={false}` / `importantForAccessibility="no-hide-descendants"` props move from the gutter lane onto an inner wrapper around the 24 hour labels, so the chip can carry a localized `calendar.nowLabel` label while the hour labels stay hidden from assistive technology. Keying the chip to the committed page only means it never contradicts the native title during an unsettled drag, per the atomic-presentation rule.

Vertical placement runs through `useAnimatedStyle` calling `minuteToPixel` with the live `pixelsPerHour` shared value, so the indicator tracks pinch on the UI thread and needs no per-frame React state. The minute-of-day it positions against is a prop that changes at most once a minute. The JS-thread reads that need `visible`/`fraction` call `nowIndicatorPosition(now, displayZone, { pixelsPerHour: settledPixelsPerHour, startMinute: FULL_DAY_START_MINUTE, endMinute: FULL_DAY_END_MINUTE })` — explicit full-day bounds and the settled dynamic scale, with the helper's 07:00–21:00 defaults left alone for Home and Agenda.

No `announceForAccessibility` fires on a clock tick or rollover: announcements remain reserved for settled date/mode/zoom context.

Alternatives considered: a line spanning the whole page misstates which day "now" belongs to in Week; a colour-only rule repeats the accessibility defect T04 fixed for the Today cue and fails the light/dark checklist item; putting the time label on the line itself collides with future event tiles; announcing each rollover would make VoiceOver unusable on an idle screen.

## Decision: Replace the blanket renderer timer ban with scoped lifecycle assertions

`calendar-owned-shell.contract.test.ts` currently proves the renderer is timer-free by grepping for `setInterval|setTimeout` across the renderer directory. That text ban stays — the renderer really has no timer under this design — but it is no longer the whole proof. The contract gains positive, scoped assertions:

- the displayed-precision timer lives only in `features/calendar/data/clock.ts`, whose source is asserted to align on the minute boundary, to gate on both route focus and `AppState`, and to clear its handle on every teardown path;
- no other calendar-feature production file arms a timer;
- no calendar-feature production file uses `withRepeat`, a recursive `requestAnimationFrame`, or a repeating `withTiming` chain — the preserved ban on continuous idle animation, now checked by name instead of implied;
- the renderer directory inventory is updated for any file this slice adds.

Behavioural cleanup proof does not live in the contract grep: focused suites use fake timers to prove that blur, background, and unmount leave no pending timer and that re-focus re-arms exactly one.

Alternatives considered: deleting the renderer ban would lose a real invariant for no gain; leaving the contract untouched would let a future slice add an unbounded interval anywhere outside the renderer directory with no check at all.

## Decision: Deterministic clock scenarios are host fixtures; the device build is real-clock

Morning, late-night, midnight-rollover, hidden-weekend, non-today, and timer-cleanup scenarios are proven deterministically on the host with Jest fake timers and `jest.setSystemTime` over fabricated data, plus the injected `now` factory in the clock hook's own suite. The build handed to the owner is an ordinary real-clock build with no clock override compiled in, in any variant.

The owner's late-night and rollover checklist items are therefore performed either at the real hour or by setting the device's OS clock before launch; the handoff supplies exact steps and expected values for both. This keeps a time backdoor out of the shipped app, where it would be a correctness and support risk far larger than the checklist item it serves. If the owner prefers an in-app scenario switch, that is a separate development-tooling ticket, not a silent addition to this slice.

Alternatives considered: a `__DEV__`-gated in-app clock override still needs UI and a persisted setting, expands this S-sized slice, and leaves a shipped-code path whose absence in release builds must then itself be proven; a test-only global that production reads is exactly the "weaken a gate to make the slice pass" move the ticket forbids.

## Risks / Trade-offs

- [A clock tick re-renders the whole Calendar subtree once a minute] → the tick changes one `Date` prop; page identities, columns, geometry, and generation are unaffected, and the renderer relies on the enabled React Compiler rather than manual memoization. Focused tests assert no geometry revision, no transition request, and no scroll write on a tick.
- [The first geometry measurement could arrive more than once, or with a degenerate height] → apply the fresh-open offset strictly on the `previous === null` transition and normalize geometry through the existing resize model, whose finite/zero-inset recovery is already covered.
- [A late-night clamp could make the indicator look pinned to the bottom edge] → the clamp is the specified behaviour, the indicator stays reachable, and the checklist item names exactly that expected outcome rather than 30%.
- [Foreground return after a long background could land on a different day] → the rollover path recomputes `todayKey` and the indicator from the same tick; the committed anchor and scroll position deliberately do not move, and the Today action remains the way to travel.
- [Weekends hidden with a weekend clock leaves no indicator at all] → this is specified and tested as agreement between the Today cue and the indicator, not as a missing indicator, and it is an explicit owner checklist row.
- [Android background timers] → clearing on `AppState` away from `active` plus on blur is the cancellation requirement; the focused suite proves no pending handle survives either edge.
- [The host cannot run simulator or device acceptance] → record deterministic host proof only, supply exact build and fabricated-fixture instructions, and never convert an unavailable device check into a pass.

## Migration Plan

1. Add the pure `nowAnchoredRawOffset` helper and `NOW_VIEWPORT_FRACTION` to `time-grid.ts` with full table/property coverage, keeping the worklet contract suite's JS-thread-only set unchanged at `nowIndicatorPosition`.
2. Add `data/clock.ts` and its suite (focus, foreground, minute alignment, rollover, cleanup, injected `now`), and export it through the calendar data barrel.
3. Wire the clock through the controller and screen, replacing every ad hoc `new Date()` on the Today path.
4. Apply the fresh-open offset on the first geometry snapshot in the coordinator, then render the indicator and gutter chip in the canvas with EN/FR keys and the gutter accessibility restructure.
5. Extend renderer, screen, and contract suites; update `calendar.md`, `testing.md` where the clock seam is named, and the Architecture Book `CHANGELOG.md`.
6. Run every edited suite plus the pure coverage run, `npx tsc --noEmit`, `npm run lint`, scoped Prettier, and `npm run react-doctor:changed`; record exact commands and results.
7. Update the canonical T08 execution-evidence section with results actually produced, supply the complete owner checklist against the exact revision/build, and pause on this ticket for explicit owner acceptance before Reviewer merge.

Rollback is a source revert to the accepted T07 revision. No persisted data or schema is involved; the shared zoom preference, the Day/Week/Agenda choice, and stored events remain readable, and no native configuration or fingerprint changes, so no fresh binary is required for rollback.

## Open Questions

- The exact owner device model, OS, and build identifier are recorded when device evidence runs; they do not change the source contract.
- Whether Home's private clock later converges on `useCalendarClock` is deliberately left open; this slice neither changes Home nor claims that convergence.
