---
kind: ticket
id: T14
epic: E07
status: implementing
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

## Current-state audit

- The shell owns one conflict chooser and receives `ref` as a prop. The renderer has no page-level modal, development page overlay, `forwardRef`, or production `as unknown as` cast. Test casts remain permitted by R06.
- The canvas derives its iOS/Android scroll props from module-level platform constants. The page derives conflict geometry and minimum target size from one module-level platform constant; no tile render reads `Platform.OS`.
- Geometry-revision and callback guards in the coordinator reject late vertical or pinch events after a viewport replacement. Pager width/content checks reject events from an older placement, and focus identity checks prevent restoration to the wrong page. These protections have product-visible races and remain in place.
- The incoming E06/T08b pager checks Android rest recovery and native touch setup once per hook invocation. Its Android/iOS host tests override `Platform.OS` after module import, so a module-load constant would change those tests' platform semantics. Neither read runs per tile or gesture frame.

The host candidate needs the merged E06/T08b base and its CI result before this ticket is complete. Physical conflict-chooser, focus and gesture acceptance belongs to the exact-revision E07 device pass.
