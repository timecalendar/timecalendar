# Design — add-mobile-api-client

## Context

Foundation step 3 (RN migration). The server exposes its OpenAPI document only at runtime (`SwaggerModule` → `/api-json`, see `server/src/config/swagger.ts`); the existing `openapi/` pipeline (openapi-generator-cli → typescript-axios + dart-dio) regenerates from a **live server URL** and serves web/Flutter — it stays untouched. `mobile/` is a standalone npm project (own lockfile, not a workspace member) with Expo Router and no API/state layer yet. There is **no authentication** anywhere in the API path.

Decisions 1–4 below were settled with the user before scoping; this design records rationale and makes them concrete.

## Goals / Non-Goals

**Goals:**
- A committed `openapi.json` as the single server↔mobile contract artifact, regenerable offline-from-the-network (no listening server).
- Orval generating TanStack Query v5 hooks + types into `mobile/`, committed, with CI drift gates on both sides of the seam (R-1: the rule "generated code matches the spec, spec matches the server" is encoded as CI, not prose).
- Minimal query runtime: provider mounted, base URL configurable, one verified end-to-end call.

**Non-Goals:**
- Offline persistence / MMKV persister (Phase 1, school-selection feature).
- Opinionated `QueryClient` defaults (staleTime/retry policy) — deferred until a real feature exercises them.
- Any feature screen; any change to `openapi/`, `web/`, `app/`, or server runtime behavior.
- Auth of any kind (the app has none).

## Decisions

### D1 — Spec emission: standalone Nest script, test env profile
`server/src/generate-openapi.ts` (modeled on lyrochat's equivalent): set `NODE_ENV=test`, `NestFactory.create(AppModule)` **without** `listen()`, build the document, write the spec, `app.close()`, exit. The `DocumentBuilder` setup is extracted from `setupSwagger` into a shared `createOpenApiDocument(app)` so `main.ts` and the script cannot diverge.

- `NODE_ENV=test` selects `testEnvVariables` (`config/constants.ts:13`): local test DB/Redis on the docker-compose ports, `ENABLE_QUEUE=false` — the same prerequisites as the server test suite, no new infrastructure class.
- **Accepted constraint:** `NestFactory.create` resolves DI, which initializes TypeORM/Redis connections, so the script needs the local compose services up — exactly like `npm test`. A fully connection-free emit (mocked DataSource) was rejected as invasive surgery on the module graph for zero runtime value.
- Alternative rejected: keep fetching from a live `/api-json` (current pipeline style) — non-deterministic for CI, couples mobile codegen to a booted server (user decision 1).

### D2 — Spec location: `openapi/openapi.json`
The repo already has `openapi/` as the API-artifacts seam; the committed spec lives there, pretty-printed (stable diffs). The legacy generators in that directory are not migrated to read it — out of scope.

### D3 — Orval: spec file → committed hooks in `mobile/src/api/generated/`
`mobile/orval.config.ts`: input `../openapi/openapi.json`, output `src/api/generated/` (mode: tags-split for reviewable per-controller files), `client: 'react-query'`, `httpClient: 'fetch'`, custom mutator (D4), prettier post-hook. `orval` is a devDependency of `mobile/`; `npm run generate` regenerates. Generated code is **committed** — fresh clones typecheck without codegen, API changes show up as reviewable diffs (user decision 3).
- Hook names derive from Nest's default operationIds (`SchoolsController_findAll` → `useSchoolsControllerFindAll`). Accepted as-is for now; tunable later via Orval's `operationName` override — leaf concern (R-4).
- Versions at scoping time: orval 8.17.0, @tanstack/react-query 5.101.0 — pin against npm at implementation.

### D4 — HTTP layer: custom `fetch` mutator, no axios
`mobile/src/api/mutator.ts` exports the typed `customFetch` Orval calls for every operation. It owns: base-URL prefixing, JSON serialization/headers, and error shaping (non-2xx → typed `ApiError` carrying status + parsed body, so TanStack Query `error` is structured, not a bare `Response`). RN's built-in WHATWG fetch is sufficient — no auth means interceptors buy nothing; axios would be a dependency with no job (user decision 2).

### D5 — Base URL: `EXPO_PUBLIC_API_URL` with production default
A tiny `mobile/src/api/config.ts` resolves `process.env.EXPO_PUBLIC_API_URL ?? "https://api.timecalendar.host:1443"` (the Flutter app's `MAIN_API_URL` default — same backend identity). Dev points it at the local server via `.env`/shell (`EXPO_PUBLIC_*` is Expo's supported inlining mechanism). Known platform gotcha to document where the constant lives: Android emulators reach the host via `10.0.2.2`, not `localhost`.

### D6 — Drift gates, both sides of the seam
- **Server side** (spec ↔ code): a step in the existing `test` CI job (`build.yaml`), after compose-up — run the emit script, `git diff --exit-code openapi/openapi.json`. Runs where DB/Redis already exist; no new job topology.
- **Mobile side** (generated ↔ spec): a new minimal `test-mobile` CI job — `npm ci`, `npm run generate`, `git diff --exit-code mobile/src/api/generated`, `npx tsc --noEmit`. This deliberately seeds the mobile CI job that foundation steps 4–5 (lint, Jest/Maestro) will extend.

### D7 — Query runtime: provider only, defaults stock
`@tanstack/react-query` v5 in `mobile/`; a module-scoped `QueryClient` with **stock defaults**, `QueryClientProvider` wrapping the tree in `src/app/_layout.tsx`. Policy (staleTime, retry, error logging seam) is intentionally not set here — it would be a guess with zero consumers; the first server-read feature earns it (migration-approach principle 5).

### D8 — Smoke verification is a task, not a committed artifact
Proof that the chain works end-to-end (dev server → generated hook → mutator → rendered data): temporarily invoke one cheap generated GET hook (e.g. schools list) from the template screen against the local dev server, verify on simulator, then remove it. Committed proof remains the drift gates + clean `tsc`. A committed demo screen would create i18n/a11y debt before those rules exist (steps 6–7) and pollute the template.

## Risks / Trade-offs

- [Emit script needs live Postgres/Redis] → Same prerequisite as `npm test`, already part of local dev (`npm run setup`) and already provisioned in the CI `test` job. Documented at the npm script.
- [Spec drifts because devs forget to regenerate] → That's exactly what both CI gates catch; the failure message should name the regen commands.
- [Generated-code churn noise in PRs] → Confined to `mobile/src/api/generated/` (single reviewable path); tags-split keeps diffs per-controller.
- [Orval fetch client or Nest-emitted spec has rough edges (e.g. odd schemas, missing operationIds)] → Surface at implementation; leaf fixes via orval `override` options (R-4). If the spec itself is malformed, that's a server bug worth fixing at the source.
- [`EXPO_PUBLIC_API_URL` is inlined at build time] → Acceptable: Flutter does the same via `String.fromEnvironment`; per-variant defaults can move into `app.config.ts` later if needed.
- [Two more places (`spec`, `generated/`) that must move together with server API changes] → The cost of decision 3, paid deliberately for deterministic builds; the gates make desync impossible to merge.

## Migration Plan

Additive only; no deploy or rollback concerns. Server runtime untouched (`setupSwagger` keeps serving `/api-json` for the legacy pipeline). If the change is reverted, delete the script, spec file, `mobile/src/api/`, and CI steps.

## Open Questions

- Does the CI `test` job's compose-up leave `timecalendar_test` created/migrated before the emit step runs, or does the script need the same DB bootstrap the jest suite performs? Resolve at implementation; worst case the drift step reuses the test suite's setup command first.
