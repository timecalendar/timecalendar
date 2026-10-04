# Private migration reporting

`POST /v1/migration-reports` accepts schema version 1 through a write-only public
ingestion boundary. There is no mobile user session or embedded shared API token.
The normative data-migration specification section 12 supersedes T02's older
"authenticated" wording. Report IDs are random UUIDv4 values, not device identities.

`migration-report.schema.ts` is the validation and OpenAPI source. Every object is
strict. The HTTP parser accepts at most 16 KiB of uncompressed JSON, returns generic
errors without input details, and runs before Nest's default parser. Unknown fields,
invalid stage/code pairs, repeated diagnostics or calendar IDs, and out-of-range
values are rejected. UUID calendar IDs are the only source identifiers permitted;
mobile omits any other calendar ID and marks `calendarIdsTruncated`. Report bounds
never constrain import behavior. Counts, attempts, and duration are capped in the
outbox projection; timestamps can span longer than the capped duration.

All valid submissions return `200 {"accepted":true}`, including duplicates. The
first payload is immutable. Atomic PostgreSQL receipt insertion resolves concurrent
first arrivals; retained rows record first/last receipt time and a delivery count
capped at one million. There is no public read, update, or delete endpoint. Generic
400/413/415 responses indicate permanent input errors, 429 carries `Retry-After`,
and 503 signals retryable infrastructure failure.

Redis enforces 60 requests/IP/minute before parsing and 10 requests/report/hour
after validation, across processes sharing a secret. Keys contain an HMAC of the
IP or report ID with a 60-second or 3600-second TTL. IPs and report IDs are not
persisted in Redis in clear text. Redis failure fails closed. Proxy trust follows
the existing application configuration; the edge must replace forwarded headers
and keep private/loopback ingress inaccessible to untrusted clients.

The `migration_reporting` schema grants nothing to `PUBLIC`. Runtime access is
through security-definer ingestion and bounded retention functions; support reads
use an audited function. Direct table access belongs only to the migration owner.
The read audit records role, report ID, and time, with no payload. Database owners
and superusers remain privileged; an owner-backed application connection is not a
least-privilege deployment. Transactional audit rows cannot attest to rolled-back
or privileged direct reads; operational database audit logging is required for that.

The hourly retention job deletes report payloads and read audit rows older than
180 days, in at most twenty batches of 1000 per run. `MIGRATION_REPORT_RETENTION_DAYS`
may shorten retention to 1–180 days. Monitor the queue and oldest retained row:
worker downtime or a backlog delays physical deletion. The receipt table retains
only random report IDs indefinitely so a delayed retry cannot recreate an expired
report or inflate the denominator. It retains no times, outcome, versions, platform,
counts, or calendar IDs. Include its growth in storage planning.

Ingestion does not emit request logs or metrics containing report contents.
Incoming report HTTP spans are excluded, including query strings and headers.
The repository uses the existing PostgreSQL pool directly inside a suppressed
OpenTelemetry context: TypeORM SQL logging never receives private parameters, and
driver tracing cannot record them. Database exceptions become generic HTTP errors.

## Deployment prerequisites

Repository validation does not deploy this endpoint. Before production activation:

1. Apply `1791129600000-CreateMigrationReporting` with a migration-only owner, on
   the existing production database. The application role must not own or inherit
   ownership of the private schema or its objects. Do not run this migration as
   the runtime role; an existing owner-backed setup requires role separation first.
2. Provision distinct runtime and approved release/support roles, then run the
   checked-in grant script as the migration owner. Replace role names with the
   actual provisioned roles; the script rejects owner or superuser membership:

   ```sh
   psql "$DATABASE_MIGRATION_URL" \
     --set runtime_role=timecalendar_app \
     --set support_role=timecalendar_release_support \
     --file bin/provision-migration-report-access.sql
   ```

3. Supply a secret of at least 32 characters in `MIGRATION_REPORT_RATE_LIMIT_SECRET`
   from the deployment secret manager, identical across all API replicas. Production
   ingestion returns 503 without it. A development/test process generates an
   ephemeral secret unless explicitly configured; that default is not a fleet quota.
4. Ensure Redis availability, TLS at ingress, trusted proxy header replacement,
   and active shared-queue workers for `prune_migration_reports`. Set database
   statement/lock timeouts appropriate for ingestion; the client query deadline
   is five seconds, and an ambiguous timeout is safe to retry by report ID.
5. Require encrypted database volumes/backups and retention-expiry handling in
   backup policy. Disable HTTP body/header/query capture for this path at the
   reverse proxy, APM, and error collectors. Configure PostgreSQL
   `log_parameter_max_length=0` and `log_parameter_max_length_on_error=0`; audit
   report reads without logging bound report payloads or results. Restrict operator
   roles, and audit privileged reads separately from the transactional read ledger.
6. Verify real runtime/support role denials, reporting smoke requests using synthetic
   data, 429/503 behavior, queue retention, and backup/privacy settings in the target
   environment before relying on reports for rollout decisions.

## Local verification

With isolated PostgreSQL and Redis on the repository test ports:

```sh
npm run build
NODE_ENV=test node dist/generate-openapi.js
npm test -- --maxWorkers=1 --workerIdleMemoryLimit=512MB
npm run test:e2e -- --runInBand
cd ../mobile
npm run generate
```

The E2E suite applies and reverses the actual migration in the disposable Jest
database. It exercises real HTTP middleware, real Redis limits, real PostgreSQL
concurrency and limited-role denials, retention and receipt tombstones, and compares
the committed OpenAPI schema to the validator-generated schema. Fixtures are synthetic.
