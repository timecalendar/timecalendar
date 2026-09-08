## Why

React Native cannot enforce the approved native export tutorial until the server can publish a deterministic, localized guide catalogue and attach a neutral guide reference to each school response. This delivery establishes that server-owned contract while preserving released Flutter and web consumers and leaving production rollout inactive.

## What Changes

- Add a schema-v1 export-guide catalogue module with immutable FR/EN versions, strict manifest and static-image validation, Generic invariants, canonical provider ordering, retained exact-version lookup, and a publication flow that validates uploaded assets before atomically moving the active pointer.
- Add `GET /v1/export-guides` with exact locale and client-schema negotiation, active or exact retained-version lookup, stable strong ETags, and matching `Content-Language` behavior for `200` and `304` responses.
- Add a required `exportGuide` reference to every `SchoolForList` response, sourced from the active immutable bundle, while preserving raw provider slugs and keeping all legacy `assistant` and `fallbackAssistant` serialization unchanged.
- Keep feature-flag and dependency failures fail-closed, and ship no production catalogue activation, flag change, environment mutation, schema migration, or deployment configuration.
- Regenerate `openapi/openapi.json` from built NestJS output, then regenerate and commit the React Native Orval client from that contract.
- Add focused unit, controller, real Postgres/asset-boundary integration, compatibility, retention, publication-order, and generated-contract drift evidence.

## Capabilities

### New Capabilities

- `server-export-guide-catalogue`: Defines schema-v1 catalogue validation and publication, active/exact retrieval semantics, school guide references, compatibility guarantees, and committed server-to-mobile contract evidence.

### Modified Capabilities

None.

## Impact

- Primary server areas: a new module under `server/src/modules/`, server-owned versioned manifest and local/test asset fixtures, `SchoolForList` DTO/mapping, the existing fail-closed feature-flag seam, and focused server tests.
- Public API: additive `GET /v1/export-guides` and a required additive `SchoolForList.exportGuide`; existing unversioned routes and legacy assistant fields remain compatible.
- Sensitive generated surfaces: `openapi/openapi.json` and `mobile/src/api/generated/` must be regenerated in that order and remain in drift lockstep; neither may be hand-edited.
- No database migration, new CMS, native/store configuration, object-storage deployment configuration, infrastructure/workflow change, legacy Flutter edit/regeneration, web behavior change, production publication, or rollout action is expected.
