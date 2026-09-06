## Why

`ci/certificates/cert.pem` is a committed self-signed certificate valid `2025-08-23` →
`2026-08-23`. It has expired: `openssl x509 -noout -checkend 0` exits 1.

It is load-bearing, not dead weight. nginx mounts the pair for both dev vhosts,
`bin/setup-dev.sh` trusts it in the iOS Simulator and curls the API with `--cacert`, and six
documents and config samples default to `https://api.timecalendar.host:1443`.

Nothing regenerates it. `generate-certificates.sh` is invoked by no script, Compose file, or
workflow, and only works from inside its own directory. So the expiry was silent — and today
step 4 of setup fails and blames the wrong thing, because `curl`'s verification failure
collapses to status `000` and the script reports DNS, nginx, or a stopped Docker stack.

Committing the pair also keeps a private key in a public repository. It protects nothing, but
there is no reason to carry it — and re-committing a longer-dated pair is the same defect with
a later date.

## What Changes

- Make `ci/certificates/generate-certificates.sh` location-independent (resolve its own
  directory for both `ssl.cnf` and its outputs) and give the pair a lifetime far beyond a year.
- Add `ci/certificates/ensure-certificates.sh`: an idempotent guard that regenerates only when
  the pair is missing, unreadable, or inside its renewal window, and otherwise does nothing.
  The guard, not the certificate lifetime, is the mechanism that keeps the dev env working.
- Call the guard from `bin/server-compose.sh` immediately before it execs `docker compose`, and
  from `bin/setup-dev.sh` before its certificate-dependent steps, so both the documented
  "bring the stack up first" path and a standalone setup run provision the material they need.
- Stop tracking `ci/certificates/cert.pem` and `ci/certificates/key.pem` and ignore them.
  `ssl.cnf` and both scripts stay tracked.
- Stop starting nginx in CI. The `test` job's "Start Postgres and Redis" step runs
  `docker compose -f server/docker-compose.yml up -d` with no service list, and that model
  resolves `nginx postgres redis` — so the step starts nginx today and would leave it
  crash-looping on a missing certificate once the pair is untracked. Name the two services the
  step already claims to start, matching what `ci/e2e-server.sh` does for the same reason.
- Teach `bin/setup-dev.sh` step 4 to distinguish a TLS verification failure from an unreachable
  proxy, and to say when a just-regenerated certificate needs an nginx restart and a fresh
  trust step.
- Document the mechanism in one place — `docs/agent-dev-environment.md` — and have `README.md`
  and the `bin/setup-dev.sh` header point at it rather than restate it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-compose-development-environment`: require the local TLS material to be provisioned
  on demand rather than committed, require the provisioning to be idempotent, and extend the
  configuration-diagnosability requirement to cover certificate validity.

## Impact

- Affected repository areas: `ci/certificates/`, `bin/server-compose.sh`, `bin/setup-dev.sh`,
  the root `.gitignore`, `docs/agent-dev-environment.md`, `README.md`, and one step in
  `.github/workflows/ci-build-deploy.yml`.
- **Sensitive surface — `ci/certificates/`.** The change deletes a tracked private key. It is a
  self-signed, dev-only key for `timecalendar.host`, `api.timecalendar.host`, and
  `web.timecalendar.host`, names that resolve to `127.0.0.1` through a developer's `/etc/hosts`
  entry. It authenticates nothing outside a developer's own machine, is not used by CI, and is
  not related to any production certificate. Deleting it removes material that never needed to
  be published; the PR body must say so.
- **Sensitive surface — `.github/workflows/`.** One step gains an explicit service list. No
  trigger, job, deploy behavior, image tag, or other command changes.
- `server/docker-compose.yml` and `server/nginx.conf` are unchanged: the mount path, the vhosts,
  the ports, and the certificate filenames all stay as they are.
- No CI path starts nginx or reads the certificate after this change. `ci/e2e-server.sh` and
  `server/docker-compose.e2e.yml` are untouched.
- Behavioral cost, deliberately accepted: each checkout mounts its own `ci/certificates`, so
  every worktree now generates its own pair instead of sharing one committed pair. Trusting the
  certificate in a simulator, OS, or browser store is per-checkout, and is documented as such.
- No production API behavior, OpenAPI contract, generated mobile client, database
  schema/migration, dependency, native/store config, deployment infrastructure, or legacy
  Flutter code changes.
