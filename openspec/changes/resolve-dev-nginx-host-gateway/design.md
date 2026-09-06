## Context

`host.docker.internal` is not a Docker feature that exists everywhere. Docker Desktop
(macOS/Windows) injects the alias into every container it starts, because the Linux VM's
gateway is an implementation detail Desktop owns. Docker Engine on Linux has no such VM and
injects nothing: a container gets the alias only when the service asks for it, via
`extra_hosts` (Compose) / `--add-host` (CLI), using the magic value `host-gateway` that Engine
resolves to the container network's gateway address.

`server/nginx.conf` names that alias in three `proxy_pass` directives. nginx resolves an
upstream host at **configuration parse time**, not per request, so an unresolvable name is a
startup `[emerg]`, not a runtime 502. With `restart: always` on the service, the result is a
restart loop rather than a visible failure, and `bin/server-compose.sh up -d` — a passthrough
to `docker compose up -d`, without `--wait` — exits 0 regardless.

The relevant current contracts are `server/docker-compose.yml`, its E2E overlay,
`ci/e2e-server.sh`, `bin/server-compose.sh`, `bin/setup-dev.sh`, and the resolved-model proof in
`bin/verify-server-compose.mjs`. No product, API, database-schema, deployment, or mobile-runtime
contract is involved.

## Goals / Non-Goals

**Goals:**

- `bin/server-compose.sh up -d` yields an nginx container that starts and stays up on Docker
  Engine/Linux, with no per-host manual step and no platform branch in the Compose file.
- Keep the guarantee provable statically, from the resolved Compose model, in the harness that
  already owns this file's contract.
- When the TLS proxy is nevertheless unreachable, make `bin/setup-dev.sh` name the actual fault
  instead of pointing the reader at a stack that is already up.

**Non-Goals:**

- No change to `server/nginx.conf`, the vhosts, the proxied backend ports, the certificate
  mount, or `server/docker-compose.e2e.yml`.
- No change to `restart:`, no nginx healthcheck, and no `--wait` injected by the wrapper.
- No CI wiring for `bin/verify-server-compose.mjs`.
- No attempt to make nginx tolerate a missing upstream (e.g. a `resolver` directive plus a
  variable `proxy_pass`). That converts a startup failure into a runtime one and changes proxy
  behaviour for a problem the alias already solves.

## Decision 1 — Declare `extra_hosts` unconditionally, not per platform

Add to the `nginx` service only:

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

`host-gateway` has been supported by Docker Engine since 20.10 and by Docker Desktop, so one
declaration covers both. On Desktop the alias already resolves; the extra `/etc/hosts` line
names the same gateway the platform would have injected, so it is a no-op rather than a
conflict. That makes a platform branch — a profile, an override file, or a documented
Linux-only `docker-compose.override.yml` — pure cost: another file to keep in sync, another
thing a contributor can forget, and a second code path that the static proof would have to
render twice.

It goes on `nginx` alone. `postgres` and `redis` reach nothing on the host, and `server` (E2E
overlay) addresses its siblings by Compose service name.

**Alternatives considered:**

- **Point `proxy_pass` at a literal gateway address.** Not portable, and it hard-codes a value
  that varies per network.
- **Put the backends inside the Compose network.** A much larger change: the dev flow
  deliberately runs `server`/`web` natively with hot reload on the host.
- **A Linux-only override file.** Rejected above — the mapping is harmless on Desktop, so
  conditioning it buys nothing.

## Decision 2 — Prove it on the resolved model, tolerating Compose's rendering shape

The assertion belongs in `assertScopedModel` in `bin/verify-server-compose.mjs`, alongside the
certificate-mount assertion. That function is already applied to three models — the two
worktree-scoped port sets, the default-port model, and the base+E2E overlay — so one assertion
there proves the mapping survives port overrides, project scoping, and overlay layering,
including the case that matters most: the overlay must not drop it.

**The rendered form is not the authored form.** Measured on Compose v2.29.2, the list entry
`"host.docker.internal:host-gateway"` renders in `docker compose config --format json` as:

```json
"extra_hosts": ["host.docker.internal=host-gateway"]
```

— an `=` separator, not the `:` that was written. Compose has also rendered `extra_hosts` as a
map (`{"host.docker.internal": "host-gateway"}`) in other versions. An assertion that looks for
the authored string fails against a correct file, which is exactly the kind of red that gets
"fixed" by weakening the check. Normalize both shapes to one canonical `host:value` entry and
assert membership:

