## REMOVED Requirements

### Requirement: The Architecture Book records the iPhone and iPad support contract

**Reason**: Its portrait-only/full-screen wording is superseded when T07 fires the indexed decision's revisit condition.

**Migration**: Replace it with the resizable iPhone/iPad support contract below and revise ADR 042 in place while retaining its decision history and rationale.

## ADDED Requirements

### Requirement: The Architecture Book records the resizable iPhone and iPad contract

The Architecture Book SHALL record that TimeCalendar supports iPhone and iPad in portrait, landscape, and resizable native windows while preserving iOS 16.4, Android API 24, automatic native insets, and fingerprint runtime isolation. ADR 042 SHALL be revised and indexed as the load-bearing decision whose revisit fired. Current-state guidance SHALL identify Expo source configuration, focused source tests, disposable generated-native verification, and compatible binary/fingerprint evidence as distinct proof layers.

#### Scenario: Durable platform-support decision is revised and indexed

- **WHEN** the Architecture Book decision index and ADR 042 are read after implementation
- **THEN** they describe the landscape-capable, resizable iPhone+iPad contract and preserve the App Store device-family continuity rule
- **AND** they record CNG source ownership, OS-floor preservation, fingerprint consequence, rejected alternatives, and future revisit triggers

#### Scenario: Current-state guidance points to executable proof

- **WHEN** runtime, EAS/distribution, Calendar, and testing guidance is read
- **THEN** it identifies `mobile/app.config.ts` as native policy authority and points to source-config and clean-prebuild checks
- **AND** it distinguishes deterministic host proof from exact-build rotation, resized-window, navigation/chrome, automatic-inset, and gesture evidence

#### Scenario: Architecture Book changelog records the rule change

- **WHEN** Architecture Book history for T07 is inspected
- **THEN** `CHANGELOG.md` records the transition from portrait-only full-screen to the resizable contract
- **AND** no duplicate Architecture Book or hand-edited generated-native documentation tree is created
