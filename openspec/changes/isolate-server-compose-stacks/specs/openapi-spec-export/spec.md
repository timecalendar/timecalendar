## ADDED Requirements

### Requirement: Spec generation supports dependency-only Compose startup

The repository SHALL document OpenAPI spec generation with a prerequisite that starts only
Postgres and Redis through the worktree-scoped local Compose entrypoint. The command SHALL
support alternate published database and Redis ports through matching `DATABASE_URL` and
`REDIS_URL` environment values and SHALL NOT require nginx.

#### Scenario: TLS port is occupied during local generation

- **WHEN** port `1443` is unavailable but suitable Postgres and Redis host ports are free
- **THEN** a contributor can start only the two dependencies on those ports and successfully
  invoke `npm run generate:openapi` with matching test-profile connection URLs

#### Scenario: Default generation instructions remain simple

- **WHEN** the default ports are available in a single checkout
- **THEN** the documented dependency-only startup and generation commands use the existing
  `37291` and `37292` connection defaults without additional configuration
