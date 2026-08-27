## Why

The pinned xprem v3.1.2 control plane is live and now owns TimeCalendar's per-app signing key,
but the repository contract still describes the endpoint, app identifier, and signing trust as
unavailable. The public bootstrap inputs must be recorded before client wiring can safely consume
them, without introducing a second key pair or committing any credential.

## What Changes

- Record the live xprem endpoint, TimeCalendar app UUID, database-managed signing mode, and the
  single downloaded public certificate trust root.
- Require the repository to contain only the public certificate and explicitly prohibit the
  separate Expo key-pair flow for this deployed app.
- Reconcile binding Architecture Book guidance and its changelog with the completed bootstrap
  while leaving client endpoint/header/certificate wiring to the downstream change.
- Supersede the exploration checklist's stale external-key generation step and make the bootstrap
  record's DNS/503 statements explicitly historical.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-distribution`: Establish the public xprem app identity and single signing trust root
  available to the later client-wiring change.
- `mobile-architecture-book`: Replace deferred bootstrap-input guidance with the completed public
  inputs while preserving the boundary around client wiring and publishing.

## Impact

This change adds one public X.509 certificate under `mobile/codesigning/certs/` and reconciles
documentation/specifications. It adds no private key, credential, token, app configuration,
publish action, channel mutation, deployment, store build, or submission.
