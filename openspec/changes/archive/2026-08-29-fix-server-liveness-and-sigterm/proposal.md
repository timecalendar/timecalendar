## Why

The server's only health route performs a one-second Postgres ping, so transient database latency is indistinguishable from a dead process to Kubernetes. The image also starts through a shell-form `CMD`, which prevents kubelet's `SIGTERM` from reaching Node and turns normal pod termination into a forced `SIGKILL` after the grace period.

## What Changes

- Add `GET /health/live`, a local liveness route that returns HTTP 200 from process-local code without accessing Postgres, Redis, Firestore, S3, or any other external dependency.
- Preserve the existing database-backed `GET /health` route unchanged as the readiness/dependency-health signal.
- Keep the internal liveness route out of the committed public OpenAPI document.
- Start the production image with an exec-form command that makes `node dist/main` PID 1, allowing the existing Nest shutdown hooks to receive `SIGTERM`.
- Add focused tests and a container-level CI proof for the dependency-free route, image command shape, PID 1, and startup behavior.

## Capabilities

### New Capabilities

- `server-runtime-lifecycle`: Defines the server's distinct readiness and dependency-free liveness signals, public-contract exclusion, and signal-safe container process contract.

### Modified Capabilities

None.

## Impact

- Server application wiring gains one local, dependency-free controller and focused test coverage; `@lyrolab/nest-shared` continues to own `/health`.
- `server/Dockerfile` changes the entrypoint for every environment from shell form to direct exec-form Node invocation.
- A focused proof may be added under `ci/` and wired into `.github/workflows/ci-build-deploy.yml`; the workflow is a sensitive surface and must remain limited to validating the already-built server image.
- `openapi/openapi.json` and `mobile/src/api/generated/` must remain byte-identical. No database migration, mobile/native/store configuration, Terraform, Kubernetes chart, or legacy Flutter change is allowed.
- The production Kubernetes liveness probe is deliberately not repointed here. That separate chart change must land only after this server image is available, otherwise existing production pods would be probed at a route they do not serve.
