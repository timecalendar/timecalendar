## ADDED Requirements

### Requirement: Base Compose configurability preserves the E2E overlay

The shared `server/docker-compose.yml` base SHALL remain compatible with
`server/docker-compose.e2e.yml` and `ci/e2e-server.sh` after local project isolation and
published-port overrides are added. The E2E lifecycle SHALL continue to address Postgres
and Redis by Compose service name and SHALL retain its existing explicit lifecycle owner.

#### Scenario: E2E resolved model remains valid

- **WHEN** Docker Compose resolves the base and E2E overlay files together
- **THEN** the model contains nginx, Postgres, Redis, and server with the existing health,
  dependency, bind-mount, and service-network contracts intact

#### Scenario: E2E lifecycle retains its own project handling

- **WHEN** `ci/e2e-server.sh` invokes its existing Compose function
- **THEN** it continues to own `up`, `down`, `logs`, and seed operations without being
  redirected through the local development entrypoint
