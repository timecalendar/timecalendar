import { readFileSync } from "node:fs"
import { join } from "node:path"

const activitySource = ["coordinator.ts", "lifecycle.ts", "repository.ts"]
  .map((file) => readFileSync(join(__dirname, file), "utf8"))
  .join("\n")

describe("Activity mobile telemetry privacy inventory", () => {
  it("uses only the Crashlytics unknown-error seam", () => {
    expect(activitySource).toContain(
      'import { recordUnknownError } from "@/firebase"',
    )
    expect(activitySource).not.toMatch(
      /\b(?:logEvent|logMessage|recordError|setCrashlyticsAttributes)\b/,
    )
  })

  it("keeps every Activity Crashlytics context static and bounded", () => {
    const contexts = [
      "activity/refresh",
      "activity/older-page",
      "activity/decode",
      "activity/prune",
      "activity/pagination-reopen",
    ]

    for (const context of contexts) expect(activitySource).toContain(context)
    const literalContexts = Array.from(
      activitySource.matchAll(/["'](activity\/[a-z-]+)["']/g),
      (match) => match[1],
    )
    expect(new Set(literalContexts)).toEqual(new Set(contexts))
  })

  it("contains no Activity analytics event call site", () => {
    expect(activitySource).not.toMatch(/\blogEvent\s*\(/)
  })
})
