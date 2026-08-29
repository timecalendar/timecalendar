## 1. Add dependency-free liveness

- [ ] 1.1 Add a local Nest controller under `server/src` for unauthenticated `GET /health/live`; return a constant `{ status: "ok" }`, inject no providers, perform no asynchronous/external work, and apply `@ApiExcludeEndpoint()` at the handler.
- [ ] 1.2 Register the controller directly in `server/src/app.module.ts` while leaving `SharedHealthModule` and its database-backed `GET /health` behavior unchanged; verify both routes are present in the assembled application.
- [ ] 1.3 Add a focused HTTP controller test using a minimal Nest testing module that imports no application, TypeORM, Redis, Firebase, queue, or repository providers; assert `GET /health/live` returns 200 with the stable body and that the controller has no injected dependencies.

## 2. Make the container signal-safe

- [ ] 2.1 Replace the shell-form command in `server/Dockerfile` with direct exec form `CMD ["node", "dist/main"]`; do not use an npm or shell wrapper, and verify `docker image inspect` reports that exact command array.

## 3. Add built-image CI proof

- [ ] 3.1 Add a focused, trap-cleaned script under `ci/` that accepts the already-built server image, asserts its exec-form command, starts it with the existing test environment and dummy Firebase key, waits for `GET /health/live` to return 200, asserts the container's PID 1 command is `node`, sends Docker's normal `SIGTERM`, and fails if shutdown reaches forced-kill exit 137 or exceeds 30 seconds.
- [ ] 3.2 Invoke the focused runtime script from the `test` job in `.github/workflows/ci-build-deploy.yml` after its Postgres/Redis and dummy-key setup, reusing `ghcr.io/timecalendar/timecalendar:${{ github.sha }}`; do not alter workflow triggers, image publication, deployment conditions, or unrelated jobs. Treat this workflow edit as a sensitive-surface change in the PR body and handoff.

## 4. Preserve the public contract and documentation boundaries

- [ ] 4.1 Run the built-image OpenAPI generation path and confirm `openapi/openapi.json` is byte-identical and contains neither `/health` nor `/health/live`; do not modify the committed contract or `mobile/src/api/generated/`.
- [ ] 4.2 Update `docs/agent-dev-environment.md` with the distinct `/health` readiness/dependency role, `/health/live` liveness role, direct-Node PID 1 contract, and the focused CI proof command so operator-facing current-state guidance matches the implementation.
- [ ] 4.3 Evaluate the mobile Architecture Book, its changelog, and decision log against the final implementation; record the Architecture Book update as N/A in the PR/handoff because this server-runtime leaf fix changes no reusable mobile rule or costly-to-reverse mobile decision, and do not add unrelated mobile documentation.

## 5. Local green and scope audit

- [ ] 5.1 Run the focused liveness controller test, `npm run build`, formatting check, and server lint; record the exact commands and results in the PR and handoff.
- [ ] 5.2 Build the server image locally and run the committed container-runtime proof against it, confirming the endpoint serves, image `Cmd` is exec form, PID 1 is Node, and `SIGTERM` does not become exit 137.
- [ ] 5.3 Run `openspec validate fix-server-liveness-and-sigterm` and inspect the final diff; confirm there are no changes under `k8s/`, `terraform/`, `server/src/migrations/`, `mobile/`, or `app/`, and explicitly flag `server/Dockerfile`, `.github/workflows/ci-build-deploy.yml`, and the unchanged OpenAPI/generated-client surfaces in every downstream handoff. Human/device QA is N/A.