```js
const extraHosts = model.services.nginx.extra_hosts ?? [];
const hostEntries = Array.isArray(extraHosts)
  ? extraHosts.map((entry) => entry.replace("=", ":"))
  : Object.entries(extraHosts).map(([host, address]) => `${host}:${address}`);
assert.ok(
  hostEntries.includes("host.docker.internal:host-gateway"),
  "nginx must map host.docker.internal to the host gateway",
);
```

The `?? []` matters: when the key is absent, Compose omits it entirely rather than emitting an
empty list, and indexing straight into `.map` would throw a `TypeError` instead of failing the
assertion with its message.

The harness stays `config`-only and non-mutating, per the existing "Static isolation
verification" requirement — no `up`, `down`, `stop`, `rm`, or prune.

## Decision 3 — Step 4/4 reports the nginx container state instead of guessing

Today the unreachable-TLS branch prints:

```
✗ cannot reach https://api.timecalendar.host:1443 (DNS, nginx, or cert).
  Is the Docker stack up?  bin/server-compose.sh up -d
```

Against a crash-looping nginx that is wrong in the one way that costs the most time: it tells
the reader to do the thing they just did. Ask Compose what the service is actually doing and
print it:

```bash
nginx_state="$("$ROOT/bin/server-compose.sh" ps --all --format '{{.State}} {{.Status}}' nginx 2>/dev/null || true)"
```

- Non-empty → the container exists; print the line. A restart loop then reads as
  `restarting Restarting (1) 3 seconds ago`, which names the fault, and the remediation becomes
  "read the logs" rather than "start the stack".
- Empty → nginx has no container (stack never started, or Docker is unavailable). Keep the
  existing `Is the Docker stack up?` line, which is correct in exactly that case.

Three constraints on the implementation:

- **`set -euo pipefail` is on.** A missing `docker` binary or an unreachable daemon makes the
  command non-zero, which would abort the script mid-diagnosis — the opposite of this script's
  job. Capture with `2>/dev/null || true` so the empty result falls through to the existing
  branch.
- **No new dependency.** A Go template avoids `jq`; `--format json` would add one. Measured on
  Compose v2.29.2: `ps --all --format '{{.State}} {{.Status}}' nginx` exits 0 and prints nothing
  when the container is absent, and one line when it exists.
- **Resolve the project through the wrapper, not by hand.** `bin/setup-dev.sh` already calls
  `bin/server-compose.sh project-name`; calling the wrapper again for `ps` keeps the worktree
  project selection in one place. `ps` is non-mutating and touches no other checkout's stack.

**Alternatives considered — and deliberately not shipped:**

- **An nginx healthcheck plus `--wait`**, or teaching `bin/server-compose.sh` to inject
  `--wait`. This would surface the failure at `up` time rather than at diagnosis time, which is
  arguably better. It is out of scope by the dispatching brief: the wrapper is a deliberate
  passthrough and injecting flags would surprise `ci/e2e-server.sh`, which passes its own
  `--wait`. Shipping both this and Decision 3 is explicitly forbidden. If the Applier concludes
  it is the better fix, say so on the issue and hand back to the Founding Engineer — do not
  ship both.
- **Dropping `restart: always`.** Makes the failure visible by leaving a dead container, but
  degrades the normal case, where the restart is what recovers the stack after a daemon restart.

## Decision 4 — macOS is a stated assumption, never a gate

No macOS host is reachable from this pipeline, so the Desktop half of Decision 1 cannot be
exercised. The reasoning stands on documented behaviour: `host-gateway` is supported by Docker
Desktop, and on Desktop the alias already resolves to the same gateway, so the added
`/etc/hosts` line is redundant rather than contradictory.

Record it in the PR as an assumption with that reasoning. It is **not** a merge gate, and no
stage may convert it into one. The Linux half — the one that was broken — is fully exercised.

## Risks

- **The E2E overlay silently starting nginx.** It does not: `ci/e2e-server.sh` runs
  `compose up --wait $build_flag server`, naming the service, so Compose starts only `server`
  and its `depends_on`. The overlay's service-set assertion in `bin/verify-server-compose.mjs`
  pins the rendered service list and must stay green.
- **A future Compose version changing the `extra_hosts` rendering again.** Decision 2's
  normalization absorbs the two known shapes; a third would fail loudly with a readable message
  rather than passing vacuously.
