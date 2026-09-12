## Why

The Calendar day/week surface currently depends on a patched third-party renderer that the approved pre-launch plan replaces with owned React Native presentation. T01 makes the first coherent cut: a stable, labelled shell on the real Calendar route, while keeping the existing agenda and event-details journeys usable and reserving all timeline behavior for later accepted slices.

## What Changes

- Replace the calendar-kit facade with a minimal owned day/week shell that renders a localized date heading with heading semantics and a stable empty canvas.
- Preserve Calendar mount/unmount and tab return, agenda access, agenda event activation, the unified event-details route, and return navigation.
- Remove calendar-kit from the package and lock manifests together with its adapter/vendor implementation, patch, Jest setup, renderer-only coverage rule, lint exception, and obsolete screen/controller ref and callback coupling.
- Remove or narrow controls whose action would be a silent no-op at this milestone; retain only working Calendar and agenda actions.
- Update the current Calendar renderer documentation and Architecture Book record to describe the owned shell and its intentionally absent timeline events, paging, vertical scrolling, weekday columns, zoom, and later capabilities without claiming launch completion.
- Keep stored synced and personal event facts, the agenda implementation, existing event-details behavior, and the three established Maestro journeys unchanged.

## Capabilities

### New Capabilities

_None._ T01 changes the existing Calendar timeline contract rather than introducing a separate public capability.

### Modified Capabilities

- `mobile-calendar-timeline`: Replace the vendor-rendered day/week contract with the first owned, accessible shell milestone and explicitly defer event rendering and timeline interactions.
- `mobile-calendar-agenda`: Keep Agenda reachable in place while narrowing the pre-T05 view selector to working shell/agenda choices.
- `mobile-event-details`: Preserve agenda-to-details activation while removing the temporarily unavailable day/week event-tile activation claim.

## Impact

- Affected mobile code: `src/features/calendar/renderer`, the Calendar screen/controller/header controls and their tests, root-layout comments, i18n catalogs, Jest configuration/setup, ESLint configuration, and dependency manifests.
- Affected documentation: the current Calendar Architecture Book page and changelog plus the current OpenSpec Calendar timeline and event-details capabilities through these delta specs.
- Removed dependencies: `@howljs/calendar-kit`; `patch-package` and its postinstall hook are also removed if no other patch remains after deleting the vendor patch.
- No server, database, OpenAPI/generated client, native/store/EAS/Firebase, deployment/CI, or legacy Flutter surface changes are expected. Stored event shapes and values remain unchanged.
