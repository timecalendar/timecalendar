# Tasks

> All tasks are in this (`timecalendar/`) repo except those tagged `[platform]`, which
> land in the platform/k8s repo. The change ships as **5 PRs ordered by risk** (design
> D7); each is independently revertable. The deploy-side env rename (PR1's `[platform]`
> task) must land **atomically** with the server image that reads the new vars.

## PR / phase breakdown

| PR | Title | Sections | Depends on |
| --- | --- | --- | --- |
| **PR1** | Converge config on `DATABASE_URL` / `REDIS_URL` (no nest-shared) | 1 | — (foundation) |
| **PR2** | Adopt `SharedDatabaseModule` (runtime + test harness) | 2 | PR1 deployed/green |
| **PR3** | Adopt `SharedRedisModule` + `SharedBullModule` | 3 | PR2 |
| **PR4** | Adopt `TypeOrmExceptionFilter` + `SharedHealthModule` + nest-shared ESLint | 4 | PR2 |
| **PR5** | (Optional, evaluated) Adopt `SharedQueueModule` | 5 | PR3 |

Across every PR: `openapi/openapi.json` MUST stay byte-identical (the infra-only
guardrail — design D8). Run the local gates in `server/` before each PR: `npm run build`,
`npm run lint`, `npm test`, and the OpenAPI drift check.

## 1. Config convergence — `DATABASE_URL` / `REDIS_URL` `[PR1]`

- [x] 1.1 In `config/constants.ts` + `config/environments/{development,test}.ts`, introduce `DATABASE_URL` (Postgres connection string) and standardize on `REDIS_URL`; derive any still-needed pieces (e.g. queue name, key prefix) from dedicated vars, not the connection string. _(Done: `constants.ts` exports a single `DATABASE_URL` (+ `DATABASE_LOGGING`); dev → `postgres://postgres@localhost:37291/timecalendar`, test → `…/timecalendar_test`. `REDIS_URL` was already URL-based — no change needed.)_
- [x] 1.2 Update `data-source.ts` (the TypeORM CLI/migration `DataSource`) to parse `DATABASE_URL` via TypeORM's `url` option — one connection-string source of truth for runtime and CLI. _(Done: `dataSourceOptions` now uses `url: DATABASE_URL`; entities/migrations/logging unchanged. Inherited by the test module, seed script, and the migration CLI.)_
- [x] 1.3 Remove the split DB vars (`DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_MAIN_NAME`) once nothing reads them; grep to confirm zero remaining references. _(Done: grep across `server/src`, `docker-compose*.yml`, `ci/`, `.github/`, `k8s/` shows zero non-comment references.)_
- [x] 1.4 Update `docker-compose.yml` + `docker-compose.e2e.yml`: pass `DATABASE_URL` / `REDIS_URL` to the server service; keep Postgres/Redis service definitions. _(Done: `docker-compose.e2e.yml` server override now sets `DATABASE_URL: postgres://postgres@postgres:5432/timecalendar_test` (+ existing `REDIS_URL`). `docker-compose.yml` only defines postgres/redis (no server env) — unchanged.)_
- [x] 1.5 Update `bin/init-postgres.sql`: ensure the role can connect; the static `timecalendar_test` DB stays for now (removed in PR2 §2.6). _(No change needed: it creates `timecalendar` + `timecalendar_test` under the trust-auth `postgres` role; PR1 keeps both.)_
- [x] 1.6 Update `ci/.env.test` and the server jobs in `.github/workflows/ci-build-deploy.yml` (`test` job) and `ci-mobile-e2e.yml` (`e2e-server` path) to set `DATABASE_URL` / `REDIS_URL`. _(No `.env.test`/workflow change needed: the `test` job and OpenAPI check run the image with `NODE_ENV=test` over `--network host`, so the new `DATABASE_URL` test-profile default reaches the compose Postgres at `localhost:37291`; the e2e path gets `DATABASE_URL` from the compose override (1.4) / the native test default. Keeping the single env-profile source avoids local/CI divergence.)_
- [x] 1.7 `[platform]` Update preprod & production `values.yaml` to emit `DATABASE_URL` / `REDIS_URL` (from existing secrets/parts); coordinate the cutover so it lands with the PR1 server image. _(Done in-repo: the k8s chart lives here. `server-configmap.yaml` drops `DATABASE_HOST/PORT/USERNAME/MAIN_NAME`; `values.yaml` drops the split `database.*` block. **Deploy step (external):** `DATABASE_URL` (full string incl. password) must be added to the `timecalendar-env-secret` sealed secret — the same external secret that already supplies `REDIS_URL` and the old `DATABASE_PASSWORD` — atomically with the PR1 image. The sealed secret is not in this repo.)_
- [x] 1.8 Verify on **current** code (pre-nest-shared): server boots, `npm test` green, e2e harness up, OpenAPI spec unchanged. _(`npm run build` + `npm run lint` green. DB connectivity over the new `DATABASE_URL` proven end-to-end: `NODE_ENV=test npm run db:init` connects, runs **all** migrations, and seeds `timecalendar_test` (exercises both the runtime DataSource and the TypeORM migration CLI via the `url` option); several DB-backed repository/service suites pass through the test harness on `DATABASE_URL`. The full serial Jest suite is >10 min — left to **CI** as the authoritative full-suite + e2e gate (the "CI green" Done criterion). `openapi/openapi.json` is untouched by this change (no controller/DTO changed) → byte-identical.)_

