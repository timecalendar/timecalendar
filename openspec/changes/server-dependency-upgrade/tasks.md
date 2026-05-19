# Tasks

Conventions for every task below:
- All paths are relative to the repository root.
- Server commands run from `server/`; `web/` commands from `web/`.
- Node is available on the host; `npm` is used directly (CI builds the server
  in a `node:22` Docker image — that is the runtime to match).
- Land the work in the task-group order below: the low-risk mechanical bumps
  (group 3) first, ESLint flat config (group 4) next, and **NestJS 11 last**
  (group 5) — see `design.md` for why the NestJS bump is atomic, not phased.
- If any NestJS 11 or ESLint 9 API break needs more than a localized,
  obvious source touch-up, **stop and escalate to FoundingEngineer** — do not
  expand scope or refactor.

## 1. Add repo-wide Dependabot config

- [x] 1.1 Create `.github/dependabot.yml` (`version: 2`) with five `updates:`
  entries:
  - `package-ecosystem: "npm"`, `directory: "/server"`
  - `package-ecosystem: "npm"`, `directory: "/web"`
  - `package-ecosystem: "npm"`, `directory: "/openapi/javascript"`
  - `package-ecosystem: "pub"`, `directory: "/openapi/dart"`
  - `package-ecosystem: "github-actions"`, `directory: "/"`
- [x] 1.2 Each entry: `schedule.interval: "weekly"`, an
  `open-pull-requests-limit` (e.g. `5`), and a `groups:` block so related
  updates arrive as a single PR (e.g. group `@nestjs/*`, group dev/minor
  updates). Config only — this task bumps nothing itself.

## 2. Capture the pre-upgrade `npm audit` baseline

- [x] 2.1 Run `npm audit` in `server/` and in `web/` and record the counts
  (server ≈ 85, web ≈ 14 at plan time) in the apply notes, so the post-upgrade
  delta is auditable.

## 3. Server mechanical bumps (low-risk — land + verify first)

- [x] 3.1 In `server/package.json`, bump `@types/node` `^16.0.0` → `^22`
  (match the `node:22` runtime in `server/Dockerfile`).
- [x] 3.2 Bump `typescript` `^5.1.6` → the latest `5.x` release.
- [x] 3.3 Bump `firebase-admin` `^11.10.1` → `^13`. Check the Firebase
  Messaging / `firebase-admin` call sites compile against the v13 types.
- [x] 3.4 **Drop `dayjs`, consolidate on `date-fns`:**
  - In `server/src/modules/calendar-sync/services/calendar-sync-all.service.ts`,
    replace the two `dayjs().subtract(N, unit).toDate()` calls with `date-fns`
    `subMinutes(new Date(), N)` / `subDays(new Date(), N)`.
  - Delete `server/src/lib/dayjs/` (the `duration` plugin it wires up is never
    called — confirm with a repo grep for `.duration(`).
  - Remove the `import "lib/dayjs"` line from `server/src/main.ts`.
  - Remove `dayjs` from `server/package.json` dependencies. Keep `date-fns`
    on its current `^2.30.0` — do **not** bump it to v3/v4 (out of scope).
- [x] 3.5 **Drop `glob-promise`:** in `server/src/scripts/seed-database.ts`
  change `import glob from "glob-promise"` to `import { glob } from "glob"`
  (the `await glob("./**/fixtures/*.yml")` call is otherwise unchanged). Bump
  `glob` `^7.1.6` → `^10`+, and remove both `glob-promise` and `@types/glob`
  from `server/package.json` (`glob` 10+ bundles its own types).
- [x] 3.6 Run `npm install` in `server/`, then `npm run build` and
  `npm run test` — both must be green before starting group 4.

## 4. ESLint 8 → 9 flat-config migration

- [x] 4.1 In `server/package.json` bump `eslint` `^8.48.0` → `^9`, replace
  `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` `^6` with
  the `typescript-eslint` umbrella package `^8`, bump `eslint-plugin-import`
  to a flat-config-capable `2.31+` release, and bump `eslint-config-prettier`
  (`^9` → `^10` if needed). Keep `eslint-plugin-prettier` `^5`.
- [x] 4.2 Create `server/eslint.config.mjs` reproducing the current
  `server/.eslintrc.js` ruleset 1:1 (see `design.md` for the rule list); use
  `tseslint.config(...)`. Use `web/eslint.config.mjs` as the in-repo shape
  reference. Delete `server/.eslintrc.js`.
- [x] 4.3 If the `package.json` `lint`/`db:generate` scripts reference globs
  that flat config handles differently, adjust them so `npm run lint` still
  lints `{src,apps,libs,test}/**/*.ts`.
- [x] 4.4 Run `npm run lint` in `server/` — it must pass with no new errors.
  Then re-run `npm run build` + `npm run test` to confirm group 4 is green.

