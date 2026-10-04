# Private migration reporting evidence — 2026-10-04

Scope: server ingestion, durable storage, access controls, retention, OpenAPI and the
generated React Native report client. This evidence uses synthetic reports and an
isolated local PostgreSQL/Redis instance. No production endpoint, database, store,
or release was changed.

## Contract

The authoritative validator is
[`migration-report.schema.ts`](../../../../../server/src/modules/migration-report/migration-report.schema.ts).
The generated contract is [`openapi.json`](../../../../../openapi/openapi.json);
the mobile client is `migrationReportControllerAccept` in
`mobile/src/api/generated/migration-reports/migration-reports.ts`.

`POST /v1/migration-reports` has no mobile-user authentication because the application
has no user session, as explicitly specified by the normative technical specification
section 12. Its strict 16 KiB allowlist accepts version 1, terminal outcome/reason,
version/platform/timing metadata, five fixed datasets of bounded counts, closed
stage/error counts, and at most 100 UUID calendar IDs. Unknown fields at every level
are rejected. Clients cap telemetry fields independently of importer state and omit
non-UUID calendar IDs with `calendarIdsTruncated=true`.

Valid new and replay submissions return exactly `200 {"accepted":true}`. The first
payload is immutable; concurrent retries produce one report. Receipt metadata is
server-maintained, including a bounded delivery count. Rate limits are 60/IP/minute
and 10/report/hour, shared through Redis. Redis/storage failures return generic 503;
429 carries `Retry-After`. Malformed, private or oversized bodies are rejected without
reflecting submitted values.

## Observable verification

The E2E suite executes the real migration, real Nest HTTP middleware/default-parser
ordering, PostgreSQL persistence and concurrent writes, Redis rate limits, the
operational role-grant script, and actual limited-role permission denials. It proves:

- Each terminal outcome round-trips with server receipt metadata.
- First and replay races produce one immutable row; a new app instance sees the same row.
- Tokens, user text, hidden state, preference values, raw files, fingerprints, device
  names, Firebase identifiers and their hashes are not accepted as report fields.
- Nested/unknown fields and duplicate-invalid submissions do not reach storage or logs.
- Malformed JSON, fixed-length/chunked oversized bodies and unsupported content types
  fail through generic responses before Nest can reflect parser content.
- Per-IP and per-report quotas return bounded retry times and preserve the first report.
- Ingestion roles cannot read tables or call the support-read function; support roles
  can read only through the audited function and cannot ingest/prune reports.
- Retention deletes payloads after 180 days; an expired report ID cannot recreate a row.
- The migration reverses and recreates the schema, and OpenAPI matches the validator.
- A fresh process with real HTTP/Redis/PostgreSQL instrumentation records a positive
  liveness trace and zero private markers/calendar IDs in collected traces or logs.

## Check results

[`verification.json`](verification.json) records the final outcomes. Server build,
full TypeScript ESLint, Orval generation, and byte-for-byte OpenAPI regeneration
pass. The strict report validator passes 50 tests; the complete E2E command passes
32 tests across two suites. The rehearsal transport/readback harness passes twelve
Node tests, with receiver smoke requests returning 200 twice and one durable row.

All 115 server source suites were exercised across two batches and a targeted
rerun. The final result is 114 passing suites and one unchanged notification-outbox
suite failure: “does nothing when no logs are newer than the cursor” expects zero
insertions and receives one. The same failure reproduces in an untouched server
archive at `39f37b22f408f1e93fb6baece4248bda542c3823` with its original configuration,
shared unchanged dependency versions, and a separate local database; the other nine
tests pass ([baseline output](server-baseline-notification.log)). Database microsecond timestamps versus JavaScript
millisecond cursor conversion is a suspected cause, not a confirmed diagnosis.
Export-guide controller tests pass on the final rerun after failing during the
memory-heavy initial run.

The initial single-process run was interrupted after 81 completed suites because
its memory reached about 3.5 GB and garbage collection made progress increasingly
slow. The remaining 34 suites all pass with one worker and a 512 MB idle memory
limit. The raw outputs are [initial run](server-tests.log),
[remaining suites](server-tests-remainder.log), [final targeted rerun](server-targeted-rerun.log),
and [E2E run](server-e2e-tests.log). The final source command used
`--maxWorkers=1 --workerIdleMemoryLimit=512MB --runTestsByPath`; E2E used
`npm run test:e2e -- --runInBand`.

The [rehearsal evidence](qa-transport/README.md) separates synthetic Node/receiver
proof from actual native device execution owned by the platform worker.

## Runtime and deployment boundary

Validation uses Node 24.13.0, native PostgreSQL 18.1, and local Redis on loopback ports
37291/37292. The repository specifies PostgreSQL 14 in Docker; Colima failed to boot,
so PostgreSQL 14 itself is not covered by this local run. The SQL uses PostgreSQL 14
features, but compatibility still requires the target-environment check.

The private schema has no PUBLIC grants. Runtime and release/support roles require
separate ownership and the executable grant script. Tests exercise those grants with
real non-owner roles. The application must not use the migration owner in production;
owner/superuser and inherited-role bypasses remain administrative responsibilities.
The transactional read audit covers committed function reads; privileged or rolled-back
reads require operational database auditing.

Row payloads and read audits have a configurable 1–180 day retention, enforced by an
hourly job with bounded batches. Report-ID-only receipts persist indefinitely to prevent
late replay resurrection; they retain no outcomes, timestamps, calendar IDs, or other
report metadata. Receipt growth and deletion backlog require monitoring.

Production activation requires the migration, restricted role grants, a shared
`MIGRATION_REPORT_RATE_LIMIT_SECRET` of at least 32 characters, Redis, active retention
workers, trusted proxy handling, encrypted backups, and disabled payload/parameter
capture. These production controls were not deployed or inspected. The executable
provisioning command and full checklist are in
[`server reporting README`](../../../../../server/src/modules/migration-report/README.md).

Generated Dart and web Axios clients are outside this migration's consuming path;
the committed React Native client and shared OpenAPI are the delivery contract.
