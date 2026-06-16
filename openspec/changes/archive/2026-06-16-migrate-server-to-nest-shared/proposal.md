## Why

The TimeCalendar NestJS server (`server/`) was built before `@lyrolab/nest-shared` —
our company-wide, opinionated NestJS library — existed, so it hand-rolls the same
infrastructure the rest of the platform now gets for free: a custom TypeORM
bootstrap (`common-imports.ts` + `data-source.ts`), a custom Redis module, a custom
test-database harness (a bespoke **serial** Jest runner + a single shared
`timecalendar_test` database + `factory-builder`), a custom `ErrorsInterceptor`, and
a custom health module. Three sibling services — **boardbot** (most extensive),
**lyrochat**, and **payflow** — already stand on nest-shared and share one mental
model for database/redis/queue/test setup, one set of env-var conventions
(`DATABASE_URL` / `REDIS_URL`), and one parallel, worker-isolated test harness.

TimeCalendar is the outlier. Adopting nest-shared deletes a meaningful amount of
custom infrastructure, converges this service onto the company's conventions so an
engineer moving between repos sees the same shapes, and — the biggest concrete win —
lets us **drop the custom serial test runner and run the test suite in parallel**
(nest-shared isolates a Postgres database per Jest worker), which is faster and is
exactly the model the other three services already run.

This change is the **OpenSpec proposal** for that migration. Its deliverable is the
plan (proposal + design + capability specs + task breakdown); the implementation
ships as the phased PRs the task breakdown defines.

## What Changes

The migration is **infrastructure-only** — no API contract, no business logic, and
no OpenAPI-spec changes. It adopts nest-shared everywhere it genuinely fits and
records, with reasons, the modules it deliberately does **not** adopt.

- **Converge config on URL-style env vars (foundation, no nest-shared yet).**
  nest-shared reads `DATABASE_URL` and `REDIS_URL` directly. Introduce `DATABASE_URL`
  (replacing the split `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USERNAME` /
  `DATABASE_PASSWORD` / `DATABASE_MAIN_NAME` set) and standardize on `REDIS_URL`
  across `config/constants.ts`, the dev/test environment profiles, `data-source.ts`
  (still needed for the TypeORM migration CLI), `docker-compose*.yml`,
  `bin/init-postgres.sql`, `ci/.env.test`, and the platform/k8s values. This is the
  riskiest *blast-radius* change, so it lands first and alone.

- **Adopt `SharedDatabaseModule` for the runtime and the test harness (the core).**
  Replace the `TypeOrmModule.forRoot()` in `common-imports.ts` with
  `SharedDatabaseModule.forRoot({ entities, migrations })`. Replace the custom test
  harness — `test-utils/typeorm/typeorm-test-module.ts`, the `setup-tests.ts`
  migrate-then-truncate flow, and the **custom serial `test-runner.ts`** — with
  nest-shared's `setupTestDatabase()` / `clearTestDatabase()` / `getTestDataSource()`
  (a Postgres DB per Jest worker, schema built via `synchronize`), and rewire the
  Fishery factories onto `getTestDataSource()`. The serial runner is **deleted**;
  tests run in parallel.

- **Adopt `SharedRedisModule` + `SharedBullModule`.** Replace the custom
  `modules/redis` service and the `BullModule.forRoot()` in `common-imports.ts` with
  `SharedRedisModule.forRoot()` (provides the injectable `RedisConfig` from
  `REDIS_URL`) and `SharedBullModule.forRoot()` (BullMQ wired to that Redis), matching
  payflow/lyrochat/boardbot. The existing `@nestjs/bullmq` processors and the
  `/admin/queues` Bull-Board UI are preserved.

- **Adopt `TypeOrmExceptionFilter` and `SharedHealthModule`.** Replace the custom
  `ErrorsInterceptor` (which maps `EntityNotFoundError` → 404) with nest-shared's
  `TypeOrmExceptionFilter`, and replace the custom `modules/health` with
  `SharedHealthModule` (terminus-based `/health`).

- **Adopt the nest-shared ESLint rules** (`@lyrolab/nest-shared/eslint`) that enforce
  the repository pattern (`no-typeorm-in-non-repository`, `no-repository-in-controller`,
  `no-export-repository-in-module`), aligning lint with the sibling services.

