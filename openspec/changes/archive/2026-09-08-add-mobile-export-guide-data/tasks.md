> Every path is relative to the repository root. Run mobile commands from `mobile/`. Read `docs/react-native-migration/05-tech-specs/export-guides.md` (response-aware seam, validation bounds, LKG rules, security, and React Native data verification), this change's design/specs, and the Architecture Book `data.md`, `storage.md`, `testing.md`, `definition-of-done.md`, and `golden-path.md` before implementation. T1's generated client is a fixed input: do not hand-edit `openapi/openapi.json` or `mobile/src/api/generated/**`.

## 0. Confirm the merged contract and clean generation baseline

- [x] 0.1 Confirm the rebased contract exports `exportGuideV1ControllerFindCatalogue`, all schema-v1 catalogue DTOs, and required `SchoolForList.exportGuide`. Verify by naming the exports in a focused type-only test or compile assertion; stop and return to T1 if a required wire field/status/header is absent.
- [x] 0.2 Run `npm run generate` in `mobile/` before changing Orval configuration and assert `git status --porcelain -- src/api/generated ../openapi/openapi.json` is empty. A pre-existing diff is contract drift and is not repaired by hand in T2.
- [x] 0.3 Record the generated export-guide operation's current default-mutator output as the before-state; verify no server, Flutter, web, schema migration, native/store config, Firebase config, infrastructure, or workflow path is added to scope.

## 1. Add the response-aware mutator without changing existing operations

- [x] 1.1 Refactor `mobile/src/api/mutator.ts` around one internal request routine and add exported `ApiResponse<T>` plus `customFetchResponse<T>` per design Decision 1. Preserve base-URL resolution, JSON headers, 15-second timeout, caller cancellation, in-flight reset cancellation, timer cleanup, empty/text/JSON parsing, and the exact existing `customFetch` body-or-`ApiError` behavior.
- [x] 1.2 Enforce the export-guide response's 512 KiB UTF-8 ceiling before JSON parsing and classify malformed/oversized transport input without retaining or interpolating its contents. Verify boundary tests at 512 KiB and 512 KiB + 1 byte, including multibyte input.
- [x] 1.3 Add normalized-path sensitive diagnostics for `/v1/export-guides`: method, path, numeric status when present, coarse duration bucket, and static outcome only. Preserve `/contact` redaction and existing non-sensitive diagnostics exactly. Verify distinctive query, request/response header, raw/parsed body, guide-copy, URL, and exception-message strings are absent from every captured console argument.
- [x] 1.4 Configure only Orval operation `ExportGuideV1Controller_findCatalogue` to use `customFetchResponse`; keep `customFetch` global. Run `npm run generate`, inspect that only `src/api/generated/export-guides/export-guides.ts` changes as the deterministic override output, and never edit it directly.
- [x] 1.5 Extend `mobile/src/api/mutator.test.ts` to own `customFetchResponse` `200`/bodyless `304`/other-status results, `Headers` preservation, empty/text/JSON parsing, byte ceiling, timeout, already-aborted/live caller cancellation, reset cancellation, cleanup, and sanitized diagnostics. Retain direct compatibility assertions for existing `customFetch` success, non-2xx `ApiError`, contact redaction, and non-sensitive logging.

## 2. Build the pure schema-v1 parser and immutable domain

- [x] 2.1 Create `mobile/src/features/export-guides/data/` with small `types.ts`, `parser.ts`, `constants.ts`, and sublayer/feature barrels. Define locale, selector, validated image/page/provider/catalogue, provider-rejection, load outcome, resolution, and pinned-snapshot unions without exporting generated DTO types.
- [x] 2.2 Implement complete envelope validation: body size signal, schema literal, exact requested/body locale, ASCII catalogue version length, exact-selector version, 1–50 providers, unique case-sensitive valid slugs, server order, booleans, integer compatibility bounds, and unknown-field tolerance. Copy and recursively freeze accepted values.
- [x] 2.3 Implement provider/page/copy bounds: `kind: pages`, schema-1 compatibility, label 1–80, pages 1–20, title 1–120, description 1–2,000, all trimmed plain text. Isolate invalid non-Generic providers and retain `unknown_kind`, `incompatible`, or `invalid` by validated slug; reject duplicate/invalid envelope structure.
- [x] 2.4 Implement image declaration validation for thumbnail/page role byte limits, exact supported MIME values, integer dimensions, pixel ceiling, alt/caption bounds, and URL length/HTTPS/credentials/query/fragment/default-port rules. Define an exact compiled first-party origin set from current repository environment contracts; add no runtime expansion and perform no image download.
- [x] 2.5 Enforce exactly one valid/selectable/compatible/pages Generic with valid pages. Verify missing, duplicate, malformed, non-selectable, incompatible, unknown-kind, and page-empty Generic invalidate the whole catalogue while optional-provider defects remain isolated.
- [x] 2.6 Add table-driven `parser.test.ts` coverage for both sides of every numeric/string/collection/image bound, all MIME/URL rejection classes, multibyte body size, unknown fields, future provider acceptance, every Generic failure, non-Generic isolation, mutation-after-parse, and recursive immutability. Keep parser lines/branches at or above 90% without ignore directives.

