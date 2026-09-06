## ADDED Requirements

### Requirement: Local TLS material is provisioned, never committed

The repository SHALL NOT track the local development TLS certificate or private key, and the local server Compose entrypoint SHALL provision that pair into the directory nginx mounts before it hands control to Docker Compose. The certificate configuration and the generation scripts SHALL remain tracked, and the generation script SHALL resolve its own directory for both its configuration input and its outputs so it behaves identically from any working directory.

#### Scenario: A fresh checkout has no certificate material

- **WHEN** the repository is inspected for tracked files under the certificates directory
- **THEN** no certificate or private key file is tracked, both paths are ignored, and the
  certificate configuration and the generation and provisioning scripts remain tracked

#### Scenario: Starting the stack provisions the material it needs

- **WHEN** a contributor runs the local Compose entrypoint from a checkout with no certificate
  material present
- **THEN** the entrypoint generates the pair into the mounted directory before invoking Docker
  Compose, and the nginx service starts and keeps running instead of failing on a missing file

#### Scenario: Setup diagnostics work without a prior stack start

- **WHEN** the setup diagnostics script is run standalone on a checkout with no certificate
  material present
- **THEN** it provisions the pair before its trust and reachability checks, and reports that a
  newly generated certificate requires an nginx restart and a fresh trust step

#### Scenario: No CI path depends on the certificate

- **WHEN** any repository workflow or the shared E2E server lifecycle starts Compose services
- **THEN** it names the services it needs and does not create or start nginx, so no CI path
  reads or requires the certificate pair

### Requirement: Certificate provisioning is idempotent and long-lived

Provisioning SHALL regenerate the pair only when it is absent, unreadable, or within its configured renewal window, and SHALL otherwise leave the existing pair untouched. A generated certificate SHALL remain valid for at least one year, and both the certificate lifetime and the renewal window SHALL be overridable through the environment.

#### Scenario: Repeated invocations do not rotate the certificate

- **WHEN** the provisioning step runs repeatedly against an existing pair that is outside its
  renewal window
- **THEN** the certificate and key files are left byte-for-byte unchanged, so a certificate
  already trusted in a simulator, keychain, or browser store stays trusted

#### Scenario: An expiring certificate is replaced before it fails

- **WHEN** the provisioning step runs against a pair whose remaining validity is inside the
  renewal window, or against a missing or unreadable pair
- **THEN** it generates a replacement pair in place and reports that it did so

#### Scenario: A generated certificate outlives a year

- **WHEN** a freshly generated certificate is checked for at least one year of remaining
  validity
- **THEN** the check passes, and the certificate covers the `timecalendar.host`,
  `api.timecalendar.host`, and `web.timecalendar.host` names

## MODIFIED Requirements

### Requirement: Selected configuration is diagnosable

The local Compose entrypoint and setup diagnostics SHALL identify the selected project name and effective host ports, and setup diagnostics SHALL distinguish a TLS certificate fault from an unreachable proxy rather than reporting one opaque failure for both. Setup reachability checks SHALL use the effective TLS port and SHALL keep the default URLs documented as `https://api.timecalendar.host:1443` and the backend on `http://localhost:3005` when no overrides are set.

#### Scenario: Contributor inspects ownership before startup

- **WHEN** the contributor resolves the Compose config or runs setup diagnostics
- **THEN** the output names the project and effective TLS, Postgres, and Redis host ports
  without requiring any Docker service mutation

#### Scenario: Config-only diagnostics never provision or mutate

- **WHEN** the contributor requests the Compose project name or the setup script's
  configuration-only output
- **THEN** the command prints the selected identity and ports and writes no file, generates no
  certificate material, and contacts no service

#### Scenario: A certificate fault names itself

- **WHEN** the reachability check fails because the served certificate cannot be verified
  against the local certificate
- **THEN** the diagnostics identify the certificate as the cause and name the nginx restart and
  re-trust steps, instead of attributing the failure to DNS, nginx, or a stopped stack
