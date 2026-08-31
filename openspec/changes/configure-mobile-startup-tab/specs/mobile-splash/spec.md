## MODIFIED Requirements

### Requirement: Splash dismisses only when launch is committed or a blocking failure is visible

The app SHALL expose one readiness gate that settles first paint only after i18n initialization, fonts (a no-op while system fonts are used), the database migration attempt, the designated future Phase 09 importer insertion point, killed-state intent resolution, first-launch identity resolution, and observation that the winning route is committed. The splash overlay SHALL dismiss only after normal launch commitment or after a localized accessible blocking prerequisite-error surface is ready. The gate SHALL fail closed: its watchdog SHALL expose the blocking error surface and SHALL NOT reveal unverified tabs or continue against an unknown schema.

#### Scenario: Overlay dismisses after the winning route commits

- **WHEN** launch prerequisites succeed and the router reports the winning destination
- **THEN** the splash overlay dismisses and the committed screen is shown

#### Scenario: Wrong tab remains covered

- **WHEN** Calendar or onboarding wins while the router still reports Home
- **THEN** the native/JS splash cover remains visible
- **AND** no wrong-tab first paint is exposed

#### Scenario: Prerequisite failure settles to a blocking surface

- **WHEN** migration or first identity resolution fails
- **THEN** the error is recorded and an accessible Retry surface becomes the first visible app content
- **AND** tabs remain unavailable

#### Scenario: Readiness watchdog fails closed

- **WHEN** a launch prerequisite does not settle before the watchdog deadline
- **THEN** the readiness state becomes a blocking recoverable failure
- **AND** the splash does not dismiss onto unverified normal content
