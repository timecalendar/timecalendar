## MODIFIED Requirements

### Requirement: Current OTA and observability guidance reflects ADR 037

The Architecture Book SHALL keep `eas.md` aligned with the non-blocking silent-apply policy and
self-hosted xprem target, and SHALL record the deployed endpoint, public app UUID,
database-managed signing mode, public certificate path, and certificate fingerprint once those
bootstrap inputs exist. It SHALL distinguish available public inputs from downstream client wiring
and publishing work. The book SHALL keep `firebase.md` aligned with the five OTA Crashlytics keys
and owned-seam rule, keep `architecture.md` pointed at the canonical existing `CHANGELOG.md`, and
append each rule change there. `runtime.md` SHALL change only if implementation changes its reusable
runtime/native baseline contract.

#### Scenario: Topical guidance points to the ratified decision

- **WHEN** `eas.md` and `firebase.md` are read after implementation
- **THEN** they describe their current OTA runtime and observability contracts
- **AND** they point to ADR 037 instead of duplicating its architectural rationale

#### Scenario: Completed bootstrap inputs are current guidance

- **WHEN** the deployed xprem app bootstrap is complete
- **THEN** `eas.md` records `https://ota.timecalendar.app`, app UUID
  `e89170b9-5b32-44f0-8f78-33eadb60ec28`, database-key mode, and
  `mobile/codesigning/certs/certificate.pem` with its verified fingerprint
- **AND** it states that client endpoint, request-header, channel, and certificate wiring remain
  downstream until the app configuration consumes those inputs

#### Scenario: Existing changelog receives the rule change

- **WHEN** the Architecture Book directory is inspected
- **THEN** `CHANGELOG.md` contains the OTA bootstrap-input rule-change entry
- **AND** `architecture.md` distinguishes the rule changelog from implementation history retained
  by Git
- **AND** no `architecture-changelog.md` duplicate is created
