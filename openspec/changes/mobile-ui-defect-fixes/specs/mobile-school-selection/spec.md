## ADDED Requirements

### Requirement: School-picker status glyphs render on both platforms and stay decorative

The school picker's empty-catalogue and no-results states SHALL show a status glyph on both iOS (SF Symbol) and Android (an equivalent Material Symbol) without adding a dependency. The glyph SHALL be hidden from assistive technology; the adjacent localized status message SHALL remain the only announced meaning.

#### Scenario: Android shows a Material status glyph

- **WHEN** the school picker shows its no-results or empty state on Android
- **THEN** a Material Symbol glyph (search for no results, school for empty) renders above the status message

#### Scenario: iOS keeps its SF Symbol

- **WHEN** the same states render on iOS
- **THEN** the `magnifyingglass` or `graduationcap` SF Symbol renders above the status message

#### Scenario: The glyph adds no accessible noise

- **WHEN** a screen reader traverses the status state on either platform
- **THEN** the glyph is not focusable or announced and the localized message is announced
