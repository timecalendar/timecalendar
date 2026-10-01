---
kind: epic
id: E03
status: done
traces-to: [P03, P02, P05, D02, D03, D05, D07]
depends-on: [E01]
---

# E03 — Page identity and windowed data in calendar/data

## Outcome

Pure, fully tested modules in `calendar/data` map page indexes to dates, plan the window and re-base, reduce settlement, read events in sequence-guarded chunks with explicit page status, and build each page presentation once.

## Demonstration

Jest suites show out-of-order chunk completion filling the right page, loading never presented as empty, DST and `firstWeekday` correctness, and bounded caches after 500 crossings.

## Definition of done

- 90% per-file branch coverage under `npm test -- --coverage`.
- No production renderer wiring yet; existing screens unchanged.

## In scope

- `EpochDay` index↔anchor, window and re-base planning, settlement reducer.
- `CalendarWindowStore`, page status, diagnostics leak fix.
- `PagePresentation` cache and single builder pass.

## Out of scope

- Renderer changes, agenda changes.

## Risks and boundaries

Chunk read cost on the OnePlus 6 is unmeasured (A4); measure with the E02 harness once wired.

## Tickets

- T05 — Page index, window plan and settlement reducer (`T05-page-index-window-and-settlement.md`)
- T06 — Chunked window store with explicit page status (`T06-calendar-window-store.md`)
- T07 — Frozen per-page presentation cache (`T07-page-presentation-cache.md`)
