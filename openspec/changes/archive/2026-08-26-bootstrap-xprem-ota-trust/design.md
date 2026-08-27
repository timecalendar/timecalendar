## Context

The deployed xprem v3.1.2 dashboard created the `TimeCalendar` app with UUID
`e89170b9-5b32-44f0-8f78-33eadb60ec28`. In this pinned version, dashboard-created apps use
database-key mode: xprem generates and encrypts the private signing key and exposes its public
certificate for clients. The downloaded certificate is already committed at
`mobile/codesigning/certs/certificate.pem` with SHA-256 fingerprint
`D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.

Binding Architecture Book guidance still reflects the earlier pre-bootstrap state, and the
exploration checklist still instructs an operator to generate a separate Expo key pair. Following
that old instruction would create an unrelated second trust root that the deployed xprem app does
not use.

## Goals / Non-Goals

**Goals:**

- Establish one public, auditable trust root for the deployed xprem app.
- Record the live endpoint, app UUID, signing mode, certificate path, and fingerprint in binding
  guidance and the canonical specifications.
- Make the private-key custody boundary explicit: xprem's encrypted database store, never git.
- Preserve a clean handoff for downstream client initialization.

**Non-Goals:**

- Changing `mobile/app.config.ts`, `updates.url`, request headers, channels, or runtime behavior.
- Creating an Expo signing key pair, extracting xprem's private key, or committing credentials.
- Publishing, rolling back, deploying, building, submitting, or changing store configuration.

## Decisions

### Decision 1 — Trust xprem's database-managed per-app key

The repository trusts the certificate exported by the deployed app. The external
`expo-updates codesigning:generate` procedure is superseded for TimeCalendar because it would not
match the key xprem uses to sign updates.

### Decision 2 — Record public bootstrap inputs without claiming client wiring

The Architecture Book records the endpoint, app UUID, signing mode, certificate path, and
fingerprint as available inputs. It continues to state that `updates.url` remains on the hosted
default until the downstream client-wiring change consumes them.

### Decision 3 — Keep operational history truthful

The bootstrap record retains the earlier DNS/503 observations only as pre-apply context. Its
current-state result and verification sections remain the source for the completed live checks.

## Risks / Trade-offs

- **A second key pair is generated from stale documentation** → Replace §3.1 with the completed
  database-key flow and an explicit prohibition.
- **The certificate is mistaken for a secret** → Record that the committed PEM is the public trust
  input; private signing material remains in xprem's encrypted database store.
- **Readers assume the client already uses xprem** → State in every binding handoff that endpoint,
  header, channel, and certificate wiring remains downstream.
