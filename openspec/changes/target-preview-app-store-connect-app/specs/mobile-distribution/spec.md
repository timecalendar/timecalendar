## MODIFIED Requirements

### Requirement: Submit configuration skeleton without committed secrets

`eas.json` SHALL include submit configuration for iOS (App Store Connect) and Android (Play) such
that a human can submit an explicitly selected artifact after supplying credentials. The iOS
`preview` profile SHALL commit public App Store Connect app identifier `1479613630` as its exact
destination. Credential-bearing values, including the Apple account/team authentication inputs and
the Google Play service-account key, SHALL remain referenced through environment variables or a
key-file path and SHALL NOT be committed. The production submit profile SHALL remain unchanged by
this preview-only correction.

#### Scenario: Preview submission has one deterministic App Store destination

- **WHEN** `mobile/eas.json` is inspected in the repository
- **THEN** `submit.preview.ios.ascAppId` is exactly the string `1479613630`
- **AND** it is not an unresolved environment placeholder
- **AND** the profile's `appleId` and `appleTeamId` remain environment-backed

#### Scenario: Submit configuration carries no credentials

- **WHEN** the preview and production submit profiles are inspected
- **THEN** Apple account/team authorization and the Play service-account key remain outside git
- **AND** the committed preview App Store Connect identifier is treated only as public destination
  metadata
- **AND** the production submit profile and Android internal-track submission shape are unchanged

#### Scenario: Configuration correction performs no store action

- **WHEN** this engineering change is completed
- **THEN** no app is built, signed, uploaded, submitted, promoted, distributed, or installed
- **AND** a future store action still requires separately supplied credentials and explicit human
  authorization
