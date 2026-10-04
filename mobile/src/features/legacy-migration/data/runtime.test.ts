/** @jest-environment node */
import { fixtureSource } from "@/test-support/legacy-fixtures"
import { openMigrationTestDatabase } from "@/test-support/migration-sqlite"

let mockIdentity: string | null = null
let mockEnvironment = "production"
let mockVersion: string | null = "4.0.0"
let mockBuild: string | null = "200"
let mockPlatform = "ios"
let mockDatabase: ReturnType<typeof openMigrationTestDatabase>
const mockAccept = jest.fn()
const mockDiscover = jest.fn()
jest.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mockPlatform
    },
    Version: 26,
  },
}))
jest.mock("expo-application", () => ({
  get applicationId() {
    return mockIdentity
  },
  get nativeApplicationVersion() {
    return mockVersion
  },
  get nativeBuildVersion() {
    return mockBuild
  },
}))
jest.mock("@/db", () => ({
  get legacyMigrationRepository() {
    return mockDatabase.repository
  },
  newId: () => "10000000-0000-4000-8000-000000000001",
}))
jest.mock("./native-source", () => ({
  getLegacyMigrationSource: () => mockDiscover(),
  readLegacyBytes: jest.fn(),
}))
jest.mock("@/api/generated/migration-reports/migration-reports", () => ({
  migrationReportControllerAccept: (payload: unknown) => mockAccept(payload),
}))
jest.mock("@/features/environment/data/store", () => ({
  getEffectiveBackendEnvironment: () => mockEnvironment,
}))

function runtime() {
  let result!: typeof import("./runtime")
  let ApiError!: typeof import("@/api/mutator").ApiError
  jest.isolateModules(() => {
    result = jest.requireActual("./runtime")
    ApiError = jest.requireActual("@/api/mutator").ApiError
  })
  return { ...result, ApiError }
}

beforeEach(() => {
  mockDatabase = openMigrationTestDatabase()
  mockIdentity = "fr.samuelprak.timecalendar"
  mockEnvironment = "production"
  mockVersion = "4.0.0"
  mockBuild = "200"
  mockPlatform = "ios"
  mockAccept.mockReset().mockResolvedValue({ accepted: true })
  mockDiscover.mockReset().mockResolvedValue(fixtureSource(false, false))
})
afterEach(() => {
  mockDatabase.database.close()
  jest.restoreAllMocks()
})

it.each([
  ["fr.samuelprak.timecalendar", "production", true],
  ["fr.samuelprak.timecalendar.dev", "production", false],
  ["fr.samuelprak.timecalendar", "preproduction", false],
  [null, "production", false],
])(
  "gates actual application identity %s and backend %s",
  async (identity, environment, eligible) => {
    mockIdentity = identity as string | null
    mockEnvironment = environment as string
    const app = runtime()
    expect(app.isLegacyMigrationEligible()).toBe(eligible)
    if (!eligible) {
      await expect(app.runLegacyMigration()).resolves.toBeNull()
      expect(mockDiscover).not.toHaveBeenCalled()
    }
  },
)

it("never discovers on unsupported platforms", () => {
  mockPlatform = "web"
  expect(runtime().isLegacyMigrationEligible()).toBe(false)
})

it.each(["ios", "android"] as const)(
  "settles and delivers through the generated client on %s with safe missing release metadata",
  async (platform) => {
    mockPlatform = platform
    mockVersion = null
    mockBuild = null
    const app = runtime()
    await app.runLegacyMigration()
    await app.deliverMigrationReports()
    expect(mockAccept).toHaveBeenCalledWith(
      expect.objectContaining({
        platform,
        targetAppVersion: "0.0.0",
        targetBuild: "0",
        reason: "no_legacy_source",
        outcome: "success",
      }),
    )
    expect(mockDatabase.repository.pending(new Date().toISOString())).toEqual(
      [],
    )
  },
)

it.each(["schema", "offline"])(
  "retains a terminal report when the generated client reports %s failure",
  async (failure) => {
    const app = runtime()
    mockAccept.mockRejectedValue(
      failure === "schema"
        ? new app.ApiError(400, { error: "invalid" })
        : new TypeError("offline"),
    )
    await app.runLegacyMigration()
    await app.deliverMigrationReports()
    expect(mockDatabase.repository.getRun()?.state).toBe("SETTLED_SUCCESS")
    const row = mockDatabase.database
      .prepare("SELECT * FROM legacy_migration_report_outbox")
      .get()!
    expect(row.delivered_at).toBeNull()
    expect(row.attempt_count).toBe(1)
    expect(Date.parse(row.next_attempt_at as string)).toBeGreaterThan(
      Date.now(),
    )
  },
)
