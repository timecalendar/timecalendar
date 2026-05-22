## Why

[TIM-72](/TIM/issues/TIM-72) triaged 49 open Dependabot alerts into three
workspace batches. This change is **Batch B** ([TIM-113](/TIM/issues/TIM-113)) —
the `server/` (NestJS) workspace, **25 alerts** (9 High / 14 Moderate / 2 Low).

Every advisory here was a *documented exception* of the Phase 2 B9 server
upgrade ([server-dependency-upgrade](/TIM/issues/TIM-60)): B9 cleared every
non-breaking finding and recorded these five clusters as deferred because each
needs a breaking-change major bump. Batch B does those breaking bumps.

## What Changes

A single focused security-remediation pass on `server/package.json` +
`server/package-lock.json`. No framework/toolchain change — NestJS, TypeScript,
ESLint, `firebase-admin` all stay on their B9 baseline.

- **`node-ical` `^0.14.1` → `^0.26.1`** — clears **15 `axios` advisories**.
  `node-ical@0.14` nests `axios@0.24.0`; `node-ical@0.26` drops `axios`
  entirely (deps are now `rrule-temporal` + `temporal-polyfill`). The server's
  own `axios@^1.16` was never affected. node-ical 0.14→0.26 changes recurrence
  handling, but `parse-ical.ts` does not expand recurrences — it maps top-level
  `VEVENT`s only and no `.ts` source touches `rrule` — so the blast radius is
  the 4 `parse-ical` unit tests (see `design.md`).
- **`nodemailer` `^6.9.4` → `^8.0.7`** + **`@types/nodemailer` `^6.4.4` →
  `^8.0.0`** — clears **4 `nodemailer` advisories** (major 6→8).
- **`@opentelemetry/sdk-node` `^0.57.1` → `^0.218.0`**,
  **`@opentelemetry/auto-instrumentations-node` `^0.55.2` → `^0.76.0`**,
  **`@opentelemetry/exporter-trace-otlp-http` `^0.57.1` → `^0.218.0`** — clears
  **3 High OTel advisories** (`exporter-prometheus` rides along transitively).
  `@opentelemetry/resources` jumps to 2.x, which removes the `Resource` class
  constructor — `tracer.ts` migrates `new Resource()` → `resourceFromAttributes()`.
- **`uuid` `^9.0.0` → `^14.0.0`**; **`@types/uuid` removed** — `uuid@14` ships
  its own type declarations, so the separate `@types/uuid` package is dead
  weight. Clears **1 `uuid` advisory**. Supersedes Dependabot PR **#92**.
- **`ws` → `^8.20.1`** via an npm `overrides` entry — clears **1 `ws`
  advisory**. `npm update ws` cannot reach the patched line on its own:
  `ws` is transitive through `engine.io-client`, which pins `ws@~8.17.1`.
- **`ai` `^5.0.30` → `5.0.52`** (exact pin) — clears **1 `ai` advisory**. The
  exact pin is deliberate: B9 documented that floating `ai` higher pulls
  `@ai-sdk/gateway` 2.x and skews the `@ai-sdk` `Tool` generic types against
  `@ai-sdk/openai@2.0.23`, breaking `nest build`. `ai@5.0.52` keeps
  `@ai-sdk/provider@2.0.0`, so the build stays green.

## Capabilities

### Modified Capabilities
- `server-dependency-baseline`: adds the requirement that the server's
  security-sensitive runtime and observability dependencies are kept on
  patched, maintained majors, and records the Batch B target versions.

## Impact

- `server/package.json` + `server/package-lock.json` — 8 dependency
  constraints bumped, `@types/uuid` removed, one `overrides` entry added.
- `server/src/config/observability/tracer.ts` — `new Resource()` →
  `resourceFromAttributes()` (OTel `@opentelemetry/resources` 2.x API).
- No other server source change intended. The regression gate is
  `nest build` + `npm run test` + `npm run lint` green, the 4 `parse-ical`
  unit tests green, and the Phase 1 E2E smoke suite
  ([TIM-7](/TIM/issues/TIM-7)) green in CI.
- No `app/`, `web/`, or `openapi/` change.
