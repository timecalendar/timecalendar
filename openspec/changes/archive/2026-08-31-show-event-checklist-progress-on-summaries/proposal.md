## Why

React Native already preserves and edits event checklists, but students cannot see whether an event still has unfinished work until they open its details. Flutter exposed this signal across scan-heavy event surfaces; restoring it with a reactive batched read closes that parity gap without trading dense-calendar performance for one SQLite subscription per event.

## What Changes

- Add a feature-owned checklist-progress read that accepts the currently rendered event UID set and returns completed/total counts through one set-oriented live SQLite query.
- Preserve the existing Flutter/import semantics: count every row for a matching event UID, including imported rows with non-null `deletedAt`; do not add a soft-delete predicate.
- Show a compact completed/total indicator on Home upcoming cards, Home today all-day cards, Home timed tiles in normal and Dynamic Type reflow layouts, Calendar day/week timed and all-day tiles, and Agenda rows.
- Hide the indicator for zero items and make the all-complete state distinguishable by icon/text/shape, not color or a tiny dot alone.
- Compose localized EN/FR checklist progress into each event summary's accessible label.
- Keep CalendarKit's projected event collection keyed only to calendar event changes; checklist updates refresh tile content without rebuilding the collection.
- Extend focused unit/component coverage and the existing real-CRUD Maestro flow, update current-state mobile architecture documentation, and record device-only verification as a non-blocking migration inbox item.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-event-checklists`: Add a batched reactive progress projection that preserves checklist storage semantics.
- `mobile-home`: Surface checklist progress on every Home event summary and in its accessibility contract.
- `mobile-calendar-timeline`: Surface checklist progress on day/week timed and all-day tiles without destabilizing renderer event identity.
- `mobile-calendar-agenda`: Surface checklist progress on Agenda rows and in their accessible labels.
- `mobile-e2e`: Observe created and toggled checklist progress after returning from details to an event-summary surface.

## Impact

- Affected code: `mobile/src/features/event-checklists/data/` and `ui/`, Home summary components/controller, the calendar renderer facade and CalendarKit tiles, Agenda rows, i18n catalogs, focused tests, and `mobile/.maestro/event-checklists.yaml`.
- Documentation: current-state calendar/storage/testing/feature guidance plus a device-only migration inbox note. Existing Architecture Book rules are applied, not changed; no ADR is expected unless implementation evidence forces a load-bearing rule change.
- Contracts and storage: no server/API/OpenAPI change, no migration or index, and no change to checklist CRUD or schema semantics.
- Dependencies/native surfaces: no new package and no `app.config.ts`, EAS, Firebase, workflow, deployment, or legacy Flutter edit. Flutter remains audit-only.
