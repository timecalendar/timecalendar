## Context

See proposal.md (Why). These code facts shape the approach. All were measured on this branch.

- **Baseline.** `TZ=<zone> rtk proxy npx jest --ci --silent` in `mobile/` (897 tests in the
  calendar and personal-events folders):
  - `Pacific/Kiritimati`: 3 failures.
  - `Pacific/Pago_Pago`: 8 failures.
  - `America/St_Johns`: 3 failures.
  - UTC: green.

  CI (`ci-mobile.yml` → `test-mobile`, `ubuntu-latest`) runs `npm test -- --coverage` with the
  runner default of UTC. Nothing pins or varies the zone.
- **`jest/setup-localization.ts` aligns the jest-expo device zone with the machine zone.** A
  "system" display-zone preference therefore resolves to `process.env.TZ`, and device-local
  `new Date(y, m, d, h)` fixtures stay consistent with the display zone.
- **`date-fns-tz` 3.2.0 `getTimezoneOffset(zone, date)`.** It calls
  `tzParseTimezone(zone, date)` without `isUtcDate`. That builds
  `Date.UTC(date.getFullYear(), …, date.getHours(), …)` from the Date's device-local fields and
  treats them as the zone's wall clock. The returned offset is therefore taken at a different
  instant when the device zone is not UTC. Measured with Node, Europe/Paris at 2026-10-25T00:30Z and
  02:29:59.999Z (across the fall-back):
  - UTC and Kiritimati: 120 and 60 (correct).
  - Pago_Pago and St_Johns: 120 and 120 (wrong).
  - `formatInTimeZone(instant, zone, "xxx")`: `+02:00` and `+01:00` in all four zones, because the
    formatter passes the original instant with `isUtcDate = true`.

  It has two call sites: `classifyTimedEventSupport` and `formatTimezoneOffset`.
- **The accessibility probe.** `src/test-support/owned-calendar/accessibility-probe.ts` builds its
  events from fixed `…Z` instants on 2026-06-15. Its README and the initial offset
  (`ACCESSIBILITY_PROBE_INITIAL_VERTICAL_OFFSET = 9 * 60`) describe events at 01:00, 10:00 and 23:00
  wall clock. The route opens it at
  `timecalendar-dev://calendar?focusDate=2026-06-15&accessibilityProbe=timed-events`
  (`scripts/accessibility-probe.sh`), not from the developer page. The `/developer` "Test data"
  section is the dev token import only. `CalendarWindowReader` already receives `displayZone` in
  its request. The fixture's other consumers (`accessibility-projection.test.ts`,
  `owned-calendar-shell.test.tsx`, `calendar-screen.test.tsx`) all render in "UTC".
- **`@expo/ui` 56.0.17 Android date picker (`DatePickerView.kt`).** The Compose
  `DatePickerState` takes `initialSelectedDateMillis = initialDate` raw and confirms
  `state.selectedDateMillis`. Both are UTC-midnight day millis, whatever the device zone.
  `selectableDates` bounds are converted from local to UTC days by `toUtcDayMillis`. The time dialog
  and time picker read and write through a local `Calendar`, so they are correct with local Dates.
  The JS layer (`DateTimePicker.android.tsx`) passes `value.toISOString()` and returns
  `new Date(millis)` with no conversion. The inline date picker (`presentation="inline"`, `mode`
  `date` or `datetime`) has the same day handling.
- **`DateTimeField` already compensates.** `personal-events/ui/wall-clock-day.ts`
  (`dateDialogValue`, `mergePickedDay`) applies the conversion, so the personal-event form is
  correct in UTC− zones. Its tests pass in Pago_Pago and St_Johns, apart from one regex. The gallery
  `date-time-picker` fixture uses the seam raw. It passes the local `new Date(2030, 0, 2, 9, 30)`
  and shows `setValue(date)` from the confirmed UTC midnight. In a UTC− zone it shows the previous
  day after a confirm, and it opens on the next day for a local time later than the UTC offset
  before midnight. The inbox finding describes this, and it recommends the fix belongs in the seam.
