import { act, cleanup, render } from "@testing-library/react-native"
import type { UseUpdatesReturnType } from "expo-updates"
import React from "react"
import type { AppStateStatus, NativeEventSubscription } from "react-native"

const mockReloadAsync = jest.fn(() => Promise.resolve())
const mockRecordUnknownError = jest.fn()
const mockSetCrashlyticsAttributes = jest.fn(() => Promise.resolve())
type MockUpdateState = Pick<
  UseUpdatesReturnType,
  "currentlyRunning" | "isUpdatePending"
>

function createMockUpdateState(): MockUpdateState {
  return {
    currentlyRunning: {
      updateId: "update-id",
      channel: "production",
      runtimeVersion: "runtime-version",
      createdAt: new Date("2026-08-25T12:00:00.000Z"),
      isEmbeddedLaunch: false,
      isEmergencyLaunch: false,
      emergencyLaunchReason: null,
    },
    isUpdatePending: false,
  }
}

let mockUpdateState = createMockUpdateState()

jest.mock("expo-updates", () => ({
  reloadAsync: mockReloadAsync,
  useUpdates: jest.fn(() => mockUpdateState),
}))

jest.mock("@/firebase", () => ({
  recordUnknownError: mockRecordUnknownError,
  setCrashlyticsAttributes: mockSetCrashlyticsAttributes,
}))

type AppStateListener = (state: AppStateStatus) => void

const listeners = new Set<AppStateListener>()
const removeListener = jest.fn()
const mockAddAppStateListener = jest.fn(
  (_: string, listener: AppStateListener) => {
    listeners.add(listener)
    return {
      remove: () => {
        listeners.delete(listener)
        removeListener()
      },
    } as NativeEventSubscription
  },
)

function loadRuntime() {
  jest.resetModules()
  jest.doMock("react", () => React)
  jest.doMock("react-native", () => ({
    AppState: {
      addEventListener: mockAddAppStateListener,
    },
  }))
  return jest.requireActual<typeof import("./ota-update-runtime")>(
    "./ota-update-runtime",
  ).OtaUpdateRuntime
}

async function emitAppState(state: AppStateStatus) {
  await act(async () => {
    for (const listener of listeners) {
      listener(state)
    }
  })
}

describe("OtaUpdateRuntime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    listeners.clear()
    mockUpdateState = createMockUpdateState()
  })

  afterEach(async () => {
    await cleanup()
  })

  it("installs downloaded OTA identity and renders no UI", async () => {
    const OtaUpdateRuntime = await loadRuntime()

    const view = await render(<OtaUpdateRuntime />)

    expect(view.toJSON()).toBeNull()
    expect(mockSetCrashlyticsAttributes).toHaveBeenCalledWith({
      otaUpdateId: "update-id",
      otaChannel: "production",
      otaRuntimeVersion: "runtime-version",
      otaCreatedAt: "2026-08-25T12:00:00.000Z",
      otaIsEmbedded: "false",
    })
  })

  it("uses deterministic embedded and development attribute fallbacks", async () => {
    mockUpdateState = {
      currentlyRunning: {
        isEmbeddedLaunch: true,
        isEmergencyLaunch: false,
        emergencyLaunchReason: null,
      },
      isUpdatePending: false,
    }
    const OtaUpdateRuntime = await loadRuntime()

    await render(<OtaUpdateRuntime />)

    expect(mockSetCrashlyticsAttributes).toHaveBeenCalledWith({
      otaUpdateId: "embedded",
      otaChannel: "",
      otaRuntimeVersion: "",
      otaCreatedAt: "",
      otaIsEmbedded: "true",
    })
  })

  it("does not reload while a pending update stays foregrounded", async () => {
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    const OtaUpdateRuntime = await loadRuntime()

    await render(<OtaUpdateRuntime />)
    await emitAppState("active")

    expect(mockReloadAsync).not.toHaveBeenCalled()
  })

  it("reloads once after background through inactive to active", async () => {
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    const OtaUpdateRuntime = await loadRuntime()

    await render(<OtaUpdateRuntime />)
    await emitAppState("background")
    await emitAppState("inactive")
    await emitAppState("active")
    await emitAppState("active")

    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })

  it("consumes a no-pending boundary and observes pending changes without listener churn", async () => {
    const OtaUpdateRuntime = await loadRuntime()
    const view = await render(<OtaUpdateRuntime />)

    await emitAppState("background")
    await emitAppState("active")
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    await view.rerender(<OtaUpdateRuntime />)
    await emitAppState("active")

    expect(mockReloadAsync).not.toHaveBeenCalled()
    expect(mockAddAppStateListener).toHaveBeenCalledTimes(1)

    await emitAppState("background")
    await emitAppState("active")
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })

  it("does not treat inactive alone as a foreground boundary", async () => {
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    const OtaUpdateRuntime = await loadRuntime()

    await render(<OtaUpdateRuntime />)
    await emitAppState("inactive")
    await emitAppState("active")

    expect(mockReloadAsync).not.toHaveBeenCalled()
  })

  it("guards side effects across remounts and cleans up each listener", async () => {
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    const OtaUpdateRuntime = await loadRuntime()
    const first = await render(<OtaUpdateRuntime />)

    await emitAppState("background")
    await emitAppState("active")
    await first.unmount()
    const second = await render(<OtaUpdateRuntime />)
    await emitAppState("background")
    await emitAppState("active")
    await second.unmount()

    expect(mockSetCrashlyticsAttributes).toHaveBeenCalledTimes(1)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(2)
    expect(listeners.size).toBe(0)
  })

  it("records rejected attribute installation once without retrying", async () => {
    const error = new Error("attributes failed")
    mockSetCrashlyticsAttributes.mockRejectedValueOnce(error)
    const OtaUpdateRuntime = await loadRuntime()

    const first = await render(<OtaUpdateRuntime />)
    await act(async () => Promise.resolve())
    await first.unmount()
    await render(<OtaUpdateRuntime />)

    expect(mockRecordUnknownError).toHaveBeenCalledWith(error, "ota/attributes")
    expect(mockSetCrashlyticsAttributes).toHaveBeenCalledTimes(1)
  })

  it("records a rejected reload once and never retries it", async () => {
    const error = new Error("reload failed")
    mockReloadAsync.mockRejectedValueOnce(error)
    mockUpdateState = { ...mockUpdateState, isUpdatePending: true }
    const OtaUpdateRuntime = await loadRuntime()

    await render(<OtaUpdateRuntime />)
    await emitAppState("background")
    await emitAppState("active")
    await act(async () => Promise.resolve())
    await emitAppState("background")
    await emitAppState("active")

    expect(mockRecordUnknownError).toHaveBeenCalledWith(error, "ota/reload")
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })
})
