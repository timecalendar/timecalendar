## 1. Make the generator usable from anywhere

- [ ] 1.1 Rewrite `ci/certificates/generate-certificates.sh` to resolve its own directory
  (`cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P`) and use absolute paths for `-config
  ssl.cnf`, `-keyout key.pem`, and `-out cert.pem`; add `set -euo pipefail`, take the lifetime
  from `TIMECALENDAR_CERT_DAYS` (default `3650`), and `chmod 600` the key. Keep `ssl.cnf`
  unchanged and keep the existing macOS keychain hint in the header comment.
  - Verify: run it from the repository root and from `/tmp`; both write into
    `ci/certificates/` and `openssl x509 -in ci/certificates/cert.pem -noout -subject -dates`
    shows `CN = TimeCalendar Dev` with a ~10-year window.

- [ ] 1.2 Add `ci/certificates/ensure-certificates.sh` — the idempotent guard. Regenerate by
  delegating to `generate-certificates.sh` when `cert.pem` or `key.pem` is missing or
  unreadable, or when `openssl x509 -in cert.pem -noout -checkend
  "${TIMECALENDAR_CERT_RENEW_SECONDS:-2592000}"` fails; otherwise do nothing. Print exactly
  `generated` or `unchanged` on stdout, keep human-readable notes on stderr, and fail with a
  clear message when `openssl` is not on `PATH`. Make both scripts executable.
  - Verify: with no `.pem` present it prints `generated`; a second run prints `unchanged`;
    `TIMECALENDAR_CERT_RENEW_SECONDS=999999999 ./ci/certificates/ensure-certificates.sh` prints
    `generated`. Confirm `git update-index --refresh` style byte-stability by comparing
    `sha256sum` of both files before and after an `unchanged` run.

## 2. Wire provisioning into the commands people already run

- [ ] 2.1 In `bin/server-compose.sh`, run `"$repo_root/ci/certificates/ensure-certificates.sh"`
  immediately before `exec docker compose`, discarding its stdout marker. It must run *after*
  the `project-name` early exit so that subcommand stays a pure, non-mutating diagnostic.
  - Verify: `bin/server-compose.sh project-name` writes no file (check with `git status` and
    `ls ci/certificates` from a state with no `.pem`); `bin/server-compose.sh config >/dev/null`
    materializes the pair.

- [ ] 2.2 In `bin/setup-dev.sh`, run the guard before step 3, capturing its stdout. When it
  reports `generated`, print a yellow notice that the certificate was just created, that nginx
  serves the previous material until restarted (`bin/server-compose.sh restart nginx`), and that
  any previously trusted copy must be re-added. Leave `--http-status` and `--compose-config`
  behavior untouched.
  - Verify: `bin/setup-dev.sh --compose-config` still prints only the project/port diagnostics
    and creates no `.pem`; a full run from a no-`.pem` state emits the notice once.

- [ ] 2.3 In `bin/setup-dev.sh` step 4, when the reachability check returns `000`, re-run the
  request capturing curl's exit status and, on a certificate verification failure (curl `60`,
  and `35`/`51` where applicable), report the certificate as the cause and name the nginx
  restart and re-trust steps instead of the current "DNS, nginx, or cert" message. Keep the
  existing message for a genuine connection failure.
  - Verify: stop nginx → the connection-failure message; start nginx, regenerate the pair
    without restarting nginx → the certificate-fault message.

- [ ] 2.4 Update the `bin/setup-dev.sh` header comment so its numbered list matches the script's
  actual steps and points at `docs/agent-dev-environment.md` for the certificate mechanism
  rather than restating it.

## 3. Untrack the pair

- [ ] 3.1 Add `ci/certificates/cert.pem` and `ci/certificates/key.pem` to the root `.gitignore`
  beside the existing `ci/keys/` entry, then
  `git rm --cached ci/certificates/cert.pem ci/certificates/key.pem`. Keep `ssl.cnf` and both
  scripts tracked. Do not delete the working-tree files.
  - Verify: `git ls-files ci/certificates` lists only `ssl.cnf`,
    `generate-certificates.sh`, and `ensure-certificates.sh`; `git status --short` shows the two
    deletions staged and no untracked `.pem`; `git check-ignore -v ci/certificates/key.pem`
    reports the new rule.

## 4. Stop CI from starting nginx

