/// <reference types="node" />
import { readFileSync } from "node:fs"
import { join } from "node:path"

const mobileRoot = join(__dirname, "..")
const repositoryRoot = join(mobileRoot, "..")
const flowPath = join(mobileRoot, ".maestro", "activity.yaml")
const sourceRoot = join(mobileRoot, "src")
const flow = readFileSync(flowPath, "utf8")
const activitySeed = readFileSync(
  join(repositoryRoot, "server", "src", "scripts", "seed-e2e-activity.ts"),
  "utf8",
)
const activityRequest = readFileSync(
  join(sourceRoot, "features", "activity", "data", "request.ts"),
  "utf8",
)
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
    /- scrollUntilVisible:\n\s+element:\n\s+id: "([^"]+)"\n\s+direction: DOWN\n\s+speed: (\d+)\n\s+timeout: (\d+)/g,
  ),
]
  .flatMap((match) => {
    const id = match[1]
    const speed = match[2]
    const timeout = match[3]

    return id === undefined || speed === undefined || timeout === undefined
      ? []
      : [{ id, speed: Number(speed), timeout: Number(timeout) }]
  })
  .filter(({ id }) => paginationSelectorIds.has(id))

const boundaryOrderAssertions = [
  ...flow.matchAll(
    /- assertVisible:\n\s+id: "([^"]+)"\n\s+above:\n\s+id: "([^"]+)"/g,
  ),
].flatMap((match) => {
  const upper = match[1]
  const lower = match[2]

  return upper === undefined || lower === undefined ? [] : [{ upper, lower }]
})

function requiredNumber(source: string, pattern: RegExp): number {
  const match = pattern.exec(source)
  expect(match?.[1]).toBeDefined()
  return Number(match?.[1])
}

function requiredString(source: string, pattern: RegExp): string {
  const match = pattern.exec(source)
  expect(match?.[1]).toBeDefined()
  return match?.[1] ?? ""
}

function seededMinute(idConstant: string): number {
  return requiredNumber(
    activitySeed,
    new RegExp(
      `id: ${idConstant},[\\s\\S]*?createdAt: atUtcDay\\(1, (\\d+)\\),`,
    ),
  )
}

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

  it("derives the cross-page tie boundary from the seed and client limit", () => {
    const fillerCount = requiredNumber(
      activitySeed,
      /\.\.\.Array\.from\(\{ length: (\d+) \}/,
    )
    const pageLimit = requiredNumber(
      activityRequest,
      /export const ACTIVITY_PAGE_LIMIT = (\d+)/,
    )
    const tieHigherId = requiredString(
      activitySeed,
      /export const E2E_ACTIVITY_TIE_HIGHER_ID = "([^"]+)"/,
    )
    const tieLowerId = requiredString(
      activitySeed,
      /export const E2E_ACTIVITY_TIE_LOWER_ID = "([^"]+)"/,
    )

    expect(3 + fillerCount + 1).toBe(pageLimit)
    expect(tieHigherId.localeCompare(tieLowerId)).toBeGreaterThan(0)
    expect(seededMinute("E2E_ACTIVITY_TIE_HIGHER_ID")).toBe(
      seededMinute("E2E_ACTIVITY_TIE_LOWER_ID"),
    )
  })

  it("keeps every page-boundary traversal fast and standard-bounded", () => {
    expect(paginationScrolls).toEqual([
      {
        id: "activity-new-e2e-activity-tie-higher",
        speed: 90,
        timeout: 60000,
      },
      {
        id: "activity-new-e2e-activity-tie-lower",
        speed: 90,
        timeout: 60000,
      },
      {
        id: "activity-new-e2e-activity-older-anchor",
        speed: 90,
        timeout: 60000,
      },
    ])
  })

  it("pins the boundary rows in descending timestamp and id order", () => {
    expect(boundaryOrderAssertions).toEqual([
      {
        upper: "activity-new-e2e-activity-tie-higher",
        lower: "activity-new-e2e-activity-tie-lower",
      },
      {
        upper: "activity-new-e2e-activity-tie-lower",
        lower: "activity-new-e2e-activity-older-anchor",
      },
    ])
  })
})
