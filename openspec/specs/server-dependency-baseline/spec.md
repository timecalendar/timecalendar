# server-dependency-baseline Specification

## Purpose
TBD - created by archiving change server-dependency-upgrade. Update Purpose after archive.
## Requirements
### Requirement: Server framework and toolchain baseline

The server's framework and toolchain dependencies SHALL be kept at a maintained known-good baseline on current majors. The B9 wave SHALL bring the audited `server/package.json` dependencies to their target versions, with the caret floor raised so resolution is deterministic.

The targets are: `@types/node` `^22` (matching the `node:22` Docker runtime),
`typescript` the latest `5.x`, `eslint` `^9`, `@typescript-eslint` tooling
`^8`, `firebase-admin` `^13`, every `@nestjs/*` package on its NestJS-11 line
(`common`/`core`/`microservices`/`platform-express`/`testing`/`cli`/
`schematics` `^11`, `swagger` `^8`, `terminus` `^11`, `typeorm` `^11`,
`bullmq` `^11`, `event-emitter` `^3`), and `reflect-metadata` `^0.2`.

#### Scenario: Toolchain and framework are on target majors

- **WHEN** `server/package.json` is reviewed after the upgrade
- **THEN** `@types/node`, `typescript`, `eslint`, `@typescript-eslint`,
  `firebase-admin`, and `reflect-metadata` carry the target caret constraints
- **AND** every `@nestjs/*` package is on its NestJS-11 line, with no
  `@nestjs/*` package left on a 10.x constraint

#### Scenario: The upgrade leaves the server build- and test-green

- **WHEN** `npm run build`, `npm run test`, and `npm run lint` are run on the
  upgraded server
- **THEN** `nest build` compiles with no error
- **AND** the jest suite passes
- **AND** `npm run lint` passes with no new error
- **AND** the Phase 1 E2E smoke suite passes in CI

### Requirement: ESLint flat configuration

The server SHALL be linted with ESLint 9 flat configuration. A
`server/eslint.config.mjs` SHALL define the lint ruleset and the legacy
`server/.eslintrc.js` SHALL be removed. The flat config SHALL preserve the
prior ruleset: `eslint:recommended`, `@typescript-eslint/recommended`,
`import/recommended`, Prettier integration, the `no-restricted-imports` ban on
`../*`, `prefer-template`, the `import/order` `modules/**` path-group, and
`prettier/prettier` with `endOfLine: "auto"`.

#### Scenario: Lint runs on flat config

- **WHEN** the server lint setup is reviewed
- **THEN** `server/eslint.config.mjs` exists and `server/.eslintrc.js` is gone
- **AND** `npm run lint` lints the `{src,apps,libs,test}/**/*.ts` sources and
  passes with no new error

### Requirement: No redundant utility dependencies

The server SHALL depend on a single date-handling library and SHALL use the
native `glob` promise API. `dayjs` SHALL be removed in favour of `date-fns`,
and `glob-promise` SHALL be removed in favour of `glob` 10+'s native promise
export.

#### Scenario: One date library remains

- **WHEN** `server/package.json` is reviewed after the change
- **THEN** `date-fns` is present and `dayjs` is absent
- **AND** the former `dayjs` call sites use `date-fns` equivalents and
  `server/src/lib/dayjs/` no longer exists

#### Scenario: `glob` is used without a promise wrapper

- **WHEN** `server/package.json` and `server/src/scripts/seed-database.ts` are
  reviewed
- **THEN** `glob-promise` and `@types/glob` are absent and `glob` is `^10`+
- **AND** `seed-database.ts` imports `glob` directly (`import { glob } from
  "glob"`) and uses its native promise API

### Requirement: No fixable known dependency vulnerabilities

After the upgrade, the `server/` and `web/` npm workspaces SHALL carry no
`npm audit` finding that is resolvable without a breaking change. Non-breaking
fixes SHALL be applied via `npm audit fix`; any residual finding that would
require a breaking change SHALL be recorded as a documented exception (the
advisory id and the reason it is deferred).

#### Scenario: Audit is clean or every residual is documented

- **WHEN** `npm audit` is run on `server/` and on `web/` after the change
- **THEN** every finding fixable without a breaking change has been fixed
- **AND** each remaining finding has a documented exception with its advisory
  id and deferral reason

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

