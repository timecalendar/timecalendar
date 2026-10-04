/** @jest-environment node */
import type { SQLInputValue } from "node:sqlite"

import { getString, remove, STORAGE_KEYS } from "@/storage"
import { migrationNativeStore } from "@/storage/migration-participants"
import {
  byteChunks,
  encodeLines,
  FIXTURE_HIDDEN,
  FIXTURE_ID,
  FIXTURE_TIME,
  fixtureLines,
  fixtureSource,
} from "@/test-support/legacy-fixtures"
import { openMigrationTestDatabase } from "@/test-support/migration-sqlite"

import { createLegacyImporter } from "./engine"

let mockDrizzle: unknown
jest.mock("@/db", () => ({
  ...jest.requireActual<object>("@/db/schema"),
  ...jest.requireActual<object>("@/db/mappers"),
  get db() {
    return mockDrizzle
  },
}))

it("preserves imported checklists, personal data and hidden filters through repeated real SQLite calendar replacement", async () => {
  for (const key of Object.values(STORAGE_KEYS)) remove(key)
  const fixture = openMigrationTestDatabase()
  const { drizzle } = jest.requireActual<
    typeof import("drizzle-orm/expo-sqlite")
  >("drizzle-orm/expo-sqlite")
  mockDrizzle = drizzle({
    prepareSync(sql: string) {
      const statement = fixture.database.prepare(sql)
      return {
        executeSync(params: SQLInputValue[]) {
          const result = statement.run(...params)
          return {
            changes: result.changes,
            lastInsertRowId: result.lastInsertRowid,
            getAllSync: () => statement.all(...params),
            getFirstSync: () => statement.get(...params),
          }
        },
        executeForRawResultSync(params: SQLInputValue[]) {
          statement.setReturnArrays(true)
          return { getAllSync: () => statement.all(...params) }
        },
      }
    },
  } as never)
  const { replaceAll } = jest.requireActual<
    typeof import("@/features/calendar/data/sync/repository")
  >("@/features/calendar/data/sync/repository")
  try {
    await createLegacyImporter({
      repository: fixture.repository,
      native: migrationNativeStore,
      eligible: () => true,
      discover: async () => fixtureSource(),
      read: () => byteChunks(encodeLines(fixtureLines())),
      now: () => new Date(FIXTURE_TIME),
      newId: () => "10000000-0000-4000-8000-000000000001",
      release: {
        platform: "android",
        targetAppVersion: "4.0.0",
        targetBuild: "200",
        osMajorVersion: 35,
      },
    })()
    const checklist = fixture.database
      .prepare("SELECT * FROM checklist_items")
      .all()
    const personal = fixture.database
      .prepare("SELECT * FROM personal_events")
      .all()
    const event = {
      uid: "synthetic-school-event",
      title: "synthetic synced class",
      color: "#ABCDEF",
      groupColor: "#ABCDEF",
      startsAt: FIXTURE_TIME,
      endsAt: FIXTURE_TIME,
      exportedAt: FIXTURE_TIME,
      location: null,
      description: null,
      allDay: false,
      teachers: "[]",
      tags: "[]",
      fields: null,
      type: "cm",
      userCalendarId: FIXTURE_ID,
    }
    await replaceAll([event])
    await replaceAll([])
    await replaceAll([{ ...event, title: "refreshed class" }])
    expect(
      fixture.database.prepare("SELECT title FROM calendar_events").get()
        ?.title,
    ).toBe("refreshed class")
    expect(
      fixture.database.prepare("SELECT * FROM checklist_items").all(),
    ).toEqual(checklist)
    expect(
      fixture.database.prepare("SELECT * FROM personal_events").all(),
    ).toEqual(personal)
    expect(JSON.parse(getString(STORAGE_KEYS.hiddenEvents)!)).toEqual(
      FIXTURE_HIDDEN,
    )
  } finally {
    fixture.database.close()
  }
})
