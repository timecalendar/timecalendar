## ADDED Requirements

### Requirement: Schema-v1 catalogue input is defensively parsed into immutable mobile domain values
The mobile export-guide data layer SHALL treat generated catalogue responses and persisted records as unknown input. It SHALL accept only `schemaVersion: 1`, the exact requested locale, an opaque non-empty ASCII catalogue version of 1–128 characters, and 1–50 provider entries in server order with unique valid lowercase slugs. It SHALL enforce trimmed label, compatibility, page-title, page-description, and collection bounds; SHALL ignore additive unknown object fields; and SHALL copy and deeply freeze every accepted value. An unsupported schema, invalid envelope, duplicate slug, request/body locale mismatch, or exact-selector/body-version mismatch SHALL reject the response.

#### Scenario: Valid response is normalized and immutable
- **WHEN** a schema-v1 response satisfies every envelope, provider, Generic, page, image, locale, and requested-version rule and also carries unknown additive fields
- **THEN** parsing returns a copied deeply immutable catalogue in the original server provider order
- **AND** unknown additive fields are ignored

#### Scenario: Envelope or request identity is invalid
- **WHEN** the response has an unsupported schema, invalid version/count, duplicate slug, wrong body locale, or a catalogue version different from an exact request
- **THEN** parsing fails with a bounded reason and returns no renderable catalogue

### Requirement: Image declarations satisfy the complete schema-v1 client boundary
Every accepted thumbnail or page image SHALL use an absolute HTTPS URL no longer than 2,048 characters on an exact compiled first-party origin, without credentials, query, fragment, or non-default port. It SHALL declare PNG, JPEG, or WebP MIME; integer dimensions from 1–4,096 with at most 8,388,608 pixels; a trimmed 1–500 character alternative text; and an optional trimmed 1–500 character caption. Thumbnail encoded bytes SHALL be 1–262,144 and page-image bytes 1–1,048,576. The client SHALL validate only declared metadata and SHALL NOT download image bytes during catalogue parsing.

#### Scenario: Role-specific valid images pass
- **WHEN** thumbnail and page-image declarations use an allowed exact origin and satisfy their respective byte, dimensions, pixel, MIME, alternative-text, and caption bounds
- **THEN** the parser includes copied immutable image declarations in the validated provider

#### Scenario: Unsafe or out-of-bounds image is isolated
- **WHEN** a non-Generic provider contains a foreign, credentialed, queried, fragmented, ported, overlong, unsupported-MIME, over-byte, over-dimension, over-pixel, or invalid-copy image declaration
- **THEN** that provider is classified invalid and excluded from renderable/selectable providers
- **AND** the client performs no image request while parsing

### Requirement: Generic is mandatory while invalid non-Generic providers are isolated
A valid mobile catalogue SHALL contain exactly one `generic` provider that is `kind: pages`, selectable, compatible with client schema 1, and has at least one fully valid page. A missing, malformed, incompatible, non-selectable, unknown-kind, or page-empty Generic SHALL invalidate the entire response. A separately isolatable non-Generic defect SHALL remove only that provider while preserving a resolver-safe rejection reason when its slug can be validated.

#### Scenario: Generic is unusable
- **WHEN** Generic is absent, duplicated, invalid, incompatible, non-selectable, unsupported, or has no valid pages
- **THEN** the entire response is unusable and only a separately matching fresh LKG may recover the load

#### Scenario: Optional provider is unusable
- **WHEN** one non-Generic provider has an unknown kind, is incompatible, or otherwise violates its provider/page/image bounds
- **THEN** the remaining catalogue stays usable when all envelope and Generic invariants hold
- **AND** the invalid provider is absent from the selectable list and indexed by its safe resolver reason when possible

### Requirement: Provider resolution is exact-or-Generic with explicit bounded reasons
The resolver SHALL expose every valid compatible `selectable: true` pages provider in server order without a client slug allowlist. For a listed reference, it SHALL return the matching valid provider with reason `exact`, return Generic with reason `generic` when Generic was explicitly requested, and substitute Generic with reason `missing`, `unknown_kind`, `incompatible`, or `invalid` according to the parsed provider/rejection index. Unvalidated slugs SHALL NOT enter diagnostics.

#### Scenario: Listed provider resolves exactly
- **WHEN** a listed school's requested slug names a valid compatible provider in the exact-version catalogue
- **THEN** the resolver returns that provider with reason `exact`

#### Scenario: Listed provider falls back with its precise reason
- **WHEN** a requested provider is absent, has an unknown kind, is incompatible with schema 1, or is otherwise invalid
- **THEN** the resolver returns valid Generic with the corresponding `missing`, `unknown_kind`, `incompatible`, or `invalid` reason

#### Scenario: Future provider participates without a release
- **WHEN** a later valid catalogue adds a compatible selectable pages provider unknown to the current mobile source
- **THEN** it appears in its server-defined selector position and resolves exactly without a client allowlist change

### Requirement: Active and exact catalogue loads use strict conditional-response semantics
The repository SHALL key a request by requested locale, client schema, and either `active` or `exact:<catalogueVersion>`. A valid `200` SHALL require a strong ETag, matching `Content-Language`, a non-empty body within the encoded 512 KiB ceiling, complete catalogue validation, and exact requested version when applicable, then atomically replace that logical LKG. A `304` SHALL be accepted only when bodyless and when the response/request/candidate strong ETag, requested/body/response language, schema, selector, and exact version all match; acceptance SHALL atomically refresh only that record's validation time. Every other status/header/body combination SHALL become a bounded failure.

