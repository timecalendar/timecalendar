import { act, renderHook } from "@testing-library/react-native"
import Constants from "expo-constants"

import { PRODUCTION_API_URL } from "@/config/backend-environment"
import { remove, setString, STORAGE_KEYS } from "@/storage"

import {
  commitSelectedBackendEnvironment,
  getEffectiveBackendApiUrl,
  getEffectiveBackendEnvironment,
  useEffectiveBackendEnvironment,
} from "./store"

const originalExtra = Constants.expoConfig?.extra

const setCapability = (value: unknown) => {
  Object.assign(Constants.expoConfig ?? {}, {
    extra: { ...originalExtra, backendEnvironmentCapability: value },
  })
}

beforeEach(() => {
  remove(STORAGE_KEYS.selectedBackendEnvironment)
})

afterAll(() => {
  Object.assign(Constants.expoConfig ?? {}, { extra: originalExtra })
})

it.each([
  ["development", "local"],
  ["preview", "preprod"],
  ["production", "production"],
] as const)("defaults %s to %s", (capability, environment) => {
  setCapability(capability)
  expect(getEffectiveBackendEnvironment()).toBe(environment)
})

it("persists an allowed committed selection and updates reactive readers", async () => {
  setCapability("preview")
  const { result } = await renderHook(useEffectiveBackendEnvironment)
  expect(result.current).toBe("preprod")

  await act(async () => commitSelectedBackendEnvironment("production"))
  expect(result.current).toBe("production")
  expect(getEffectiveBackendEnvironment()).toBe("production")
})

it("keeps stale and malformed selections inert in production", () => {
  setString(STORAGE_KEYS.selectedBackendEnvironment, "preprod")
  setCapability("production")
  expect(getEffectiveBackendEnvironment()).toBe("production")
  expect(getEffectiveBackendApiUrl()).toBe(PRODUCTION_API_URL)

  setString(STORAGE_KEYS.selectedBackendEnvironment, "https://evil.example")
  expect(getEffectiveBackendEnvironment()).toBe("production")
})

it("survives a module restart through MMKV", () => {
  setCapability("preview")
  commitSelectedBackendEnvironment("production")
  // Keep the native storage seam stable while reconstructing the runtime
  // modules, matching a process restart where MMKV outlives JavaScript.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const stableStorage = require("@/storage") as typeof import("@/storage")
  jest.isolateModules(() => {
    jest.doMock("@/storage", () => stableStorage)
    jest.doMock("./runtime", () => ({
      getBackendEnvironmentCapability: () => "preview",
      getCompiledLocalApiUrl: () => undefined,
    }))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const restarted = require("./store") as typeof import("./store")
    expect(restarted.getEffectiveBackendEnvironment()).toBe("production")
  })
  jest.dontMock("@/storage")
  jest.dontMock("./runtime")
})
