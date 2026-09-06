## Why

The server Compose contract currently calls diagnostics “non-mutating” even though the wrapper
deliberately provisions checkout-local TLS material before most Compose-backed commands. The
contract needs to distinguish forbidden Docker-resource mutation from this permitted, gitignored
file provisioning so its diagnostics and first-use behavior can both be true and testable.

## What Changes

- Define non-mutating Compose diagnostics as creating, starting, stopping, restarting, removing,
  or otherwise changing no Docker resource.
- Explicitly allow a Compose-backed diagnostic to provision or renew the checkout-local
  `ci/certificates/cert.pem` and `key.pem` pair before it invokes Docker Compose.
- Preserve the file- and service-pure exceptions: `bin/server-compose.sh project-name` and
  `bin/setup-dev.sh --compose-config` continue to provision nothing and contact no service.
- Align the developer handbook with that boundary and add the smallest focused contract proof
  that keeps the specification, handbook, and established wrapper behavior consistent.
- Preserve the existing first-use and renewal guard; do not add a Compose-subcommand allowlist or
  change wrapper behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-compose-development-environment`: distinguish Docker-resource non-mutation from
  permitted checkout-local TLS provisioning, while retaining the explicitly pure diagnostic
  modes.

## Impact

- Expected implementation surfaces: the
  `openspec/specs/server-compose-development-environment/spec.md` contract,
  `docs/agent-dev-environment.md`, and a narrowly related contract-level verification.
- Sensitive surface: `ci/certificates/` is implicated because the documentation names its two
  generated paths. No file under that directory is changed; no certificate or private-key
  material is read, printed, staged, or committed.
- `bin/server-compose.sh`, `bin/setup-dev.sh`, and the certificate guard retain their current
  behavior. Verification uses no Docker lifecycle command and changes no container, network,
  volume, image, or other Docker resource.
- No API or generated client contract, database schema or migration, mobile/native/store config,
  deployment infrastructure, CI workflow, dependency, or legacy Flutter behavior changes.
- No Architecture Book or roadmap update is required: this corrects a repository-wide local
  development contract and does not alter the mobile architecture or migration sequence.
