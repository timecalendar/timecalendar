## Context

T1 has merged `GET /v1/export-guides`, the required `SchoolForList.exportGuide` reference, and the generated Orval operation/types. The generated operation currently uses `customFetch`, which returns only a parsed body, discards headers, and throws `ApiError` for `304`. That is correct for existing operations but cannot support strict ETag revalidation. The school-selection mapper also omits the new reference, and the mobile app has no export-guide parser, resolver, cache, or snapshot type.

The approved technical specification fixes the schema-v1 bounds, exact locale/version behavior, valid-Generic invariant, 24-hour LKG rule, sanitized diagnostics, and no-client-allowlist posture. This change owns only the mobile data boundary. T3 will own the Stack-scoped journey and UI, while T1-owned OpenAPI/generated shapes are consumed but not hand-edited or semantically changed.

## Goals / Non-Goals

**Goals:**

- Preserve status, headers, and optional parsed data for the export-guide operation while leaving all existing generated operations on the current body-or-`ApiError` contract.
- Turn untrusted generated DTO values into deeply immutable schema-v1 domain values only after complete defensive validation.
- Keep one malformed non-Generic provider from discarding a usable catalogue while retaining enough rejection metadata for exact resolver reasons.
- Load active or exact catalogues, apply strict conditional-response rules, and use only a fresh matching fully revalidated LKG.
- Make freshness immune to wall-clock changes while the current JS process lives and document the accepted restart limitation.
- Expose ordered selectable providers, listed-provider resolution, and copied pinned snapshots without persisting journey state.
- Keep logs and returned failure values bounded to safe enums and metadata.

**Non-Goals:**

- Screens, navigation, route guards, progress/completion state, guide image rendering, analytics events, or Crashlytics wiring.
- Server, OpenAPI, or generated-shape changes; regeneration is only the deterministic result of the Orval operation override.
- Catalogue activation, feature-flag changes, environment mutation, deploy work, migrations, a CMS, Flutter, web, Groups, custom assistants, `fallbackAssistant`, WebView, or AI behavior.

## Decisions

## Decision 1 — Factor one response-aware transport under the existing mutator contract

Add exported `ApiResponse<T> { status, headers, data }` and `customFetchResponse<T>` in `mobile/src/api/mutator.ts`. A shared internal request routine will continue to resolve the runtime base URL at call time, compose caller cancellation with the existing 15-second timeout, set the same JSON headers, parse an optional response body, and clean up timers/controllers. `customFetchResponse` returns the raw HTTP result, including non-2xx and bodyless `304`; `customFetch` adapts that result by returning `data` for successful statuses and throwing the existing `ApiError(status, data)` otherwise.

Only `ExportGuideV1Controller_findCatalogue` receives an Orval operation override naming `customFetchResponse`. The global mutator remains `customFetch`, so regeneration changes only that generated operation's import, return type, request-option typing, and wrappers. The Applier must run generation and review the diff; neither generated code nor OpenAPI is edited by hand.

The response reader enforces the 512 KiB UTF-8 ceiling before parsing the sensitive export-guide path. An empty body becomes `undefined`; an oversized or malformed transport body rejects with a static transport classification rather than carrying raw content. `Headers` is returned as the platform object so the repository can perform case-insensitive `ETag` and `Content-Language` reads.

Alternative: make every generated operation response-aware. Rejected because it changes the established return/error contract across the app and forces unrelated consumers to unwrap results.

Alternative: bypass Orval with a handwritten request. Rejected because the committed generated client is the only server/mobile contract path and drift checks would no longer prove the operation wiring.

## Decision 2 — Sanitize export-guide diagnostics at the shared request edge

The mutator recognizes the normalized pathname `/v1/export-guides`, never the full URL with its query string. Development diagnostics for that path contain only method, normalized path, numeric status when one exists, a coarse duration bucket, and a static transport outcome; they never include request options, query values, headers, parsed/raw bodies, exception messages, provider/page copy, or asset URLs. Existing diagnostics remain byte-compatible for other paths, including the existing `/contact` redaction.

Repository and parser APIs return discriminated success/failure unions with fixed enums. They do not interpolate thrown values or unvalidated slugs. Tests capture all console arguments across success, `304`, HTTP, malformed, timeout, and cancellation paths and search the serialized calls for distinctive query/header/body/copy/URL values.

Alternative: rely on callers not to log failures. Rejected because the current shared mutator logs full URLs and bodies in development, so privacy must be enforced before the payload crosses that diagnostic edge.

