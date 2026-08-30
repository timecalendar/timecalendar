## Why

`server/package.json` advertises `npm run test:e2e`, but the referenced committed Jest configuration and all matching E2E specs are absent. The command therefore fails before test discovery, leaving a documented backend quality gate unusable and allowing the missing harness to persist unnoticed in CI.

## What Changes

- Restore a committed, server-owned Jest E2E configuration at the path used by `test:e2e`, with discovery isolated from the existing unit/integration Jest configuration.
- Establish one focused Nest HTTP smoke spec that executes a meaningful assertion without accepting an empty suite or depending on the mobile/Flutter system-E2E lifecycle.
- Run the exact server E2E command in the existing server CI test job so config, discovery, and the assertion remain continuously proven.
- Document the boundary between the in-process server E2E smoke gate and `ci/e2e-server.sh`, which continues to own the shared real-backend lifecycle for mobile and legacy Flutter E2E.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-test-harness`: Require a committed, non-empty Nest/Jest E2E entrypoint with independent discovery and CI enforcement.

## Impact

- Affected repository areas: `server/test/`, the existing liveness HTTP test placement, `server/package.json` path consistency, server CI wiring, and testing documentation.
- No production API behavior, OpenAPI contract, generated mobile client, dependency, database schema/migration, or shared `ci/e2e-server.sh` lifecycle change is expected.
- Sensitive surface: `.github/workflows/ci-build-deploy.yml` will receive a narrowly scoped server-test command; it requires extra review. `server/config/serviceAccountKey.json` remains untracked secret material and must not be added or modified.
- No native/store config, deployment infrastructure, or legacy Flutter code is touched.
