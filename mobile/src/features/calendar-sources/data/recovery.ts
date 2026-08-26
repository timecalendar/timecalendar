import { ApiError } from "@/api/mutator"

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

export const isCalendarImportClassification = (
  value: unknown,
): value is CalendarImportClassification =>
  isMember(calendarImportClassifications, value)

export const isCalendarImportHelpKey = (
  value: unknown,
): value is CalendarImportHelpKey => isMember(calendarImportHelpKeys, value)

export interface CalendarImportRecovery {
  classification: CalendarImportClassification
  helpKey: CalendarImportHelpKey
  retryable: boolean
}

interface CalendarImportErrorBody extends CalendarImportRecovery {
  code: "calendar_import_failed"
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isMember = <T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] =>
  typeof value === "string" && values.some((candidate) => candidate === value)

export const isCalendarImportErrorBody = (
  value: unknown,
): value is CalendarImportErrorBody => {
  if (!isRecord(value)) return false
  const keys = Object.keys(value).sort()
  if (
    keys.length !== 4 ||
    keys.join(",") !== "classification,code,helpKey,retryable"
  ) {
    return false
  }
  return (
    value.code === "calendar_import_failed" &&
    isCalendarImportClassification(value.classification) &&
    isCalendarImportHelpKey(value.helpKey) &&
    typeof value.retryable === "boolean"
  )
}

const genericRecovery = (retryable: boolean): CalendarImportRecovery => ({
  classification: "unknown",
  helpKey: "generic_unknown",
  retryable,
})

export const mapCalendarImportError = (
  error: unknown,
): CalendarImportRecovery => {
  if (!(error instanceof ApiError)) return genericRecovery(true)
  return isCalendarImportErrorBody(error.body)
    ? {
        classification: error.body.classification,
        helpKey: error.body.helpKey,
        retryable: error.body.retryable,
      }
    : genericRecovery(false)
}

/** A sanitized replacement for the raw request/response/persistence error. */
export class CalendarImportRecoveryError extends Error {
  constructor(readonly recovery: CalendarImportRecovery) {
    super(
      `calendar_import_failed:${recovery.classification}:${recovery.helpKey}`,
    )
    this.name = "CalendarImportRecoveryError"
  }
}
