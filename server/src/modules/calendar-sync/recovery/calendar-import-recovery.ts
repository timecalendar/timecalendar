import {
  CalendarFetchOutcomeKind,
  calendarFetchOutcomeKinds,
} from "modules/fetch/models/calendar-fetch-outcome"

export const calendarImportClassifications = [
  "unsupported_link",
  "upstream_unavailable",
  "invalid_calendar",
  "unknown",
] as const

export type CalendarImportClassification =
  (typeof calendarImportClassifications)[number]

export const calendarImportHelpKeys = [
  "rennes_export",
  "tours_export",
  "reunion_export",
  "montpellier_export",
  "ube_export",
  "lyon2_export",
  "saint_etienne_outage",
  "bordeaux_inp_outage",
  "toulouse3_outage",
  "generic_invalid_calendar",
  "generic_upstream_unavailable",
  "generic_unknown",
] as const

export type CalendarImportHelpKey = (typeof calendarImportHelpKeys)[number]

export interface CalendarImportRecovery {
  classification: CalendarImportClassification
  helpKey: CalendarImportHelpKey
  retryable: boolean
}

export interface CalendarImportDiagnostic extends CalendarImportRecovery {
  schoolCode: string | null
  errorKind: CalendarFetchOutcomeKind | "unsupported_shape" | "legacy_redacted"
}

interface ClassifyCalendarImportInput {
  sourceUrl: string
  schoolCode: string | null
  outcome?: CalendarFetchOutcomeKind
}

interface SourceShape {
  hostname: string
  pathname: string
  queryKeys: ReadonlySet<string>
}

const SCHOOL_BY_HOST: ReadonlyArray<readonly [string, string]> = [
  ["planning.univ-rennes.fr", "univrennes1"],
  ["ade.univ-tours.fr", "univtours"],
  ["emploidutemps.univ-reunion.fr", "univreunion"],
  ["proseconsult.umontpellier.fr", "umontpellier"],
  ["plannings.ube.fr", "univbourgogne"],
  ["univ-lyon2.fr", "univlyon2"],
  ["planning.univ-st-etienne.fr", "univstetienne"],
  ["planning.u-bordeaux.fr", "bordeauxinp"],
  ["edt.univ-tlse3.fr", "univtoulouse3"],
]

const EXPORT_HELP_BY_SCHOOL: Readonly<
  Partial<Record<string, CalendarImportHelpKey>>
> = {
  univrennes1: "rennes_export",
  univtours: "tours_export",
  univreunion: "reunion_export",
  umontpellier: "montpellier_export",
  univbourgogne: "ube_export",
  univlyon2: "lyon2_export",
}

const OUTAGE_HELP_BY_SCHOOL: Readonly<
  Partial<Record<string, CalendarImportHelpKey>>
> = {
  univstetienne: "saint_etienne_outage",
  bordeauxinp: "bordeaux_inp_outage",
  univtoulouse3: "toulouse3_outage",
}

const parseSourceShape = (sourceUrl: string): SourceShape | null => {
  try {
    const parsed = new URL(sourceUrl)
    return {
      hostname: parsed.hostname.toLowerCase(),
      pathname: parsed.pathname.toLowerCase(),
      queryKeys: new Set(
        Array.from(parsed.searchParams.keys(), (key) => key.toLowerCase()),
      ),
    }
  } catch {
    return null
  }
}

const schoolFromShape = (shape: SourceShape | null): string | null => {
  if (!shape) return null
  return (
    SCHOOL_BY_HOST.find(
      ([hostname]) =>
        shape.hostname === hostname || shape.hostname.endsWith(`.${hostname}`),
    )?.[1] ?? null
  )
}

const isSupportedExport = (shape: SourceShape): boolean =>
  shape.pathname.endsWith(".ics") ||
  shape.pathname.includes("anonymous_cal.jsp") ||
  shape.pathname.includes("direct_cal.jsp") ||
  shape.pathname.includes("/ical") ||
  (shape.pathname.endsWith(".jsp") && shape.queryKeys.has("caltype"))

const hasUnsupportedShape = (
  schoolCode: string | null,
  shape: SourceShape,
): boolean => {
  if (isSupportedExport(shape)) return false

  switch (schoolCode) {
    case "univrennes1":
      return shape.pathname.startsWith("/direct/")
    case "univtours":
    case "univreunion":
    case "umontpellier":
    case "univbourgogne":
      return true
    case "univlyon2":
      return (
        shape.pathname.includes("/data") ||
        shape.pathname.includes("/direct") ||
        shape.pathname.includes("/portal") ||
        shape.queryKeys.has("data")
      )
    default:
      return false
  }
}

const recovery = (
  classification: CalendarImportClassification,
  helpKey: CalendarImportHelpKey,
): CalendarImportRecovery => ({
  classification,
  helpKey,
  retryable: classification === "upstream_unavailable",
})

export const classifyCalendarImport = ({
  sourceUrl,
  schoolCode,
  outcome,
}: ClassifyCalendarImportInput): CalendarImportDiagnostic | null => {
  const shape = parseSourceShape(sourceUrl)
  const normalizedSchool = schoolCode?.toLowerCase() ?? schoolFromShape(shape)

  if (
    outcome === undefined &&
    shape &&
    hasUnsupportedShape(normalizedSchool, shape)
  ) {
    const classified = recovery(
      "unsupported_link",
      EXPORT_HELP_BY_SCHOOL[normalizedSchool ?? ""] ??
        "generic_invalid_calendar",
    )
    return {
      ...classified,
      schoolCode: normalizedSchool,
      errorKind: "unsupported_shape",
    }
  }

  if (outcome === undefined) return null

  let classified: CalendarImportRecovery
  switch (outcome) {
    case "authentication_required":
    case "html_response":
      classified = recovery(
        "unsupported_link",
        EXPORT_HELP_BY_SCHOOL[normalizedSchool ?? ""] ??
          "generic_invalid_calendar",
      )
      break
    case "timeout":
    case "dns":
    case "tls":
    case "http_5xx":
      classified = recovery(
        "upstream_unavailable",
        OUTAGE_HELP_BY_SCHOOL[normalizedSchool ?? ""] ??
          "generic_upstream_unavailable",
      )
      break
    case "empty_body":
      if (normalizedSchool === "univstetienne") {
        classified = recovery("upstream_unavailable", "saint_etienne_outage")
      } else if (normalizedSchool === "univtours") {
        classified = recovery("unsupported_link", "tours_export")
      } else {
        classified = recovery("invalid_calendar", "generic_invalid_calendar")
      }
      break
    case "empty_calendar":
      classified =
        normalizedSchool === "univtours"
          ? recovery("unsupported_link", "tours_export")
          : recovery("unknown", "generic_unknown")
      break
    case "invalid_content":
      classified = recovery("invalid_calendar", "generic_invalid_calendar")
      break
    case "unknown":
      classified = recovery("unknown", "generic_unknown")
      break
  }

  return {
    ...classified,
    schoolCode: normalizedSchool,
    errorKind: outcome,
  }
}

export const isCalendarFetchOutcomeKind = (
  value: unknown,
): value is CalendarFetchOutcomeKind =>
  typeof value === "string" &&
  calendarFetchOutcomeKinds.some((candidate) => candidate === value)
