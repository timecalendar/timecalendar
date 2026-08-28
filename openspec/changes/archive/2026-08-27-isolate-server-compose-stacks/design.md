## Context

Docker Compose derives its default project from the Compose-file directory. Every
TimeCalendar checkout therefore resolves `server/docker-compose.yml` as project `server`,
even when the files come from different worktrees. Compose then gives those checkouts the
same container/network namespace and expands `postgres_data` and `redis_data` to the same
`server_*` named volumes. The current published ports are also literal values, so a second
stack cannot bind them.

The immediate `1443` conflict is an orphaned Docker proxy. This change must make local work
independent of that listener; it must not kill the proxy, restart Docker, or run any command
that changes shared services during proposal or static verification. The nginx certificate
bind mount and the CI workflow's direct consumption of the base Compose file are sensitive
compatibility constraints.

The relevant current contracts are `server/docker-compose.yml`, its E2E overlay,
`ci/e2e-server.sh`, the root quickstart, `bin/setup-dev.sh`, the agent environment handbook,
and the Architecture Book testing page. No product, API, database-schema, deployment, or
mobile-runtime contract is involved.

## Goals / Non-Goals

**Goals:**

- Give each worktree a deterministic Compose project namespace by default while preserving
  the main checkout's existing `server` namespace.
- Let a contributor select free host ports without changing container ports or Compose
  service discovery.
- Make Postgres/Redis-only startup the supported path for generation and server tests when
  nginx is unavailable.
- Make the effective project and ports visible in commands and setup diagnostics.
- Prove the resolved configuration statically and preserve the current CI/E2E consumers.

**Non-Goals:**

- No cleanup, stop, restart, removal, or ownership repair of existing Docker resources.
- No change to the production/deployment Compose model, nginx config, certificates, server
  listen port, API contract, generated clients, migrations, infrastructure, native/store
  config, or legacy Flutter app.
- No automatic host-port allocation. Deterministic explicit overrides are easier to connect
  to `DATABASE_URL`, `REDIS_URL`, browser URLs, and diagnostics than ephemeral ports.
- No general-purpose environment manager or persistence of per-worktree settings.

## Decision 1 — Use one local wrapper to derive and pass the Compose project

Add an executable `bin/server-compose.sh` as the documented local entrypoint. It resolves
the git top-level from the caller's current checkout and locates the main checkout through
the git common directory. It then selects:

- an explicitly supplied `COMPOSE_PROJECT_NAME`, unchanged, when present;
- `server` in the main checkout, preserving existing local container/volume identity; or
- `server-<readable-worktree-slug>-<short-path-hash>` in another worktree.

The slug is normalized to Compose's lowercase alphanumeric/underscore/hyphen grammar and
bounded in length; a short hash of the canonical checkout path makes equal/truncated slugs
collision-resistant. Git itself supplies the portable hash operation, avoiding GNU-only
`sha256sum` assumptions on macOS. The wrapper passes the result with Compose's `--project-name`
option and forwards the remaining arguments unchanged. A non-mutating `project-name` mode
prints the selected identity for diagnostics.

The wrapper resolves from the caller's git root, rather than its own file location, so the
same revision can statically inspect another checkout. It fails clearly outside a TimeCalendar
git checkout.

**Alternatives considered:**

- A top-level Compose `name:` cannot derive a worktree identity by itself; it would still
  require callers to pre-populate an environment variable.
- A committed `.env` would assign every checkout the same value. The current worktree setup
  also symlinks `server/.env` from main, so using that ignored file would reintroduce shared
  identity and cross-worktree mutation.
- Branch name alone is readable but can be empty in detached worktrees and is less robust
  under truncation; the path hash closes those cases.
- Hard-coded `container_name` or explicit volume `name` fields would fight Compose's project
  scoping and add more names to maintain. The design intentionally relies on Compose's
  standard project prefixes.

## Decision 2 — Parameterize only host-side ports, with existing defaults

Replace the three literal published host ports in `server/docker-compose.yml` with:

- `${TIMECALENDAR_TLS_PORT:-1443}:443`
- `${TIMECALENDAR_POSTGRES_PORT:-37291}:5432`
- `${TIMECALENDAR_REDIS_PORT:-37292}:6379`

Container ports, service names, healthchecks, volumes, and bind mounts remain unchanged.
This preserves service-to-service URLs in the E2E overlay and the CI defaults when the
workflow invokes the Compose file directly. The TimeCalendar-prefixed names avoid generic
environment collisions and make their ownership clear.

