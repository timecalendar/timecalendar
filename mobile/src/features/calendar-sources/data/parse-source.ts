import type { ScannedCalendarSource } from "./types"

// Pure parser of the raw scanned QR string into a typed ScannedCalendarSource —
// the golden-path `data/`-is-a-pure-seam rule (ADR 014): no camera, no t(), no
// backend. Mirrors the Flutter verbatim-passthrough (`QrCodeResult.url =
// barcode.rawValue`): a QR encodes a raw string treated as a calendar URL, so we
// validate "is an http(s)/webcal URL" only and pass it through — NOT an iCal-
// specific shape (ship 4's `POST /calendars` is the real validator; open
// question resolved by following Flutter, see design.md / ADR 017).
//
// A non-URL value (a contact card, a random string) → null so the screen reports
// "not a calendar QR" rather than feeding garbage to the create flow.
//
// webcal:// normalization: the one deliberate divergence from Flutter's verbatim
// passthrough — Flutter posts rawValue as-is. webcal is the read-only iCal
// subscription scheme (just http(s) by convention); the server accepts the
// http(s) form, so we rewrite ONLY the scheme prefix, minimally and reversibly:
// if the server later needs the raw webcal://, delete this one branch (ADR 017).
// http/https URLs are passed through verbatim (scheme untouched).
export function parseScannedSource(raw: string): ScannedCalendarSource | null {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return null
  }

  if (trimmed.startsWith("webcal://")) {
    return { url: `https://${trimmed.slice("webcal://".length)}` }
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { url: trimmed }
  }

  return null
}