#### Scenario: Valid 200 replaces one logical record
- **WHEN** an active or exact request receives a fully valid `200` with strong ETag and matching language/version identity
- **THEN** the repository returns the validated catalogue with source `network`
- **AND** one storage write replaces only the matching locale/schema/selector record

#### Scenario: Fully matching 304 refreshes the candidate
- **WHEN** the request sends a candidate's strong ETag and receives a bodyless `304` repeating the same ETag and language for the same locale/schema/selector/version
- **THEN** the repository revalidates the cached catalogue, refreshes its validation observation atomically, and returns source `not_modified`

#### Scenario: Foreign or malformed 304 is rejected
- **WHEN** a `304` has a body, weak/different/missing ETag, mismatched language, or does not match the request and candidate identity
- **THEN** it is not treated as a cache validation success
- **AND** only the ordinary fresh-LKG failure fallback may return content

### Requirement: Only a fresh matching fully validated LKG may recover a failed request
The LKG registry SHALL persist only fully validated catalogues through `@/storage` and SHALL isolate requested locale, client schema, active-versus-exact selector, resolved exact version, body/response locale, and strong ETag. On timeout, cancellation, network/HTTP failure, empty/malformed/oversized/unsupported response, invalid Generic, or conditional mismatch, the repository MAY return only the matching candidate after parsing it again and proving it fresh. Corrupt, stale, foreign, negative-age, weak-ETag, or first-run-absent records SHALL not render. Active records SHALL never satisfy exact requests even when the resolved body version matches.

#### Scenario: Failed request uses a fresh matching LKG
- **WHEN** the network or response validation fails and the exact request key has a fully revalidated LKG no older than 24 hours
- **THEN** the repository returns that catalogue with source `lkg` and the bounded failure reason

#### Scenario: Foreign or unusable cache fails closed
- **WHEN** the only stored record is corrupt, stale, negative-age, wrong-locale, wrong-schema, wrong-selector, wrong-version, or carries an invalid ETag/catalogue
- **THEN** the repository returns source `none` with no catalogue

#### Scenario: Active and exact entries are isolated
- **WHEN** an active record resolves version V and a school subsequently requests `exact:V`
- **THEN** the active record does not satisfy or revalidate the exact request

### Requirement: LKG freshness has an inclusive 24-hour boundary and a live monotonic clock
LKG freshness SHALL be inclusive at 24 hours. While the current JS process lives, elapsed age SHALL use a process-local monotonic observation combined with persisted UTC wall validation time so wall-clock changes cannot extend freshness. After process or device restart, the monotonic origin SHALL be discarded and freshness SHALL fall back to wall age; a negative age SHALL fail closed. A backward adjustment before restart that remains non-negative MAY extend freshness by that adjustment, and the implementation SHALL document this accepted limitation rather than claim cross-process rollback detection.

#### Scenario: Inclusive boundary is exact
- **WHEN** controlled age is 24 hours minus 1 millisecond, exactly 24 hours, and 24 hours plus 1 millisecond
- **THEN** the first two records are fresh and the last is stale

#### Scenario: Live wall clock rolls backward
- **WHEN** a validated record is observed in the current process, wall time moves backward, and monotonic time advances beyond 24 hours
- **THEN** the record is stale and the wall change does not extend it

#### Scenario: Restart uses bounded wall fallback
- **WHEN** the repository is reconstructed without the prior monotonic observation
- **THEN** it computes age from persisted validation wall time and the new process wall origin
- **AND** it rejects a negative age while accepting the documented non-negative rollback limitation

### Requirement: Resolution snapshots are isolated from cache replacement and journey state is never persisted
Every accepted provider resolution SHALL return a newly copied deeply immutable snapshot containing only the validated locale, catalogue version, resolved provider identity/label/pages, and resolution reason required by a future active journey. Replacing or corrupting the registry or source response after resolution SHALL not alter that snapshot. The repository SHALL NOT persist an import draft, provider selection, page index, completion flag, route state, or snapshot progress.

#### Scenario: Active snapshot survives cache replacement
- **WHEN** a provider snapshot is resolved and the same request key later receives a different valid catalogue
- **THEN** the existing snapshot retains its original version, provider, pages, order, and copy

#### Scenario: Persisted record contains no journey progress
- **WHEN** the LKG registry is inspected after loads and resolutions
- **THEN** it contains only validated catalogue/cache identity and time metadata
- **AND** no draft, selected provider, page index, completion, or route state is present

### Requirement: Data-layer outcomes and diagnostics contain no guide payload
The export-guide data layer SHALL expose only bounded failure/source/reason enums and validated metadata required by its caller. It SHALL NOT log request query values, request/response headers or bodies, cache records, provider/page copy, image URLs, school/programme data, tokens, raw exception messages, or unvalidated slugs. Timeout, caller cancellation, HTTP, malformed, cache-corruption, and success paths SHALL all preserve this rule.

#### Scenario: Distinctive sensitive values never reach logs
- **WHEN** tests exercise `200`, `304`, timeout, cancellation, HTTP, malformed, and corrupt-cache paths using distinctive query, header, body, copy, and asset-URL values
- **THEN** serialized diagnostic calls contain none of those values
- **AND** outcomes contain only the documented bounded enums and validated metadata

