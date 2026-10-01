---
kind: ticket
id: T14
epic: E07
status: planned
traces-to: [P05, D07]
depends-on: []
size: M
confidence: high
---

# T14 — Remove remaining renderer smells

## Outcome

No `forwardRef`, per-page `Modal`, dev overlay, `as unknown as` casts, hot-path `Platform` checks or unexplained guards remain in the calendar renderer.

## Scope

- One shell-level conflict chooser.
- `ref` as a prop.
- Remaining R06 should-do items.

## Non-goals

- Behaviour changes.

## Definition of done

- Compiler check, lint, tsc and coverage green.

## Acceptance and verification

- CI.

## Likely work sites and reading

- `research/R06-code-health-and-cleanup.md`
- `mobile/src/features/calendar/renderer/`

## Size and confidence drivers

Mechanical after E04–E06.

## QA and sensitive surfaces

Conflict chooser still opens and dismisses.