## 3. Implement ordered provider resolution and pinned snapshots

- [x] 3.1 Implement a pure selectable-provider projection that returns all valid compatible selectable pages providers in server order and contains no ADE/Hyperplanning/Celcat allowlist. Verify initial order and a later server-added compatible provider/reorder/removal.
- [x] 3.2 Implement listed-provider resolution across `exact`, `generic`, `missing`, `unknown_kind`, `incompatible`, and `invalid`, always using the already-valid Generic fallback when exact resolution is unavailable. Never emit an unvalidated slug in a failure/diagnostic value.
- [x] 3.3 Build a newly copied recursively frozen snapshot from each resolution, containing only locale, catalogue version, resolved provider/label/pages, and reason. Verify response mutation and later catalogue/cache replacement cannot alter an earlier snapshot.
- [x] 3.4 Add `resolver.test.ts` covering every reason, invalid/non-selectable Generic rejection through the parser boundary, future content-only providers without a client allowlist, selector order, and pinned-copy isolation at 90% lines/branches.

## 4. Add the backend-bound atomic LKG registry

- [x] 4.1 Add one versioned export-guide LKG registry key to `STORAGE_KEYS` and classify it backend-bound in `STORAGE_KEY_CLASSIFICATION`. Extend `mobile/src/storage/storage.test.ts` so classification coverage and backend reset prove the registry is removed while environment-independent preferences survive.
- [x] 4.2 Implement a total registry decoder/encoder in the export-guide data layer using only `@/storage` string helpers. Canonicalize keys from requested locale, client schema, and `active` or `exact:<version>` selector; revalidate every candidate's request identity, strong ETag, response/body locale, resolved exact version, timestamp, and complete catalogue before use.
- [x] 4.3 Make a valid `200` construct the complete next registry in memory and commit it with one `setString`, replacing only its logical key while preserving other validated active/exact and FR/EN records. Verify a thrown write leaves the previous persisted registry usable and no partial record is observable.
- [x] 4.4 Implement injectable wall/monotonic clocks and process-local observations per design Decision 7. Verify 24h−1ms, exactly 24h, 24h+1ms, live wall rollback/forward change, module/repository restart fallback, accepted non-negative restart rollback, negative age rejection, and observation reset after `200`/accepted `304`.
- [x] 4.5 Add registry/cache tests for invalid JSON/version/shape, non-finite/fractional timestamps, weak ETag, foreign locale/schema/selector/version, active/exact isolation even with the same resolved version, record pruning on safe writes, atomic replacement, and absence of draft/provider selection/page index/completion/route state.

## 5. Implement response narrowing, revalidation, and LKG fallback

- [x] 5.1 Add a repository/loader that calls the generated plain export-guide function (not raw fetch and not a handwritten URL), requests `locale`, `clientSchema: 1`, optional exact `catalogueVersion`, and sends only the matching candidate's strong ETag as `If-None-Match`. Repository tests must mock `customFetchResponse`, not the network.
- [x] 5.2 Narrow `200` only when ETag is strong, `Content-Language` equals requested/body locale, data is present and fully valid, and exact version matches. Return source `network`, perform the atomic replacement, and leave unrelated records isolated.
- [x] 5.3 Narrow `304` only when bodyless and request/response/candidate ETag, requested/body/response locale, schema, selector, and exact resolved version all match. Reparse the candidate, atomically refresh only its validation time, and return source `not_modified`.
- [x] 5.4 Classify network, timeout, caller cancellation, HTTP, empty, malformed, oversized, unsupported-schema, invalid-Generic, language, ETag, version, and storage failures into bounded enums. After each failure, return source `lkg` only for the independently reparsed fresh exact-key candidate; otherwise source `none`. Public operations resolve a bounded outcome and never leak thrown messages/payloads.
- [x] 5.5 Add repository tests for valid `200`; every valid/invalid `304` axis; offline/timeout/cancellation and representative HTTP statuses; malformed/empty/oversized/invalid-Generic results; first-run offline; corrupt/stale/negative/foreign LKG; retry replacement; write failure; exact/active and locale isolation; and inclusive clock boundaries.
- [x] 5.6 Add a concurrency/pinning test proving one accepted snapshot remains immutable while a later request replaces the same cache key. If the repository adds single-flight request coordination, prove overlapping calls issue one generated operation with a controllable deferred promise rather than timers.

