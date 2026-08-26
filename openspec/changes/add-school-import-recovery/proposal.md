## Why

Students currently receive the same generic iCal-import failure when they paste a school
login page, encrypted timetable UI, dead short link, or a valid feed whose provider is
down. Rentrée evidence shows this is blocking creation across several schools, while the
current diagnostics also retain or print submitted URLs that can contain credentials and
resource identifiers.

## What Changes

- Classify known unsupported school-link shapes before upstream fetching and classify
  fetch/parse outcomes separately from provider outages, using bounded machine keys.
- Match Rennes calendars on the current `planning.univ-rennes.fr` host while rejecting its
  `/direct/` web UI as an unsupported source shape.
- Return a typed, contract-documented recovery body from failed calendar creation so the
  React Native data seam can select localized guidance without parsing exception text.
- Show accessible FR/EN school-specific recovery for Tours, Réunion, Montpellier, UBE,
  Lyon 2, Saint-Étienne, Bordeaux INP, Toulouse 3, and Rennes, with Retry offered only for
  transient/upstream failures.
- Replace raw calendar-failure URL/error retention and URL-bearing diagnostics with
  allowlisted school, classification, and help keys. The mobile recovery/reporting path
  likewise sends no source URL, credential, school database ID, or timetable resource ID.
- Add deterministic server, mobile component, contract-drift, and CI proof coverage; record
  the no-KVM device-only recovery-state pass as a non-blocking human inbox item.

## Capabilities

### New Capabilities

- `server-calendar-import-recovery`: Defines school-link classification, Rennes host
  matching, typed recovery metadata, safe failure persistence, and bounded telemetry.

### Modified Capabilities

- `mobile-ical-import`: Replaces the generic recorded failure state with typed,
  school-specific localized recovery and privacy-safe observability/report context.
- `mobile-feedback`: Removes attempted calendar URLs and school database IDs from the
  iCal-origin feedback handoff while preserving bounded recovery context.

## Impact

- **Server:** calendar creation/sync and fetch-strategy seams, a school import-recovery
  catalog/classifier, tests, and the calendar-failure persistence model.
- **API contract:** `openapi/openapi.json` and generated
  `mobile/src/api/generated/` change to expose the create-calendar error body; both are
  committed sensitive contract surfaces and must pass drift checks.
- **Database:** a `server/src/migrations/` migration replaces raw failure URL/error columns
  with bounded diagnostic keys and does not copy sensitive legacy values. This is a
  sensitive schema surface and must be called out for review.
- **Mobile:** `calendar-sources` data/UI tests and typed FR/EN catalogs; the existing
  feedback entry point is narrowed to safe recovery context.
- **Architecture documentation:** update `docs/mobile/architecture-book/data.md`,
  `features.md`, and `CHANGELOG.md` for the reusable typed-error/privacy contract. No new
  ADR is expected because the change extends the existing generated-client and layered
  feature seams; the Applier must add one before implementation if that assessment changes.
- **No changes:** no new dependency, native/store config, infrastructure/workflow, or
  legacy Flutter `app/` work; no authentication bypass, protected-page scraping, or TLS
  verification weakening.
