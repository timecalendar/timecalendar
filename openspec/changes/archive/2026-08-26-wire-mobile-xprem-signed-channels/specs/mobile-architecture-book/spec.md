## MODIFIED Requirements

### Requirement: ADR 037 ratifies the self-hosted OTA architecture

The Architecture Book SHALL contain and index ADR 037 recording self-hosted xprem with Cloudflare
R2 asset storage, xprem control-plane mode using the existing production Postgres service without
ClickHouse, signed updates, fingerprint runtime compatibility, and silent application at a
background-to-foreground boundary. ADR 037 SHALL also bind the implemented manifest URL, required
request headers, one-source build-time channel contract, public certificate path and metadata,
private-key custody boundary, retained EAS project linkage, and empirical fingerprint result. It
SHALL contain the exact sentence: “channel pointers and rollout percentages are imperative,
deliberately.”

#### Scenario: OTA client contract is recorded after wiring

- **WHEN** ADR 037 and the ADR index are read after implementation
- **THEN** they identify xprem, R2, Postgres without ClickHouse, signed updates, fingerprint
  compatibility, and silent foreground application as the ratified architecture
- **AND** ADR 037 records `https://ota.timecalendar.app/manifest`, the three xprem request headers,
  certificate verification contract, and `OTA_CHANNEL` source of truth
- **AND** it corrects the earlier deferral of endpoint, identifier, and certificate-path inputs

#### Scenario: Rollout control remains deliberately imperative

- **WHEN** ADR 037 describes channel pointers and staged rollouts
- **THEN** it contains the exact sentence “channel pointers and rollout percentages are imperative,
  deliberately.”
- **AND** it explains that incident-time rollout and rollback changes are not reconciled from Git

### Requirement: Current OTA and observability guidance reflects ADR 037

The Architecture Book SHALL keep `eas.md` aligned with the non-blocking silent-apply policy and the
implemented signed xprem client contract. It SHALL record the manifest endpoint, app UUID,
`expo-channel-name`/`expo-app-id`/`xprem-branch` headers, `OTA_CHANNEL` profile/local-build source,
database-managed signing mode, public certificate path/fingerprint/metadata, development OTA
disablement, retained EAS project linkage, and reproducible iOS/Android fingerprint result. It SHALL
keep `firebase.md` aligned with the five OTA Crashlytics keys and owned-seam rule, keep
`architecture.md` pointed at the canonical existing `CHANGELOG.md`, and append the client-wiring
rule change there. `runtime.md` SHALL change only if implementation changes its reusable
runtime/native baseline contract.

#### Scenario: Topical guidance describes the implemented client contract

- **WHEN** `eas.md` is read after implementation
- **THEN** it describes the exact release endpoint, headers, channel source, certificate
  verification, development disablement, and retained EAS id
- **AND** it distinguishes declarative build inputs from out-of-scope imperative publishing,
  channel mapping, rollout, and rollback actions

#### Scenario: Fingerprint evidence is reusable current guidance

- **WHEN** `eas.md` and ADR 037 are read
- **THEN** they record the exact SDK-56 commands and iOS/Android preview-versus-production result
- **AND** they record the native-affecting control result and any narrow correction or the reason no
  `.fingerprintignore` was added

#### Scenario: Existing changelog receives the client-wiring rule change

- **WHEN** the Architecture Book directory is inspected
- **THEN** `CHANGELOG.md` contains the signed xprem client-wiring and fingerprint-evidence entry
- **AND** no duplicate Architecture Book or `architecture-changelog.md` is created
