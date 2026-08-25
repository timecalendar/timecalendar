## 1. Prove the migration and conservative first wave

- [ ] 1.1 Change only the frozen backfill in
  `server/src/migrations/1787641039755-AddCalendarSyncPlannedAt.ts` from
  `lastUpdatedAt + 30 minutes` to `lastUpdatedAt + 60 minutes`, and update its comment to
  explain the one-time conservative rollout floor. Keep the default, index, and destructive
  `down` shape unchanged; flag this sensitive migration edit for mandatory human review.
- [ ] 1.2 Add a PostgreSQL-backed migration integration test using the existing isolated
  server test database: start from representative fresh/old, active/inactive, generic/Lyon
  rows without `syncPlannedAt`; run the real migration `up`; assert non-null values, the
  one-hour floor, index existence, and due selection; run `down`; assert only the derived
  column/index disappear and base rows remain; restore the worker schema in `finally`.
- [ ] 1.3 Run the real `up → down → up` procedure on a representative non-production
  PostgreSQL data set and record aggregate row count, `pg_total_relation_size`, wall-clock
  runtime, sampled `pg_stat_activity`/`pg_locks`, blocked-session count, and WAL delta in
  the release evidence. Stop on any lock/runtime gate breach; never include row values or
  source URLs.

## 2. Make the per-calendar interval an atomic claim

- [ ] 2.1 Add a `CalendarRepository` compare-and-set method that advances
  `syncPlannedAt` for one calendar only when its stored plan is due at the claim time. Use
  one database statement and return whether the claim succeeded; cover due, future,
  missing, and two-concurrent-claim cases with repository tests.
- [ ] 2.2 Update `CalendarSyncService.sync` so an existing calendar resolves its strategy
  interval and wins the persisted claim before any upstream fetch. A lost claim returns
  last-known state without fetching; creation still fetches immediately; success may move
  the plan later but no failure path moves it earlier.
- [ ] 2.3 Extend focused sync tests for a generic 30-minute plan, Lyon 1 60-minute plan,
  failed fetch, failure after upstream I/O, concurrent user/background calls, and a BullMQ
  retry. Assert at the fetcher boundary that Lyon performs at most one upstream request in
  the hour and that a retry does not bypass the claim.
- [ ] 2.4 Update the existing background-sync and sync-policy tests/spec assumptions that
  currently describe selection alone as the throttle; preserve job dedup, last-good
  content, user-triggered synchronous response, and retry observability.

## 3. Check in immutable-image provenance and migration operations

- [ ] 3.1 Create `docs/server/rentree-release-runbook.md` with copy/paste commands to
  re-resolve remote `main`, validate a full 40-character SHA, select the successful
  `ci-build-deploy.yml` run for that SHA, inspect separate server/web `main-<sha>` manifest
  digests, and record sanitized timestamps/statuses. Name TimeCalendar CI/GHCR, the
  platform image updater, Argo CD, and the release operator as distinct owners.
- [ ] 3.2 Add preproduction verification commands for platform desired tags, Argo CD
  revision/health, Kubernetes pod image specs and `imageID` digests, health, and the
  TypeORM migration row. Require both server and web to match one candidate before soak;
  include the known triage baseline only as historical evidence, never as the future
  target.
- [ ] 3.3 Document the representative `up/down/up` procedure and exact read-only lock,
  activity, size, index, timing, and WAL queries. State the budgets and a no-go result
  format; ensure shell tracing, credentials, full env output, calendar URLs/tokens, and raw
  rows are prohibited.

## 4. Quantify initial and steady-state fan-out

- [ ] 4.1 Add statement-time-limited, read-only SQL to the runbook for total and 14-day
  active calendars and five-minute due buckets after the proposed one-hour migration
  floor. Group only by reviewed school/provider buckets, include `custom`/`unknown`, and
  emit no raw URL, token, resource id, or event data.
