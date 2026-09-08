import { logEvent, recordError, setCrashlyticsAttributes } from "@/firebase"

import {
  attemptBucket,
  emitExportGuideEvent,
  recordExportGuideInvariant,
} from "./telemetry"

jest.mock("@/firebase", () => ({
  logEvent: jest.fn(() => Promise.resolve()),
  recordError: jest.fn(),
  setCrashlyticsAttributes: jest.fn(() => Promise.resolve()),
}))

describe("export-guide telemetry", () => {
  it("adds only app/platform metadata to a closed event payload", () => {
    emitExportGuideEvent({
      name: "export_guide_image_failed",
      params: {
        provider_slug: "generic",
        image_role: "page",
        page_index: 1,
        failure: "load",
      },
    })
    expect(logEvent).toHaveBeenCalledWith("export_guide_image_failed", {
      provider_slug: "generic",
      image_role: "page",
      page_index: 1,
      failure: "load",
      app_version: expect.any(String),
      platform: expect.any(String),
    })
    const serialized = JSON.stringify((logEvent as jest.Mock).mock.calls)
    for (const forbidden of [
      "schoolName",
      "programme",
      "https://",
      "token-value",
      "routeParams",
      "rawError",
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
  })

  it("records only static invariant categories in Crashlytics", () => {
    recordExportGuideInvariant("invalid_page")
    expect(setCrashlyticsAttributes).toHaveBeenCalledWith({
      export_guide_invariant: "invalid_page",
    })
    expect(recordError).toHaveBeenCalledWith(
      new Error("export-guide invariant: invalid_page"),
    )
  })

  it.each([
    [0, "1"],
    [2, "2"],
    [3, "3_plus"],
    [99, "3_plus"],
  ])("bounds attempt %s to %s", (attempt, bucket) => {
    expect(attemptBucket(attempt)).toBe(bucket)
  })
})
