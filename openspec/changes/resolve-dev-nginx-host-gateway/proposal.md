## Why

`server/nginx.conf` proxies both dev vhosts to `http://host.docker.internal:3005` and
`:3006`. Docker Desktop injects that alias into every container automatically; Docker Engine
on Linux does not. `server/docker-compose.yml` never declares the mapping, so on a Linux dev
host the nginx service fails to resolve its upstream at config-parse time and dies:

```
[emerg] 1#1: host not found in upstream "host.docker.internal" in /etc/nginx/nginx.conf:17
```

`restart: always` then restarts it forever. Reproduced on this host (Docker Engine 27.2.0,
Compose v2.29.2) with the single variable isolated: the same `server/nginx.conf` and the same
`ci/certificates` bind mount in an `nginx` container exits 1 with the message above, and the
identical command plus `--add-host host.docker.internal:host-gateway` reaches
`Configuration complete; ready for start up` and stays up.

The documented first step of the dev environment therefore cannot produce a working TLS proxy
on Linux, and nothing announces it: `up -d` exits 0 without `--wait`, so the only signal is
`ps` reporting `Restarting`. `bin/setup-dev.sh` step 4/4 then asks `Is the Docker stack up?`,
which misdirects — the stack *is* up; one service in it can never start.

## What Changes

- Declare `host.docker.internal:host-gateway` under `extra_hosts` on the `nginx` service in
  `server/docker-compose.yml`, unconditionally rather than per platform.
- Assert that mapping on the resolved Compose model in `bin/verify-server-compose.mjs`,
  inside `assertScopedModel`, next to the existing certificate-mount assertion — so it holds
  for the base model, the alternate-port model, and the E2E overlay alike.
- Make `bin/setup-dev.sh` step 4/4 name the fault: on the unreachable-TLS branch, report the
  nginx service's actual container state from `bin/server-compose.sh ps` so a restart loop
  reads as `Restarting`, and keep `Is the Docker stack up?` for the case where nginx has no
  container at all.

## Capabilities

### Modified Capabilities

- `server-compose-development-environment`: the local Compose contract gains a host-gateway
  reachability guarantee for the TLS proxy, and its setup diagnostics gain the ability to
  distinguish "the stack is not up" from "nginx is up and failing".

## Impact

- Expected implementation surfaces: `server/docker-compose.yml` (one `extra_hosts` key on
  `nginx`), `bin/verify-server-compose.mjs` (one assertion), `bin/setup-dev.sh` (step 4/4
  failure branch).
- `server/docker-compose.yml` is the base the E2E overlay layers on, but **CI is unaffected**:
  `ci/e2e-server.sh` runs `compose up --wait … server`, naming the service so only `server` and
  its `depends_on` (postgres, redis) start. E2E never brings up nginx, and this change must keep
  it that way. The overlay's existing service-set assertion in `bin/verify-server-compose.mjs`
  stays true.
- No sensitive surface is touched: no `terraform/`, no `k8s/`, no `.github/workflows/`, no
  migration, no native/EAS config, no `openapi/openapi.json` or generated client, no `app/`.
  It is shared dev infrastructure, so the render-level assertion is the proof.
- `bin/verify-server-compose.mjs` is a **manual-only** harness. Nothing invokes it
  (`grep -rn verify-server-compose .github/ package.json` is empty). Its output is evidence to
  cite; it is not a CI gate, and this change does not make it one.

## Non-Goals

- `server/nginx.conf`, the vhosts, the proxied ports, and the certificate mount stay as they
  are. The upstream name is correct; only the container's ability to resolve it was missing.
- `server/docker-compose.e2e.yml` is unchanged.
- No change to `restart:`, no nginx healthcheck, and no `--wait` injected into
  `bin/server-compose.sh`. That wrapper is a deliberate `exec docker compose "$@"` passthrough;
  injecting flags would surprise `ci/e2e-server.sh`, which passes its own `--wait`.
- `bin/verify-server-compose.mjs` is not wired into CI here. `.github/workflows/` is a
  sensitive surface and a separate decision.