## 6. Extend school projection and enforce ownership boundaries

- [x] 6.1 Add `SchoolExportGuideReference` to the school-selection domain and map all four generated fields in `queries.ts`. Extend the real generated-hook/mutator-mock query test with exact gates/version and an unknown valid provider slug; update existing `SchoolListItem` fixtures through shared test builders where practical.
- [x] 6.2 Keep the feature graph acyclic: export-guide data accepts its own request/reference types and does not import school-selection internals; onboarding/UI may later compose public barrels. Verify feature barrels expose only the data API T3 needs and no generated DTO leaks through them.
- [x] 6.3 Extend the existing generated-client boundary lint idiom so only `src/features/export-guides/data/**` may import `@/api/generated/export-guides/**`. Confirm all feature API/storage access stays in `data/`, no feature imports `react-native-mmkv`, and `npm run lint` exercises the rule.

## 7. Privacy and generated-contract proof tests

- [x] 7.1 Add one generated-operation proof that its URL/query construction and headers reach `customFetchResponse`, its return type preserves `ApiResponse<ExportGuideCatalogueV1Dto>`, and other generated operations still call `customFetch`. This test is the CI proof for the Orval override rather than a hand-edited generated assertion.
- [x] 7.2 Across mutator and repository suites, use distinctive locale/version query values, request/response ETags and language headers, provider/page copy, image URLs, raw bodies, cache records, and thrown messages; assert none appears in serialized `console` calls or bounded failure outcomes.
- [x] 7.3 Verify no parser, resolver, repository, or snapshot exports request headers/bodies, cache JSON, unvalidated provider values, or exception objects; run focused coverage and inspect uncovered branches rather than suppressing them.

## 8. Architecture Book and Definition of Done

- [x] 8.1 Update `docs/mobile/architecture-book/data.md` with the response-aware export-guide operation exception, generated override ownership, defensive repository narrowing, exact-version resolution, and payload-free diagnostics while preserving the single-mutator rule.
- [x] 8.2 Update `docs/mobile/architecture-book/storage.md` with the backend-bound validated export-guide LKG registry, atomic single-write replacement, active/exact/locale/schema isolation, inclusive 24-hour rule, monotonic live-process behavior, accepted restart wall-clock limitation, and rebuildable-cache status.
- [x] 8.3 Update `docs/mobile/architecture-book/testing.md` so export-guide repository tests mock `customFetchResponse` while `mutator.test.ts` alone mocks network; update `features.md` with the export-guide data ownership and school-selection projection. Append one current-state entry to `CHANGELOG.md`.
- [x] 8.4 Re-read the ADR policy and add an ADR only if implementation discovers a new costly-to-reverse choice not fixed by the approved export-guide specification/design. Do not create an implementation-history ADR for the local parser/file layout.
- [x] 8.5 Walk `definition-of-done.md`: record type/lint/test/coverage/privacy/docs applicability. Mark Maestro, FR/EN UI strings, UI accessibility, form-factor, performance interaction, and device checks N/A because this ticket exposes no user-visible surface; those belong to T3/T4.

## 9. Local green, scope audit, and CI evidence

- [x] 9.1 Run focused Jest suites for `src/api/mutator.test.ts`, export-guide parser/resolver/repository/cache tests, school-selection query projection, storage classification/reset, and lint-boundary proof. Record exact commands and results.
- [x] 9.2 Run `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage` in `mobile/`; verify `src/features/export-guides/data/**` and shared logic remain at least 90% lines/branches and the global floor remains at least 70%.
- [x] 9.3 Re-run `npm run generate` and assert a clean generated diff at the final implementation head. Run `openspec validate add-mobile-export-guide-data --strict` and `git diff --check` before handoff.
- [x] 9.4 Audit the final diff: only owned mobile data/mutator/Orval/storage/school projection/tests, OpenSpec, and Architecture Book paths are present. Confirm no OpenAPI semantic change, generated hand-edit, server/migration, native/store/EAS/Firebase config, infrastructure/workflow, Flutter, web, activation, feature-flag, production/preproduction mutation, persisted journey progress, or payload logging.
- [x] 9.5 Run the required repository disclosure scan before every remote PR write. After pushing, confirm the mobile CI generation/typecheck/lint/Jest/coverage job runs on the exact implementation SHA and is green; a missing/failed generated-contract or privacy proof is implementation rework, not a human merge gate.
