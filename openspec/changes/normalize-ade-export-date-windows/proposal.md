## Why

ADE iCal export URLs often embed the dates selected when the user copied the link. A
narrow or expired `firstDate`/`lastDate` pair later returns no current events, so a valid
calendar fails creation or silently stops refreshing even though its export endpoint and
resource selection remain valid.

## What Changes

- Recognize structurally valid ADE iCal export URLs that carry both `firstDate` and
  `lastDate`, and recompute those parameters at fetch time on creation and every later
  sync.
- Use a bounded rolling window of 12 calendar months before through 12 calendar months
  after the current UTC date. The span is at most 731 days (about 5.3% of the old
  2000-01-01–2038-01-01 span), retaining a year of history and a year of future events
  without asking ADE for an effectively unbounded archive.
- Route the existing generic `nbWeeks` workaround through the same bounded policy instead
  of expanding it to 2000–2038.
- Preserve the original stored URL and all non-date query parameters, as well as existing
  school strategy inheritance, opt-outs, fetchers, project rewrites, and special handling
  for incomplete date pairs.
- Add deterministic parser/renamer, representative school-strategy, creation/resync, and
  Lyon 1 cadence regression coverage.
- Record the device-only import confirmation as a migration inbox item while keeping the
  deterministic server behavior covered in CI.

## Capabilities

### New Capabilities

- `server-ade-export-window`: Recognition and rolling bounded-date normalization of ADE
  iCal export URLs, including composition with generic and school-specific renamers.

### Modified Capabilities

- `server-calendar-sync-policy`: Fetch-time normalization must not change the resolved
  minimum sync interval, including Lyon 1's one-upstream-fetch-per-hour constraint.

## Impact

- **Server:** `server/src/modules/fetch/renamers/`, the generic fetch strategy, and focused
  fetch/calendar-sync tests. The stored calendar URL and public DTOs remain unchanged.
- **Documentation:** the Architecture Book calendar sync contract and a `(HUMAN: …)`
  migration inbox verification note.
- **API, schema, dependencies:** no OpenAPI, generated mobile API, database migration,
  deploy configuration, native configuration, or new dependency changes.
- **Legacy Flutter:** untouched.
