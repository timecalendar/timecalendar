## Context

The local dev env terminates TLS in an nginx container defined by `server/docker-compose.yml`.
The container bind-mounts `../ci/certificates` to `/etc/nginx/certificates`, and
`server/nginx.conf` names `certificates/cert.pem` and `certificates/key.pem` for both the
`api.timecalendar.host` and `web.timecalendar.host` vhosts. Both files are tracked, alongside
`ssl.cnf` and an unwired `generate-certificates.sh`.

Five surfaces depend on that TLS endpoint: the Compose model, the nginx config,
`bin/setup-dev.sh` (which trusts `cert.pem` in the booted iOS Simulator and then curls the API
with `--cacert`), the documented dev URLs in `README.md`, `docs/agent-dev-environment.md`,
`app/README.md`, and `mobile/README.md`, and the defaults in `web/.env.local.sample` and
`mobile/src/api/config.ts`. The path is used; it is simply never exercised by a machine that
validates the chain, which is why a 2026-08-23 expiry produced no red build.

One assumption inherited from the ticket brief did not survive checking, and it changes the
scope. The brief states that nothing in CI ever starts nginx. `ci/e2e-server.sh` indeed names
the `server` service explicitly so Compose brings up only it and its `depends_on`. But the
`test` job in `.github/workflows/ci-build-deploy.yml` has a step named "Start Postgres and
Redis" that runs `docker compose --env-file ./ci/.env.test -f server/docker-compose.yml up -d`
with **no service list**, and `docker compose --env-file ./ci/.env.test -f
server/docker-compose.yml config --services` resolves `nginx`, `postgres`, `redis`. That step
starts nginx today. It stays green because the tracked (expired) files exist, nothing in the
job talks to nginx, and `up -d` without `--wait` exits 0 regardless of what the container does
afterwards. Untracking the pair without touching that step would replace a container serving an
expired certificate with a container crash-looping on a missing file — still green, still
silent. Decision 5 closes it.

`generate-certificates.sh` is also CWD-dependent: it passes bare `key.pem`, `cert.pem`, and
`-config ssl.cnf`, so it only behaves when invoked from inside `ci/certificates`. That is part
of why it was never automated.

## Goals / Non-Goals

**Goals:**

- No expired certificate, and no private key, tracked in the repository.
- A fresh checkout that follows the documented order — `bin/server-compose.sh up -d`, then
  `bin/setup-dev.sh` — gets a working, trusted TLS dev env with no extra step.
- The mechanism keeps working without anyone remembering it: provisioning is idempotent and
  runs from the commands people already run.
- Re-running it does not churn the certificate, because rotating it silently invalidates every
  place a developer has trusted it.
- Exactly one document owns the mechanism.
- CI stops touching the certificate at all.

**Non-Goals:**

- Changing `server/nginx.conf`, the vhosts, the ports, or the Compose mount path.
- Changing the `ci/e2e-server.sh` lifecycle or `server/docker-compose.e2e.yml`.
- Anything about production TLS, `k8s/`, or `terraform/`.
- Changing the documented dev URLs, `web/.env.local.sample`, or `mobile/src/api/config.ts`.
- Introducing a real CA, `mkcert`, or any new tool dependency. `openssl` is already required by
  the existing script and present in every supported dev environment.

## Decisions

## Decision 1 — Untrack the pair rather than re-commit a longer-dated one

`git rm --cached ci/certificates/cert.pem ci/certificates/key.pem`, and ignore both paths in
the root `.gitignore` next to the existing `ci/keys/` entry. `ssl.cnf` and both scripts stay
tracked, so the *recipe* is reviewable and the *material* is local.

Alternative: regenerate and re-commit with a longer `-days`. Rejected. It is the same defect
with a later date — the mode that produced this ticket — and it keeps a private key in a public
repository for no benefit. The key is worthless, but "worthless" is a judgement a reader has to
make, and it makes `credential-material` a permanent match on the default branch.

Alternative: keep the pair tracked and add a CI check that fails when it nears expiry.
Rejected. It converts a silent breakage into a recurring chore on the whole team, and still
leaves the key committed.

