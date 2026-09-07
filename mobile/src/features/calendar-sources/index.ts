// Feature barrel — the public surface of the calendar-sources cluster (QR scan,
// iCal import, and — ship 5 / ADR 018 — durable token persistence). No import
// cycle: the data/ and ui/ sub-barrels import their seams directly, never each
// other or this barrel (the no-self-barrel-cycle rule, B-2).
export {
  addCalendarFromToken,
  type CalendarImportFields,
  type CreateCalendarResult,
  effectiveCalendarName,
  parseScannedSource,
  type ScannedCalendarSource,
  type UseAddCalendar,
  useAddCalendar,
  type UseCreateCalendar,
  useCreateCalendar,
  type UserCalendar,
  type UserCalendarActions,
  type UserCalendarsState,
  type UseRenameCalendar,
  useRenameCalendar,
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
  useUserCalendarsState,
  validateIcalUrl,
} from "./data"
export {
  DevImportScreen,
  IcalUrlScreen,
  QrScanScreen,
  UserCalendarsScreen,
} from "./ui"