- **Root cause of each baseline failure.**

  | Failure | Zones | Defect in | Cause |
  | --- | --- | --- | --- |
  | `calendar-screen.test.tsx` › opens synced and personal timed tiles by their original UID; › opens each crowded … semantic identity directly; › pages away and back on resident window rows | Kiritimati, Pago_Pago | test | Events at `2026-06-16T10:00Z` with `focusDate=2026-06-16` in the device zone. 10:00Z is 06-17 00:00 in +14 and 06-15 23:00 in −11, so the Day page correctly shows no tile. |
  | `calendar-screen.test.tsx` › commits 2026-06-08 / 2026-06-22 while its window read is pending | Pago_Pago | test | `${destination}T10:00:00Z` is Sunday 23:00 of the previous week in −11, so the event correctly leaves the destination week. |
  | `timed-support.test.ts` › classifies points and deferred date-only, spanning, and DST shapes | Pago_Pago, St_Johns | **app** | `getTimezoneOffset` reads device-local fields (above). The Paris fall-back interval is classified `supported`. UTC passes only because local fields equal UTC fields there. |
  | `date-time-field.test.tsx` › on Android in `<device zone>` › displays and announces the device clock (×2) | Pago_Pago, St_Johns | test | The pattern hard-codes `^1 Jan`. `INITIAL` (2026-01-01T00:00Z) is 31 Dec in any UTC− zone. The app output equals `formatShortDateTime(INITIAL, "en", zone, …)`, which the test also asserts. |

  The gallery date picker defect (proposal) is an app defect that no baseline test covered. The
  suite-wide `@expo/ui/community/datetime-picker` mock confirms `2030-01-02T03:04Z` in every mode,
  not the Compose UTC-midnight contract.

## Goals / Non-Goals

**Goals:**

- `npm test` passes in any process zone. CI proves this on every push under three zones chosen to
  break each class of defect: the largest positive offset (+14), the largest negative offset of a
  populated zone (−11), and a half-hour offset with DST (−03:30/−02:30).
- Each app defect gets a reproducing test before its fix. Where possible the test fails in every
  zone, UTC included, so the reproduction does not depend on the matrix.
- Each new rule is a lint error, a contract test or a CI job first (Principle 1).

**Non-Goals:**

- A general audit or lint ban of device-local `Date` getters. The `toZonedTime` proxy pattern relies
  on them, so a syntactic ban would be noise. The time-zone matrix is the gate that catches
  device-local math on event instants (ADR 035, Consequences).
- DST-gap handling when a picked local wall clock does not exist on the target day. JS `Date`
  normalizes it forward, as the native pickers do.
- A Jest transform cache in CI (recorded debt in `testing.md`).
- The other items in the gallery-fixtures inbox note (deep-link Back on Android, live text size,
  `EmptyState`, `MenuView`, `FieldError`).

## Decisions

### Decision 1: a parallel CI matrix of three zones, not a pinned TZ (ADR-worthy)

`ci-mobile.yml` gets a second job, `test-mobile-timezones`. It uses `strategy.fail-fast: false`
and `matrix.tz: [Pacific/Kiritimati, Pacific/Pago_Pago, America/St_Johns]`. Each runner does
checkout, sets up Node from `.nvmrc`, runs `npm ci`, then runs `npm test` with `env: TZ: ${{ matrix.tz }}`
and no `--coverage`. The existing `test-mobile` job sets `TZ: UTC` on its Test step, which keeps the
coverage gate deterministic and states the zone. The job name includes the zone, so a failure
names the zone it broke in.

A contract test (`mobile/ci-timezones.contract.test.ts`, beside `jest.config.test.ts` and
`react-doctor.config.test.ts`) does three things:

- It reads `.github/workflows/ci-mobile.yml` as text and asserts the job, the exact three zones,
  the `TZ: ${{ matrix.tz }}` env, the `npm test` command, and `TZ: UTC` on the coverage step.
- It asserts that `package.json` `test:timezones` runs `scripts/test-timezones.sh` and that the
  script lists the same three zones.
- When `process.env.TZ` is set, it asserts that
  `Intl.DateTimeFormat().resolvedOptions().timeZone === process.env.TZ`. This proves that the zone
  reached the Jest worker and that the matrix is not silently running UTC.

Locally, `npm run test:timezones` runs the suite once per zone, in sequence.

Alternatives:

