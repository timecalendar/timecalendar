## 1. Establish the export-guide domain and module boundary

- [x] 1.1 Add `ExportGuideModule` with controller, service, repository/store, publication, DTO/model, validator, and asset-reader subdirectories; register it in `AppModule` and keep the route prefix local to `ExportGuideV1Controller`. Verify the module graph boots in a focused Nest testing module without enabling global versioning.
- [x] 1.2 Define schema-v1 catalogue, provider, compatibility, page, image, query, and school-reference types/DTOs with explicit Swagger tags/enums/literals and no open-ended executable-content field. Verify TypeScript and emitted metadata distinguish schema `1`, kind `pages`, FR/EN, and the three allowed MIME values.
- [x] 1.3 Add the maintained server image-decoder dependency needed for format/dimension/frame inspection and commit the lockfile. Verify installation and `npm run build` under the pinned Node version without adding a client/native dependency.

## 2. Implement pure catalogue and parity validation

- [x] 2.1 Implement pure envelope/provider/page/copy/compatibility validation for the 512 KiB representation, version, count, slug, label, page, title, and description bounds; normalize to an immutable canonical domain value while ignoring additive unknown object fields. Add parameterized tests for both sides of every numeric/text bound, malformed values, duplicate slugs, unknown schema, and unknown kind.
- [x] 2.2 Implement Generic invariants plus FR/EN structural parity across provider order, kind, selectability, compatibility, page count, and asset roles. Add focused tests for every mismatch, missing/invalid/non-selectable/incompatible Generic, and locale-specific copy/assets that remain structurally valid.
- [x] 2.3 Encode the first catalogue's exact selectable order `ade`, `hplanning`, `celcat`, `generic` as publication data validation, while keeping later versions data-driven. Prove a later compatible selectable provider is accepted and ordered without adding it to a client/server catalogue slug enum.
- [x] 2.4 Add the immutable initial FR/EN schema-v1 catalogue content and server-owned mapping data using corrected plain-text meaning from the existing guide evidence; include complete meaningful alt text/captions and verify page counts/order against the approved specification. Do not mutate any live catalogue, environment, or feature flag.

## 3. Validate real static image objects at publication time

- [x] 3.1 Implement URL-policy validation against the exact configured first-party HTTPS origin, rejecting credentials, query, fragment, unsupported port, foreign host, redirects, and overlong URLs before reading bytes. Add tests for each rejection without logging raw URLs.
- [x] 3.2 Implement the bounded `ExportGuideAssetReader` and decoder path that verifies response MIME, magic/decoded PNG/JPEG/static-WebP format, exact encoded bytes, 1–4,096 dimensions, 8,388,608-pixel ceiling, single-frame/static behavior, and thumbnail/page byte limits. Add tests for every mismatch, unsupported format, animated WebP, timeout/oversize/redirect, alt-text, and caption bound.
- [x] 3.3 Add small deterministic local/test PNG, JPEG, static WebP, animated/invalid, and metadata-mismatch fixtures outside credential/certificate paths. Exercise the real filesystem-backed object reader and actual decoded bytes rather than mocking metadata.

## 4. Implement immutable publication, atomic visibility, and retention

- [x] 4.1 Implement the versioned catalogue store and one captured active snapshot containing retained versions and school-reference projection state; reject any attempt to overwrite an existing opaque version. Prove repeated exact reads are immutable and concurrent list mapping cannot mix versions.
- [x] 4.2 Implement publication ordering: validate FR/EN, first/later invariants, every distinct asset, and every visible Postgres school reference; stage the immutable version; then perform one atomic active-pointer replacement. Add failure-injection tests at each step proving the previous snapshot remains visible and no school reference precedes its manifests.
- [x] 4.3 Implement rollback by repointing only to a retained validated version, plus controlled-clock pruning at the inclusive 24-hour mobile LKG window plus configured server/CDN cache age. Prove active/referenced versions are never pruned and candidates become eligible only strictly after the full threshold.
- [x] 4.4 Add a real-service integration suite using the repository's worker-isolated Postgres harness and actual local asset objects to prove upload-before-pointer visibility, successful atomic activation, rollback, retention, and uniform school mapping without a schema migration or cloud/deploy configuration.

## 5. Add exact endpoint and fail-closed flag behavior

