import {
  classifyCalendarSource,
  TIMETABLE_UI_PATHS,
} from "modules/fetch/calendar-source-classifier"

describe("classifyCalendarSource", () => {
  it.each(["", " ", "/calendar", "not a URL", "https://", "https://%"])(
    "rejects malformed source %j",
    (source) => {
      expect(classifyCalendarSource(source)).toEqual({
        accepted: false,
        reason: "malformed",
      })
    },
  )

  it.each([
    "ftp://example.com/a.ics",
    "file:///tmp/a.ics",
    "data:text/plain,a",
    "javascript:alert(1)",
  ])("rejects unsupported scheme %j", (source) => {
    expect(classifyCalendarSource(source)).toEqual({
      accepted: false,
      reason: "unsupported-scheme",
    })
  })

  const uiUrls = Object.entries(TIMETABLE_UI_PATHS).flatMap(([host, paths]) =>
    paths.map((path) => `https://${host}${path}`),
  )

  it.each(uiUrls)("rejects exact timetable UI %s", (source) => {
    expect(classifyCalendarSource(`${source}?data=opaque#fragment`)).toEqual({
      accepted: false,
      reason: "timetable-ui",
    })
  })

  it.each([
    "http://example.com/calendar",
    "https://example.com/direct/",
    "https://example.com/",
    "https://edt.univ-lyon1.fr.evil.test/",
    "https://sub.edt.univ-lyon1.fr/",
    "https://univ-lyon1.fr/",
    "https://edt.univ-lyon1.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical",
    "https://plannings.ube.fr/jsp/custom/modules/plannings/direct_cal.jsp?calType=ical",
    "https://planning.univ-rennes.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical",
    "https://edt.univ-tlse3.fr/calendar/export.ics",
    "webcal://example.com/calendar.ics",
  ])("accepts non-UI source %s", (source) => {
    expect(classifyCalendarSource(source)).toEqual({
      accepted: true,
      url: new URL(source),
    })
  })
})
