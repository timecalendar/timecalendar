## ADDED Requirements

### Requirement: Onboarding presentation adapts to its measured portrait width
The onboarding welcome, connect, institution-name, programme, and manual-import screens SHALL use
the shared measured responsive lanes while preserving their existing sequence, validation,
keyboard, safe-area, accessibility, and navigation behavior.

#### Scenario: Welcome remains usable on a compact screen
- **WHEN** the welcome composition is measured at 390 points
- **THEN** page content and action content each retain one compact responsive gutter
- **AND** their usable width is not reduced by a second outer content lane

#### Scenario: Welcome content remains balanced on a tablet
- **WHEN** the welcome composition is measured at tablet width
- **THEN** page copy, illustrations, and actions remain centered within their readable caps
- **AND** the pager order, indicator, Skip, Next, and final action behavior remain unchanged

#### Scenario: Onboarding forms use readable lanes
- **WHEN** a connect, institution-name, programme, or manual-import step is presented at tablet width
- **THEN** its one-column content is centered in a measured readable lane
- **AND** its current safe-area, keyboard, validation, and navigation owners remain in place
