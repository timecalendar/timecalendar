import { reloadAppAsync } from "expo"
import * as Updates from "expo-updates"

import { logEvent } from "@/firebase"

import type { BackendSwitchDependencies } from "./orchestrator"
import {
  isBackendEnvironmentSwitching,
  recoverBackendEnvironmentSwitch,
  switchBackendEnvironment,
} from "./switch"

let mockDependencies: BackendSwitchDependencies
const mockSwitchTo = jest.fn()
const mockRecover = jest.fn()
const mockIsSwitching = jest.fn()

jest.mock("expo", () => ({ reloadAppAsync: jest.fn() }))
jest.mock("expo-updates", () => ({
  isEnabled: false,
  reloadAsync: jest.fn(),
}))
jest.mock("@/api/query-client", () => ({
  clearQueryRuntime: jest.fn(),
  quiesceQueryRuntime: jest.fn(),
}))
jest.mock("@/config/backend-runtime", () => ({
  setBackendRuntimeReady: jest.fn(),
}))
jest.mock("@/db", () => ({ resetBackendDatabase: jest.fn() }))
jest.mock("@/firebase", () => ({ logEvent: jest.fn() }))
jest.mock("@/storage", () => ({
  clearBackendBoundStorage: jest.fn(),
  clearBackendResetJournal: jest.fn(),
  writeBackendResetJournal: jest.fn(),
}))
jest.mock("./participants", () => ({
  resetCalendarRuntimeState: jest.fn(),
  resetNotificationRuntimeState: jest.fn(),
}))
jest.mock("./runtime", () => ({
  getBackendEnvironmentCapability: jest.fn(),
}))
jest.mock("./session-reset", () => ({ resetSessions: jest.fn() }))
jest.mock("./store", () => ({
  commitSelectedBackendEnvironment: jest.fn(),
  getEffectiveBackendEnvironment: jest.fn(),
}))
jest.mock("./orchestrator", () => ({
  createBackendEnvironmentSwitcher: jest.fn(
    (dependencies: BackendSwitchDependencies) => {
      mockDependencies = dependencies
      return {
        switchTo: (...args: Parameters<typeof mockSwitchTo>) =>
          mockSwitchTo(...args),
        recover: (...args: Parameters<typeof mockRecover>) =>
          mockRecover(...args),
        isSwitching: () => mockIsSwitching(),
      }
    },
  ),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(Updates as { isEnabled: boolean }).isEnabled = false
})

it("delegates switching, recovery, and switching-state reads", () => {
  const journal = {
    version: 1 as const,
    current: "preprod" as const,
    target: "production" as const,
  }

  switchBackendEnvironment("production")
  recoverBackendEnvironmentSwitch(journal)
  isBackendEnvironmentSwitching()

  expect(mockSwitchTo).toHaveBeenCalledWith("production")
  expect(mockRecover).toHaveBeenCalledWith(journal)
  expect(mockIsSwitching).toHaveBeenCalledTimes(1)
})

it("records enum-only success telemetry and tolerates analytics failure", async () => {
  const mockLogEvent = jest.mocked(logEvent)
  mockLogEvent.mockResolvedValueOnce(undefined)
  await mockDependencies.recordSuccess("preprod", "production")
  expect(mockLogEvent).toHaveBeenCalledWith("backend_environment_switched", {
    from_environment: "preprod",
    to_environment: "production",
  })

  mockLogEvent.mockRejectedValueOnce(new Error("analytics unavailable"))
  await expect(
    mockDependencies.recordSuccess("production", "preprod"),
  ).resolves.toBeUndefined()
})

it("uses the native reload path for updates and the development fallback", async () => {
  await mockDependencies.reload()
  expect(reloadAppAsync).toHaveBeenCalledWith("environment-switch")
  ;(Updates as { isEnabled: boolean }).isEnabled = true
  await mockDependencies.reload()
  expect(Updates.reloadAsync).toHaveBeenCalledTimes(1)
})
