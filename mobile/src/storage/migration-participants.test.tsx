import { act, renderHook } from "@testing-library/react-native"

import { setChangelogSeenVersion } from "@/features/changelog/store/seen-version"
import { hideByName } from "@/features/hidden-events/data/store"
import { createLegacyImporter } from "@/features/legacy-migration/data/engine"
import { setIsActive, useIsActive } from "@/features/notifications/data/prefs"
import { isOnboardingComplete } from "@/features/school-selection/store/store"
import {
  useShowWeekendsPreference,
  useThemePreference,
} from "@/features/settings/prefs/hooks"
import {
  byteChunks,
  encodeLines,
  FIXTURE_TIME,
  fixtureLines,
  fixtureSource,
} from "@/test-support/legacy-fixtures"
import { openMigrationTestDatabase } from "@/test-support/migration-sqlite"

import {
  clearBackendBoundStorage,
  getBoolean,
  getString,
  remove,
  setBoolean,
  setString,
  STORAGE_KEYS,
} from "./index"
import { getStartupTab, migrationNativeStore } from "./migration-participants"

beforeEach(() => {
  for (const key of Object.values(STORAGE_KEYS)) remove(key)
})

it("accepts real settings hooks, hidden edits and changelog advancement at the next terminal launch", async () => {
  const fixture = openMigrationTestDatabase()
  const importer = createLegacyImporter({
    repository: fixture.repository,
    native: migrationNativeStore,
    eligible: () => true,
    discover: async () => fixtureSource(),
    read: () => byteChunks(encodeLines(fixtureLines())),
    now: () => new Date(FIXTURE_TIME),
    newId: () => "10000000-0000-4000-8000-000000000001",
    release: {
      platform: "ios",
      targetAppVersion: "4.0.0",
      targetBuild: "200",
      osMajorVersion: 26,
    },
  })
  try {
    await importer()
    const theme = await renderHook(useThemePreference)
    const weekends = await renderHook(useShowWeekendsPreference)
    const notifications = await renderHook(useIsActive)
    await act(async () => {
      theme.result.current.setPreference("light")
      weekends.result.current.setShowWeekends(true)
      setIsActive(true)
      hideByName("synthetic newly hidden name")
      setChangelogSeenVersion(4)
    })
    expect(theme.result.current.preference).toBe("light")
    expect(weekends.result.current.showWeekends).toBe(true)
    expect(notifications.result.current).toBe(true)
    await importer()
    expect(fixture.repository.pending("2099-01-01T00:00:00.000Z")).toHaveLength(
      1,
    )
    await theme.unmount()
    await weekends.unmount()
    await notifications.unmount()
  } finally {
    fixture.database.close()
  }
})

it("classifies startup intent and onboarding suppression during environment reset", () => {
  expect(getStartupTab()).toBe("home")
  setString(STORAGE_KEYS.startupTab, "invalid")
  expect(getStartupTab()).toBe("home")
  setString(STORAGE_KEYS.startupTab, "calendar")
  setBoolean(STORAGE_KEYS.showWeekends, false)
  setBoolean(STORAGE_KEYS.migrationSuppressed, true)
  expect(isOnboardingComplete()).toBe(true)
  expect(getString(STORAGE_KEYS.schoolId)).toBeUndefined()
  clearBackendBoundStorage()
  expect(getStartupTab()).toBe("calendar")
  expect(getBoolean(STORAGE_KEYS.showWeekends)).toBe(false)
  expect(isOnboardingComplete()).toBe(false)
})
