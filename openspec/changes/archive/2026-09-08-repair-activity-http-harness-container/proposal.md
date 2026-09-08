## Why

The candidate-bound Activity capacity review cannot complete because the full-scale HTTP harness gives class-validator the Nest application proxy instead of a module context. The first validated route request therefore terminates the process, so the harness cannot produce trustworthy route-level evidence for the candidate under review.

## What Changes

- Bring the minimum candidate-bound Activity HTTP harness onto the current branch, including its package command and focused operator guidance.
- Configure the harness with its selected root module context, matching the module-container semantics already used by production and server tests.
- Add PostgreSQL-backed regression coverage that boots through `createActivityCapacityHttpApp`, sends a validated request through the real calendar-log route, and proves the harness returns aggregate-only candidate-bound results.
- Preserve the existing full-scale samples, warm-ups, cohort/page measurements, local-target refusal, shared-query ownership, and output-redaction guarantees.
- Require the repaired full-scale command to complete against isolated synthetic PostgreSQL before the repair is considered implemented.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-capacity-gate`: Extend the existing capacity gate with a candidate-bound real-route harness whose production-equivalent validation container, regression proof, local-only target policy, and aggregate-only output are mandatory.

## Impact

- Affected code is limited to `server/src/scripts/activity-capacity/`, the matching `server/package.json` script, and the harness README needed to make the independently merged command coherent.
- The production Activity route, DTOs, thresholds, query contract, and runtime bootstrap remain unchanged. No new dependency or architecture rule is introduced.
- `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, `.github/workflows/`, native/store configuration, deployment infrastructure, and legacy Flutter remain unchanged and must be checked for drift.
- The harness uses isolated synthetic PostgreSQL only. Production/live data and credential/config content are outside scope, and emitted evidence remains limited to aggregate measurements, cohort keys, thresholds, and the full candidate SHA.
- The failed evidence from the prior candidate is not reusable; the release-readiness owner must freeze a new candidate and rerun head-bound evidence after this repair lands.
