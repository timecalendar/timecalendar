# Tasks

Conventions:
- All paths relative to the repo root; server commands run from `server/`.
- Land in the order below: mechanical low-risk bumps first, then the two that
  need a source change (OTel, then verify), so a regression is isolated.
- If any bump needs more than the localized source change described here,
  **stop and escalate to FoundingEngineer** — do not expand scope.

## 1. Capture the pre-bump audit baseline

- [ ] 1.1 Run `npm audit` in `server/` and record the finding count + the
  axios / nodemailer / OTel / uuid / ws / ai advisory clusters in the apply
  notes, so the post-bump delta is auditable.

## 2. Mechanical bumps — node-ical, nodemailer, uuid, ai, ws

- [ ] 2.1 In `server/package.json` `dependencies`: `node-ical` `^0.14.1` →
  `^0.26.1`; `nodemailer` `^6.9.4` → `^8.0.7`; `uuid` `^9.0.0` → `^14.0.0`;
  `ai` `^5.0.30` → `5.0.52` (**exact**, no caret — see `design.md`).
- [ ] 2.2 In `server/package.json` `dependencies`: `@types/nodemailer`
  `^6.4.4` → `^8.0.0`; **remove** `@types/uuid` (`uuid@14` ships its own
  types).
- [ ] 2.3 Add an `overrides` block to `server/package.json` with
  `"ws": "^8.20.1"` (transitive `~8.17.1` pin from `engine.io-client` blocks
  a plain `npm update ws`).
- [ ] 2.4 Run `npm install` in `server/`.
- [ ] 2.5 Confirm `mailer.service.ts`'s deep imports (`nodemailer/lib/mailer`,
  `nodemailer/lib/smtp-transport`) still resolve under nodemailer 8; confirm
  `uuid` `v4` / `v5` named imports still resolve under `uuid@14`. If a deep
  import breaks, switch it to the package-root export — localized only.

## 3. OpenTelemetry bump + `Resource` API migration

- [ ] 3.1 In `server/package.json` `dependencies`: `@opentelemetry/sdk-node`
  `^0.57.1` → `^0.218.0`; `@opentelemetry/auto-instrumentations-node`
  `^0.55.2` → `^0.76.0`; `@opentelemetry/exporter-trace-otlp-http` `^0.57.1`
  → `^0.218.0`.
- [ ] 3.2 Run `npm install` in `server/`.
- [ ] 3.3 Migrate `server/src/config/observability/tracer.ts`: replace
  `import { Resource } from "@opentelemetry/resources"` +
  `new Resource({ ... })` with `resourceFromAttributes({ ... })` (verify the
  factory name against the installed `@opentelemetry/resources` 2.x package).
  Keep the `NodeSDK` config, instrumentation overrides, and `ATTR_*`
  attributes identical.

## 4. Verify

- [ ] 4.1 `npm run build` (`nest build`) — compiles with no error, including
  `tracer.ts` and `school-profile-generation.service.ts`.
- [ ] 4.2 `npm run test` (jest) — green. The 4 `parse-ical` unit tests are
  the node-ical regression gate; all must pass.
- [ ] 4.3 `npm run lint` — passes with no new error.
- [ ] 4.4 Run `npm audit` again; confirm the axios / nodemailer / OTel /
  uuid / ws / ai clusters are gone. Record the residual count + the delta in
  the apply notes.
- [ ] 4.5 Confirm the diff is limited to `server/package.json`,
  `server/package-lock.json`, `server/src/config/observability/tracer.ts`,
  and this `openspec/` change. No `app/`, `web/`, or `openapi/` change.

## 5. Ship

- [ ] 5.1 Open the PR; confirm CI `Build server image` + `test` jobs and the
  Phase 1 E2E smoke suite ([TIM-7](/TIM/issues/TIM-7)) are green.
- [ ] 5.2 After merge, close Dependabot PR **#92** (uuid 9→14, superseded).

## Implementation notes

<!-- Filled in during apply: pinned versions, audit delta, deviations. -->
