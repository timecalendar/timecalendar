## ADDED Requirements

### Requirement: The Architecture Book records the iPhone and iPad support contract

The Architecture Book SHALL record that TimeCalendar supports iPhone and iPad while remaining portrait-only and full-screen on both device families. The rule SHALL be captured in an indexed ADR and current-state documentation SHALL point to the Expo source, source-config test, and generated-native verification that enforce it. The ADR SHALL identify disabled iPad multitasking as the consequence of retaining portrait-only behavior under Expo SDK 56.

#### Scenario: Durable platform-support decision is indexed

- **WHEN** the Architecture Book ADR index is read after implementation
- **THEN** it links an accepted ADR for the iPhone+iPad, portrait-only, full-screen contract
- **AND** the ADR records the App Store continuity constraint, CNG source-of-truth rule, consequences, and revisit triggers

#### Scenario: Current-state guidance points to automated proof

- **WHEN** the runtime and distribution guidance is read
- **THEN** it identifies `mobile/app.config.ts` as the source of the device-family and orientation contract
- **AND** it points to both focused source-config coverage and the disposable clean-prebuild assertion
- **AND** the Architecture Book changelog records the new binding rule
