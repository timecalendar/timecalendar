## Why

The scheduling surfaces still apply phone-sized composition and, in Home's custom timeline, window-derived geometry after the shared portrait-responsive foundation has established measured semantic lanes. This leaves high-value tablet screens stretched, inconsistently aligned, or vulnerable to clipping in narrower presentation owners, so the audit's highest-impact quick wins should now consume that foundation without changing product behavior.

## What Changes

- Give Home one measured `standard` content lane for its feature-owned header, welcome/status content, Upcoming section, Today section, and scroll edges while retaining fixed-width horizontally accessible Upcoming cards.
- Derive Today timeline tile geometry from the laid-out tile-area owner from the first usable measurement, retaining window dimensions only for window-owned font scale and preserving overlap, time, reflow, checklist, routing, all-day, and press behavior.
- Keep Calendar day/week and Android FAB ownership full bleed while constraining Agenda rows and loaded/empty/error/refresh presentation to one measured `standard` lane; leave native header/actions/view-menu behavior unchanged.
- Constrain event-details loaded/loading/missing/error content and its checklist to one measured `readable` lane with unchanged source and accessibility order.
- Move the personal-events list to the shared `standard` lane and keep the form body plus keyboard-safe action footer in the same `readable` lane, preserving CRUD, pickers, validation, errors, confirmations, and action order.
- Add focused component and geometry coverage at the responsive boundaries relevant to each surface, and update the tablet quick-wins matrix with the implemented disposition and proof.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `mobile-home`: Home composition and Today custom geometry become owner-measured and tablet-aware while preserving the existing event behavior.
- `mobile-calendar-agenda`: Agenda and its calendar status/refresh presentation use a shared measured standard lane.
- `mobile-calendar-timeline`: Day/week rendering and Android FAB remain explicitly full bleed while sibling Agenda content is constrained.
- `mobile-event-details`: Every details outcome and the resolved checklist share a readable lane and stable one-column reading order.
- `mobile-personal-events-ui`: The list adopts the standard lane and the create/edit/delete form body and footer share the readable lane.

## Impact

- **Mobile UI:** `features/home/ui`, `features/calendar/ui`, `features/personal-events/ui`, and their focused component/geometry tests consume `AdaptiveContent`, `useAdaptiveLayout`, and the existing responsive resolver.
- **Documentation:** `docs/mobile/tablet-quick-wins.md` records the final layout disposition and automated proof. The Architecture Book is binding input; no rule change or ADR is expected.
- **Behavior and contracts:** no route, calendar/data, persistence/schema, generated API, dependency, renderer-vendor, native/store, EAS/Firebase, deployment/CI, landscape/multitasking, or legacy Flutter change.
- **Sensitive surfaces:** none. The committed API contract and generated client, migrations, native/store configuration, deployment paths, workflows, and `app/` remain untouched.