- [ ] 4.2 Add commands/queries that capture ready server replicas, each pod's actual
  `SYNC_QUEUE_CONCURRENCY`, BullMQ waiting/active/delayed/failed counts, oldest waiting age,
  completed job rate, p95 job duration, outgoing calendar HTTP attempt rate/latency/error
  ratio, and attempts per job. Read retry/timeout constants from the resolved candidate
  SHA so the worksheet cannot silently use stale values.
- [ ] 4.3 Add a worksheet that calculates nominal concurrency, jobs-per-five-minute
  capacity, initial drain time, steady-state arrival rate, observed and worst-case retry
  amplification, and ADE requests per minute. Define numeric or baseline-relative headroom,
  queue-growth, event-loop, memory/restart, and upstream request/error go/no-go gates.
- [ ] 4.4 Record a sanitized production-safe baseline using the committed aggregate
  queries and current observability limitations. Mark any unavailable signal as unknown
  and therefore no-go rather than substituting the known-broken aggregate
  `calendar_sync_total`.

## 5. Define soak, observation, abort, and rollback

- [ ] 5.1 Add the ordered preproduction soak: candidate convergence, migration evidence,
  old-image-on-retained-schema compatibility check, synthetic/representative sync proof,
  initial five-minute windows, first full Lyon hour, and longer steady-state window. Each
  phase names its evidence and abort criteria.
- [ ] 5.2 Add the production go/no-go checklist and observation windows without changing
  any production tag. Include exact health, restart, event-loop/memory, queue depth/age,
  job throughput, ADE attempt/error, migration-lock, and duplicate-Lyon-claim checks.
- [ ] 5.3 Document normal emergency rollback as restoring the previously recorded
  immutable server/web image tags while retaining `syncPlannedAt`. Put destructive
  migration `down` in a separate section requiring the old image to serve, writers to be
  quiesced, a named backup/restore point, and explicit human authorization.
- [ ] 5.4 Add
  `docs/react-native-migration/inbox/2026-08-25-rentree-release-promotion.md`, tagged
  `(HUMAN: preprod/prod access and production tag approval)`, with the candidate SHA/digest
  evidence template, soak checklist, reviewed platform-PR handoff, and explicit statement
  that this change does not flip production.

## 6. Architecture and contract documentation

- [ ] 6.1 Evaluate the Architecture Book against the implemented change. Because this is
  a server release/scheduling invariant with no mobile contract change, record the
  Architecture Book update as N/A in the PR unless implementation changes a reusable
  mobile rule; if it does, stop and add the required ADR before editing
  `docs/mobile/architecture-book/`.
- [ ] 6.2 Update the existing server calendar sync specs/tests and link the release runbook
  from the relevant production-health investigation. Do not add implementation chronology
  to the mobile Architecture Book.
- [ ] 6.3 Verify `openapi/openapi.json` and `mobile/src/api/generated/` remain unchanged.
  Any generated contract drift is a defect and must be resolved rather than accepted.

## 7. Local-green and CI proof

- [ ] 7.1 Run the focused migration, calendar repository, calendar sync service/all, fan-out,
  sync-job, and fetch-strategy Jest suites. Record exact commands, passing counts, and the
  committed CI proofs for the real migration round trip plus Lyon first-wave/concurrency/
  retry behavior.
- [ ] 7.2 Run `cd server && npx tsc --noEmit` and `cd server && npm run lint`; inspect and
  commit only formatter/lint changes within this issue's server/docs/OpenSpec scope.
- [ ] 7.3 Run `cd server && npm run generate:openapi`, then verify both
  `openapi/openapi.json` and `mobile/src/api/generated/` have no diff. Run
  `openspec validate prove-rentree-rollout-safety`.
- [ ] 7.4 Inspect the final diff and history for secrets, certificates, customer data, raw
  URLs/tokens, and scope expansion. Confirm `.github/workflows/`, `terraform/`, `k8s/`,
  `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, `server/config/serviceAccountKey.json`,
  `ci/certificates/`, and legacy `app/` are untouched; call out the intentional migration
  edit and mandatory human-review gate in the PR and handoff.
