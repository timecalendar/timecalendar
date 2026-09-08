## Why

The merged server contract now exposes active and exact-version export-guide catalogues, but React Native still discards response headers, trusts generated DTOs at runtime, and has no isolated last-known-good or provider-resolution layer. This change gives the later native journey a deterministic, privacy-safe data boundary that fails closed without weakening existing generated operations.

## What Changes

- Add an export-guide data feature that defensively parses schema-v1 catalogue envelopes and image metadata, ignores additive unknown fields, isolates invalid non-Generic providers, and rejects an unusable Generic or incompatible envelope.
- Resolve listed school references against their exact catalogue version, preserve server provider order for unlisted selection, and return explicit exact-or-Generic resolution reasons without a client provider allowlist.
- Add response-aware `customFetchResponse<T>` transport while retaining the current `customFetch` body-or-`ApiError` contract for every existing operation; configure only the generated export-guide operation to use the response-aware mutator.
- Persist only fully validated catalogues through the owned storage seam, isolated by requested locale, client schema, and active-versus-exact selector; enforce atomic replacement, strict `304` matching, inclusive 24-hour freshness, live-process monotonic aging, restart wall-clock fallback, and pinned immutable snapshots.
- Project the required generated `SchoolForList.exportGuide` object into the school-selection domain for later journey consumption.
- Add focused mutator, parser, resolver, repository/cache, storage-reset, generated-operation, projection, privacy, and controlled-clock tests at the 90% logic threshold.

## Capabilities

### New Capabilities

- `mobile-export-guide-data`: Defines defensive catalogue validation, exact-version loading, validated LKG behavior, provider resolution, immutable journey snapshots, and sanitized outcomes for the native export-guide journey.

### Modified Capabilities

- `mobile-api-client`: Adds a response-aware generated-operation transport without changing the established contract of existing operations.
- `mobile-school-selection`: Carries the server's neutral export-guide reference in the minimal school domain projection.
- `mobile-storage`: Owns and classifies the rebuildable export-guide LKG record so backend resets cannot retain a foreign catalogue.

## Impact

- Primary code: `mobile/src/features/export-guides/data/`, its public barrels and focused tests; `mobile/src/api/mutator.ts` and direct tests; `mobile/orval.config.ts`; `mobile/src/storage/`; and the school-selection data projection/tests.
- Generated contract: `openapi/openapi.json` and `mobile/src/api/generated/` are T1-owned read/consumed surfaces. The client generator must produce the export-guide operation override; no generated file or OpenAPI document is hand-edited and no contract shape changes here.
- Sensitive shared seams: the API mutator must never log export-guide query values, headers, bodies, copy, asset URLs, or cache data; the new MMKV record remains a backend-bound rebuildable cache behind `@/storage` and is cleared by environment reset.
- Documentation: update the Architecture Book data, storage, testing/feature guidance and changelog for the reusable response-aware transport and validated LKG contract; add an ADR only if implementation discovers a costly-to-reverse decision not already fixed by the approved specification.
- Out of scope: guide UI/routes/journey progress, navigation guards, analytics events, server/OpenAPI changes, client regeneration beyond the deterministic operation override, database migrations, native/store/EAS or Firebase config, workflows/infrastructure, Flutter, web, catalogue activation, feature-flag changes, and production/preproduction mutation.
