## Why

Deterministic server OpenAPI generation is blocked when TypeScript tries to emit the
exported `createNodeInstrumentations` declaration and infers a type through a nested
OpenTelemetry installation. The boundary must be portable so the pinned Node 24 build
and contract drift gate do not depend on npm's physical dependency layout.

## What Changes

- Give `createNodeInstrumentations` the smallest explicit public OpenTelemetry return
  type that `NodeSDK` accepts, preventing declaration emit from naming a nested package
  path.
- Preserve the current auto-instrumentation list, disabled integrations, HTTP span
  sanitization hooks, and SDK runtime behavior.
- Add focused regression coverage only where it provides durable proof of the portable
  type boundary, and verify build, tracer tests, and deterministic OpenAPI generation on
  Node `v24.13.0`.
- Require `openapi/openapi.json` to remain byte-identical; no API or generated-client
  semantic change is part of this repair.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openapi-spec-export`: Require the server build used by deterministic spec emission to
  expose portable declaration boundaries and complete without dependency-layout-sensitive
  TypeScript errors, while retaining the existing no-drift contract.

## Impact

- Affected implementation: `server/src/config/observability/tracer.ts`, with focused
  server test/type proof if needed.
- Sensitive surface: deterministic generation of the committed server↔client contract at
  `openapi/openapi.json`; the file is a verification target, not an intended diff.
- No controller/DTO semantics, mobile generated client, runtime observability behavior,
  dependency versions, database schema/migrations, CI/deploy infrastructure, native/store
  configuration, contact code, or legacy Flutter code changes.
- No Architecture Book rule or ADR changes are expected because this is a local portable
  type-boundary repair rather than a reusable architectural decision.
