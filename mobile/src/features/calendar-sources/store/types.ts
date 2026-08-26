export const SOURCE_HEALTH_KEY = "calendarSources.health"

export type CalendarSourceHealthStatus = "healthy" | "unknown" | "stale"
export type CalendarSourceHealthReason =
  | "expired_export_window"
  | "known_source_transition"
  | null
export type CalendarSourceRecoveryAction = "re_add" | null
export type CalendarSourceRecoveryGuide = "amu_2026_2027" | null

export interface CalendarSourceHealth {
  status: CalendarSourceHealthStatus
  reason: CalendarSourceHealthReason
  recoveryAction: CalendarSourceRecoveryAction
  guide: CalendarSourceRecoveryGuide
}

export type CalendarSourceHealthSnapshot = Record<string, CalendarSourceHealth>

export function unknownSourceHealth(): CalendarSourceHealth {
  return {
    status: "unknown",
    reason: null,
    recoveryAction: null,
    guide: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function mapSourceHealthDto(value: unknown): CalendarSourceHealth {
  if (!isRecord(value)) return unknownSourceHealth()

  const status = value.status
  if (status !== "healthy" && status !== "unknown" && status !== "stale") {
    return unknownSourceHealth()
  }

  if (status !== "stale") {
    return value.reason === null &&
      value.recoveryAction === null &&
      value.guide === null
      ? { status, reason: null, recoveryAction: null, guide: null }
      : unknownSourceHealth()
  }

  const reason = value.reason
  const recoveryAction = value.recoveryAction
  const guide = value.guide
  if (
    (reason !== "expired_export_window" &&
      reason !== "known_source_transition") ||
    recoveryAction !== "re_add" ||
    (guide !== null && guide !== "amu_2026_2027") ||
    (guide === "amu_2026_2027" && reason !== "known_source_transition")
  ) {
    return unknownSourceHealth()
  }

  return { status, reason, recoveryAction, guide }
}

export function mapSourceHealthSnapshot(
  calendars: readonly unknown[],
): CalendarSourceHealthSnapshot {
  const snapshot: CalendarSourceHealthSnapshot = {}
  for (const value of calendars) {
    if (!isRecord(value) || !isRecord(value.calendar)) continue
    const calendarId = value.calendar.id
    if (typeof calendarId !== "string" || calendarId.length === 0) continue
    snapshot[calendarId] = mapSourceHealthDto(value.sourceHealth)
  }
  return snapshot
}

export function parseSourceHealthSnapshot(
  raw: string | undefined,
): CalendarSourceHealthSnapshot {
  if (raw === undefined) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).map(([calendarId, health]) => [
        calendarId,
        mapSourceHealthDto(health),
      ]),
    )
  } catch {
    return {}
  }
}

export function encodeSourceHealthSnapshot(
  snapshot: CalendarSourceHealthSnapshot,
): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(snapshot).map(([calendarId, health]) => [
        calendarId,
        mapSourceHealthDto(health),
      ]),
    ),
  )
}
