---
kind: epic
id: E04
status: planned
traces-to: [P01, P03, P05, D01, D02, D03, D05, D07]
depends-on: [E02, E03]
---

# E04 — The Calendar pages on the native ScrollView

## Outcome

The production Calendar pages weeks and days with the windowed native horizontal ScrollView on real data. Rapid swipes always take over, header, title and events agree, and PagerView, generation and the transition reducer are gone from the calendar.

## Demonstration

On device with a real timetable: 20 rapid swipes each way, reversal mid-settle, Today, `focusDate` deep link, day/week switch and rotation, all without remounting the scroll owner.

## Definition of done

- `evidence/E04-cutover.md` with device runs and the owner verdict.
- Specs, ADRs and the Architecture Book describe the new owner.

## In scope

- Renderer and controller cutover, tests and contract test, spec and doc updates.

## Out of scope

- Transform pinch (E05), accessibility relocation (E06).

## Risks and boundaries

`main` carries the cutover before pinch and accessibility work land; no release is cut from it until E07.

## Tickets

- T08 — Replace PagerView with the windowed native ScrollView (`T08-scrollview-paging-owner.md`)
- T09 — Port renderer tests and rewrite the contract test (`T09-renderer-tests-and-contract.md`)
- T10 — Record the new paging owner in specs and the Architecture Book (`T10-spec-adr-and-book-updates.md`)
- T08b — Recover Android pager rest and measure the chained-swipe gate (`T08b-android-rest-and-chain-gate.md`)