## Decision 3 — Parse unknown input into an immutable domain plus provider rejection index

Create `mobile/src/features/export-guides/data/` with pure types and parsing functions. Treat generated DTOs as `unknown` at the feature boundary. Validation covers the encoded-body ceiling supplied by the transport; schema literal, locale and requested-locale agreement; ASCII catalogue version; provider count/order and unique valid slugs; trimmed plain-text bounds; compatibility integers; page bounds; and every image URL, MIME, byte-role, dimension, pixel, alt-text, and caption rule. Unknown object fields are ignored. Accepted objects are copied and recursively frozen so later mutation of a mock/generated response cannot change a validated value.

Image URLs must use HTTPS, no credentials/query/fragment/non-default port, and an exact origin from a small compiled first-party origin set owned by the export-guide data module. The implementation must derive that set from the repository's current public asset environments and cover every compiled entry with positive/foreign-origin tests; it must not read runtime catalogue content to expand the allowlist. No image bytes are downloaded by this layer.

Envelope-wide failures reject the response: unsupported schema, request/body locale or exact-version mismatch, invalid counts/version, duplicate slugs, or missing/unusable Generic. For each non-Generic entry, the parser first captures a valid slug and then either stores a valid compatible pages provider or records one resolver-safe reason (`unknown_kind`, `incompatible`, or `invalid`). Entries whose slug itself is invalid are isolated but cannot be addressed by a valid school reference. This rejection index lets a listed reference receive the specified reason without exposing the rejected payload. The valid provider array retains server order.

Alternative: validate with TypeScript/generated DTO types. Rejected because types disappear at runtime and unknown future fields/kinds can arrive over the network or from corrupt storage.

Alternative: reject the entire catalogue for any provider defect. Rejected because mobile defensive behavior explicitly isolates malformed non-Generic providers while server publication remains stricter.

## Decision 4 — Resolve by valid catalogue contents, never a provider allowlist

The pure resolver exposes the valid compatible selectable providers in canonical server order and resolves a requested listed slug against the valid-provider map plus rejection index. A valid exact match returns reason `exact`. A missing entry or an entry classified as unknown kind, incompatible, or invalid resolves the valid Generic provider with the corresponding reason. An explicit request for `generic` returns Generic with reason `generic`. Generic is never a fallback branch that can fail after catalogue acceptance because its validity/selectability/compatibility/pages are catalogue-wide invariants.

Resolution returns a newly copied, deeply frozen snapshot containing locale, catalogue version, resolved provider slug, label, pages, and reason. It does not return the mutable catalogue object or storage record. This snapshot is safe for T3 to pin while cache replacement occurs and contains no draft, selection, page index, or completion state.

Alternative: enumerate ADE/Hyperplanning/Celcat/Generic in mobile code. Rejected because compatible content-only providers must be addable and reorderable through server data without a release.

## Decision 5 — Persist one versioned backend-bound LKG registry through `@/storage`

Add one known MMKV key for an export-guide LKG registry and classify it backend-bound. The export-guide repository accesses it only through `getString`, `setString`, and `remove` from `@/storage`; it never imports MMKV. One versioned JSON document maps a canonical key derived from requested locale, client schema, and selector (`active` or `exact:<catalogueVersion>`) to records containing the request identity, resolved body version, response language, strong ETag, validated catalogue, and `validatedAt` wall milliseconds.

Every registry read is total: invalid JSON, wrong record version/shape, foreign key fields, invalid timestamps, weak/invalid ETags, or a catalogue that no longer passes the complete parser is ignored and removed on the next safe write. A valid `200` constructs a complete next registry in memory and performs one `setString`, atomically replacing only the matching logical entry while preserving independently validated entries. Active and exact selectors are never interchangeable even when their bodies share a catalogue version. This is a rebuildable cache, not durable user data, and backend reset removes it.

Alternative: put export guides in the existing persisted TanStack Query cache. Rejected because cache acceptance depends on headers, exact selector identity, reparsing, and a monotonic/wall freshness policy that is clearer and independently testable in an owned repository; the generated hook cache must not become the authority.

Alternative: store each selector under a dynamic MMKV key. Rejected because one registered key keeps environment classification reviewable and lets one storage write replace a complete logical record.

## Decision 6 — Make conditional responses strict and fall back only after full failure classification

For every load, read and revalidate the matching candidate first, then send its ETag as `If-None-Match`. A `200` is accepted only when it has a strong ETag, exact `Content-Language`, a body that passes the complete parser, and (for an exact selector) a body catalogue version equal to the requested version. It atomically replaces the logical record.

