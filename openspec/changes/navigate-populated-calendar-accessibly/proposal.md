## Why

The populated Day and Week calendar exposes ordinary tiles, dense-event chooser triggers, and page controls, but it does not yet prove that assistive technology can traverse every current timed class once in chronological order, reach events outside the viewport, or retain logical focus after navigation. T12 closes that accessibility slice before later spanning-event work depends on an unverified semantic tree.

## What Changes

- Establish one identity-backed chronological native event tree for the committed page, independent of zoom and visual tile mount order, with bounded access to 01:00, 10:00, and 23:00 fixtures.
- Keep each event's semantic activation associated with meaningful visible geometry, including the existing explicit choice path where expanded dense targets conflict; do not add a hidden duplicate tree or a separate Agenda destination.
- Restore focus to a surviving event identity after details, paging, or mode changes, otherwise fall back to the relevant date heading, and announce each accepted context once.
- Supply deterministic chronological/identity/focus tests, a native probe script and fabricated dense/offscreen fixtures, and exact-head iOS and Android evidence for screen reader, voice, switch, large-text, page, and zoom operation.
- Treat the native probe as a hard design gate: if the approved visual-target tree cannot provide bounded off-viewport traversal and correct activation geometry, stop implementation and request a scoped D06 revision before introducing the same-screen semantic-layer alternative.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Strengthen the owned timeline contract from accessible individual tiles and conflict choices to one complete chronological, identity-preserving committed-page traversal with bounded off-viewport reachability and focus recovery.

## Impact

- Affects the Calendar presentation model and owned renderer under `mobile/src/features/calendar/data/` and `mobile/src/features/calendar/renderer/`, Calendar screen focus/context coordination, localized labels, focused tests, native probe fixtures/scripts, and canonical T12 execution evidence.
- The low-confidence probe starts from the existing single `ScrollView`/`PagerView` tree. The development host has neither Android nor iOS native tooling, so host inspection cannot substitute for the required exact-build device evidence.
- Touches no sensitive repository surface: no OpenAPI/generated client, database migration, native/store/EAS/Firebase configuration, deploy/CI/infrastructure, or legacy Flutter path. `docs/mobile/architecture-book/` changes are limited to documenting the implemented current state; any rule change requires an ADR and explicit review.
- Adds no dependency, second renderer, hidden accessibility mirror, Agenda redirect, stored-event rewrite, or final all-day/failure accessibility claim.