- [x] 5.1 Implement exact query parsing for required `locale=fr|en`, required integer `clientSchema=1`, and optional opaque `catalogueVersion`; implement active versus retained lookup with no locale/schema/version fallback. Test valid active/exact reads, invalid negotiation, missing exact locale, and exact-version `404`.
- [x] 5.2 Serialize each locale/schema/version once in stable provider/property order, enforce the UTF-8 body ceiling, and derive a quoted SHA-256 strong ETag from those exact bytes. Test byte/tag stability across repeated reads and rollback, and distinct tags across locale/version representations.
- [x] 5.3 Implement `200` and bodyless `304` responses with identical strong `ETag` and exact `Content-Language`; match only the exact strong validator and reject weak/foreign validators. Add controller tests for all status/header/body combinations and required unauthenticated access.
- [x] 5.4 Gate catalogue exposure through one module-owned key using `FeatureFlagService.evaluateFlag(key, false)`. Add tests for true, false, missing, malformed, thrown evaluation, absent active snapshot, and repository/asset failure; all failures must return a sanitized closed response and must not seed or enable a live flag.

## 6. Add the neutral school reference and compatibility evidence

- [x] 6.1 Extend `SchoolForList` with required `SchoolExportGuideRefV1`, capture one catalogue snapshot per school/list/search service response, and map raw `School.assistant` to `providerSlug`, legacy calendar-name/intranet gates to the neutral booleans, and the snapshot's version. Keep `fallbackAssistant` and `isNative` out of the new mapping.
- [x] 6.2 Preserve byte-identical `assistant`/`fallbackAssistant` JSON for every known legacy slug. For an unknown valid primary slug, preserve it in `exportGuide.providerSlug`, use conservative Generic gates, and serialize the legacy primary field as Generic so `/schools` no longer throws. Add mapper/service/controller tests covering known, null fallback, unknown raw provider, all three school endpoints, and missing-snapshot failure.
- [x] 6.3 Add a focused compatibility fixture that snapshots the complete pre-existing Flutter-shaped school JSON before the additive property and compares every legacy byte/value after mapping; separately prove released-style consumers ignore the new field and an unknown provider reaches the new wire object unchanged.
- [x] 6.4 Extend the real Postgres integration proof with known and unknown provider rows and a concurrent pointer replacement, asserting all returned rows carry one version while legacy known fields remain unchanged.

## 7. Regenerate and lock the server-to-mobile contract

- [x] 7.1 Start only the worktree-scoped Postgres and Redis services, then run `npm run generate:openapi` in `server/` so built NestJS output regenerates `openapi/openapi.json`. Inspect the generated diff for exact query parameters, schema/kind/MIME/locale tags, required school reference, success/error bodies, and `ETag`/`Content-Language` headers; never hand-edit the JSON.
- [x] 7.2 Run `npm run generate` in `mobile/` from the regenerated committed document and commit the resulting export-guide operation/types plus required `SchoolForList.exportGuide`. Do not edit the generated TypeScript or regenerate legacy Dart/JavaScript clients.
- [x] 7.3 Run the server OpenAPI drift command and mobile Orval drift command from a clean generated state; verify both produce no diff and existing generated operations remain unchanged except for the additive school shape.

## 8. Documentation, local green, and CI proof

- [x] 8.1 Update `docs/mobile/architecture-book/data.md` with the current export-guide endpoint/generated-contract ownership and server-first generation order; update the Architecture Book changelog. Record only current reusable rules and add no ADR unless implementation discovers a new costly-to-reverse decision.
- [x] 8.2 Run the focused validator, asset, publication, school compatibility, feature-flag, controller, and real Postgres integration suites; record the exact test commands and confirm every catalogue/image bound, endpoint branch, rollback/retention path, and unknown-provider serialization is green.
- [x] 8.3 Run local green in proportion to the touched surfaces: server build, lint, complete server Jest suite against the documented Postgres/Redis prerequisites, OpenAPI drift; then mobile generation drift and TypeScript. Run `openspec validate add-export-guide-server-catalogue` and `git diff --check`.
- [x] 8.4 Inspect the final diff and generated artifacts for credentials, raw payload/URL logging, migrations, object-storage/deploy configuration, infrastructure/workflows, native/store config, legacy Flutter, web behavior, and activation changes; all must remain absent. Run the repository disclosure scan before every remote PR write.
- [ ] 8.5 After pushing the implementation head, confirm the existing server CI test/OpenAPI drift job and mobile generation/typecheck job execute on that exact SHA and are green. Treat missing contract drift or focused server proof as implementation rework; do not add a human merge gate or perform rollout.