- **Pin `TZ=UTC` in the Jest config or `package.json`.** Rejected. It turns a latent app defect
  into permanent invisibility: the `getTimezoneOffset` bug only shows in non-UTC zones, and it
  fails on every developer machine outside UTC.
- **Pin a single non-UTC zone (e.g. Europe/Paris) for all runs.** Rejected. One zone hides the
  sign-specific defects. Paris (+1/+2) passed the baseline.
- **Run all three zones sequentially inside `test-mobile`.** Rejected. It triples the critical
  path of the required gate, and the job is already sized against ADR 044's budget.
- **Run only a calendar/date subset under the extra zones.** Rejected. The defects sat in
  `features/settings` and `components/chrome` as well as `features/calendar`, and any feature that
  formats a date can regress. A path list is a second inventory to maintain. A full run costs
  runner minutes only, not wall clock.
- **Mock `Date` or use `process.env.TZ` assignment inside tests.** Rejected. Jest's sandboxed
  `process.env` does not reset the ICU zone in the worker, and per-test zone changes cannot catch
  module-level zone reads.

Runner cost: three extra Jest runs per push that touches `mobile/**`, without coverage
instrumentation (faster than the gated run). Required-check caveat: neither job is required today
(`testing.md` → CI topology). If they become required, the matrix legs need the same treatment.

### Decision 2: offsets come from the instant, through one helper, and L11 bans the trap

`features/calendar/data/day-key.ts` gains `zoneOffsetMinutes(instant: Date, zone: string): number`.
It parses `formatInTimeZone(instant, zone, "xxx")` (`±HH:MM`, `Z`-free) into signed minutes and
throws for an unsupported zone, like `formatInTimeZone`. The calendar data barrel exports it.

- `classifyTimedEventSupport` compares `zoneOffsetMinutes` at the start and at the exclusive end.
  Its `try/catch` still maps an invalid zone to `"spanning"`.
- `formatTimezoneOffset` (`features/settings/data/timezone-catalog.ts`) imports it through
  `@/features/calendar/data`. The edge settings → calendar/data already exists
  (`settings/prefs/types.ts`), and calendar/data imports nothing from settings, so the graph stays
  acyclic.

Lint L11 adds `{ name: "date-fns-tz", importNames: ["getTimezoneOffset"] }` to the
`restrictedImports` `paths`, behind a `banZoneOffsetTrap = true` flag in the L9 shape. No file
needs an exemption, because the helper does not use the banned import.

Alternatives:

- `Intl.DateTimeFormat({ timeZoneName: "longOffset" })`. Rejected: Hermes `Intl` support for
  `longOffset` is not pinned anywhere in the repo, and the `date-fns-tz` formatter is already the
  app's zone engine (ADR 035, "Time conversion stays on date-fns-tz/Intl").
- `toZonedTime` fields minus the instant. Rejected: the proxy Date's local fields are themselves
  distorted inside the device zone's own DST gap.
- A comment or Book prose instead of L11. Rejected under Principle 1. The function's name invites
  exactly this misuse.

### Decision 3: the probe fixture is a function of the display zone

`accessibilityProbeFixture(zone: string)` keeps every identity, title, ordinal and duration. It
builds each instant as `fromZonedTime("2026-06-15T01:00:00", zone)` and so on, with
`probe-next-date` at `2026-06-16T01:00:00`. The probe reader calls
`accessibilityProbeFixture(request.displayZone)`. In UTC every instant equals the current `…Z`
literal, so existing UTC consumers change only by passing `"UTC"`.
`ACCESSIBILITY_PROBE_ANCHOR` stays. It is a test clock, and the device route pins the date through
`focusDate`.

Alternative: device-local `new Date(2026, 5, 15, 1)`. Rejected: it is wrong when the display-zone
preference is manual, and the reader already knows the zone.

### Decision 4: the chrome `DateTimePicker` takes device-local Dates; Android day conversion lives in the seam (ADR-worthy)

`src/components/chrome/date-time-picker.tsx` (new) wraps the raw `@expo/ui` control. It imports the
control from `./expo-ui`, which stays the single `@expo/ui` import site, re-exported raw as
`ExpoDateTimePicker`. `index.ts` exports the wrapper as `DateTimePicker` with the same props type.

