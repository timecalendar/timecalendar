## Context

The server currently exposes schools through `SchoolMapper`, which converts the persisted `assistant` slug into a closed legacy `SchoolAssistant` object and throws when the primary slug is unknown. There is no export-guide module, retained catalogue store, or response endpoint. `openapi/openapi.json` is generated from built NestJS output and the React Native client is generated from that committed document. The existing `FeatureFlagService` already returns its supplied default on provider failure, and controller-local literal `/v1` prefixes preserve unversioned Flutter routes.

The approved export-guide specification requires a schema-v1, bilingual, server-owned catalogue; verified static assets; exact retained-version reads; a neutral school reference; and future content-only providers without a mobile release. T1 must implement and prove those server and contract surfaces without changing the database schema, infrastructure, deployed object-storage configuration, Flutter, web behavior, or any live environment.

## Goals / Non-Goals

**Goals:**

- Make one validated immutable FR/EN catalogue representation available by active or exact retained version.
- Enforce all schema-v1 envelope, provider, copy, compatibility, image metadata, byte, dimension, parity, Generic, and initial-selector invariants before publication.
- Ensure assets are present and validated before a catalogue version or its school references can become visible.
- Return exact locale/version representations with deterministic strong ETags and correct `200`/`304` headers.
- Add a required school export-guide reference while preserving known legacy assistant bytes and allowing an unknown raw provider slug to reach the new field.
- Generate and commit the server/mobile contract artifacts using their existing generators.
- Prove behavior against real Postgres and real encoded image bytes at the asset-store boundary.

**Non-Goals:**

- Mobile validation, LKG caching, response-aware transport, provider resolution, screens, navigation, route guards, analytics, or device evidence; those belong to later delivery tickets.
- Live catalogue publication or activation, feature-flag rollout, production/preproduction mutation, deployment configuration, a CMS, or an operator UI.
- A database migration, API-wide NestJS versioning, WebView/AI/runtime-generated content, Groups/custom assistants, `fallbackAssistant` restoration, or Flutter/web changes.
- Regenerating the legacy Dart or JavaScript OpenAPI packages.

## Decisions

## Decision 1 — Own the catalogue in a dedicated path-versioned server module

Add `ExportGuideModule` under `server/src/modules/export-guide/`, registered in `AppModule`, with its own DTOs, validators, catalogue repository, publication service, asset-reader port, and `ExportGuideV1Controller` at the literal path `v1/export-guides`. Do not call `app.enableVersioning()` and do not place guide pages in school responses.

The controller accepts only `locale=fr|en`, integer `clientSchema=1`, and an optional opaque `catalogueVersion`. Unsupported locale/schema input returns a bounded client error; a missing retained exact version returns `404`; a disabled flag, absent active version, invalid loaded snapshot, or repository/asset dependency failure returns a sanitized `503` with no fallback catalogue body. The endpoint requires no calendar token or user identity.

Alternative: put the route in `SchoolModule`. Rejected because catalogue publication, retention, images, and representation caching are independently owned and would turn the school module into a content subsystem.

Alternative: enable NestJS global versioning. Rejected because released Flutter clients still use unversioned routes and ADR 051 requires literal controller prefixes.

## Decision 2 — Publish immutable bilingual bundles through one atomic active snapshot

A catalogue version is a server-owned bundle containing the FR manifest, EN manifest, and the school-reference projection rules for that same opaque version. Version directories are immutable: attempting to publish an existing `catalogueVersion` with any content is rejected. A repository snapshot holds the active version plus the retained-version index; each request captures one snapshot before reading a locale or mapping schools, so one response cannot mix pointers or versions.

The publication service performs this sequence: parse and validate both manifests; assert structural parity and publication invariants; load the current visible schools from real Postgres and validate the reference projection for every row; read and validate every distinct referenced asset; write the immutable version; then replace the active pointer/snapshot once. Any failure before the last step leaves the previous active snapshot unchanged. Old versions and assets remain readable for at least 24 hours plus the configured server/CDN cache age; pruning refuses versions still active or referenced by a visible school snapshot.

