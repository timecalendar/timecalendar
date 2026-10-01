---
kind: ticket
id: T09
epic: E04
status: planned
traces-to: [P05, D07]
depends-on: [T08]
size: M
confidence: medium
---

# T09 — Port renderer tests and rewrite the contract test

## Outcome

Behaviour tests from the shell and screen suites run against the new owner, mechanism tests are deleted, the contract test pins the new owner with its bans intact, and CI fails on any React Compiler bail-out in `renderer/`.

## Scope

- About 35 ported tests, about 18 deleted, two §6.1 tests rewritten.
- Extend the Reanimated scroll-handler mock to all handler keys.
- Compiler bail-out CI step.

## Non-goals

- New Maestro journeys.

## Definition of done

- CI green with the compiler check enforced.

## Acceptance and verification

- `npm test -- --coverage`; CI.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-shell.test.tsx`
- `mobile/src/features/calendar/ui/calendar-screen.test.tsx`
- `mobile/jest/setup-reanimated.ts`
- research/R06-code-health-and-cleanup.md §5
- research/R07-governance-and-verification.md §3

## Size and confidence drivers

Large test file, clear keep/delete classification.

## QA and sensitive surfaces

None.
