## Context

The server has two different test concerns. Its package-level Jest configuration owns the database-aware unit/integration suite under `server/src`, including shared setup that provisions worker-isolated Postgres databases. Separately, `server/package.json` exposes `test:e2e` with `--config ./test/jest-e2e.json`, but neither that committed config nor a matching `server/test/` suite exists.

There is already a focused HTTP assertion for `GET /health/live` under `server/src/health/liveness.controller.test.ts`. It compiles the real controller in a minimal Nest testing module, initializes an HTTP application, and uses Supertest to verify the route. The test intentionally avoids `AppModule` and every external dependency because the liveness contract itself is dependency-free. That existing proof has the right behavior for a small Nest E2E smoke but currently runs as part of ordinary unit discovery.

The repository also has two broader proofs that must remain distinct: `ci/test-server-runtime.sh` boots the built image and checks its runtime lifecycle, while `ci/e2e-server.sh` owns the real Postgres/Redis/Nest lifecycle used by mobile Maestro and legacy Flutter E2E. This change restores the missing Jest entrypoint without absorbing or duplicating either lifecycle.

## Goals / Non-Goals

**Goals:**

- Make `cd server && npm run test:e2e -- --runInBand` resolve committed configuration, discover a non-empty suite, and execute a real HTTP assertion.
- Keep unit/integration Jest discovery, transforms, database setup, and parallel execution intact.
- Make CI fail if the E2E config, discovery pattern, or smoke assertion regresses.
- Keep the server Jest E2E smoke and shared system-E2E lifecycle responsibilities explicit in current documentation.

**Non-Goals:**

- Expand backend endpoint coverage or change production API behavior.
- Boot the complete runtime `AppModule` inside Jest; built-image boot is already covered by server runtime and OpenAPI-generation CI paths.
- Change `ci/e2e-server.sh`, mobile/Flutter flows, OpenAPI artifacts, migrations, dependencies, or production configuration.
- Make an empty suite pass through `--passWithNoTests` or another escape hatch.

## Decisions

## Decision 1 — Give the E2E suite its own committed discovery root

Add `server/test/jest-e2e.json` with `rootDir` set to the server root, a match restricted to `test/**/*.e2e-spec.ts`, Node as the test environment, and `ts-jest` transformation for TypeScript. Keep the existing Jest object in `server/package.json` unchanged so `npm test` continues to discover only `server/src/**/*.(spec|test).ts` and retain its database setup.

The E2E config will not import `src/setup-tests.ts` or its database global hooks. Every future E2E spec must opt into the dependencies it actually proves rather than silently inheriting the unit/integration worker-database lifecycle.

Alternative: point `test:e2e` at the package-level Jest configuration. Rejected because that would erase the distinction between the commands, rediscover ordinary tests, and leave the advertised E2E suite without its own contract.

Alternative: add `--passWithNoTests`. Rejected because it would turn the broken gate into an empty green command rather than restore test coverage.

## Decision 2 — Move the existing liveness HTTP proof into the E2E namespace

Move the dependency-free liveness HTTP test to `server/test/liveness.e2e-spec.ts`, preserving its real Nest testing module, HTTP application initialization, Supertest request, status assertion, stable response-body assertion, and teardown. Use an explicit source-relative import so the smoke test does not need the unit suite's `moduleDirectories` convention.

This is a meaningful minimal proof: it verifies that Jest loads TypeScript, discovers an E2E-named spec, Nest registers the production liveness controller as an HTTP route, and the route fulfills its stable wire contract. Reclassifying rather than copying prevents duplicate coverage in both commands.

Alternative: boot `AppModule` in this Jest smoke. Rejected because it introduces Firebase key, Postgres, Redis, and queue-worker concerns into a gate whose regression is config/discovery; full application construction is already exercised by built-image runtime and OpenAPI-generation CI. It would also undermine the liveness test's deliberate proof that the route itself has no dependency.

Alternative: invent a test-only controller or assertion. Rejected because that would prove Jest plumbing without exercising production server behavior.

## Decision 3 — Add the exact E2E command to the existing server CI job

After the existing server Jest run, execute `npm run test:e2e -- --runInBand` against the already-built server image in `.github/workflows/ci-build-deploy.yml`. Keep it as a separately named step so a missing config, zero discovered tests, or assertion failure is visible as the server E2E gate.

The `--runInBand` form intentionally matches the reported developer command and is proportionate for the one-spec smoke. No `ci/e2e-server.sh` orchestration is added because the selected test has no external dependency.

Alternative: rely on local verification only. Rejected because the missing committed config already survived without a standing regression check.

## Decision 4 — Document the two E2E layers without a new ADR

Update `docs/mobile/architecture-book/testing.md` and `docs/agent-dev-environment.md` to state that server Jest E2E is a small in-process HTTP smoke enforced in server CI, while `ci/e2e-server.sh` remains the shared real-backend lifecycle for device E2E. This is a clarification of existing ownership, not a costly-to-reverse architecture choice, so no ADR is warranted.

## Risks / Trade-offs

- **[The single smoke is mistaken for broad endpoint coverage]** → Name and document it as a minimum harness/regression proof; broader endpoint coverage remains future scoped work.
- **[Unit coverage silently changes when the test moves]** → Keep the package Jest configuration byte-for-byte intact and verify both `npm test` and `npm run test:e2e -- --runInBand` independently.
- **[CI workflow edit affects a sensitive surface]** → Limit the diff to one named command step in the existing server test job and call it out in the PR body and handoff.
- **[A credential is accidentally pulled into the smoke]** → Keep the spec on the dependency-free controller module; never add or stage `server/config/serviceAccountKey.json`.
- **[The E2E config drifts from the script path]** → Commit the config at exactly `server/test/jest-e2e.json` and prove the package script itself, rather than invoking Jest with an alternate ad hoc path.

## Migration Plan

Land the config, moved smoke spec, CI step, and documentation together. No runtime or data migration is required. Rollback is a single repository revert; it restores the prior broken command but does not affect production behavior or stored data.

## Open Questions

None. The existing dependency-free liveness proof and current CI topology provide a bounded implementation path.
