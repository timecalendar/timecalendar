import type { BackendEnvironmentCapability } from "@/config/backend-environment"

import { isDeveloperSurfaceEnabled } from "./developer-access"

let mockCapability: BackendEnvironmentCapability = "production"
jest.mock("@/features/environment", () => ({
  getBackendEnvironmentCapability: () => mockCapability,
}))

describe("isDeveloperSurfaceEnabled", () => {
  it("hides the developer surface on a production build", () => {
    mockCapability = "production"
    expect(isDeveloperSurfaceEnabled()).toBe(false)
  })

  it.each(["development", "preview"] as const)(
    "shows the developer surface on a %s build",
    (capability) => {
      mockCapability = capability
      expect(isDeveloperSurfaceEnabled()).toBe(true)
    },
  )
})
