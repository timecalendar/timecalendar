# Add mobile API client (Orval → TanStack Query)

## Why

Foundation step 3 of the RN migration ([01-foundation.md](../../../docs/react-native-migration/01-roadmap/01-foundation.md)): `mobile/` has no API layer, and every Phase 1+ feature that talks to the server depends on one existing. The pattern set here (codegen, HTTP layer, query runtime) is load-bearing — it will be copied by every feature — so it must land before feature work starts (R-6).

Today the OpenAPI spec only exists at runtime (`/api-json` on a live server); the existing `openapi/` pipeline (openapi-generator-cli → typescript-axios) serves web/Flutter and requires a running server to regenerate. The mobile client needs a deterministic, offline-capable codegen path.

## What Changes

- **Server: spec emit script** — a standalone script that instantiates the Nest app without listening, builds the Swagger document (same `DocumentBuilder` config as `server/src/config/swagger.ts`), writes `openapi.json` to the repo, and exits. The committed spec becomes the single shared artifact between server and mobile. Server CI fails if the committed spec drifts from the code.
- **Mobile: Orval codegen** — `orval.config.ts` in `mobile/` reads the committed spec and generates TanStack Query v5 hooks + types into `mobile/src/api/generated/` (committed). HTTP via a custom `fetch` mutator (no axios in mobile) owning base URL injection, headers, and error shaping. Mobile CI fails if generated output drifts from the spec.
- **Mobile: minimal query runtime** — `@tanstack/react-query` v5 installed, `QueryClientProvider` mounted in the root layout, base URL sourced from app config/env, and one smoke verification proving a generated hook executes against the dev server.

Explicitly **out of scope**: offline persister (Phase 1), opinionated query-defaults policy, any feature screens, any change to the existing `openapi/` pipeline (web/Flutter keep using it untouched).

## Capabilities

### New Capabilities

- `openapi-spec-export`: the server can emit its OpenAPI spec to a committed file without a running server or live infrastructure (DB/Redis), with a CI drift guard keeping the file in sync with the code.
- `mobile-api-client`: `mobile/` owns an Orval-generated, fetch-based TanStack Query client derived from the committed spec — generated code committed, drift CI-checked, query runtime wired into the app root.

### Modified Capabilities

<!-- none — mobile-app-scaffold requirements unchanged; this adds new capability on top -->

## Impact

- `server/`: new emit script + npm script; CI workflow gains a spec-drift check. The script must avoid TypeORM/Bull(Redis) connection side effects at module instantiation (test/offline env profile — design decision).
- `openapi.json` (location TBD in design): new committed artifact at the server↔mobile seam.
- `mobile/`: new deps (`orval` dev, `@tanstack/react-query`), `orval.config.ts`, `src/api/` (mutator + generated), root layout gains `QueryClientProvider`; mobile CI gains a codegen-drift check.
- Untouched: `openapi/` pipeline, `web/`, `app/` (Flutter), server runtime behavior.
- Architecture Book: new data-layer entries (codegen pattern, fetch mutator, drift gates) per R-1; ADR if design surfaces a load-bearing fork.
