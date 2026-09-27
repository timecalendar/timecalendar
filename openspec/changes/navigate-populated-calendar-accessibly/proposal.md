## Why

The populated Day and Week calendar exposes ordinary tiles, dense-event chooser triggers, and page controls, but it does not yet prove that assistive technology can traverse every current timed class once in chronological order, reach events outside the viewport, or retain logical focus after navigation. T12 closes that accessibility slice before later spanning-event work depends on an unverified semantic tree.

## What Changes

- Establish one identity-backed chronological native event tree for the committed page, independent of zoom and visual tile mount order, with bounded access to 01:00, 10:00, and 23:00 fixtures.
- Keep each event's semantic activation associated with meaningful visible geometry, including the existing explicit choice path where expanded dense targets conflict; do not add a hidden duplicate tree or a separate Agenda destination.
- Restore focus to a surviving event identity after details, paging, or mode changes, otherwise fall back to the relevant date heading, and announce each accepted context once.
- Supply deterministic chronological/identity/focus tests, a native probe script and fabricated dense/offscreen fixtures. Keep iOS and Android screen reader, voice, switch, large-text, page, and zoom operation pending final QA without claiming a native pass.
- If final native findings show the approved visual-target tree cannot provide bounded off-viewport traversal and correct activation geometry, record the failure and request a scoped D06 revision before introducing another semantic strategy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Strengthen the owned timeline contract from accessible individual tiles and conflict choices to one complete chronological, identity-preserving committed-page traversal with bounded off-viewport reachability and focus recovery.

## Impact

- Affects the Calendar presentation model and owned renderer under `mobile/src/features/calendar/data/` and `mobile/src/features/calendar/renderer/`, Calendar screen focus/context coordination, localized labels, focused tests, native probe fixtures/scripts, and canonical T12 execution evidence.
- The low-confidence probe starts from the existing single `ScrollView`/`PagerView` tree. The development host has neither Android nor iOS native tooling, so host inspection cannot substitute for the required exact-build device evidence.
- Sensitive surface: `docs/mobile/architecture-book/` changes the reusable Calendar conflict rule through ADR 061, its index, topical guidance, and changelog. Reviewer must scrutinize that rule. No OpenAPI/generated client, database migration, native/store/EAS/Firebase configuration, deploy/CI/infrastructure, or legacy Flutter path is touched.
- Adds no dependency, second renderer, hidden accessibility mirror, Agenda redirect, stored-event rewrite, or final all-day/failure accessibility claim.
