import {
  applicationId,
  nativeApplicationVersion,
  nativeBuildVersion,
} from "expo-application"
import { Platform } from "react-native"

import { migrationReportControllerAccept } from "@/api/generated/migration-reports/migration-reports"
import type { MigrationReport } from "@/api/generated/timeCalendar.schemas"
import { ApiError } from "@/api/mutator"
import { legacyMigrationRepository, newId } from "@/db"
import { getEffectiveBackendEnvironment } from "@/features/environment/data/store"
import { migrationNativeStore } from "@/storage/migration-participants"

import { createLegacyImporter } from "./engine"
import { getLegacyMigrationSource, readLegacyBytes } from "./native-source"
import { createReportDelivery } from "./outbox"

export function isLegacyMigrationEligible(): boolean {
  return (
    (Platform.OS === "ios" || Platform.OS === "android") &&
    applicationId === "fr.samuelprak.timecalendar" &&
    getEffectiveBackendEnvironment() === "production"
  )
}

export const runLegacyMigration = createLegacyImporter({
  repository: legacyMigrationRepository,
  native: migrationNativeStore,
  eligible: isLegacyMigrationEligible,
  discover: getLegacyMigrationSource,
  read: readLegacyBytes,
  now: () => new Date(),
  newId,
  release: {
    platform: Platform.OS === "ios" ? "ios" : "android",
    targetAppVersion: nativeApplicationVersion ?? "0.0.0",
    targetBuild: nativeBuildVersion ?? "0",
    osMajorVersion: Number.parseInt(String(Platform.Version), 10),
  },
})

export const deliverMigrationReports = createReportDelivery({
  repository: legacyMigrationRepository,
  eligible: isLegacyMigrationEligible,
  now: () => new Date(),
  async send(payload) {
    try {
      await migrationReportControllerAccept(
        JSON.parse(payload) as MigrationReport,
      )
      return 200
    } catch (error) {
      if (error instanceof ApiError) return error.status
      throw error
    }
  },
})
