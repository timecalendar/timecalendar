---
kind: ticket
id: T01
epic: E01
status: done
traces-to: [P05, P02, D07]
depends-on: []
size: S
confidence: high
---

# T01 — Compile the calendar shell and gate per-tile onLayout

## Outcome

`OwnedCalendarShell` compiles under `babel-plugin-react-compiler@1.0.0`, and tiles attach `onLayout` only when a probe listener exists.

## Scope

- Replace `useRef(new Map()).current` (`renderer/owned-calendar-shell.tsx:194-195`) with a compiler-safe equivalent.
- Attach `onLayout` in `TimedCalendarTile` (`renderer/owned-calendar-canvas.tsx:~829`) only when `onProbeDiagnostic` is defined.

## Non-goals

- No paging or zoom change.

## Definition of done

- Production compiler run shows the shell compiled.
- Probe tests still pass.

## Acceptance and verification

- `npx tsc --noEmit`, `npx eslint src/features/calendar`, `npm test -- --coverage` in `mobile/`.
- Compiler before/after output in the PR body.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx`
- `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx`
- research/R06-code-health-and-cleanup.md §1

## Size and confidence drivers

Two known edits with a reproduced diagnosis.

## QA and sensitive surfaces

None user-visible; the dev probe must keep working.
