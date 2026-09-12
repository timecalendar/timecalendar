---
kind: ticket
id: T07
epic: E02
status: planned
traces-to: [P02, P07, P08, D02, D03, D07]
depends-on: [T06]
size: M
confidence: medium
---

# T07 — Use the calendar in landscape and resized windows

## Outcome

The same calendar works in portrait, landscape and tablet split/resized windows without resetting mode or clock position.

## Scope

- Change source Expo orientation/full-screen policy to the approved resizable contract while preserving iPhone/iPad families and OS floors.

- Update source and disposable-prebuild contract checks; produce a compatible fingerprinted binary for testing.

- Atomically replace geometry on window changes, cancel/settle active gestures, and preserve selected date, mode, zoom and clock position.

- Smoke-test shared navigation/chrome outside Calendar because native window policy affects the shell.

## Non-goals

Hand-edited generated projects, OTA into an incompatible binary, or redesigning other screens.

## Dependencies and delivery order

Technical prerequisites: T06. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the same calendar works in portrait, landscape and tablet split/resized windows without resetting mode or clock position.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Run app-config suites, device-contract self-test and disposable prebuild verification; record generated orientation/family/runtime proof.

- Test resize reducer snapshots; record actual phone rotation and representative compact/medium/expanded tablet windows.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides a fresh compatible binary, not only a JS reload, plus a supported tablet when available. Use an afternoon view at non-default zoom.

- [ ] Rotate both ways: selected week/day, zoom and visible clock position survive.

- [ ] Resize the tablet window repeatedly: complete columns remain aligned and week never silently changes to day.

- [ ] Rotate during a drag/pinch: it cancels or settles cleanly with no mixed layout.

- [ ] Open other tabs and return: navigation/chrome remains usable in the changed orientation.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/app.config.ts`

- `mobile/app.config.test.ts`

- `mobile/scripts/assert-ios-device-contract.mjs`

- `mobile/scripts/verify-ios-device-contract.sh`

- `mobile/src/features/calendar/renderer`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: coordinated native config and view geometry, with generated-build and physical-window uncertainty. Isolate this before dense event content.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