Consequence, accepted deliberately: each checkout mounts its own `ci/certificates`, so every
worktree generates its own pair. A certificate trusted in a simulator, keychain, or browser
store is now per-checkout. This is the real cost of the change and is documented where the
trust step is documented, not hidden.

Alternative considered and deferred: generate once per machine into a shared location (for
example under `git rev-parse --git-common-dir`) and mount that from Compose, so worktrees share
one trusted certificate. That requires changing the Compose mount path, which this change puts
out of scope, and it trades a per-worktree cost for a cross-worktree coupling. Worth revisiting
only if per-worktree trust proves annoying in practice.

## Decision 2 — Two entry points: an unconditional generator and an idempotent guard

`ci/certificates/generate-certificates.sh` becomes location-independent: it resolves its own
directory, reads `ssl.cnf` from it, writes `key.pem`/`cert.pem` into it, `chmod 600`s the key,
and always regenerates. Lifetime comes from `TIMECALENDAR_CERT_DAYS` (default `3650`). This is
the "rotate now" affordance a human reaches for.

`ci/certificates/ensure-certificates.sh` is the guard, and it is the deliverable. It regenerates
only when `cert.pem` or `key.pem` is missing or unreadable, or when
`openssl x509 -in cert.pem -noout -checkend "$TIMECALENDAR_CERT_RENEW_SECONDS"` fails (default
`2592000`, thirty days). Otherwise it does nothing. It prints exactly `generated` or `unchanged`
on stdout so a caller can react, and puts anything human-readable on stderr.

Alternative: one script with a `--force`/`--if-needed` flag. Rejected. The two contracts differ
in a way that matters: the guard is safe to call on every command, while the generator destroys
every existing trust decision. Collapsing them makes the safe behavior the opt-in and the
destructive behavior the default, so a caller that forgets the flag silently rotates the
certificate on every stack start — precisely the failure Decision 4 exists to avoid. Separate
names make the destructive path something you have to type.

Alternative: have the guard compare `notAfter` itself with `date`. Rejected. `openssl x509
-checkend` is the purpose-built predicate, it is already a dependency, and it avoids a
date-arithmetic difference between GNU and BSD `date`.

## Decision 3 — Hook the guard into `bin/server-compose.sh`, immediately before `exec`

The certificate must exist before anything can start nginx, and `README.md` and the handbook
both tell contributors to bring the stack up *before* running `bin/setup-dev.sh`. Hooking only
into `setup-dev.sh` would leave the very first `bin/server-compose.sh up -d` crash-looping nginx
on a missing file — the state this change is supposed to make impossible.

The guard runs after the `project-name` subcommand's early exit and immediately before
`exec docker compose`. `project-name` is documented as a pure diagnostic and is what
`bin/setup-dev.sh --compose-config` calls, so it must stay non-mutating; it does.

This means the guard also runs for `config`, `ps`, `down`, and every other pass-through
subcommand. That is accepted. When the pair is valid the guard is one `openssl x509 -checkend`
invocation and no write, and the capability's static-isolation verification requirement forbids
altering Docker resources — writing a local file when material is missing is neither a
lifecycle command nor a Docker resource mutation.

Alternative: inspect the Compose subcommand and provision only for `up`, `start`, `create`, and
`run`. Rejected. Compose accepts global flags before the subcommand, so the parse is fragile,
and the cost of getting it wrong is exactly the crash-looping nginx the wrapper exists to
prevent. A no-op check on the other subcommands is much cheaper than that risk.

Alternative: a Compose `depends_on` init service that generates the pair. Rejected. It would put
a new service in a Compose file that CI and the E2E overlay also load, spreading the concern
into paths that must not touch certificates at all.

## Decision 4 — A long lifetime plus a narrow renewal window, so regeneration is rare

`3650` days for the certificate, a thirty-day renewal window for the guard.

Apple exempts user-added roots from the 398-day server-certificate limit, and Chrome's
maximum-lifetime enforcement applies to certificates that chain to its own root store — neither
applies to a self-signed certificate a developer explicitly trusts. So there is no reason to
choose a short lifetime, and a short one would mean regenerating regularly, which breaks
simulator and keychain trust every time.

