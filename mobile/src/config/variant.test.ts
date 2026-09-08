import Constants from "expo-constants"

import { isDevVariant } from "./variant"

jest.mock("expo-constants", () => ({ expoConfig: undefined }))

const mockConstants = Constants as unknown as {
  expoConfig?: { extra?: Record<string, unknown> }
}

describe("runtime app variant", () => {
  afterEach(() => {
    delete mockConstants.expoConfig
  })

  it.each([
    ["absent manifest", undefined],
    ["absent extra", {}],
    ["absent identity", { extra: {} }],
    ["malformed identity", { extra: { appVariant: true } }],
    ["unknown identity", { extra: { appVariant: "preview" } }],
    ["production identity", { extra: { appVariant: "production" } }],
  ])("rejects the development seed for %s", (_label, expoConfig) => {
    if (expoConfig === undefined) {
      delete mockConstants.expoConfig
    } else {
      mockConstants.expoConfig = expoConfig
    }
    expect(isDevVariant()).toBe(false)
  })

  it("accepts only the build-time development identity", () => {
    mockConstants.expoConfig = { extra: { appVariant: "development" } }
    expect(isDevVariant()).toBe(true)
  })
})
