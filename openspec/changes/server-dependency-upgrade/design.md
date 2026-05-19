## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) audited the repo's dependencies. The Flutter
side has been brought current by B2/B3 ([TIM-37](/TIM/issues/TIM-37),
[TIM-38](/TIM/issues/TIM-38)). The NestJS server (`server/`) is the remaining
large stale surface, and the repo has no Dependabot config to keep any
workspace current. B9 ([TIM-46](/TIM/issues/TIM-46)) addresses both.

This change is **board-independent**: unlike the iOS deployment-target raise
(gated on a [TIM-3](/TIM/issues/TIM-3) product decision), a server dependency
upgrade has no product or store-compliance impact.

## Goals / Non-Goals

**Goals:**
- The repo has a committed Dependabot config covering every package ecosystem.
- The server's framework (NestJS) and toolchain (TypeScript, ESLint,
  `@typescript-eslint`, `firebase-admin`, `@types/node`) are on current majors.
- `server/` and `web/` carry no `npm audit` finding fixable without a breaking
  change; residual findings are documented exceptions.
- Redundant utility deps are removed: one date library, no `glob-promise`.
- `nest build` + the jest suite stay green; the Phase 1 E2E smoke suite stays
  green in CI.

**Non-Goals:**
- Bumping `date-fns` v2 → v4 (locale-import + timezone breaking changes) — out
  of scope; left to Dependabot to surface later.
- Any `web/` framework-major change — `web/` is already on Next 15 / React 19 /
  ESLint 9; only its non-breaking `npm audit fix` is in scope.
- `openapi/javascript` / `openapi/dart` dependency bumps — those clients are
  generated; only their Dependabot coverage is added here.
- Any Flutter / `app/` change, runtime behaviour change, or feature work.
- Bumping the `bullmq` package itself (already `^5.34.10`) — only the
  `@nestjs/bullmq` integration package moves 10 → 11.

## Decisions

### NestJS 10 → 11 is applied atomically, not phased

The wake brief asks whether to phase the NestJS bump or do it atomically.
**Atomically, within this single change.** NestJS packages share strict peer
ranges: `@nestjs/core` 11 will not accept `@nestjs/common` 10, `@nestjs/swagger`
8 requires Nest 11, etc. A "phased" landing would leave `server/` with a
broken `npm install` between phases — there is no green intermediate state to
phase *through*. The risk is instead managed by **task ordering**: the
low-risk mechanical bumps (`@types/node`, `typescript`, `firebase-admin`,
date-lib, glob) land and are verified first; ESLint 9 flat-config next; the
NestJS 11 + `reflect-metadata` 0.2 move is the final task group, and the
`nest build` + jest + E2E gate runs after it. If the gate fails on a NestJS 11
API break that needs more than a localized touch-up, the Applier escalates to
FoundingEngineer rather than expanding scope.

Known NestJS 11 migration touch-points the Applier should expect (per the
official v11 migration guide):
- `reflect-metadata` must move to `^0.2` (Nest 11 peer requirement).
- `@nestjs/swagger` 8 ships its own document-builder changes; the swagger
  bootstrap in `server/src/main.ts` should be checked.
- Express 5 is *opt-in* under Nest 11 — `@nestjs/platform-express` 11 still
  defaults to Express 4, so no Express-5 migration is required here.
- Lifecycle/`Logger` and `ConfigModule` signatures are largely stable; expect
  at most minor type adjustments under `@types/node` 22 + TS 5.x.

### ESLint 8 → 9 means a flat-config migration

ESLint 9 makes flat config (`eslint.config.mjs`) the default and drops
`.eslintrc.*`. The Applier creates `server/eslint.config.mjs` reproducing the
current `.eslintrc.js` ruleset and deletes `.eslintrc.js`. The existing
`web/eslint.config.mjs` (already on ESLint 9 + `typescript-eslint` 8) is the
in-repo reference for the flat-config shape. Use the `typescript-eslint`
umbrella package (`tseslint.config(...)`) rather than wiring
`@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` by hand. The
current ruleset to preserve: `eslint:recommended` +
`@typescript-eslint/recommended` + `import/recommended` + `prettier`, the
`no-restricted-imports` `../*` ban, `prefer-template`, the `import/order`
`modules/**` path-group, and `prettier/prettier` with `endOfLine: "auto"`.
`eslint-plugin-import` must be on a 2.31+ release for flat-config support;
`eslint-config-prettier` may move to `^10`. `npm run lint` must still pass.

### Date library: keep `date-fns`, drop `dayjs`

Evidence from the code:
- `dayjs` real call sites: **one file** —
  `calendar-sync-all.service.ts` (`dayjs().subtract(N, "minutes").toDate()`
  and `dayjs().subtract(N, "days").toDate()`).
- `server/src/lib/dayjs/index.ts` extends the `duration` plugin, but
  `dayjs.duration(` / `.duration(` is **never called** anywhere — dead wiring.
  `server/src/main.ts` only imports `lib/dayjs` for that (dead) side-effect.
- `date-fns` use: `date-utils.ts` — `format` and `formatRelative` with a
  **custom French `formatRelative` locale** (overridden `lastWeek`/`yesterday`/
  `today`/`tomorrow`/`nextWeek` tokens).

Replicating that custom-locale `formatRelative` in `dayjs` would need the
`calendar` plugin plus bespoke locale config — strictly more work and more
risk than the reverse. So drop `dayjs`: rewrite the two `subtract` calls with
`date-fns` `subMinutes` / `subDays`, delete `server/src/lib/dayjs/`, and
remove the `import "lib/dayjs"` line from `main.ts`. `date-fns` stays on `^2`.

### `glob-promise` → native `glob`

`glob` 10+ exports a native promise function: `import { glob } from "glob"`.
The single consumer is `server/src/scripts/seed-database.ts`
(`await glob("./**/fixtures/*.yml")`) — the call signature is unchanged, only
the import. Bump `glob` `^7` → `^10`+, drop `glob-promise`, and drop
`@types/glob` (`glob` 10+ bundles its own types — leaving `@types/glob` would
shadow them with stale v8 declarations).

### Dependabot config shape

One `version: 2` config with five `updates:` entries (`npm` for `/server`,
`/web`, `/openapi/javascript`; `pub` for `/openapi/dart`;
`github-actions` for `/`), all `schedule.interval: "weekly"`, each with a
`groups:` block so related bumps arrive as one PR, and an `open-pull-requests-
limit` to keep noise bounded. This is config only — it does not itself bump
anything; it is the recurrence mechanism so B9 does not need a B-whatever.

## Risks / Trade-offs

- **NestJS 11 is the real risk.** Mitigated by ordering it last behind a green
  build/test baseline and by the `nest build` + jest (58 spec files) + E2E
  smoke gate. A genuine API break beyond a localized touch-up is an escalation,
  not silent scope creep.
- **ESLint flat-config migration** can subtly change which files/rules apply.
  Mitigated by mirroring the existing ruleset 1:1 and requiring `npm run lint`
  to pass with no new errors.
- **`npm audit fix` (non-`--force`) is conservative by design** — it will not
  resolve every one of the 85 server findings. That is acceptable: TIM-46's
  acceptance is "clean **or documented exceptions**". Forcing breaking
  transitive fixes is explicitly out of scope.
- **Verification:** `nest build`, `npm run test`, and `npm run lint` on
  `server/`, plus the CI `test` job (server image) and the Phase 1 E2E smoke
  suite ([TIM-7](/TIM/issues/TIM-7)) confirm the server still builds, tests,
  and runs end-to-end with Flutter.
