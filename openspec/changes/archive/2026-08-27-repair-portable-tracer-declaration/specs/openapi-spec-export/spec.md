## ADDED Requirements

### Requirement: Spec emission build uses portable exported declarations
The server build that precedes OpenAPI emission SHALL expose portable TypeScript
declarations whose named types resolve through direct public dependencies. Exported helper
types MUST NOT depend on a transitive package's physical nested installation path, and the
repair MUST preserve runtime observability behavior.

#### Scenario: Equivalent dependency layouts build successfully
- **WHEN** the server dependency graph is installed in an npm-valid layout and built under
  Node `v24.13.0`
- **THEN** declaration emit completes without `TS2742` or another non-portable inferred-type
  error from the tracer instrumentation factory

#### Scenario: Instrumentation behavior is unchanged
- **WHEN** the portable declaration boundary is applied and the observability SDK is created
- **THEN** the existing auto-instrumentation configuration, disabled integrations, HTTP span
  sanitization hooks, exporter configuration, and SDK behavior remain unchanged

#### Scenario: Contract generation remains deterministic
- **WHEN** `npm run generate:openapi` runs under Node `v24.13.0` after the repair
- **THEN** it exits successfully and produces no diff in the committed
  `openapi/openapi.json` contract when controllers and DTOs are unchanged
