## Context

The mobile app has a shared measured responsive contract with readable, standard, and full-bleed
lanes. The owned onboarding and calendar-source screens still use local phone-oriented width and
padding rules, even though their routing, forms, queries, camera lifecycle, and persistence behavior
are already established and must remain unchanged. The work spans several presentation modules but
does not introduce a new architectural seam.

## Goals / Non-Goals

**Goals:**

- Apply existing semantic lanes inside each screen's current safe-area, keyboard, list, modal, or
  camera owner.
- Preserve one compact gutter while capping readable content and standard collections on tablets.
- Keep width-bearing camera content full bleed and bound only its overlay and instruction content.
- Prove representative compact and tablet behavior without duplicating resolver internals.

**Non-Goals:**

- No change to onboarding decisions, sequence, validation, source data, queries, persistence,
  permissions, navigation outcomes, native presentation, dependencies, or configuration.
- No landscape, multitasking, sidebar, multi-column, or device-model-specific composition.
- No shared responsive primitive changes; this work consumes the existing foundation.

## Decisions

### Decision 1 — Match lane semantics to content purpose

Forms, prose, instructions, welcome page content, welcome actions, and rename content use readable
lanes. School/group and calendar-management collections use standard lanes. The QR camera remains
full bleed. This preserves a single ordered composition and uses the caps already defined by the
responsive foundation.

Alternative rejected: applying the standard lane to every route leaves forms and instructions too
wide, while applying the readable lane to collections creates an unnecessarily narrow list.

### Decision 2 — Measure inside the existing environmental owner

Adaptive content sits inside the route's existing safe area or keyboard-aware owner; list consumers
attach `useAdaptiveLayout` to the list's existing owner; modal and camera overlays measure their own
presented bounds. No responsive wrapper takes ownership of safe areas, native headers, keyboard
avoidance, list insets, modal presentation, or camera geometry.

Alternative rejected: a route-level universal wrapper would double insets, constrain the camera,
and obscure which node owns usable width.

### Decision 3 — Compose welcome lanes without nested compact gutters

The welcome root fills its safe area without a capped lane. Its page and action regions each own one
readable lane, the illustration retains its independent cap, and the small page indicator remains
centered. This gives compact screens exactly one 24-point horizontal gutter while retaining the
readable tablet cap where content needs it.

Alternative rejected: nesting readable children inside a standard outer lane applies both compact
gutters and shrinks 390-point usable content from 342 to 294 points.

### Decision 4 — Test resolved presentation and preserve behavior suites

Focused screen tests emit owner layout events and assert the resulting lane cap and gutter at 1024
points. The welcome composition additionally proves its independently measured page and action
lanes at 390 points. Existing behavioral suites remain the authority for state transitions,
navigation, validation, permissions, imports, and calendar management.

Alternative rejected: repeating all resolver boundary arithmetic in every feature test would couple
feature suites to shared implementation details without increasing behavioral confidence.

## Risks / Trade-offs

- [Nested adaptive owners can accidentally compound gutters] → Keep the welcome root uncapped and
  assert both page and action lane styles at 390 points.
- [List styles can drift between rows and states] → Reuse one measured lane style across list
  content, separators, headers, footers, loading, empty, and error states.
- [Bounding QR content can accidentally constrain camera geometry] → Keep the camera's flex-fill
  style separate and assert it remains full bleed.
- [Responsive refactors can disturb logic] → Limit changes to composition/styles and retain the
  existing behavior tests unchanged.

## Migration Plan

1. Convert the owned screens to semantic measured lanes without changing their logic owners.
2. Add focused compact/tablet component assertions and run the affected suites.
3. Update the tablet matrix and Architecture Book current-state guidance.
4. Run TypeScript, lint, and the coverage suite before handoff.

Rollback is a normal revert; there is no data, API, dependency, or configuration migration.

## Open Questions

None.
