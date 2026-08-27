## Context

The Phase 07 Feedback screen already posts the validated e-mail/message and bounded optional context through the generated `POST /contact` mutation. It retains values after any rejection, exposes an accessible inline error, and records the error through a static `feedback/contact-submit` breadcrumb.

The 2026-08-25 production investigation measured 12 HTTP 500 responses among 19 `/contact` attempts. A fresh privacy-filtered Tempo read confirms the failing sequence in every retained error trace: Crisp `createNewConversation` returns 201, `updateConversationMetas` returns 400, the Nest handler records `invalid_data`, and `sendMessageInConversation` is never called. The failures came from two clients; no request body was inspected or retained. The server currently forwards every optional field after removing only `undefined`, so two derived values can be invalid despite a valid request: `emailToName()` can produce an empty nickname (for example, a numeric-only local part), and `[].join(",")` produces an empty `calendarIds` value. Any Crisp error escapes as an opaque 500.

The contact path has no feature metric. The shared OpenTelemetry meter and bounded-counter pattern already exist in calendar sync and Firebase delivery. The committed OpenAPI document currently describes only the 201 response. Mobile's shared mutator also prints request bodies in development, which includes contact e-mail and message content.

## Goals / Non-Goals

**Goals:**

- Prevent empty optional/derived metadata from causing Crisp `invalid_data` while preserving the submitted message and useful non-empty context.
- Make remaining Crisp failures explicitly retryable and safe: static 503 response, no submitted data or vendor payload in logs/metrics/client diagnostics.
- Add a bounded success/error signal that identifies which Crisp stage failed.
- Preserve and verify the existing React Native retry interaction with useful typed FR/EN copy.
- Keep the committed OpenAPI contract and generated mobile client synchronized.

**Non-Goals:**

- Redesigning the Suggestions screen or changing navigation, fields, persistence, or success behavior.
- Changing the `SendMessageDto` request shape, storing submissions, introducing a fallback support vendor, or guaranteeing exactly-once delivery across retries.
- Database migrations, native/store/EAS configuration, deployment/CI/infrastructure changes, secret rotation, or legacy Flutter changes.
- Broad observability-stack repair; this change emits one correct bounded application counter only.

## Decision 1 — Normalize the vendor metadata envelope at the Crisp adapter boundary

Build Crisp metadata from the required e-mail plus optional `nickname` and `data`, applying a total non-empty-string normalizer to every derived/optional value. Omit `nickname` when `emailToName()` is empty and omit `calendarIds` when the input array joins to an empty string. Preserve non-empty values and the message itself unchanged. Cover the exact empty-nickname/empty-calendar regression and ordinary enriched path in unit tests.

This belongs in the contact/Crisp adapter rather than the mobile form: `/contact` serves released clients, and vendor-specific validity must not depend on every caller reproducing Crisp rules. It also keeps the public request DTO stable.

*Alternative rejected*: make nickname or calendar IDs required. They are optional diagnostics, and rejecting a user's valid message because enrichment is absent repeats the production failure.

*Alternative rejected*: silently ignore every metadata error and send the message. The e-mail metadata is required for support to reply, so reporting success without a usable conversation would be misleading.

## Decision 2 — Carry a private bounded stage error to one static 503 response

Wrap each Crisp operation with a stage discriminator from a closed union: `create`, `metadata`, or `message`. The service/controller boundary catches only this downstream delivery error, records the bounded outcome, and throws `ServiceUnavailableException` with one static message. It never copies the Crisp error message/body, session ID, request DTO, or user identity into the response or a new log. Validation continues through the global pipe as 400; complete delivery remains 201.

Document 400/503 response semantics on the controller and regenerate `openapi/openapi.json`; regenerate Orval afterward and commit generated output only when it changes.

*Alternative rejected*: preserve 500. A known downstream dependency failure is recoverable and operationally distinct from an unexpected server defect.

*Alternative rejected*: expose Crisp's `invalid_data` reason. It is vendor-shaped, not actionable to the user, and can encourage accidental propagation of downstream payloads.

## Decision 3 — Emit one bounded counter at the endpoint outcome boundary

Add `ContactMetricsService` following the existing server metric-service pattern. `contact_submissions_total` increments exactly once with only `result` (`success`/`error`) and `stage` (`complete`/`create`/`metadata`/`message`). Register it in `ContactModule` and inject it into the contact service. Tests mock the metric and prove one increment for success and each failure stage.

The metric intentionally excludes exception type, HTTP response text, session ID, contact fields, client/device identity, and any dynamic label. This yields a finite eight-combination ceiling and avoids the producer/cardinality defects documented in the rentrée investigation.

*Alternative rejected*: label by raw Crisp reason or e-mail/domain. Those values are unbounded and risk user identification without improving the immediate success/error signal.

## Decision 4 — Keep the mobile state machine and make its privacy/retry contract explicit

The existing `useRecordedAction` path already converts generated-mutation rejection into `false`, retains the form's local state, and re-enables Send. Extend data/UI tests with a real `ApiError(503, staticBody)` and render the failure under both EN and FR. Refine the existing failure string in both catalogs to state that the message was not sent and invite retry; do not add a new screen, dialog, automatic retry, or error-code branch.

Add URL-aware redaction to the shared development API diagnostic seam: `POST /contact` logs method/path/status but never `options.body` or parsed response content that could echo submitted data. Keep ordinary non-sensitive request diagnostics unchanged and cover both paths in `mutator.test.ts`.

*Alternative rejected*: automatically retry the mutation. A late-stage failure can leave an orphan or partial Crisp conversation, so an invisible retry can create duplicates; the existing explicit user retry is safer.

## Decision 5 — Verify the repair without sending a real support message

Use mocked Crisp methods for service/controller regression tests and a mocked mobile mutator for the real generated hook. Regenerate and diff the OpenAPI/Orval artifacts. The existing Maestro flow remains client-validation-only and therefore mail-safe; no simulator or real Crisp request is required to prove this repair. This host has no KVM, and the change adds no new device-only interaction, so no new migration inbox item is needed.

The Applier records the already-established production trace finding in the implementation handoff but does not replay submitted production content, create synthetic production Crisp conversations, or modify production state.

## Risks / Trade-offs

- [Crisp rejects a different non-empty metadata rule] → the endpoint returns a safe 503 and the bounded `stage=metadata` metric exposes recurrence; never broaden telemetry to payload values.
- [A failure after conversation creation leaves an empty/partial Crisp conversation] → do not add an unproven compensating delete; explicit retry may create another conversation, and the metric quantifies the residual rate.
- [OpenAPI response annotations alter generated output unexpectedly] → run server spec generation followed by Orval generation and inspect both sensitive diffs together.
- [Shared mutator redaction hides useful development detail] → redact only the `/contact` request/response payload while retaining method, URL/path, and status.
- [FR/EN copy diverges] → typed catalog parity plus locale-specific component assertions.

## Migration Plan

Ship server normalization, error mapping, metric, contract artifacts, mobile redaction/copy/tests, and current-state documentation in one change. No data migration or deploy act is part of this PR. Rollback restores the previous adapter and contract; it does not need data repair because the change stores nothing. Production verification after normal deployment uses only the bounded contact counter and HTTP status rate, never submitted content or identity.

## Open Questions

None. The trace identifies the failing downstream stage, and the issue fixes product, privacy, and scope constraints.
