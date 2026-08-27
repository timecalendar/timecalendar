## ADDED Requirements

### Requirement: The deployed xprem app exposes one public signing trust root

The repository SHALL record the deployed TimeCalendar xprem app UUID
`e89170b9-5b32-44f0-8f78-33eadb60ec28` and SHALL contain its public signing certificate at
`mobile/codesigning/certs/certificate.pem`. The certificate SHA-256 fingerprint SHALL be
`D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.
The deployed xprem v3.1.2 app SHALL use its database-managed per-app signing key as the single
trust root; the repository SHALL NOT contain that private key or a separately generated Expo
signing key pair.

#### Scenario: Public bootstrap inputs are available to client wiring

- **WHEN** the downstream client initialization reads the repository bootstrap contract
- **THEN** it finds the xprem app UUID and public certificate path above
- **AND** the certificate fingerprint matches the deployed app's exported certificate

#### Scenario: Private signing material remains outside git

- **WHEN** the repository and branch diff are inspected
- **THEN** `mobile/codesigning/` contains the public certificate only
- **AND** no private key, dashboard credential, API token, or second signing trust root is present

#### Scenario: Bootstrap does not claim client wiring

- **WHEN** this change completes
- **THEN** the public app identity and trust root are available
- **AND** endpoint, request-header, channel, and certificate wiring in app configuration remain a
  separate downstream change
