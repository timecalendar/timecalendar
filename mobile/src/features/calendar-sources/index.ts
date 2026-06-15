// Feature barrel — the public surface of the calendar-sources cluster (QR scan
// this ship; iCal import + durable token persistence grow it, ships 4/5). No
// import cycle: the data/ and ui/ sub-barrels import their seams directly, never
// each other or this barrel (the no-self-barrel-cycle rule, B-2).
export {
  clearScannedSource,
  getScannedSource,
  parseScannedSource,
  type ScannedCalendarSource,
  setScannedSource,
  useScannedSource,
} from "./data"
export { QrScanScreen } from "./ui"
