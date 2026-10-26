## ADDED Requirements

### Requirement: Chooser offsets depend only on the instant, not the device zone

A row's offset label SHALL be the candidate zone's UTC offset at the screen-owned instant, whatever the device time zone.

#### Scenario: A row offset across a DST change is correct in any device zone

- **WHEN** the chooser computes the Europe/Paris offset for the instant 2026-10-25T01:30Z, one hour after the fall-back to +01:00
- **THEN** the label is `UTC+01:00` whether the device zone is UTC, UTC+14, UTC−11, or UTC−03:30