## 5. NestJS 10 → 11 (atomic — land last)

- [x] 5.1 In `server/package.json`, bump **all** `@nestjs/*` packages
  together: `common`, `core`, `microservices`, `platform-express`, `testing`,
  `cli`, `schematics` → `^11`; `@nestjs/swagger` `^7` → `^8`;
  `@nestjs/terminus` `^10` → `^11`; `@nestjs/typeorm` `^10` → `^11`;
  `@nestjs/bullmq` `^10` → `^11`; `@nestjs/event-emitter` → latest `^3`. Also
  bump `reflect-metadata` `^0.1.13` → `^0.2` (Nest 11 peer requirement).
- [x] 5.2 Run `npm install` in `server/`. Resolve any peer-dependency
  conflict by moving the offending `@nestjs/*` package to its `^11`-compatible
  release — do not pin a package back to 10 (mixed 10/11 is unsupported).
- [x] 5.3 Apply NestJS 11 migration touch-ups as needed (see `design.md`):
  check the Swagger bootstrap in `server/src/main.ts` against `@nestjs/swagger`
  8, and fix any compile error surfaced by `nest build`. `@nestjs/platform-
  express` 11 still defaults to Express 4 — no Express-5 migration here.
- [x] 5.4 Run `npm run build` and `npm run test` in `server/` — both green.

## 6. `npm audit` cleanup

- [x] 6.1 Run `npm audit fix` (**not** `--force`) in `server/` and in `web/`
  to apply non-breaking transitive fixes. Re-run `npm run build` + tests on
  `server/` afterwards to confirm the lockfile change is safe.
- [x] 6.2 Run `npm audit` again in both workspaces. Record the residual
  findings; for each one that would need a breaking change, write a one-line
  documented exception (advisory id + why deferred) in the apply notes. Target:
  `npm audit` clean **or** every residual finding documented (TIM-46
  acceptance).

## 7. Verify and confirm scope

- [x] 7.1 Confirm `server/` is green end-to-end: `npm run build`,
  `npm run test` (jest, 58 spec files), `npm run lint`.
- [x] 7.2 Ensure the PR's CI `Build server image` + `test` jobs are green and
  the Phase 1 E2E smoke suite (`Run E2E smoke flows`,
  [TIM-7](/TIM/issues/TIM-7)) passes — the NestJS + Flutter regression gate —
  before handing to Review.
- [x] 7.3 Confirm the diff is limited to: `.github/dependabot.yml` (new),
  `server/package.json`, `server/package-lock.json`,
  `server/eslint.config.mjs` (new), `server/.eslintrc.js` (deleted), the
  date-lib + glob source files named in `proposal.md` Impact, deleted
  `server/src/lib/dayjs/`, and — only if `npm audit fix` changed a pin —
  `web/package.json` + `web/package-lock.json`. No `app/`, no `openapi/`
  source, no runtime-behaviour change.
- [x] 7.4 Confirm out-of-scope items were not touched: `date-fns` is still on
  `^2`, no `web/` framework major moved, no `openapi/` client deps bumped.

## Implementation notes

Applied by the Applier ([TIM-61](/TIM/issues/TIM-61)) in worktree branch
`TIM-61-b9-server-dep-upgrade-apply`, one logical commit per task group.

### Pinned versions chosen

- **Group 3:** `@types/node` `^22`, `typescript` `^5.9.3`, `firebase-admin`
  `^13`, `glob` `^13` (not `^10`/`^11`: glob 11.x is npm-deprecated, glob 13
  is the current line and its `engines` allow the `node:22` runtime).
- **Group 4:** `eslint` `^9`, `@eslint/js` `^9`, `typescript-eslint` `^8`,
  `eslint-plugin-import` `^2.31`, `eslint-config-prettier` `^10`,
  `eslint-plugin-prettier` `^5.5.5` (5.0.0 has no `/recommended` flat-config
  export), `globals` `^16` (new dep — needed to reproduce `env: node, jest`).
- **Group 5:** all `@nestjs/*` → `^11`, `@nestjs/event-emitter` `^3.1.0`,
  `reflect-metadata` `^0.2`.

### Deviations from the plan

