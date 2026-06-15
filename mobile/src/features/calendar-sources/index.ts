// Feature barrel — the public surface of the calendar-sources cluster (QR scan
// this ship; iCal import + durable token persistence grow it, ships 4/5). No
// import cycle: the data/ and ui/ sub-barrels import their seams directly, never
// each other or this barrel (the no-self-barrel-cycle rule, B-2).
export {
  clearScannedSource,
  type CreateCalendarResult,
  getScannedSource,
  parseScannedSource,
  type ScannedCalendarSource,
  setScannedSource,
  type UseCreateCalendar,
  useCreateCalendar,
  useScannedSource,
  validateIcalUrl,
} from "./data"
export { IcalUrlScreen, QrScanScreen } from "./ui"
