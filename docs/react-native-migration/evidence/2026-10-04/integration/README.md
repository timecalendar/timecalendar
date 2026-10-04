# Final migration integration checks

The candidate contains the shipping importer/native bridge, private reporting API,
generated contract, synthetic device harness and platform evidence. The reporting
receiver independently records exactly one success report from iOS SEED-B and
Android SEED-A; the separate calibration report is excluded. See the
[reporting evidence](../reporting/README.md) and [platform evidence](../README.md).

## Checks and cleanup

The affected server E2E rerun passes 32 tests across two suites in 14.158 seconds
([output](server-e2e-final.log)). The disclosure scanner and GHCR contract suites
pass 90 tests; the retention contract, workflow YAML parse and E2E shell syntax
also pass. The disclosure baseline invariant passes all 29 reproducible entries.
The configured GitHub disclosure-pattern secret is unavailable locally; derived
identity and structural detectors remain active. [Verification data](verification.json)
records the exact scope and limitations.

Existing broad results remain authoritative: one mobile and one server test failure
each reproduce in untouched baseline archives. Product code has no subsequent
changes requiring another broad run. Local reporting tests use PostgreSQL 18;
the CI PostgreSQL 14 environment remains a separate compatibility check.

After explicit coordinator clearance and the E2E rerun, the receiver, isolated
Redis and PostgreSQL processes were identified and gracefully stopped. Ports
8090, 37292 and 37291 have no remaining listeners. The PostgreSQL data directory,
synthetic fixtures, retained device source files and evidence are preserved.
Device/Metro shutdown belongs to the native and core owners.

## CI behavior and deployment boundary

The server E2E job runs the actual SQL role-grant script through `psql` and reads
the shared OpenAPI contract. Its disposable container installs `postgresql-client`
and mounts the contract read-only outside the server build context. The production
Dockerfile and published image contents are unchanged. The local suite and workflow
syntax pass; the amended container invocation itself awaits GitHub execution.

A normal main push triggers the existing server/web workflow. Server and web images
publish immutable SHA tags plus `main-<sha>` tags to GHCR. Image publication is not
gated on the disclosure or test jobs; the server test job follows image creation.
The workflow contains no production deployment or store submission step.

The repository [release runbook](../../../../server/rentree-release-runbook.md)
assigns `main-<sha>` convergence to the external preproduction image updater and
requires separate reviewed platform promotion for production. This review does
not inspect or change that external platform state, so it does not attest to a
current production rollout. Main image publication may cause the documented
automatic preproduction reconciliation.

The push also matches mobile-check and legacy Flutter workflow path filters.
Native React Native E2E is scheduled/manual, not push-triggered. No manual workflow,
production deployment, OTA publication or store operation is part of integration.

Reporting activation requires restricted runtime/support roles, the shared limiter
secret, Redis, retention workers, trusted proxy handling and the documented database,
backup and logging controls. Passing repository checks does not establish those
[production prerequisites](../../../../../server/src/modules/migration-report/README.md).

Push requires the coordinator's explicit final acceptance of the complete candidate;
publication status and the exact remote SHA are reported through the dispatch result.
