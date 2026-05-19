# flutter-dependency-baseline Specification

## Purpose
TBD - created by archiving change flutter-minor-dependency-bumps. Update Purpose after archive.
## Requirements
### Requirement: Group A dependency baseline

The app's direct Flutter dependencies in `app/pubspec.yaml` SHALL be kept at a
maintained known-good baseline. The B2 wave SHALL bring the audited Group A
packages to their target minor/patch versions, with the caret floor in
`app/pubspec.yaml` raised to each target so the resolution is deterministic.

The target versions are: `build_runner` 2.15.0, `built_value` 8.12.6,
`built_value_generator` 8.12.5, `cupertino_icons` 1.0.9, `dio` 5.9.2,
`freezed` 3.2.5, `http` 1.6.0, `json_annotation` 4.12.0,
`json_serializable` 6.14.0, `mobile_scanner` 7.2.0, `sembast` 3.8.7,
`shared_preferences` 2.5.5, `uuid` 4.5.3, `webview_flutter` 4.13.1.

#### Scenario: Constraints and lockfile reflect the target baseline

- **WHEN** `flutter pub get` is run after the bump
- **THEN** `app/pubspec.yaml` carries a caret constraint whose floor is the target version for each of the 14 packages
- **AND** `app/pubspec.lock` resolves each of the 14 packages to its target version

#### Scenario: The bump leaves the app analyze-clean and test-green

- **WHEN** `flutter analyze` and `flutter test` are run on the bumped app
- **THEN** `flutter analyze` reports no new issues attributable to the bump
- **AND** the unit and widget test suite passes
- **AND** the Phase 1 E2E smoke suite passes in CI

#### Scenario: The only changes are mechanical

- **WHEN** the change's diff is reviewed
- **THEN** it is limited to `app/pubspec.yaml`, `app/pubspec.lock`, and regenerated `*.freezed.dart` / `*.g.dart` files under `app/lib/`
- **AND** there are no hand-written changes to production source, CI, the `openapi/` package, or the Flutter/Dart SDK constraint
