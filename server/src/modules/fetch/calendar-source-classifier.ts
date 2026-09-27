export type CalendarSourceRejection =
  | "malformed"
  | "unsupported-scheme"
  | "timetable-ui"

export type CalendarSourceClassification =
  | { accepted: true; url: URL }
  | { accepted: false; reason: CalendarSourceRejection }

const SUPPORTED_PROTOCOLS = ["http:", "https:", "webcal:"]

// These exact host/path pairs are known timetable pages, not calendar exports.
export const TIMETABLE_UI_PATHS: Readonly<Record<string, readonly string[]>> = {
  "edt.univ-lyon1.fr": ["/", "/jsp/standard/index.jsp"],
  "plannings.ube.fr": ["/", "/jsp/standard/index.jsp"],
  "proseconsult.umontpellier.fr": ["/", "/direct", "/direct/"],
  "planning.univ-rennes.fr": [
    "/",
    "/jsp/standard/index.jsp",
    "/direct",
    "/direct/",
  ],
  "edt.univ-tlse3.fr": ["/calendar", "/calendar/", "/calendar/default.aspx"],
}

export function classifyCalendarSource(
  source: string,
): CalendarSourceClassification {
  let url: URL
  try {
    url = new URL(source)
  } catch {
    return { accepted: false, reason: "malformed" }
  }

  if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
    return { accepted: false, reason: "unsupported-scheme" }
  }
  if (!url.hostname) {
    return { accepted: false, reason: "malformed" }
  }
  if (TIMETABLE_UI_PATHS[url.hostname]?.includes(url.pathname)) {
    return { accepted: false, reason: "timetable-ui" }
  }
  return { accepted: true, url }
}
