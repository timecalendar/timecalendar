## ADDED Requirements

### Requirement: Security-sensitive runtime dependencies are kept on patched majors

The server's runtime and observability dependencies that carry known security advisories SHALL be kept on patched, maintained majors. The TIM-72 Batch B remediation SHALL clear the advisory clusters that the B9 server upgrade recorded as deferred (breaking-change) exceptions, by bringing the audited `server/package.json` dependencies to these targets:

- `node-ical` `^0.26.1` (the `axios`-free release — drops the nested
  `axios@0.24` that carried 15 advisories)
- `nodemailer` `^8.0.7` with `@types/nodemailer` `^8.0.0`
- `@opentelemetry/sdk-node` `^0.218.0`,
  `@opentelemetry/auto-instrumentations-node` `^0.76.0`, and
  `@opentelemetry/exporter-trace-otlp-http` `^0.218.0` (the OTel `0.x`
  packages move in lockstep)
- `uuid` `^11.1.1` (the patched floor; the ESM-only `uuid@14` breaks the
  CommonJS jest runtime), with the redundant `@types/uuid` package removed
  (`uuid@11` ships its own type declarations)
- `ws` forced to `^8.20.1` via an npm `overrides` entry (the patched line is
  unreachable by `npm update` because `engine.io-client` pins `ws@~8.17.1`)
- `ai` (`^5.0.192`) and its companion `@ai-sdk/openai` (`^2.0.106`) bumped
  together so the whole `@ai-sdk` family resolves to one internally consistent
  set — bumping `ai` alone leaves it skewed against the old `@ai-sdk/openai`
  and breaks the build via `@ai-sdk` generic-type mismatch

#### Scenario: Batch B advisory clusters are cleared

- **WHEN** `npm audit` is run in `server/` after the change
- **THEN** the `axios`, `nodemailer`, `@opentelemetry/*`, `uuid`, `ws`, and
  `ai` advisory clusters listed by [TIM-113](/TIM/issues/TIM-113) are absent

#### Scenario: The bumps leave the server build- and test-green

- **WHEN** `npm run build`, `npm run test`, and `npm run lint` are run on the
  upgraded server
- **THEN** `nest build` compiles with no error
- **AND** the jest suite passes, including the `parse-ical` unit tests
  that guard `node-ical` iCal parsing
- **AND** `npm run lint` passes with no new error
- **AND** the Phase 1 E2E smoke suite passes in CI

#### Scenario: OpenTelemetry tracer uses the 2.x resource API

- **WHEN** `server/src/config/observability/tracer.ts` is reviewed after the
  `@opentelemetry/sdk-node` bump
- **THEN** the service resource is built with the
  `@opentelemetry/resources` 2.x `resourceFromAttributes()` factory
- **AND** no removed `Resource` class constructor is used
