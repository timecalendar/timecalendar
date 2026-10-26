## ADDED Requirements

### Requirement: The device-zone-dependent offset function is a lint error

Lint SHALL report an error for any import of `getTimezoneOffset` from `date-fns-tz` anywhere under `mobile/src/`. That function reads a `Date`'s device-local fields as the zone's wall clock, so its result depends on the device zone. The message SHALL point to the app's instant-based zone-offset helper. Other `date-fns-tz` imports SHALL stay allowed.

#### Scenario: A module imports getTimezoneOffset

- **WHEN** a file under `src/` imports `getTimezoneOffset` from `date-fns-tz`
- **THEN** `npm run lint` fails with a message that names the instant-based offset helper

#### Scenario: Other date-fns-tz helpers stay importable

- **WHEN** a file imports `formatInTimeZone`, `toZonedTime`, or `fromZonedTime` from `date-fns-tz`
- **THEN** lint reports no error for that import
