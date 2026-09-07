## Why

Onboarding and calendar-source screens preserve phone-sized local wrappers on portrait tablets,
leaving forms, lists, guidance, and actions either unnecessarily wide or visually stranded. The
shared responsive layout contract is now available, so these routes can adopt semantic measured
lanes while keeping their established behavior and sequence.

## What Changes

- Balance the welcome carousel with capped page content, illustration, and action regions while
  preserving one compact-screen gutter.
- Place onboarding, manual-import, and iCal forms in measured readable lanes without changing
  validation, keyboard, or navigation behavior.
- Align school and group list rows, separators, and states in measured standard lanes.
- Keep the QR camera full bleed while bounding permission, guidance, recovery, and action content.
- Center the user-calendar collection in a standard lane and its rename content in a readable lane.
- Add focused responsive tests and record the implemented contract in current-state documentation.

## Capabilities

### New Capabilities

<!-- None. This change applies the existing responsive layout capability to existing features. -->

### Modified Capabilities

- `mobile-onboarding-flow`: Welcome and onboarding steps gain explicit responsive lane behavior.
- `mobile-school-selection`: School and group collections gain aligned measured tablet lanes.
- `mobile-ical-import`: iCal entry content gains a readable responsive lane.
- `mobile-qr-scan`: Permission and overlay content become bounded while the camera stays full bleed.
- `mobile-user-calendars`: Calendar management and rename content gain semantic responsive lanes.

## Impact

- Affects presentation and focused component tests under `mobile/src/features/onboarding/ui/`,
  `mobile/src/features/school-selection/ui/`, and selected
  `mobile/src/features/calendar-sources/ui/` modules.
- Updates the tablet matrix and the Architecture Book feature guidance and changelog.
- Does not change APIs, generated clients, dependencies, persistence, routing outcomes, camera
  permissions, native configuration, server behavior, or legacy Flutter code.
