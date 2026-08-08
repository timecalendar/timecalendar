// Align jest-expo's expo-localization device timezone with the MACHINE's zone.
// jest-expo ships a fixed "America/New_York" calendar mock; the display-zone
// seam (useDisplayZone / resolveTimezone, timezone design D2) resolves the
// "system" preference through it, while screen-test fixtures are written as
// device-local `new Date(y, m, d, h)` values in the MACHINE zone — a fixed
// foreign default would skew every "system"-preference rendering by hours.
//
// Plain property replacement (NOT jest.spyOn): a suite-level
// jest.clearAllMocks() would wipe a spy's return value and crash zone reads
// mid-suite, while a plain function survives it. Suites that need a specific
// device zone spy on getCalendars/useCalendars per-case (localization.test /
// registration.test pattern) — jest.spyOn wraps this replacement cleanly and
// restoreAllMocks restores back to it.
import * as Localization from "expo-localization"

const machineZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const machineCalendars = [
  {
    calendar: "gregory",
    uses24hourClock: true,
    firstWeekday: 1,
    timeZone: machineZone,
  },
] as unknown as ReturnType<typeof Localization.getCalendars>

const mutable = Localization as {
  getCalendars: typeof Localization.getCalendars
  useCalendars: typeof Localization.useCalendars
}
mutable.getCalendars = () => machineCalendars
mutable.useCalendars = () => machineCalendars
