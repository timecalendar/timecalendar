## Context

`AppModule` currently imports `SharedHealthModule` from `@lyrolab/nest-shared`. Its `/health` handler has a single `TypeOrmHealthIndicator.pingCheck("database")` with a one-second timeout, and the package exposes no dependency-free liveness variant. That route is useful for readiness and dependency diagnosis, but using it as liveness makes a slow or unavailable Postgres instance trigger restarts of otherwise responsive server processes.

The production image currently ends with shell-form `CMD npm run start:prod`. Docker therefore launches `/bin/sh` as PID 1, with `npm` and `node` below it. Kubelet sends `SIGTERM` to the shell; the shell does not forward it, so the already-enabled Nest shutdown hooks never run and termination reaches `SIGKILL` after the grace period.

The server's Swagger generator explicitly removes the shared `/health` path from `openapi/openapi.json`, and CI regenerates that document from the built image to reject contract drift. The new route is operational rather than public API. `k8s/` is an especially sensitive, explicitly excluded surface: ArgoCD applies chart changes to production independently of image promotion, so repointing the probe before the new image is deployed would put all production replicas into a 404 restart loop.

## Goals / Non-Goals

**Goals:**

- Serve a stable HTTP 200 liveness response from process-local code with no external-service injection or calls.
- Preserve `/health` and its database check unchanged.
- Keep the operational route out of the public OpenAPI contract.
- Make `node dist/main` PID 1 so `SIGTERM` reaches Node and the existing shutdown hooks.
- Prove the controller in isolation and prove the built image's command, PID 1, startup, and serving behavior in CI.

**Non-Goals:**

- Repointing any Kubernetes liveness or readiness probe, or changing any file under `k8s/`.
- Making initial application bootstrap independent of Postgres, Redis, Firebase, queues, or other runtime configuration.
- Changing the semantics or response of `/health`.
- Diagnosing slow database pings, changing pod resource sizing, or changing termination grace periods.
- Changing `openapi/openapi.json`, generated clients, database schema, or public application behavior.

## Decisions

## Decision 1 — A zero-dependency local controller owns `GET /health/live`

Add a small controller under `server/src` and register it directly in `AppModule`. Its GET handler returns a constant process-local body such as `{ status: "ok" }`; it has no constructor parameters, injected providers, asynchronous work, or calls into Postgres, Redis, Firestore, S3, queues, or other modules.

The focused test will compile only this controller in a minimal Nest testing module, initialize an HTTP application without the repository's database-aware test harness, call `/health/live`, and assert HTTP 200 and the constant response. Because the isolated module contains no database module or providers, this is a deterministic proof of the route's dependency-free boundary without provisioning or mocking Postgres.

Alternative: add a second indicator to `SharedHealthModule`. Rejected because the package exports no liveness variant, changing a shared external package expands the scope, and the desired behavior is intentionally service-local and tiny.

Alternative: return liveness from Express middleware in `main.ts`. Rejected because a Nest controller is discoverable, testable through the normal routing layer, and keeps bootstrap orchestration out of route implementation.

## Decision 2 — Exclude the liveness route at its declaration

Annotate the new handler with `@ApiExcludeEndpoint()`. Keep the existing explicit deletion of `/health` in `config/swagger.ts` for the shared controller, which cannot be annotated locally. Regenerating the OpenAPI document must produce no diff.

Alternative: delete `/health/live` from the generated document beside `/health`. Rejected because the local controller can express its operational-only contract at the source, while path deletion remains necessary only for the external shared controller. A generation/no-diff check still guards the result.

## Decision 3 — Invoke Node directly in exec form

Set the image command to `CMD ["node", "dist/main"]`. This is behaviorally equivalent to the existing `start:prod` script but avoids both the shell and `npm`, so Node is PID 1 and receives Docker/Kubernetes signals directly. The existing `app.enableShutdownHooks()` wiring remains unchanged.

Alternative: `CMD ["npm", "run", "start:prod"]`. Rejected because it makes `npm`, not Node, PID 1 and therefore does not satisfy the signal-delivery contract.

Alternative: add an init wrapper such as `tini`. Rejected because direct exec already meets the single-process image's needs and a new runtime dependency is unnecessary.

## Decision 4 — CI validates the built artifact, not only Dockerfile text

Add a focused reusable container-runtime proof under `ci/` and invoke it in `ci-build-deploy.yml` against the image artifact already built by the workflow. The proof must:

- assert `docker image inspect` reports exactly the exec-form command `node dist/main`;
- start the image with the existing test environment and generated dummy Firebase key;
- wait for and request `/health/live`, asserting HTTP 200;
- inspect the running container's host PID and assert PID 1's command is `node`; and
- stop the container with `SIGTERM` within the production grace window and reject a forced-kill (`137`) result.

The controller-isolation test owns the no-database-work proof; the container proof owns packaging, process topology, signal delivery, and startup/serving. Reusing the already-built image avoids a second Docker build and makes the test exercise the exact artifact later pushed from `main`.

Alternative: grep the Dockerfile. Rejected because source text does not prove the final image configuration or the running PID tree.

## Decision 5 — Server capability lands before the chart change

This change must not touch `k8s/`. Merging server code builds a new image and automatically soaks it in preproduction, while production remains pinned. Only after the image is available in production may the separate chart ticket repoint liveness to `/health/live`.

Alternative: ship the endpoint and chart change together. Rejected because ArgoCD would apply the chart to production within minutes while the production image remains pinned to a version without the route, causing repeated 404 liveness failures across all replicas.

## Risks / Trade-offs

- **[A future dependency is accidentally added to liveness]** → Keep the controller constructor empty and preserve the minimal-module HTTP test; review the controller as a process-local boundary.
- **[The operational route enters the public API contract]** → Use `@ApiExcludeEndpoint()` and require the existing CI OpenAPI regeneration to leave `openapi/openapi.json` byte-identical.
- **[Exec form still leaves a wrapper at PID 1]** → Invoke `node dist/main` directly and assert both image metadata and the live process command in CI.
- **[The container starts but cannot serve in the packaged environment]** → Start the already-built image with the workflow's test dependencies and request the liveness endpoint before checking termination.
- **[Shutdown takes longer than expected]** → Exercise Docker stop with the same 30-second window used by Kubernetes and fail on exit 137; detailed shutdown-work optimization remains separate if this proof exposes a real delay.
- **[The route is mistaken for readiness]** → Preserve `/health` unchanged and document `/health/live` as liveness only. Initial bootstrap may still require configured dependencies; the new contract is that a running Nest process can report its own liveness independently.

## Migration Plan

1. Add and isolate-test the local liveness controller, then register it alongside the existing shared health module.
2. Exclude the endpoint from Swagger and regenerate the contract to prove no committed OpenAPI drift.
3. Change the Docker command to direct exec-form Node invocation.
4. Add and run the focused built-image CI proof, server lint/tests, and OpenSpec validation.
5. Merge and allow the normal preproduction image rollout/soak. This merge changes no production probe configuration.
6. The separate Kubernetes ticket may repoint liveness only after the new image is confirmed available in production.

Rollback is a revert of this server change. If the later chart change has already repointed the production probe, roll back that chart change before or together with reverting the route; otherwise the old image would receive `/health/live` probes it cannot answer.

## Open Questions

None. The route name, dependency boundary, OpenAPI treatment, process command, verification split, and deployment ordering are resolved by the ticket constraints.
