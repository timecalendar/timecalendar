## Why

At rentrée, students frequently paste an ADE login page, encrypted web-UI link, dead
short link, or URL on a renamed host instead of a usable iCal feed. The server currently
reduces these known cases and genuine university outages to generic fetch errors, leaving
the React Native app able to offer only “check the URL and retry” when retrying cannot help.

## What Changes

- Classify known school hosts and non-secret path shapes before/during calendar creation,
  including Rennes’ current `planning.univ-rennes.fr` host and the documented Tours,
  Réunion, Montpellier, UBE, Lyon 2, Saint-Étienne, Bordeaux INP, and Toulouse 3 cases.
- Return a small, documented calendar-import error body that distinguishes an unsupported
  link shape from an upstream outage and carries a stable school/help identifier. It never
  echoes a submitted URL, query string, credential, resource identifier, or upstream body.
- Map recognized errors in the React Native calendar-sources data seam to accessible,
  school-specific FR/EN recovery guidance and an appropriate action; retain a generic
  retryable state for unclassified/network failures.
- Treat expected, user-correctable link-shape errors as product outcomes rather than
  Crashlytics errors. Record only unexpected failures through the existing Firebase seam,
  using bounded error metadata that excludes the source URL and API response body.
- Add server classification/serialization tests, generated-contract drift checks, mobile
  mapping/component tests, deterministic CI proof for recovery states, and a `(HUMAN: …)`
  migration-inbox script for device-only iOS/Android accessibility and native review.
- Update the Architecture Book with the reusable structured import-recovery contract. No
  ADR is planned because this extends the existing generated-client and calendar-sources
  seams without choosing a new costly-to-reverse technology or ownership boundary.

## Capabilities

### New Capabilities

- `server-school-import-recovery`: safe server-side recognition and typed recovery metadata
  for known school link shapes and upstream failures during calendar creation.

### Modified Capabilities

- `mobile-ical-import`: replace the single generic create failure with typed,
  school-specific FR/EN guidance, correct retry behavior, safe observability, and QA proof.

## Impact

- **Server:** calendar creation/fetch classification under `server/src/modules/fetch/` and
  `server/src/modules/calendar-sync/`, including focused tests for all named schools.
- **Contract (sensitive):** `openapi/openapi.json` gains the documented error response and
  `mobile/src/api/generated/` is regenerated; both server OpenAPI export drift and Orval
  generated-client drift must be clean. The success response remains unchanged.
- **Mobile:** `mobile/src/features/calendar-sources/data/` owns decoding/mapping;
  `ui/ical-url-screen.tsx` renders recovery guidance and actions; FR/EN catalogs and tests
  grow. No native dependency or app/store configuration changes.
- **Documentation:** current-state guidance in `docs/mobile/architecture-book/` and one
  device-only QA note in `docs/react-native-migration/inbox/`.
- **Explicitly out of scope:** bypassing school authentication, decrypting or scraping ADE
  web pages, repairing university infrastructure, changing legacy Flutter `app/`, logging
  submitted URLs, and the separate broad date-window/stale-calendar remediation identified
  by the rentrée investigation.