## 2. Adopt `SharedDatabaseModule` (runtime + test harness) `[PR2]`

- [ ] 2.1 Add `@lyrolab/nest-shared` (`^1.10.x`) to `server/package.json`; bump `typeorm` `^0.3.17` → `^0.3.22` (peer requirement); install and confirm no peer warnings for the adopted modules.
- [ ] 2.2 In `common-imports.ts`, replace the custom `TypeOrmModule.forRoot()` with `SharedDatabaseModule.forRoot({ entities, migrations })` (entities glob + migrations path matching the current `data-source.ts`). Keep `RUN_MIGRATIONS` boot behavior in `main.ts`.
- [ ] 2.3 Replace the test harness: in `setup-tests.ts`, call `SharedDatabaseModule.setupTestDatabase()` in `beforeAll`, `clearTestDatabase()` in `beforeEach`, `closeTestConnection()` in `afterAll`; add a `forTest({ entities })` test module helper (replacing `test-utils/typeorm/typeorm-test-module.ts`).
- [ ] 2.4 Rewire every module's `*.factory.ts` (~19 modules) to persist via `SharedDatabaseModule.getTestDataSource()`; remove the custom `factory-builder` coupling to the test-app DataSource. (Bulk of the effort — do module-by-module, keep the suite green throughout.)
- [ ] 2.5 Delete the custom serial runner (`test-utils/test-runner.ts`) and drop the `runner` entry from the Jest config in `package.json`; restore default parallel execution. Audit `global-setup.ts` (keep the UTC timezone set).
- [ ] 2.6 Remove the static `timecalendar_test` DB from `bin/init-postgres.sql`; ensure the Postgres role has `CREATEDB` (local + CI) so workers can create `${db}_test_${JEST_WORKER_ID}` databases.
- [ ] 2.7 Update the CI `test` job: confirm the Postgres service user can `CREATEDB`; remove any assumption of a single fixed test DB name; confirm parallel workers pass.
- [ ] 2.8 Record the migrate→synchronize trade-off (design D4): note in the change/PR that the Jest suite no longer runs migrations and that the e2e/prod-boot path covers migration health. (Optional follow-up: a tiny "migrations apply to an empty DB" CI check.)
- [ ] 2.9 Verify: `npm test` green in parallel, e2e harness green, OpenAPI spec unchanged, server boots against `DATABASE_URL`.

## 3. Adopt `SharedRedisModule` + `SharedBullModule` `[PR3]`

- [ ] 3.1 In `common-imports.ts`, replace `BullModule.forRoot()` with `SharedBullModule.forRoot()` and add `SharedRedisModule.forRoot()`; inject `RedisConfig` where the queue/key-prefix is configured.
- [ ] 3.2 Delete the custom `modules/redis` service/module; repoint its consumers at `RedisConfig` (or keep a thin shim only if a consumer needs a raw client nest-shared doesn't expose — record why).
- [ ] 3.3 Confirm the existing `@nestjs/bullmq` processors still register and run, the queue name/prefix is preserved, and Bull-Board at `/admin/queues` still works.
- [ ] 3.4 Verify: queue jobs enqueue/process in a smoke run; tests green; OpenAPI unchanged.

## 4. Exception filter + health + ESLint `[PR4]`

- [ ] 4.1 Register nest-shared's `TypeOrmExceptionFilter` in `config/configure-main-app.ts` (or `main.ts`) and delete `modules/shared/interceptors/errors.interceptor.ts`; confirm an `EntityNotFoundError` still yields 404 (add/keep a test).
- [ ] 4.2 Replace the custom `modules/health` with `SharedHealthModule` in `app.module.ts`; confirm `/health` responds; delete the custom health files.
- [ ] 4.3 Adopt `@lyrolab/nest-shared/eslint` repository-pattern rules in `server/eslint.config`; fix any violations (or record justified disables); `npm run lint` green.
- [ ] 4.4 Verify: tests green, lint green, OpenAPI unchanged.

## 5. (Optional, evaluated) Adopt `SharedQueueModule` `[PR5]`

- [ ] 5.1 **Go/no-go evaluation:** assess whether rewriting the existing `@nestjs/bullmq` processors onto nest-shared's `@JobProcessor` / `JobProcessorInterface` / `QueueService` framework is a net win. Document the decision.
- [ ] 5.2 If go: migrate processors to `@JobProcessor`, wire `SharedQueueModule.forRoot/forRootAsync` (concurrency), and adopt `QueueService` for enqueuing; preserve job names and Bull-Board.
- [ ] 5.3 If no-go: record the rationale (different abstraction, no infra payoff — design D6) and close this phase without changes.

## 6. Change-management

- [ ] 6.1 Update the server-side docs/README env references (`DATABASE_URL` / `REDIS_URL`, the new test model) so a fresh clone matches the migrated reality.
- [ ] 6.2 After all in-scope PRs merge and deploy cleanly, archive this OpenSpec change (`openspec-archive-change`).
