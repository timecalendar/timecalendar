## ADDED Requirements

### Requirement: Schema-v1 catalogue envelopes are strictly validated before publication
The server SHALL accept only catalogue envelopes with `schemaVersion: 1`, an opaque non-empty ASCII `catalogueVersion` of 1–128 characters, exact locale `fr` or `en`, and 1–50 providers in canonical array order. Provider slugs SHALL be unique, case-sensitive, lowercase values matching `^[a-z0-9][a-z0-9-]{0,63}$`; each provider SHALL have `kind: "pages"`, a trimmed 1–80 character label, a boolean `selectable`, integer compatibility bounds satisfying `1 <= minClientSchema <= maxClientSchema`, and 1–20 pages. Page titles SHALL be trimmed plain text of 1–120 characters and descriptions trimmed plain text of 1–2,000 characters. Unknown object fields MAY be ignored, but an unknown schema version or provider kind SHALL be rejected.

#### Scenario: Valid bilingual schema-v1 pair passes
- **WHEN** FR and EN manifests satisfy every envelope, provider, compatibility, page, Generic, parity, and image rule
- **THEN** the publication validator returns normalized immutable representations in canonical provider order

#### Scenario: Every scalar and collection bound is enforced
- **WHEN** a candidate has an empty/overlong/non-ASCII version, zero or more than 50 providers, a duplicate/invalid slug, an invalid label, invalid compatibility integers, zero or more than 20 pages, or invalid title/description text
- **THEN** publication fails before the candidate becomes visible

#### Scenario: Unsupported tagged content fails
- **WHEN** a candidate has a schema version other than `1`, a provider kind other than `pages`, or executable/rich content outside schema v1
- **THEN** publication rejects the candidate rather than guessing how to render it

### Requirement: Generic and bilingual structural parity are catalogue-wide invariants
Every valid locale SHALL contain exactly one provider with slug `generic`; Generic SHALL be `kind: "pages"`, selectable, compatible with client schema 1, and contain at least one valid page. FR and EN manifests for a version SHALL have identical provider slugs, order, kinds, selectability, compatibility bounds, page counts, and image-role presence. Locale-specific copy and asset metadata MAY differ. The first production catalogue SHALL expose exactly `ade`, `hplanning`, `celcat`, and `generic` as selectable in that order; later immutable versions SHALL accept any data-driven set/order of valid selectable schema-v1 providers while keeping Generic selectable.

#### Scenario: Missing or unusable Generic rejects the pair
- **WHEN** either locale omits Generic or gives it invalid kind, compatibility, selectability, or pages
- **THEN** the entire bilingual version is rejected

#### Scenario: FR and EN structure differs
- **WHEN** the two locales differ in provider order, shape, page count, compatibility, selectability, or image roles
- **THEN** publication rejects the version even when each locale is independently well-formed

#### Scenario: Initial selectable order is exact
- **WHEN** the first production catalogue is validated
- **THEN** its selectable slugs are exactly `ade`, `hplanning`, `celcat`, and `generic` in that order

#### Scenario: Later content-only provider needs no client allowlist
- **WHEN** a later version adds a compatible valid `kind: "pages"` provider and marks it selectable
- **THEN** publication accepts it in the manifest-defined order without changing a server or mobile slug enum

### Requirement: Static instructional images are validated from their actual bytes
An image declaration SHALL use an absolute HTTPS URL no longer than 2,048 characters on the exact approved first-party origin, without credentials, query string, fragment, redirect, or unsupported port. It SHALL declare PNG, JPEG, or WebP MIME; exact encoded byte size; integer width and height from 1–4,096; no more than 8,388,608 pixels; trimmed meaningful `altText` of 1–500 characters; and an optional trimmed caption of 1–500 characters. Publication SHALL read the final object and verify response media type, magic/decoded format, exact byte count, dimensions, pixel count, and single-frame/static behavior. Thumbnail bytes SHALL be 1–262,144 and page-image bytes 1–1,048,576. Every other format, animated WebP, mismatch, redirect, or inaccessible object SHALL fail publication.

#### Scenario: Real static assets agree with declarations
- **WHEN** actual PNG, JPEG, and static WebP fixture objects match their manifest URL, MIME, encoded bytes, dimensions, pixel count, and role limit
- **THEN** the publication validator accepts them

#### Scenario: URL boundary is violated
- **WHEN** an image URL is non-HTTPS, foreign-origin, credentialed, overlong, queried, fragmented, redirected, or uses an unsupported port
- **THEN** publication rejects it without fetching or logging the URL

#### Scenario: Actual object disagrees with metadata
- **WHEN** object headers, magic/decoded format, byte count, dimensions, or pixel count differ from the declaration
- **THEN** publication rejects the candidate before pointer replacement

#### Scenario: Animated or unsupported content is uploaded
- **WHEN** the object is GIF, animated WebP, SVG, AVIF, HEIF/HEIC, PDF, multi-frame content, or another unsupported format
- **THEN** publication rejects it even when its extension or upload header claims an allowed MIME

