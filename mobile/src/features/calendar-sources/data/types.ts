// The typed result of scanning a QR code (or, later, pasting an iCal URL — ship
// 4 grows this folder). `url` is the trimmed calendar URL the scan yields — the
// Flutter wire format (`QrCodeResult.url = barcode.rawValue`): the QR encodes a
// raw string treated as an iCal URL, no JSON / envelope / deep link. This is the
// seam ship 4 consumes (`POST /calendars { url }`) and the Phase 09 importer
// aligns with (the source URL is the wire-format anchor; the server token is a
// later artifact). Keep minimal (R-2): only the URL the create flow needs.
export interface ScannedCalendarSource {
  url: string
}
