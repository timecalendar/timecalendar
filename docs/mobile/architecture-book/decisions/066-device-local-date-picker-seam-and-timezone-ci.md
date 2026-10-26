# 066 — Device-local date picker seam and a three-zone CI matrix

## Status

Accepted.

## Context

The unit suite was proved in one process zone: the CI runner default, UTC. Under UTC a Date's
device-local fields equal its UTC fields, so code that read local fields where it meant the
instant passed. Run under other zones, the suite exposed two app defects (`date-fns-tz`
`getTimezoneOffset` reading device-local fields, and the Android date picker) and several tests
that hard-coded a calendar day derived from a `Z` instant.

`@expo/ui` 56's Android date picker (`DatePickerView.kt`) builds the Compose `DatePickerState`
with `initialSelectedDateMillis = initialDate` and confirms `selectedDateMillis`: UTC-midnight day
millis, whatever the device zone. Its JS layer passes `value.toISOString()` and returns
`new Date(millis)` unconverted. A consumer handing it a local Date opens on the wrong day in a
UTC− zone late in the evening, and reads the confirmed day as the previous one. iOS and the
Android time picker work in device-local time.

## Decision

- **CI runs the full unit suite under three zones** in a parallel job, `test-mobile-timezones`
  (`fail-fast: false`): `Pacific/Kiritimati` (+14), `Pacific/Pago_Pago` (−11) and
  `America/St_Johns` (−03:30/−02:30 with DST). The `test-mobile` coverage run pins `TZ: UTC`.
  `ci-timezones.contract.test.ts` pins the job, the zones and the local `npm run test:timezones`
  script, and checks that the zone reached the Jest worker.
- **The chrome `DateTimePicker` takes and reports device-local Dates on both platforms.** On
  Android, for a date picker (`mode` other than `time`, either presentation), the seam passes
  `composeDayOf(value)` and maps each picked Date back with `fromComposeDay(picked, value)`: the
  picked day at the value's local time of day. Invalid and epoch Dates pass through for the
  consumer's cancel handling; `minimumDate`/`maximumDate` pass through because `@expo/ui` already
  converts them. `compose-date-day.test.ts` pins the `DatePickerView.kt` lines this relies on.
  Display-zone conversion stays in the feature (`DateTimeField`).

Rejected:

- Pinning `TZ=UTC` in the Jest config: it makes zone defects permanently invisible.
- Pinning one non-UTC zone: one zone hides the sign-specific defects (Europe/Paris passed).
- Running the three zones inside `test-mobile`: it triples the critical path of the gate.
- Running only a calendar subset in the extra zones: the defects sat in settings and chrome too,
  and a path list is a second inventory.
- Converting per consumer (lint cannot tell whether a consumer converted), fixing only the gallery
  fixture (leaves the trap in the seam), or patching `@expo/ui` with `patch-package` (a patch
  toolchain for a two-function adapter the seam exists to hold).

## Consequences

- Three extra Jest runs per mobile push, without coverage, in parallel: runner minutes, not wall
  clock. Neither job is a required check; if they become required, the matrix legs need the same
  treatment.
- A test may not hard-code a calendar day derived from a `Z` instant; it builds fixtures in the
  zone under display and derives expectations from the same zone-aware helpers
  ([testing.md](../testing.md) → Time zones).
- Every date consumer of the seam gets the RN community / iOS contract for free. The suite-wide
  picker mock follows the Compose contract on Android.

## Revisit if

- `@expo/ui` converts days itself: the `DatePickerView.kt` pin fails, and the seam conversion goes.
- A new class of zone defect appears that none of the three zones breaks: add the zone to the
  matrix and the contract test.
- Runner cost becomes friction: restore a Jest transform cache in CI first (recorded debt), before
  shrinking the matrix.