### Requirement: Publication is immutable, upload-before-pointer, atomic, and retained
The publication service SHALL validate the complete FR/EN pair, every distinct referenced asset, Generic, initial-or-later provider rules, and every visible Postgres school reference before writing a new immutable version. It SHALL write the version only after assets are readable and SHALL replace the active catalogue pointer/snapshot only after the immutable version is complete. Reusing an existing `catalogueVersion` SHALL fail without overwrite. A failed publication SHALL leave the previous active version and school-reference snapshot visible. Retained exact versions and their assets SHALL remain available for at least 24 hours plus the maximum server/CDN cache age, and an active or still-referenced version SHALL never be pruned.

#### Scenario: Upload precedes visibility
- **WHEN** publication is attempted before any referenced asset is present
- **THEN** it fails and neither the candidate version nor its school references become active

#### Scenario: Pointer changes once after complete validation
- **WHEN** every manifest, school reference, and real asset passes validation
- **THEN** the immutable version is written before one atomic active-snapshot replacement exposes its catalogue and school references together

#### Scenario: Failure rolls back visibility
- **WHEN** validation, asset reading, immutable-version writing, or pointer replacement fails
- **THEN** readers continue to observe the previous complete active snapshot and no partial candidate

#### Scenario: Version identity is immutable
- **WHEN** publication requests a `catalogueVersion` already retained
- **THEN** the operation rejects the request and does not overwrite manifests, mappings, assets, or pointer state

#### Scenario: Retention boundary is enforced
- **WHEN** pruning evaluates versions before, at, and after the 24-hour-plus-cache-age threshold
- **THEN** only versions strictly beyond the threshold and neither active nor referenced are eligible for removal

#### Scenario: Rollback selects a retained representation
- **WHEN** the active pointer is replaced with a previously retained validated version
- **THEN** subsequent active reads and school references consistently use that version without rewriting it

### Requirement: The export-guide endpoint negotiates exact representations
The server SHALL expose unauthenticated `GET /v1/export-guides` through a controller-local literal `/v1` prefix while NestJS global versioning remains disabled. The request SHALL require `locale=fr|en` and `clientSchema=1`; `catalogueVersion` SHALL be optional. Omitting the version SHALL read the active snapshot, while supplying it SHALL read that exact retained version or return `404`. The server SHALL NOT fall back across locale, schema, or version. Invalid/unsupported negotiation input SHALL return a bounded client error, and disabled feature flag, missing/invalid active data, or dependency failure SHALL return sanitized `503` without a catalogue body.

#### Scenario: Active exact-locale lookup succeeds
- **WHEN** a client requests `locale=fr&clientSchema=1` without a version and the feature flag and active catalogue are valid
- **THEN** the server returns the active version's FR schema-v1 representation with no authentication requirement

#### Scenario: Retained exact-version lookup succeeds
- **WHEN** a client requests a retained opaque version with its exact available locale and schema 1
- **THEN** the server returns that immutable representation even when another version is active

#### Scenario: Exact version is absent
- **WHEN** `catalogueVersion` names a version that is not retained
- **THEN** the endpoint returns `404` and does not substitute the active version

#### Scenario: Locale or schema is unsupported
- **WHEN** the locale is absent/unsupported, `clientSchema` is absent/non-integer/not `1`, or exact locale content is missing
- **THEN** the endpoint returns a bounded error and does not substitute a language or schema

#### Scenario: Flag or dependency fails closed
- **WHEN** flag evaluation is false/missing/malformed/throws or catalogue loading fails
- **THEN** the endpoint returns sanitized `503` with no active, retained, or fallback catalogue body

### Requirement: Responses use deterministic strong validators and exact language headers
Each locale/schema/version response SHALL be serialized deterministically to at most 512 KiB UTF-8, excluding image bodies. Its quoted SHA-256 digest over the exact response bytes SHALL be the stable strong `ETag`. A `200` SHALL contain that body plus matching `ETag` and `Content-Language`; an exact strong `If-None-Match` match SHALL return bodyless `304` and repeat both headers. Weak or different validators SHALL NOT produce `304`.

#### Scenario: Stable 200 representation
- **WHEN** identical locale/schema/version content is requested repeatedly
- **THEN** every `200` has byte-identical body, identical quoted strong ETag, and `Content-Language` equal to the body locale

#### Scenario: Exact conditional match
- **WHEN** `If-None-Match` contains the exact strong ETag for the requested representation
- **THEN** the server returns `304` with no body and repeats that ETag and exact `Content-Language`

#### Scenario: Weak or foreign tag does not match
- **WHEN** the request carries a weak tag or a strong tag from another locale, schema, or version
- **THEN** the server returns the requested `200` representation rather than `304`

#### Scenario: Encoded body exceeds the ceiling
- **WHEN** deterministic JSON serialization would exceed 512 KiB
- **THEN** validation/publication fails and the oversized representation is never served

