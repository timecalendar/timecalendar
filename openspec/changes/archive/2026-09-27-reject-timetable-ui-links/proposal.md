## Why

Known university timetable portal and UI links cannot yield reusable calendar feeds, yet the
server currently spends an outbound request (and sometimes retries) before returning a generic
fetch or empty-calendar failure. In the latest seven-day review, 1,829 known UI-page attempts and
469 malformed or unsupported inputs produced no successful imports, while recognized ADE iCal
exports remained healthy enough that their existing fetch path must stay unchanged.

## What Changes

- Validate submitted calendar sources at the shared server fetch boundary before URL renaming,
  strategy fetchers, retries, or any outbound request.
- Reject malformed URLs and protocols other than HTTP, HTTPS, and the already-supported `webcal`
  scheme with one stable, bounded client-safe failure.
- Reject only explicit host/path combinations proven to be timetable UI rather than feeds:
  Lyon 1 and UBE ADE portals, Montpellier and Rennes direct-planning UI, bare known timetable
  roots, and the Toulouse 3 Celcat calendar UI. Ambiguous paths on other hosts remain eligible.
- Preserve valid generic, ADE, and Celcat export URLs, including `webcal` conversion, bounded ADE
  date-window normalization, school-specific renamers, retry/cadence policy, and parsing.
- Preserve the existing rule that parsed calendars need at least one event and the existing
  `calendar_failure` write of the full submitted URL when new-calendar creation fails.
- Change Toulouse 3's backend-owned school provider mapping from its legacy/generic guidance to
  the existing `celcat` export guide through a narrowly guarded data migration and regression
  test; do not mutate live data outside the normal migration path.

## Capabilities

### New Capabilities

- `server-calendar-source-validation`: Pre-fetch URL validation, exact timetable-UI rejection,
  stable failure behavior, valid export preservation, failure recording, and Toulouse 3 provider
  guidance.

### Modified Capabilities

- `server-ade-export-window`: Source validation must precede renaming without changing recognized
  ADE export normalization or school-strategy composition.

## Impact

- **Server:** the fetch boundary and focused fetch/calendar-sync tests; a small pure source
  classifier beside the fetch module is expected.
- **School/export-guide data:** one targeted migration may update the Toulouse 3 school row to the
  already-published `celcat` provider; catalogue schema and guide content remain unchanged.
- **Documentation:** the Architecture Book calendar boundary records the reusable pre-fetch
  validation contract and points to its enforcing classifier/tests.
- **Sensitive surfaces:** `server/src/migrations/` is intentionally touched for the provider-data
  correction. `openapi/openapi.json` is contract-sensitive but is expected to remain byte-identical
  because the existing calendar endpoint and error envelope are sufficient.
- **Unchanged:** `mobile/**`, the generated mobile client, public DTOs/routes, database schema,
  dependencies, deploy/native/store configuration, infrastructure/workflows, web, and legacy
  Flutter.