The docs show one shell-scoped group of port variables for the Compose command. When the
database/Redis ports differ, server commands receive matching shell-scoped `DATABASE_URL`
and `REDIS_URL` values; no shared `.env` file is rewritten. The default URLs remain
`https://api.timecalendar.host:1443`, Postgres on `localhost:37291`, Redis on
`127.0.0.1:37292`, and the separately run Nest server on `localhost:3005`.

**Alternatives considered:**

- Ephemeral published ports (`127.0.0.1::5432`) avoid selection but make application URLs
  and diagnostics depend on runtime discovery.
- Making nginx profile-gated would add a second Compose concept and change bare `up`
  semantics. Explicit service selection already provides the required nginx-free path.
- Per-worktree generated env files introduce lifecycle and stale-file problems for three
  simple values.

## Decision 3 — Make dependency-only startup explicit, not implicit

The supported generation/test prerequisite is:

```bash
bin/server-compose.sh up -d postgres redis
```

With alternate ports, the same command receives the `TIMECALENDAR_*` overrides and the
subsequent npm command receives matching test-profile `DATABASE_URL` and `REDIS_URL` values.
The normal full-stack command remains `bin/server-compose.sh up -d`; nginx is neither
removed nor disabled by default. This preserves the simple single-checkout experience and
the certificate-backed web/mobile import path while allowing work that does not need TLS to
ignore an occupied `1443` port.

The root README carries the concise contributor contract. The agent handbook records the
derivation, override, URL, and troubleshooting details. `bin/setup-dev.sh` reports the
selected project/ports and uses the effective TLS port in its curl and remediation text.
The Architecture Book testing page names the dependency-only local prerequisite, and its
changelog records the reusable testing-contract change.

**Alternative considered:** silently omitting nginx from the default stack would surprise
existing contributors and break the documented HTTPS import flow. Service selection makes
the distinction explicit at the call site.

## Decision 4 — Verify resolved models without lifecycle operations

Verification uses only `docker compose config` through the wrapper. It resolves two project
names and alternate port sets, then checks the model's project name, generated default
network, service/container namespace, `postgres_data`/`redis_data` concrete names, published
ports, certificate bind-mount target, and the merged E2E service model. A focused repository
script or test may parse `--format json`; it must contain no `up`, `down`, `stop`, `rm`, or
daemon-restart step.

The existing GitHub `test` job remains the CI compatibility proof: its unchanged direct
`docker compose --env-file ./ci/.env.test -f server/docker-compose.yml up -d` must start
Postgres/Redis on the historical defaults, after which server tests and OpenAPI drift checks
must pass. The workflow itself is not edited.

**Alternative considered:** live-starting a second stack on guessed high ports would prove
more runtime behavior but risks shared-host interference and is unnecessary because Compose
fully resolves the names, mounts, and published ports in its config model. If a later reviewer
wants live proof, CI or explicitly isolated high ports are the only acceptable venue.

## Risks / Trade-offs

- **[Contributors bypass the wrapper and invoke Compose directly]** → Direct invocation
  deliberately remains compatible for CI/E2E, but human docs consistently name the wrapper
  and diagnostics make the selected project visible.
- **[Custom DB/Redis ports do not automatically reconfigure NestJS]** → Document the exact
  matching `DATABASE_URL`/`REDIS_URL` shell overrides next to every custom-port example;
  avoid mutating shared `.env` files.
- **[Worktree rename changes the derived namespace]** → The canonical path is intentionally
  part of identity. Renaming a worktree yields a fresh isolated stack; the old resources can
  be cleaned later by an explicit owner, outside this change.
- **[Existing worktree data is not reused]** → Only the main checkout retains `server`.
  Worktrees receive isolated volumes by design; no automatic data copying or cleanup occurs.
- **[Compose-version output details differ]** → Verify semantic JSON fields and concrete
  names, not presentation order or human-formatted YAML.
- **[Sensitive nginx certificate source is exposed by diagnostics]** → Check only the bind
  mount source/target contract; never read, print, copy, or modify certificate contents.

## Migration Plan

This is a local-development contract with no deployed migration. Land the wrapper, port
interpolation, diagnostics, docs, Architecture Book note, and static proof together. Existing
main-checkout users keep their `server_*` resources and default URLs. Worktree users create
new isolated resources on their next wrapper `up`; no existing resource is removed.

Rollback is a normal revert of the repository changes. Any project-scoped resources created
while the change is active remain untouched and can be removed later only through an explicit,
separately authorized cleanup.

## Open Questions

None. The Founding Engineer brief fixes the scope, compatibility boundaries, and
non-disruptive verification policy.
