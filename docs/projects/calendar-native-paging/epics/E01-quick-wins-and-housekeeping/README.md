---
kind: epic
id: E01
status: done
traces-to: [P05, P02, D07, D08]
depends-on: []
---

# E01 — Quick wins and planning housekeeping

## Outcome

The calendar shell compiles under the production React Compiler, tiles stop emitting layout events, and OpenSpec, the owned-renderer tickets and the mobile rules pointer describe what is actually merged.

## Demonstration

The PR body shows the production compiler output for `owned-calendar-shell.tsx` before (bail-out) and after (compiled). `openspec/specs/mobile-calendar-timeline/spec.md` contains the zoom and local-event requirements.

## Definition of done

- Both PRs merged to `main` with CI green.
- `npm test -- --coverage`, lint and tsc pass.

## In scope

- The two-line shell compile fix and the `onLayout` gate.
- Archiving T06/T09 OpenSpec changes, reconciling owned-renderer T05–T12 statuses, fixing `.claude/rules/mobile.md`.

## Out of scope

- Any paging, pinch or data change.

## Risks and boundaries

Archiving may reveal an incompletely implemented change; it is then reported, not archived.

## Tickets

- T01 — Compile the calendar shell and gate per-tile onLayout (`T01-compile-shell-and-gate-tile-layout.md`)
- T02 — Archive merged calendar changes and fix stale pointers (`T02-planning-housekeeping.md`)