- On Android, when the rendered native picker is a date picker (`mode !== "time"`, both
  presentations), the wrapper passes `value` as `composeDayOf(value)` (UTC midnight of the value's
  local Y/M/D). It maps each confirmed or selected Date `d` with `fromComposeDay(d, value)`: the
  local Date at `d`'s UTC Y/M/D with `value`'s local hours and minutes. Invalid and epoch Dates pass
  through untouched, so consumers keep their own cancel handling (`DateTimeField.isPickedDate`).
- `minimumDate` and `maximumDate` pass through unchanged, because `@expo/ui` already converts them
  from local to UTC days.
- iOS and the Android time picker pass through unchanged.

The helpers (`composeDayOf`, `fromComposeDay`) live in
`src/components/chrome/compose-date-day.ts`. They replace `personal-events/ui/wall-clock-day.ts`,
and its test moves with them. `DateTimeField` passes `wallClock` and takes the picked day directly
as the pending time-dialog value.

The resulting contract is the React Native community date picker's and iOS's: a date pick changes
the day and keeps the time of day, in device-local time. Display-zone conversion stays in
`DateTimeField` (`toZonedTime`/`fromZonedTime`), which is a feature concern.

A source-pin test (`compose-date-day.test.ts`) reads
`node_modules/@expo/ui/android/src/main/java/expo/modules/ui/DatePickerView.kt` with `fs`, the way
`icon.test.tsx` pins the Material codepoints. It asserts that the Compose `DatePickerState` is
still built with `initialSelectedDateMillis = initialDate` (and `?: fallbackDate` in the inline
picker), and that bounds still go through `toUtcDayMillis`. If `@expo/ui` starts converting, the
pin fails before the seam double-converts.

Alternatives:

- **Fix only the gallery fixture.** Rejected. It leaves the trap in the seam for every future date
  consumer (the next is likely notification or export date inputs). The inbox finding names the
  seam.
- **Keep conversion per consumer and lint for it.** Rejected. No syntactic rule can tell whether a
  consumer converted.
- **Patch `@expo/ui` with `patch-package`.** Rejected. It adds a patch toolchain the repo does not
  have, for a two-function adapter that the chrome seam exists to hold (ADR 010/012: one blast
  radius).

### Decision 5: test mocks mirror the native contract they stand in for

The suite-wide `@expo/ui/community/datetime-picker` mock (`jest/setup-expo-ui.ts`) confirms
`new Date(Date.UTC(2030, 0, 2))` when `Platform.OS === "android"` and `mode !== "time"`, and renders
the received value's ISO string, as the Compose picker would. Other platforms and modes keep
`2030-01-02T03:04Z`. `date-time-field.test.tsx` keeps its richer per-file mock (dismiss,
invalid/epoch, `is24Hour`), which already follows that contract.

Tests that depend on the device zone either derive expectations from the same zone-aware helper
they test, or build fixtures in the zone under display (`new Date(y, m, d, h)` when the preference
is "system"). They never hard-code a calendar day derived from a `Z` instant.

## Risks / Trade-offs

- [The matrix triples Jest runner minutes on mobile pushes] → No coverage instrumentation, and the
  jobs run in parallel, so wall clock is unchanged. If cost becomes a friction point, the recorded
  Jest-cache debt is the first lever, not shrinking the matrix.
- [A test that is genuinely zone-fragile in a fourth zone stays undetected] → The three zones cover
  extreme positive, extreme negative and half-hour plus DST. Europe/Paris is what developers run
  locally. New classes go into the matrix in the same contract test.
- [The `@expo/ui` upgrade changes the Compose day contract] → The source-pin test fails on install,
  before any device sees a double conversion.
- [`fromComposeDay` on a DST-gap local time] → JS normalizes forward one hour. This is the native
  pickers' behavior, and the time dialog follows in `DateTimeField` anyway.
- [A runner image lacks one of the zones] → Node ships full ICU with its own tzdata, and the worker
  zone check in the contract test fails loudly instead of silently running UTC.

## Migration Plan

None. The app is not in production (no installed React Native binaries). There is no stored-data
change. `wall-clock-day.ts` is deleted in the same change that moves its logic into the seam.
