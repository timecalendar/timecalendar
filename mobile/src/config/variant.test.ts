// Proves the runtime variant gate (ADR 030) reads
// `Constants.expoConfig.extra.appVariant` and treats ONLY "development" as the dev
// variant. The expo-constants module is mocked so each branch — the e2e dev
// variant, the production variant, and a missing/undefined extra — is asserted
// without a real resolved manifest.
import Constants from "expo-constants"

import { isDevVariant } from "./variant"

jest.mock("expo-constants", () => ({ expoConfig: { extra: {} } }))

const mockConstants = Constants as unknown as {
  expoConfig: { extra: Record<string, unknown> } | null
}

describe("isDevVariant", () => {
  it("is true when the resolved manifest's appVariant is development", () => {
    mockConstants.expoConfig = { extra: { appVariant: "development" } }
    expect(isDevVariant()).toBe(true)
  })

  it("is false when the resolved manifest's appVariant is production", () => {
    mockConstants.expoConfig = { extra: { appVariant: "production" } }
    expect(isDevVariant()).toBe(false)
  })

  it("is false when appVariant is absent (fails closed to non-dev)", () => {
    mockConstants.expoConfig = { extra: {} }
    expect(isDevVariant()).toBe(false)

    mockConstants.expoConfig = null
    expect(isDevVariant()).toBe(false)
  })
})
