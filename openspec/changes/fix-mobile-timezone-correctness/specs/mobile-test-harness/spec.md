## ADDED Requirements

### Requirement: The unit suite passes in any process time zone

The mobile Jest suite SHALL pass whatever the process time zone (`TZ`) is. A test SHALL NOT hard-code a calendar day, hour, or offset that holds only in UTC. A test that depends on the device zone SHALL either build its fixtures in the zone the code under test displays, or derive its expectations from that zone.

#### Scenario: The suite passes at the extremes of the offset range

- **WHEN** `npm test` runs with `TZ=Pacific/Kiritimati` (UTC+14), `TZ=Pacific/Pago_Pago` (UTC−11), or `TZ=America/St_Johns` (UTC−03:30 with DST)
- **THEN** every test passes, as it does with `TZ=UTC`

#### Scenario: A screen fixture follows the displayed zone

- **WHEN** a calendar screen test seeds a timed event for the focused day under the "system" display-zone preference
- **THEN** the event's instant is built in the device zone, so the event lies on the focused day in every process zone

### Requirement: CI runs the unit suite under a time-zone matrix

CI SHALL run the full mobile Jest suite under `Pacific/Kiritimati`, `Pacific/Pago_Pago`, and `America/St_Johns`, in parallel with the UTC coverage run, on every push that triggers the mobile gate. The coverage run SHALL state `TZ: UTC` explicitly. A failure SHALL name the zone it happened in. A repository contract test SHALL fail if the matrix, its zones, its `TZ` wiring, or the local `npm run test:timezones` zone list drift. When `TZ` is set, the same test SHALL also fail if the Jest worker does not resolve `TZ` as its time zone.

#### Scenario: A UTC-only test fails CI

- **WHEN** a pushed commit adds a test that passes only in UTC
- **THEN** at least one `test-mobile-timezones` matrix leg fails, and the leg's name includes its zone

#### Scenario: The matrix cannot be silently removed

- **WHEN** a commit removes a zone from the matrix or drops `TZ: ${{ matrix.tz }}` from the job
- **THEN** the contract test fails in the `test-mobile` gate

#### Scenario: The zone reached the worker

- **WHEN** the suite runs with `TZ` set to one of the matrix zones
- **THEN** the contract test asserts that `Intl.DateTimeFormat().resolvedOptions().timeZone` equals `TZ`

#### Scenario: Developers can reproduce the matrix locally

- **WHEN** a developer runs `npm run test:timezones` in `mobile/`
- **THEN** the suite runs once per matrix zone, and the command fails if any zone fails
