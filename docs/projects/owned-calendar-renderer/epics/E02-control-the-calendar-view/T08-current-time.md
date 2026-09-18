---
kind: ticket
id: T08
epic: E02
status: planned
traces-to: [P01, P02, P05, D01, D02, D08]
depends-on: [T07]
size: S
confidence: high
---

# T08 — Find the current time when opening Calendar

## Outcome

A fresh timeline opens around the current clock time and shows a current-time indicator with a non-color cue.

## Scope

- Use the effective display timezone and position current time around 30% from the viewport top, clamped to the full-day bounds.

- Update the indicator only at displayed precision while relevant/foreground, and recompute on foreground/day rollover.

- Preserve accepted mode/zoom rules; do not restore old process scroll offsets or choose the initial position from events.

- Reuse T04's outlined/typographic Today date cue. Drive it and the time indicator from one injected,
  foreground/focus-aware clock so both roll over together without resetting an already mounted view.
- Pass explicit 00:00–24:00 bounds and the accepted dynamic scale to `nowIndicatorPosition`;
  shared helper defaults remain 07:00–21:00 for other consumers. Make non-today-page and hidden
  weekend-column visibility explicit in the slice tests and owner-reviewed presentation.
- Position against the measured timed viewport and native inset convention. Background/tab changes
  stop unnecessary recurring work; return refreshes clock meaning, not the user's scroll position.
- Evolve the repository contract's blanket renderer timer prohibition into scoped lifecycle/cleanup
  assertions for the displayed-precision timer. Preserve the ban on continuous idle animation.

## Non-goals

Today button/direct date intent implementation, event-aware auto-scroll and continuous idle animation.

## Dependencies and delivery order

Technical prerequisites: T07. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a fresh timeline opens around the current clock time and shows a current-time indicator with a non-color cue.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Use an injected clock to prove fresh positioning, day boundaries, non-today visibility and foreground timer cleanup.

- Check that leaving/backgrounding Calendar cancels unnecessary recurring work.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies deterministic morning/late-night clock scenarios through test support and a normal real-clock build.

- [ ] Open Calendar fresh: current time is visible with some preceding-hour context.

- [ ] At late-night/early-morning bounds: the indicator remains reachable without scrolling past the day.

- [ ] Switch away/background and return: current time is correct without resetting an already mounted viewport unnecessarily.

- [ ] Check light/dark appearance: the indicator and Today cue do not rely on color alone.

- [ ] Use a weekend clock with weekends hidden and cross midnight: Today meaning and indicator visibility agree without an unsolicited scroll reset.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Baseline and regression checks

Use [E01 completion and implementation baseline](../../research/results/E01/completion.md).
Preserve native pager/header synchronization, three-page retention, one vertical scroll owner,
weekend preferences and Agenda/details access. Run affected screen/renderer/repository-contract
suites; update milestone-specific assertions only for this ticket's new behavior.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and fetched `origin/main` at
`d293988e9dbf64a592388c8796e816fe65f49e46` on 2026-09-14. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

S: small visible indicator using accepted geometry and effective-zone helpers. Known clock injection and cleanup patterns give high confidence.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Implementation and host verification were completed on 2026-09-18 at revision
`0fff05bc931d32541004e2c826ceab8c6f4bda95`. The acceptance build is the normal mobile
application from that revision: it uses the production real-clock path and contains no clock
override. This host has no native simulator or emulator, so no installable native build or
physical-device result is claimed here.

### Automated verification

- `npm test -- --runTestsByPath src/features/calendar/data/time-grid.test.ts src/features/calendar/data/clock.test.ts src/features/calendar/data/format.test.ts src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/ui/calendar-screen.test.tsx calendar-owned-shell.contract.test.ts src/i18n/i18n.test.tsx --runInBand` — passed: 7 suites, 179 tests.
- `npm test -- --runTestsByPath src/features/calendar/data/time-grid.test.ts src/features/calendar/data/clock.test.ts src/features/calendar/data/format.test.ts --coverage --collectCoverageFrom='src/features/calendar/data/{clock,time-grid,format}.ts' --runInBand` — passed: 3 suites, 93 tests; 100% lines for all three modules, 100% branches for the clock and time-grid modules, and 95.23% branches for formatting.
- `npm test -- --coverage` — passed: 180 suites, 1,814 tests.
- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with zero warnings, including the calendar worklet rule.
- `npm run react-doctor:changed` — passed with no issues.
- `mobile/node_modules/.bin/prettier --check <changed TypeScript, JSON, Markdown, and OpenSpec files>` — passed.
- The Maestro inventory diff is empty; the existing three-journey inventory is unchanged.

The host suites use fabricated calendar rows and fixed injected instants for morning, midnight,
early-day, late-day, non-today, and hidden-weekend cases. They also prove timer teardown on blur,
background, and unmount; one timer after refocus; shared Today/indicator rollover; full-day clamping;
and preservation of the mounted viewport after clock and foreground updates.

### Owner acceptance checklist

Use the normal build identified above with representative fabricated events before and after the
current time. These rows require an owner device and remain pending; automated evidence is not a
substitute for the presentation check.

- [ ] Fresh open: force-stop the app, open Calendar, and confirm the current-time chip and shaped
      rule are visible around 30% from the top with preceding-hour context.
- [ ] Bounds: before each fresh launch, set the device clock first to approximately 00:10 and then
      23:50; confirm the indicator remains reachable and the view cannot scroll beyond 00:00–24:00.
- [ ] Lifecycle: scroll to a deliberate offset, switch tabs and background the app, advance the
      device clock by at least one displayed minute, then return; confirm the displayed time is
      current and the mounted viewport did not reset.
- [ ] Non-color cues: repeat in light and dark appearance; confirm the indicator has a leading cap,
      rule, and bordered typographic time chip, and that Today retains its outlined typographic cue.
- [ ] Hidden weekend rollover: hide weekends, set the device clock just before a Friday-to-Saturday
      or Saturday-to-Sunday midnight, and cross midnight; confirm Today meaning and indicator
      visibility agree and no unsolicited scroll reset occurs.
- [ ] Regression pass: repeat the accepted T04–T07 interactions—three retained pages, pinned-header
      paging synchronization, day/week switching, bounded zoom, resize/rotation anchoring, Agenda,
      and event details—and record any regression before accepting.

Explicit owner acceptance and merge are not yet recorded. Reviewer merge remains gated on those
device rows and green checks for the exact final PR head.