The production implementation reads server-owned versioned files packaged with the built server. A filesystem-backed local/test store uses write-to-staging plus same-directory atomic rename so publication ordering and rollback can be exercised without adding cloud credentials or deployment configuration. A delivery may add a validated version to the server image, but this ticket does not invoke a live publisher or change a deployed pointer/flag.

Alternative: add catalogue and pointer tables. Rejected because the approved scope expects no schema migration and a CMS/database authoring system is a non-goal.

Alternative: mutate one manifest in place. Rejected because concurrent school/catalogue reads could observe mixed versions, exact-version lookup would be unreliable, and rollback would overwrite the evidence it needs.

## Decision 3 — Preserve school compatibility through a dual projection

Add `SchoolExportGuideRefV1 { providerSlug, requireProgramme, requireConnect, catalogueVersion }` as a required property of `SchoolForList`. The provider slug comes from the raw persisted `School.assistant` value and is never narrowed through the legacy allowlist. The gate booleans retain the legacy meanings (`requireCalendarName` and `requireIntranetAccess`) for known assistants, and the catalogue version comes from the single snapshot captured for the school response.

For known assistant slugs, `assistant` and optional `fallbackAssistant` remain byte-for-byte identical to current serialization. For an unknown primary slug, the new reference preserves that raw slug while the legacy field serializes the existing Generic assistant shape as a compatibility fallback; conservative Generic gates are used in the new reference. `fallbackAssistant` and `isNative` never influence the export-guide reference. This removes the current unknown-primary exception without altering any known legacy row.

School list, single-school, and SEO-search responses all use the same mapper input snapshot, and the list maps every row against one captured version. If no valid active snapshot exists, school serialization fails closed rather than inventing a version or omitting the required object.

Alternative: expand the `SchoolAssistant` allowlist for each future provider. Rejected because it would couple content-only catalogue growth to a server/mobile release and repeat assistant terminology in the new contract.

Alternative: omit `exportGuide` when unavailable. Rejected because generated clients must receive a strongly required object and an optional value would turn a server configuration error into ambiguous client behavior.

## Decision 4 — Validate assets from bytes behind an injectable first-party boundary

Manifest validation first rejects non-HTTPS URLs, credentials, fragments, query strings, non-default ports, overlong URLs, or origins outside the exact origin derived from the existing public asset boundary. Publication then reads the final object through an `ExportGuideAssetReader` port, with redirect following disabled and bounded response size/time. The validator compares the response media type and encoded byte count with the manifest, decodes the bytes, and verifies PNG/JPEG/static WebP format, single-frame/static behavior, dimensions, and pixel count. Thumbnail and page-image byte ceilings remain distinct.

Use a maintained decoder that exposes format, dimensions, and animation/page metadata instead of hand-parsing image containers; commit its server lockfile change and keep the dependency inside the publication validator. Tests use actual small encoded PNG/JPEG/WebP fixtures through the filesystem-backed asset reader, while controller unit tests replace only the repository/service seam. This proves the security boundary with real bytes without touching deployment storage or credentials.

Alternative: trust manifest metadata, extensions, or upload `Content-Type`. Rejected because those do not prove static decoding, actual byte size, or declared dimensions.

Alternative: duplicate-download images on the mobile client. Rejected because the server publication boundary owns byte validation and later mobile work validates only declared metadata before `expo-image` loads the URL.

## Decision 5 — Hash the exact serialized representation and treat conditional reads strictly

After validation, serialize each locale/schema/version representation once with stable property and provider order, enforce the 512 KiB UTF-8 ceiling, and compute a SHA-256 digest over those exact bytes. Emit the quoted digest as a strong ETag. A request returns `304` only when `If-None-Match` contains that exact strong tag; weak validators do not match. Both `200` and `304` carry the same `ETag` and exact `Content-Language`, while `304` has no body.

