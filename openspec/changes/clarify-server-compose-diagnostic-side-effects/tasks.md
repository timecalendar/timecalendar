## 1. Correct the server Compose specification

- [x] 1.1 Apply the delta to
  `openspec/specs/server-compose-development-environment/spec.md`: define diagnostics as
  non-mutating with respect to Docker resources, explicitly permit checkout-local TLS provisioning
  before Compose-backed inspection, and retain all existing project/port, certificate-fault, nginx
  state, daemon-unavailable, and remaining-diagnostics guarantees. Verify the archived result keeps
  every pre-existing scenario plus the new boundary wording.
- [x] 1.2 Keep the pure-mode exception exact: the selected project-name diagnostic and setup
  configuration-only output write no file, generate no certificate, and contact no service. Do not
  generalize this exception to a Compose-subcommand allowlist.

## 2. Align the developer handbook

- [x] 2.1 Update `docs/agent-dev-environment.md` §4 so its troubleshooting commands use the same
  boundary as the spec: `project-name` and `--compose-config` are file- and service-pure; a
  Compose-backed diagnostic such as `config` or the setup script's nginx `ps` query may provision or
  renew `ci/certificates/cert.pem` and `key.pem`, but changes no Docker resource. Keep the files
  described as checkout-local, ignored, and untracked.
- [x] 2.2 Preserve the first-use guard, renewal window, lifetime override, explicit-rotation, nginx
  restart, and re-trust guidance. Verify the handbook does not imply that `config`/`ps` bypasses the
  guard or that generated TLS material is committed.

## 3. Pin the contract in the existing verifier

- [x] 3.1 Extend `bin/verify-server-compose.mjs` with focused static assertions over
  `bin/server-compose.sh`, the canonical capability spec, and the handbook. Pin the three-part rule:
  no Docker-resource mutation, permitted checkout-local TLS provisioning on Compose-backed
  diagnostics, and the two named pure modes. Match concepts within their relevant sections rather
  than whole documents or line numbers.
- [x] 3.2 Assert the wrapper's established order remains `project-name` early exit → certificate
  guard → `exec docker compose`, without reading certificate contents or changing wrapper code.
  Keep every Compose invocation in the verifier at `config`; add no lifecycle or daemon-mutating
  verb.
- [x] 3.3 Prove the assertions bite by saving the relevant contract file to run-owned scratch,
  temporarily changing one pinned phrase in the worktree, observing the focused assertion fail,
  restoring the exact saved file, and observing the verifier pass. Confirm `git diff` after restore
  contains only the intended implementation. Do not remove, move, overwrite, or force-renew the
  checkout's TLS pair for this proof.

## 4. Local-green and non-mutation proof

- [x] 4.1 Run `node bin/verify-server-compose.mjs` and record its pass. Before and after, capture
  sorted read-only inventories from `docker ps -aq`, `docker network ls -q`, `docker volume ls -q`,
  and `docker image ls -q`; compare them byte-for-byte to prove verification created, started,
  stopped, restarted, removed, or otherwise changed no Docker resource. Do not run `up`, `down`,
  `start`, `stop`, `restart`, `rm`, `prune`, or cleanup.
- [x] 4.2 Run `git check-ignore -v ci/certificates/cert.pem ci/certificates/key.pem` and
  `git ls-files ci/certificates` to prove both generated paths remain ignored and untracked while
  the configuration and scripts remain tracked. Do not stage or inspect either generated file.
- [x] 4.3 Run `openspec validate clarify-server-compose-diagnostic-side-effects --strict` and
  `git diff --check`.

## 5. Architecture Book, scope, and sensitive-surface audit

- [x] 5.1 Re-read `docs/mobile/architecture-book/architecture.md` and `testing.md`. Record the
  Architecture Book update as N/A because this change alters no mobile architecture, test command,
  or dependency-only server prerequisite; if the implementation reveals a contradiction, update
  `testing.md` and the Book's current-state record before proceeding rather than leaving drift.
- [x] 5.2 Review the final path diff. Outside `openspec/`, only
  `docs/agent-dev-environment.md` and `bin/verify-server-compose.mjs` may change. Confirm no edit to
  `bin/server-compose.sh`, `bin/setup-dev.sh`, `ci/certificates/`, `.gitignore`, Compose files,
  workflows, API/generated clients, migrations, mobile/native/store config, deployment
  infrastructure, or legacy Flutter code.
- [x] 5.3 Run the repository disclosure preflight over the whole branch and the exact PR text. Any
  added finding is a hard stop. Report pre-existing-only findings by count and safe pattern id, and
  confirm no generated certificate, private key, credential material, or TLS file is tracked or
  present in the diff.

## 6. Archive rehearsal and exact-head CI proof

- [x] 6.1 Rehearse `openspec archive clarify-server-compose-diagnostic-side-effects -y` in a fresh
  run-owned scratch copy, then run `openspec validate --specs --strict` there. Confirm the delta
  modifies exactly the two existing requirements and preserves their complete scenario sets; do not
  archive the live branch.
- [ ] 6.2 Push the completed implementation head and confirm the standard `CI build & deploy` run's
  `head_sha` equals the PR head and every required job, including `Run tests`, is green. State
  accurately that `bin/verify-server-compose.mjs` remains a manual contract harness and cite the
  local non-mutation proof as its direct evidence; do not claim CI executes it.
