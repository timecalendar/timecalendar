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

- [ ] 1.1 Create `.github/dependabot.yml` (`version: 2`) with five `updates:`
  entries:
  - `package-ecosystem: "npm"`, `directory: "/server"`
  - `package-ecosystem: "npm"`, `directory: "/web"`
  - `package-ecosystem: "npm"`, `directory: "/openapi/javascript"`
  - `package-ecosystem: "pub"`, `directory: "/openapi/dart"`
  - `package-ecosystem: "github-actions"`, `directory: "/"`
- [ ] 1.2 Each entry: `schedule.interval: "weekly"`, an
  `open-pull-requests-limit` (e.g. `5`), and a `groups:` block so related
  updates arrive as a single PR (e.g. group `@nestjs/*`, group dev/minor
  updates). Config only — this task bumps nothing itself.

## 2. Capture the pre-upgrade `npm audit` baseline

- [ ] 2.1 Run `npm audit` in `server/` and in `web/` and record the counts
  (server ≈ 85, web ≈ 14 at plan time) in the apply notes, so the post-upgrade
  delta is auditable.

## 3. Server mechanical bumps (low-risk — land + verify first)

- [ ] 3.1 In `server/package.json`, bump `@types/node` `^16.0.0` → `^22`
  (match the `node:22` runtime in `server/Dockerfile`).
- [ ] 3.2 Bump `typescript` `^5.1.6` → the latest `5.x` release.
- [ ] 3.3 Bump `firebase-admin` `^11.10.1` → `^13`. Check the Firebase
  Messaging / `firebase-admin` call sites compile against the v13 types.
- [ ] 3.4 **Drop `dayjs`, consolidate on `date-fns`:**
  - In `server/src/modules/calendar-sync/services/calendar-sync-all.service.ts`,
    replace the two `dayjs().subtract(N, unit).toDate()` calls with `date-fns`
    `subMinutes(new Date(), N)` / `subDays(new Date(), N)`.
  - Delete `server/src/lib/dayjs/` (the `duration` plugin it wires up is never
    called — confirm with a repo grep for `.duration(`).
  - Remove the `import "lib/dayjs"` line from `server/src/main.ts`.
  - Remove `dayjs` from `server/package.json` dependencies. Keep `date-fns`
    on its current `^2.30.0` — do **not** bump it to v3/v4 (out of scope).
- [ ] 3.5 **Drop `glob-promise`:** in `server/src/scripts/seed-database.ts`
  change `import glob from "glob-promise"` to `import { glob } from "glob"`
  (the `await glob("./**/fixtures/*.yml")` call is otherwise unchanged). Bump
  `glob` `^7.1.6` → `^10`+, and remove both `glob-promise` and `@types/glob`
  from `server/package.json` (`glob` 10+ bundles its own types).
- [ ] 3.6 Run `npm install` in `server/`, then `npm run build` and
  `npm run test` — both must be green before starting group 4.

## 4. ESLint 8 → 9 flat-config migration

- [ ] 4.1 In `server/package.json` bump `eslint` `^8.48.0` → `^9`, replace
  `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` `^6` with
  the `typescript-eslint` umbrella package `^8`, bump `eslint-plugin-import`
  to a flat-config-capable `2.31+` release, and bump `eslint-config-prettier`
  (`^9` → `^10` if needed). Keep `eslint-plugin-prettier` `^5`.
- [ ] 4.2 Create `server/eslint.config.mjs` reproducing the current
  `server/.eslintrc.js` ruleset 1:1 (see `design.md` for the rule list); use
  `tseslint.config(...)`. Use `web/eslint.config.mjs` as the in-repo shape
  reference. Delete `server/.eslintrc.js`.
- [ ] 4.3 If the `package.json` `lint`/`db:generate` scripts reference globs
  that flat config handles differently, adjust them so `npm run lint` still
  lints `{src,apps,libs,test}/**/*.ts`.
- [ ] 4.4 Run `npm run lint` in `server/` — it must pass with no new errors.
  Then re-run `npm run build` + `npm run test` to confirm group 4 is green.

## 5. NestJS 10 → 11 (atomic — land last)

- [ ] 5.1 In `server/package.json`, bump **all** `@nestjs/*` packages
  together: `common`, `core`, `microservices`, `platform-express`, `testing`,
  `cli`, `schematics` → `^11`; `@nestjs/swagger` `^7` → `^8`;
  `@nestjs/terminus` `^10` → `^11`; `@nestjs/typeorm` `^10` → `^11`;
  `@nestjs/bullmq` `^10` → `^11`; `@nestjs/event-emitter` → latest `^3`. Also
  bump `reflect-metadata` `^0.1.13` → `^0.2` (Nest 11 peer requirement).
- [ ] 5.2 Run `npm install` in `server/`. Resolve any peer-dependency
  conflict by moving the offending `@nestjs/*` package to its `^11`-compatible
  release — do not pin a package back to 10 (mixed 10/11 is unsupported).
- [ ] 5.3 Apply NestJS 11 migration touch-ups as needed (see `design.md`):
  check the Swagger bootstrap in `server/src/main.ts` against `@nestjs/swagger`
  8, and fix any compile error surfaced by `nest build`. `@nestjs/platform-
  express` 11 still defaults to Express 4 — no Express-5 migration here.
- [ ] 5.4 Run `npm run build` and `npm run test` in `server/` — both green.

## 6. `npm audit` cleanup

- [ ] 6.1 Run `npm audit fix` (**not** `--force`) in `server/` and in `web/`
  to apply non-breaking transitive fixes. Re-run `npm run build` + tests on
  `server/` afterwards to confirm the lockfile change is safe.
- [ ] 6.2 Run `npm audit` again in both workspaces. Record the residual
  findings; for each one that would need a breaking change, write a one-line
  documented exception (advisory id + why deferred) in the apply notes. Target:
  `npm audit` clean **or** every residual finding documented (TIM-46
  acceptance).

## 7. Verify and confirm scope

- [ ] 7.1 Confirm `server/` is green end-to-end: `npm run build`,
  `npm run test` (jest, 58 spec files), `npm run lint`.
- [ ] 7.2 Ensure the PR's CI `Build server image` + `test` jobs are green and
  the Phase 1 E2E smoke suite (`Run E2E smoke flows`,
  [TIM-7](/TIM/issues/TIM-7)) passes — the NestJS + Flutter regression gate —
  before handing to Review.
- [ ] 7.3 Confirm the diff is limited to: `.github/dependabot.yml` (new),
  `server/package.json`, `server/package-lock.json`,
  `server/eslint.config.mjs` (new), `server/.eslintrc.js` (deleted), the
  date-lib + glob source files named in `proposal.md` Impact, deleted
  `server/src/lib/dayjs/`, and — only if `npm audit fix` changed a pin —
  `web/package.json` + `web/package-lock.json`. No `app/`, no `openapi/`
  source, no runtime-behaviour change.
- [ ] 7.4 Confirm out-of-scope items were not touched: `date-fns` is still on
  `^2`, no `web/` framework major moved, no `openapi/` client deps bumped.

## Implementation notes

<!-- Applier ([TIM-61](/TIM/issues/TIM-61)) records deviations, the exact
pinned versions chosen, and the documented `npm audit` exceptions here. -->
