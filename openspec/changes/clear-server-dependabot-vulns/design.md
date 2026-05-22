# Design notes

## node-ical 0.14 → 0.26 — recurrence-handling risk

TIM-113 flags node-ical 0.14→0.26 as high-risk because the release reworks
recurrence handling (`rrule` → `rrule-temporal` + `temporal-polyfill`).

Assessment for **this** codebase: the blast radius is small.

- `parse-ical.ts` is the only `node-ical` call site. It calls `parseICS()` and
  maps each top-level `VEVENT` to a `FetcherCalendarEvent`. It reads only
  `start`, `end`, `type`, `datetype`, `uid`, `summary`, `description`,
  `location` — it never reads `rrule` and never expands a recurrence.
- A repo-wide grep for `rrule` / `RRULE` / `recurr` in `server/src/**/*.ts`
  returns **zero** source matches (only `.ics` test fixtures).

So the server consumes school-timetable feeds where every session is a
materialised `VEVENT`; recurrence expansion is not part of the product path.
The risk surface is therefore: does `parseICS()` still return the same scalar
`VEVENT` fields, and does it still resolve `TZID` (the `ical.ics` fixture has
`DTSTART;TZID=Europe/Paris`)? The 4 existing `parse-ical` unit tests
(`empty`, normal, all-day, empty-event — incl. the Paris-tz conversion to
`07:00Z`) are the regression gate. Apply runs them after the bump; any
failure stops the change for re-assessment (fallback: keep `node-ical@0.14`
and pin its nested `axios` to `0.31.1` via `overrides`).

## OpenTelemetry — `Resource` API migration

`@opentelemetry/sdk-node@0.218` pulls `@opentelemetry/resources@2.x`, which
**removes the `Resource` class constructor**. `tracer.ts` currently does
`new Resource({ ... })`. The 2.x replacement is the factory
`resourceFromAttributes(attributes)`. Migration is a one-line import swap plus
the call site:

```ts
import { resourceFromAttributes } from "@opentelemetry/resources"
// ...
resource: resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "timecalendar",
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: APP_STAGE,
}),
```

The exact export name is verified against the installed
`@opentelemetry/resources` package during apply. `NodeSDK`'s config shape
(`traceExporter` / `metricReader` / `instrumentations` / `resource`) is
unchanged across the jump.

The newer `@opentelemetry/semantic-conventions` ships an `exports` map, so its
`/incubating` subpath (where `ATTR_DEPLOYMENT_ENVIRONMENT_NAME` lives) no
longer resolves under the server's classic `moduleResolution`. Rather than
flip `moduleResolution` project-wide for a security batch, the (stable)
attribute key `"deployment.environment.name"` is inlined in `tracer.ts` with
an explanatory comment — incubating conventions are explicitly unstable
exports, so pinning the string is the contained, low-risk choice.

`tracer.ts` also imports `@opentelemetry/api`, `@opentelemetry/resources`,
`@opentelemetry/sdk-metrics`, `@opentelemetry/semantic-conventions`, and the
`-grpc` OTLP exporters **without declaring them** in `package.json` — they
resolve transitively through `sdk-node`. That pre-existing
undeclared-transitive-import debt is **out of scope** for a security batch;
it is unchanged in risk by this change and is recommended as a follow-up.

`tracer.ts` is imported only by `main.ts`, so it is exercised by `nest build`
(compile gate) and the E2E boot, not by the jest unit suite.

## `ai` + `@ai-sdk/openai` move together

B9 documented that bumping `ai` while leaving `@ai-sdk/openai@2.0.23` in place
breaks `nest build` in `school-profile-generation.service.ts`: the `Tool`
generic resolved by the new `ai` stops matching the one the stale
`@ai-sdk/openai` produces from `openai.tools.webSearchPreview()`
(`FlexibleSchema<{}>` vs `FlexibleSchema<never>`). Apply confirmed it —
`ai@5.0.52` on its own still failed to compile.

The fix is the *coordinated* AI-SDK upgrade B9 named as out of its own scope:
`ai` and `@ai-sdk/openai` are bumped together to current — `ai@^5.0.192`,
`@ai-sdk/openai@^2.0.106`. The whole `@ai-sdk` family then resolves to one
internally consistent set (`@ai-sdk/provider@2.0.3`,
`@ai-sdk/provider-utils@3.0.25`), the `Tool` type unifies, and the build is
green with no source change to `school-profile-generation.service.ts`. `ai`
stays on its `5.x` major — the `6.x` major is out of scope.

## `ws` override

`ws` is transitive: `crisp-api` → `engine.io-client` → `ws@~8.17.1`. The `~`
range caps `ws` below `8.18`, so `npm update ws` cannot reach the patched
`8.20.1`. An npm `overrides` entry (`"ws": "^8.20.1"`) forces the patched
line repo-wide. `ws`'s 8.x API is stable, so `engine.io-client` is unaffected.

## `uuid` — 11.1.1, not 14

The brief suggested `uuid@14` ("latest stable") but also gave the real
security floor: "Patched >= 11.1.1". `uuid@14` is **ESM-only** — its
`dist-node` build uses `export` syntax with no CommonJS entry. The server is
a CommonJS project (ts-jest, `module: commonjs`); under `uuid@14` the jest
runtime fails to load every suite that transitively imports `uuid`
(`SyntaxError: Unexpected token 'export'`, 23 suites).

`uuid@11.1.1` is the patched release the brief cites, ships a dual CJS+ESM
build (`exports.node.require` resolves to `dist/cjs/index.js`), and is the
line uuid's own maintainers recommend for CommonJS codebases. It clears the
advisory, needs no jest-config change, and keeps the `v4` / `v5` named-import
API identical. So `uuid` lands at `^11.1.1`.

## Deviations from the TIM-113 brief

- **`uuid` lands at `^11.1.1`, not `14`** — `uuid@14` is ESM-only and breaks
  the CommonJS jest runtime; see above.
- **`@types/uuid` is removed, not bumped.** `uuid@11` ships its own type
  declarations; a separate `@types/uuid` is redundant.
- **`ws` uses an `overrides` pin, not `npm update ws`.** The transitive `~`
  range from `engine.io-client` blocks a plain `npm update`.
- **`@ai-sdk/openai` is bumped alongside `ai`.** The brief lists only `ai`,
  but `ai` cannot move without its companion `@ai-sdk/openai` — see above.
- **node-ical's breaking surface was its TypeScript types, not recurrence
  behaviour.** The brief warned about recurrence handling; apply found
  `parse-ical.ts` needs type-narrowing for node-ical 0.26's stricter
  `VEvent` / `ParameterValue` types, and the 4 unit tests confirm runtime
  parsing is unchanged.
- **OTel needed a second source touch beyond `Resource`.** The newer
  `@opentelemetry/semantic-conventions` `/incubating` subpath no longer
  resolves under classic `moduleResolution` — see above.