A `304` is accepted only when its body is absent; the request actually carried the same candidate's strong ETag; response ETag equals it; response language, candidate response/body locale, request locale, client schema, selector, and exact resolved version all match; and the cached body passes validation again. Acceptance updates only that record's validation time and process observation via one registry write. Any other `304` is a failure, never an implicit cache hit.

Network/timeout/cancellation, HTTP statuses other than valid `200`/`304`, empty/malformed/oversized bodies, invalid Generic, and header/identity mismatches become static repository failure enums. After such a failure, the repository may return the separately revalidated candidate only if it is still fresh. A stale, corrupt, negative-age, or foreign candidate is never rendered. The public outcome identifies only safe `source: network | not_modified | lkg | none` and bounded failure/age classifications.

Alternative: return cached content before network revalidation. Rejected because each new journey must attempt a time-bounded revalidation and the cache is only a failure fallback.

## Decision 7 — Combine persisted wall time with process-local monotonic observations

Inject a clock with wall milliseconds and monotonic milliseconds into the repository factory. Persist only UTC wall `validatedAt`. For a record already on disk when the module/process initializes, capture the process wall/monotonic origin and calculate age as `(processWallOrigin - validatedAt) + monotonicElapsed`; reject a negative base age. For a `200` or accepted `304` in this process, store an in-memory observation `{validatedAtWall, observedMonotonic}` and calculate age from monotonic elapsed thereafter. Wall-clock changes after either observation cannot extend freshness.

Freshness is `age >= 0 && age <= 24h`, so `24h - 1ms` and exactly `24h` pass and `24h + 1ms` fails. On process restart the monotonic observation is absent and the newly captured wall origin is the fallback; a backward adjustment made before restart can extend freshness while still non-negative. That bounded limitation is documented and accepted by the approved specification. Tests recreate the repository/module to distinguish live rollback from restart fallback.

Alternative: persist a monotonic timestamp. Rejected because monotonic origins do not survive process or device restart and comparing values from different origins is invalid.

## Decision 8 — Extend school projection without coupling features

Add an immutable `SchoolExportGuideReference` to `SchoolListItem` containing only `providerSlug`, `requireProgramme`, `requireConnect`, and `catalogueVersion`, copied from the generated school DTO. School selection still owns server mapping and the onboarding draft can carry the projected domain value without importing generated types. Focused query tests prove exact mapping, including an unknown valid provider slug and both gate values.

The export-guide data layer accepts its own reference/request types and does not import school-selection internals, preserving an acyclic feature graph. T3 may compose the two public barrels.

Alternative: let onboarding retain the full generated school DTO. Rejected because it breaches the existing minimal domain projection and couples UI/journey code directly to generated contract churn.

## Risks / Trade-offs

- **[Large cached catalogues make one registry write expensive]** → Keep the server body ceiling at 512 KiB, store only validated representations, avoid duplicated journey/progress data, and use one synchronous atomic replacement per successful revalidation rather than per-page writes.
- **[A permissive image origin admits tracking or user-specific URLs]** → Exact compiled HTTPS origins only, with credentials/query/fragment/port rejected and foreign-origin negative tests.
- **[A parser refactor loses resolver reason fidelity]** → Preserve the rejection index as an explicit domain field and parameterize each reason in resolver tests.
- **[Wall-clock rollback across restart extends freshness]** → Reject negative age, use monotonic time for the full live process, document the accepted cross-process limitation, and never claim trusted-time behavior.
- **[Orval override changes unrelated generated clients]** → Regenerate from unchanged OpenAPI, assert the diff is confined to the export-guide operation, and run the final clean drift check.
- **[Sensitive payload reaches a diagnostic before repository sanitization]** → Redact at normalized-path detection inside the shared mutator and test console arguments with distinctive secrets across every transport branch.

## Migration Plan

1. Add the transport and operation override, regenerate the client, and prove existing-operation compatibility before building the repository above it.
2. Add pure parser/resolver/domain logic and exhaustive bound/reason tests.
3. Add the typed LKG registry, storage classification/reset integration, controlled-clock repository tests, and immutable snapshot API.
4. Extend the school projection and public barrels, then update Architecture Book current-state guidance and run focused/full mobile gates.
5. Ship with no rollout act. Code rollback is a repository revert; the backend-bound LKG key is rebuildable and safe to clear.

## Open Questions

None. The approved technical specification fixes the normative cache, validation, resolver, security, and compatibility behavior; the implementation decisions above fit the merged contract and existing owned seams.
