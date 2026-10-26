## Why

The mobile Jest suite passes only because CI runs it in UTC. Run in another zone, it fails 3 to 8
tests. Two of those failures are real app defects that UTC hides. Two developer and gallery
surfaces also show wrong hours or wrong days outside UTC:

- The calendar support classifier misses DST transitions. It reads `date-fns-tz`
  `getTimezoneOffset(zone, date)`, which treats the `Date`'s device-local fields as the zone's wall
  clock, so the offset depends on the device zone.
- The dev accessibility probe places its events at fixed UTC instants. The Android date dialog
  reached through the raw chrome `DateTimePicker` shows and returns the wrong day in UTC− zones.

No user of the app lives in UTC (the Flutter app it replaces serves French schools, on
Europe/Paris and the overseas zones from −10 to +12), so a suite that only proves UTC proves the
wrong thing. This change fixes each defect, then makes CI run the suite
in non-UTC zones so the class cannot come back.

## What Changes

- **Instant-based zone offsets.** A new `zoneOffsetMinutes(instant, zone)` helper in
  `features/calendar/data/day-key.ts`, built on `formatInTimeZone(…, "xxx")`, gives the offset at the
  instant whatever the device zone. `classifyTimedEventSupport` (calendar) and
  `formatTimezoneOffset` (time-zone chooser) use it. Under UTC, the classifier reports an event
  across the Europe/Paris fall-back hour as supported. The chooser shows `UTC+02:00` at
  01:30Z on the fall-back day, when Paris is at +01:00.
- **Lint L11.** Importing `getTimezoneOffset` from `date-fns-tz` is a lint error everywhere under
  `src/`, and the message points to `zoneOffsetMinutes`.
- **Zone-correct accessibility probe.** `accessibilityProbeFixture(zone)` builds its events from
  wall-clock times on 2026-06-15 in the given zone (01:00, 10:00, 11:00, 12:00, 23:00, and 01:00
  the next day). The probe reader passes the request's `displayZone`, so the device probe shows the
  hours its README describes in any display zone.
- **The chrome `DateTimePicker` takes device-local Dates on both platforms.** On Android, for a
  date picker (`mode` `date`, or Android's date-only `datetime`), the chrome seam passes the native
  Compose picker UTC midnight of the value's local day. It reads the picked UTC-midnight day back as
  that local day, keeping the value's local time of day. This is the platform-native (RNC) date
  contract. The helpers move from `personal-events/ui/wall-clock-day.ts` into the seam, and
  `DateTimeField` no longer converts days itself. The gallery `date-time-picker` stories, which pass
  the seam raw local Dates, become correct in UTC− zones. A source-pin test fails when `@expo/ui`
  changes the Compose day handling the seam compensates for.
- **Zone-agnostic tests.** `calendar-screen.test.tsx` builds its event instants in the device zone
  that the screen displays. The `DateTimeField` "displays and announces the device clock" case stops
  hard-coding "1 Jan".
- **CI time-zone matrix.** A new `test-mobile-timezones` job in `ci-mobile.yml` runs the full Jest
  suite (no coverage) under `Pacific/Kiritimati` (+14), `Pacific/Pago_Pago` (−11) and
  `America/St_Johns` (−03:30, half-hour, DST), in parallel with `test-mobile`. `test-mobile` pins
  `TZ: UTC` for its coverage run. A contract test pins the matrix and checks that the zone reached
  the Jest worker. `npm run test:timezones` runs the same three zones locally.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-test-harness`: the unit suite passes in any process time zone. CI runs it under a
  three-zone matrix besides the UTC coverage run.
- `mobile-lint-format`: L11 bans `date-fns-tz` `getTimezoneOffset`.
- `mobile-calendar-timeline`: timed-event support classification depends on the instant and the
  display zone only. The dev accessibility probe places its events on display-zone wall-clock hours.
- `mobile-personal-events-ui`: the chrome date/time picker takes device-local Dates on both
  platforms. The Android day conversion lives in the seam, not in each consumer.
- `mobile-worldwide-timezone-search`: chooser offsets depend on the instant only, not the device
  zone.

## Impact

- Code: `mobile/src/features/calendar/data/{day-key.ts,timed-support.ts,index.ts}`,
  `mobile/src/features/settings/data/timezone-catalog.ts`,
  `mobile/src/test-support/owned-calendar/accessibility-probe.ts` (+ its `.md`),
  `mobile/src/components/chrome/{date-time-picker.tsx (new),expo-ui.tsx,index.ts}`, the date
  picker gallery fixture and its test, `mobile/src/features/personal-events/ui/date-time-field.tsx`
  (`wall-clock-day.ts` and its test move into chrome), `mobile/jest/setup-expo-ui.ts` (the Android
  date mock follows the Compose contract), the affected tests, `mobile/eslint.config.js` (L11),
  `mobile/package.json` (`test:timezones`), a new `mobile/scripts/test-timezones.sh`, and a new
  contract test.
- CI: `.github/workflows/ci-mobile.yml` gets one parallel three-runner matrix job. Wall clock
  stays about the same, and runner minutes roughly triple for Jest.
- No new dependency, route, native configuration, or server/OpenAPI change. Nothing changes in the
  Flutter `app/`.
- Book: `testing.md`, `lint-format.md` (L11), `calendar.md`, `features.md`, and a dated
  `CHANGELOG.md` entry (2026-10-26). The inbox finding in
  `2026-10-25-mobile-gallery-fixtures-findings.md` is marked resolved.
