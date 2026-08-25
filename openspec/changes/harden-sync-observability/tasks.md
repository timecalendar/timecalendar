## 1. Bound identity and upstream dimensions

- [ ] 1.1 Add a pure service-instance resolver under `server/src/config/observability/` that accepts only a length/character-bounded runtime `HOSTNAME` and otherwise returns `unknown`; add table-driven tests for valid pod names, missing values, oversize values, and unsafe characters.
- [ ] 1.2 Add one pure upstream-domain classifier with an explicit finite allowlist derived from the registered school strategies and the only outputs `reviewed-domain | custom | invalid`; test exact matches, subdomains, planted suffixes, mixed case/trailing dots/ports, credentials, malformed schemes, and loopback/private/link-local inputs.
- [ ] 1.3 Replace `CalendarSyncService.parseDomain` with the shared classifier and update `CalendarSyncMetricsService` documentation/types so `calendar_sync_total.domain` can never receive a raw hostname; extend the existing calendar-sync metric assertions for known, custom, and invalid sources.

## 2. Align and configure the telemetry SDK

- [ ] 2.1 Declare every directly imported OpenTelemetry package in `server/package.json`, align SDK/exporters/resources/log API+SDK/semantic conventions with the auto-instrumentation-compatible 0.219/2.8 cohort, regenerate `server/package-lock.json`, and verify `npm ls` has no invalid peer dependency or remaining 0.218 SDK/exporter cohort. Do not take a major dependency bump.
- [ ] 2.2 Refactor the observability bootstrap into a testable SDK configuration that adds sanitized `service.instance.id` to the existing service/environment resource, keeps OTLP/gRPC trace and metric export, and adds an OTLP/gRPC log exporter through a `BatchLogRecordProcessor`; prove enabled/disabled endpoint and resource behavior without sending network traffic.
- [ ] 2.3 Add one idempotent bounded shutdown path tied to Nest termination so the shared SDK flushes traces, metrics, and logs and cannot hang process exit; unit-test repeated shutdown and disabled-telemetry behavior.

## 3. Export sanitized application logs

- [ ] 3.1 Implement a pure bounded log sanitizer with URL/upstream replacement, credential/token/cookie/email/UUID/opaque-ID redaction, structured-key allowlisting, error-class extraction, and depth/item/body-length limits; add negative assertions proving the original synthetic secrets and PII never survive.
- [ ] 3.2 Implement a Nest `LoggerService` adapter that sanitizes before both the existing console behavior and `@opentelemetry/api-logs`, maps every Nest level to an OTel severity, preserves bounded context/error type, and inherits active trace/span correlation; test all levels, correlation, console parity, and exporter-disabled operation.
- [ ] 3.3 Register the logger during server bootstrap without rewriting existing `new Logger(Context)` call sites, keep OTel diagnostic output outside the application logger to prevent recursion, and add a focused bootstrap test proving an existing service/job error reaches the adapter once.

## 4. Repair trace shape and upstream attribution

- [ ] 4.1 Configure outgoing HTTP instrumentation to attach only the shared classifier output as `peer.service` and `upstream.domain`, never a raw URL/host/header, and disable `@opentelemetry/instrumentation-express` layer spans while retaining HTTP, Nest, database, BullMQ, and runtime instrumentation; add configuration/hook tests for known, custom, and invalid requests.
- [ ] 4.2 Wrap the full awaited `CalendarSyncService.sync` operation in one `calendar.sync` active span with bounded `action`, `school`, `upstream.domain`, and `error.type`; end it in `finally`, preserve the current return/throw semantics, and extend success/failure tests to prove attributes and lifecycle.
- [ ] 4.3 Add the committed CI proof test (picked up by the existing server Jest job; no workflow edit) using an in-memory exporter and an HTTP sync request: assert every descendant ends no later than the HTTP server span, the awaited sync span contains upstream/database work, no Express middleware layer spans exist, and no raw URL/token appears in span names or attributes.

## 5. Document operations and architecture

- [ ] 5.1 Create `docs/server/observability.md` with signal names, the complete finite label vocabulary, privacy invariants, and copy/paste VictoriaMetrics queries for per-instance sync rate, aggregate-after-rate, upstream/error breakdown, unexpected-label detection, and reset/collision sanity; show the expected preprod values.
- [ ] 5.2 Add VictoriaLogs and Tempo sections that find a synthetic sanitized error by service/environment/severity/context/trace ID, negatively search for the URL/token/email fixtures, break down slow syncs by bounded upstream, and verify no descendant ends after its HTTP server parent; include stop/rollback criteria.
- [ ] 5.3 Update `docs/mobile/architecture-book/calendar.md` with the server-observability ownership boundary and a link to the runbook: no calendar URL/token telemetry dimensions, no mobile API/local-sync behavior change, and mobile unexpected local failures remain on the Firebase seam.
- [ ] 5.4 Add `docs/react-native-migration/inbox/2026-08-25-sync-observability-preprod-proof.md` tagged `(HUMAN: preprod/prod access)` with the synthetic success/failure procedure, VictoriaMetrics/VictoriaLogs/Tempo expected values, negative privacy checks, and the rule that production rollout stops on mismatch. This deploy-time check is recorded but is not a code-merge blocker.

## 6. Local-green and contract verification

- [ ] 6.1 Run focused telemetry/calendar-sync Jest suites, including the sanitizer and in-memory trace CI proof, and record the exact passing commands/results in the PR.
- [ ] 6.2 Run `cd server && npx tsc --noEmit` and `cd server && npm run lint`; inspect and commit only formatter/lint changes within this issue's server/docs/OpenSpec scope.
- [ ] 6.3 Run `cd server && npm run generate:openapi` and verify `openapi/openapi.json` plus `mobile/src/api/generated/` remain unchanged; any contract drift is a defect because this change has no API surface.
- [ ] 6.4 Inspect the final diff and dependency tree for secrets/certificates, raw fixture PII, unbounded telemetry attributes, and sensitive-surface edits; verify `.github/workflows/`, `terraform/`, `k8s/`, `server/src/migrations/`, `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, and legacy `app/` are untouched.
