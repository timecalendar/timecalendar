---
kind: ticket
id: T12
epic: E03
status: planned
traces-to: [P01, P02, P04, D02, D05, D06]
depends-on: [T11]
size: M
confidence: low
---

# T12 — Navigate the populated calendar accessibly

## Outcome

A person using a screen reader, voice or switch controls can reach the current timed classes once in chronological order, including off-viewport events.

## Scope

- Complete one ordered native event tree tied to the committed model, with bounded reachability beyond visually mounted tiles.

- Preserve focus by event identity across paging/mode changes and otherwise use the relevant date heading; announce settled context once.

- Verify visible and semantic targets share meaningful activation geometry; include existing page and zoom alternatives, full labels and largest-text behavior.

- If the approved tree cannot satisfy the contract, stop this slice, document the failure and request the scoped D06 revision before adding a different strategy.

## Non-goals

A separate agenda destination for accessibility, duplicate hidden focus trees, or final all-day/failure accessibility acceptance.

## Dependencies and delivery order

Technical prerequisites: T11. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a person using a screen reader, voice or switch controls can reach the current timed classes once in chronological order, including off-viewport events.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Automate chronological order/content independent of zoom, no duplicate identities, recycling focus and logical fallback.

- Perform recorded native VoiceOver/TalkBack, Voice Control and Switch Control checks with offscreen/dense fixtures; reduce uncertainty before accepting the slice.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies a script and fake events at 01:00, 10:00 and 23:00 plus the overlap fixture. Enable the relevant assistive tool on the agreed device; record missing platform passes for explicit follow-up.

- [ ] Move through the calendar: hear each reachable timed event in date/time order once.

- [ ] Reach the 01:00 and 23:00 events even when their tiles begin outside the viewport.

- [ ] Zoom and change mode: reading order and complete labels do not change.

- [ ] Use page and zoom controls without swiping or pinching.

- [ ] Activate an event with voice/switch controls: the intended visible class opens.

- [ ] Return to Calendar after details/paging: focus lands on the surviving event or relevant date heading.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `docs/mobile/architecture-book/accessibility.md`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M scope but low confidence in bounded offscreen native semantic reachability and activation geometry. Raise confidence through an early populated native probe within this ticket; do not implement further dependent content while it fails.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Implementation and local automated checks passed on code head
`86728d17d9cb286611e35ac86681efe0a33eaba4` in PR #428. The final documentation
head and its CI result are recorded in the issue handoff. No native assistive-technology
build, pass, or merge is recorded here.

- `cd mobile && npx tsc --noEmit && npm run lint && npm test -- --coverage`:
  passed, 210 suites and 2,020 tests. Global coverage: 4,889/4,973 lines (98.31%)
  and 3,210/3,467 branches (92.59%). The introduced pure accessibility projection
  covered 26/26 statements and 16/16 branches.
- Focused renderer, Calendar screen, and owned-shell contract suites: 3 suites and
  117 tests passed. `npm run react-doctor:changed` reported no issues.
- Changed source/test/documentation Prettier check, `openspec validate
navigate-populated-calendar-accessibly --strict`, `bash -n
scripts/accessibility-probe.sh`, `bash e2e/test_run_e2e.sh`, and
  `bash e2e/test_ci_mobile_e2e.sh` passed. The disclosure scan reported zero
  findings before publication.
- The PR's `Run mobile checks` CI job passed on the exact code head above.
  Remaining PR jobs and the final documentation-head result are checked at handoff.
- The fabricated probe contains 11 events: ten on 15 June 2026 and one on the
  next date. It starts at a 09:00 vertical offset, with 01:00 and 23:00 targets
  outside the starting viewport. Component tests retain and activate the
  committed-page targets at 40, 60, and 120 pixels per hour; an offscreen
  23:00 focus restoration scrolls the existing vertical owner to its target
  before requesting native focus. These are host assertions, not device
  traversal or measured native target frames.

Native execution is pending in final QA. The probe operator guide is
`mobile/src/test-support/owned-calendar/accessibility-probe.md`. Every row
below is **pending and unverified** on actual iOS and Android builds:

- [ ] Record device, OS, installed build/commit, and assistive tool.
- [ ] Traverse each timed event once in chronological order, including 01:00
      and 23:00 outside the starting viewport.
- [ ] Preserve complete labels and order through zoom and Day/Week changes;
      operate page and zoom controls without swipe or pinch.
- [ ] Activate ordinary, overlapping, and tiny visible events with voice and
      switch controls; record target frames and confirm the routed original UID.
- [ ] Return after details and paging; verify focus on the surviving identity
      or relevant committed date heading.
- [ ] Repeat at largest text with dense overlap and repeat prior interactions
      touched by this slice, recording any regression.

Any native finding requires a concrete rework result; unreachable or ambiguous
conflict activation returns to the scoped D06 revision path. ADR 061 and the
changed Calendar Architecture Book rule require explicit Reviewer scrutiny.
