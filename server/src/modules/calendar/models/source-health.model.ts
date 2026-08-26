export enum CalendarSourceHealthStatus {
  Healthy = "healthy",
  Unknown = "unknown",
  Stale = "stale",
}

export enum CalendarSourceHealthReason {
  ExpiredExportWindow = "expired_export_window",
  KnownSourceTransition = "known_source_transition",
}

export enum CalendarSourceRecoveryAction {
  ReAdd = "re_add",
}

export enum CalendarSourceRecoveryGuide {
  Amu20262027 = "amu_2026_2027",
}

export type CalendarSourceHealth = {
  status: CalendarSourceHealthStatus
  reason: CalendarSourceHealthReason | null
  recoveryAction: CalendarSourceRecoveryAction | null
  guide: CalendarSourceRecoveryGuide | null
}
