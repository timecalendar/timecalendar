## ADDED Requirements

### Requirement: Timed-event support classification depends only on the instants and the display zone

The classification of a timed event as supported, spanning, or crossing an offset transition SHALL depend only on the event's start and end instants and the display zone. It SHALL NOT depend on the device time zone. An offset transition SHALL be detected by comparing the display zone's UTC offset at the start instant with its offset at the exclusive end instant.

#### Scenario: A fall-back interval is detected in every device zone

- **WHEN** an event runs from 2026-10-25T00:30Z to 2026-10-25T01:30Z and the display zone is Europe/Paris
- **THEN** it is classified as crossing an offset transition, whether the device zone is UTC, UTC+14, UTC−11, or UTC−03:30

#### Scenario: A same-offset interval stays supported

- **WHEN** an event lies within one calendar day of the display zone and the zone's offset does not change between its start and its exclusive end
- **THEN** it is classified as supported in every device zone

### Requirement: The development accessibility probe places its events on display-zone wall-clock hours

The development-only accessibility probe SHALL place its fabricated events on the documented wall-clock hours of 2026-06-15 in the effective display zone: 01:00, the tied, overlapping, and tiny cases from 10:00 to 12:15, and 23:00, plus one event at 01:00 on 2026-06-16. Their identities, titles, order, and durations SHALL be the same in every display zone.

#### Scenario: The probe frames the same hours outside UTC

- **WHEN** the probe route opens on 2026-06-15 in Day view with a display zone other than UTC, such as Pacific/Pago_Pago or Asia/Kathmandu
- **THEN** the earliest fixture starts at 01:00 and the latest same-day fixture starts at 23:00 on that zone's 2026-06-15
- **AND** the initial viewport contains the 10:00 fixtures, and the next-date fixture lies on 2026-06-16

#### Scenario: The probe in UTC is unchanged

- **WHEN** the probe is built for the UTC display zone
- **THEN** every fixture instant equals the probe's documented UTC instant
