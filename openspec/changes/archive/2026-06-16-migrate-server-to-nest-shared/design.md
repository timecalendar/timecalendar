# Design — migrate the TimeCalendar server to `@lyrolab/nest-shared`

> Context for the decisions below: how the three sibling services use nest-shared, and
> where TimeCalendar's custom setup differs, were established by a full investigation of
> `payflow`, `lyrochat`, `boardbot`, the `nest-shared` source, and the TimeCalendar
> `server/` tree. The load-bearing facts are summarized inline where each decision needs
> them.

## D1 — Adopt nest-shared as a versioned npm dependency (not vendored)

nest-shared publishes to the **public** npm registry (`@lyrolab/nest-shared`,
`publishConfig.access: "public"`; the sibling repos have empty `.npmrc` and install it
with a plain caret range). So TimeCalendar adds it like any other dependency — **no
private-registry auth, no `.npmrc`, no Docker build-secret** is required, which removes
the single biggest infra risk a shared-library adoption usually carries.

Pin a caret range matching the latest the siblings run (`^1.10.x`, payflow's version).
Its peer dependencies are the NestJS-11 ecosystem TimeCalendar already has, with one
gap: nest-shared peers `typeorm ^0.3.22` and TimeCalendar is on `^0.3.17` — bump it
(a patch-level move within 0.3.x; low risk). The AI/auth peers (`ai ^6`,
`@openrouter/ai-sdk-provider`, `passport*`) are only pulled in by the modules we are
**not** adopting, so they impose nothing here.

*Rejected:* vendoring/copying nest-shared into the repo — defeats the entire point
(shared maintenance, one upstream), and the package is public so there is no access
reason to vendor.

## D2 — Converge env config on `DATABASE_URL` / `REDIS_URL`, as its own first phase

nest-shared is **opinionated about config**: `SharedDatabaseModule` reads
`DATABASE_URL` (via `ConfigService` at runtime, and via `process.env.DATABASE_URL`
directly in the test-DB setup), and `SharedRedisModule` reads `REDIS_URL`. There is no
split-host option. TimeCalendar today uses split DB vars (`DATABASE_HOST`,
`DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_MAIN_NAME`) and
already uses `REDIS_URL` for Redis.

So the migration **must** introduce `DATABASE_URL`. This touches a wide, cross-cutting
surface (constants, env profiles, the typeorm CLI `data-source.ts`, docker-compose, the
init SQL, CI env files, and the platform/k8s values) but is mechanically simple and
carries **no** library coupling. Doing it as **phase 1, alone** (no nest-shared yet)
de-risks everything after it: the env change can be deployed and verified on the
*current* code before any module swaps. The split vars are removed once nothing reads
them.

One subtlety: the **typeorm migration CLI** (`npm run db:generate` / migration runs)
needs a `DataSource`. Keep `data-source.ts`, but have it parse `DATABASE_URL` (TypeORM's
`url` option) instead of the split fields — one source of truth for the connection
string across runtime and CLI.

## D3 — Adopt nest-shared's worker-isolated test DB; delete the serial runner

This is the highest-value and highest-risk decision. **Current** TimeCalendar test model:
a custom Jest `runner` (`test-utils/test-runner.ts`) forces **serial** execution, a
single shared `timecalendar_test` database is migrated once in `beforeAll`, and each
test `TRUNCATE`s all tables in `beforeEach`. Serial execution is a direct consequence of
the single shared database — parallel workers would clobber each other.

**nest-shared's model** (identical across payflow/lyrochat/boardbot): `setupTestDatabase()`
derives a worker-specific name `${db}_test_${JEST_WORKER_ID}` (or `VITEST_POOL_ID`),
`DROP … CREATE`s that database, and builds its schema with `synchronize: true` from the
entity metadata; `clearTestDatabase()` truncates; `getTestDataSource()` exposes the
worker's `DataSource` to factories; `forTest({ entities })` mounts the Nest TypeORM module
against the worker DB. Because each worker owns its own database, **tests run in parallel**
and the custom serial runner is **deleted** (the default Jest runner is restored).

Consequences accepted:
- **Faster suite, standard runner.** The bespoke `test-runner.ts` (a maintenance burden
  unique to this repo) goes away.
- **The test user needs `CREATEDB`.** Workers create/drop databases at runtime. Locally
  the `postgres` superuser already has it; in CI the default Postgres service user is a
  superuser. `bin/init-postgres.sql` no longer needs to pre-create `timecalendar_test`
  (the static DB is replaced by per-worker DBs) but must ensure the role can `CREATEDB`.
- See D4 for the migrate-vs-synchronize trade-off this pulls in.

*Rejected:* keeping the serial runner and only swapping the module wiring — it would
leave TimeCalendar the one service that can't parallelize tests and would keep the custom
runner alive, contradicting the "rely on nest-shared as much as possible" goal.

## D4 — Test schema via `synchronize`, not migrations (explicit trade-off)

nest-shared builds each worker's test schema with `synchronize: true` (TypeORM derives
DDL from entity metadata) — it does **not** run the migration files. TimeCalendar today
**migrates** the test DB, so its suite currently doubles as a smoke test that the
migration chain produces a working schema.

Adopting nest-shared means the **test suite stops exercising migrations**. This is the
deliberate company convention (all three siblings accept it) and it is faster and simpler,
but it creates a gap: a broken or drifted migration would no longer fail unit/e2e tests.

Mitigation (kept in scope): production already runs migrations on boot
(`RUN_MIGRATIONS=true`), and the **e2e harness** (`ci/e2e-server.sh`, used by the mobile
e2e) boots the real server image against a real Postgres — that path **does** run
migrations and seed, so migration health stays covered there, not in the Jest suite.
Record this explicitly so the gap is a known, covered trade-off rather than a silent
regression. A tiny CI "migrations apply cleanly to an empty DB" check is noted as optional
follow-up if we want belt-and-braces.

