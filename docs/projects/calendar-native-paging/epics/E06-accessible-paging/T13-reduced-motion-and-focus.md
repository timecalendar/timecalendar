---
kind: ticket
id: T13
epic: E06
status: planned
traces-to: [P04, D06, D03]
depends-on: [T12]
size: M
confidence: medium
---

# T13 — Live reduced motion, Today motion and focus restoration

## Outcome

Reduced motion is read live; Today and deep links animate one page, jump-then-animate when far, or jump directly under reduced motion; focus restoration is one effect plus `useEffectEvent`, and the focus observer keys on `pageKey`.

## Scope

- Delete the imperative `restoreFocus`, mirrored refs and `restoreFocusRef`.

## Non-goals

- Changing what gets restored.

## Definition of done

- Ported focus tests pass with new triggers.

## Acceptance and verification

- `npm test -- --coverage`; device check with reduced motion toggled while the app runs.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx:105-398`
- `mobile/src/features/calendar/renderer/calendar-focus-observer.tsx`
- research/R05-accessibility-header-and-focus.md §4–§5

## Size and confidence drivers

Behaviour pinned by existing tests.

## QA and sensitive surfaces

Return from event details restores focus.
