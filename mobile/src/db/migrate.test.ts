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

  it("shares one active migration and permits a later idempotent run", async () => {
    let finishMigration: () => void = () => undefined
    mockMigrate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishMigration = resolve
        }),
    )

    const first = runMigrations()
    const second = runMigrations()
    let firstSettled = false
    let secondSettled = false
    void first.then(() => {
      firstSettled = true
    })
    void second.then(() => {
      secondSettled = true
    })

    expect(first).toBe(second)
    expect(mockMigrate).toHaveBeenCalledTimes(1)
    expect(firstSettled).toBe(false)
    expect(secondSettled).toBe(false)

    finishMigration()
    await Promise.all([first, second])

    expect(firstSettled).toBe(true)
    expect(secondSettled).toBe(true)

    await runMigrations()
    expect(mockMigrate).toHaveBeenCalledTimes(2)
  })

  it("records one failure for callers sharing an active migration", async () => {
    const failure = new Error("migration boom")
    let failMigration: (error: Error) => void = () => undefined
    mockMigrate.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          failMigration = reject
        }),
    )

    const first = runMigrations()
    const second = runMigrations()
    failMigration(failure)
    await Promise.all([first, second])

    expect(mockMigrate).toHaveBeenCalledTimes(1)
    expect(mockRecordError).toHaveBeenCalledTimes(1)
    expect(mockRecordError).toHaveBeenCalledWith(expect.anything(), failure)
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
