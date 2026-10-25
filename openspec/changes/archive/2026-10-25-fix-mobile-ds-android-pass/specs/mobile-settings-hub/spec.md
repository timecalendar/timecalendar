## ADDED Requirements

### Requirement: Standalone native dialogs never render inside a native settings host

A standalone native dialog or editor that mounts its own native host (the settings radio dialog, the numeric editor and the text-entry dialog) SHALL render outside any native settings page host, as a sibling after it. Rendering one inside a native settings page host SHALL fail with a descriptive error on its first render, on every platform and whether or not the dialog is visible, so the misplacement is caught in tests and development before a build ships.

#### Scenario: A radio dialog inside a settings host fails

- **WHEN** a settings radio dialog renders anywhere inside a native settings page host, visible or not
- **THEN** rendering fails with an error that names the dialog and states that it must render outside the host

#### Scenario: Dialogs after the host render normally

- **WHEN** a radio dialog, numeric editor or text-entry dialog renders as a sibling after a native settings page host
- **THEN** it renders and behaves as before, with no error

### Requirement: The Settings environment selector dismisses cleanly on Android

On Android, the Settings environment selector dialog SHALL render outside the Settings native page host. Cancel or Back SHALL close it and return input to Settings. Selecting an environment SHALL close it before the destructive confirmation appears. No selector window SHALL remain after a confirmed switch reloads the app. Row placement, the production gate, the current-environment no-op, single-flight switching and the destructive confirmation SHALL not change.

#### Scenario: Cancel closes the selector

- **WHEN** a development build on Android opens the environment selector and taps Cancel
- **THEN** the selector closes, no confirmation appears, and Settings rows respond to input again

#### Scenario: Selecting closes the selector before confirming

- **WHEN** the user selects an environment other than the current one
- **THEN** the selector is no longer rendered and the destructive confirmation is presented

#### Scenario: The selector renders outside the Settings host

- **WHEN** the Settings screen renders for a non-production capability on Android with the selector open
- **THEN** the selector renders as a sibling of the native page host, the environment row stays inside the environment section, and no placement error occurs