- [ ] 4.1 In `.github/workflows/ci-build-deploy.yml`, change the `test` job's "Start Postgres and
  Redis" step to `docker compose --env-file ./ci/.env.test -f server/docker-compose.yml up -d
  postgres redis`. Change nothing else in the workflow — no trigger, job, image tag, deploy step,
  or other command.
  - Verify: `docker compose --env-file ./ci/.env.test -f server/docker-compose.yml config
    --services` still lists all three services (the model is unchanged), and the diff for this
    file is exactly the two added service names.

- [ ] 4.2 Confirm no other CI or scripted path starts nginx or reads the pair:
  `grep -rn "certificates\|nginx\|1443" .github/workflows/ ci/` and re-read
  `ci/e2e-server.sh`'s compose invocations and `server/docker-compose.e2e.yml`. Leave both
  unchanged; record the grep result in the PR body.

- [ ] 4.3 Review the sensitive-surface diff: `git diff -- .github/workflows/ ci/certificates/`.
  Confirm no certificate or key bytes appear in any added line, no secret is introduced, and
  `server/docker-compose.yml` and `server/nginx.conf` are untouched.

## 5. Document the mechanism in exactly one place

- [ ] 5.1 In `docs/agent-dev-environment.md` §4, add the mechanism next to the existing
  `bin/server-compose.sh`/`bin/setup-dev.sh` guidance: the pair is generated on demand and not
  tracked, `bin/server-compose.sh` provisions it before every Compose command, the guard is a
  no-op until the renewal window, `TIMECALENDAR_CERT_DAYS` and `TIMECALENDAR_CERT_RENEW_SECONDS`
  override the lifetime and window, `ci/certificates/generate-certificates.sh` forces a rotation,
  and **each checkout has its own pair** — after switching worktrees, re-run `bin/setup-dev.sh`
  so the simulator/OS/browser trusts the right certificate. Update the `ci/` line in the §3
  repository-layout block and the §12 quick reference if either becomes inaccurate.

- [ ] 5.2 In `README.md`, add one sentence to the Docker section saying the dev TLS certificate
  is generated on first use and is not committed, linking to the handbook section. Do not restate
  the mechanism. `app/README.md` and `mobile/README.md` keep their existing URLs and get no
  certificate prose — confirm neither claims the certificate is committed.

- [ ] 5.3 Grep the **whole** of every document touched (not only the changed hunks) for
  disclosure-pattern categories before committing — `docs/agent-dev-environment.md` in particular
  already carries identity and host content, and the scan reads every line of every file the
  branch touches, not only the added ones. A hit on a line you did not add still fails the gate,
  so read the report's per-finding split and scrub what this change introduces.

- [ ] 5.4 Confirm no Architecture Book change is required: `grep -rn "certificat" docs/mobile/`
  should find nothing that this change contradicts. Nothing under `mobile/` moves, so no Book
  file and no changelog entry are in scope. Record the result rather than inventing an entry.

## 6. Local-green verification — run it, do not assert it

Docker (Engine 27.2.0, Compose v2.29.2), `openssl` 3.0.13, and passwordless `sudo` are available
on this host. `bin/setup-dev.sh` step 1 writes `/etc/hosts` via sudo, and step 3 is macOS-only —
on Linux it skips by design. Say both explicitly in the PR body rather than leaving a reviewer to
wonder why step 3 is a yellow line.

- [ ] 6.1 From a clean state (`rm -f ci/certificates/*.pem`), run `bin/server-compose.sh up -d`.
  Confirm `bin/server-compose.sh ps` shows nginx `running` (not restarting) and
  `bin/server-compose.sh logs nginx` contains no certificate error. Paste the real output.

- [ ] 6.2 Prove the certificate actually verifies through nginx:
  `curl -sv --cacert ci/certificates/cert.pem --resolve api.timecalendar.host:1443:127.0.0.1
  https://api.timecalendar.host:1443/`. A `502` is a pass for this check — the backend is not
  running; what is being proven is that the TLS handshake verified. Paste the verification lines.

- [ ] 6.3 Run `bash bin/setup-dev.sh` and confirm step 4 reports the API responded (any non-`000`
  status) rather than the failure message. Note in the PR body that step 3 skipped as
  not-macOS and that step 1 used sudo.

- [ ] 6.4 Assert the acceptance criteria directly and paste the output:
  `git ls-files ci/certificates`;
  `openssl x509 -in ci/certificates/cert.pem -noout -checkend $((365*24*3600))` (must exit 0);
  two consecutive `ci/certificates/ensure-certificates.sh` runs printing `generated` then
  `unchanged` with identical `sha256sum` for both files across the second run.

- [ ] 6.5 Tear down: `bin/server-compose.sh down`. Confirm `git status --short` shows only the
  intended changes and no `.pem` is tracked or untracked-and-visible.

- [ ] 6.6 Run `npx openspec validate provision-dev-tls-certificate --strict` and, before merge,
  dry-run the archive so the delta headers are actually validated — `openspec archive` is the
  only command that checks `## ADDED`/`## MODIFIED` headers against the existing capability.
  Do not archive on the branch; just prove it would pass.

- [ ] 6.7 Run `bash -n` (or `shellcheck` where available) over
  `ci/certificates/generate-certificates.sh`, `ci/certificates/ensure-certificates.sh`,
  `bin/server-compose.sh`, and `bin/setup-dev.sh`.

## 7. CI proof on the pushed head

- [ ] 7.1 After pushing, confirm the `CI build & deploy` `test` job is green on the exact PR head
  and that the "Start Postgres and Redis" step runs with the explicit service list. This is the
  proof that untracking the pair did not break the one CI path that loaded
  `server/docker-compose.yml`.

- [ ] 7.2 Confirm the PR body states, without pasting any certificate or key bytes, what the
  deleted key was (a self-signed dev-only key for `*.timecalendar.host` names resolving to
  `127.0.0.1` via `/etc/hosts`, used by no CI path and unrelated to production TLS) and why
  removing it is safe. Run the `disclosure-scan` preflight on the final title and body before
  every `gh pr create`/`gh pr edit`/`gh pr comment`.

- [ ] 7.3 Run the `disclosure-scan` preflight once more on the finished branch with no text
  payload, so it reads the diff itself, and confirm the report shows `added: 0`. The two `.pem`
  paths must appear nowhere in `findings` — a deleted file is not scanned, so a finding on either
  path means the deletion did not actually land in the index. This is the check that proves the
  committed key is gone, and it is stronger than reading `git ls-files` alone.