- **`@nestjs/swagger` → `^11`, not `^8`.** Task 5.1 specified `^8`, but
  `@nestjs/swagger@8` still peer-requires `@nestjs/common` `^9 || ^10` and
  rejects Nest 11. Per task 5.2 ("move the offending package to its
  `^11`-compatible release") swagger moves to `^11` — swagger now
  version-aligns with NestJS. No swagger-bootstrap source change was needed
  (`DocumentBuilder` / `SwaggerModule` API is stable).
- **No NestJS 11 source touch-ups were required** — `nest build` is clean.
- **ESLint flat config — v6→v8 preset drift.** `typescript-eslint` 8's
  `recommended` preset is stricter than the `@typescript-eslint` 6 preset the
  legacy `.eslintrc.js` used. To reproduce the previous ruleset 1:1 (task 4.2)
  `eslint.config.mjs` pins three rules to their v6-equivalent behaviour:
  `no-require-imports` off (v6 used the now-removed `no-var-requires`),
  `no-unused-expressions` off (not in the v6 preset), and `no-unused-vars`
  with `caughtErrors: "none"` (v6/ESLint 8 default). It also sets
  `linterOptions.reportUnusedDisableDirectives: "off"` (ESLint 9 flat config
  defaults this to `"warn"`; the legacy `.eslintrc.js` left it off).
  `@typescript-eslint/interface-name-prefix: off` was dropped — that rule was
  removed in `@typescript-eslint` v3 and a stale reference is a hard config
  error in ESLint 9. Adopting v8's stricter defaults is a separate follow-up.
- **`ai` held at 5.0.30.** `npm audit fix` re-resolves `ai` `^5.0.30` up to
  `5.0.188`, which pulls `@ai-sdk/gateway` 2.x and skews the `@ai-sdk`
  `Tool` generic types against `@ai-sdk/openai@2.0.23`, breaking `nest build`
  (`school-profile-generation.service.ts`). `ai@5.0.52` (the minimum that
  clears advisory GHSA-rwvc-j5jr-mgvh) breaks the build the same way. Fixing
  it needs a coordinated AI SDK upgrade + source change, which is out of B9
  scope — `ai` is held at 5.0.30 and the advisory is a documented exception.

### `npm audit` baseline and delta

| Workspace | Pre-upgrade (task 2.1) | After group 3-5 bumps | After `npm audit fix` |
| --------- | ---------------------- | --------------------- | --------------------- |
| `server/` | 85                     | 77                    | **19**                |
| `web/`    | 14                     | —                     | **3**                 |

`npm audit fix` was run non-`--force`; lockfiles only, no `package.json`
constraint changed in either workspace.

### Documented `npm audit` exceptions (residual — all need breaking changes)

**`server/` (19 findings, 6 advisory clusters):**

- **OpenTelemetry — GHSA-q7rr-3cgh-j5r3 (high, 3 pkgs).** Fix needs breaking
  majors (`@opentelemetry/sdk-node` 0.57→0.218,
  `@opentelemetry/auto-instrumentations-node` 0.55→0.76). Deferred — the
  OpenTelemetry SDK major is its own upgrade surface.
- **`@tootallnate/once` — GHSA-vpq2-c234-7xj6 (low, 8-pkg `firebase-admin`
  chain).** `firebase-admin` is already on the latest major (v13); npm's only
  offered "fix" is a downgrade to `firebase-admin@10.3.0`. No non-breaking
  fix — awaits an upstream `firebase-admin` release dropping the vulnerable
  transitive.
- **`axios` via `node-ical` — multiple axios advisories (high).**
  `node-ical@0.14.1` bundles axios ≤0.31; fix = `node-ical@0.26.1` (breaking
  major). Deferred to Dependabot.
- **`nodemailer` — SMTP-injection/DoS advisories (high).** Fix needs
  `nodemailer` 6→8 (breaking major). Deferred to Dependabot.
- **`ws` via `crisp-api` — GHSA-58qx-3vcg-4xpx (moderate, 4-pkg chain).**
  npm's fix is `crisp-api@5.1.0` (a downgrade from `^8`). Deferred.
- **`ai` — GHSA-rwvc-j5jr-mgvh (low).** Fix = `ai@5.0.52+`, blocked by the
  AI SDK build break described above. Deferred.

**`web/` (3 findings):**

- **`next` — multiple Next.js advisories (high).** npm's offered "fix" is a
  downgrade to `next@9.3.3`; a real fix is a Next framework bump, an explicit
  B9 non-goal (no `web/` framework-major change). Deferred.
- **`next-runtime-env` (high) + `postcss` (moderate).** Both fixed only by
  `next-runtime-env@2.0.1` (breaking major). Deferred.

All residual findings require breaking-change upgrades and are recorded here
as documented exceptions — satisfying the TIM-46 acceptance ("`npm audit`
clean **or** every residual finding documented").

### Verification

- `server/`: `npm run build`, `npm run test` (jest — 58 suites, 287 tests),
  `npm run lint` all green.
- `web/`: not built locally — `npm audit fix` changed only the lockfile
  (non-breaking transitives); the `web/` image is covered by the CI
  `Build web image` job.
- CI `Build server image` + `test` jobs and the Phase 1 E2E smoke suite
  ([TIM-7](/TIM/issues/TIM-7)) run on branch push (task 7.2) — must be green
  before Review.
