# Proposal

## Why

Mobile errors currently compete with their recovery actions, disappear into secondary text, and
vary across every feature. QR import shows three equivalent buttons; iCal places failure below
its primary action. A common error presentation contract will make recovery understandable and
accessible on both supported platforms while preserving working state and retry semantics.

## What Changes

- Introduce reusable FieldError, ErrorNotice, and ErrorState surfaces with named action slots,
  a compact readable hierarchy, semantic colors, native symbols, and platform interaction sizing.
- Announce newly visible/changed errors on iOS and Android without repeated or duplicate speech.
- Migrate all existing React Native mobile failure surfaces using an explicit inventory; preserve
  native SwiftUI/Compose settings and dialog composition behind the chrome boundary.
- Reduce QR failed-import recovery to Retry plus Change method; the existing chooser owns QR/iCal
  selection. Keep invalid QR payload guidance visible over the camera.
- Put iCal operation failure before the sole Import action and make Report subordinate; keep
  field validation beside its input. Distinguish native rename validation from save failures.
- Keep cached content, entered values, sync-only retries, and existing native route history.

## Capabilities

### New Capabilities

- `mobile-error-surfaces`: A cross-feature contract for error classification, presentation,
  accessibility, platform adaptation, recovery hierarchy, and complete consumer migration.

### Modified Capabilities

None. Feature-specific persistence, validation, retry, permission, and confirmation contracts remain
owned by their existing capabilities. This change defines the shared presentation and QR chooser
composition; existing calendar-import fixes remain in their separate active change.

## Impact

Affects mobile shared components, chrome adapters, theme/i18n, and existing mobile error consumers.
No server, OpenAPI, database, dependency, native permission, or native-build change. Existing native
builds remain usable. Legacy Flutter and web surfaces are outside this mobile design scope.
