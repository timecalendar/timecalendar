import {
  CalendarSourceHealth,
  CalendarSourceHealthReason,
  CalendarSourceHealthStatus,
  CalendarSourceRecoveryAction,
  CalendarSourceRecoveryGuide,
} from "modules/calendar/models/source-health.model"

const EXPORT_WINDOW_GRACE_MS = 14 * 24 * 60 * 60 * 1000
const AMU_SCHOOL_CODE = "univamu"
const AMU_RETIRED_HOST = "ade-web-consult.univ-amu.fr"
const AMU_CURRENT_HOST = "agenda-web-consult.univ-amu.fr"

const UNKNOWN: CalendarSourceHealth = {
  status: CalendarSourceHealthStatus.Unknown,
  reason: null,
  recoveryAction: null,
  guide: null,
}

type ClassifyCalendarSourceHealthParams = {
  sourceUrl: string
  schoolCode?: string | null
  latestSuccessfulChangeAt?: Date | null
  now: Date
}

function parseDateOnly(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date
}

function isRetiredAmuWindow(firstDate: Date | null, lastDate: Date | null) {
  if (!firstDate || !lastDate) return false
  return (
    firstDate >= new Date("2025-07-01T00:00:00.000Z") &&
    firstDate < new Date("2026-01-01T00:00:00.000Z") &&
    lastDate >= new Date("2026-01-01T00:00:00.000Z") &&
    lastDate < new Date("2026-09-01T00:00:00.000Z")
  )
}

export function classifyCalendarSourceHealth({
  sourceUrl,
  schoolCode,
  latestSuccessfulChangeAt,
  now,
}: ClassifyCalendarSourceHealthParams): CalendarSourceHealth {
  let source: URL
  try {
    source = new URL(sourceUrl)
  } catch {
    return UNKNOWN
  }

  const firstDate = parseDateOnly(source.searchParams.get("firstDate"))
  const lastDate = parseDateOnly(source.searchParams.get("lastDate"))

  if (
    schoolCode === AMU_SCHOOL_CODE &&
    source.hostname === AMU_RETIRED_HOST &&
    isRetiredAmuWindow(firstDate, lastDate)
  ) {
    return {
      status: CalendarSourceHealthStatus.Stale,
      reason: CalendarSourceHealthReason.KnownSourceTransition,
      recoveryAction: CalendarSourceRecoveryAction.ReAdd,
      guide: CalendarSourceRecoveryGuide.Amu20262027,
    }
  }

  if (lastDate) {
    const staleAfter = new Date(lastDate.getTime() + EXPORT_WINDOW_GRACE_MS)
    if (
      now > staleAfter &&
      (!latestSuccessfulChangeAt || latestSuccessfulChangeAt <= staleAfter)
    ) {
      return {
        status: CalendarSourceHealthStatus.Stale,
        reason: CalendarSourceHealthReason.ExpiredExportWindow,
        recoveryAction: CalendarSourceRecoveryAction.ReAdd,
        guide: null,
      }
    }
  }

  if (schoolCode === AMU_SCHOOL_CODE && source.hostname === AMU_CURRENT_HOST) {
    return {
      status: CalendarSourceHealthStatus.Healthy,
      reason: null,
      recoveryAction: null,
      guide: null,
    }
  }

  return UNKNOWN
}
