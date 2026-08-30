/// <reference types="node" />
import { readFileSync } from "node:fs"
import { join } from "node:path"

const mobileRoot = join(__dirname, "..")
const flowPath = join(mobileRoot, ".maestro", "activity.yaml")
const sourceRoot = join(mobileRoot, "src")
const flow = readFileSync(flowPath, "utf8")
const activityScreen = readFileSync(
  join(sourceRoot, "features", "activity", "ui", "activity-screen.tsx"),
  "utf8",
)
const settingsScreen = readFileSync(
  join(sourceRoot, "features", "settings", "ui", "settings-screen.tsx"),
  "utf8",
)

describe("Activity Maestro selectors", () => {
  it("uses the one shared flow without iOS-broken back navigation", () => {
    expect(flow).not.toMatch(/^\s*-\s*back\s*$/m)
    expect(flow).not.toContain("platform: Android")
  })

  it("resolves every stable selector family in production source", () => {
    expect(settingsScreen).toContain('testID: "settings-activity"')
    expect(activityScreen).toContain('testID="activity-section-list"')
    expect(activityScreen).toContain(
      "testID={`activity-cancelled-${event.uid}`}",
    )
    expect(activityScreen).toContain(
      "testID={`activity-${item.kind}-${event.uid}`}",
    )
  })

  it("anchors every negative assertion to a positive observation", () => {
    expect(flow).toMatch(
      /visible: "Activity, 52 unread changes"[\s\S]*assertVisible:[\s\S]*id: "settings-activity"[\s\S]*assertNotVisible: "Activity, 52 unread changes"/,
    )
    expect(flow).toMatch(
      /id: "activity-cancelled-e2e-activity-cancelled"[\s\S]*assertVisible:[\s\S]*id: "activity-section-list"[\s\S]*assertNotVisible: "Room Activity Cancelled Details"/,
    )
  })
})
