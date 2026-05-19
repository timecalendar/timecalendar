## ADDED Requirements

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
