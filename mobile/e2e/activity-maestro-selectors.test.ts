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

const paginationSelectorIds = new Set([
  "activity-new-e2e-activity-tie-higher",
  "activity-new-e2e-activity-tie-lower",
  "activity-new-e2e-activity-older-anchor",
])

const paginationScrolls = [
  ...flow.matchAll(
    /- scrollUntilVisible:\n\s+element:\n\s+id: "([^"]+)"\n\s+direction: DOWN\n\s+timeout: (\d+)/g,
  ),
]
  .flatMap((match) => {
    const id = match[1]
    const timeout = match[2]

    return id === undefined || timeout === undefined
      ? []
      : [{ id, timeout: Number(timeout) }]
  })
  .filter(({ id }) => paginationSelectorIds.has(id))

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

  it("gives only the row-50 pagination traversal the measured wider bound", () => {
    expect(paginationScrolls).toEqual([
      {
        id: "activity-new-e2e-activity-tie-higher",
        timeout: 120000,
      },
      {
        id: "activity-new-e2e-activity-tie-lower",
        timeout: 60000,
      },
      {
        id: "activity-new-e2e-activity-older-anchor",
        timeout: 60000,
      },
    ])
  })
})
