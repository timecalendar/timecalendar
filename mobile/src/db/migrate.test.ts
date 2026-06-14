import { recordError } from "@react-native-firebase/crashlytics"
import { migrate } from "drizzle-orm/expo-sqlite/migrator"

import { runMigrations } from "./migrate"
import migrations from "./migrations/migrations"

// expo-sqlite / drizzle are mocked suite-wide (jest/setup-db.ts), firebase's
// native modules by jest/setup-firebase.ts — so this proves the runner wiring
// (handle → drizzle → migrator, failure → @/firebase) in CI. The real
// application is on-device (the Maestro e2e launches the app at startup).
const mockMigrate = migrate as jest.MockedFunction<typeof migrate>
const mockRecordError = recordError as jest.Mock

describe("runMigrations", () => {
  beforeEach(() => {
    mockMigrate.mockReset().mockResolvedValue(undefined)
    mockRecordError.mockClear()
  })

  it("drives migrate() with the committed bundle", async () => {
    await runMigrations()
    expect(mockMigrate).toHaveBeenCalledTimes(1)
    expect(mockMigrate).toHaveBeenCalledWith(expect.anything(), migrations)
  })

  it("records a migration failure through the @/firebase seam", async () => {
    const failure = new Error("migration boom")
    mockMigrate.mockRejectedValueOnce(failure)
    await runMigrations()
    expect(mockRecordError).toHaveBeenCalledWith(expect.anything(), failure)
  })

  it("wraps a non-Error rejection before recording it", async () => {
    mockMigrate.mockRejectedValueOnce("string failure")
    await runMigrations()
    expect(mockRecordError).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: "string failure" }),
    )
  })
})