Durability comes from the guard, not the number: with the guard in place, whatever lifetime is
chosen, the pair is renewed before it expires. The long lifetime just makes that path
effectively never run, which is what keeps trust stable. Both values are overridable by
environment variable so the behavior is testable without editing a script.

## Decision 5 — Name the services CI actually wants, so no CI path starts nginx

Change the `test` job's step to `docker compose --env-file ./ci/.env.test -f
server/docker-compose.yml up -d postgres redis`. The step is already named "Start Postgres and
Redis"; this makes the command say the same thing.

Without it, untracking the pair changes CI behavior: nginx would start with no certificate file
and restart forever under `restart: always` while the step still exits 0. Nothing in the job
uses nginx — the tests run with `--network host` against the published Postgres and Redis ports
— so removing it costs nothing and removes a container from the runner.

This mirrors what `ci/e2e-server.sh` already does, and for the identical stated reason: its
comment says it names `server` explicitly so Compose does not bring up nginx, "which e2e doesn't
need (it binds 1443 and needs certs)".

`.github/workflows/` is a sensitive surface. The edit adds two service names to one existing
command; it changes no trigger, job, dependency, image tag, or deploy step.

## Decision 6 — Make `bin/setup-dev.sh` provision, and stop it misreporting a certificate fault

Two changes, both narrow:

1. Run the guard before step 3, so a standalone `bin/setup-dev.sh` on a checkout that has never
   started the stack still has material to trust and to verify against. When the guard reports
   `generated`, print that the certificate was just created, that nginx keeps serving the
   previous material until restarted (`bin/server-compose.sh restart nginx`), and that any
   previously trusted copy must be re-added.
2. In step 4, when the reachability check fails, distinguish a TLS verification failure from a
   connection failure. `http_status` collapses every curl failure to `000`, and step 4's message
   then blames "DNS, nginx, or cert" — which is how a certificate fault reads as a stopped
   Docker stack. Re-run the request capturing curl's exit status and, on the certificate
   verification codes, say that the certificate is the problem and name the restart.

This keeps `--http-status` and `--compose-config` behaving exactly as before, so the
diagnosability requirement's non-mutating guarantee is preserved.

## Decision 7 — One document owns the mechanism: `docs/agent-dev-environment.md`

The handbook's §4 already owns dev-environment setup and is the file `README.md` and the
`bin/setup-dev.sh` header defer to elsewhere. It gains the mechanism: what provisions the pair,
when the guard regenerates, the two environment variables, the per-worktree consequence, and how
to rotate deliberately. `README.md` and the `bin/setup-dev.sh` header comment gain a pointer,
not a restatement. `app/README.md` and `mobile/README.md` keep their unchanged dev URLs and gain
no certificate prose.

No ADR: this is dev tooling, reversible in a commit, and not an architectural rule. No
Architecture Book change either — the Book governs `mobile/`, and nothing under `mobile/` moves.

## Risks / Trade-offs

- **Per-worktree certificates.** Trusting the certificate is now a per-checkout act. Mitigated
  by documenting it at the trust step and by the deferred shared-location alternative in
  Decision 1.
- **A pulled checkout loses its certificate.** Removing the files from the index deletes them
  from an existing working tree on the next pull. The next `bin/server-compose.sh` invocation
  regenerates, so the recovery is automatic — but a developer who has a running stack must
  restart nginx and re-trust. Mitigated by the `generated` notice from Decision 6.
- **nginx serves stale material after regeneration.** nginx reads the certificate at start.
  Mitigated by Decision 6's explicit restart hint rather than by adding a reload mechanism.
- **`openssl` must be on `PATH`.** It already is: the existing generator and the whole dev
  flow assume it. The guard fails with a clear message rather than a cryptic openssl error.
- **The CI step change touches a sensitive workflow.** Mitigated by keeping it to a service
  list on one existing command, and by an explicit review task.

## Migration Notes

No data, schema, or contract migration. For a developer with an existing checkout: pull, then
run `bin/server-compose.sh up -d` (which regenerates the pair) and `bin/setup-dev.sh` (which
re-trusts it on macOS). Their old certificate was already expired, so nothing usable is lost.
