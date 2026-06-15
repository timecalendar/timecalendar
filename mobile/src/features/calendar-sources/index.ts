// Feature barrel — the public surface of the calendar-sources cluster (QR scan,
// iCal import, and — ship 5 / ADR 018 — durable token persistence). No import
// cycle: the data/ and ui/ sub-barrels import their seams directly, never each
// other or this barrel (the no-self-barrel-cycle rule, B-2).
export {
  type CreateCalendarResult,
  parseScannedSource,
  type ScannedCalendarSource,
  type UseAddCalendar,
  useAddCalendar,
  type UseCreateCalendar,
  useCreateCalendar,
  type UserCalendar,
  useUserCalendars,
  validateIcalUrl,
} from "./data"
export { IcalUrlScreen, QrScanScreen } from "./ui"
