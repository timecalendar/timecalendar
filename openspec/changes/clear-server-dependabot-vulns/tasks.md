# Tasks

Conventions:
- All paths relative to the repo root; server commands run from `server/`.
- Land in the order below: mechanical low-risk bumps first, then the two that
  need a source change (OTel, then verify), so a regression is isolated.
- If any bump needs more than the localized source change described here,
  **stop and escalate to FoundingEngineer** — do not expand scope.

## 1. Capture the pre-bump audit baseline

- [x] 1.1 Run `npm audit` in `server/` and record the finding count + the
  axios / nodemailer / OTel / uuid / ws / ai advisory clusters in the apply
  notes, so the post-bump delta is auditable. Baseline: **21** (6 high, 14
  moderate, 1 low).

## 2. Mechanical bumps — node-ical, nodemailer, uuid, ai, ws

- [x] 2.1 In `server/package.json` `dependencies`: `node-ical` `^0.14.1` →
  `^0.26.1`; `nodemailer` `^6.9.4` → `^8.0.7`; `uuid` `^9.0.0` → `^11.1.1`
  (the patched floor — the ESM-only `uuid@14` breaks jest; see `design.md`);
  `ai` `^5.0.30` → `^5.0.192` with companion `@ai-sdk/openai` `^2.0.23` →
  `^2.0.106`.
- [x] 2.2 In `server/package.json` `dependencies`: `@types/nodemailer`
  `^6.4.4` → `^8.0.0`; **remove** `@types/uuid` (`uuid@11` ships its own
  types).
- [x] 2.3 Add an `overrides` block to `server/package.json` with
  `"ws": "^8.20.1"` (transitive `~8.17.1` pin from `engine.io-client` blocks
  a plain `npm update ws`).
- [x] 2.4 Run `npm install` in `server/` (a surgical re-resolve — see notes).
- [x] 2.5 Source migrations needed for the new major type surfaces:
  `mailer.service.ts` drops the explicit `Transporter` generic (nodemailer 8
  widened it); `parse-ical.ts` narrows `parseICS()` output to `VEvent` and
  reads node-ical 0.26's `ParameterValue` shape. `uuid` `v4`/`v5` named
  imports unchanged.

## 3. OpenTelemetry bump + `Resource` API migration

- [x] 3.1 In `server/package.json` `dependencies`: `@opentelemetry/sdk-node`
  `^0.57.1` → `^0.218.0`; `@opentelemetry/auto-instrumentations-node`
  `^0.55.2` → `^0.76.0`; `@opentelemetry/exporter-trace-otlp-http` `^0.57.1`
  → `^0.218.0`.
- [x] 3.2 Run `npm install` in `server/`.
- [x] 3.3 Migrated `server/src/config/observability/tracer.ts`:
  `new Resource({ ... })` → `resourceFromAttributes({ ... })`. Also inlined
  the incubating `deployment.environment.name` attribute key — its
  `/incubating` subpath no longer resolves under classic `moduleResolution`
  (see `design.md`). `NodeSDK` config and instrumentation overrides
  unchanged.

## 4. Verify

- [x] 4.1 `npm run build` (`nest build`) — compiles with no error, including
  `tracer.ts` and `school-profile-generation.service.ts`.
- [x] 4.2 `npm run test` (jest) — green: 58 suites, 288 tests, 0 failures.
  The 4 `parse-ical` unit tests (the node-ical regression gate) pass.
- [x] 4.3 `npm run lint` — passes, exit 0, no error.
- [x] 4.4 Run `npm audit` again — see the audit delta in the notes below.
- [x] 4.5 The diff is `server/package.json`, `server/package-lock.json`,
  `tracer.ts`, `parse-ical.ts`, `mailer.service.ts`, and this `openspec/`
  change. No `app/`, `web/`, or `openapi/` change.

## 5. Ship

- [ ] 5.1 Open the PR; confirm CI `Build server image` + `test` jobs and the
  Phase 1 E2E smoke suite ([TIM-7](/TIM/issues/TIM-7)) are green.
- [ ] 5.2 After merge, close Dependabot PR **#92** (uuid 9→14, superseded).

## Implementation notes

### Pinned versions

`node-ical` 0.26.1, `nodemailer` 8.0.7 + `@types/nodemailer` 8.0.0,
`@opentelemetry/sdk-node` 0.218.0 / `auto-instrumentations-node` 0.76.0 /
`exporter-trace-otlp-http` 0.218.0 (the `@opentelemetry/core` + `resources`
transitives ride 1.30 → 2.7.1), `uuid` 11.1.1 (`@types/uuid` removed), `ai`
5.0.192 + `@ai-sdk/openai` 2.0.106, `ws` forced to 8.20.1 via `overrides`.

### Lockfile re-resolve method

The OTel 0.57 → 0.218 jump moves the `@opentelemetry/*` core packages from
1.x to 2.x. npm's incremental resolver could not migrate them while honouring
the old lockfile (`ERESOLVE` peer conflict on `@opentelemetry/core`), and a
full `npm install` regen drifted 32 unrelated within-caret deps. So the 85
`@opentelemetry/*` entries were deleted from `package-lock.json` and
`npm install` re-resolved just that subtree. Verified result: **zero**
unintended direct-dependency drift — only the 9 intended packages and their
transitive subtrees changed.

### Audit delta

| stage          | `npm audit` findings              |
| -------------- | --------------------------------- |
| baseline       | 21 (6 high, 14 moderate, 1 low)   |
| after Batch B  | 10 (10 moderate)                  |

The 11 cleared findings are the axios / nodemailer / OpenTelemetry / ws / ai
clusters and the **direct** `uuid` advisory — the 25 TIM-113 dependabot
alerts. The 10 residual moderates are all one advisory (the `uuid` v3/v5/v6
buffer-bounds-check) carried by **transitive** `uuid` copies under `bullmq`,
`jest-junit`, and the `firebase-admin` → `@google-cloud/*` chain. They are
out of Batch B scope (the brief's `uuid` alert was the direct dependency) and
need upstream releases of those packages — tracked as a follow-up issue.

### Deviations from the plan

- **`uuid` → 11.1.1, not 14** — `uuid@14` is ESM-only and breaks the
  CommonJS jest runtime. `11.1.1` is the patched floor; see `design.md`.
- **`ai` needed its companion `@ai-sdk/openai` bumped too** — bumping `ai`
  alone leaves the `@ai-sdk` `Tool` types skewed; see `design.md`.
- **node-ical's breaking surface was its TypeScript types, not recurrence
  behaviour** — `parse-ical.ts` needed `VEvent` / `ParameterValue`
  narrowing; the 4 unit tests confirm runtime parsing is unchanged.
- **OTel needed a second source touch** — the incubating
  `deployment.environment.name` attribute key was inlined (its `/incubating`
  subpath no longer resolves under classic `moduleResolution`).

### Verification

- `npm run build` (`nest build`) — green.
- `npm run test` (jest) — 58 suites, 288 tests, 0 failures.
- `npm run lint` — exit 0, no error.
- CI `Build server image` + `test` + the Phase 1 E2E smoke suite
  ([TIM-7](/TIM/issues/TIM-7)) run on PR push — must be green before merge.
