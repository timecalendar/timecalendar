## ADDED Requirements

### Requirement: No dead direct dependencies

The app's direct dependencies in `app/pubspec.yaml` SHALL NOT include packages
that have zero `package:` imports in `app/lib/`. The B3 wave SHALL remove
`tuple`, `frontend_server_client`, and `state_notifier` from the
`dependencies:` section. The `StateNotifier` and `StateNotifierProvider` symbols
SHALL remain available through `hooks_riverpod`'s re-export without any source
change.

#### Scenario: Dead packages are gone from pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `tuple`, `frontend_server_client`, and `state_notifier` are absent from `dependencies:`
- **AND** `app/pubspec.lock` no longer lists them as direct dependencies

#### Scenario: Riverpod state-notifier symbols still resolve

- **WHEN** `flutter analyze` is run after `state_notifier` is removed
- **THEN** every existing use of `StateNotifier` and `StateNotifierProvider` resolves with no new analyzer error

### Requirement: No discontinued packages, swaps preserve behaviour

The app SHALL NOT depend on the discontinued/stale packages `flutter_image`,
`color`, `reorderables`, `enum_to_string`, and `flutter_material_color_picker`.
The B3 wave SHALL replace each with a native Flutter API or a maintained
package, preserving the observable behaviour of every affected screen and
utility. `cached_network_image` and `flutter_colorpicker` SHALL be the only new
direct dependencies introduced.

#### Scenario: Stale packages are replaced in pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `flutter_image`, `color`, `reorderables`, `enum_to_string`, and `flutter_material_color_picker` are absent from `dependencies:`
- **AND** `cached_network_image` and `flutter_colorpicker` are present as direct dependencies

#### Scenario: Remote images still load with retry and caching

- **WHEN** a school logo is displayed via `FadeInImage` after the swap
- **THEN** the image is provided by `CachedNetworkImageProvider` and renders the placeholder while loading

#### Scenario: Color math is unchanged

- **WHEN** `ColorUtils.darkenColor` / `lightenColor` are called on an in-app event color
- **THEN** the result matches the pre-change output, computed via native `HSLColor` with lightness clamped to `0.0..1.0`

#### Scenario: Checklist reorder still works

- **WHEN** a checklist item is long-press dragged to a new position
- **THEN** the native `SliverReorderableList` reorders the items and `ChecklistItemNotifier.reorderItems` persists the new order

#### Scenario: Enum persistence round-trips

- **WHEN** `CalendarViewType` is written to and read from `SharedPreferences`
- **THEN** the persisted string matches `Enum.name` and an unknown stored value falls back to the default without throwing

#### Scenario: Event color picker still works

- **WHEN** the user opens the color picker on the add-personal-event screen
- **THEN** `flutter_colorpicker`'s `MaterialPicker` is shown and the chosen color flows through the existing confirm/cancel dialog flow

### Requirement: pref is retained with a documented decision

The B3 wave SHALL keep the `pref` package as a direct dependency. `pref` is the
settings-screen UI framework rather than a leaf utility; it is stale but still
published and SDK-compatible, so it is out of scope for B3's
dead/discontinued-package cleanup. Any migration off `pref` SHALL be tracked as
a separate change.

#### Scenario: pref remains in pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `pref` is still present in `dependencies:`
- **AND** the settings screen continues to build on `pref` widgets unchanged

### Requirement: The change lands analyze-clean and test-green

The B3 swaps SHALL NOT introduce analyzer issues or test failures.

#### Scenario: Analyze and tests pass

- **WHEN** `flutter analyze` and `flutter test` are run on the changed app
- **THEN** `flutter analyze` reports no new issues attributable to the change
- **AND** the unit and widget test suite passes
- **AND** the Phase 1 E2E smoke suite passes in CI
