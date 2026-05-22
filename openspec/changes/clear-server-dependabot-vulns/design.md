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

`tracer.ts` also imports `@opentelemetry/api`, `@opentelemetry/resources`,
`@opentelemetry/sdk-metrics`, `@opentelemetry/semantic-conventions`, and the
`-grpc` OTLP exporters **without declaring them** in `package.json` — they
resolve transitively through `sdk-node`. That pre-existing
undeclared-transitive-import debt is **out of scope** for a security batch;
it is unchanged in risk by this change and is recommended as a follow-up.

`tracer.ts` is imported only by `main.ts`, so it is exercised by `nest build`
(compile gate) and the E2E boot, not by the jest unit suite.

## `ai` exact pin

B9 documented that `ai@^5.0.x` floating up to `5.0.188` pulls
`@ai-sdk/gateway@2.x` and breaks `nest build` in
`school-profile-generation.service.ts` via `@ai-sdk` `Tool` generic-type
skew against `@ai-sdk/openai@2.0.23`. `ai@5.0.52` declares
`@ai-sdk/gateway@1.0.29` + `@ai-sdk/provider@2.0.0` — the same `provider`
major the installed `@ai-sdk/openai@2.0.23` resolves — so the type identity
holds. To keep that guarantee deterministic the constraint is the **exact**
version `5.0.52`, not `^5.0.52`. `@ai-sdk/openai` stays at `^2.0.23`.

## `ws` override

`ws` is transitive: `crisp-api` → `engine.io-client` → `ws@~8.17.1`. The `~`
range caps `ws` below `8.18`, so `npm update ws` cannot reach the patched
`8.20.1`. An npm `overrides` entry (`"ws": "^8.20.1"`) forces the patched
line repo-wide. `ws`'s 8.x API is stable, so `engine.io-client` is unaffected.

## Deviations from the TIM-113 brief

- **`@types/uuid` is removed, not bumped.** `uuid@14` ships its own type
  declarations; a separate `@types/uuid` is redundant.
- **`ws` uses an `overrides` pin, not `npm update ws`.** The transitive `~`
  range from `engine.io-client` blocks a plain `npm update`.
- **`ai` is exact-pinned (`5.0.52`), not `^5.0.52`** — see above.
