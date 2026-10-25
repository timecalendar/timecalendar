## ADDED Requirements

### Requirement: Calendar header items take the label color, never brand pink

Every Calendar header bar item SHALL render in the scheme's `text` label color on both platforms, matching the root header tint rule. This SHALL cover the Today and Add icon actions and the view-menu disclosure chevron. The Android create FAB is a body control, not a header item, and SHALL keep its brand fill.

#### Scenario: Header icon actions use the label color

- **WHEN** the Calendar header renders its Today action (and Add on iOS) in light or dark scheme
- **THEN** each icon is tinted with that scheme's `text` color

#### Scenario: View-menu chevron uses the label color

- **WHEN** the Calendar view-menu pill renders in the header
- **THEN** its disclosure chevron uses that scheme's `text` color

#### Scenario: Android FAB keeps its brand fill

- **WHEN** the Calendar renders on Android
- **THEN** the create FAB keeps the `primary` fill