- **Keep TimeCalendar's richer bootstrap; adopt only the filter from it.** nest-shared's
  `configureApp` is a strict subset of TimeCalendar's `config/configure-main-app.ts`
  (TimeCalendar additionally wires `helmet`, `compression`, the **custom
  `CustomValidationPipe`** with its `REWRITE_VALIDATION_OPTIONS` metadata, request
  timeouts, and Bull-Board). We keep TimeCalendar's bootstrap and fold in only the
  `TypeOrmExceptionFilter` — mirroring boardbot's hybrid approach (design D5).

- **Deliberately out of scope (recorded, not silently skipped — design D6):**
  - `SharedQueueModule` (the `@JobProcessor` framework) — TimeCalendar uses
    `@nestjs/bullmq` processors directly; adopting the framework is a real processor
    rewrite with no infra payoff, proposed as an evaluated **follow-up**, not this change.
  - `SharedCacheModule` — TimeCalendar uses no `cache-manager` today; nothing to migrate.
  - `SharedAiModule` — nest-shared targets OpenRouter; TimeCalendar uses the Vercel AI
    SDK against OpenAI directly. Different provider; no forced swap.
  - `SharedAuthModule` — nest-shared is Keycloak/JWT; TimeCalendar uses a simple Bearer
    `API_TOKEN` guard. Different auth model; keep current.
  - **Observability (OTel → Grafana)** — nest-shared provides none; TimeCalendar's OTel
    stack (and the in-flight `migrate-observability-to-grafana-stack` change) is left
    entirely untouched.

## Capabilities

### New Capabilities
- `server-shared-infrastructure`: How the TimeCalendar server stands up its runtime
  infrastructure — database, Redis, queue connection, exception mapping, and health —
  on `@lyrolab/nest-shared` with URL-style (`DATABASE_URL` / `REDIS_URL`) configuration,
  and what it deliberately keeps custom.
- `server-test-harness`: The server's test-database isolation model on nest-shared — a
  Postgres database per test worker, schema via `synchronize`, parallel execution
  (serial runner removed), factories bound to the shared test `DataSource`.

### Modified Capabilities
<!-- None — the server has no existing OpenSpec capability spec; these are the first. -->

## Impact

- **Server runtime (`server/src`):** `common-imports.ts` (TypeORM/Bull/Redis →
  `SharedDatabaseModule` / `SharedBullModule` / `SharedRedisModule`); `app.module.ts`
  (health module swap); `main.ts` + `config/configure-main-app.ts` (filter swap,
  `ErrorsInterceptor` removed); `data-source.ts` + `config/constants.ts` +
  `config/environments/*` (URL-style config). **Deleted:** `modules/redis/*`,
  `modules/health/*` (custom), `modules/shared/interceptors/errors.interceptor.ts`,
  `test-utils/typeorm/typeorm-test-module.ts`, `test-utils/test-runner.ts`.
- **Server tests (`server/src`):** `setup-tests.ts`, `global-setup.ts`, the Jest config
  block in `package.json` (drop the custom `runner`), every module's `*.factory.ts`
  (rewire to `getTestDataSource()`), and any test that assumed serial execution or a
  fixed `timecalendar_test` database name. **The factory rewire is the bulk of the
  effort** (~19 modules).
- **Dependencies (`server/package.json`):** add `@lyrolab/nest-shared` (public npm
  package — **no registry auth needed**); bump `typeorm` `^0.3.17` → `^0.3.22` to meet
  the peer range; remove anything the deleted custom modules pulled in.
- **Infra & CI:** `docker-compose.yml` / `docker-compose.e2e.yml` (Postgres/Redis env →
  URL form), `bin/init-postgres.sql` (the test user needs `CREATEDB`; the static
  `timecalendar_test` DB is replaced by per-worker DBs created at runtime),
  `ci/.env.test` and `.github/workflows/ci-build-deploy.yml` + `ci-mobile-e2e.yml`
  (`DATABASE_URL` / `REDIS_URL`), and the platform/k8s `values.yaml` for preprod &
  production (the deploy-side env rename — coordinate so the rename lands atomically
  with the image that reads it).
- **OpenAPI / web / mobile:** **none.** `openapi/openapi.json` must be byte-identical
  after the migration (the CI drift check is a guardrail that the change is truly
  infra-only).
- **Risk surface:** the test-harness swap (serial→parallel, migrate→synchronize) is the
  load-bearing risk — see design D3/D4. The schema-built-by-`synchronize` decision means
  the test suite stops exercising migrations; that trade-off is called out explicitly.
