import { classifyCalendarImport } from "./calendar-import-recovery"

const exportUrl = (host: string) =>
  `https://${host}/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=sentinel-resource&projectId=1&calType=ical`

describe("classifyCalendarImport", () => {
  it.each([
    [
      "univrennes1",
      "https://planning.univ-rennes.fr/direct/index.jsp?data=secret",
      "rennes_export",
    ],
    [
      "univtours",
      "https://ade.univ-tours.fr/login?token=secret",
      "tours_export",
    ],
    [
      null,
      "https://emploidutemps.univ-reunion.fr/calendar?data=secret",
      "reunion_export",
    ],
    [
      "umontpellier",
      "https://proseconsult.umontpellier.fr/direct?data=secret",
      "montpellier_export",
    ],
    [
      "univbourgogne",
      "https://plannings.ube.fr/portal?data=secret",
      "ube_export",
    ],
    ["univlyon2", "https://edt.univ-lyon2.fr/data?data=secret", "lyon2_export"],
  ])(
    "classifies %s web UI without returning query values",
    (schoolCode, url, helpKey) => {
      expect(classifyCalendarImport({ sourceUrl: url, schoolCode })).toEqual({
        classification: "unsupported_link",
        helpKey,
        retryable: false,
        schoolCode: schoolCode ?? "univreunion",
        errorKind: "unsupported_shape",
      })
      expect(
        JSON.stringify(classifyCalendarImport({ sourceUrl: url, schoolCode })),
      ).not.toContain("secret")
    },
  )

  it.each([
    ["planning.univ-rennes.fr", "univrennes1"],
    ["ade.univ-tours.fr", "univtours"],
    ["emploidutemps.univ-reunion.fr", "univreunion"],
    ["proseconsult.umontpellier.fr", "umontpellier"],
    ["plannings.ube.fr", "univbourgogne"],
    ["edt.univ-lyon2.fr", "univlyon2"],
  ])("gives a supported export precedence on %s", (host, schoolCode) => {
    expect(
      classifyCalendarImport({ sourceUrl: exportUrl(host), schoolCode }),
    ).toBeNull()
  })

  it.each([
    ["univstetienne", "empty_body", "saint_etienne_outage"],
    ["bordeauxinp", "tls", "bordeaux_inp_outage"],
    ["univtoulouse3", "http_5xx", "toulouse3_outage"],
  ] as const)("maps %s provider incidents", (schoolCode, outcome, helpKey) => {
    expect(
      classifyCalendarImport({
        sourceUrl: "https://provider.example/export.ics",
        schoolCode,
        outcome,
      }),
    ).toMatchObject({
      classification: "upstream_unavailable",
      helpKey,
      retryable: true,
    })
  })

  it("does not globally classify an empty calendar as an outage", () => {
    expect(
      classifyCalendarImport({
        sourceUrl: "https://provider.example/export.ics",
        schoolCode: null,
        outcome: "empty_calendar",
      }),
    ).toMatchObject({
      classification: "unknown",
      helpKey: "generic_unknown",
      retryable: false,
    })
  })
})
