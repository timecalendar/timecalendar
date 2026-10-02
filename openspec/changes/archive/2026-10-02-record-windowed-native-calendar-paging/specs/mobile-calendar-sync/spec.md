## MODIFIED Requirements

### Requirement: Local rendering reads are bounded by separate instant and civil-date ranges

The calendar data seam SHALL read bounded local ranges, the 28-day chunks around the Calendar timeline's mounted pages and each Agenda or Home range, and SHALL issue SQLite predicates for timed intersections, personal timed intersections, and, for Agenda and Home, date-only civil-range intersections separately. Timed positive intervals SHALL use half-open intersection (`startsAt < range.to` and `endsAt > range.from`); date-only rows SHALL use their UTC-encoded floating civil start and exclusive end against a civil-day envelope. The reads SHALL select no row outside the required envelope, SHALL use no arbitrary result cap, and SHALL not change stored facts or start a network request.

#### Scenario: Timed intersection includes long coverage at either boundary

- **WHEN** a timed row starts before the envelope but ends inside it, or starts inside it and ends after it
- **THEN** the local query returns the row because its interval intersects the half-open instant range
- **AND** a row ending exactly at `from` or starting exactly at `to` is excluded

#### Scenario: Date-only read uses floating civil keys

- **WHEN** a date-only row's stored UTC fields represent a civil-date range intersecting an Agenda or Home day envelope
- **THEN** the date-only query returns it by civil start/exclusive-end semantics
- **AND** it is not shifted or excluded by the current display-zone offset

#### Scenario: Personal rows are range scoped

- **WHEN** personal events exist both inside and outside the instant envelope
- **THEN** the personal repository returns only intersecting rows
- **AND** it does not read the entire personal-events table first