Do not derive the tag from timestamps, object identity, or the other locale. The representation cache is keyed by locale, schema, and catalogue version, so repeated reads and rollback to a retained version reproduce the same tag.

Alternative: use Nest/Express automatic weak ETags. Rejected because the contract requires stable strong validators tied to the exact localized representation.

## Decision 6 — Gate availability through the existing fail-closed flag service

Define one module-owned feature-flag key and call `FeatureFlagService.evaluateFlag(key, false)` before exposing a catalogue. A missing flag, malformed provider result, thrown evaluation, or catalogue dependency error is disabled/fail-closed. Tests prove both the existing service default-on-error behavior and the export-guide controller/service behavior; implementation must not seed, enable, or mutate the production flag.

Alternative: let endpoint availability imply rollout. Rejected because publication and user-journey activation are separate operational acts and failure must never expose a manual-import bypass.

## Decision 7 — Generate both committed contract surfaces in server-first order

Annotate DTOs and controller responses so the Nest Swagger plugin emits literal `schemaVersion: 1`, tagged `kind: "pages"`, locale and MIME enums, required school references, `200`/`304` headers, request query parameters, and bounded error responses. Start only Postgres and Redis, run `server/npm run generate:openapi` from built output, inspect the generated diff, then run `mobile/npm run generate`. Never edit `openapi/openapi.json` or `mobile/src/api/generated/` directly.

The generated React Native operation may continue through the current default mutator in T1. The response-aware `304` transport override and mobile repository narrowing remain T2 scope; T1 owns only the accurate generated types/operation and drift lockstep.

Alternative: hand-shape generated files to get the desired types. Rejected because both CI drift gates would overwrite the edits and the committed spec is the single contract source.

## Risks / Trade-offs

- **[A packaged file store is mistaken for live publication infrastructure]** → Keep activation and deployment explicitly out of scope; expose publication through a tested service/CLI boundary and do not change environment or infrastructure configuration.
- **[Unknown legacy providers break old clients]** → Preserve exact bytes for every known assistant and serialize Generic only for a previously unserializable unknown primary while retaining the raw value solely in `exportGuide.providerSlug`.
- **[One malformed optional provider invalidates otherwise useful content]** → Publication rejects the entire candidate; runtime defensive isolation belongs to the later mobile parser, while the server never activates partially valid content.
- **[Native image decoding adds install/build cost]** → Use one narrow maintained dependency, validate it under Node 24 and the server image build, and keep decoding off the request path.
- **[School rows change after bundle validation]** → Capture one catalogue snapshot per response and derive each reference from the raw current row plus immutable version; publication integration tests cover concurrent pointer replacement and uniform list versions.
- **[Generated OpenAPI cannot express a header or literal precisely]** → Add explicit Swagger response decorators where inference is insufficient, inspect the emitted JSON, and lock the result with focused contract assertions plus both drift checks.
- **[Retention pruning removes a version still legal for mobile LKG]** → Make the minimum retention formula executable with controlled-clock boundary tests; active/referenced versions are never eligible.

## Migration Plan

1. Land the module, versioned non-live catalogue data/fixtures, validators, publication boundary, school projection, endpoint, tests, and generated artifacts dark behind the disabled-by-default flag.
2. Do not publish to or mutate production/preproduction and do not change deployed object-storage, feature-flag, or active-pointer configuration in this PR.
3. A separate rollout issue may upload validated immutable assets and versions, select an active version, then enable the flag for compatible clients after T1–T4 evidence is complete.
4. Rollback of code is a repository revert. Operational rollback, when separately authorized later, repoints to a retained validated version before any eligible pruning; it never rewrites a version.

## Open Questions

None. The approved specification fixes the wire schema, validation bounds, compatibility posture, rollout separation, and generated-artifact ownership; implementation choices above fit the existing repository without a scope-expanding migration or infrastructure edit.
