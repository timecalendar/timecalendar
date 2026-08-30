## 1. Restore the server Jest E2E harness

- [x] 1.1 Add `server/test/jest-e2e.json` with the server root, Node environment, `ts-jest` TypeScript transform, and discovery restricted to `test/**/*.e2e-spec.ts`; keep the existing package-level Jest object unchanged and add no `--passWithNoTests` behavior.
- [x] 1.2 Move the existing dependency-free `GET /health/live` HTTP test from `server/src/health/liveness.controller.test.ts` to `server/test/liveness.e2e-spec.ts`, preserving real Nest initialization, Supertest status/body assertions, teardown, and a source-relative import.
  - Deviation from design Decision 2: the import is `"health/liveness.controller"` (the repo's
    `baseUrl: ./src` convention), not `"../src/health/liveness.controller"`. The server ESLint
    config bans parent-relative imports (`no-restricted-imports`, pattern `../*`), and
    `npm run lint` globs `test/**/*.ts`, so the relative form is unlintable — verified by
    running it. `moduleDirectories: ["node_modules", "src"]` in the E2E config resolves it;
    discovery stays isolated (proven in 1.3). `server/tsconfig.json` now includes `test` so
    typescript-eslint's type-aware rules can parse the file; `tsconfig.build.json` still
    excludes `test`, so `nest build` emits `src` only.
- [x] 1.3 Inspect `server/package.json` and the committed file paths together to confirm `test:e2e` still resolves exactly `./test/jest-e2e.json`, ordinary `npm test` remains rooted at `src`, and the two commands cannot rediscover each other's specs.

## 2. Record the testing boundary

- [x] 2.1 Update `docs/mobile/architecture-book/testing.md` to distinguish the small in-process server Jest HTTP smoke (server CI) from the unchanged `ci/e2e-server.sh` real-backend lifecycle (mobile Maestro and legacy Flutter); record the reusable rule without adding an ADR.
- [x] 2.2 Update `docs/agent-dev-environment.md` server testing and CI sections with the restored exact E2E command, dependency-free scope, and CI enforcement so operator guidance matches the executable gate.

## 3. Add the CI regression proof

- [x] 3.1 In the existing server `test` job in `.github/workflows/ci-build-deploy.yml`, add a separately named step that runs `npm run test:e2e -- --runInBand` against the already-built image for the checked-out SHA; do not change triggers, deploy behavior, service lifecycle, or unrelated workflow commands.
- [x] 3.2 Review the sensitive workflow diff and confirm it neither reads nor commits `server/config/serviceAccountKey.json`, and that `ci/e2e-server.sh`, OpenAPI generation, mobile/Flutter E2E, deployment, and migration paths are unchanged.

## 4. Local-green verification

- [x] 4.1 Run `cd server && npm run test:e2e -- --runInBand`; confirm Jest resolves the committed config, reports one discovered/passing suite with at least one assertion, and does not print a missing-config or no-tests result.
- [ ] 4.2 Run the ordinary server checks with the documented local Postgres/Redis prerequisites: `cd server && npm run build`, `npm run lint`, and `npm test -- --runInBand`; confirm the existing unit/integration discovery and worker database harness remain green.
- [x] 4.3 Run `openspec validate repair-server-e2e-jest-gate` and inspect `git diff --check`; confirm no TODO/debug artifact, generated-client/OpenAPI drift, secret, migration, native/store config, legacy Flutter, deployment, or unrelated change is present.

## 5. CI proof on the pushed head

- [ ] 5.1 After pushing the implementation, confirm the `CI build & deploy` server test job invokes the separately named E2E step on the exact PR head and that the step is green; if it fails, retain the assertion and repair configuration/discovery rather than weakening the gate.
