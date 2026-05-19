## Why

Phase 2 ([TIM-3](/TIM/issues/TIM-3)) is the dependency-upgrade & maintenance
phase. The B1 audit ([TIM-36](/TIM/issues/TIM-36)) flagged the NestJS backend
(`server/`) as the largest stale surface in the repo: its toolchain and
framework majors have drifted one full major behind, and the project has **no
`.github/dependabot.yml`**, so nothing keeps any workspace current.

This change is audit item **B9** ([TIM-46](/TIM/issues/TIM-46)). Concrete
findings driving it:

- **No Dependabot.** The 6 stale Dependabot PRs (#26–#32) were a *one-off*
  pre-audit run that FoundingEngineer has since closed; there is no committed
  `dependabot.yml`, so the repo has no recurring dependency-update signal for
  `server/`, `web/`, the two `openapi/` clients, or GitHub Actions.
- **`@types/node` 16 vs runtime `node:22`.** `server/Dockerfile` runs on
  `node:22` but `@types/node` is pinned at `^16` — the type surface the code
  is checked against does not match the runtime.
- **NestJS 10.** Every `@nestjs/*` package is a major behind (NestJS 11),
  which also pins `reflect-metadata` at the superseded `0.1` line.
- **Stale toolchain.** `typescript` 5.1, `eslint` 8 (legacy `.eslintrc.js`,
  not flat config), `@typescript-eslint/*` 6, `firebase-admin` 11.
- **Redundant utilities.** `server/package.json` carries **both** `date-fns`
  and `dayjs`; and `glob-promise` is a wrapper that `glob` 10+ makes obsolete
  with its native promise API.
- **85 `npm audit` findings on `server/`, 14 on `web/`** — most are
  transitive and clear once the framework/toolchain majors move.

## What Changes

One coherent server-focused dependency-upgrade pass, plus the repo-wide
Dependabot config so this drift does not recur. Scoped as the **plan** for the
dev-cycle; the Applier ([TIM-61](/TIM/issues/TIM-61)) implements it.

- **Add `.github/dependabot.yml`** covering all five package ecosystems:
  `server/` (npm), `web/` (npm), `openapi/javascript` (npm), `openapi/dart`
  (pub), and GitHub Actions — weekly, grouped, with sensible PR limits.
- **`npm audit` pass.** Run `npm audit fix` (non-`--force`, i.e. non-breaking)
  on `server/` and `web/` after the bumps below; any residual finding that
  needs a breaking change is documented as an exception, not forced.
- **Server toolchain bumps** in `server/package.json`:
  - `@types/node` `^16` → `^22` (match the `node:22` Docker runtime).
  - `typescript` `^5.1` → latest `5.x`.
  - `eslint` `^8` → `^9` **with migration to flat config**
    (`eslint.config.mjs`, deleting `.eslintrc.js`); `@typescript-eslint/*`
    `^6` → `^8` (via the `typescript-eslint` umbrella package).
  - `firebase-admin` `^11` → `^13`.
- **NestJS 10 → 11** across every `@nestjs/*` package — moved **atomically**
  (Nest peer-deps reject a mixed 10/11 install): `common`, `core`,
  `microservices`, `platform-express`, `testing`, `cli`, `schematics` → `^11`;
  `swagger` `^7` → `^8`; `terminus` `^10` → `^11`; `typeorm` `^10` → `^11`;
  `bullmq` (`@nestjs/bullmq`) `^10` → `^11`; `event-emitter` to latest `^3`;
  and `reflect-metadata` `^0.1` → `^0.2`.
- **Consolidate date libraries — keep `date-fns`, drop `dayjs`.** `dayjs` has
  only two real call sites (`calendar-sync-all.service.ts`); its `duration`
  plugin wired up in `server/src/lib/dayjs/index.ts` is **never called** (dead
  code). `date-fns`'s custom-locale `formatRelative` in `date-utils.ts` would
  be awkward to replicate in `dayjs`. So the cheaper, lower-risk migration is
  dayjs → date-fns. (`date-fns` stays on its current `^2` — a v2→v4 major bump
  is **out of scope**, left to Dependabot.)
- **Drop `glob-promise`** — rewrite the single call site
  (`server/src/scripts/seed-database.ts`) on `glob` 10+'s native
  `import { glob } from "glob"` promise API; bump `glob` `^7` → `^10`+ and
  remove the now-dead `@types/glob` (`glob` 10+ ships its own types).

## Capabilities

### New Capabilities
- `dependency-update-automation`: records the requirement that every package
  ecosystem in the repo is tracked by Dependabot so dependency drift surfaces
  automatically.
- `server-dependency-baseline`: records the maintained known-good baseline for
  the NestJS server's framework, toolchain, and utility dependencies — the B9
  target versions, the single-date-library rule, and the build/audit/test gate
  the upgrade must pass.

### Modified Capabilities
<!-- None — independent of the Flutter dependency capabilities (B2/B3). -->

## Impact

- **New file** `.github/dependabot.yml` — 5 ecosystem entries.
- `server/package.json` + `server/package-lock.json` — ~25 dependency
  constraints bumped/removed; re-resolved lockfile.
- **New file** `server/eslint.config.mjs`; **deleted** `server/.eslintrc.js`.
- `server/src/modules/shared/dates/date-utils.ts`,
  `server/src/modules/calendar-sync/services/calendar-sync-all.service.ts`,
  `server/src/main.ts`, and **deleted** `server/src/lib/dayjs/` — date-library
  consolidation.
- `server/src/scripts/seed-database.ts` — `glob-promise` → native `glob`.
- Possible small source touch-ups for NestJS 11 / `@typescript-eslint` 8 API
  changes (see `design.md`); the regression gate is `nest build` +
  `npm run test` (jest) green and the Phase 1 E2E smoke suite
  ([TIM-7](/TIM/issues/TIM-7)) green in CI.
- `web/package.json` + lockfile — only if `npm audit fix` (non-breaking)
  changes a transitive pin; no `web/` source or framework-major change.
- No Flutter / `app/`, `openapi/` source, or runtime-behaviour change intended.
