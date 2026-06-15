// Pure URL pre-filter (design D3) — no t(), no backend, no side effects. Returns
// a localizable error KEY the screen maps to t(), or null when acceptable
// (mirrors personal-events/form/validate.ts). DELIBERATELY LENIENT: this is a UX
// pre-filter for immediate, accessible feedback — the server POST /calendars is
// the AUTHORITATIVE validator (a syntactically-fine URL that isn't a real .ics
// fails server-side → the create-error/retry path). Flutter has no client
// validation at all (it posts whatever is typed); we add only the minimum so an
// empty / obviously-non-URL submit gives feedback without a network round-trip.
export function validateIcalUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return "calendarSources.icalUrl.error.empty"
  }
  if (!/^https?:\/\/\S/i.test(trimmed)) {
    return "calendarSources.icalUrl.error.invalid"
  }
  return null
}
