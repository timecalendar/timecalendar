# (HUMAN: owner device verification) T06 Calendar zoom

## Testable revision and scope

Runtime revision: `132fae89b819a6be0d343d574241a900898bd3d2`.

Use the exact pull-request head containing that runtime revision for the installed development
build. The implementation uses Expo `~56.0.11`, React Native `0.85.3`, Gesture Handler `~2.31.1`,
Reanimated `4.3.1`, and Expo UI `~56.0.17` on Node `24.13.0`.

The initial zoom experiment uses 40 px/hour minimum, 60 px/hour default, 120 px/hour maximum,
and 10 px/hour menu steps. Populated-event density tuning remains assigned to T25.

Host automation proves the focal equation, raw-offset and scale clamps, moving focal points,
repeated commands, cancelled and obsolete settlements, dynamic three-page geometry, shared
Day/Week persistence, reset and corrupt-value recovery, accessible menu states and announcements,
Agenda independence, and renderer ownership. It does not claim native gesture feel, visual focal
drift, release stability, platform chrome, timing, or assistive-technology results.

## Build and fabricated setup

- From `mobile/`, run `npm ci`, then `npm run ios` or `npm run android` with a supported device.
- Fully reload the development build and open Calendar on an empty fabricated week.
- Set Day or Week to 60 px/hour with Reset, place 12:00 near the timed viewport center, and use
  that line as the marked reference hour.
- Keep the dated header visible while testing vertical motion, horizontal partial paging, pinch,
  and menu actions. Use only fabricated data for the retained Agenda/details check.

The three existing Maestro journeys and their Agenda helper remain unchanged. The selector suite
and both device-free shell harnesses pass; no fourth top-level journey, retry, or weakened selector
was added.

## Automated verification at the runtime revision

Run from `mobile/` unless stated otherwise:

- `npx tsc --noEmit && npm run lint && npm test -- --coverage`: passed; 177 suites and 1,748 tests,
  with the configured coverage gates satisfied.
- `npx jest src/features/calendar/renderer/owned-calendar-shell.test.tsx
src/features/calendar/ui/calendar-screen.test.tsx calendar-owned-shell.contract.test.ts
--runInBand --coverage`: passed; 3 suites and 74 tests. The renderer integration emits repeated
  delayed vertical and horizontal completions after one pinch, keeps the focal result/header
  stable, and proves each native owner reopens only for a new gesture epoch.
- `npx prettier --check` over every changed TypeScript, TSX, setup, and locale file: passed.
- `npm run react-doctor:changed`: passed with no diagnostics across 26 changed files.
- `bash e2e/test_run_e2e.sh`: passed.
- `bash e2e/test_ci_mobile_e2e.sh`: passed.
- From the repository root, `openspec validate zoom-owned-calendar-grid`: passed.
- From the repository root, `git diff --check`: passed.

Native iOS/Android execution is unavailable on this host. Those axes are explicitly deferred to
T28 as pending evidence; host automation is not substituted for them, and their unavailability is
not a feature-completion blocker. Any failure observed on an executed device case is T06 rework
and must be retested on the repaired revision.

## Environment record

- iOS device / OS / physical or simulator: pending owner entry; unavailable on this host.
- Android device / OS / physical or emulator: pending owner entry; unavailable on this host.
- Installed build kind and exact revision: pending owner entry.
- Active refresh rate and low-end timing observation: pending owner entry when available.
- French/English language and text-size settings: pending owner entry.
- VoiceOver/TalkBack and reduced-motion settings: pending owner entry.

## Owner checklist

- [ ] Pinch around the marked 12:00 reference hour and confirm it stays under the fingers without
      focal drift or a release jump.
- [ ] Use Zoom in, Zoom out, and Reset; confirm the clock time at the usable viewport center stays
      stable and Reset returns to 60 px/hour.
- [ ] Reach 40 and 120 px/hour; confirm the matching action disables and communicates the limit.
- [ ] Start a vertical drag, add a second finger, and confirm pinch takes ownership without a
      press result, release jump, or unintended week movement.
- [ ] Repeat while vertical momentum is active; record focal drift, release behavior, dated-header
      alignment, and any low-end timing observation.
- [ ] Start a horizontal drag, add a second finger, and confirm pinch takes ownership without a
      page commit, delayed week change, or header/grid mismatch.
- [ ] Repeat during horizontal settle and from a partial page; confirm no obsolete page commit or
      zoom settlement changes the final date or geometry.
- [ ] Switch Day/Week and fully restart; confirm the shared zoom persists while Agenda remains
      independent and Reset returns both timed modes to 60 px/hour.
- [ ] With VoiceOver and TalkBack, confirm menu actions, disabled limits, and one rounded-percentage
      announcement per successful menu command; confirm pinch does not announce every frame.
- [ ] Repeat the touched accepted interactions: vertical scroll/momentum, horizontal paging,
      centered dated header, weekend preference, Today, Agenda, and fabricated event details.

## Results and gate

- Checklist results / observations: pending owner entry.
- Focused retest build and revision after any finding: pending if required.
- Acceptance source and date: pending explicit owner acceptance of the exact tested pull-request
  head; no reply is not acceptance.
- Reviewer verdict and merged revision: pending after owner acceptance and green checks on that
  exact head.
