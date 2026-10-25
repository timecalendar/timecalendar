## ADDED Requirements

### Requirement: Standalone native dialogs never render inside a native settings host

A standalone native dialog or editor that mounts its own native host (the settings radio dialog, the numeric editor and the text-entry dialog) SHALL render outside any native settings page host, as a sibling after it. Rendering one inside a native settings page host SHALL fail with a descriptive error on its first render, on every platform and whether or not the dialog is visible, so the misplacement is caught in tests and development before a build ships.

#### Scenario: A radio dialog inside a settings host fails

- **WHEN** a settings radio dialog renders anywhere inside a native settings page host, visible or not
- **THEN** rendering fails with an error that names the dialog and states that it must render outside the host

#### Scenario: Dialogs after the host render normally

- **WHEN** a radio dialog, numeric editor or text-entry dialog renders as a sibling after a native settings page host
- **THEN** it renders and behaves as before, with no error
