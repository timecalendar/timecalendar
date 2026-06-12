# ADR-001 — Committed OpenAPI spec + dual drift gates as the server↔mobile seam

> Recorded in the change directory because the ADR log (`decisions/NNN-*.md`, one of the
> five living artifacts) does not exist yet; lift this file there when the five-artifacts
> foundation step creates it.

**Status:** accepted (2026-06-12) · **Triage:** load-bearing (R-4) — every Phase 1+ feature
consumes this seam, and the pattern will be copied verbatim.

## Context

The RN app needs a typed API client. The server's OpenAPI document previously existed only
at runtime (`/api-json` on a booted server); the legacy `openapi/` pipeline regenerates
from a live URL and serves web/Flutter. Mobile codegen needs a deterministic, offline
input, and nothing previously guaranteed that any generated client matched the server code.

## Decision

1. **`openapi/openapi.json` is committed** and is the only contract artifact between
   `server/` and `mobile/`. It is emitted by `server/src/generate-openapi.ts`
   (`npm run generate:openapi`): Nest app instantiated without listening, test env profile,
   shared `createOpenApiDocument()` with the runtime Swagger setup.
2. **The emit runs from the built `dist/`**, not ts-node: the `@nestjs/swagger` CLI plugin
   (nest-cli.json) injects response/property schemas at compile time. A ts-node emit
   produced 9 schemas vs the runtime's 31 — silently dropping every response type. Building
   first makes the committed spec byte-identical to the served `/api-json` (verified).
3. **Drift is unmergeable in both directions** (R-1, encoded as CI not prose):
   - server gate (`test` job): re-emit from the image's dist, `git diff --exit-code openapi/openapi.json`;
   - mobile gate (`test-mobile` job): re-run Orval, `git diff --exit-code mobile/src/api/generated`, then `tsc --noEmit`.
4. **Generated code is committed** (`mobile/src/api/generated/`): fresh clones typecheck
   without codegen; API changes appear as reviewable diffs.

## Alternatives rejected

- **Live-URL generation** (current `openapi/` pipeline style): non-deterministic for CI,
  couples mobile codegen to a booted server, and leaves no reviewable contract artifact.
- **Generate-on-demand (gitignored output)**: every clone/CI run needs the full server
  toolchain (compose, build) before mobile typechecks; API changes stop being visible in
  review. Rejected for build determinism and reviewability.
- **Connection-free emit (mocked DataSource)**: invasive surgery on the module graph for
  zero runtime value; the compose prerequisite already exists for `npm test`. (Boot needs
  only an *existing* test DB — verified against a fresh empty database, no migrations.)

## Consequences / costs

- Server API changes now require regenerating two committed artifacts (spec + generated
  client); the gates make forgetting impossible to merge, and failure output names the
  regen command on each side.
- CI needs a dummy Firebase service-account key to boot the Nest app
  (`ci/generate-dummy-firebase-key.sh`, same approach as the E2E harness).

## Revisit if

- The server gains an auth'd or versioned API surface (spec splitting / versioned specs).
- The legacy `openapi/` pipeline is migrated to read the committed spec (separate change;
  would retire the live-URL path entirely).
- Spec size or codegen time makes committed output painful in review (consider per-tag
  spec splitting or generated-code squashing in PRs).
