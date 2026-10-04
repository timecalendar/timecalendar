import { requireNativeModule } from "expo-modules-core"

export type LegacyPreferenceKey =
  | "current_version"
  | "theme"
  | "dark_mode"
  | "notification_calendar"
  | "startup_screen"
  | "show_weekends"

export type LegacyPreferenceRead =
  | { state: "absent" }
  | { state: "value"; value: boolean | number | string }
  | { state: "invalid_type" }
  | { state: "read_failed" }

export type LegacyMigrationSource = {
  database: null | {
    uri: string
    sizeBytes: number
    modifiedAtMs: number | null
  }
  preferences: Record<LegacyPreferenceKey, LegacyPreferenceRead>
  platformEvidence: {
    preferenceBackend: "ios-user-defaults" | "android-shared-preferences"
  }
}

export function getLegacyMigrationSource(): Promise<LegacyMigrationSource> {
  return requireNativeModule<{
    getLegacyMigrationSource(): Promise<LegacyMigrationSource>
  }>("LegacyMigrationSource").getLegacyMigrationSource()
}
