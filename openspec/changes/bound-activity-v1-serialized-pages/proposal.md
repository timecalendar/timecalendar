## Why

The shipped Activity v1 route bounds database rows, but it serializes every selected
`calendarChange` atomically. A single 3,656-change log therefore produced a 1,600,989-byte page at
both tested row limits, exceeding the frozen G7 p99 budget of less than 1 MB; lowering the row limit
cannot correct it.

## What Changes

- Project each oversized calendar log into a deterministic sequence of smaller, independently valid
  `CalendarLogV1` items, then paginate that virtual item stream by both item count and serialized byte
  budget. Ordinary logs keep their existing representation and identity.
- Extend the opaque cursor internally with the next fragment position while retaining the original
  snapshot and `(createdAt, id)` ordering anchors. Fragments from one log stay contiguous and every
  change entry appears exactly once across the cursor chain.
- Give every projected fragment a stable, distinct opaque item id so existing v1 consumers can
  store and render all fragments without overwriting one another. The response schema and request
  schema remain unchanged.
- Keep exact unread counting in calendar-log rows, not response fragments, and preserve the existing
  first-page-only rule.
- Add focused cursor, projection, ordering, identity, and serialized-byte tests, plus a real-route
  deterministic many-change assertion that fails if fragmentation or byte-aware packing is removed.
- Update the Activity capacity truth and the Architecture Book's binding page semantics. Record the
  fragment identity and continuation decision because changing it later can duplicate cached
  Activity history.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-calendar-log-search`: v1 pagination changes from a row-only stream to a deterministic
  byte-bounded projection stream while preserving its public request and response schemas,
  snapshot, ordering, unread, privacy, and legacy compatibility requirements.
- `activity-capacity-gate`: the real-route gate must assert the many-change cohort's serialized
  response pages remain below the frozen G7 threshold and keep evidence aggregate-only.

## Impact

- `server/src/modules/calendar-log/`: v1-only projection, cursor, service/repository continuation,
  mapper, and focused tests. The unversioned service/controller and notification writers remain
  unchanged.
- `server/src/scripts/activity-capacity/`: deterministic real-route serialized-byte assertion and
  aggregate-only reporting; the frozen threshold is unchanged.
- `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md` and
  `docs/mobile/architecture-book/`: current capacity verdict, binding page semantics, changelog, and
  one ADR for stable fragment identity/continuation.
- Sensitive contract surfaces `openapi/openapi.json` and `mobile/src/api/generated/` are expected to
  remain byte-for-byte unchanged because the public DTO shapes do not change; supported generation
  commands must prove zero drift. `server/src/migrations/`, legacy `app/`, native/store config,
  infrastructure, workflows, and credential material remain untouched.
