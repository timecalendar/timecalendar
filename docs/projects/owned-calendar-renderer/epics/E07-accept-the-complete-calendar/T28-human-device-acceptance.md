---
kind: ticket
id: T28
epic: E07
status: planned
traces-to: [P01, P02, P03, P04, P05, P07, D03, D04, D06, D08]
depends-on: [T27]
size: M
confidence: medium
---

# T28 — Complete the human device and accessibility matrix

## Outcome

The completed calendar passes recorded human accessibility, gesture and supported-device/window checks, including every explicitly deferred intermediate check.

## Scope

- Execute the full binding phone matrix, minimum-OS compatibility smoke targets and identified iOS/Android tablet window cases.

- Cover French/English, both themes, Paris/New York/Tokyo, largest text, reduced motion, increased contrast and VoiceOver/TalkBack/Voice Control/Switch Control.

- Retest cumulative gestures, focus/recovery, all-day expansion, dense targeting and meaningful event details on the accepted fixtures.

- Close each deferred intermediate QA item and record product-owner plus engineering/accessibility acceptance; do not create an extra implementation dump here.

## Non-goals

Assuming an unrun matrix passed, replacing human tests with agent inspection or blanket acceptance of lower-severity defects.

## Dependencies and delivery order

Technical prerequisites: T27. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the completed calendar passes recorded human accessibility, gesture and supported-device/window checks, including every explicitly deferred intermediate check.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Record checklist results/build/device/tester per required case and explicit failure retests; assign concrete devices before executing.

- Re-run automated regressions after any fixes and keep physical checks distinct from simulator/API-floor smoke checks.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent prepares an executable matrix and coordinates available human testers/devices. Binding phones: Galaxy A16 5G, iPhone SE 3, Galaxy S23, iPhone 15 Pro; tablet identities and actual OS versions must be recorded. Missing hardware prevents claiming that case passed.

- [ ] Run the supplied matrix and complete every remaining device/accessibility/window case.

- [ ] Navigate and activate every required action without pinch/swipe, with full labels and logical focus.

- [ ] Test dense events, maximum text, collapse/removal and injected failure recovery with assistive tools.

- [ ] Confirm gesture feel, orientation/resizing and low-end responsiveness remain good on the physical builds.

- [ ] Review all failures/retests and explicitly accept the completed behavior; unresolved required cases remain open.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `docs/projects/owned-calendar-renderer/research/technical-acceptance-plan.md`

- `docs/mobile/architecture-book/accessibility.md`

- `mobile/scripts`

- `mobile/.maestro`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M verification scope; medium confidence because device/tester availability is unknown and actual human failures may require focused repair tickets. This is cumulative confirmation, not the first owner test.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
