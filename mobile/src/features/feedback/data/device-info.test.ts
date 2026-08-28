import Constants from "expo-constants"
import * as Device from "expo-device"

import { formatDeviceInfo, getDeviceInfo } from "./device-info"

jest.mock("expo-device", () => ({
  modelName: "Pixel 9",
  osName: "Android",
  osVersion: "16",
}))

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: "TimeCalendar",
      version: "3.1.0",
      extra: { appVariant: "production" },
    },
    nativeBuildVersion: "42",
  },
}))

it("formats complete device and app metadata", () => {
  expect(getDeviceInfo()).toBe(
    "Pixel 9 (Android 16) · TimeCalendar 3.1.0 (42) · production · environment: production",
  )
  expect(Device.modelName).toBe("Pixel 9")
  expect(Constants.nativeBuildVersion).toBe("42")
})

it("uses deterministic fallbacks and trims a valid variant", () => {
  expect(
    formatDeviceInfo({
      appVariant: " beta ",
      backendEnvironment: "preprod",
    }),
  ).toBe(
    "Unknown device (Unknown OS unknown) · TimeCalendar unknown (unknown) · beta · environment: preprod",
  )
  expect(formatDeviceInfo({ appVariant: 3 })).toContain(
    " · unknown · environment: unknown",
  )
})
