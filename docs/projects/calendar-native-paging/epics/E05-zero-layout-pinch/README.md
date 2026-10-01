---
kind: epic
id: E05
status: planned
traces-to: [P02, D04]
depends-on: [E04]
---

# E05 — Pinch and paging within the frame budget

## Outcome

Pinch runs with transforms only and commits layout once at the end; every gesture meets the P02 thresholds on the OnePlus 6 and the iPhone.

## Demonstration

The E02 harness on a release APK shows the P02 table met; Perfetto shows no Fabric commits during pinch or fling.

## Definition of done

- `evidence/E05-frame-budget.md` with harness output and the owner verdict.

## In scope

- Transform pinch, tile text behaviour during pinch, view budget, focus observer per page if allowed.

## Out of scope

- New zoom features.

## Risks and boundaries

The synchronous UI-props flags have known issues fixed after Reanimated 4.3.1 (#8810, #10631).

## Tickets

- T11 — Transform-only live pinch with layout commit at the end (`T11-transform-pinch.md`)
