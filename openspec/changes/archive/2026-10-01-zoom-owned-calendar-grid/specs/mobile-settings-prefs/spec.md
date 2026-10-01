## ADDED Requirements

### Requirement: Calendar zoom preference is one total persisted number

The Settings preference boundary SHALL own one shared Day/Week pixels-per-hour value under `settings.calendarZoomPixelsPerHour`, expose imperative get/set operations and a reactive hook, and use the numeric `@/storage` seam. A valid stored value SHALL be finite and within the inclusive current bounds. Missing, malformed, non-numeric, `NaN`, infinite, and out-of-range values SHALL resolve to the 60 px/hour default without throwing. Day and Week SHALL consume the same reactive value; Agenda SHALL neither replace nor persist a separate value.

#### Scenario: Valid zoom round-trips reactively
- **WHEN** 40, 60, 120, or an intermediate finite in-range value is stored through the Settings API
- **THEN** imperative and reactive reads return that value
- **AND** Day and Week observe the same update

#### Scenario: Invalid zoom recovers to default
- **WHEN** the key is missing, corrupt, non-finite, or outside 40 through 120 px/hour
- **THEN** every Settings read returns 60 px/hour without throwing

#### Scenario: Fresh install may restore the default
- **WHEN** reinstall removes the per-installation key
- **THEN** the next read resolves to 60 px/hour
- **AND** no selected date or pixel offset is persisted with it
