## Why

PR #273 is conflict-free at exact head `f5490f34d11576ff81f4da71536cdfb7dfb5eea0`, but
current `main` at `3f550e832b47049ed4db85a0d31a6b49e5971b5d` is not its ancestor. The latest
Reviewer veto therefore remains valid: the same PR needs a third bounded integration cycle so
accepted source recovery cannot merge without current-main contact and tracing fixes.

## What Changes

- Normally merge freshly fetched `origin/main` into PR #273's existing named branch without
  rebasing, force-pushing, replacing the branch, or opening another PR.
- Preserve the accepted source-health behavior and current-main contact response/error,
  privacy, retry, localization, observability, and portable-tracer behavior without product
  changes or unrelated cleanup.
- Reconcile every both-parent surface by semantic union, including `openapi/openapi.json`, the
  generated contact client, FR/EN catalogs, Architecture Book guidance, and OpenSpec
  contracts/archives; preserve ADR 042, ADR 043, and both Calendar contracts unchanged.
- Keep current main's `mobile/app.config.ts` unchanged and prove the committed OpenAPI and
  generated mobile client remain synchronized rather than hand-editing generator output.
- Run focused local and generated-contract drift checks, archive this one-off change, push
  without force, retain `run-e2e`, and require fresh exact-head scheduled CI, Simplifier, and
  Reviewer evidence before the already-authorized autonomous squash merge.
- Do not touch `.github/workflows/`, migrations, credentials or certificates, infrastructure,
  deploy behavior, production data, background-sync operations, or legacy Flutter.

## Capabilities

### New Capabilities

- `same-pr-third-current-main-integration`: one-off requirements for preserving PR #273,
  integrating the current main contract union, and re-establishing exact-head gates.

### Modified Capabilities

None. This reconciliation changes no canonical product requirement.

## Impact

- Integration target: existing PR #273 and branch
  `TIM-186-prod-health-investigation-at-rentr-e-2026-write-docs-investigations-2026-08-25-rentree-prod-health-report`.
- Sensitive coupled contract surfaces: `openapi/openapi.json` and
  `mobile/src/api/generated/`, including the source-health response and current-main contact
  400/503 response semantics.
- Binding documentation: `docs/mobile/architecture-book/` retains ADR 042, ADR 043, source
  recovery, both Calendar contracts, and current-main contact privacy/retry guidance.
- Integrated main-side behavior also includes the server contact implementation, mobile
  feedback retry copy and diagnostics, i18n catalogs, canonical/archived OpenSpec contracts,
  and the portable OpenTelemetry tracer declaration.
- `mobile/app.config.ts` is sensitive native/store configuration and must arrive unchanged
  from freshly fetched main. No schema, dependency, native adjunct, workflow, infrastructure,
  deploy, production-operation, or Flutter change is authored by this cycle.