*Rejected:* forcing nest-shared to run migrations in tests (would require patching
upstream or bypassing its setup helpers — defeats adoption and diverges from the siblings).

## D5 — Keep TimeCalendar's bootstrap; adopt only `TypeOrmExceptionFilter`

nest-shared's `configureApp` does: `ValidationPipe({ whitelist, forbidNonWhitelisted })`,
global `TypeOrmExceptionFilter`, CORS from `FRONTEND_URL`, shutdown hooks, Swagger on
`/api`. TimeCalendar's `config/configure-main-app.ts` is a **superset**: it also wires
`helmet`, `compression`, the **custom `CustomValidationPipe`** (which honors per-DTO
`REWRITE_VALIDATION_OPTIONS` metadata — a feature nest-shared's plain pipe lacks), HTTP
server timeouts, open CORS (`origin: *`, intentional for the public calendar API), and the
Bull-Board admin mount.

So `configureApp` cannot wholesale-replace TimeCalendar's bootstrap without **losing
behavior**. Decision: keep `configure-main-app.ts`, and fold in only nest-shared's
`TypeOrmExceptionFilter` (replacing the custom `ErrorsInterceptor`, which does the same
`EntityNotFoundError` → 404 job less idiomatically). This mirrors **boardbot's** hybrid
(custom bootstrap, nest-shared filter) and is the honest application of R-2 (shared by
convenience, custom where genuinely divergent) rather than dropping features to fit the
helper.

*Rejected:* adopting `configureApp` and re-adding helmet/compression/Bull-Board/custom-pipe
around it — strictly more code than keeping the working bootstrap, for no convergence
benefit (the siblings themselves diverge here: lyrochat uses `configureApp`, boardbot and
payflow do not).

## D6 — Adopt every infra module that fits; record the four that don't

The goal is "rely on nest-shared as much as possible," so the default is **adopt**. The
modules split cleanly:

**Adopt (genuine infra fit):** `SharedDatabaseModule`, `SharedRedisModule`,
`SharedBullModule`, `TypeOrmExceptionFilter`, `SharedHealthModule`, and the
`@lyrolab/nest-shared/eslint` repository-pattern rules. Each replaces a hand-rolled
TimeCalendar equivalent one-for-one.

**Do not adopt (recorded with reason, not silently skipped):**
- **`SharedQueueModule`** (the `@JobProcessor` discovery framework + `QueueService`):
  TimeCalendar's jobs are `@nestjs/bullmq` `Processor`/`WorkerHost` classes. nest-shared's
  framework is a *different* job abstraction; adopting it is a processor-by-processor
  rewrite with no infrastructure payoff (the Redis/Bull *connection* is already shared via
  `SharedBullModule`). Proposed as a separate, **evaluated follow-up** — not bundled here,
  where it would balloon the diff and the risk.
- **`SharedCacheModule`**: TimeCalendar has no `cache-manager` usage. Nothing to migrate;
  adopting it would add an unused dependency (R-2: no speculative adoption).
- **`SharedAiModule`**: nest-shared targets **OpenRouter**; TimeCalendar uses the Vercel
  **AI SDK against OpenAI** directly (`OPENAI_API_KEY`). Different provider and model
  policy — a forced swap would be a behavior change masquerading as a migration.
- **`SharedAuthModule`**: nest-shared is **Keycloak/JWT**; TimeCalendar authenticates with
  a single static Bearer `API_TOKEN` guard. No Keycloak, no users table — the module
  doesn't apply.

This keeps the migration honest: extensive adoption where it fits, explicit and
justified exclusions where it doesn't.

## D7 — Phasing: five PRs, ordered by risk, each independently shippable

The work is sequenced so the scary parts are isolated and every PR is revertable on its
own:

1. **PR1 — Config convergence** (`DATABASE_URL` / `REDIS_URL`). No nest-shared. Pure env
   refactor across server + infra + CI + platform. Foundation; verify the *current* app
   still boots and tests pass before touching modules.
2. **PR2 — `SharedDatabaseModule`** (runtime + test harness). The big one: module swap,
   serial-runner deletion, factory rewire, CI worker-DB changes. Highest effort/risk; lands
   only after PR1 is green.
3. **PR3 — `SharedRedisModule` + `SharedBullModule`**. Swap the redis module and the Bull
   root wiring; processors and Bull-Board preserved.
4. **PR4 — `TypeOrmExceptionFilter` + `SharedHealthModule` + nest-shared ESLint**. Low-risk
   cleanups; delete the custom interceptor and health module.
5. **PR5 (optional, evaluated) — `SharedQueueModule`**. Only if the `@JobProcessor` model
   is judged a net win for the existing jobs; a clean go/no-go, out of this change's
   critical path.

The deploy-side env rename (platform/k8s `values.yaml`) must land **atomically** with the
server image that reads the new vars — PR1's server change and its platform change are a
coordinated cutover (the same cross-repo discipline the observability change documents).

## D8 — Why no OpenAPI / web / mobile impact, and how it's guarded

Every change here is infrastructure: where the DB/Redis connection and test schema come
from, how exceptions map, how config is named. No controller, DTO, or response shape moves.
The **guardrail** is the existing CI "committed OpenAPI spec matches the server" check —
`openapi/openapi.json` must stay byte-identical through the whole migration. A diff there
means the change accidentally touched the API surface and must be reverted to infra-only.
The mobile app (which consumes the committed spec via Orval) therefore needs **zero**
changes.