### Requirement: Every school response carries a neutral export-guide reference without breaking legacy fields
`SchoolForList` SHALL require `exportGuide` with raw `providerSlug`, `requireProgramme`, `requireConnect`, and the captured active `catalogueVersion`. Known legacy `assistant` and optional `fallbackAssistant` objects SHALL remain byte-for-byte compatible; `fallbackAssistant` and `isNative` SHALL NOT influence `exportGuide`. Known raw assistants SHALL preserve their legacy gate meanings. An unknown raw primary provider SHALL survive unchanged in `exportGuide.providerSlug`, use conservative Generic gate semantics, and serialize the legacy primary assistant as Generic rather than failing the school response. School list, single-school, and SEO-search projections SHALL use one active snapshot per response and SHALL never omit or invent a reference when the snapshot is unavailable.

#### Scenario: Known legacy school is additive only
- **WHEN** a school with a known assistant is serialized before and after the change
- **THEN** all pre-existing fields including `assistant` and `fallbackAssistant` are byte-compatible and only the required `exportGuide` object is added

#### Scenario: Unknown provider reaches the wire
- **WHEN** Postgres contains a school whose raw primary assistant is a valid slug unknown to the legacy assistant catalogue
- **THEN** its response succeeds, `exportGuide.providerSlug` equals that raw value, and the legacy primary assistant uses the Generic compatibility shape

#### Scenario: Legacy fallback is irrelevant to the new reference
- **WHEN** two otherwise identical schools differ only in `fallbackAssistant` or legacy `isNative`
- **THEN** their export-guide provider and gate projection is unchanged

#### Scenario: List mapping is version-atomic
- **WHEN** the active pointer changes concurrently with a multi-school response
- **THEN** every school row in that response carries the same captured catalogue version and no row mixes old/new reference state

#### Scenario: Catalogue snapshot is unavailable
- **WHEN** school serialization cannot obtain one valid active catalogue snapshot
- **THEN** it fails closed without returning a partial list or an `exportGuide` with a missing/fabricated version

### Requirement: Feature-flag evaluation remains disabled on every failure
Export-guide availability SHALL call the existing feature-flag service with default `false`. Missing flags, provider errors, thrown evaluations, and malformed results SHALL remain disabled, and this delivery SHALL NOT seed, enable, or mutate a live export-guide flag.

#### Scenario: Explicit enabled result permits lookup
- **WHEN** the configured export-guide flag evaluates to boolean true and catalogue dependencies are valid
- **THEN** catalogue lookup may proceed

#### Scenario: Any evaluation failure disables lookup
- **WHEN** the flag is missing, false, malformed, or its provider throws
- **THEN** the feature evaluates false and the export-guide endpoint remains fail-closed

### Requirement: The committed OpenAPI and React Native generated client describe the new contract
The implementation SHALL annotate the endpoint and DTOs, regenerate `openapi/openapi.json` from built NestJS output, then regenerate `mobile/src/api/generated/` with Orval. The contract SHALL strongly tag schema version, provider kind, locales, MIME values, required school references, request parameters, response body, `200`/`304` headers, and error responses. Neither generated surface SHALL be hand-edited, and existing operations/types SHALL remain compatible except for the required additive school property.

#### Scenario: Server-first generation produces the client operation
- **WHEN** OpenAPI is generated after the NestJS build and Orval is generated from that committed document
- **THEN** the mobile output contains the typed export-guide operation/schema and required `SchoolForList.exportGuide`

#### Scenario: Contract artifacts are in lockstep
- **WHEN** the server OpenAPI drift check and mobile Orval drift check run on the implementation head
- **THEN** both produce no diff

#### Scenario: Existing consumers remain compatible
- **WHEN** focused Flutter-shaped school JSON and existing generated mobile operations are exercised
- **THEN** legacy school assistant serialization and unrelated endpoints remain unchanged while unknown JSON fields remain ignorable to released clients

### Requirement: Focused automation proves validation, publication, endpoint, compatibility, and integration behavior
The server test suite SHALL cover every catalogue/image bound, duplicate slugs, Generic validity/selectability, FR/EN structural parity, compatibility, immutability, initial exact selectable order, later provider support, publication ordering, rollback, and retention. Controller tests SHALL cover active/exact lookup, locale/schema negotiation, `200`/`304`/`404`, stable ETags, headers, body size, exact-locale failure, flag failure, and dependency failure. Integration tests SHALL use real Postgres plus actual encoded asset files to prove upload-before-pointer visibility, atomic school mapping, rollback/retention, asset validation, and an unknown provider surviving serialization.

#### Scenario: Unit and controller matrices pass
- **WHEN** the focused validator, publication, mapper, feature-flag, and controller suites run
- **THEN** every normative bound and endpoint branch above is exercised without weakening existing assertions

#### Scenario: Real-service integration passes
- **WHEN** the integration suite runs with the repository's real Postgres test harness and filesystem-backed actual image objects
- **THEN** it proves atomic publication/reference visibility, asset-byte validation, rollback/retention, and unknown-provider wire behavior without a mocked database or synthetic metadata-only image

#### Scenario: Scope-sensitive paths remain untouched
- **WHEN** the implementation diff is reviewed
- **THEN** it contains no database migration, deployment/object-storage configuration, infrastructure/workflow, native/store config, legacy Flutter, web behavior, credential, or live activation change
