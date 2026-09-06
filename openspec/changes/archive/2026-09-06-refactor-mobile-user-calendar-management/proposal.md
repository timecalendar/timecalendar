## Why

The user-calendar management screen currently concentrates screen composition, row/menu behavior, and optimistic visibility coordination in one 488-line module, making a behavior-sensitive surface costly to change. Its eager `ScrollView` rendering and effect-driven optimistic acknowledgement are also avoidable patterns now that the shipped behavior and async ordering requirements are understood.

## What Changes

- Split the management UI into focused screen-composition, calendar-row/menu, and visibility-control modules, keeping every component materially below 200 lines.
- Render held calendars through a React Native virtualized list keyed by calendar id while preserving the loading, empty, write-error, introductory, footer, safe-area, and Android FAB spacing behavior.
- Replace effect-driven optimistic acknowledgement with an operation-keyed visibility controller that renders an accepted optimistic value until canonical state acknowledges it, rolls back failed writes, ignores repeated input while a write is pending, and yields to later external canonical changes without a stale flash.
- Preserve the current delete confirmation and success announcement, rename-dialog mount lifecycle, effective-name fallbacks, platform menu behavior, accessibility semantics, translations, testIDs, and public feature exports.
- Add focused ordering tests for successful writes before live-query echo, failures, rapid repeated input, delayed acknowledgement, and later external canonical changes; retain regression coverage for the surrounding behavior.
- Update the Architecture Book with the reusable current-state structure and verification contract. No new ADR is expected because persistence, event filtering, public interfaces, and product behavior do not change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mobile-user-calendars`: require id-keyed list virtualization, bounded UI-module ownership, and explicit optimistic visibility ordering while preserving the existing management behavior.

## Impact

- **Code:** `mobile/src/features/calendar-sources/ui/` screen, extracted row/menu and visibility-control modules, their colocated tests, and unchanged UI/feature barrels.
- **Documentation:** the calendar-sources entry in the mobile Architecture Book and its changelog.
- **Contracts and dependencies:** no API, generated-client, database schema/migration, native/store configuration, dependency, deployment, CI, or legacy Flutter change.
- **Risk:** list header/footer ownership and safe-area/FAB padding can subtly change layout; operation state must stay keyed by calendar id across virtualization and must not let an old async completion mask a newer canonical value.
