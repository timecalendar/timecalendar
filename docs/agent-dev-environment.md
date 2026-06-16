# TimeCalendar — Agent & Dev-Environment Handbook

> **Purpose.** This document captures *exactly* how the current autonomous agent
> (Claude Code, orchestrated by the [Paperclip](#9-paperclip-control-plane-agent-management)
> control plane) develops TimeCalendar on this server: the repo layout, how the
> dev environment is set up and run, git worktree management, the end-to-end test
> harnesses, how changes are committed, and the **plan → apply → simplify → review**
> pipeline that builds features automatically.
>
> It is written so a **future agentic system on a different server** can pick the
> work up cold — replicate the environment, understand the conventions, and keep
> shipping without losing the quality bar.
>
> Everything below was verified against the repository state on **2026-06-14**.
> Where a fact lives in a script or rule file, the path is given so you can re-read
> the source of truth rather than trust this snapshot.

---

## 1. What TimeCalendar is, and the migration in flight

TimeCalendar is a calendar app for students (French university schedules). It has
four code surfaces in one monorepo:

| Path | Stack | Role |
| --- | --- | --- |
| `app/` | **Flutter** (Dart) | The **legacy** mobile app, currently in the stores. Under R-5 *bounded maintenance only* — security/critical fixes. |
| `mobile/` | **React Native + Expo SDK 56** (TypeScript) | The **new** mobile app actively being built to replace `app/`. This is where most feature work happens. |
| `server/` | **NestJS** (TypeScript) + Postgres + Redis | The backend API. Serves both mobile clients on `:3005`. |
| `web/` | **Next.js** (TypeScript) | The marketing/web surface. |
| `openapi/` | OpenAPI spec + generated JS client | `openapi/openapi.json` is the **single committed server↔client contract**. |

**The strategic context:** the project was unmaintained for ~2 years and is being
taken over. The active program is a **Flutter → React Native migration** plus
dependency/maintenance work. The new `mobile/` app is built feature-by-feature
through a rigorous, documented process — that process is the main subject of this
handbook.

### Governing documents (read these to understand *why*, not just *how*)

- **`docs/mobile/architecture-book/`** — **the Architecture Book**: the living set of rules
  driving `mobile/` development. `architecture.md` is the spine; `decisions/` holds
  ADRs; `definition-of-done.md` is the per-feature quality gate; `architecture-changelog.md`
  is the append-only rule-change log; `golden-path.md` is the (deliberately empty)
  exemplar placeholder. **These are loaded into the agent's context every session**
  and are binding.
- **`docs/react-native-migration/`** — the migration program: `00-exploration/migration-approach.md`
  (the governing philosophy: vertical slices, finite-perfection DoD, working rules
  R-1…R-6), `01-roadmap/` (phased step list), `02-foundation-review/`, and `inbox/`
  (handoff notes for irreducibly-human steps — Apple/Google credentials, device
  installs, console registration, manual screen-reader passes).
- **`openspec/`** — the spec-driven change system (see §8).
- **`README.md`** — the human-facing dev-env quickstart (this handbook is the
  agent-facing superset).

---

## 2. Server / host toolchain

This is what must exist on the machine for the dev env and the pipelines to run.

| Tool | Version / location | Notes |
| --- | --- | --- |
| **Node.js** | `24.13.0` (pinned in `.nvmrc`) | npm workspaces at the root (`web`, `openapi/javascript`); `server/` and `mobile/` are **standalone** npm projects with their own lockfiles. |
| **Docker** | required | Runs the dev-env services and is the lifecycle manager for the E2E server stack. |
| **Flutter SDK** | `3.41.9` stable, installed at **`/home/dev/flutter`** (NOT on `PATH`) | Invoke as `/home/dev/flutter/bin/flutter`. Only needed for `app/` (legacy) work and the Flutter E2E harness. |
| **JDK** | **JDK 21** available (`/usr/lib/jvm/java-21-openjdk-amd64`); native Android mobile builds historically needed **JDK 17** + `ANDROID_HOME` exported | `ANDROID_HOME` is **unset by default** — export it (and the right `JAVA_HOME`) before `expo run:android`/Gradle. Pure `mobile/` CI checks (tsc/lint/jest) do **not** need the native toolchain. |
| **Maestro** | on `PATH` for mobile E2E | Install: `curl -fsSL https://get.maestro.mobile.dev \| bash`. JVM-based, needs a JDK. |
| **gh CLI** | authenticated as **`samuelprak`** (admin/push) | Git protocol is **SSH**; the remote is `git@gh-perso:timecalendar/timecalendar.git` (a host alias in `~/.ssh/config`). A second account `vincefox1` is also logged in — ensure `samuelprak` is the *active* one (`gh auth switch`). |
| **Git identity** | `Samuel Prak <samuel.prak.p@gmail.com>` | |

### The dev host has **no KVM / nested virtualization**

It is a Hetzner Cloud VPS. Android emulators cannot hardware-accelerate here, so
**native mobile E2E (emulator/simulator) does not run locally on this box** — it
runs in CI (`ci-mobile-e2e.yml`). Local verification on this host is limited to
the non-device checks (tsc/lint/jest, server tests, the server half of E2E). Plan
device-dependent verification for CI or a machine with virtualization.

---

## 3. Repository layout (top level)

```
app/        Flutter legacy app (bounded maintenance)
mobile/     React Native + Expo app (active feature work)
server/     NestJS backend (Postgres + Redis)
web/        Next.js web surface
openapi/    openapi.json contract + generated JS client (npm workspace)
openspec/   spec-driven change artifacts (changes/, specs/, archive/)
ci/         e2e-server.sh (shared E2E server lifecycle) + certificates/
bin/        setup-dev.sh, setup-worktree.sh, flutter-analyze.sh
docs/        this handbook, react-native-migration/, multi-calendars.md
k8s/, terraform/   deployment infra
.claude/     agent config: rules/ (Architecture Book), agents/, commands/, skills/, settings.json
.github/workflows/  CI pipelines
.husky/      git hooks (pre-commit)
```

---

## 4. Dev-environment setup (from a clean main checkout)

The canonical quickstart is `README.md`; the agent-relevant essentials:

1. **Start the backing services** (Postgres, Redis, nginx TLS proxy) — compose
   file lives in `server/`:
   ```bash
   cd server && docker compose up -d
   ```
   - Postgres is published on host port **37291** (→ container 5432), Redis on
     **37292**, and an nginx TLS proxy on **1443** terminating
     `https://api.timecalendar.host:1443` using `ci/certificates/`.
2. **Install dependencies** (root workspaces):
   ```bash
   npm install        # root: web + openapi/javascript
   ```
   `server/` and `mobile/` install separately (`cd server && npm ci`, `cd mobile && npm ci`).
3. **Server env:** copy `server/.env.sample` → `server/.env`; in dev most values
   default sensibly, so `NODE_ENV=development` is usually enough.
4. **Migrations do NOT auto-run in dev** (`RUN_MIGRATIONS=false`). After the stack
   is up, from `server/`:
   ```bash
   npm run db:migrate     # apply migrations
   npm run db:seed        # load fixtures (schools, school groups)
   npm run db:init        # drop + migrate + reseed from scratch
   ```
   The dev DB starts empty — the schools list is empty until seeded.
5. **Start the API server** (from `server/`): `npm run dev` → NestJS on **:3005**.

### `bin/setup-dev.sh` — machine-global app wiring (idempotent)

Run once per machine (not per worktree). It checks/fixes the four things that
otherwise all surface as the same opaque "Network Error" when the app talks to the
local HTTPS dev env:

1. `/etc/hosts` maps `*.timecalendar.host` → `127.0.0.1` (adds the line via sudo if
   missing),
2. `web/.env.local` exists (creates it from the sample),
3. the self-signed dev cert (`ci/certificates/cert.pem`) is trusted in the booted
   iOS Simulator (macOS only),
4. the API is reachable through nginx with a valid cert, and the backend answers on
   `:3005`.

### Firebase

The server reads `server/config/serviceAccountKey.json` at import time and **cannot
boot without it**. For real dev you supply a Firebase service-account key (see
`README.md`). For E2E the harness mints a **throwaway dummy RSA key** automatically
(`scripts/generate-dummy-firebase-key.sh`) — nothing in the E2E path calls Firebase.
**Never commit real Firebase keys or certs** (GitHub Push Protection also blocks them).

---

## 5. Git worktree management

Feature work is done in **git worktrees**, one per Paperclip issue, kept as siblings
under `/home/dev/projects/perso/timecalendar-worktrees/`. The autonomous dev-cycle
squad also has long-lived per-agent worktrees (`planner`, `applier`, `simplifier`,
`reviewer`, `foundingengineer`). Example live layout:

```
/home/dev/projects/perso/timecalendar                  [main]   ← main checkout
/home/dev/projects/perso/timecalendar-worktrees/
  ├── foundingengineer   [agent/foundingengineer]
  ├── planner            [agent/planner]
  ├── reviewer           [agent/reviewer]
  ├── simplifier         [agent/simplifier]
  └── tim-134            [TIM-134-mobile-school-selection]   ← per-issue
```

### The worktree gotcha and the fix

A `git worktree` checks out only **tracked** files. Everything gitignored-but-required
is therefore **missing** in a fresh worktree, and commits **silently abort** because
the husky pre-commit hook can't find its helper. The missing set:

- env files: `server/.env`, `web/.env.local`, `mobile/.env`, `mobile/.env.local`
- the Firebase key `server/config/serviceAccountKey.json`
- `mobile/expo-env.d.ts` (Expo-generated; `tsc` fails without it)
- the generated husky hooks (`.husky/_/`)
- all `node_modules`

**Always run this once per new worktree** (idempotent; no-op in main):

```bash
npm run setup:worktree     # → bin/setup-worktree.sh
```

It (1) resolves the main checkout, (2) **symlinks** the branch-independent secrets
from main (single source of truth), and (3) runs `npm ci` (falling back to
`npm install`) in root + `server/` + `mobile/`, then `npx husky install` to restore
the pre-commit hook. Machine-global setup (`/etc/hosts`, cert trust from
`setup-dev.sh`) is shared across worktrees and does **not** need re-running.

> When dispatching pipeline sub-agents in `isolation: "worktree"`, the fresh
> worktree needs `npm run setup:worktree` before any build/test/commit. If a squad
> agent stalls with an `ENOENT mkdir` it usually means its worktree vanished — the
> recovery is to re-run the worktree sync/setup.

---

## 6. How changes are committed

- **Conventional commits** (`feat(mobile): …`, `fix(server): …`, `chore(openspec): …`,
  `refactor(mobile): …`, `docs: …`, `perf(server): …`). Subject names the scope and,
  where relevant, the Paperclip issue id and roadmap step, e.g.
  `feat(mobile): personal-events CRUD UI … (TIM-133, B2)`.
- **Mandatory commit footer.** Two footers are in use, by role:
  - **The Paperclip founding-engineer agent** ends every commit with:
    `Co-Authored-By: Paperclip <noreply@paperclip.ing>`
  - **The dev-cycle squad sub-agents** (implementer/simplifier) end commits with:
    `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  A future system should standardize on one footer; the point is that **every
  commit carries an attributable co-author footer**.
- **Pre-commit hook** (`.husky/`, via root `prepare`/`husky install`): `lint-staged`
  runs `dart format` + `bin/flutter-analyze.sh` on staged `*.dart` (the `app/`
  surface) and `eslint --cache --fix` on staged `mobile/` sources. Do **not** bypass
  hooks/signing/CI unless a task explicitly requires it and the reason is in the
  commit message.
- **Logical commits.** Decompose work into reviewable commits as you go, on a
  feature branch, not on `main` (except the explicit "commit docs to main" kind of
  task like this one).
- **Secrets.** Never commit secrets, credentials, customer data, Firebase keys, or
  certs. If one appears in a diff, stop and escalate.

---

## 7. End-to-end & test harnesses

> **On "Playwright".** The migration ticket referred to Playwright, but the
> repository does **not** use Playwright for its automated E2E — it appears only as
> a transitive entry in `package-lock.json`. The Playwright **MCP server** is wired
> into the agent runtime for ad-hoc **browser-driven verification** (the `verify`
> skill can drive a real browser via `mcp__playwright__browser_*` tools), useful for
> checking the `web/` surface or rendered pages. The project's **automated E2E
> smoke tests** are **Maestro** (for `mobile/`) and **Flutter `integration_test`**
> (for `app/`). Both stand up the **real NestJS backend** — nothing mocked end to
> end. A future system should treat Maestro + Flutter integration tests as the
> smoke-test gate, and Playwright/MCP as an interactive verification aid.

### Shared server lifecycle — `ci/e2e-server.sh`

Every E2E harness in the repo boots the backend through this one script, so server
boot/seed/teardown is single-sourced. Docker owns the lifecycle:

```bash
ci/e2e-server.sh up   [--native]   # boot + seed a healthy stack on :3005
ci/e2e-server.sh down [--native]   # stop and remove everything it started
ci/e2e-server.sh logs [--native]
```

- **compose mode (default):** `docker compose up --wait` brings up Postgres, Redis,
  and the server (built from source unless `E2E_SERVER_IMAGE` points at a prebuilt
  image, as CI does); then a one-shot seed `db:init` into the isolated
  **`timecalendar_test`** database; mints the dummy Firebase key first.
- **`--native` mode:** for Docker-less hosts (e.g. GitHub macOS runners) — the
  caller provisions Postgres/Redis, the script seeds, mints the key, boots the
  server as a pid-tracked process, and waits on `/health`. Only service
  provisioning differs; seed/key/env/port(3005)/health are identical.

### Unit / component tests

- **`mobile/`:** `npm test` (= `jest --ci`), `npm test -- --coverage` for the gated
  run. Coverage is **enforced** (K-3 / ADR 003): `coverageThreshold` in
  `mobile/jest.config.js` — **90% lines+branches** on logic globs
  (`src/{features,hooks,storage,db,i18n,firebase,theme}/**`) and a **70% global**
  floor; presentational `src/components/**` is covered by behavior tests but exempt
  from the 90% gate. Tests mock at the `customFetch` mutator seam, never the network.
- **`server/`:** `npm test` (Jest), `npm run test:e2e` (Nest E2E config).
- **`app/` (Flutter):** `flutter test` (mocktail + Riverpod conventions).

### Mobile E2E — Maestro (`mobile/e2e/run_e2e.sh`)

```bash
cd mobile
./e2e/run_e2e.sh              # up → maestro test .maestro/ → down (teardown always)
./e2e/run_e2e.sh --keep-up    # leave the stack up for debugging
./e2e/run_e2e.sh --native     # Docker-less host
```

- Flows live in `mobile/.maestro/*.yaml` (e.g. `schools.yaml`, `settings.yaml`,
  `personal-events.yaml`) and are shared across iOS+Android (assert stable seeded
  text, no per-platform selectors).
- The wrapper owns only the Maestro half; the server half is `ci/e2e-server.sh`.
- It does **not** build/install the app. A **release-config, `development`-variant**
  build must already be installed on the connected simulator/emulator, with
  `EXPO_PUBLIC_API_URL` baked at build time to the platform's host path:
  - Android emulator: `http://10.0.2.2:3005`
  - iOS simulator: `http://localhost:3005`
  ```bash
  APP_VARIANT=development EXPO_PUBLIC_API_URL=http://10.0.2.2:3005 \
    npx expo run:android --variant release
  APP_VARIANT=development EXPO_PUBLIC_API_URL=http://localhost:3005 \
    npx expo run:ios --configuration Release
  ```

### Flutter E2E — `app/integration_test/run_e2e.sh`

Same shared server lifecycle; runs each `integration_test/*_flow_test.dart` as its
own `flutter test` process (process-per-flow, because `Firebase.initializeApp`
throws `[core/duplicate-app]` on a second call in one process).

---

## 8. OpenSpec — the spec-driven change system

Every non-trivial feature is a tracked **OpenSpec change** before any code is
written. This is what makes the work auditable and lets a fresh agent resume.

- **`openspec/changes/<name>/`** — an in-flight change: `proposal.md`, `design.md`
  (with `## Decision` blocks for load-bearing calls), `specs/<capability>/spec.md`
  (delta requirements), `tasks.md` (the implementer's contract — feature work **plus**
  the Architecture Book update, local-green verification, and a CI proof test).
- **`openspec/changes/archive/<YYYY-MM-DD>-<name>/`** — completed changes, archived
  after merge.
- **`openspec/specs/`** — the synced, accumulated capability specs.
- **`openspec/config.yaml`** — `schema: spec-driven`.

Driven via the OpenSpec CLI and the matching skills/commands:

```bash
openspec list
openspec new change "<name>"
openspec status   --change "<name>" --json
openspec instructions <artifact-id> --change "<name>" --json
openspec validate "<name>"
```

Skills: `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`,
`openspec-explore` (mirrored as `/opsx:*` commands). The change lifecycle is wrapped
by the `/ship` pipeline below.

---

## 9. The autonomous build pipeline: plan → apply → simplify → review

Features are built by a **four-stage pipeline** with a distinct sub-agent per stage,
so concerns stay separated. The orchestrator is the `/ship` command
(`.claude/commands/ship.md`); the agents are defined in `.claude/agents/`. The main
loop acts as the **conductor** — it owns git/PR/merge and dispatches the sub-agents;
it does **not** write the change's code itself.

| Stage | Sub-agent (`.claude/agents/`) | Does | Skill used |
| --- | --- | --- | --- |
| **1. PLAN** | `change-planner` (opus) | Turns a roadmap step / feature idea into a complete, apply-ready OpenSpec change (proposal + design + specs + tasks). **Decides autonomously**, records load-bearing decisions in `design.md`, inboxes human-only items. | `openspec-propose` |
| **2. APPLY** | `change-implementer` (opus) | Implements every task on the branch, updates the Architecture Book, gets **local green** (`tsc`/`lint`/`jest` in `mobile/`), commits. Also the FIX phase on reviewer findings. | `openspec-apply-change` |
| **3. SIMPLIFY** | `change-simplifier` (opus) | Quality-only cleanup of the diff (reuse, dedup, dead-code, altitude). No behavior changes, no bug hunting. Commits only if it changed something. | `simplify` |
| **4. REVIEW** | `change-reviewer` (opus, read-only) | The **merge gate**. Runs `code-review` at high effort, verifies tasks/specs/DoD/Architecture-Book/R-1, re-runs local green, emits a structured `VERDICT: APPROVE \| REQUEST_CHANGES`. | `code-review` |

### The `/ship` conductor flow (`.claude/commands/ship.md`)

```
0. git fetch && git switch -c feat/mobile-<slug> origin/main
1. PLAN      → change-planner       (returns CHANGE/BRANCH/SUMMARY/HUMAN_BLOCKED/ADR_NOTES)
2. APPLY     → change-implementer   (tasks done, book updated, local green, commits)
3. SIMPLIFY  → change-simplifier
4. REVIEW    → change-reviewer      (parse VERDICT block)
5. LOOP      REQUEST_CHANGES → implementer(fix) → simplifier → reviewer  (cap: 3 rounds,
             then inbox-escalate, leave PR draft, stop)
6. ARCHIVE   openspec validate + git mv change → openspec/changes/archive/<date>-<name>
7. PR        push, gh pr create (ready, not draft), body ends with the Claude Code footer
8. MERGE     wait for green, then squash-merge
```

### Critical merge invariant — `main` is **NOT a protected branch**

`gh pr merge --auto` would merge the instant the PR is mergeable, **before CI
finishes**. So the conductor must **enforce green itself**:

```bash
gh pr checks <pr> --watch --interval 30      # gate: the test-mobile job (gen-drift, tsc, lint, jest)
gh pr merge <pr> --squash --delete-branch    # ONLY after all required jobs report SUCCESS
```

The reviewer's `APPROVE` + green CI are the only conditions for a zero-touch merge.
Never merge on a red or unfinished CI. (Because main is unprotected, also re-verify
state after dependabot/batch merges.)

### Parallel pipelines

Independent steps may run as concurrent background pipelines in isolated worktrees,
**but merges are serialized**: merge one PR, rebase the others onto the new `main`,
then merge — because changes share files (`docs/mobile/architecture-book/architecture.md`,
`mobile/app.config.ts`, lockfiles) and parallel zero-touch merges can break each
other. Respect real dependencies (e.g. splash depends on theming).

### Solo fallback

When the dedicated squad is not staffed, the founding-engineer agent runs all four
stages itself **but keeps them as distinct sub-agent invocations** so the separation
of concerns holds. The `ship` skill is the solo equivalent of the `/ship` command.

---

## 10. CI pipelines (`.github/workflows/`)

| Workflow | Trigger | What it gates |
| --- | --- | --- |
| **`ci-mobile.yml`** | push touching `mobile/**` or `openapi/**` | The fast `test-mobile` job: **generated-client drift check** (`npm run generate` must produce no diff in `src/api/generated`), generate Expo type decls (`npx expo customize tsconfig.json`), **`tsc --noEmit`**, **`npm run lint`** (`--max-warnings 0`), **`npm test -- --coverage`** (coverage gate in config). This is the gate the conductor watches for `mobile/` changes. |
| **`ci-mobile-e2e.yml`** | on-demand: PRs with the **`run-e2e`** label; always on `main`/`production` when mobile/openapi changed | Native Maestro E2E on an Android emulator (KVM) and an iOS simulator (macOS runner). Slow (~20–30 min/platform). Builds its own server image. |
| **`ci-build-deploy.yml`** | every push (deploy self-gates to main/production) | Server/web images, server tests, deploy. |
| **`ci-flutter.yml`** | main/production pushes touching `app/**` | Legacy Flutter `test-app` + `test-e2e` (R-5 bounded maintenance). |
| **`delete-old-images.yaml`** | scheduled | Image cleanup. |

**Per the project owner, `run-e2e` is normally NOT added to PRs — native E2E runs on
`main` only** (it is slow). For extra confidence on runtime-heavy changes, run Maestro
locally instead (where the host supports it). Path-filtered jobs that are skipped do
not report a status; none are *required* checks today.

### OpenAPI contract drift

`openapi/openapi.json` is the single server↔mobile contract. Regenerate it with
`npm run generate:openapi` in `server/` (needs the local docker services up). The
mobile client (`mobile/src/api/generated/`, Orval-generated) is **committed and never
hand-edited** — `npm run generate` in `mobile/` regenerates it; CI fails on drift.

---

## 11. Paperclip control plane (agent management)

The agents are coordinated by **Paperclip**, a control-plane the team is planning to
migrate away from. What a replacement system must replicate:

- **Work tracking.** Work is issues `TIM-NNN` with status (`backlog`/`in_progress`/
  `blocked`/`done`), priority, assignee, parent/child relationships, and a comment
  thread. The migration roadmap maps to issues (e.g. Feature A = Settings = TIM-130/131,
  Feature B = Personal events = TIM-132/133).
- **Heartbeats.** An agent is woken with a **wake payload** scoped to one issue. It
  must take concrete action that heartbeat (not just plan), leave durable progress,
  and **update the issue with a comment before exiting**. Long/parallel work is
  delegated to **child issues** rather than polled (a poll loop dies when the
  heartbeat ends — see the "no background watch across heartbeats" lesson).
- **Checkout / assignment.** The harness checks out an issue for the run; the agent
  works only on assigned/handed-off issues and respects company/budget/pause/cancel
  boundaries.
- **Escalation.** Blocked work is set `blocked` **with the unblock owner and exact
  action named** — never a bare "blocked". Human-only steps go to
  `docs/react-native-migration/inbox/` tagged `(HUMAN: …)` and do **not** block the
  rest of the change.
- **Interactions.** Structured requests to the board/user use issue *interactions*
  (`suggest_tasks`, `ask_user_questions`, `request_confirmation`) — e.g. plan
  approval before spawning implementation subtasks.
- **Roles.** The founding-engineer agent reports to a CEO agent and owns technical
  delivery; the dev-cycle squad (planner/applier/simplifier/reviewer) are separate
  agents when staffed.

The `paperclip` skill wraps the control-plane API; `paperclip-converting-plans-to-tasks`
and `paperclip-create-agent` cover planning→issues and hiring. **These are
coordination mechanics, not the domain work** — a new agent system replaces this
layer entirely while keeping §§4–10 (the repo-anchored dev process) unchanged.

### Memory

The agent keeps a persistent file-based memory at
`~/.claude/projects/<project-slug>/memory/` (a `MEMORY.md` index + one fact per file).
It records non-obvious project state, feedback, and lessons learned (e.g. the worktree
gotcha, "main has no branch protection", dependency-bump pitfalls). A replacement
system should carry equivalent durable cross-session memory.

---

## 12. Quick reference — "I'm a new agent, get me building"

```bash
# 0. Toolchain: Node 24.13.0, Docker, gh as samuelprak (SSH), JDK, Flutter at /home/dev/flutter
nvm use                                   # honors .nvmrc

# 1. Dev env (once per machine)
cd server && docker compose up -d         # Postgres:37291 Redis:37292 nginx:1443
npm install                               # root workspaces
cd server && npm ci && cp .env.sample .env  # NODE_ENV=development
npm run db:migrate && npm run db:seed     # from server/
npm run dev                               # NestJS on :3005
bash bin/setup-dev.sh                     # /etc/hosts, web/.env.local, cert, reachability

# 2. Per worktree (every fresh worktree!)
npm run setup:worktree                    # symlink secrets + npm ci + husky

# 3. Build a feature (the pipeline)
/ship "<roadmap step or feature>"         # plan → apply → simplify → review → archive → PR → merge
#   or manually: openspec-propose → openspec-apply-change → simplify → code-review → openspec-archive-change

# 4. Verify (mobile)
cd mobile && npx tsc --noEmit && npm run lint && npm test -- --coverage
cd mobile && ./e2e/run_e2e.sh             # Maestro E2E (needs an installed dev-variant build + device)

# 5. Ship
git commit ...                            # conventional + Co-Authored-By footer; husky runs
gh pr create --fill                       # main is UNPROTECTED — never --auto
gh pr checks <pr> --watch --interval 30   # wait for green
gh pr merge <pr> --squash --delete-branch # only after SUCCESS
```

**The non-negotiables:** keep the Architecture Book (`docs/mobile/architecture-book/`) and its
Definition of Done binding; encode rules before documenting them (R-1); the reviewer
is the sole merge gate; never merge on red; never block on human-only work (inbox it);
leave the codebase more idiomatic than you found it.
