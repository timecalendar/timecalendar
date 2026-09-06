## 1. Compose host-gateway mapping

- [x] 1.1 Add `extra_hosts: ["host.docker.internal:host-gateway"]` to the `nginx` service in
  `server/docker-compose.yml`, and to that service only. Leave `image`, `restart`, `ports`, and
  both volume mounts byte-identical. Verify with
  `bin/server-compose.sh config --format json` that the nginx service carries the mapping and
  that `postgres` and `redis` still carry none.
- [x] 1.2 Confirm the E2E overlay inherits it without gaining anything else:
  `bin/server-compose.sh --file server/docker-compose.e2e.yml config --format json` still
  resolves exactly `nginx`, `postgres`, `redis`, `server`, and the `server` service declares no
  `extra_hosts`. Do not edit `server/docker-compose.e2e.yml`.

## 2. Static proof in the existing harness

- [x] 2.1 Extend `assertScopedModel` in `bin/verify-server-compose.mjs` with the host-gateway
  assertion, placed next to the existing certificate-mount assertion so it runs for both
  worktree port sets, the default-port model, and the overlay. **Read `design.md` Decision 2
  first:** Compose v2.29.2 renders the authored `host.docker.internal:host-gateway` as
  `"host.docker.internal=host-gateway"` — an `=`, not a `:` — and other versions render a map.
  Normalize both shapes before asserting membership, and default a missing `extra_hosts` key to
  `[]` so an absent mapping fails the assertion instead of throwing a `TypeError`.
- [x] 2.2 Keep the harness `config`-only. No `up`, `down`, `stop`, `rm`, prune, or any other
  command that mutates a Docker resource — the `Static isolation verification` requirement
  forbids it, and other checkouts share this daemon.
- [x] 2.3 Prove the assertion actually bites: with the mapping temporarily removed from
  `server/docker-compose.yml`, `node bin/verify-server-compose.mjs` must fail on the new
  assertion's message; restore the mapping and confirm it passes. Record both outcomes. Restore
  the file before committing — `git diff server/docker-compose.yml` must show only the
  `extra_hosts` addition.

## 3. Setup diagnostics name the fault

- [x] 3.1 In `bin/setup-dev.sh` step 4/4, on the `code = 000` branch only, query the nginx
  service's container state through `"$ROOT/bin/server-compose.sh" ps --all --format
  '{{.State}} {{.Status}}' nginx`. Print it when non-empty; fall through to the existing
  `Is the Docker stack up?` line when empty. Keep `fail=1` and the existing project/port line in
  both cases, and leave the success branch and the `:3005` backend check untouched.
- [x] 3.2 Guard the query for `set -euo pipefail`: capture with `2>/dev/null || true` so a
  missing `docker` binary or an unreachable daemon yields an empty string and the script still
  reaches the backend check and the final summary. Do not add a `jq` (or any new) dependency —
  the Go template is what avoids it.
- [x] 3.3 Do not touch the `--http-status` or `--compose-config` argument modes.
  `bin/verify-server-compose.mjs` invokes `--http-status` twice and asserts it returns exactly
  `000`; both assertions must stay green.

## 4. Local green

- [x] 4.1 `bash -n bin/setup-dev.sh` (and any other changed shell script).
- [x] 4.2 `node bin/verify-server-compose.mjs` green. It needs the main checkout **plus one
  linked worktree** (`assert.ok(secondRoot, "verification needs the main checkout and one linked
  worktree")`); run it from this worktree so `currentRoot !== mainRoot` satisfies that. Paste the
  JSON evidence block into the PR.
- [x] 4.3 Live proof on this Linux host: `bin/server-compose.sh up -d` then
  `bin/server-compose.sh ps` showing nginx `Up`, not `Restarting`. Bring up **this worktree's**
  project only — `bin/server-compose.sh` scopes it — and do not stop, remove, or otherwise
  disturb another checkout's containers.
- [x] 4.4 Exercise the step 4/4 branch you changed: run `bin/setup-dev.sh` (or just its step 4/4
  path) with nginx stopped in this worktree's own project and confirm the output names the
  container state; confirm the no-container case still prints the stack prompt. Capture both.
- [x] 4.5 `openspec validate resolve-dev-nginx-host-gateway --strict`.

## 5. Scope audit

- [x] 5.1 `git diff --check` and review the final path diff. The only changed paths outside
  `openspec/` must be `server/docker-compose.yml`, `bin/verify-server-compose.mjs`, and
  `bin/setup-dev.sh`. Confirm no change to `server/nginx.conf`,
  `server/docker-compose.e2e.yml`, `ci/e2e-server.sh`, `ci/certificates/`,
  `.github/workflows/`, `openapi/openapi.json`, generated clients, migrations, native/EAS
  config, `terraform/`, `k8s/`, or `app/`.
- [x] 5.2 No Architecture Book update is due: nothing under `mobile/` changes, and the local
  dependency-only server prerequisite recorded in `docs/mobile/architecture-book/testing.md`
  still holds unchanged (nginx was never part of it). Confirm by re-reading that section rather
  than by assumption; if it turns out to describe nginx, update it and append to
  `docs/mobile/architecture-book/CHANGELOG.md`.
- [x] 5.3 Record the macOS assumption in the PR body per `design.md` Decision 4 — the reasoning,
  and that it is explicitly **not** a merge gate. No stage may convert it into one.
- [x] 5.4 State in the PR body that `bin/verify-server-compose.mjs` is a manual-only harness
  (`grep -rn verify-server-compose .github/ package.json` is empty). Cite its output as evidence;
  do not describe it as a CI gate, and do not wire it into one here.

## 6. Archive and CI

- [x] 6.1 Rehearse the archive in a scratch copy before pushing the final head — never in the
  worktree:
  `S="$PAPERCLIP_RUN_SCRATCH_DIR/archive-rehearsal"; rm -rf "$S"; mkdir -p "$S"; cp -r openspec "$S/openspec"; (cd "$S" && openspec archive resolve-dev-nginx-host-gateway -y && openspec validate --specs --strict)`.
  The delta is `## ADDED Requirements` only, so no header is reconciled against
  `openspec/specs/server-compose-development-environment/spec.md`; the rehearsal is the proof,
  not the assumption. **Pre-cleared by the Proposer** at the artifacts-only head:
  `+ 2 added, ~ 0, - 0, → 0`, then `openspec validate --specs --strict` 81/81. Appending inside
  an existing ADDED requirement keeps that pre-clear valid and must reproduce the same totals;
  introducing a MODIFIED or REMOVED block voids it and needs a fresh rehearsal.
- [x] 6.2 Run the real `openspec archive resolve-dev-nginx-host-gateway -y` and commit the merged
  spec inside this PR. The archive commit ships with the feature, never after it.
- [x] 6.3 Confirm CI is green on the final head. `.github/workflows/ci-build-deploy.yml`'s `test`
  job consumes the base Compose file directly; it must pass unchanged, and the workflow must not
  be edited to obtain that proof.
- [x] 6.4 Run the disclosure scan against the exact PR title and body before every
  `gh pr create` / `gh pr edit` / `gh pr comment`, and describe the repro with repo-relative
  paths only — no absolute host paths.
