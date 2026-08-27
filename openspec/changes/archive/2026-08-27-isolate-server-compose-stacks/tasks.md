## 1. Compose project and port contract

- [x] 1.1 Add executable `bin/server-compose.sh`: resolve the caller's git top-level and
  main checkout, honor explicit `COMPOSE_PROJECT_NAME`, preserve `server` for main, and
  derive a bounded `server-<slug>-<path-hash>` name for worktrees; provide a non-mutating
  `project-name` diagnostic and forward all other arguments to
  `server/docker-compose.yml` with `--project-name`. Verify with `bash -n` plus main/worktree
  and explicit-override name assertions.
- [x] 1.2 Parameterize only the host side of the nginx, Postgres, and Redis port mappings in
  `server/docker-compose.yml` using `TIMECALENDAR_TLS_PORT` (default `1443`),
  `TIMECALENDAR_POSTGRES_PORT` (default `37291`), and `TIMECALENDAR_REDIS_PORT` (default
  `37292`). Verify default and alternate values in `docker compose config --format json`.
- [x] 1.3 Confirm the resolved named volumes and default network remain Compose-project
  scoped (no explicit global `name:`/`container_name` fields), and confirm the nginx
  `ci/certificates/` bind source/target is unchanged without reading or modifying its
  contents.

## 2. Diagnostics and contributor commands

- [x] 2.1 Update `bin/setup-dev.sh` to report the selected Compose project and effective
  TLS/Postgres/Redis ports, use the effective TLS port for reachability/remediation output,
  and keep the backend `localhost:3005` check accurate. Verify the script with `bash -n` and
  non-mutating diagnostic paths only; do not start/stop Docker or contact the orphaned
  `1443` listener during implementation proof.
- [x] 2.2 Update `README.md` so local full-stack startup uses `bin/server-compose.sh up -d`,
  documents the unchanged default URLs, and gives one concise alternate-port example plus
  `bin/server-compose.sh up -d postgres redis` for generation/tests.
- [x] 2.3 Update `docs/agent-dev-environment.md` with the worktree-name derivation,
  `COMPOSE_PROJECT_NAME` escape hatch, all port variables, matching `DATABASE_URL` /
  `REDIS_URL` examples, project/port troubleshooting commands, and the explicit rule that
  shared Docker services are never cleaned up as routine setup.
- [x] 2.4 Update `docs/mobile/architecture-book/testing.md` with the reusable local
  dependency-only server prerequisite and preserved `ci/e2e-server.sh` lifecycle boundary;
  record the Architecture Book contract update in
  `docs/mobile/architecture-book/CHANGELOG.md`.

## 3. Static resolved-model proof

- [x] 3.1 Add a focused repository verification script/test that resolves two distinct
  project identities and alternate port sets, parses Compose JSON, and asserts distinct
  project/container/network/volume names plus the expected published ports. It MUST use
  `config` only and contain no `up`, `down`, `stop`, `rm`, prune, daemon restart, or other
  resource-mutating command.
- [x] 3.2 Extend the static proof to resolve
  `server/docker-compose.yml` + `server/docker-compose.e2e.yml` together and assert the
  server service, health/dependency wiring, service-name database/Redis URLs, and certificate
  mount contract remain intact.
- [x] 3.3 Run the proof against this checkout and one available sibling worktree (or two
  synthetic canonical worktree roots through the tested name resolver) and record the two
  derived project names and volume names. Use only `docker compose config`; no live stack is
  required.

## 4. Local green and scope audit

- [x] 4.1 Run `bash -n` on every changed shell script and run the focused static Compose
  proof with both default and alternate ports.
- [x] 4.2 Run `openspec validate isolate-server-compose-stacks --strict` and confirm all
  proposal tasks/spec scenarios remain represented by the implementation.
- [x] 4.3 Inspect `git diff --check` and the final path diff. Confirm there is no change to
  `.github/workflows/ci-build-deploy.yml`, `ci/certificates/` contents,
  `openapi/openapi.json`, generated clients, migrations, native/store config,
  `terraform/`, `k8s/`, or `app/`, and confirm no Docker lifecycle command was run for local
  verification.

## 5. CI compatibility proof

- [x] 5.1 Push the implementation and confirm the existing `ci-build-deploy.yml` `test` job
  passes unchanged: its direct base-Compose invocation starts Postgres/Redis on historical
  defaults, server tests pass, and the OpenAPI drift check remains green. Do not edit the
  workflow to obtain this proof.
- [x] 5.2 Confirm no device or human-only gate applies. Record CI links/results and the
  static resolved-model evidence in the issue/PR handoff for Reviewer verification.
