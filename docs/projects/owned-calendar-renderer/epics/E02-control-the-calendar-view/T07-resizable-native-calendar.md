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

- Extend existing header-width cancellation to complete timed-viewport width/height changes.
  Snapshot date, mode, scale and clock anchor coherently; invalidate stale pager/header/pinch
  completions and clamp against the resized native viewport without resetting clock position.
- Preserve one vertical native owner and automatic insets, including Liquid Glass tab-bar reachability.
  Recheck header/grid alignment at five, seven and one columns, including height-only window changes.

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

- [ ] Resize height without changing width and scroll to 24:00: the last boundary remains reachable above native chrome.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Baseline and regression checks

Use [E01 completion and implementation baseline](../../research/results/E01/completion.md).
Preserve native pager/header synchronization, three-page retention, one vertical scroll owner,
weekend preferences and Agenda/details access. Run affected screen/renderer/repository-contract
suites; update milestone-specific assertions only for this ticket's new behavior.

## Likely work sites and reading

- `mobile/app.config.ts`

- `mobile/app.config.test.ts`

- `mobile/scripts/assert-ios-device-contract.mjs`

- `mobile/scripts/verify-ios-device-contract.sh`

- `mobile/src/features/calendar/renderer`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and fetched `origin/main` at
`d293988e9dbf64a592388c8796e816fe65f49e46` on 2026-09-14. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: coordinated native config and view geometry, with generated-build and physical-window uncertainty. Isolate this before dense event content.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Implementation host evidence was produced on 2026-09-17; the exact pushed revision and final
command results are recorded in the issue handoff. Source config resolves `orientation: default`,
retains iPhone+iPad and both OS floors, and keeps fingerprint runtime isolation. Disposable clean
preview prebuild proved iOS families `1,2`, portrait plus both landscapes,
`UIRequiresFullScreen=false`, iOS 16.4, Android API 24, and an unlocked/resizable main activity.

Resolved SDK 56 fingerprints (T06 predecessor → T07) are:

| Platform | Lane       | T06 predecessor                            | T07                                        |
| -------- | ---------- | ------------------------------------------ | ------------------------------------------ |
| iOS      | preview    | `528a496b844aa35f469d21ab8950c7db3f0b382b` | `1fc4682e04c9d0029f21d38e6ed4cf359c6da8f3` |
| iOS      | production | `bc617dff81b2f6592fd4e54b51fbd3c9c8937fc0` | `b8ba89537f053eef31ca7c77a0ade94109b85e53` |
| Android  | preview    | `ed259cbefbe0cf6acc290ce242b547e69fb9a6a6` | `9ec6cd2ff58e8553743766ff79963abdfb75683e` |
| Android  | production | `c6eafecd2ef61472381bfb8f663f36753918434f` | `2aa708357e46636cd088a6fdcfaf169a65f5d16b` |

All lanes require fresh compatible binaries; no OTA, build, upload, submission, promotion, or
rollout was performed. Physical rotation/resized-window evidence and explicit owner acceptance are
not claimed. The exact-build worksheet and complete checklist are in
`docs/react-native-migration/inbox/2026-09-17-t07-resizable-calendar-device-evidence.md`, with
unavailable hardware execution explicitly deferred to T28.
