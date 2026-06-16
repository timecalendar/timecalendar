# server-shared-infrastructure Specification

## Purpose
TBD - created by archiving change migrate-server-to-nest-shared. Update Purpose after archive.
## Requirements
### Requirement: Shared library provides runtime infrastructure
The server SHALL stand up its database, Redis, and queue connection infrastructure via `@lyrolab/nest-shared` modules rather than hand-rolled equivalents, so this service shares the company's NestJS infrastructure conventions.

#### Scenario: Database module is nest-shared
- **WHEN** the application module is assembled
- **THEN** the TypeORM connection is provided by `SharedDatabaseModule.forRoot()` (configured with the server's entities and migrations), and no custom `TypeOrmModule.forRoot()` wiring remains in `common-imports.ts`

#### Scenario: Redis and Bull are nest-shared
- **WHEN** the application module is assembled
- **THEN** the Redis connection is provided by `SharedRedisModule.forRoot()` (exposing the injectable `RedisConfig`) and the BullMQ root connection by `SharedBullModule.forRoot()`, and the custom `modules/redis` service is removed

#### Scenario: Existing queue processors and admin UI are preserved
- **WHEN** the queue infrastructure is migrated to `SharedBullModule`
- **THEN** the existing `@nestjs/bullmq` job processors continue to register and run, and the Bull-Board admin UI at `/admin/queues` remains available

### Requirement: URL-style connection configuration
The server SHALL read its database and Redis connection configuration from `DATABASE_URL` and `REDIS_URL`, the env-var conventions nest-shared and the sibling services use.

#### Scenario: Database connects via DATABASE_URL
- **WHEN** the server (or the TypeORM migration CLI) starts with `DATABASE_URL` set to a Postgres connection string
- **THEN** it connects using that URL, and the legacy split variables (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_MAIN_NAME`) are no longer read anywhere in the server, infra, or CI configuration

#### Scenario: Redis connects via REDIS_URL
- **WHEN** the server starts with `REDIS_URL` set
- **THEN** both the Redis client and the Bull queue connect using that URL via `SharedRedisModule` / `SharedBullModule`

### Requirement: Exception mapping via the shared filter
The server SHALL map TypeORM `EntityNotFoundError` to an HTTP 404 using nest-shared's `TypeOrmExceptionFilter`, replacing the custom `ErrorsInterceptor`.

#### Scenario: Missing entity yields 404
- **WHEN** a request triggers a TypeORM `EntityNotFoundError`
- **THEN** the response status is 404, and the custom `modules/shared/interceptors/errors.interceptor.ts` is no longer registered or present

### Requirement: Health endpoint via the shared module
The server SHALL expose its health check through nest-shared's `SharedHealthModule`, replacing the custom health module.

#### Scenario: Health endpoint responds
- **WHEN** `/health` is requested
- **THEN** it returns the terminus-based health status from `SharedHealthModule`, and the custom `modules/health` implementation is removed

### Requirement: Repository-pattern lint rules
The server SHALL enable the `@lyrolab/nest-shared/eslint` repository-pattern rules, aligning its lint policy with the sibling services.

#### Scenario: Lint enforces the repository boundary
- **WHEN** `npm run lint` runs in `server/`
- **THEN** the nest-shared rules (`no-typeorm-in-non-repository`, `no-repository-in-controller`, `no-export-repository-in-module`) are active and the codebase passes them

### Requirement: TimeCalendar-specific bootstrap is preserved
The server SHALL keep its existing application bootstrap (helmet, compression, the custom `CustomValidationPipe` with `REWRITE_VALIDATION_OPTIONS` support, HTTP timeouts, open CORS, and Bull-Board) rather than replacing it wholesale with nest-shared's `configureApp`, adopting from nest-shared only the pieces that do not regress behavior.

#### Scenario: Custom middleware survives the migration
- **WHEN** the server boots after the migration
- **THEN** helmet, compression, the custom validation pipe semantics, the request timeouts, and the Bull-Board mount all remain in effect

### Requirement: No API surface change
The migration SHALL NOT alter the HTTP API surface; the committed OpenAPI spec is the guardrail.

#### Scenario: OpenAPI spec is unchanged
- **WHEN** the OpenAPI spec is regenerated from the migrated server
- **THEN** `openapi/openapi.json` is byte-identical to its pre-migration content, and the CI spec-drift check passes

